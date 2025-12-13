
import React, { useState, useEffect } from 'react';
import { INITIAL_RATES, TransportRequest, VehicleRate, RequestStatus, Driver, Client, DriverExpense, User } from './types';
import { Dashboard } from './components/Dashboard';
import { NewRequest } from './components/NewRequest';
import { Settings } from './components/Settings';
import { Drivers } from './components/Drivers';
import { NewDriver } from './components/NewDriver';
import { Clients } from './components/Clients';
import { NewClient } from './components/NewClient';
import { Payroll } from './components/Payroll';
import { Reports } from './components/Reports';
import { Login } from './components/Login';
import { Icons } from './components/Components';
import { DataManager } from './services/dataManager';

type ViewState = 'DASHBOARD' | 'NEW_REQUEST' | 'SETTINGS' | 'DRIVERS' | 'NEW_DRIVER' | 'CLIENTS' | 'NEW_CLIENT' | 'PAYROLL' | 'REPORTS';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Data State
  const [rates, setRates] = useState<VehicleRate[]>(INITIAL_RATES);
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [expenses, setExpenses] = useState<DriverExpense[]>([]);

  // Editing State
  const [editingDriver, setEditingDriver] = useState<Driver | undefined>(undefined);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
  const [editingRequest, setEditingRequest] = useState<TransportRequest | undefined>(undefined);

  // Load Data on Mount
  useEffect(() => {
    const load = async () => {
        setIsLoading(true);
        const data = await DataManager.fetchAllData();
        setRates(data.rates);
        setRequests(data.requests);
        setDrivers(data.drivers);
        setClients(data.clients);
        setExpenses(data.expenses);
        setIsLoading(false);
    };
    load();
  }, []);

  const handleSaveRequest = (data: Omit<TransportRequest, 'id' | 'createdAt' | 'status'>) => {
    if (editingRequest) {
        // UPDATE Existing
        const updatedRequest: TransportRequest = {
            ...editingRequest,
            ...data
        };
        // Optimistic Update
        setRequests(requests.map(r => r.id === updatedRequest.id ? updatedRequest : r));
        DataManager.updateRequest(updatedRequest);
        setCurrentView('DASHBOARD'); // Go back to dashboard (or previous view)
        setEditingRequest(undefined);
    } else {
        // CREATE New
        const newRequest: TransportRequest = {
            ...data,
            id: Math.random().toString(36).substr(2, 9),
            status: 'PENDENTE',
            createdAt: new Date().toISOString()
        };
        
        // Optimistic Update
        setRequests([newRequest, ...requests]);
        DataManager.addRequest(newRequest);
        setCurrentView('DASHBOARD');

        // WhatsApp Integration Logic (Only for Admin/Ops, usually)
        if (newRequest.driverId) {
            const driver = drivers.find(d => d.id === newRequest.driverId);
            if (driver && driver.phone) {
                const phone = driver.phone.replace(/\D/g, '');
                const scheduledDate = newRequest.scheduledFor 
                    ? new Date(newRequest.scheduledFor).toLocaleString('pt-BR') 
                    : 'Imediato';
                
                const activityMap: Record<string, string> = {
                    'ENTREGAR': 'Entregar',
                    'COLETAR': 'Coletar',
                    'COLETAR_ENTREGAR': 'Coletar e Entregar',
                    'OUTROS': 'Outros'
                };
                const activity = newRequest.activityType ? activityMap[newRequest.activityType] : 'Entregar';

                const message = 
`*🚚 Nova Solicitação CRM IBEC!*

👤 *Motorista:* ${driver.name}
📦 *Nota:* ${newRequest.invoiceNumber}

📝 *Atividade:* ${activity}
📍 *Retirada:* ${newRequest.origin}
🏁 *Entrega:* ${newRequest.destination}

📞 *Contato Local:* ${newRequest.contactOnSite || 'N/A'}
📋 *Obs:* ${newRequest.observations || 'N/A'}

📅 *Horário:* ${scheduledDate}
💰 *Valor:* R$ ${newRequest.driverFee.toFixed(2)}

⚠️ *Atenção:* Por favor, confirme o recebimento e compartilhe sua *Localização em Tempo Real* clicando no ícone de clipe/anexo do WhatsApp.`;

                const encodedMessage = encodeURIComponent(message);
                const whatsappUrl = `https://wa.me/55${phone}?text=${encodedMessage}`;
                window.open(whatsappUrl, '_blank');
            }
        }
    }
  };

  const handleEditRequest = (request: TransportRequest) => {
    setEditingRequest(request);
    setCurrentView('NEW_REQUEST');
  };

  const handleDeleteRequest = (id: string) => {
      // Optimistic update
      setRequests(requests.filter(r => r.id !== id));
      DataManager.deleteRequest(id);
  };

  const handleSaveDriver = (data: Omit<Driver, 'id' | 'createdAt'>) => {
      if (editingDriver) {
        // Update existing driver
        const updatedDriver: Driver = {
            ...editingDriver,
            ...data
        };
        setDrivers(drivers.map(d => d.id === updatedDriver.id ? updatedDriver : d));
        DataManager.updateDriver(updatedDriver);
      } else {
        // Create new driver
        const newDriver: Driver = {
            ...data,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString()
        };
        setDrivers([newDriver, ...drivers]);
        DataManager.addDriver(newDriver);
      }
      setEditingDriver(undefined);
      setCurrentView('DRIVERS');
  };

  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver);
    setCurrentView('NEW_DRIVER');
  };

  const handleSaveClient = (data: Omit<Client, 'id' | 'createdAt'>) => {
    if (editingClient) {
        // Update existing client
        const updatedClient: Client = {
            ...editingClient,
            ...data
        };
        setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
        DataManager.updateClient(updatedClient);
    } else {
        // Create new client
        const newClient: Client = {
            ...data,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString()
        };
        setClients([newClient, ...clients]);
        DataManager.addClient(newClient);
    }
    setEditingClient(undefined);
    setCurrentView('CLIENTS');
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setCurrentView('NEW_CLIENT');
  };

  const handleAddExpense = (data: Omit<DriverExpense, 'id'>) => {
      const newExpense: DriverExpense = {
          ...data,
          id: Math.random().toString(36).substr(2, 9)
      };
      setExpenses([newExpense, ...expenses]);
      DataManager.addExpense(newExpense);
  };

  const handleStatusUpdate = (id: string, newStatus: RequestStatus) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
    DataManager.updateRequestStatus(id, newStatus, requests);
  };

  const handleRateUpdate = (updatedRate: VehicleRate) => {
      setRates(rates.map(r => r.type === updatedRate.type ? updatedRate : r));
      DataManager.updateRate(updatedRate);
  };

  if (isLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-500 font-medium">Carregando dados...</p>
              </div>
          </div>
      );
  }

  // --- LOGIN GUARD ---
  if (!currentUser) {
    return <Login onLogin={(user) => setCurrentUser(user)} />;
  }

  // --- PERMISSIONS CHECK ---
  const canAccessDrivers = currentUser.role === 'ADMIN' || currentUser.role === 'OPERATIONAL';
  const canAccessClients = currentUser.role === 'ADMIN' || currentUser.role === 'OPERATIONAL';
  const canAccessReports = currentUser.role === 'ADMIN';
  const canAccessPayroll = currentUser.role === 'ADMIN';
  const canAccessSettings = currentUser.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-primary shadow-lg p-4 flex justify-between items-center sticky top-0 z-10 text-white">
        <div className="flex items-center gap-2 font-bold text-xl">
             <Icons.Truck /> CRM IBEC
        </div>
        <div className="flex items-center gap-2">
            <span className="text-xs text-blue-100">{currentUser.name}</span>
            <button onClick={() => setCurrentUser(null)} className="text-blue-100 hover:text-white">
                <Icons.Home />
            </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen sticky top-0 h-screen shadow-sm">
        <div className="p-6 border-b border-gray-100 flex flex-col items-center">
             {/* Logo / Brand */}
             <div className="flex items-center gap-2 font-extrabold text-primary text-2xl tracking-tight">
                 <Icons.Truck /> CRM IBEC
             </div>
             <div className="mt-2 text-[10px] text-secondary uppercase font-bold tracking-widest bg-orange-50 px-2 py-0.5 rounded-full">
                {currentUser.role}
             </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
            <button 
                onClick={() => {
                    setCurrentView('DASHBOARD');
                    setEditingRequest(undefined);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    currentView === 'DASHBOARD' || (currentView === 'NEW_REQUEST' && !editingRequest) 
                    ? 'bg-primary text-white shadow-md shadow-primary/20' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                }`}
            >
                <Icons.Home /> Dashboard
            </button>
            
            {canAccessReports && (
                <button 
                    onClick={() => {
                        setCurrentView('REPORTS');
                        setEditingRequest(undefined);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                        currentView === 'REPORTS' || (currentView === 'NEW_REQUEST' && editingRequest) 
                        ? 'bg-primary text-white shadow-md shadow-primary/20' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                    }`}
                >
                    <Icons.BarChart /> Relatórios
                </button>
            )}

            {canAccessDrivers && (
                <button 
                    onClick={() => {
                        setCurrentView('DRIVERS');
                        setEditingDriver(undefined);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                        currentView === 'DRIVERS' || currentView === 'NEW_DRIVER' 
                        ? 'bg-primary text-white shadow-md shadow-primary/20' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                    }`}
                >
                    <Icons.Users /> Motoristas
                </button>
            )}

            {canAccessClients && (
                <button 
                    onClick={() => {
                        setCurrentView('CLIENTS');
                        setEditingClient(undefined);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                        currentView === 'CLIENTS' || currentView === 'NEW_CLIENT' 
                        ? 'bg-primary text-white shadow-md shadow-primary/20' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                    }`}
                >
                    <Icons.Building /> Clientes
                </button>
            )}

            {canAccessPayroll && (
                <button 
                    onClick={() => setCurrentView('PAYROLL')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                        currentView === 'PAYROLL' 
                        ? 'bg-primary text-white shadow-md shadow-primary/20' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                    }`}
                >
                    <Icons.DollarSign /> Folha Pgto.
                </button>
            )}

            {canAccessSettings && (
                <button 
                    onClick={() => setCurrentView('SETTINGS')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                        currentView === 'SETTINGS' 
                        ? 'bg-primary text-white shadow-md shadow-primary/20' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                    }`}
                >
                    <Icons.Settings /> Configurações
                </button>
            )}
        </nav>
        <div className="p-4 border-t border-gray-100">
            <button 
                onClick={() => setCurrentUser(null)}
                className="w-full flex items-center gap-2 text-gray-500 hover:text-secondary transition-colors mb-4 pl-2"
            >
                <span className="text-sm font-medium">Sair do Sistema</span>
            </button>

            <div className="flex justify-between items-center text-xs text-gray-400">
                <span>v3.1 CRM</span>
                {DataManager.isOnline ? (
                    <span className="flex items-center gap-1 text-green-600 font-medium">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div> Online
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-gray-400">
                        <div className="w-2 h-2 rounded-full bg-gray-300"></div> Offline
                    </span>
                )}
            </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <button onClick={() => setCurrentView('DASHBOARD')} className={`flex flex-col items-center text-xs ${currentView === 'DASHBOARD' ? 'text-primary' : 'text-gray-400'}`}>
                <Icons.Home /> <span className="mt-1">Início</span>
            </button>
            {canAccessReports && (
                <button onClick={() => setCurrentView('REPORTS')} className={`flex flex-col items-center text-xs ${currentView === 'REPORTS' ? 'text-primary' : 'text-gray-400'}`}>
                    <Icons.BarChart /> <span className="mt-1">Relat.</span>
                </button>
            )}
            {canAccessDrivers && (
                <button onClick={() => { setCurrentView('DRIVERS'); setEditingDriver(undefined); }} className={`flex flex-col items-center text-xs ${currentView === 'DRIVERS' ? 'text-primary' : 'text-gray-400'}`}>
                    <Icons.Users /> <span className="mt-1">Mot.</span>
                </button>
            )}
             {canAccessPayroll && (
                <button onClick={() => setCurrentView('PAYROLL')} className={`flex flex-col items-center text-xs ${currentView === 'PAYROLL' ? 'text-primary' : 'text-gray-400'}`}>
                    <Icons.DollarSign /> <span className="mt-1">Folha</span>
                </button>
            )}
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
            {currentView === 'DASHBOARD' && (
                <Dashboard 
                    requests={requests}
                    drivers={drivers}
                    currentUser={currentUser}
                    onNewRequest={() => {
                        setEditingRequest(undefined);
                        setCurrentView('NEW_REQUEST');
                    }}
                    onUpdateStatus={handleStatusUpdate}
                    onDeleteRequest={handleDeleteRequest}
                />
            )}
            {currentView === 'NEW_REQUEST' && (
                <NewRequest 
                    rates={rates}
                    drivers={drivers}
                    clients={clients}
                    existingRequests={requests}
                    initialData={editingRequest}
                    currentUser={currentUser}
                    onSubmit={handleSaveRequest}
                    onCancel={() => {
                        if (editingRequest) {
                            // If editing, logic depends on who is editing. Admin might be in Reports.
                            // Client/Ops usually in Dashboard.
                            setCurrentView(canAccessReports ? 'REPORTS' : 'DASHBOARD');
                        } else {
                            setCurrentView('DASHBOARD');
                        }
                        setEditingRequest(undefined);
                    }}
                />
            )}
            {currentView === 'DRIVERS' && canAccessDrivers && (
                <Drivers 
                    drivers={drivers}
                    onNewDriver={() => {
                        setEditingDriver(undefined);
                        setCurrentView('NEW_DRIVER');
                    }}
                    onEditDriver={handleEditDriver}
                />
            )}
            {currentView === 'NEW_DRIVER' && canAccessDrivers && (
                <NewDriver
                    rates={rates}
                    initialData={editingDriver}
                    onSubmit={handleSaveDriver}
                    onCancel={() => {
                        setEditingDriver(undefined);
                        setCurrentView('DRIVERS');
                    }}
                />
            )}
            {currentView === 'CLIENTS' && canAccessClients && (
                <Clients 
                    clients={clients}
                    onNewClient={() => {
                        setEditingClient(undefined);
                        setCurrentView('NEW_CLIENT');
                    }}
                    onEditClient={handleEditClient}
                />
            )}
            {currentView === 'NEW_CLIENT' && canAccessClients && (
                <NewClient
                    initialData={editingClient}
                    onSubmit={handleSaveClient}
                    onCancel={() => {
                        setEditingClient(undefined);
                        setCurrentView('CLIENTS');
                    }}
                />
            )}
             {currentView === 'PAYROLL' && canAccessPayroll && (
                <Payroll 
                    drivers={drivers}
                    requests={requests}
                    expenses={expenses}
                    onAddExpense={handleAddExpense}
                />
            )}
            {currentView === 'REPORTS' && canAccessReports && (
                <Reports 
                    requests={requests}
                    clients={clients}
                    onEditRequest={handleEditRequest}
                    onDeleteRequest={handleDeleteRequest}
                />
            )}
            {currentView === 'SETTINGS' && canAccessSettings && (
                <Settings 
                    rates={rates}
                    onUpdateRate={handleRateUpdate}
                />
            )}
        </div>
      </main>
    </div>
  );
};

export default App;
