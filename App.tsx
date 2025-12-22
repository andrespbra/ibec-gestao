
import React, { useState, useEffect } from 'react';
import { INITIAL_RATES, TransportRequest, VehicleRate, RequestStatus, Driver, Client, DriverExpense, User, FixedContract } from './types';
import { Dashboard } from './components/Dashboard';
import { NewRequest } from './components/NewRequest';
import { Settings } from './components/Settings';
import { Drivers } from './components/Drivers';
import { NewDriver } from './components/NewDriver';
import { Clients } from './components/Clients';
import { NewClient } from './components/NewClient';
import { Payroll } from './components/Payroll';
import { Reports } from './components/Reports';
import { FixedContracts } from './components/FixedContracts';
import { Login } from './components/Login';
import { Icons } from './components/Components';
import { DataManager } from './services/dataManager';

type ViewState = 'DASHBOARD' | 'NEW_REQUEST' | 'SETTINGS' | 'DRIVERS' | 'NEW_DRIVER' | 'CLIENTS' | 'NEW_CLIENT' | 'PAYROLL' | 'REPORTS' | 'FIXED_CONTRACTS';

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
  const [fixedContracts, setFixedContracts] = useState<FixedContract[]>([]);

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
        
        const fixedData = await DataManager.fetchFixedData();
        setFixedContracts(fixedData.contracts);
        
        setIsLoading(false);
    };
    load();
  }, []);

  const handleSaveRequest = (data: Omit<TransportRequest, 'id' | 'createdAt' | 'status'>) => {
    if (editingRequest) {
        const updatedRequest: TransportRequest = { ...editingRequest, ...data };
        setRequests(requests.map(r => r.id === updatedRequest.id ? updatedRequest : r));
        DataManager.updateRequest(updatedRequest);
        setCurrentView('DASHBOARD');
        setEditingRequest(undefined);
    } else {
        const newRequest: TransportRequest = {
            ...data,
            id: Math.random().toString(36).substr(2, 9),
            status: 'PENDENTE',
            createdAt: new Date().toISOString()
        };
        setRequests([newRequest, ...requests]);
        DataManager.addRequest(newRequest);
        setCurrentView('DASHBOARD');
    }
  };

  const handleSaveDriver = (data: Omit<Driver, 'id' | 'createdAt'>) => {
    if (editingDriver) {
      const updated = { ...editingDriver, ...data };
      setDrivers(drivers.map(d => d.id === updated.id ? updated : d));
      DataManager.updateDriver(updated);
    } else {
      DataManager.addDriver(data);
      DataManager.fetchAllData().then(d => setDrivers(d.drivers));
    }
    setCurrentView('DRIVERS');
    setEditingDriver(undefined);
  };

  const handleSaveClient = (data: Omit<Client, 'id' | 'createdAt'>) => {
    if (editingClient) {
      const updated = { ...editingClient, ...data };
      setClients(clients.map(c => c.id === updated.id ? updated : c));
      DataManager.updateClient(updated);
    } else {
      DataManager.addClient(data);
      DataManager.fetchAllData().then(d => setClients(d.clients));
    }
    setCurrentView('CLIENTS');
    setEditingClient(undefined);
  };

  const handleAddFixedContract = (data: Omit<FixedContract, 'id' | 'createdAt'>) => {
    const newContract: FixedContract = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      staff: data.staff || []
    };
    const updated = [newContract, ...fixedContracts];
    setFixedContracts(updated);
    DataManager.addFixedContract(newContract);
  };

  const handleUpdateFixedContract = (updatedContract: FixedContract) => {
    const updatedList = fixedContracts.map(c => c.id === updatedContract.id ? updatedContract : c);
    setFixedContracts(updatedList);
    DataManager.updateFixedContract(updatedContract);
  };

  const handleDeleteFixedContract = (id: string) => {
    if (window.confirm('Excluir este contrato permanentemente?')) {
      const updatedList = fixedContracts.filter(c => c.id !== id);
      setFixedContracts(updatedList);
      DataManager.deleteFixedContract(id);
    }
  };

  const handleStatusUpdate = (id: string, newStatus: RequestStatus) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
    DataManager.updateRequestStatus(id, newStatus, requests);
  };

  if (isLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-500 font-medium">Carregando CRM IBEC...</p>
              </div>
          </div>
      );
  }

  if (!currentUser) {
    return <Login onLogin={(user) => setCurrentUser(user)} />;
  }

  const canAccessReports = currentUser.role === 'ADMIN' || currentUser.role === 'OPERATIONAL';
  // FIX: Only ADMIN can access Fixed Contracts
  const canAccessFixed = currentUser.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row">
      <div className="md:hidden bg-primary shadow-lg p-4 flex justify-between items-center sticky top-0 z-40 text-white">
        <div className="flex items-center gap-2 font-bold text-xl">
             <img src="https://ibecexpress.com.br/wp-content/uploads/2022/09/cropped-fotologo.png" alt="Logo" className="h-8 w-auto bg-white/20 rounded p-0.5" />
             CRM IBEC
        </div>
        <button onClick={() => setCurrentUser(null)} className="text-blue-100 hover:text-white"><Icons.Home /></button>
      </div>

      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen sticky top-0 h-screen shadow-sm z-30">
        <div className="p-6 border-b border-gray-100 flex flex-col items-center">
             <img src="https://ibecexpress.com.br/wp-content/uploads/2022/09/cropped-fotologo.png" alt="CRM IBEC" className="h-14 w-auto object-contain" />
             <span className="font-extrabold text-primary text-xl tracking-tight mt-2">CRM IBEC</span>
             <div className="mt-2 text-[10px] text-secondary uppercase font-bold tracking-widest bg-orange-50 px-2 py-0.5 rounded-full">{currentUser.role}</div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
            <button onClick={() => setCurrentView('DASHBOARD')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${currentView === 'DASHBOARD' ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}><Icons.Home /> Dashboard</button>
            {canAccessReports && <button onClick={() => setCurrentView('REPORTS')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${currentView === 'REPORTS' ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}><Icons.BarChart /> Relatórios</button>}
            {canAccessFixed && <button onClick={() => setCurrentView('FIXED_CONTRACTS')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${currentView === 'FIXED_CONTRACTS' ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}><Icons.Building /> Contratos Fixos</button>}
            <button onClick={() => setCurrentView('DRIVERS')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${currentView === 'DRIVERS' ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}><Icons.Users /> Motoristas</button>
            <button onClick={() => setCurrentView('CLIENTS')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${currentView === 'CLIENTS' ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}><Icons.Building /> Clientes</button>
            <button onClick={() => setCurrentView('PAYROLL')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${currentView === 'PAYROLL' ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}><Icons.DollarSign /> Folha Pgto.</button>
            {currentUser.role === 'ADMIN' && <button onClick={() => setCurrentView('SETTINGS')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${currentView === 'SETTINGS' ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}><Icons.Settings /> Configurações</button>}
        </nav>
        <div className="p-4 border-t border-gray-100">
            <button onClick={() => setCurrentUser(null)} className="w-full text-left px-4 text-gray-500 hover:text-red-500 font-medium">Sair do Sistema</button>
        </div>
      </aside>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center px-2 py-2 z-50 overflow-x-auto gap-2">
            <button onClick={() => setCurrentView('DASHBOARD')} className={`flex-shrink-0 min-w-[64px] flex flex-col items-center p-1 ${currentView === 'DASHBOARD' ? 'text-primary' : 'text-gray-400'}`}><Icons.Home /><span className="text-[10px]">Início</span></button>
            {canAccessReports && <button onClick={() => setCurrentView('REPORTS')} className={`flex-shrink-0 min-w-[64px] flex flex-col items-center p-1 ${currentView === 'REPORTS' ? 'text-primary' : 'text-gray-400'}`}><Icons.BarChart /><span className="text-[10px]">Relat.</span></button>}
            {canAccessFixed && <button onClick={() => setCurrentView('FIXED_CONTRACTS')} className={`flex-shrink-0 min-w-[64px] flex flex-col items-center p-1 ${currentView === 'FIXED_CONTRACTS' ? 'text-primary' : 'text-gray-400'}`}><Icons.Building /><span className="text-[10px]">Fixos</span></button>}
            <button onClick={() => setCurrentView('DRIVERS')} className={`flex-shrink-0 min-w-[64px] flex flex-col items-center p-1 ${currentView === 'DRIVERS' ? 'text-primary' : 'text-gray-400'}`}><Icons.Users /><span className="text-[10px]">Mot.</span></button>
            <button onClick={() => setCurrentView('PAYROLL')} className={`flex-shrink-0 min-w-[64px] flex flex-col items-center p-1 ${currentView === 'PAYROLL' ? 'text-primary' : 'text-gray-400'}`}><Icons.DollarSign /><span className="text-[10px]">Folha</span></button>
      </div>

      <main className="flex-1 p-4 md:p-8 pb-24 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
            {currentView === 'DASHBOARD' && <Dashboard requests={requests} drivers={drivers} currentUser={currentUser} onNewRequest={() => setCurrentView('NEW_REQUEST')} onUpdateStatus={handleStatusUpdate} onDeleteRequest={(id) => DataManager.deleteRequest(id)} />}
            {currentView === 'FIXED_CONTRACTS' && canAccessFixed && <FixedContracts contracts={fixedContracts} onAddContract={handleAddFixedContract} onUpdateContract={handleUpdateFixedContract} onDeleteContract={handleDeleteFixedContract} />}
            {currentView === 'NEW_REQUEST' && <NewRequest rates={rates} drivers={drivers} clients={clients} existingRequests={requests} initialData={editingRequest} currentUser={currentUser} onSubmit={handleSaveRequest} onCancel={() => { setCurrentView('DASHBOARD'); setEditingRequest(undefined); }} />}
            {currentView === 'DRIVERS' && <Drivers drivers={drivers} onNewDriver={() => setCurrentView('NEW_DRIVER')} onEditDriver={(d) => { setEditingDriver(d); setCurrentView('NEW_DRIVER'); }} />}
            {currentView === 'NEW_DRIVER' && <NewDriver rates={rates} initialData={editingDriver} onSubmit={handleSaveDriver} onCancel={() => { setCurrentView('DRIVERS'); setEditingDriver(undefined); }} />}
            {currentView === 'CLIENTS' && <Clients clients={clients} onNewClient={() => setCurrentView('NEW_CLIENT')} onEditClient={(c) => { setEditingClient(c); setCurrentView('NEW_CLIENT'); }} />}
            {currentView === 'NEW_CLIENT' && <NewClient initialData={editingClient} onSubmit={handleSaveClient} onCancel={() => { setCurrentView('CLIENTS'); setEditingClient(undefined); }} />}
            {currentView === 'PAYROLL' && <Payroll drivers={drivers} requests={requests} expenses={expenses} onAddExpense={(e: Omit<DriverExpense, 'id'>) => { DataManager.addExpense(e); }} />}
            {currentView === 'REPORTS' && <Reports requests={requests} clients={clients} onEditRequest={(r) => { setEditingRequest(r); setCurrentView('NEW_REQUEST'); }} onDeleteRequest={(id) => DataManager.deleteRequest(id)} onPaymentUpdate={(id, d) => DataManager.updateRequest({...requests.find(r => r.id === id)!, paymentDate: d})} />}
            {currentView === 'SETTINGS' && <Settings rates={rates} onUpdateRate={(r) => DataManager.updateRate(r)} />}
        </div>
      </main>
    </div>
  );
};

export default App;
