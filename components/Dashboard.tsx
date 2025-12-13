
import React from 'react';
import { TransportRequest, RequestStatus, Driver, User } from '../types';
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
  
  // Filter Requests based on Role
  const filteredRequests = requests.filter(req => {
      if (currentUser.role === 'CLIENT' && currentUser.clientId) {
          // If User is Client, only show requests where clientName matches user name (or ID logic if implemented stricter)
          // For this implementation, we rely on the name matching or the clientId link
          return req.clientName === currentUser.name; 
      }
      return true; // Admin and Ops see all
  });

  const isClient = currentUser.role === 'CLIENT';

  // Stats
  const totalRequests = filteredRequests.length;
  const inProgress = filteredRequests.filter(r => r.status === 'EM_ANDAMENTO').length;
  const totalRevenue = filteredRequests.reduce((acc, r) => acc + r.clientCharge, 0);

  const getDriverName = (driverId?: string) => {
    if (!driverId) return 'Aguardando...';
    const driver = drivers.find(d => d.id === driverId);
    return driver ? driver.name : 'Desconhecido';
  };
  
  const handleDelete = (id: string, invoice: string) => {
    if (window.confirm(`Tem certeza que deseja remover a solicitação Nota Fiscal: ${invoice}?`)) {
        onDeleteRequest(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Painel de Controle</h1>
            <p className="text-gray-500">
                {isClient ? 'Minhas Solicitações' : 'Gerenciamento de frota e entregas'}
            </p>
        </div>
        <Button onClick={onNewRequest}>
            <Icons.Plus /> Nova Solicitação
        </Button>
      </div>

      {/* Stats Cards - Hide Revenue for Client */}
      <div className={`grid grid-cols-1 ${!isClient ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
        <Card className="p-5 flex flex-col justify-between border-l-4 border-l-primary">
            <span className="text-gray-500 text-sm font-medium uppercase">Total Solicitações</span>
            <span className="text-3xl font-bold text-gray-800 mt-2">{totalRequests}</span>
        </Card>
        <Card className="p-5 flex flex-col justify-between border-l-4 border-l-warning">
            <span className="text-gray-500 text-sm font-medium uppercase">Em Andamento</span>
            <span className="text-3xl font-bold text-gray-800 mt-2">{inProgress}</span>
        </Card>
        {!isClient && (
            <Card className="p-5 flex flex-col justify-between border-l-4 border-l-secondary">
                <span className="text-gray-500 text-sm font-medium uppercase">Faturamento Total</span>
                <span className="text-3xl font-bold text-gray-800 mt-2">R$ {totalRevenue.toFixed(2)}</span>
            </Card>
        )}
      </div>

      {/* List */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Solicitações Recentes</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th className="px-6 py-3">Nota / Cliente</th>
                        <th className="px-6 py-3">Rota</th>
                        <th className="px-6 py-3">Veículo / Motorista</th>
                        {!isClient && <th className="px-6 py-3">Valor</th>}
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredRequests.length === 0 ? (
                        <tr>
                            <td colSpan={isClient ? 5 : 6} className="px-6 py-10 text-center text-gray-400">
                                Nenhuma solicitação encontrada.
                            </td>
                        </tr>
                    ) : (
                        filteredRequests.map(request => (
                            <tr key={request.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">#{request.invoiceNumber}</div>
                                    <div className="text-xs">{request.clientName}</div>
                                </td>
                                <td className="px-6 py-4 max-w-xs">
                                    <div className="flex items-center gap-1 text-xs truncate" title={request.origin}>
                                        <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></span>
                                        {request.origin}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs truncate mt-1" title={request.destination}>
                                        <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></span>
                                        {request.destination}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <VehicleBadge type={request.vehicleType} />
                                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                        <Icons.Users />
                                        {getDriverName(request.driverId)}
                                    </div>
                                </td>
                                {!isClient && (
                                    <td className="px-6 py-4 font-mono font-medium text-gray-900">
                                        R$ {request.clientCharge.toFixed(2)}
                                    </td>
                                )}
                                <td className="px-6 py-4">
                                    <StatusBadge status={request.status} />
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end items-center gap-2">
                                    {/* Action buttons: Status changes usually done by Ops/Admin/Driver, not Client */}
                                    {!isClient && request.status === 'PENDENTE' && (
                                        <button 
                                            onClick={() => onUpdateStatus(request.id, 'EM_ANDAMENTO')}
                                            className="text-primary hover:underline font-medium text-xs"
                                        >
                                            Iniciar
                                        </button>
                                    )}
                                    {!isClient && request.status === 'EM_ANDAMENTO' && (
                                        <button 
                                            onClick={() => onUpdateStatus(request.id, 'CONCLUIDO')}
                                            className="text-secondary hover:underline font-medium text-xs"
                                        >
                                            Concluir
                                        </button>
                                    )}
                                    
                                    <button 
                                        onClick={() => handleDelete(request.id, request.invoiceNumber)}
                                        className="text-red-400 hover:text-red-600 p-1"
                                        title="Remover"
                                    >
                                        <Icons.Trash />
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
