
import React from 'react';
import { Driver } from '../types';
import { Card, VehicleBadge, Icons, Button } from './Components';

interface DriversProps {
  drivers: Driver[];
  onNewDriver: () => void;
  onEditDriver: (driver: Driver) => void;
}

export const Drivers: React.FC<DriversProps> = ({ drivers, onNewDriver, onEditDriver }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Motoristas</h1>
            <p className="text-gray-500">Gestão de parceiros e veículos</p>
        </div>
        <Button onClick={onNewDriver}>
            <Icons.Plus /> Cadastrar Motorista
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Motoristas Cadastrados</h3>
            <span className="text-sm text-gray-500">{drivers.length} registros</span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th className="px-6 py-3">Nome / CPF</th>
                        <th className="px-6 py-3">Contato</th>
                        <th className="px-6 py-3">Endereço</th>
                        <th className="px-6 py-3">Veículo</th>
                        <th className="px-6 py-3">Cadastrado em</th>
                        <th className="px-6 py-3 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {drivers.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                                Nenhum motorista cadastrado.
                            </td>
                        </tr>
                    ) : (
                        drivers.map(driver => (
                            <tr key={driver.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{driver.name}</div>
                                    <div className="text-xs">{driver.cpf}</div>
                                </td>
                                <td className="px-6 py-4">
                                    {driver.phone}
                                </td>
                                <td className="px-6 py-4 max-w-xs truncate" title={driver.address}>
                                    {driver.address}
                                </td>
                                <td className="px-6 py-4">
                                    <VehicleBadge type={driver.vehicleType} />
                                    {(driver.model || driver.plate) && (
                                        <div className="mt-1 text-xs text-gray-600">
                                            {driver.model && <span>{driver.model} {driver.color ? `- ${driver.color}` : ''}</span>}
                                            {driver.plate && (
                                                <div className="font-mono bg-gray-100 inline-block px-1 rounded mt-0.5 border border-gray-200 text-gray-700 font-bold">
                                                    {driver.plate}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-400">
                                    {new Date(driver.createdAt).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                      onClick={() => onEditDriver(driver)}
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
