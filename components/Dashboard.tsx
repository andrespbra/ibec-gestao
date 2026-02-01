
import React, { useMemo, useState, useEffect } from 'react';
import { TransportRequest, RequestStatus, Driver, User } from '../types';
import { Card, Icons, Button } from './Components';

interface DashboardProps {
  requests: TransportRequest[];
  drivers: Driver[];
  currentUser: User;
  onNewRequest: () => void;
  onUpdateStatus: (id: string, newStatus: RequestStatus) => void;
  onDeleteRequest: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ requests, drivers, currentUser, onNewRequest }) => {
  const [now, setNow] = useState(new Date());

  // Update "now" every minute for SLA timers
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const filteredRequests = useMemo(() => requests.filter(req => {
      if (currentUser.role === 'CLIENT' && currentUser.clientId) {
          return req.clientName === currentUser.name; 
      }
      return true;
  }), [requests, currentUser]);

  const activeDeliveries = useMemo(() => 
    filteredRequests.filter(r => r.status === 'EM_ANDAMENTO' || r.status === 'PENDENTE'),
  [filteredRequests]);

  const stats = useMemo(() => ({
    total: filteredRequests.length,
    inProgress: filteredRequests.filter(r => r.status === 'EM_ANDAMENTO').length,
    completed: filteredRequests.filter(r => r.status === 'CONCLUIDO').length,
    revenue: filteredRequests.reduce((acc, r) => acc + r.clientCharge, 0)
  }), [filteredRequests]);

  const getDriverById = (id?: string) => drivers.find(d => d.id === id);

  const calculateSLAPercentage = (createdAt: string) => {
    const start = new Date(createdAt).getTime();
    const current = now.getTime();
    const diffMins = Math.floor((current - start) / 60000);
    const percentage = Math.min((diffMins / 180) * 100, 100);
    return { percentage, diffMins };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Operações</h1>
            <p className="text-gray-500 font-medium">Logística Inteligente em Tempo Real</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" className="hidden md:flex"><Icons.Calendar /> Agenda</Button>
            <Button onClick={onNewRequest} className="bg-secondary hover:bg-[#e6760d]"><Icons.Plus /> Nova Solicitação</Button>
        </div>
      </div>

      {/* Row 1: Real-Time Map Area */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="relative h-[550px] overflow-hidden bg-slate-200 border-none shadow-2xl group rounded-2xl">
            {/* Mock Map Background - Always Visible */}
            <div className="absolute inset-0 opacity-60 grayscale-[0.5] contrast-[1.1] pointer-events-none bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/-46.6333,-23.5505,12,0/1200x600?access_token=pk.eyJ1IjoiZGV2ZWxvcGVyIiwiYSI6ImNrMWR4ZzRndzA0bmIzYm52eWxsbmx6bmwifQ==')] bg-cover bg-center transition-all duration-1000 group-hover:scale-105"></div>
            
            {/* Overlay Gradient for Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent"></div>

            {/* Live Indicator Overlay */}
            <div className="absolute top-6 left-6 z-30 flex items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-xl border border-white/50">
                <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-800 uppercase tracking-widest leading-none">Radar Ativo</span>
                    <span className="text-[8px] font-bold text-gray-400 uppercase mt-1">Sincronizado via Cloud</span>
                </div>
            </div>

            {/* Empty State Overlay - Floating in the center of the map */}
            {activeDeliveries.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/40 max-w-sm text-center animate-in zoom-in duration-500">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
                            <Icons.Truck />
                        </div>
                        <h3 className="text-gray-800 font-black uppercase text-sm tracking-widest">Base em Prontidão</h3>
                        <p className="text-gray-500 text-xs mt-2 font-medium leading-relaxed">
                            Aguardando novas solicitações de transporte. O radar de frota está monitorando a região de São Paulo.
                        </p>
                        <button 
                            onClick={onNewRequest}
                            className="mt-6 text-[10px] font-black uppercase tracking-widest bg-primary text-white px-6 py-2.5 rounded-full hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                        >
                            Lançar Primeira Rota
                        </button>
                    </div>
                </div>
            )}

            {/* Floating Delivery Banners (Bottom-aligned) */}
            <div className="absolute bottom-6 left-6 right-6 z-20 flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {activeDeliveries.map(req => {
                    const driver = getDriverById(req.driverId);
                    const { percentage } = calculateSLAPercentage(req.createdAt);
                    return (
                        <div key={req.id} className="flex-shrink-0 w-[340px] bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/60 p-5 transition-all hover:scale-[1.02] hover:bg-white cursor-default">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.15em]">{req.clientName}</h4>
                                    <div className="font-black text-gray-900 text-sm mt-1">Nota #{req.invoiceNumber}</div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Status SLA</span>
                                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-full mt-1 ${percentage > 80 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>{percentage.toFixed(0)}% do Prazo</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-2xl border border-gray-100 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary border border-gray-100">
                                    <Icons.Truck />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-black text-gray-800 uppercase truncate">{driver?.name || 'Procurando Motorista...'}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase">{driver?.vehicleType || 'Frota IBEC'}</span>
                                        {driver?.plate && <span className="text-[9px] font-black bg-gray-200 text-gray-600 px-1.5 rounded truncate">{driver.plate}</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 mb-5">
                                <div className="flex gap-3">
                                    <div className="w-2 flex flex-col items-center pt-1.5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <div className="w-px h-full border-l border-dashed border-gray-300 my-1"></div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Origem</div>
                                        <div className="text-[11px] font-bold text-gray-700 truncate">{req.origin}</div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-2 flex flex-col items-center">
                                        <div className="text-primary"><Icons.MapPin /></div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Destino Final</div>
                                        <div className="text-[11px] font-bold text-gray-700 truncate">{req.destination}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Timer Progress Bar */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                    <span>Início da Rota</span>
                                    <span>Meta: 3h</span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${percentage > 85 ? 'bg-red-500' : percentage > 50 ? 'bg-orange-400' : 'bg-emerald-500'}`}
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
      </div>

      {/* Row 2: KPI & Drivers Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Statistics Summary */}
        <div className="lg:col-span-4 space-y-4">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest px-1">Indicadores Hoje</h3>
            <div className="grid grid-cols-2 gap-4">
                <Card className="p-5 border-l-4 border-l-primary flex flex-col justify-center h-28 hover:shadow-lg transition-shadow">
                    <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Faturamento</span>
                    <span className="text-xl font-black text-gray-900 mt-2 tracking-tight">R$ {stats.revenue.toLocaleString('pt-BR')}</span>
                    <div className="text-[8px] font-bold text-emerald-500 mt-1">↑ 12% vs Ontem</div>
                </Card>
                <Card className="p-5 border-l-4 border-l-emerald-500 flex flex-col justify-center h-28 hover:shadow-lg transition-shadow">
                    <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Finalizadas</span>
                    <span className="text-3xl font-black text-emerald-600 mt-1">{stats.completed}</span>
                </Card>
                <Card className="p-5 border-l-4 border-l-blue-500 flex flex-col justify-center h-28 hover:shadow-lg transition-shadow">
                    <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Sucesso</span>
                    <span className="text-xl font-black text-blue-700 mt-2">98.4%</span>
                    <div className="text-[8px] font-bold text-gray-400 mt-1">SLA Atendido</div>
                </Card>
                <Card className="p-5 border-l-4 border-l-orange-500 flex flex-col justify-center h-28 hover:shadow-lg transition-shadow">
                    <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Em Aberto</span>
                    <span className="text-3xl font-black text-gray-900 mt-1">{activeDeliveries.length}</span>
                </Card>
            </div>
            
            <Card className="p-6 bg-gradient-to-br from-primary to-[#5a3ecf] text-white shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md"><Icons.TrendingUp /></div>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full border border-white/10">Previsibilidade</span>
                </div>
                <h4 className="text-3xl font-black">+14.2%</h4>
                <p className="text-[11px] text-blue-100/70 mt-3 font-medium leading-relaxed">Aumento projetado de demanda para a próxima janela de 48h baseada em contratos fixos.</p>
            </Card>
        </div>

        {/* Fleet Monitoring Section */}
        <div className="lg:col-span-8 space-y-4">
            <div className="flex justify-between items-center px-1">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Frota em Campo</h3>
                <div className="flex gap-2">
                    <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div> {drivers.filter(d => d.status === 'DISPONIVEL').length} Disponíveis
                    </span>
                    <span className="flex items-center gap-1.5 text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_5px_rgba(59,130,246,0.5)]"></div> {drivers.filter(d => d.status === 'EM_ROTA').length} Ativos
                    </span>
                </div>
            </div>

            <Card className="overflow-hidden shadow-xl border-gray-100/50">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-5">Piloto / Veículo</th>
                                <th className="px-6 py-5">Status Operacional</th>
                                <th className="px-6 py-5">Região</th>
                                <th className="px-6 py-5 text-center">Desempenho</th>
                                <th className="px-6 py-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                            {drivers.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-14 text-center text-gray-400 italic">Nenhum motorista disponível na base de dados.</td></tr>
                            ) : (
                                drivers.map(driver => (
                                    <tr key={driver.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shadow-inner border border-gray-100 group-hover:border-primary/30 transition-colors">
                                                    <img 
                                                        src={driver.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(driver.name)}&background=random&color=fff`} 
                                                        alt={driver.name} 
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-black text-gray-900 uppercase tracking-tighter group-hover:text-primary transition-colors">{driver.name}</div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{driver.model || driver.vehicleType}</span>
                                                        <span className="text-[9px] font-black text-primary bg-primary/5 px-1.5 rounded-md border border-primary/10">{driver.plate || 'S/ PLACA'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-1.5 text-[9px] font-black px-3 py-1 rounded-full border ${
                                                driver.status === 'DISPONIVEL' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                driver.status === 'EM_ROTA' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                'bg-gray-50 text-gray-500 border-gray-200'
                                            }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${
                                                    driver.status === 'DISPONIVEL' ? 'bg-emerald-500' :
                                                    driver.status === 'EM_ROTA' ? 'bg-blue-500 animate-pulse' :
                                                    'bg-gray-400'
                                                }`}></div>
                                                {driver.status || 'OFFLINE'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-700 uppercase tracking-tighter">
                                                <Icons.MapPin /> {driver.lastRegion || 'Base Central'}
                                            </div>
                                            <div className="text-[9px] text-gray-400 font-bold mt-1 uppercase">Atualizado agora</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <span className="text-sm font-black text-gray-900">{driver.monthlyDeliveries || 0}</span>
                                                <span className="text-[8px] font-black text-gray-400 uppercase">Fretis/Mês</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-gray-300 hover:text-primary transition-all p-2 rounded-xl hover:bg-white border border-transparent hover:border-gray-100 hover:shadow-sm">
                                                <Icons.Settings />
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
      </div>
    </div>
  );
};
