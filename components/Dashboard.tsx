
import React, { useMemo } from 'react';
import { TransportRequest, RequestStatus, Driver, User } from '../types';
import { Card, StatusBadge, VehicleBadge, Icons, Button } from './Components';

interface DashboardProps {
  requests: TransportRequest[];
  drivers: Driver[];
  currentUser: User;
  onNewRequest: () => void;
  onUpdateStatus: (id: string, newStatus: RequestStatus) => void;
  onDeleteRequest: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ requests, drivers, currentUser, onNewRequest, onUpdateStatus, onDeleteRequest }) => {
  
  // Filter Requests based on Role
  const filteredRequests = useMemo(() => requests.filter(req => {
      if (currentUser.role === 'CLIENT' && currentUser.clientId) {
          return req.clientName === currentUser.name; 
      }
      return true;
  }), [requests, currentUser]);

  const isClient = currentUser.role === 'CLIENT';

  // Stats Logic
  const totalDeliveries = filteredRequests.length;
  const inProgress = filteredRequests.filter(r => r.status === 'EM_ANDAMENTO').length;
  const completedRequests = filteredRequests.filter(r => r.status === 'CONCLUIDO').length;
  const totalFreight = filteredRequests.reduce((acc, r) => acc + r.clientCharge, 0);

  // Delayed Logic: Status not completed AND scheduled time is in the past
  const delayedRequests = useMemo(() => filteredRequests.filter(r => 
    r.status !== 'CONCLUIDO' && 
    r.scheduledFor && 
    new Date(r.scheduledFor) < new Date()
  ).length, [filteredRequests]);

  // Group by Month (last 6 months)
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();
    const result = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mIdx = d.getMonth();
        const count = filteredRequests.filter(r => {
            const rd = new Date(r.createdAt);
            return rd.getMonth() === mIdx && rd.getFullYear() === d.getFullYear();
        }).length;
        result.push({ name: months[mIdx], count });
    }
    return result;
  }, [filteredRequests]);

  const getDriverName = (driverId?: string) => {
    if (!driverId) return 'Aguardando...';
    const driver = drivers.find(d => d.id === driverId);
    return driver ? driver.name : 'Desconhecido';
  };
  
  const handleDelete = (id: string, invoice: string) => {
    if (window.confirm(`Tem certeza que deseja remover a solicitação Nota Fiscal: ${invoice}?`)) {
        onDeleteRequest(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Painel de Controle</h1>
            <p className="text-gray-500">Logística em tempo real</p>
        </div>
        <Button onClick={onNewRequest}>
            <Icons.Plus /> Nova Solicitação
        </Button>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between border-l-4 border-l-primary bg-white shadow-sm">
            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Total de Entregas</span>
            <span className="text-3xl font-extrabold text-gray-800 mt-2">{totalDeliveries}</span>
        </Card>
        
        <Card className="p-5 flex flex-col justify-between border-l-4 border-l-secondary bg-white shadow-sm">
            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Total de Frete</span>
            <span className="text-2xl font-extrabold text-gray-800 mt-2">R$ {totalFreight.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </Card>

        <Card className="p-5 flex flex-col justify-between border-l-4 border-l-green-500 bg-white shadow-sm">
            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Em Andamento</span>
            <span className="text-3xl font-extrabold text-gray-800 mt-2">{inProgress}</span>
        </Card>

        <Card className={`p-5 flex flex-col justify-between border-l-4 shadow-sm ${delayedRequests > 0 ? 'border-l-red-500 bg-red-50' : 'border-l-gray-300 bg-white'}`}>
            <span className={`${delayedRequests > 0 ? 'text-red-600' : 'text-gray-500'} text-[10px] font-bold uppercase tracking-widest`}>Entregas Atrasadas</span>
            <div className="flex items-center gap-2 mt-2">
                <span className={`text-3xl font-extrabold ${delayedRequests > 0 ? 'text-red-700' : 'text-gray-800'}`}>{delayedRequests}</span>
                {delayedRequests > 0 && <span className="animate-pulse text-red-500">⚠️</span>}
            </div>
        </Card>
      </div>

      {/* Row 1: Monthly Chart & Effective Deliveries Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 bg-white shadow-sm overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800 uppercase text-xs tracking-widest">Volume de Entregas (Mensal)</h3>
                <span className="text-[10px] text-gray-400 font-bold">ÚLTIMOS 6 MESES</span>
            </div>
            <div className="h-48 w-full flex items-end justify-between gap-2 px-2">
                {monthlyData.map((data, idx) => {
                    const maxCount = Math.max(...monthlyData.map(d => d.count), 1);
                    const height = (data.count / maxCount) * 100;
                    return (
                        <div key={idx} className="flex-1 flex flex-col items-center group">
                            <div className="w-full bg-primary/10 rounded-t-md relative flex items-end justify-center transition-all group-hover:bg-primary/20" style={{ height: '100%' }}>
                                <div 
                                    className="w-4/5 bg-primary rounded-t-md transition-all duration-700 ease-out" 
                                    style={{ height: `${height}%` }}
                                >
                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-10">
                                        {data.count} entregas
                                    </div>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 mt-2">{data.name}</span>
                        </div>
                    );
                })}
            </div>
        </Card>

        <Card className="p-6 bg-primary text-white shadow-lg flex flex-col justify-center items-center text-center relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-24 h-24 bg-secondary/20 rounded-full blur-xl"></div>
            
            <Icons.Truck />
            <h3 className="text-xs font-bold uppercase tracking-widest mt-4 opacity-80">Entregas Efetivas</h3>
            <span className="text-5xl font-black mt-2">{completedRequests}</span>
            <p className="text-[10px] mt-4 font-medium px-4 opacity-70 italic">Representa o sucesso total das operações concluídas no período.</p>
        </Card>
      </div>

      {/* Recent List */}
      <Card className="overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-bold text-gray-800 uppercase text-xs tracking-widest">Últimas Movimentações</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-[10px] text-gray-400 uppercase bg-white border-b border-gray-100 font-black">
                    <tr>
                        <th className="px-6 py-4">Nota / Cliente</th>
                        <th className="px-6 py-4">Rota / Destino</th>
                        <th className="px-6 py-4">Veículo / Motorista</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {filteredRequests.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">
                                Nenhuma entrega registrada.
                            </td>
                        </tr>
                    ) : (
                        filteredRequests.slice(0, 10).map(request => (
                            <tr key={request.id} className="bg-white hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">#{request.invoiceNumber}</div>
                                    <div className="text-[10px] font-bold text-gray-400 truncate max-w-[120px]">{request.clientName}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
                                        <span className="truncate max-w-[180px]">{request.destination}</span>
                                    </div>
                                    {request.scheduledFor && (
                                        <div className="text-[9px] text-orange-500 font-bold mt-1 uppercase">
                                            Agendado: {new Date(request.scheduledFor).toLocaleString('pt-BR')}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <VehicleBadge type={request.vehicleType} />
                                        <span className="text-[10px] text-gray-400 font-medium">{getDriverName(request.driverId)}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {!isClient ? (
                                      <select 
                                        value={request.status} 
                                        onChange={(e) => onUpdateStatus(request.id, e.target.value as RequestStatus)}
                                        className={`text-xs font-semibold border rounded-full px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer transition-colors ${
                                          request.status === 'PENDENTE' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                          request.status === 'EM_ANDAMENTO' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                          'bg-green-100 text-green-800 border-green-200'
                                        }`}
                                      >
                                        <option value="PENDENTE">Pendente</option>
                                        <option value="EM_ANDAMENTO">Em andamento</option>
                                        <option value="CONCLUIDO">Finalizado</option>
                                      </select>
                                    ) : (
                                      <StatusBadge status={request.status} />
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleDelete(request.id, request.invoiceNumber)}
                                            className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                                        >
                                            <Icons.Trash />
                                        </button>
                                    </div>
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
