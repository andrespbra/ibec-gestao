
import React, { useState, useEffect } from 'react';
import { Client } from '../types';
import { Button, Input, Card } from './Components';

interface NewClientProps {
  initialData?: Client;
  onSubmit: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export const NewClient: React.FC<NewClientProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    address: '',
    costCenter: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    paymentDay: 10
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        cnpj: initialData.cnpj,
        address: initialData.address,
        costCenter: initialData.costCenter,
        contactName: initialData.contactName,
        contactPhone: initialData.contactPhone,
        contactEmail: initialData.contactEmail,
        paymentDay: initialData.paymentDay
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
              {initialData ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
            </h2>
        </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Dados da Empresa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                    label="Razão Social / Nome Fantasia" 
                    placeholder="Ex: Minha Empresa Ltda" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                />
                <Input 
                    label="CNPJ" 
                    placeholder="00.000.000/0000-00" 
                    value={formData.cnpj}
                    onChange={e => setFormData({...formData, cnpj: e.target.value})}
                    required
                />
                <Input 
                    label="Endereço Completo" 
                    placeholder="Rua, Número, Bairro, Cidade - UF" 
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    required
                />
                <Input 
                    label="Centro de Custo" 
                    placeholder="Ex: LOG-001" 
                    value={formData.costCenter}
                    onChange={e => setFormData({...formData, costCenter: e.target.value})}
                    required
                />
            </div>
        </Card>

        <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Contato Responsável</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                    label="Nome do Contato" 
                    placeholder="Ex: Maria Santos" 
                    value={formData.contactName}
                    onChange={e => setFormData({...formData, contactName: e.target.value})}
                    required
                />
                <Input 
                    label="Telefone / Celular" 
                    placeholder="(00) 00000-0000" 
                    value={formData.contactPhone}
                    onChange={e => setFormData({...formData, contactPhone: e.target.value})}
                    required
                />
                <div className="md:col-span-2">
                    <Input 
                        label="E-mail" 
                        type="email"
                        placeholder="contato@empresa.com.br" 
                        value={formData.contactEmail}
                        onChange={e => setFormData({...formData, contactEmail: e.target.value})}
                        required
                    />
                </div>
            </div>
        </Card>

        <Card className="p-6">
             <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Faturamento</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                    label="Dia de Pagamento Preferencial" 
                    type="number"
                    min="1" max="31"
                    value={formData.paymentDay}
                    onChange={e => setFormData({...formData, paymentDay: parseInt(e.target.value) || 10})}
                    required
                />
                <div className="flex items-center text-sm text-gray-500 pt-6">
                    Define o dia de vencimento das faturas mensais.
                </div>
             </div>
        </Card>

        <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="submit">
              {initialData ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </Button>
        </div>
      </form>
    </div>
  );
};
