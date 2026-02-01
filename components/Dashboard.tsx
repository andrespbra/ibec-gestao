
import React, { useMemo, useState, useEffect } from 'react';
import { TransportRequest, RequestStatus, Driver, User, DriverStatus } from '../types';
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

  // Helper to calculate SLA Percentage (3 hours / 180 mins)
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
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Centro de Comando</h1>
            <p className="text-gray-500 font-medium">Gestão de Operações em Tempo Real</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" className="hidden md:flex"><Icons.Calendar /> Ver Agenda</Button>
            <Button onClick={onNewRequest}><Icons.Plus /> Solicitar Transporte</Button>
        </div>
      </div>

      {/* Row 1: Real-Time Map Area */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="relative h-[500px] overflow-hidden bg-slate-100 border-none shadow-xl group">
            {/* Mock Map Background */}
            <div className="absolute inset-0 opacity-40 grayscale pointer-events-none bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/-46.6333,-23.5505,12,0/1200x500?access_token=pk.eyJ1IjoiZGV2ZWxvcGVyIiwiYSI6ImNrMWR4ZzRndzA0bmIzYm52eWxsbmx6bmwifQ==')] bg-cover bg-center"></div>
            
            {/* Live Indicator */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Monitoramento Ativo</span>
            </div>

            {/* Floating Delivery Banners (Horizontal Scroll for active ones) */}
            <div className="absolute bottom-4 left-4 right-4 z-20 flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {activeDeliveries.length === 0 ? (
                    <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-white/20 w-full text-center">
                        <p className="text-gray-400 font-bold text-sm">Nenhuma rota ativa no radar.</p>
                    </div>
                ) : (
                    activeDeliveries.map(req => {
                        const driver = getDriverById(req.driverId);
                        const { percentage } = calculateSLAPercentage(req.createdAt);
                        return (
                            <div key={req.id} className="flex-shrink-0 w-[340px] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 p-4 transition-all hover:scale-[1.02] hover:bg-white cursor-default">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.1em]">{req.clientName}</h4>
                                        <div className="font-bold text-gray-800 text-xs mt-0.5">Nota #{req.invoiceNumber}</div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase">Prazo SLA</span>
                                        <span className={`text-[10px] font-black ${percentage > 80 ? 'text-red-500' : 'text-emerald-600'}`}>{percentage.toFixed(0)}%</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <Icons.Truck />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[11px] font-black text-gray-800 truncate">{driver?.name || 'Aguardando Piloto'}</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase">{driver?.vehicleType}</span>
                                            <span className="text-[9px] font-black bg-gray-200 text-gray-600 px-1.5 rounded truncate">{driver?.plate || 'S/ PLACA'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex gap-2">
                                        <div className="w-4 flex flex-col items-center pt-1">
                                            <div className="w-2 h-2 rounded-full border-2 border-emerald-500 bg-white"></div>
                                            <div className="w-0.5 h-full border-l border-dashed border-gray-300 my-0.5"></div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-[8px] font-bold text-gray-400 uppercase leading-none">Retirada</div>
                                            <div className="text-[10px] font-medium text-gray-600 truncate">{req.origin}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="w-4 flex flex-col items-center">
                                            <Icons.MapPin />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-[8px] font-bold text-gray-400 uppercase leading-none">Entrega</div>
                                            <div className="text-[10px] font-medium text-gray-600 truncate">{req.destination}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Timer Progress Bar */}
                                <div className="space-y-1">
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${percentage > 85 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : percentage > 50 ? 'bg-orange-400' : 'bg-emerald-500'}`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                        <span>Iniciado</span>
                                        <span>3h Limite</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </Card>
      </div>

      {/* Row 2: KPI & Drivers Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Statistics Summary */}
        <div className="lg:col-span-4 space-y-4">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest px-1">Indicadores Operacionais</h3>
            <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 border-l-4 border-l-primary flex flex-col justify-center h-24">
                    <span className="text-gray-400 text-[9px] font-black uppercase">Faturamento Período</span>
                    <span className="text-xl font-black text-gray-800 mt-1">R$ {stats.revenue.toLocaleString('pt-BR')}</span>
                </Card>
                <Card className="p-4 border-l-4 border-l-emerald-500 flex flex-col justify-center h-24">
                    <span className="text-gray-400 text-[9px] font-black uppercase">Entregas Concluídas</span>
                    <span className="text-2xl font-black text-emerald-600 mt-1">{stats.completed}</span>
                </Card>
                <Card className="p-4 border-l-4 border-l-blue-500 flex flex-col justify-center h-24">
                    <span className="text-gray-400 text-[9px] font-black uppercase">Taxa de Sucesso</span>
                    <span className="text-xl font-black text-blue-700 mt-1">98.4%</span>
                </Card>
                <Card className="p-4 border-l-4 border-l-orange-500 flex flex-col justify-center h-24">
                    <span className="text-gray-400 text-[9px] font-black uppercase">Volume Total</span>
                    <span className="text-2xl font-black text-gray-800 mt-1">{stats.total}</span>
                </Card>
            </div>
            
            <Card className="p-6 bg-gradient-to-br from-primary to-[#5a3ecf] text-white">
                <div className="flex justify-between items-center mb-6">
                    <div className="p-2 bg-white/20 rounded-lg"><Icons.TrendingUp /></div>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded-full">Projeção Semanal</span>
                </div>
                <h4 className="text-2xl font-black">+12.5%</h4>
                <p className="text-[11px] text-blue-100/70 mt-2 font-medium">Crescimento estimado de demanda baseado no volume dos últimos 30 dias.</p>
            </Card>
        </div>

        {/* Fleet Monitoring Section */}
        <div className="lg:col-span-8 space-y-4">
            <div className="flex justify-between items-center px-1">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Gestão de Frota Ativa</h3>
                <div className="flex gap-1.5">
                    <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-1 rounded-full">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> {drivers.filter(d => d.status === 'DISPONIVEL').length} Online
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded-full">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> {drivers.filter(d => d.status === 'EM_ROTA').length} Em Rota
                    </span>
                </div>
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 text-[10px] text-gray-400 font-black uppercase">
                            <tr>
                                <th className="px-6 py-4">Piloto / Veículo</th>
                                <th className="px-6 py-4">Status Atual</th>
                                <th className="px-6 py-4">Região / Última Ativ.</th>
                                <th className="px-6 py-4 text-center">Entregas/Mês</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {drivers.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">Nenhum motorista disponível na base.</td></tr>
                            ) : (
                                drivers.map(driver => (
                                    <tr key={driver.id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gray-200 overflow-hidden shadow-inner border border-gray-100">
                                                    <img 
                                                        src={driver.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(driver.name)}&background=random`} 
                                                        alt={driver.name} 
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-black text-gray-800 uppercase tracking-tighter">{driver.name}</div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase">{driver.model || driver.vehicleType}</span>
                                                        <span className="text-[9px] font-black text-primary bg-primary/5 px-1.5 rounded">{driver.plate}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[9px] font-black px-2 py-1 rounded-full border ${
                                                driver.status === 'DISPONIVEL' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                driver.status === 'EM_ROTA' ? 'bg-blue-50 text-blue-700 border-blue-100 animate-pulse' :
                                                'bg-gray-50 text-gray-500 border-gray-200'
                                            }`}>
                                                {driver.status || 'OFFLINE'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600 uppercase tracking-tighter">
                                                <Icons.MapPin /> {driver.lastRegion || 'Centro'}
                                            </div>
                                            <div className="text-[9px] text-gray-400 font-medium mt-0.5">Há 15 minutos</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex flex-col">
                                                <span className="text-sm font-black text-gray-800">{driver.monthlyDeliveries || 0}</span>
                                                <div className="w-12 h-1 bg-emerald-500 rounded-full mt-1"></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-gray-300 hover:text-primary transition-colors p-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-100">
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
