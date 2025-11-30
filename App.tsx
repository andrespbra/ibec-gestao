
import React, { useState } from 'react';
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

type ViewState = 'DASHBOARD' | 'NEW_REQUEST' | 'SETTINGS' | 'DRIVERS' | 'NEW_DRIVER' | 'CLIENTS' | 'NEW_CLIENT' | 'PAYROLL' | 'REPORTS';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [rates, setRates] = useState<VehicleRate[]>(INITIAL_RATES);
  
  // Data - Initialized as empty for fresh system usage
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [expenses, setExpenses] = useState<DriverExpense[]>([]);

  const handleCreateRequest = (data: Omit<TransportRequest, 'id' | 'createdAt' | 'status'>) => {
    const newRequest: TransportRequest = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      status: 'PENDENTE',
      createdAt: new Date().toISOString()
    };
    setRequests([newRequest, ...requests]);
    setCurrentView('DASHBOARD');
  };

  const handleCreateDriver = (data: Omit<Driver, 'id' | 'createdAt'>) => {
      const newDriver: Driver = {
          ...data,
          id: Math.random().toString(36).substr(2, 9),
          createdAt: new Date().toISOString()
      };
      setDrivers([newDriver, ...drivers]);
      setCurrentView('DRIVERS');
  };

  const handleCreateClient = (data: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString()
    };
    setClients([newClient, ...clients]);
    setCurrentView('CLIENTS');
  };

  const handleAddExpense = (data: Omit<DriverExpense, 'id'>) => {
      const newExpense: DriverExpense = {
          ...data,
          id: Math.random().toString(36).substr(2, 9)
      };
      setExpenses([newExpense, ...expenses]);
  };

  const handleStatusUpdate = (id: string, newStatus: RequestStatus) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  const handleRateUpdate = (updatedRate: VehicleRate) => {
      setRates(rates.map(r => r.type === updatedRate.type ? updatedRate : r));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2 font-bold text-primary text-xl">
             <Icons.Truck /> LogiTrack AI
        </div>
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
                onClick={() => setCurrentView('DRIVERS')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${currentView === 'DRIVERS' || currentView === 'NEW_DRIVER' ? 'bg-blue-50 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
            >
                <Icons.Users /> Motoristas
            </button>
            <button 
                onClick={() => setCurrentView('CLIENTS')}
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
        <div className="p-4 border-t border-gray-100 text-xs text-gray-400">
            v1.5.0 Stable
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
            <button onClick={() => setCurrentView('DRIVERS')} className={`flex flex-col items-center text-xs ${currentView === 'DRIVERS' ? 'text-primary' : 'text-gray-500'}`}>
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
                    onNewDriver={() => setCurrentView('NEW_DRIVER')}
                />
            )}
            {currentView === 'NEW_DRIVER' && (
                <NewDriver
                    rates={rates}
                    onSubmit={handleCreateDriver}
                    onCancel={() => setCurrentView('DRIVERS')}
                />
            )}
            {currentView === 'CLIENTS' && (
                <Clients 
                    clients={clients}
                    onNewClient={() => setCurrentView('NEW_CLIENT')}
                />
            )}
            {currentView === 'NEW_CLIENT' && (
                <NewClient
                    onSubmit={handleCreateClient}
                    onCancel={() => setCurrentView('CLIENTS')}
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
