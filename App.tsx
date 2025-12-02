
import React, { useState, useEffect } from 'react';
import { INITIAL_RATES, TransportRequest, VehicleRate, RequestStatus, Driver, Client, DriverExpense } from './types';
import { Dashboard } from './components/Dashboard';
import { NewRequest } from './components/NewRequest';
import { Settings } from './components/Settings';
import { Drivers } from './components/Drivers';
import { NewDriver } from './components/NewDriver';
import { Clients } from './components/Clients';
import { NewClient } from './components/NewClient';
import { Payroll } from './components/Payroll';
import { Reports } from './components/Reports';
import { Icons } from './components/Components';
import { DataManager } from './services/dataManager';

type ViewState = 'DASHBOARD' | 'NEW_REQUEST' | 'SETTINGS' | 'DRIVERS' | 'NEW_DRIVER' | 'CLIENTS' | 'NEW_CLIENT' | 'PAYROLL' | 'REPORTS';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [isLoading, setIsLoading] = useState(true);
  
  // Data State
  const [rates, setRates] = useState<VehicleRate[]>(INITIAL_RATES);
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [expenses, setExpenses] = useState<DriverExpense[]>([]);

  // Editing State
  const [editingDriver, setEditingDriver] = useState<Driver | undefined>(undefined);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);

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

  const handleCreateRequest = (data: Omit<TransportRequest, 'id' | 'createdAt' | 'status'>) => {
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

    // WhatsApp Integration Logic
    if (newRequest.driverId) {
        const driver = drivers.find(d => d.id === newRequest.driverId);
        if (driver && driver.phone) {
            // Remove non-digits
            const phone = driver.phone.replace(/\D/g, '');
            
            // Format Date
            const scheduledDate = newRequest.scheduledFor 
                ? new Date(newRequest.scheduledFor).toLocaleString('pt-BR') 
                : 'Imediato';

            const message = 
`*🚚 Nova Solicitação LogiTrack!*

👤 *Motorista:* ${driver.name}
📦 *Nota:* ${newRequest.invoiceNumber}

📍 *Retirada:* ${newRequest.origin}
🏁 *Entrega:* ${newRequest.destination}

📅 *Horário:* ${scheduledDate}
💰 *Valor:* R$ ${newRequest.driverFee.toFixed(2)}

⚠️ *Atenção:* Por favor, confirme o recebimento e compartilhe sua *Localização em Tempo Real* clicando no ícone de clipe/anexo do WhatsApp.`;

            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/55${phone}?text=${encodedMessage}`;
            
            // Open WhatsApp in new tab
            window.open(whatsappUrl, '_blank');
        }
    }
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2 font-bold text-primary text-xl">
             <Icons.Truck /> LogiTrack AI
        </div>
        {DataManager.isOnline && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div> Online
            </span>
        )}
      </div>

      {/* Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen sticky top-0 h-screen">
        <div className="p-6 border-b border-gray-100">
             <div className="flex items-center gap-2 font-bold text-primary text-2xl">
                 <Icons.Truck /> LogiTrack AI
             </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
            <button 
                onClick={() => setCurrentView('DASHBOARD')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${currentView === 'DASHBOARD' || currentView === 'NEW_REQUEST' ? 'bg-blue-50 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
            >
                <Icons.Home /> Dashboard
            </button>
            <button 
                onClick={() => setCurrentView('REPORTS')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${currentView === 'REPORTS' ? 'bg-blue-50 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
            >
                <Icons.BarChart /> Relatórios
            </button>
            <button 
                onClick={() => {
                    setCurrentView('DRIVERS');
                    setEditingDriver(undefined);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${currentView === 'DRIVERS' || currentView === 'NEW_DRIVER' ? 'bg-blue-50 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
            >
                <Icons.Users /> Motoristas
            </button>
            <button 
                onClick={() => {
                    setCurrentView('CLIENTS');
                    setEditingClient(undefined);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${currentView === 'CLIENTS' || currentView === 'NEW_CLIENT' ? 'bg-blue-50 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
            >
                <Icons.Building /> Clientes
            </button>
            <button 
                onClick={() => setCurrentView('PAYROLL')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${currentView === 'PAYROLL' ? 'bg-blue-50 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
            >
                <Icons.DollarSign /> Folha Pgto.
            </button>
            <button 
                onClick={() => setCurrentView('SETTINGS')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${currentView === 'SETTINGS' ? 'bg-blue-50 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
            >
                <Icons.Settings /> Configurações
            </button>
        </nav>
        <div className="p-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
            <span>v2.2 Cloud</span>
            {DataManager.isOnline ? (
                <span className="flex items-center gap-1 text-green-600 font-medium">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div> Sync On
                </span>
            ) : (
                <span className="flex items-center gap-1 text-gray-400">
                    <div className="w-2 h-2 rounded-full bg-gray-300"></div> Offline
                </span>
            )}
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 z-20">
            <button onClick={() => setCurrentView('DASHBOARD')} className={`flex flex-col items-center text-xs ${currentView === 'DASHBOARD' ? 'text-primary' : 'text-gray-500'}`}>
                <Icons.Home /> <span className="mt-1">Início</span>
            </button>
            <button onClick={() => setCurrentView('REPORTS')} className={`flex flex-col items-center text-xs ${currentView === 'REPORTS' ? 'text-primary' : 'text-gray-500'}`}>
                <Icons.BarChart /> <span className="mt-1">Relat.</span>
            </button>
            <button onClick={() => { setCurrentView('DRIVERS'); setEditingDriver(undefined); }} className={`flex flex-col items-center text-xs ${currentView === 'DRIVERS' ? 'text-primary' : 'text-gray-500'}`}>
                <Icons.Users /> <span className="mt-1">Mot.</span>
            </button>
            <button onClick={() => setCurrentView('PAYROLL')} className={`flex flex-col items-center text-xs ${currentView === 'PAYROLL' ? 'text-primary' : 'text-gray-500'}`}>
                <Icons.DollarSign /> <span className="mt-1">Folha</span>
            </button>
            <button onClick={() => setCurrentView('SETTINGS')} className={`flex flex-col items-center text-xs ${currentView === 'SETTINGS' ? 'text-primary' : 'text-gray-500'}`}>
                <Icons.Settings /> <span className="mt-1">Conf.</span>
            </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
            {currentView === 'DASHBOARD' && (
                <Dashboard 
                    requests={requests}
                    drivers={drivers}
                    onNewRequest={() => setCurrentView('NEW_REQUEST')}
                    onUpdateStatus={handleStatusUpdate}
                />
            )}
            {currentView === 'NEW_REQUEST' && (
                <NewRequest 
                    rates={rates}
                    drivers={drivers}
                    onSubmit={handleCreateRequest}
                    onCancel={() => setCurrentView('DASHBOARD')}
                />
            )}
            {currentView === 'DRIVERS' && (
                <Drivers 
                    drivers={drivers}
                    onNewDriver={() => {
                        setEditingDriver(undefined);
                        setCurrentView('NEW_DRIVER');
                    }}
                    onEditDriver={handleEditDriver}
                />
            )}
            {currentView === 'NEW_DRIVER' && (
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
            {currentView === 'CLIENTS' && (
                <Clients 
                    clients={clients}
                    onNewClient={() => {
                        setEditingClient(undefined);
                        setCurrentView('NEW_CLIENT');
                    }}
                    onEditClient={handleEditClient}
                />
            )}
            {currentView === 'NEW_CLIENT' && (
                <NewClient
                    initialData={editingClient}
                    onSubmit={handleSaveClient}
                    onCancel={() => {
                        setEditingClient(undefined);
                        setCurrentView('CLIENTS');
                    }}
                />
            )}
             {currentView === 'PAYROLL' && (
                <Payroll 
                    drivers={drivers}
                    requests={requests}
                    expenses={expenses}
                    onAddExpense={handleAddExpense}
                />
            )}
            {currentView === 'REPORTS' && (
                <Reports 
                    requests={requests}
                    clients={clients}
                />
            )}
            {currentView === 'SETTINGS' && (
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
