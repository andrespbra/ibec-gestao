
import React, { useMemo } from 'react';
import { Client, TransportRequest, FixedContract } from '../types';
import { Card, Icons, Button } from './Components';

interface ClientsProps {
  clients: Client[];
  requests: TransportRequest[];
  contracts: FixedContract[];
  onNewClient: () => void;
  onEditClient: (client: Client) => void;
}

export const Clients: React.FC<ClientsProps> = ({ clients, requests, contracts, onNewClient, onEditClient }) => {
  
  // Calculations for Metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Filter requests for calculations
    const thisMonthRequests = requests.filter(r => {
        const d = new Date(r.createdAt);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const lastMonthRequests = requests.filter(r => {
        const d = new Date(r.createdAt);
        return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    });

    // 1. Clientes Ativos (com pedidos no mês atual)
    const activeClientsSet = new Set(thisMonthRequests.map(r => r.clientName));
    const activeClientsCount = activeClientsSet.size;

    // 2. Receita Fixa (Soma dos contratos ativos)
    const fixedRevenue = contracts.reduce((acc, c) => acc + c.contractValue, 0);

    // 3. Taxa de Retenção (Clientes com mais de 1 pedido histórico / total clientes)
    const clientOrderCounts: Record<string, number> = {};
    requests.forEach(r => {
        clientOrderCounts[r.clientName] = (clientOrderCounts[r.clientName] || 0) + 1;
    });
    const recurringClients = Object.values(clientOrderCounts).filter(count => count > 1).length;
    const retentionRate = clients.length > 0 ? (recurringClients / clients.length) * 100 : 0;

    // Performance Metrics
    const ticketMedio = thisMonthRequests.length > 0 
        ? thisMonthRequests.reduce((acc, r) => acc + r.clientCharge, 0) / thisMonthRequests.length 
        : 0;
    
    const lastTicketMedio = lastMonthRequests.length > 0 
        ? lastMonthRequests.reduce((acc, r) => acc + r.clientCharge, 0) / lastMonthRequests.length 
        : 0;

    // Pontualidade de Pagamento (Ratio de requests CONCLUIDO com paymentDate setada)
    const completedRequests = requests.filter(r => r.status === 'CONCLUIDO');
    const punctualRequests = completedRequests.filter(r => r.paymentDate);
    const punctualityRate = completedRequests.length > 0 ? (punctualRequests.length / completedRequests.length) * 100 : 92;

    // Growth Projections
    const deliveryGrowth = lastMonthRequests.length > 0 
        ? ((thisMonthRequests.length - lastMonthRequests.length) / lastMonthRequests.length) * 100 
        : 0;
    
    const ticketGrowth = lastTicketMedio > 0 
        ? ((ticketMedio - lastTicketMedio) / lastTicketMedio) * 100 
        : 0;

    return {
        activeClientsCount,
        totalClients: clients.length,
        fixedRevenue,
        retentionRate,
        monthlyDeliveries: thisMonthRequests.length,
        deliveryGrowth,
        ticketMedio,
        ticketGrowth,
        punctualityRate,
        satisfaction: 4.8 // Simulated NPS 
    };
  }, [clients, requests, contracts]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Clientes</h1>
            <p className="text-gray-500">Inteligência e relacionamento</p>
        </div>
        <Button onClick={onNewClient}>
            <Icons.Plus /> Novo Cliente
        </Button>
      </div>

      {/* Top row KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 border-l-4 border-l-primary bg-white shadow-sm">
            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Clientes Ativos</span>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-gray-800 mt-2">{metrics.activeClientsCount}</span>
                <span className="text-[10px] text-gray-400 font-medium">este mês</span>
            </div>
        </Card>
        <Card className="p-5 border-l-4 border-l-secondary bg-white shadow-sm">
            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Base Total</span>
            <span className="text-3xl font-extrabold text-gray-800 mt-2 block">{metrics.totalClients}</span>
        </Card>
        <Card className="p-5 border-l-4 border-l-emerald-500 bg-white shadow-sm">
            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Receita Fixa (Mensal)</span>
            <span className="text-2xl font-extrabold text-emerald-600 mt-2 block">R$ {metrics.fixedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </Card>
        <Card className="p-5 border-l-4 border-l-purple-500 bg-white shadow-sm">
            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Taxa de Retenção</span>
            <span className="text-3xl font-extrabold text-purple-600 mt-2 block">{metrics.retentionRate.toFixed(1)}%</span>
        </Card>
      </div>

      {/* Performance Banner */}
      <div className="bg-primary rounded-xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Icons.BarChart />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-6 border-b border-white/20 pb-2">Métricas de Performance Operacional</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-2">
                <span className="text-[10px] opacity-70 font-bold uppercase">Entregas Mensais</span>
                <div className="flex items-center gap-3">
                    <span className="text-2xl font-black">{metrics.monthlyDeliveries}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 ${metrics.deliveryGrowth >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                        {metrics.deliveryGrowth >= 0 ? '↑' : '↓'} {Math.abs(metrics.deliveryGrowth).toFixed(1)}%
                    </span>
                </div>
            </div>
            <div className="space-y-2">
                <span className="text-[10px] opacity-70 font-bold uppercase">Ticket Médio</span>
                <div className="flex items-center gap-3">
                    <span className="text-2xl font-black">R$ {metrics.ticketMedio.toFixed(0)}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 ${metrics.ticketGrowth >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                        {metrics.ticketGrowth >= 0 ? '↑' : '↓'} {Math.abs(metrics.ticketGrowth).toFixed(1)}%
                    </span>
                </div>
            </div>
            <div className="space-y-2">
                <span className="text-[10px] opacity-70 font-bold uppercase">Pontualidade Pagto.</span>
                <div className="flex items-center gap-3">
                    <span className="text-2xl font-black">{metrics.punctualityRate.toFixed(1)}%</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-200">Meta: 95%</span>
                </div>
            </div>
            <div className="space-y-2">
                <span className="text-[10px] opacity-70 font-bold uppercase">Satisfação (NPS)</span>
                <div className="flex items-center gap-3">
                    <span className="text-2xl font-black">{metrics.satisfaction.toFixed(1)}</span>
                    <div className="flex text-secondary text-xs">
                        {'★'.repeat(5)}
                    </div>
                </div>
            </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Diretório de Clientes</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-[10px] text-gray-400 uppercase bg-gray-50 border-b font-black">
                    <tr>
                        <th className="px-6 py-3">Empresa / CNPJ</th>
                        <th className="px-6 py-3">Centro de Custo</th>
                        <th className="px-6 py-3">Contato</th>
                        <th className="px-6 py-3">Endereço</th>
                        <th className="px-6 py-3">Vencimento</th>
                        <th className="px-6 py-3 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {clients.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-gray-400 italic">
                                Nenhum cliente cadastrado no diretório.
                            </td>
                        </tr>
                    ) : (
                        clients.map(client => (
                            <tr key={client.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{client.name}</div>
                                    <div className="text-[10px] font-bold text-gray-400">{client.cnpj}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-[10px] font-mono font-bold">
                                        {client.costCenter}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-gray-900 font-medium text-xs">{client.contactName}</div>
                                    <div className="text-[10px] flex flex-col gap-0.5 mt-1 font-bold text-gray-400">
                                        <span>{client.contactPhone}</span>
                                        <span className="text-primary">{client.contactEmail}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 max-w-xs truncate text-xs" title={client.address}>
                                    {client.address}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-gray-400 text-[10px] font-bold">DIA</span>
                                        <span className="font-black text-gray-800 text-sm">{client.paymentDay}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                      onClick={() => onEditClient(client)}
                                      className="text-gray-300 hover:text-primary transition-colors p-1"
                                      title="Editar Perfil"
                                    >
                                      <Icons.Edit />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </Card>
    </div>
  );
};
