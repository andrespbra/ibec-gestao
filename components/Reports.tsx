
import React, { useState, useMemo } from 'react';
import { TransportRequest, Client, VehicleType, RequestStatus } from '../types';
import { Card, Select, Input, StatusBadge, VehicleBadge, Button, Icons } from './Components';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportsProps {
  requests: TransportRequest[];
  clients: Client[];
  onEditRequest: (request: TransportRequest) => void;
  onDeleteRequest: (id: string) => void;
  onStatusUpdate: (id: string, status: RequestStatus) => void;
  onPaymentUpdate: (id: string, date: string | undefined) => void;
}

// Subcomponente para selecionar Status de forma interativa na tabela
const InteractiveStatusSelect: React.FC<{ status: RequestStatus, onChange: (val: RequestStatus) => void }> = ({ status, onChange }) => {
  const styles = {
    PENDENTE: "bg-orange-50 text-orange-700 border-orange-100",
    EM_ANDAMENTO: "bg-blue-50 text-blue-700 border-blue-100",
    CONCLUIDO: "bg-emerald-50 text-emerald-700 border-emerald-100",
  };

  return (
    <div className="relative inline-block group">
      <select
        value={status}
        onChange={(e) => onChange(e.target.value as RequestStatus)}
        className={`appearance-none cursor-pointer px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border outline-none transition-all shadow-sm ${styles[status]} hover:brightness-95`}
      >
        <option value="PENDENTE">Aguardando</option>
        <option value="EM_ANDAMENTO">Em Rota</option>
        <option value="CONCLUIDO">Finalizado</option>
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover:opacity-100">
        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>
    </div>
  );
};

export const Reports: React.FC<ReportsProps> = ({ requests, clients, onEditRequest, onDeleteRequest, onStatusUpdate, onPaymentUpdate }) => {
  // Initialize with Current Month
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  });

  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'ALL'>('ALL');
  const [vehicleFilter, setVehicleFilter] = useState<VehicleType | 'ALL'>('ALL');
  const [clientFilter, setClientFilter] = useState<string>('ALL');

  // Helper to get the actual service date - PRIORITIZING requestDate
  const getServiceDate = (req: TransportRequest): Date => {
    if (req.requestDate) {
      // Create date from YYYY-MM-DD
      const [y, m, d] = req.requestDate.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return req.scheduledFor ? new Date(req.scheduledFor) : new Date(req.createdAt);
  };

  // Logic to filter table data
  const filteredData = useMemo(() => {
    return requests.filter(req => {
      const serviceDate = getServiceDate(req);
      const serviceDateStr = serviceDate.toISOString().split('T')[0];
      
      if (startDate && serviceDateStr < startDate) return false;
      if (endDate && serviceDateStr > endDate) return false;
      
      if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;
      if (vehicleFilter !== 'ALL' && req.vehicleType !== vehicleFilter) return false;
      if (clientFilter !== 'ALL' && req.clientName !== clientFilter) return false;
      return true;
    });
  }, [requests, startDate, endDate, statusFilter, vehicleFilter, clientFilter]);

  // Chart Data: Deliveries per Client in the last 6 months
  const clientChartData = useMemo(() => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const counts: Record<string, number> = {};
    requests.forEach(req => {
      const date = getServiceDate(req);
      if (date >= sixMonthsAgo) {
        counts[req.clientName] = (counts[req.clientName] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 clients for visual clarity
  }, [requests]);

  // Calculations
  const totalRevenue = filteredData.reduce((acc, curr) => acc + curr.clientCharge, 0);
  const totalCost = filteredData.reduce((acc, curr) => acc + curr.driverFee, 0);
  const totalTax = totalRevenue * 0.08;
  const totalProfit = totalRevenue - totalCost - totalTax;
  const count = filteredData.length;
  const totalReceived = filteredData.reduce((acc, curr) => curr.paymentDate ? acc + curr.clientCharge : acc, 0);
  const totalReceivable = totalRevenue - totalReceived;

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(65, 42, 156); 
    doc.text('Relatório Gerencial - CRM IBEC', 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    const dateStr = new Date().toLocaleDateString('pt-BR');
    doc.text(`Gerado em: ${dateStr}`, 14, 28);
    doc.text(`Período: ${startDate ? new Date(startDate).toLocaleDateString('pt-BR') : 'Início'} até ${endDate ? new Date(endDate).toLocaleDateString('pt-BR') : 'Hoje'}`, 14, 33);
    doc.setDrawColor(220);
    doc.setFillColor(245, 247, 250);
    doc.rect(14, 40, 182, 35, 'F');
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text('RECEITA TOTAL', 20, 48);
    doc.text('CUSTO MOTORISTAS', 80, 48);
    doc.text('LUCRO LÍQ. (-8% NF)', 140, 48);
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(`R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 20, 56);
    doc.text(`R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 80, 56);
    doc.text(`R$ ${totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 140, 56);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text(`Recebido: R$ ${totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 20, 68);
    doc.text(`A Receber: R$ ${totalReceivable.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 80, 68);
    const tableColumn = ["Data Serviço", "Cliente", "Nota Fiscal", "Status", "Receita", "Pgto"];
    const tableRows = filteredData.map(req => [
        getServiceDate(req).toLocaleDateString('pt-BR'),
        req.clientName,
        req.invoiceNumber,
        req.status,
        `R$ ${req.clientCharge.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        req.paymentDate ? new Date(req.paymentDate).toLocaleDateString('pt-BR') : 'Pendente'
    ]);
    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 80,
        theme: 'grid',
        headStyles: { fillColor: [65, 42, 156], fontSize: 9 }, 
        bodyStyles: { fontSize: 8 },
        footStyles: { fontSize: 9, fillColor: [240, 240, 240], textColor: 50 },
    });
    doc.save(`relatorio_ibec_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleDelete = (id: string, invoice: string) => {
    if (window.confirm(`ATENÇÃO: Você está prestes a remover permanentemente a solicitação Nota Fiscal: ${invoice}.\n\nDeseja continuar com a exclusão no banco de dados?`)) {
      onDeleteRequest(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Relatórios Gerenciais</h1>
          <p className="text-gray-500 font-medium">Análise de desempenho e resultados financeiros</p>
        </div>
        <Button onClick={handleExportPDF} variant="outline" className="shadow-sm hover:shadow-md transition-all">
          <Icons.Download /> Exportar PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistics Column */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-5 border-l-4 border-l-primary hover:translate-x-1 transition-transform cursor-default">
            <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Receita Total</span>
            <span className="text-2xl font-black text-gray-900 block mt-1">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </Card>
          <Card className="p-5 border-l-4 border-l-emerald-500 bg-emerald-50/30 hover:translate-x-1 transition-transform cursor-default">
            <span className="text-emerald-700 text-[10px] font-black uppercase tracking-widest">Valor Recebido</span>
            <span className="text-2xl font-black text-emerald-800 block mt-1">R$ {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </Card>
          <Card className="p-5 border-l-4 border-l-orange-400 bg-orange-50/30 hover:translate-x-1 transition-transform cursor-default">
            <span className="text-orange-700 text-[10px] font-black uppercase tracking-widest">A Receber</span>
            <span className="text-2xl font-black text-orange-800 block mt-1">R$ {totalReceivable.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </Card>
          <Card className="p-5 border-l-4 border-l-indigo-600 bg-indigo-50/30 hover:translate-x-1 transition-transform cursor-default">
            <div className="flex justify-between items-start">
              <span className="text-indigo-700 text-[10px] font-black uppercase tracking-widest">Lucro Líquido</span>
              <span className="text-[9px] font-black text-indigo-600 bg-white/60 px-1.5 py-0.5 rounded border border-indigo-100 shadow-sm">-8% NF</span>
            </div>
            <span className="text-2xl font-black text-indigo-900 block mt-1">R$ {totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </Card>
        </div>

        {/* Deliveries by Client Chart - Enhanced Visualization */}
        <Card className="lg:col-span-2 p-6 flex flex-col h-full bg-white relative overflow-hidden">
          {/* Chart Header */}
          <div className="flex justify-between items-start mb-10 relative z-10">
            <div className="space-y-1">
              <h3 className="font-black text-gray-900 uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                <Icons.BarChart />
                Performance por Cliente
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Monitoramento Semestral de Demandas</p>
            </div>
            {clientChartData.length > 0 && (
              <div className="flex flex-col items-end animate-bounce">
                <span className="text-[9px] font-black text-secondary bg-secondary/10 px-2 py-0.5 rounded-full border border-secondary/20 uppercase tracking-tighter">🏆 Top Performance</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 flex flex-col justify-around gap-4 px-1 relative z-10">
            {clientChartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-10 opacity-30 grayscale">
                <Icons.Truck />
                <span className="text-[10px] font-black uppercase mt-2">Dados Insuficientes</span>
              </div>
            ) : (
              clientChartData.map((client, idx) => {
                const maxCount = Math.max(...clientChartData.map(d => d.count), 1);
                const widthPercent = (client.count / maxCount) * 100;
                const isTop = idx === 0;
                
                return (
                  <div key={idx} className="group relative flex flex-col gap-1.5 cursor-pointer">
                    {/* Tooltip on Hover */}
                    <div className="absolute -top-8 right-0 bg-gray-900 text-white text-[9px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-20">
                      {client.count} ENTREGAS NO PERÍODO
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight text-gray-500">
                      <div className="flex items-center gap-2">
                        {isTop && <span className="text-secondary">⭐</span>}
                        <span className={`truncate max-w-[200px] transition-colors ${isTop ? 'text-gray-900' : 'group-hover:text-primary'}`}>{client.name}</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                         <span className={`${isTop ? 'text-primary' : 'text-gray-400'} text-xs`}>{client.count}</span>
                         <span className="opacity-40 text-[8px]">und</span>
                      </div>
                    </div>
                    
                    <div className={`w-full h-3 rounded-full overflow-hidden relative border transition-all ${isTop ? 'bg-primary/5 border-primary/10 shadow-[0_0_10px_rgba(65,42,156,0.1)]' : 'bg-gray-50 border-gray-100'}`}>
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 cubic-bezier(0.175, 0.885, 0.32, 1.275) relative ${
                          isTop 
                          ? 'bg-gradient-to-r from-primary to-secondary shadow-[0_0_15px_rgba(255,135,22,0.3)]' 
                          : 'bg-gradient-to-r from-gray-400 to-gray-600 group-hover:from-primary group-hover:to-primary/80'
                        }`}
                        style={{ 
                          width: `${widthPercent}%`,
                          transitionDelay: `${idx * 150}ms`
                        }}
                      >
                         {/* Subtle shine effect */}
                         <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 w-20 h-full -skew-x-12 animate-[shimmer_2s_infinite]"></div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {/* Aesthetic background mesh */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>
        </Card>
      </div>

      {/* Filters Section - Premium Style */}
      <Card className="p-6 bg-white border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
             <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                <Icons.Settings />
             </div>
             <div>
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">Painel de Filtros</h3>
                <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">Refine a base de dados por período ou categoria</p>
             </div>
             <button 
                onClick={() => {
                    const now = new Date();
                    setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
                    setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);
                }}
                className="ml-auto text-[10px] font-black text-primary hover:text-secondary transition-colors uppercase tracking-widest bg-primary/5 px-3 py-1.5 rounded-full"
             >
                Limpar Período
             </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Input 
            label="Início" 
            type="date" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)}
            className="h-10 text-xs font-bold bg-gray-50/50 border-gray-200"
          />
          <Input 
            label="Fim" 
            type="date" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)}
            className="h-10 text-xs font-bold bg-gray-50/50 border-gray-200"
          />
          <Select 
            label="Status" 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value as any)}
            className="h-10 text-xs font-bold bg-gray-50/50 border-gray-200"
          >
            <option value="ALL">Todos os Status</option>
            <option value="PENDENTE">Pendentes</option>
            <option value="EM_ANDAMENTO">Em Rota</option>
            <option value="CONCLUIDO">Concluídas</option>
          </Select>
          <Select 
            label="Veículo" 
            value={vehicleFilter} 
            onChange={e => setVehicleFilter(e.target.value as any)}
            className="h-10 text-xs font-bold bg-gray-50/50 border-gray-200"
          >
            <option value="ALL">Todas Frota</option>
            <option value="MOTO">Motoboy</option>
            <option value="CARRO">Carro</option>
            <option value="UTILITARIO">Utilitário</option>
            <option value="CAMINHAO">Caminhão</option>
            <option value="PRESSKIT">Press Kit</option>
          </Select>
          <Select 
            label="Cliente" 
            value={clientFilter} 
            onChange={e => setClientFilter(e.target.value)}
            className="h-10 text-xs font-bold bg-gray-50/50 border-gray-200"
          >
            <option value="ALL">Todos os Clientes</option>
            {clients.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Detailed Table Section */}
      <Card className="overflow-hidden border-gray-100 shadow-2xl">
        <div className="px-6 py-5 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50/20 gap-4">
            <div className="space-y-1">
              <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2">
                <Icons.Truck /> 
                Detalhamento Operacional
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Relatório Analítico de Solicitações</p>
            </div>
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-black bg-primary text-white px-3 py-1 rounded-full shadow-lg shadow-primary/20">{count} ENTRADAS</span>
             </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-[10px] text-gray-400 uppercase bg-white border-b border-gray-100 font-black tracking-widest">
                    <tr>
                        <th className="px-6 py-4">Data/Hora</th>
                        <th className="px-6 py-4">Cliente / Doc</th>
                        <th className="px-6 py-4">Frota</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Custo</th>
                        <th className="px-6 py-4 text-right">Receita</th>
                        <th className="px-6 py-4 text-right">Liquidez</th>
                        <th className="px-6 py-4 text-center">Faturamento</th>
                        <th className="px-6 py-4 text-right">Gerir</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {filteredData.length === 0 ? (
                        <tr>
                            <td colSpan={9} className="px-6 py-20 text-center text-gray-400 italic">
                                <div className="flex flex-col items-center gap-3 opacity-30">
                                    <Icons.Truck />
                                    <span className="text-[11px] font-black uppercase tracking-widest">Nenhuma movimentação encontrada</span>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        filteredData.map(req => {
                          const tax = req.clientCharge * 0.08;
                          const profit = req.clientCharge - req.driverFee - tax;
                          const date = getServiceDate(req);
                          return (
                            <tr key={req.id} className="bg-white hover:bg-gray-50/80 transition-all group">
                                <td className="px-6 py-4 whitespace-nowrap text-[11px] font-bold text-gray-500">
                                    {date.toLocaleDateString('pt-BR')}
                                    <div className="text-[9px] opacity-40 uppercase">{req.requestTime || date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-black text-gray-900 text-xs uppercase tracking-tight group-hover:text-primary transition-colors">{req.clientName}</div>
                                    <div className="text-[10px] text-gray-400 font-bold flex items-center gap-1 mt-0.5">
                                      <span className="opacity-40">REF:</span> {req.invoiceNumber}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <VehicleBadge type={req.vehicleType} />
                                </td>
                                <td className="px-6 py-4">
                                    <InteractiveStatusSelect 
                                      status={req.status} 
                                      onChange={(newStatus) => onStatusUpdate(req.id, newStatus)} 
                                    />
                                </td>
                                <td className="px-6 py-4 text-right text-red-500/70 font-bold text-[11px]">
                                    -R$ {req.driverFee.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4 text-right text-primary font-black text-xs">
                                    +R$ {req.clientCharge.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className={`px-6 py-4 text-right font-black text-xs ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    R$ {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {req.paymentDate ? (
                                        <div 
                                            className="inline-flex flex-col items-center cursor-pointer group/pay"
                                            title="Desfazer compensação"
                                            onClick={() => {
                                                if(window.confirm('Deseja estornar esta liquidação?')) {
                                                    onPaymentUpdate(req.id, undefined);
                                                }
                                            }}
                                        >
                                            <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded text-[9px] font-black uppercase border border-emerald-100 shadow-sm transition-all hover:bg-red-50 hover:text-red-700 hover:border-red-100">
                                                Compensado
                                            </span>
                                            <span className="text-[9px] text-gray-400 mt-1 font-bold group-hover/pay:opacity-0 transition-opacity">
                                                {new Date(req.paymentDate).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => onPaymentUpdate(req.id, new Date().toISOString())}
                                            className="bg-white hover:bg-emerald-600 text-gray-400 hover:text-white border border-gray-200 hover:border-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all shadow-sm active:scale-95"
                                        >
                                            Liquidar
                                        </button>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end items-center gap-2">
                                         <button 
                                          onClick={() => onEditRequest(req)}
                                          className="text-gray-400 hover:text-primary transition-colors p-2 rounded-lg hover:bg-gray-100"
                                          title="Editar Lançamento"
                                        >
                                          <Icons.Edit />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(req.id, req.invoiceNumber)}
                                            className="flex items-center gap-1 text-red-400 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50 text-[10px] font-black uppercase"
                                            title="Excluir Registro"
                                        >
                                            <Icons.Trash />
                                            <span className="hidden sm:inline">Excluir</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                          );
                        })
                    )}
                </tbody>
            </table>
        </div>
      </Card>
      
      {/* Scroll to Top Style Micro-interaction space */}
      <div className="h-20"></div>
    </div>
  );
};
