
import React from 'react';
import { Client } from '../types';
import { Card, Icons, Button } from './Components';

interface ClientsProps {
  clients: Client[];
  onNewClient: () => void;
  onEditClient: (client: Client) => void;
}

export const Clients: React.FC<ClientsProps> = ({ clients, onNewClient, onEditClient }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
            <p className="text-gray-500">Gestão de empresas e parceiros</p>
        </div>
        <Button onClick={onNewClient}>
            <Icons.Plus /> Novo Cliente
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Clientes Cadastrados</h3>
            <span className="text-sm text-gray-500">{clients.length} registros</span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th className="px-6 py-3">Empresa / CNPJ</th>
                        <th className="px-6 py-3">Centro de Custo</th>
                        <th className="px-6 py-3">Contato</th>
                        <th className="px-6 py-3">Endereço</th>
                        <th className="px-6 py-3">Faturamento</th>
                        <th className="px-6 py-3 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {clients.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                                Nenhum cliente cadastrado.
                            </td>
                        </tr>
                    ) : (
                        clients.map(client => (
                            <tr key={client.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{client.name}</div>
                                    <div className="text-xs">{client.cnpj}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-mono">
                                        {client.costCenter}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-gray-900">{client.contactName}</div>
                                    <div className="text-xs flex flex-col gap-0.5 mt-1">
                                        <span>{client.contactPhone}</span>
                                        <span className="text-primary">{client.contactEmail}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 max-w-xs truncate" title={client.address}>
                                    {client.address}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">Dia:</span>
                                        <span className="font-bold text-gray-800">{client.paymentDay}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                      onClick={() => onEditClient(client)}
                                      className="text-gray-500 hover:text-primary transition-colors p-1"
                                      title="Editar"
                                    >
                                      <Icons.Edit />
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
  );
};
