
import React, { useState, useEffect, useMemo } from 'react';
import { TransportRequest, VehicleType, VehicleRate, Driver, Client, ActivityType, User, FixedContract } from '../types';
import { Button, Input, Card, Icons, Select } from './Components';
import { estimateRoute } from '../services/geminiService';
import { DataManager } from '../services/dataManager';

interface NewRequestProps {
  rates: VehicleRate[];
  drivers: Driver[];
  clients: Client[];
  existingRequests: TransportRequest[];
  initialData?: TransportRequest;
  currentUser: User;
  onSubmit: (request: Omit<TransportRequest, 'id' | 'createdAt' | 'status'>) => void;
  onCancel: () => void;
}

export const NewRequest: React.FC<NewRequestProps> = ({ rates, drivers, clients, existingRequests, initialData, currentUser, onSubmit, onCancel }) => {
  const [contracts, setContracts] = useState<FixedContract[]>([]);
  
  const now = new Date();
  const defaultDate = now.toISOString().split('T')[0];
  const defaultTime = now.toTimeString().split(' ')[0].substring(0, 5);

  const [formData, setFormData] = useState({
    invoiceNumber: initialData?.invoiceNumber || '',
    clientName: initialData?.clientName || '',
    origin: initialData?.origin || '',
    destination: initialData?.destination || '',
    vehicleType: initialData?.vehicleType || ('MOTO' as VehicleType),
    driverId: initialData?.driverId || '',
    requestDate: initialData?.requestDate || defaultDate,
    requestTime: initialData?.requestTime || defaultTime,
    scheduledFor: initialData?.scheduledFor || '',
    activityType: initialData?.activityType || ('ENTREGAR' as ActivityType),
    contactOnSite: initialData?.contactOnSite || '',
    observations: initialData?.observations || '',
    commissionedName: initialData?.commissionedName || '',
    commissionPercentage: initialData?.commissionPercentage || 0
  });

  const [waypoints, setWaypoints] = useState<string[]>(initialData?.waypoints || []);
  const [distanceKm, setDistanceKm] = useState<number>(initialData?.distanceKm || 0);
  const [durationMins, setDurationMins] = useState<number>(0);
  const [financials, setFinancials] = useState({ 
    driverFee: initialData?.driverFee || 0, 
    clientCharge: initialData?.clientCharge || 0 
  });

  const [isEstimating, setIsEstimating] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    DataManager.fetchFixedData().then(data => setContracts(data.contracts));
  }, []);

  const allStaffOptions = useMemo(() => {
    const list: string[] = [];
    drivers.forEach(d => list.push(d.name));
    contracts.forEach(c => {
      c.staff?.forEach(s => {
        if (!list.includes(s.employeeName)) list.push(s.employeeName);
      });
    });
    return list.sort();
  }, [drivers, contracts]);

  useEffect(() => {
    if (!initialData) {
        const prefix = "IBEC - ";
        let maxNumber = 0;
        existingRequests.forEach(req => {
            if (req.invoiceNumber && req.invoiceNumber.startsWith(prefix)) {
                const numPart = req.invoiceNumber.replace(prefix, '');
                const num = parseInt(numPart, 10);
                if (!isNaN(num) && num > maxNumber) maxNumber = num;
            }
        });
        const nextNumber = maxNumber + 1;
        setFormData(prev => ({ ...prev, invoiceNumber: `${prefix}${String(nextNumber).padStart(3, '0')}` }));

        if (currentUser.role === 'CLIENT' && currentUser.clientId) {
            const myClient = clients.find(c => c.id === currentUser.clientId);
            if (myClient) {
                setFormData(prev => ({
                    ...prev,
                    clientName: myClient.name,
                    origin: myClient.address,
                    contactOnSite: myClient.contactName
                }));
            }
        }
    }
  }, [initialData, existingRequests, currentUser, clients]);

  useEffect(() => {
    const rate = rates.find(r => r.type === formData.vehicleType);
    if (!rate) return;
    if (distanceKm > 0) {
      setFinancials({
        driverFee: parseFloat((rate.baseFee + (distanceKm * rate.costPerKm)).toFixed(2)),
        clientCharge: parseFloat((rate.baseFee + (distanceKm * rate.chargePerKm)).toFixed(2))
      });
    }
  }, [distanceKm, formData.vehicleType, rates]);

  const handleEstimate = async () => {
    if (!formData.origin || !formData.destination) {
      setError("Preencha origem e destino para estimar.");
      return;
    }
    const activeWaypoints = waypoints.filter(w => w.trim() !== '');
    setError(null);
    setIsEstimating(true);
    setShowMap(false);
    try {
      const result = await estimateRoute(formData.origin, formData.destination, activeWaypoints);
      if (result.distanceKm > 0) {
        setDistanceKm(result.distanceKm);
        setDurationMins(result.durationMins);
        setShowMap(true);
      } else {
        setError("Não foi possível calcular a rota. Verifique os endereços.");
      }
    } catch (err: any) {
      setError(err.message || "Falha ao estimar distância.");
    } finally {
      setIsEstimating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      waypoints: waypoints.filter(w => w.trim() !== ''),
      distanceKm,
      driverFee: financials.driverFee,
      clientCharge: financials.clientCharge
    });
  };

  const isClient = currentUser.role === 'CLIENT';
  const isAdmin = currentUser.role === 'ADMIN';
  const commissionValue = (financials.clientCharge * (formData.commissionPercentage / 100)) || 0;

  const [year, month, day] = formData.requestDate.split('-');

  const handleDatePartChange = (part: 'day' | 'month' | 'year', value: string) => {
    let newDay = day;
    let newMonth = month;
    let newYear = year;

    if (part === 'day') newDay = value.padStart(2, '0');
    if (part === 'month') newMonth = value.padStart(2, '0');
    if (part === 'year') newYear = value;

    setFormData({ ...formData, requestDate: `${newYear}-${newMonth}-${newDay}` });
  };

  // Improved Embed URL with Waypoints Support for directions view
  const mapEmbedUrl = useMemo(() => {
     if (!showMap || !formData.origin || !formData.destination) return "";
     
     const origin = encodeURIComponent(formData.origin);
     const destination = encodeURIComponent(formData.destination);
     const activeWaypoints = waypoints.filter(w => w.trim() !== '');
     
     // Formatar para o esquema saddr (origem) e daddr (destino + paradas)
     let daddr = destination;
     if (activeWaypoints.length > 0) {
        // A sintaxe daddr={destino}+to:{parada1}+to:{parada2} força o trajeto
        const stops = activeWaypoints.map(w => `to:${encodeURIComponent(w)}`).join('+');
        daddr = `${stops}+to:${destination}`;
     }
     
     return `https://maps.google.com/maps?saddr=${origin}&daddr=${daddr}&output=embed&t=m&z=12`;
  }, [showMap, formData.origin, formData.destination, waypoints]);

  return (
    <div className="max-w-4xl mx-auto pb-20">
        <div className="flex items-center gap-2 mb-6">
            <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 transition-colors">&larr; Voltar</button>
            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">{initialData ? 'Editar Solicitação' : 'Nova Solicitação de Transporte'}</h2>
        </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6">
            <div className="flex items-center gap-2 mb-4 border-b pb-2">
                <div className="p-1.5 bg-primary/10 rounded text-primary"><Icons.Calendar /></div>
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Data e Horário da Solicitação</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select label="Dia" value={parseInt(day)} onChange={e => handleDatePartChange('day', e.target.value)}>
                    {Array.from({length: 31}, (_, i) => (
                        <option key={i+1} value={i+1}>{String(i+1).padStart(2, '0')}</option>
                    ))}
                </Select>
                <Select label="Mês" value={parseInt(month)} onChange={e => handleDatePartChange('month', e.target.value)}>
                    {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((m, i) => (
                        <option key={i+1} value={i+1}>{m}</option>
                    ))}
                </Select>
                <Select label="Ano" value={year} onChange={e => handleDatePartChange('year', e.target.value)}>
                    {[2024, 2025, 2026].map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </Select>
                <Input label="Horário" type="time" value={formData.requestTime} onChange={e => setFormData({...formData, requestTime: e.target.value})} required />
            </div>
        </Card>

        <Card className="p-6">
            <h3 className="text-sm font-black text-gray-800 mb-4 border-b pb-2 uppercase tracking-widest">Detalhes da Carga</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Número da Nota Fiscal" value={formData.invoiceNumber} onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} required />
                {!isClient ? (
                    <Select label="Selecionar Cliente" onChange={(e) => {
                      const client = clients.find(c => c.id === e.target.value);
                      if (client) setFormData(prev => ({...prev, clientName: client.name, origin: client.address, contactOnSite: client.contactName}));
                    }}>
                        <option value="">Escolha um cliente...</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                ) : <Input label="Sua Empresa" value={formData.clientName} disabled className="bg-gray-100" />}
                <div className="md:col-span-2">
                    <Input label="Cliente / Destinatário" value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} required disabled={isClient} />
                </div>
                <Input label="Contato no Local" value={formData.contactOnSite} onChange={e => setFormData({...formData, contactOnSite: e.target.value})} />
                <Select label="Tipo de Atividade" value={formData.activityType} onChange={e => setFormData({...formData, activityType: e.target.value as ActivityType})}>
                    <option value="ENTREGAR">Entregar</option>
                    <option value="COLETAR">Coletar</option>
                    <option value="COLETAR_ENTREGAR">Coletar e Entregar</option>
                </Select>
            </div>
        </Card>

        <Card className="p-6">
            <h3 className="text-sm font-black text-gray-800 mb-4 border-b pb-2 uppercase tracking-widest">Rota e Trajeto</h3>
            <div className="space-y-4">
                <Input label="Origem (Local de Início)" value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value})} required />
                {waypoints.map((point, index) => (
                    <div key={index} className="flex gap-2 items-end animate-in slide-in-from-left duration-200">
                        <div className="flex-1">
                          <Input label={`Ponto de Parada ${index + 1}`} value={point} onChange={e => {
                            const newWaypoints = [...waypoints];
                            newWaypoints[index] = e.target.value;
                            setWaypoints(newWaypoints);
                          }} />
                        </div>
                        <button type="button" onClick={() => setWaypoints(waypoints.filter((_, i) => i !== index))} className="bg-red-50 text-red-500 p-2.5 rounded-md mb-1 hover:bg-red-100 transition-colors"><Icons.Trash /></button>
                    </div>
                ))}
                <div className="flex justify-between items-center">
                  <button type="button" onClick={() => setWaypoints([...waypoints, ''])} className="text-xs text-primary font-black uppercase tracking-widest hover:text-secondary transition-colors">+ Adicionar Parada Extra</button>
                </div>
                <Input label="Destino Final" value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} required />
                
                {error && <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100">{error}</div>}

                <div className="flex justify-end gap-4 items-end pt-2">
                    {!isClient && <div className="w-32"><Input label="KM Total" type="number" value={distanceKm} onChange={e => setDistanceKm(parseFloat(e.target.value) || 0)} /></div>}
                    <Button type="button" variant="secondary" onClick={handleEstimate} isLoading={isEstimating} className="h-10 text-xs shadow-md">
                      <Icons.Wand /> Calcular Rota e Traçar Rota
                    </Button>
                </div>
            </div>
        </Card>

        {showMap && (
          <Card className="p-0 overflow-hidden border-2 border-primary/20 animate-in zoom-in duration-300 shadow-2xl">
              <div className="p-4 bg-primary/5 border-b flex justify-between items-center">
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                        <Icons.MapPin /> Itinerário Calculado via IA
                    </h4>
                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">Mapa interativo com roteirização</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-black text-gray-400 uppercase">Distância</span>
                      <span className="text-xs font-black text-primary">{distanceKm} KM</span>
                    </div>
                    <div className="flex flex-col items-end border-l border-gray-200 pl-3">
                      <span className="text-[8px] font-black text-gray-400 uppercase">Tempo Est.</span>
                      <span className="text-xs font-black text-secondary">{durationMins} MIN</span>
                    </div>
                  </div>
              </div>
              <div className="aspect-[16/9] w-full bg-gray-100">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    style={{ border: 0 }} 
                    src={mapEmbedUrl} 
                    allowFullScreen
                    title="Visualização da Rota"
                  ></iframe>
              </div>
              <div className="p-3 bg-gray-50 text-center">
                <p className="text-[9px] text-gray-400 font-medium italic">As rotas são baseadas em estimativas rodoviárias padrão.</p>
              </div>
          </Card>
        )}

        {!isClient && (
            <Card className="p-6 bg-primary/5 border-primary/10 shadow-inner">
                <div className="flex items-center gap-2 mb-4 border-b border-primary/10 pb-2">
                    <div className="p-1.5 bg-primary text-white rounded shadow-sm"><Icons.DollarSign /></div>
                    <h3 className="text-sm font-black text-primary uppercase tracking-widest">Logística de Valores</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                            {rates.map(rate => (
                                <button type="button" key={rate.type} onClick={() => setFormData({...formData, vehicleType: rate.type})} className={`px-3 py-2 text-[10px] font-black uppercase rounded-md border transition-all ${formData.vehicleType === rate.type ? 'bg-primary text-white border-primary shadow-lg scale-105' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>{rate.label}</button>
                            ))}
                        </div>
                        <Select label="Motorista Escalado" value={formData.driverId} onChange={e => setFormData({...formData, driverId: e.target.value})}>
                            <option value="">Selecione...</option>
                            {drivers.filter(d => d.vehicleType === formData.vehicleType).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </Select>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-primary/10 space-y-3 shadow-md">
                        <Input label="Valor Repasse Motorista (R$)" type="number" value={financials.driverFee} onChange={e => setFinancials({...financials, driverFee: parseFloat(e.target.value) || 0})} className="font-bold text-gray-800" />
                        <Input label="Valor Cobrança Cliente (R$)" type="number" value={financials.clientCharge} onChange={e => setFinancials({...financials, clientCharge: parseFloat(e.target.value) || 0})} className="font-black text-primary" />
                    </div>
                </div>

                {isAdmin && (
                    <div className="mt-6 pt-4 border-t border-primary/10">
                         <h4 className="text-[10px] font-black text-secondary mb-4 uppercase tracking-[0.2em]">Bonificação e Comissionamento</h4>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <Select 
                                label="Funcionario Beneficiário"
                                value={formData.commissionedName}
                                onChange={e => setFormData({...formData, commissionedName: e.target.value})}
                            >
                                <option value="">Nenhum</option>
                                {allStaffOptions.map(name => <option key={name} value={name}>{name}</option>)}
                            </Select>
                            <Input label="Margem de Comissão (%)" type="number" value={formData.commissionPercentage} onChange={e => setFormData({...formData, commissionPercentage: parseFloat(e.target.value) || 0})} />
                            <div className="bg-white border border-secondary/20 rounded-xl p-2.5 px-4 mb-[2px] shadow-sm">
                                <span className="text-[9px] text-gray-400 block uppercase font-black tracking-widest">Crédito Previsto</span>
                                <span className="text-secondary font-black text-lg">R$ {commissionValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                         </div>
                         <p className="text-[9px] text-gray-400 font-bold mt-2 italic">* Este valor será lançado como receita no extrato do funcionário após a conclusão do frete.</p>
                    </div>
                )}
            </Card>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t mt-8">
            <Button type="button" variant="ghost" onClick={onCancel} className="px-8">Cancelar</Button>
            <Button type="submit" className="px-12 shadow-xl hover:scale-105 transition-transform">{initialData ? 'Atualizar Dados' : 'Efetivar Solicitação'}</Button>
        </div>
      </form>
    </div>
  );
};
