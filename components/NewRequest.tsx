
import React, { useState, useEffect } from 'react';
import { TransportRequest, VehicleType, VehicleRate, Driver, Client, ActivityType } from '../types';
import { Button, Input, Card, Icons, Select } from './Components';
import { estimateRoute } from '../services/geminiService';

interface NewRequestProps {
  rates: VehicleRate[];
  drivers: Driver[];
  clients: Client[];
  existingRequests: TransportRequest[];
  initialData?: TransportRequest; // Added for editing
  onSubmit: (request: Omit<TransportRequest, 'id' | 'createdAt' | 'status'>) => void;
  onCancel: () => void;
}

export const NewRequest: React.FC<NewRequestProps> = ({ rates, drivers, clients, existingRequests, initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    clientName: '',
    origin: '',
    destination: '',
    vehicleType: 'MOTO' as VehicleType,
    driverId: '',
    scheduledFor: '',
    activityType: 'ENTREGAR' as ActivityType,
    contactOnSite: '',
    observations: ''
  });

  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [isEstimating, setIsEstimating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Financials
  const [financials, setFinancials] = useState({ driverFee: 0, clientCharge: 0 });

  // Initialize Data (Edit Mode vs Create Mode)
  useEffect(() => {
    if (initialData) {
        // EDIT MODE: Populate fields
        setFormData({
            invoiceNumber: initialData.invoiceNumber,
            clientName: initialData.clientName,
            origin: initialData.origin,
            destination: initialData.destination,
            vehicleType: initialData.vehicleType,
            driverId: initialData.driverId || '',
            scheduledFor: initialData.scheduledFor || '',
            activityType: initialData.activityType || 'ENTREGAR',
            contactOnSite: initialData.contactOnSite || '',
            observations: initialData.observations || ''
        });
        setDistanceKm(initialData.distanceKm);
        setFinancials({
            driverFee: initialData.driverFee,
            clientCharge: initialData.clientCharge
        });
    } else {
        // CREATE MODE: Auto-Generate Invoice Number
        // Find highest invoice number with pattern "IBEC - XXX"
        const prefix = "IBEC - ";
        let maxNumber = 0;

        existingRequests.forEach(req => {
            if (req.invoiceNumber && req.invoiceNumber.startsWith(prefix)) {
                const numPart = req.invoiceNumber.replace(prefix, '');
                const num = parseInt(numPart, 10);
                if (!isNaN(num) && num > maxNumber) {
                    maxNumber = num;
                }
            }
        });

        const nextNumber = maxNumber + 1;
        const formattedInvoice = `${prefix}${String(nextNumber).padStart(3, '0')}`;
        
        setFormData(prev => ({ ...prev, invoiceNumber: formattedInvoice }));
    }
  }, [initialData, existingRequests]);

  // Recalculate costs based on distance and vehicle type
  useEffect(() => {
    // PRESERVE INITIAL VALUES ON LOAD:
    // If we are editing, and the current values match the initial values, 
    // do NOT recalculate. This allows manual price overrides from the DB to persist.
    if (initialData) {
        const isUnchanged = 
            initialData.vehicleType === formData.vehicleType && 
            initialData.distanceKm === distanceKm;
            
        // If critical fields haven't changed, and we have valid financials loaded, skip auto-calc
        if (isUnchanged && financials.driverFee !== 0) {
            return;
        }
    }

    const rate = rates.find(r => r.type === formData.vehicleType);
    
    // If no rate found, stop (fixes potential TS unused var issue if strictly typed logic fails)
    if (!rate) return;

    if (distanceKm > 0) {
      setFinancials({
        driverFee: parseFloat((rate.baseFee + (distanceKm * rate.costPerKm)).toFixed(2)),
        clientCharge: parseFloat((rate.baseFee + (distanceKm * rate.chargePerKm)).toFixed(2))
      });
    } else {
        // Minimum/Base fee showing if distance is 0
        setFinancials({
            driverFee: rate.baseFee,
            clientCharge: rate.baseFee
        });
    }
  }, [distanceKm, formData.vehicleType, rates]);

  // Reset driver selection when vehicle type changes (only if user changes it, not on load)
  useEffect(() => {
    if (initialData && formData.vehicleType === initialData.vehicleType) return;
    setFormData(prev => ({ ...prev, driverId: '' }));
  }, [formData.vehicleType]);

  const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedClientId = e.target.value;
      const client = clients.find(c => c.id === selectedClientId);
      
      if (client) {
          setFormData(prev => ({
              ...prev,
              clientName: client.name,
              origin: client.address, // Autofill origin with client address
              contactOnSite: client.contactName // Autofill contact
          }));
      }
  };

  const handleEstimate = async () => {
    if (!formData.origin || !formData.destination) {
      setError("Preencha origem e destino para estimar.");
      return;
    }
    setError(null);
    setIsEstimating(true);
    try {
      const result = await estimateRoute(formData.origin, formData.destination);
      if (result.distanceKm > 0) {
          setDistanceKm(result.distanceKm);
      } else {
          setError("Não foi possível calcular a rota. Verifique os endereços ou insira a distância manualmente.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Falha ao estimar distância. Verifique sua conexão ou insira manualmente.");
    } finally {
      setIsEstimating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!distanceKm) {
        setError("A distância deve ser maior que 0.");
        return;
    }
    onSubmit({
      ...formData,
      distanceKm,
      driverFee: financials.driverFee,
      clientCharge: financials.clientCharge
    });
  };

  const availableDrivers = drivers.filter(d => d.vehicleType === formData.vehicleType);
  const profitMargin = financials.clientCharge - financials.driverFee;

  return (
    <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
            <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
                &larr; Voltar
            </button>
            <h2 className="text-2xl font-bold text-gray-800">
                {initialData ? 'Editar Solicitação' : 'Nova Solicitação de Transporte'}
            </h2>
        </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Detalhes da Carga & Agendamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                    label="Número da Nota Fiscal" 
                    placeholder="IBEC - 001" 
                    value={formData.invoiceNumber}
                    onChange={e => setFormData({...formData, invoiceNumber: e.target.value})}
                    required
                />
                
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Selecionar Cliente (Opcional)</label>
                    <select
                        className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                        onChange={handleClientSelect}
                        defaultValue=""
                    >
                        <option value="" disabled>Escolha um cliente cadastrado...</option>
                        {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div className="md:col-span-2">
                    <Input 
                        label="Cliente / Destinatário" 
                        placeholder="Nome da empresa ou pessoa" 
                        value={formData.clientName}
                        onChange={e => setFormData({...formData, clientName: e.target.value})}
                        required
                    />
                </div>

                <Input 
                    label="Contato no Local" 
                    placeholder="Nome / Telefone" 
                    value={formData.contactOnSite}
                    onChange={e => setFormData({...formData, contactOnSite: e.target.value})}
                />

                <Select 
                    label="Tipo de Atividade"
                    value={formData.activityType}
                    onChange={e => setFormData({...formData, activityType: e.target.value as ActivityType})}
                >
                    <option value="ENTREGAR">Entregar</option>
                    <option value="COLETAR">Coletar</option>
                    <option value="COLETAR_ENTREGAR">Coletar e Entregar</option>
                    <option value="OUTROS">Outros</option>
                </Select>

                <div className="md:col-span-2">
                    <Input 
                        label="Data/Hora do Agendamento (Opcional)" 
                        type="datetime-local"
                        value={formData.scheduledFor}
                        onChange={e => setFormData({...formData, scheduledFor: e.target.value})}
                    />
                    <p className="text-xs text-gray-500 mt-1">Deixe em branco para saída imediata.</p>
                </div>

                 <div className="md:col-span-2 flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Observações</label>
                    <textarea 
                        className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[80px]"
                        placeholder="Instruções especiais, referência de endereço, etc."
                        value={formData.observations}
                        onChange={e => setFormData({...formData, observations: e.target.value})}
                    />
                </div>
            </div>
        </Card>

        <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Rota e Distância</h3>
            <div className="grid grid-cols-1 gap-4">
                <Input 
                    label="Endereço de Coleta (Origem)" 
                    placeholder="Rua, Número, Cidade" 
                    value={formData.origin}
                    onChange={e => setFormData({...formData, origin: e.target.value})}
                    required
                    onBlur={() => { if(formData.origin && formData.destination && distanceKm === 0) handleEstimate() }}
                />
                <Input 
                    label="Endereço de Entrega (Destino)" 
                    placeholder="Rua, Número, Cidade" 
                    value={formData.destination}
                    onChange={e => setFormData({...formData, destination: e.target.value})}
                    required
                    onBlur={() => { if(formData.origin && formData.destination && distanceKm === 0) handleEstimate() }}
                />
            </div>

            <div className="mt-4 flex flex-col sm:flex-row items-end gap-4">
                <div className="flex-1 w-full">
                     <label className="text-sm font-medium text-gray-700">Distância (KM)</label>
                     <div className="flex gap-2">
                        <input 
                            type="number" 
                            step="0.1" 
                            className="border border-gray-300 rounded-md px-3 py-2 w-full font-bold text-gray-800"
                            value={distanceKm}
                            onChange={e => setDistanceKm(parseFloat(e.target.value) || 0)}
                        />
                     </div>
                </div>
                <Button type="button" variant="secondary" onClick={handleEstimate} isLoading={isEstimating}>
                    <Icons.Wand /> Calcular via IA
                </Button>
            </div>
            {error && <p className="text-error text-sm mt-2 font-medium bg-red-50 p-2 rounded">{error}</p>}
        </Card>

        <Card className="p-6 bg-blue-50 border-blue-100">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 border-b border-blue-200 pb-2">Veículo e Valores</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Tipo de Veículo</label>
                        <div className="grid grid-cols-2 gap-2">
                            {rates.map(rate => (
                                <button
                                    type="button"
                                    key={rate.type}
                                    onClick={() => setFormData({...formData, vehicleType: rate.type})}
                                    className={`px-3 py-2 text-sm rounded-md border text-left transition-all ${
                                        formData.vehicleType === rate.type 
                                        ? 'bg-primary text-white border-primary shadow-md' 
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    {rate.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Select 
                            label="Motorista Responsável (Opcional)"
                            value={formData.driverId}
                            onChange={e => setFormData({...formData, driverId: e.target.value})}
                        >
                            <option value="">Selecione um motorista...</option>
                            {availableDrivers.map(driver => (
                                <option key={driver.id} value={driver.id}>
                                    {driver.name}
                                </option>
                            ))}
                        </Select>
                        {formData.driverId && (
                            <p className="text-xs text-green-600 mt-1">
                                * Um link de WhatsApp será gerado para o motorista ao salvar.
                            </p>
                        )}
                        {availableDrivers.length === 0 && (
                            <p className="text-xs text-orange-500 mt-1">Nenhum motorista disponível nesta categoria.</p>
                        )}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm flex flex-col justify-center space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                        <Input 
                            label="Valor Pagamento Motorista (R$)"
                            type="number"
                            step="0.01"
                            value={financials.driverFee}
                            onChange={e => setFinancials({...financials, driverFee: parseFloat(e.target.value) || 0})}
                        />
                        <Input 
                            label="Valor Cobrado Cliente (R$)"
                            type="number"
                            step="0.01"
                            value={financials.clientCharge}
                            onChange={e => setFinancials({...financials, clientCharge: parseFloat(e.target.value) || 0})}
                        />
                    </div>
                    <div className="text-xs text-gray-400 text-right pt-2 border-t mt-2 flex justify-between items-center">
                        <span>Margem Prevista:</span>
                        <span className={`font-bold text-sm ${profitMargin >= 0 ? "text-green-600" : "text-red-500"}`}>
                            R$ {profitMargin.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>
        </Card>

        <div className="flex justify-end gap-3 pt-4 pb-12">
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="submit">
                {initialData ? 'Salvar Alterações' : 'Cadastrar e Enviar'}
            </Button>
        </div>
      </form>
    </div>
  );
};
