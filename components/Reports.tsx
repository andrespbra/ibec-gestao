
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
  onPaymentUpdate: (id: string, date: string | undefined) => void;
}

export const Reports: React.FC<ReportsProps> = ({ requests, clients, onEditRequest, onDeleteRequest, onPaymentUpdate }) => {
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

  // Helper to get the actual service date (Scheduled date takes precedence over Created date)
  const getServiceDate = (req: TransportRequest): Date => {
    return req.scheduledFor ? new Date(req.scheduledFor) : new Date(req.createdAt);
  };

  // Logic to filter data
  const filteredData = useMemo(() => {
    return requests.filter(req => {
      const serviceDate = getServiceDate(req);

      // Date Filter
      if (startDate) {
        if (serviceDate < new Date(startDate)) return false;
      }
      if (endDate) {
        // Compare just the date parts
        const sDateStr = serviceDate.toISOString().split('T')[0];
        if (sDateStr > endDate) return false;
      }

      // Status Filter
      if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;

      // Vehicle Filter
      if (vehicleFilter !== 'ALL' && req.vehicleType !== vehicleFilter) return false;

      // Client Filter (matching clientName)
      if (clientFilter !== 'ALL' && req.clientName !== clientFilter) return false;

      return true;
    });
  }, [requests, startDate, endDate, statusFilter, vehicleFilter, clientFilter]);

  // Calculations
  const totalRevenue = filteredData.reduce((acc, curr) => acc + curr.clientCharge, 0);
  const totalCost = filteredData.reduce((acc, curr) => acc + curr.driverFee, 0);
  
  // Tax Calculation: 8% of Invoice (Revenue)
  const totalTax = totalRevenue * 0.08;
  // Net Profit = Revenue - Driver Cost - 8% Tax
  const totalProfit = totalRevenue - totalCost - totalTax;
  
  const count = filteredData.length;

  const totalReceived = filteredData.reduce((acc, curr) => curr.paymentDate ? acc + curr.clientCharge : acc, 0);
  const totalReceivable = totalRevenue - totalReceived;

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    // IBEC Purple
    doc.setTextColor(65, 42, 156); 
    doc.text('Relatório Gerencial - CRM IBEC', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    const dateStr = new Date().toLocaleDateString('pt-BR');
    doc.text(`Gerado em: ${dateStr}`, 14, 28);
    doc.text(`Período: ${startDate ? new Date(startDate).toLocaleDateString('pt-BR') : 'Início'} até ${endDate ? new Date(endDate).toLocaleDateString('pt-BR') : 'Hoje'}`, 14, 33);
    
    // Summary Box
    doc.setDrawColor(220);
    doc.setFillColor(245, 247, 250);
    doc.rect(14, 40, 182, 35, 'F'); // Increased height
    
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text('RECEITA TOTAL', 20, 48);
    doc.text('CUSTO MOTORISTAS', 80, 48);
    doc.text('LUCRO LÍQ. (-8% NF)', 140, 48);
    
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(`R$ ${totalRevenue.toFixed(2)}`, 20, 56);
    doc.text(`R$ ${totalCost.toFixed(2)}`, 80, 56);
    doc.text(`R$ ${totalProfit.toFixed(2)}`, 140, 56);
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text(`Recebido: R$ ${totalReceived.toFixed(2)}`, 20, 68);
    doc.text(`A Receber: R$ ${totalReceivable.toFixed(2)}`, 80, 68);

    // Table
    const tableColumn = ["Data Serviço", "Cliente", "Nota Fiscal", "Status", "Receita", "Pgto"];
    const tableRows = filteredData.map(req => [
        getServiceDate(req).toLocaleDateString('pt-BR'),
        req.clientName,
        req.invoiceNumber,
        req.status,
        `R$ ${req.clientCharge.toFixed(2)}`,
        req.paymentDate ? new Date(req.paymentDate).toLocaleDateString('pt-BR') : 'Pendente'
    ]);

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 80,
        theme: 'grid',
        headStyles: { fillColor: [65, 42, 156], fontSize: 9 }, // IBEC Purple
        bodyStyles: { fontSize: 8 },
        footStyles: { fontSize: 9, fillColor: [240, 240, 240], textColor: 50 },
    });

    doc.save(`relatorio_ibec_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleDelete = (id: string, invoice: string) => {
      if (window.confirm(`Tem certeza que deseja remover a solicitação Nota Fiscal: ${invoice}?`)) {
          onDeleteRequest(id);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Relatórios Gerenciais</h1>
            <p className="text-gray-500">Análise de desempenho e resultados financeiros</p>
        </div>
        <Button onClick={handleExportPDF} variant="outline">
            <Icons.Download /> Exportar PDF
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-5 bg-white">
        <div className="flex justify-between items-center mb-3 border-b pb-2">
             <h3 className="text-sm font-semibold text-gray-700">Filtros de Pesquisa</h3>
             <button 
                onClick={() => {
                    const now = new Date();
                    setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
                    setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);
                }}
                className="text-xs text-primary hover:underline"
             >
                Resetar para Mês Atual
             </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Input 
            label="Data Serviço Inicial" 
            type="date" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)}
          />
          <Input 
            label="Data Serviço Final" 
            type="date" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)}
          />
          <Select 
            label="Status" 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value as any)}
          >
            <option value="ALL">Todos</option>
            <option value="PENDENTE">Pendente</option>
            <option value="EM_ANDAMENTO">Em Andamento</option>
            <option value="CONCLUIDO">Concluído</option>
          </Select>
          <Select 
            label="Veículo" 
            value={vehicleFilter} 
            onChange={e => setVehicleFilter(e.target.value as any)}
          >
            <option value="ALL">Todos</option>
            <option value="MOTO">Motoboy</option>
            <option value="CARRO">Carro</option>
            <option value="UTILITARIO">Utilitário</option>
            <option value="CAMINHAO">Caminhão</option>
          </Select>
          <Select 
            label="Cliente" 
            value={clientFilter} 
            onChange={e => setClientFilter(e.target.value)}
          >
            <option value="ALL">Todos</option>
            {clients.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </Select>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="p-4 border-l-4 border-l-primary">
          <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Receita Total</span>
          <span className="text-xl font-bold text-gray-800 block mt-1">R$ {totalRevenue.toFixed(2)}</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500 bg-emerald-50">
          <span className="text-emerald-700 text-[10px] font-bold uppercase tracking-wider">Valor Recebido</span>
          <span className="text-xl font-bold text-emerald-800 block mt-1">R$ {totalReceived.toFixed(2)}</span>
        </Card>

         <Card className="p-4 border-l-4 border-l-orange-400 bg-orange-50">
          <span className="text-orange-700 text-[10px] font-bold uppercase tracking-wider">A Receber</span>
          <span className="text-xl font-bold text-orange-800 block mt-1">R$ {totalReceivable.toFixed(2)}</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-green-600">
          <div className="flex justify-between items-start">
            <span className="text-green-700 text-[10px] font-bold uppercase tracking-wider">Lucro Líquido</span>
            <span className="text-[9px] text-green-600 bg-green-100 px-1 rounded">-8% NF</span>
          </div>
          <span className="text-xl font-bold text-green-800 block mt-1">R$ {totalProfit.toFixed(2)}</span>
        </Card>
        
        <Card className="p-4 border-l-4 border-l-gray-400">
           <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Margem</span>
           <span className="text-xl font-bold text-gray-600 block mt-1">{totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%</span>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Detalhamento das Entregas</h3>
             <span className="text-xs text-gray-400">Mostrando {count} registros</span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th className="px-4 py-3">Data</th>
                        <th className="px-4 py-3">Cliente / Nota</th>
                        <th className="px-4 py-3">Veículo</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Custo</th>
                        <th className="px-4 py-3 text-right">Receita</th>
                        <th className="px-4 py-3 text-right">Lucro (Liq)</th>
                        <th className="px-4 py-3 text-center">Pagamento</th>
                        <th className="px-4 py-3 text-right">Ação</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredData.length === 0 ? (
                        <tr>
                            <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                                Nenhum registro encontrado para os filtros selecionados.
                            </td>
                        </tr>
                    ) : (
                        filteredData.map(req => {
                          // Deduct 8% tax from each row for Profit calculation
                          const tax = req.clientCharge * 0.08;
                          const profit = req.clientCharge - req.driverFee - tax;
                          
                          const date = getServiceDate(req);
                          return (
                            <tr key={req.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-4 py-4 whitespace-nowrap">
                                    {date.toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-4 py-4">
                                    <div className="font-medium text-gray-900">{req.clientName}</div>
                                    <div className="text-xs">Nota: {req.invoiceNumber}</div>
                                </td>
                                <td className="px-4 py-4">
                                    <VehicleBadge type={req.vehicleType} />
                                </td>
                                <td className="px-4 py-4">
                                    <StatusBadge status={req.status} />
                                </td>
                                <td className="px-4 py-4 text-right text-red-600 text-xs">
                                    R$ {req.driverFee.toFixed(2)}
                                </td>
                                <td className="px-4 py-4 text-right text-blue-600 font-medium text-xs">
                                    R$ {req.clientCharge.toFixed(2)}
                                </td>
                                <td className={`px-4 py-4 text-right font-bold text-xs ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    R$ {profit.toFixed(2)}
                                </td>
                                <td className="px-4 py-4 text-center">
                                    {req.paymentDate ? (
                                        <div 
                                            className="inline-flex flex-col items-center cursor-pointer group"
                                            title="Clique para desfazer pagamento"
                                            onClick={() => {
                                                if(window.confirm('Deseja marcar como não pago?')) {
                                                    onPaymentUpdate(req.id, undefined);
                                                }
                                            }}
                                        >
                                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold border border-green-200">
                                                Pago
                                            </span>
                                            <span className="text-[10px] text-gray-400 mt-0.5 group-hover:text-red-500 transition-colors">
                                                {new Date(req.paymentDate).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => onPaymentUpdate(req.id, new Date().toISOString())}
                                            className="bg-gray-100 hover:bg-green-50 text-gray-600 hover:text-green-700 border border-gray-300 hover:border-green-300 px-3 py-1 rounded text-xs font-medium transition-all"
                                        >
                                            Marcar Pago
                                        </button>
                                    )}
                                </td>
                                <td className="px-4 py-4 text-right flex justify-end gap-1">
                                     <button 
                                      onClick={() => onEditRequest(req)}
                                      className="text-gray-400 hover:text-primary transition-colors p-1"
                                      title="Editar"
                                    >
                                      <Icons.Edit />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(req.id, req.invoiceNumber)}
                                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                        title="Remover"
                                    >
                                        <Icons.Trash />
                                    </button>
                                </td>
                            </tr>
                          );
                        })
                    )}
                </tbody>
            </table>
        </div>
      </Card>
    </div>
  );
};
