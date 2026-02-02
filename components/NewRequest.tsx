
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
  
  const [formData, setFormData] = useState({
    invoiceNumber: initialData?.invoiceNumber || '',
    clientName: initialData?.clientName || '',
    origin: initialData?.origin || '',
    destination: initialData?.destination || '',
    vehicleType: initialData?.vehicleType || ('MOTO' as VehicleType),
    driverId: initialData?.driverId || '',
    scheduledFor: initialData?.scheduledFor || '',
    activityType: initialData?.activityType || ('ENTREGAR' as ActivityType),
    contactOnSite: initialData?.contactOnSite || '',
    observations: initialData?.observations || '',
    commissionedName: initialData?.commissionedName || '',
    commissionPercentage: initialData?.commissionPercentage || 0
  });

  const [waypoints, setWaypoints] = useState<string[]>(initialData?.waypoints || []);
  const [distanceKm, setDistanceKm] = useState<number>(initialData?.distanceKm || 0);
  const [financials, setFinancials] = useState({ 
    driverFee: initialData?.driverFee || 0, 
    clientCharge: initialData?.clientCharge || 0 
  });

  const [isEstimating, setIsEstimating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados de staff para comissionamento
  useEffect(() => {
    DataManager.fetchFixedData().then(data => setContracts(data.contracts));
  }, []);

  // Lista unificada de possíveis comissionados (Motoristas + Staff)
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
    try {
      const result = await estimateRoute(formData.origin, formData.destination, activeWaypoints);
      if (result.distanceKm > 0) setDistanceKm(result.distanceKm);
      else setError("Não foi possível calcular a rota. Verifique os endereços.");
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

  return (
    <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
            <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">&larr; Voltar</button>
            <h2 className="text-2xl font-bold text-gray-800">{initialData ? 'Editar Solicitação' : 'Nova Solicitação de Transporte'}</h2>
        </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Detalhes da Carga</h3>
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
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Rota</h3>
            <div className="space-y-4">
                <Input label="Origem" value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value})} required />
                {waypoints.map((point, index) => (
                    <div key={index} className="flex gap-2 items-end">
                        <div className="flex-1"><Input label={`Parada ${index + 1}`} value={point} onChange={e => {
                          const newWaypoints = [...waypoints];
                          newWaypoints[index] = e.target.value;
                          setWaypoints(newWaypoints);
                        }} /></div>
                        <button type="button" onClick={() => setWaypoints(waypoints.filter((_, i) => i !== index))} className="bg-red-50 text-red-500 p-2.5 rounded-md mb-1"><Icons.Trash /></button>
                    </div>
                ))}
                <button type="button" onClick={() => setWaypoints([...waypoints, ''])} className="text-sm text-primary font-medium">+ Adicionar Parada Extra</button>
                <Input label="Destino Final" value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} required />
                <div className="flex justify-end gap-4 items-end">
                    {!isClient && <div className="w-32"><Input label="KM Total" type="number" value={distanceKm} onChange={e => setDistanceKm(parseFloat(e.target.value) || 0)} /></div>}
                    <Button type="button" variant="secondary" onClick={handleEstimate} isLoading={isEstimating}><Icons.Wand /> Calcular Rota (IA)</Button>
                </div>
            </div>
        </Card>

        {!isClient && (
            <Card className="p-6 bg-blue-50 border-blue-100">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 border-b border-blue-200 pb-2">Veículo e Valores</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                            {rates.map(rate => (
                                <button type="button" key={rate.type} onClick={() => setFormData({...formData, vehicleType: rate.type})} className={`px-3 py-2 text-xs rounded-md border ${formData.vehicleType === rate.type ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600'}`}>{rate.label}</button>
                            ))}
                        </div>
                        <Select label="Motorista" value={formData.driverId} onChange={e => setFormData({...formData, driverId: e.target.value})}>
                            <option value="">Selecione...</option>
                            {drivers.filter(d => d.vehicleType === formData.vehicleType).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </Select>
                    </div>
                    <div className="bg-white p-4 rounded-md border border-gray-200 space-y-3">
                        <Input label="Valor Motorista (R$)" type="number" value={financials.driverFee} onChange={e => setFinancials({...financials, driverFee: parseFloat(e.target.value) || 0})} />
                        <Input label="Valor Cliente (R$)" type="number" value={financials.clientCharge} onChange={e => setFinancials({...financials, clientCharge: parseFloat(e.target.value) || 0})} />
                    </div>
                </div>

                {isAdmin && (
                    <div className="mt-6 pt-4 border-t border-blue-200">
                         <h4 className="text-xs font-black text-blue-900 mb-3 uppercase tracking-widest">Comissionamento de Venda</h4>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <Select 
                                label="Comissionado"
                                value={formData.commissionedName}
                                onChange={e => setFormData({...formData, commissionedName: e.target.value})}
                            >
                                <option value="">Nenhum</option>
                                {allStaffOptions.map(name => <option key={name} value={name}>{name}</option>)}
                            </Select>
                            <Input label="Porcentagem (%)" type="number" value={formData.commissionPercentage} onChange={e => setFormData({...formData, commissionPercentage: parseFloat(e.target.value) || 0})} />
                            <div className="bg-white border border-gray-200 rounded p-2 px-3 mb-[2px]">
                                <span className="text-[10px] text-gray-400 block uppercase font-black">Valor Comissão</span>
                                <span className="text-primary font-black">R$ {commissionValue.toFixed(2)}</span>
                            </div>
                         </div>
                    </div>
                )}
            </Card>
        )}

        <div className="flex justify-end gap-3 pt-4 pb-12">
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="submit">{initialData ? 'Salvar Alterações' : 'Cadastrar Solicitação'}</Button>
        </div>
      </form>
    </div>
  );
};
