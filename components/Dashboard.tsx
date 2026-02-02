
import React, { useMemo, useState, useEffect } from 'react';
import { TransportRequest, RequestStatus, Driver, User } from '../types';
import { Card, Icons, Button, StatusBadge, VehicleBadge } from './Components';

interface DashboardProps {
  requests: TransportRequest[];
  drivers: Driver[];
  currentUser: User;
  onNewRequest: () => void;
  onUpdateStatus: (id: string, newStatus: RequestStatus) => void;
  onDeleteRequest: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ requests, drivers, currentUser, onNewRequest, onUpdateStatus }) => {
  const [now, setNow] = useState(new Date());

  // Update "now" every minute for SLA timers
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const filteredRequests = useMemo(() => requests.filter(req => {
      if (currentUser.role === 'CLIENT' && currentUser.clientId) {
          return req.clientName === currentUser.name; 
      }
      return true;
  }), [requests, currentUser]);

  const todayRequests = useMemo(() => {
    return filteredRequests.filter(r => (r.requestDate || r.createdAt.split('T')[0]) === todayStr)
      .sort((a, b) => (b.requestTime || '').localeCompare(a.requestTime || ''));
  }, [filteredRequests, todayStr]);

  const stats = useMemo(() => ({
    totalToday: todayRequests.length,
    inProgressToday: todayRequests.filter(r => r.status === 'EM_ANDAMENTO').length,
    completedToday: todayRequests.filter(r => r.status === 'CONCLUIDO').length,
    revenueToday: todayRequests.reduce((acc, r) => acc + r.clientCharge, 0)
  }), [todayRequests]);

  const getDriverById = (id?: string) => drivers.find(d => d.id === id);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Painel Operacional</h1>
            <p className="text-gray-500 font-medium">Monitoramento do dia: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={onNewRequest} className="bg-secondary hover:bg-[#e6760d] shadow-lg shadow-secondary/20 uppercase text-xs font-black tracking-widest"><Icons.Plus /> Nova Solicitação</Button>
        </div>
      </div>

      {/* KPI Row - Today Focus */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-5 border-l-4 border-l-primary flex flex-col justify-center h-28 hover:shadow-lg transition-shadow">
              <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Faturamento Hoje</span>
              <span className="text-xl font-black text-gray-900 mt-2 tracking-tight">R$ {stats.revenueToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              <div className="text-[8px] font-bold text-primary mt-1 uppercase">Soma de pedidos do dia</div>
          </Card>
          <Card className="p-5 border-l-4 border-l-orange-500 flex flex-col justify-center h-28 hover:shadow-lg transition-shadow">
              <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Total de Pedidos</span>
              <span className="text-3xl font-black text-gray-900 mt-1">{stats.totalToday}</span>
              <div className="text-[8px] font-bold text-gray-400 mt-1 uppercase">Registrados hoje</div>
          </Card>
          <Card className="p-5 border-l-4 border-l-blue-500 flex flex-col justify-center h-28 hover:shadow-lg transition-shadow">
              <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Em Andamento</span>
              <span className="text-3xl font-black text-blue-700 mt-1">{stats.inProgressToday}</span>
              <div className="text-[8px] font-bold text-blue-400 mt-1 uppercase">Motoristas em rota</div>
          </Card>
          <Card className="p-5 border-l-4 border-l-emerald-500 flex flex-col justify-center h-28 hover:shadow-lg transition-shadow">
              <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Concluídos</span>
              <span className="text-3xl font-black text-emerald-600 mt-1">{stats.completedToday}</span>
              <div className="text-[8px] font-bold text-emerald-500 mt-1 uppercase">Finalizados hoje</div>
          </Card>
      </div>

      {/* Row 2: Today's Requests Listing */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-1">
          <div className="p-2 bg-primary/10 rounded-lg text-primary shadow-sm">
             <Icons.Calendar />
          </div>
          <div>
             <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Solicitações do Dia</h3>
             <p className="text-[10px] text-gray-400 font-bold uppercase">Acompanhamento de entregas programadas e em curso</p>
          </div>
        </div>

        <Card className="overflow-hidden border-none shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-5">Horário</th>
                  <th className="px-6 py-5">Cliente / Documento</th>
                  <th className="px-6 py-5">Veículo</th>
                  <th className="px-6 py-5">Motorista</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {todayRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                       <div className="flex flex-col items-center gap-4 opacity-30">
                          <Icons.Truck />
                          <span className="text-xs font-black uppercase tracking-[0.2em]">Sem movimentação registrada para hoje</span>
                          <Button onClick={onNewRequest} variant="outline" className="mt-2 text-[10px]">Cadastrar Primeiro Frete</Button>
                       </div>
                    </td>
                  </tr>
                ) : (
                  todayRequests.map(req => {
                    const driver = getDriverById(req.driverId);
                    return (
                      <tr key={req.id} className="hover:bg-gray-50/50 transition-all group">
                        <td className="px-6 py-4">
                           <div className="flex flex-col">
                              <span className="text-xs font-black text-gray-900">{req.requestTime || '--:--'}</span>
                              <span className="text-[9px] font-bold text-gray-400 uppercase">Brasília</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-black text-gray-900 uppercase group-hover:text-primary transition-colors">{req.clientName}</div>
                          <div className="text-[10px] text-gray-400 font-bold flex items-center gap-1 mt-0.5">
                            <span className="opacity-40">NF:</span> {req.invoiceNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <VehicleBadge type={req.vehicleType} />
                        </td>
                        <td className="px-6 py-4">
                          {driver ? (
                            <div className="flex items-center gap-2">
                               <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-[10px] shadow-inner">👤</div>
                               <div className="flex flex-col">
                                  <span className="text-[11px] font-black text-gray-700 uppercase leading-none">{driver.name}</span>
                                  <span className="text-[9px] font-bold text-gray-400 uppercase mt-1">{driver.plate || 'S/ Placa'}</span>
                               </div>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-orange-500 uppercase italic">Aguardando Escala</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                           <StatusBadge status={req.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                           <span className="text-xs font-black text-primary">R$ {req.clientCharge.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
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

      {/* Fleet Monitoring Section */}
      <div className="space-y-4">
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
                                          <div className="text-[9px] text-gray-400 font-bold mt-1 uppercase">Sincronizado via GPS</div>
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
  );
};
