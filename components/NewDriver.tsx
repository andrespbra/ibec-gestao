
import React, { useState, useEffect } from 'react';
import { Driver, VehicleType, VehicleRate } from '../types';
import { Button, Input, Card } from './Components';

interface NewDriverProps {
  rates: VehicleRate[];
  initialData?: Driver;
  onSubmit: (driver: Omit<Driver, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export const NewDriver: React.FC<NewDriverProps> = ({ rates, initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    address: '',
    phone: '',
    vehicleType: 'MOTO' as VehicleType,
    plate: '',
    model: '',
    color: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        cpf: initialData.cpf,
        address: initialData.address,
        phone: initialData.phone,
        vehicleType: initialData.vehicleType,
        plate: initialData.plate || '',
        model: initialData.model || '',
        color: initialData.color || ''
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
            <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
                &larr; Voltar
            </button>
            <h2 className="text-2xl font-bold text-gray-800">
              {initialData ? 'Editar Motorista' : 'Cadastrar Novo Motorista'}
            </h2>
        </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Dados Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                    label="Nome Completo" 
                    placeholder="Ex: João Silva" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                />
                <Input 
                    label="CPF" 
                    placeholder="000.000.000-00" 
                    value={formData.cpf}
                    onChange={e => setFormData({...formData, cpf: e.target.value})}
                    required
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Input 
                    label="Telefone / WhatsApp" 
                    placeholder="(00) 00000-0000" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    required
                />
                <Input 
                    label="Endereço Residencial" 
                    placeholder="Rua, Número, Bairro" 
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    required
                />
            </div>
        </Card>

        <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Veículo de Trabalho</h3>
            
            <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 block mb-2">Categoria do Veículo</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {rates.map(rate => (
                        <button
                            type="button"
                            key={rate.type}
                            onClick={() => setFormData({...formData, vehicleType: rate.type})}
                            className={`px-3 py-3 text-sm rounded-md border text-center transition-all ${
                                formData.vehicleType === rate.type 
                                ? 'bg-primary text-white border-primary shadow-md font-medium' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            {rate.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input 
                    label="Modelo" 
                    placeholder="Ex: Honda CG 160 / Fiorino" 
                    value={formData.model}
                    onChange={e => setFormData({...formData, model: e.target.value})}
                />
                <Input 
                    label="Placa" 
                    placeholder="ABC-1234" 
                    value={formData.plate}
                    onChange={e => setFormData({...formData, plate: e.target.value.toUpperCase()})}
                />
                <Input 
                    label="Cor" 
                    placeholder="Ex: Branca" 
                    value={formData.color}
                    onChange={e => setFormData({...formData, color: e.target.value})}
                />
            </div>
        </Card>

        <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="submit">
              {initialData ? 'Salvar Alterações' : 'Cadastrar Motorista'}
            </Button>
        </div>
      </form>
    </div>
  );
};
