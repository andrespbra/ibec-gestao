import React from 'react';
import { VehicleRate } from '../types';
import { Card, Input, Button, Icons } from './Components';

interface SettingsProps {
    rates: VehicleRate[];
    onUpdateRate: (newRate: VehicleRate) => void;
}

export const Settings: React.FC<SettingsProps> = ({ rates, onUpdateRate }) => {
    
    const handleRateChange = (vehicleType: string, field: keyof VehicleRate, value: string) => {
        const rate = rates.find(r => r.type === vehicleType);
        if (rate) {
            onUpdateRate({
                ...rate,
                [field]: parseFloat(value) || 0
            });
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Configuração de Tabela de Preços</h2>
            <p className="text-gray-600">Defina os valores base e custo por KM para cada tipo de veículo.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rates.map(rate => (
                    <Card key={rate.type} className="p-5">
                        <div className="flex items-center gap-3 mb-4 border-b pb-2">
                             <div className="p-2 bg-blue-50 rounded-lg text-primary">
                                <Icons.Truck />
                             </div>
                             <h3 className="font-bold text-lg">{rate.label}</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Input 
                                    label="Taxa Base (R$)"
                                    type="number" step="0.50"
                                    value={rate.baseFee}
                                    onChange={(e) => handleRateChange(rate.type, 'baseFee', e.target.value)}
                                />
                                <div className="text-xs text-gray-400 flex items-end pb-2">Valor inicial da corrida</div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input 
                                    label="Custo/KM (Motorista)"
                                    type="number" step="0.10"
                                    value={rate.costPerKm}
                                    onChange={(e) => handleRateChange(rate.type, 'costPerKm', e.target.value)}
                                />
                                <Input 
                                    label="Cobrança/KM (Cliente)"
                                    type="number" step="0.10"
                                    value={rate.chargePerKm}
                                    onChange={(e) => handleRateChange(rate.type, 'chargePerKm', e.target.value)}
                                />
                            </div>
                            
                            <div className="bg-gray-50 p-3 rounded text-xs text-gray-500">
                                Exemplo 10km: R$ {(rate.baseFee + (10 * rate.chargePerKm)).toFixed(2)} (Cliente)
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};
