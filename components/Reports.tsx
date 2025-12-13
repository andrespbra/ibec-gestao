
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
}

export const Reports: React.FC<ReportsProps> = ({ requests, clients, onEditRequest, onDeleteRequest }) => {
  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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
  const totalProfit = totalRevenue - totalCost;
  const count = filteredData.length;

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
    doc.rect(14, 40, 182, 25, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text('RECEITA TOTAL', 20, 48);
    doc.text('CUSTO MOTORISTAS', 80, 48);
    doc.text('LUCRO LÍQUIDO', 140, 48);
    
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(`R$ ${totalRevenue.toFixed(2)}`, 20, 58);
    doc.text(`R$ ${totalCost.toFixed(2)}`, 80, 58);
    doc.text(`R$ ${totalProfit.toFixed(2)}`, 140, 58);
    doc.setFont("helvetica", "normal");

    // Table
    const tableColumn = ["Data Serviço", "Cliente", "Veículo", "Status", "Custo", "Receita", "Lucro"];
    const tableRows = filteredData.map(req => [
        getServiceDate(req).toLocaleDateString('pt-BR'),
        req.clientName,
        req.vehicleType,
        req.status,
        `R$ ${req.driverFee.toFixed(2)}`,
        `R$ ${req.clientCharge.toFixed(2)}`,
        `R$ ${(req.clientCharge - req.driverFee).toFixed(2)}`
    ]);

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 75,
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
        <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">Filtros de Pesquisa</h3>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-l-4 border-l-primary">
          <span className="text-gray-500 text-xs font-bold uppercase">Receita Total</span>
          <span className="text-2xl font-bold text-gray-800 block mt-1">R$ {totalRevenue.toFixed(2)}</span>
          <span className="text-xs text-gray-400">Valor cobrado dos clientes</span>
        </Card>

        <Card className="p-5 border-l-4 border-l-secondary">
          <span className="text-gray-500 text-xs font-bold uppercase">Custo Motoristas</span>
          <span className="text-2xl font-bold text-gray-800 block mt-1">R$ {totalCost.toFixed(2)}</span>
          <span className="text-xs text-gray-400">Valor repassado aos parceiros</span>
        </Card>

        <Card className="p-5 border-l-4 border-l-green-500 bg-green-50">
          <span className="text-green-700 text-xs font-bold uppercase">Lucro Líquido</span>
          <span className="text-2xl font-bold text-green-800 block mt-1">R$ {totalProfit.toFixed(2)}</span>
          <span className="text-xs text-green-600">Margem: {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%</span>
        </Card>

        <Card className="p-5 border-l-4 border-l-gray-500">
          <span className="text-gray-500 text-xs font-bold uppercase">Total Entregas</span>
          <span className="text-2xl font-bold text-gray-800 block mt-1">{count}</span>
          <span className="text-xs text-gray-400">Registros filtrados</span>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Detalhamento das Entregas</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th className="px-6 py-3">Data Serviço</th>
                        <th className="px-6 py-3">Cliente</th>
                        <th className="px-6 py-3">Veículo</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Custo</th>
                        <th className="px-6 py-3 text-right">Receita</th>
                        <th className="px-6 py-3 text-right">Lucro</th>
                        <th className="px-6 py-3 text-right">Ação</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredData.length === 0 ? (
                        <tr>
                            <td colSpan={8} className="px-6 py-10 text-center text-gray-400">
                                Nenhum registro encontrado para os filtros selecionados.
                            </td>
                        </tr>
                    ) : (
                        filteredData.map(req => {
                          const profit = req.clientCharge - req.driverFee;
                          const date = getServiceDate(req);
                          return (
                            <tr key={req.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {date.toLocaleDateString('pt-BR')}
                                    {req.scheduledFor && <div className="text-xs text-blue-500 font-medium">{date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</div>}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{req.clientName}</div>
                                    <div className="text-xs">Nota: {req.invoiceNumber}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <VehicleBadge type={req.vehicleType} />
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={req.status} />
                                </td>
                                <td className="px-6 py-4 text-right text-red-600">
                                    R$ {req.driverFee.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-right text-blue-600 font-medium">
                                    R$ {req.clientCharge.toFixed(2)}
                                </td>
                                <td className={`px-6 py-4 text-right font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    R$ {profit.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                     <button 
                                      onClick={() => onEditRequest(req)}
                                      className="text-gray-500 hover:text-primary transition-colors p-1"
                                      title="Editar"
                                    >
                                      <Icons.Edit />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(req.id, req.invoiceNumber)}
                                        className="text-gray-500 hover:text-red-500 transition-colors p-1"
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
