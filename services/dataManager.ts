
import { TransportRequest, DriverExpense, VehicleRate, INITIAL_RATES, RequestStatus, User, FixedContract, FinancialTransaction, Driver, Client, DriverStatus } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEYS = {
  RATES: 'logitrack_rates',
  REQUESTS: 'logitrack_requests',
  DRIVERS: 'logitrack_drivers',
  CLIENTS: 'logitrack_clients',
  EXPENSES: 'logitrack_expenses',
  USERS: 'logitrack_users',
  CONTRACTS: 'logitrack_contracts',
  TRANSACTIONS: 'logitrack_transactions'
};

const INITIAL_USERS: User[] = [
    { id: '1', username: 'admin', password: 'admin', role: 'ADMIN', name: 'Administrador', mustChangePassword: false }
];

async function executeInternal<T>(supabaseCall: Promise<{ data: T | null, error: any }>, storageKey: string): Promise<T> {
  let cloudData: T | null = null;
  let hasError = false;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabaseCall;
      if (error) {
        console.error(`Erro no Supabase (${storageKey}):`, error);
        hasError = true;
      } else {
        cloudData = data as T;
        // Sync local storage with cloud data upon successful fetch
        if (cloudData && Array.isArray(cloudData)) {
            localStorage.setItem(storageKey, JSON.stringify(cloudData));
        }
      }
    } catch (err) {
      console.warn(`Falha na conexão de rede para ${storageKey}, buscando local:`, err);
      hasError = true;
    }
  }

  // If we have cloud data, return it. Otherwise, fallback to local.
  if (cloudData !== null && !hasError) {
      return cloudData;
  }

  const local = localStorage.getItem(storageKey);
  const parsedLocal = (local ? JSON.parse(local) : []) as unknown as T;
  console.debug(`[DataManager] Fetching ${storageKey} from local storage. Found ${Array.isArray(parsedLocal) ? parsedLocal.length : 'N/A'} items.`);
  return parsedLocal;
}

export const DataManager = {
  isOnline: isSupabaseConfigured,

  async fetchUsers(): Promise<User[]> {
    const data = await executeInternal<User[]>(
      (supabase ? supabase.from('users').select('*') : Promise.resolve({data: null, error: null})) as any,
      STORAGE_KEYS.USERS
    );
    return (data && data.length > 0) ? data : INITIAL_USERS;
  },

  async seedData() {
    // Populate with some enhanced driver data if empty
    const driversStr = localStorage.getItem(STORAGE_KEYS.DRIVERS);
    if (!driversStr || JSON.parse(driversStr).length === 0) {
        const mockDrivers: Driver[] = [
            { 
                id: 'd1', name: 'Ricardo Santos', vehicleType: 'MOTO', plate: 'ABC-1234', model: 'Honda CG 160', 
                status: 'EM_ROTA', lastRegion: 'Zona Sul - Itaim Bibi', monthlyDeliveries: 45, phone: '(11) 99999-0001',
                cpf: '000', address: 'Rua A', createdAt: new Date().toISOString()
            },
            { 
                id: 'd2', name: 'Marcos Oliveira', vehicleType: 'UTILITARIO', plate: 'XYZ-9988', model: 'Fiorino 2023', 
                status: 'DISPONIVEL', lastRegion: 'Zona Oeste - Lapa', monthlyDeliveries: 38, phone: '(11) 99999-0002',
                cpf: '001', address: 'Rua B', createdAt: new Date().toISOString()
            },
            { 
                id: 'd3', name: 'Julia Martins', vehicleType: 'CARRO', plate: 'KJH-4422', model: 'VW Gol G8', 
                status: 'PAUSA', lastRegion: 'Centro - Paulista', monthlyDeliveries: 52, phone: '(11) 99999-0003',
                cpf: '002', address: 'Rua C', createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(mockDrivers));
    }
  },

  async authenticate(username: string, password: string): Promise<User | null> {
    const users = await this.fetchUsers();
    return users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password) || null;
  },

  async fetchFixedData() {
    const contracts = await executeInternal<FixedContract[]>(
        (supabase ? supabase.from('contracts').select('*') : Promise.resolve({data: null, error: null})) as any,
        STORAGE_KEYS.CONTRACTS
    );
    return { contracts: contracts || [] };
  },

  async fetchTransactions(): Promise<FinancialTransaction[]> {
    const data = await executeInternal<FinancialTransaction[]>(
        (supabase ? supabase.from('transactions').select('*').order('date', { ascending: false }) : Promise.resolve({data: null, error: null})) as any,
        STORAGE_KEYS.TRANSACTIONS
    );
    return data || [];
  },

  async fetchAllData() {
    console.debug("[DataManager] Starting full data sync...");
    const requests = await executeInternal<TransportRequest[]>(
        (supabase ? supabase.from('requests').select('*').order('createdAt', { ascending: false }) : Promise.resolve({data: null, error: null})) as any,
        STORAGE_KEYS.REQUESTS
    );
    const drivers = await executeInternal<Driver[]>(
        (supabase ? supabase.from('drivers').select('*') : Promise.resolve({data: null, error: null})) as any,
        STORAGE_KEYS.DRIVERS
    );
    const clients = await executeInternal<Client[]>(
        (supabase ? supabase.from('clients').select('*') : Promise.resolve({data: null, error: null})) as any,
        STORAGE_KEYS.CLIENTS
    );
    const expenses = await executeInternal<DriverExpense[]>(
        (supabase ? supabase.from('expenses').select('*') : Promise.resolve({data: null, error: null})) as any,
        STORAGE_KEYS.EXPENSES
    );
    const rates = await executeInternal<VehicleRate[]>(
        (supabase ? supabase.from('rates').select('*') : Promise.resolve({data: null, error: null})) as any,
        STORAGE_KEYS.RATES
    );

    return {
      requests: requests || [],
      drivers: drivers || [],
      clients: clients || [],
      expenses: expenses || [],
      rates: (rates && rates.length > 0) ? rates : INITIAL_RATES
    };
  },

  async add(table: string, storageKey: string, item: any) {
    console.debug(`[DataManager] Adding item to ${table}:`, item);
    let cloudSuccess = false;
    try {
      if (this.isOnline && supabase) {
        const { error } = await supabase.from(table).insert([item]);
        if (error) throw error;
        cloudSuccess = true;
      }
    } catch (err) {
      console.error(`Erro ao salvar na nuvem (${table}). O item será mantido localmente:`, err);
    }
    
    // Always update local storage as a reliable fallback/cache
    const current = JSON.parse(localStorage.getItem(storageKey) || '[]');
    localStorage.setItem(storageKey, JSON.stringify([item, ...current]));
    return cloudSuccess;
  },

  async update(table: string, storageKey: string, item: any, idField: string = 'id') {
    try {
      if (this.isOnline && supabase) {
        const { error } = await supabase.from(table).update(item).eq(idField, item[idField]);
        if (error) throw error;
      }
    } catch (err) {
      console.error(`Erro ao atualizar na nuvem (${table}):`, err);
    }
    const current = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const updated = current.map((i: any) => i[idField] === item[idField] ? item : i);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  },

  async delete(table: string, storageKey: string, id: string, idField: string = 'id') {
    try {
      if (this.isOnline && supabase) {
        const { error } = await supabase.from(table).delete().eq(idField, id);
        if (error) throw error;
      }
    } catch (err) {
      console.error(`Erro ao deletar na nuvem (${table}):`, err);
    }
    const current = JSON.parse(localStorage.getItem(storageKey) || '[]');
    localStorage.setItem(storageKey, JSON.stringify(current.filter((i: any) => i[idField] !== id)));
  },

  async addRequest(item: TransportRequest) { await this.add('requests', STORAGE_KEYS.REQUESTS, item); },
  async updateRequest(item: TransportRequest) { await this.update('requests', STORAGE_KEYS.REQUESTS, item); },
  async deleteRequest(id: string) { await this.delete('requests', STORAGE_KEYS.REQUESTS, id); },
  
  async addDriver(item: any) { 
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() };
    await this.add('drivers', STORAGE_KEYS.DRIVERS, newItem); 
  },
  async updateDriver(item: any) { await this.update('drivers', STORAGE_KEYS.DRIVERS, item); },
  
  async addClient(item: any) { 
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() };
    await this.add('clients', STORAGE_KEYS.CLIENTS, newItem); 
  },
  async updateClient(item: any) { await this.update('clients', STORAGE_KEYS.CLIENTS, item); },

  async addTransaction(item: any) {
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() };
    await this.add('transactions', STORAGE_KEYS.TRANSACTIONS, newItem);
  },
  async updateTransaction(item: FinancialTransaction) { await this.update('transactions', STORAGE_KEYS.TRANSACTIONS, item); },
  async deleteTransaction(id: string) { await this.delete('transactions', STORAGE_KEYS.TRANSACTIONS, id); },

  async addFixedContract(item: FixedContract) { await this.add('contracts', STORAGE_KEYS.CONTRACTS, item); },
  async updateFixedContract(item: FixedContract) { await this.update('contracts', STORAGE_KEYS.CONTRACTS, item); },
  async deleteFixedContract(id: string) { await this.delete('contracts', STORAGE_KEYS.CONTRACTS, id); },

  async updateRate(item: VehicleRate) { await this.update('rates', STORAGE_KEYS.RATES, item, 'type'); },
  
  async addExpense(item: Omit<DriverExpense, 'id'>) { 
    const newItem = { 
        ...item, 
        id: Math.random().toString(36).substr(2, 9),
        status: item.status || 'PENDENTE'
    };
    await this.add('expenses', STORAGE_KEYS.EXPENSES, newItem); 
  },

  async updateExpense(item: DriverExpense) {
      await this.update('expenses', STORAGE_KEYS.EXPENSES, item);
  },

  async addUser(item: User) { await this.add('users', STORAGE_KEYS.USERS, item); },
  async updateUser(item: User) { await this.update('users', STORAGE_KEYS.USERS, item); },
  async deleteUser(id: string) { await this.delete('users', STORAGE_KEYS.USERS, id); },

  async changePassword(userId: string, newPassword: string) {
    const users = await this.fetchUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
        const updated = { ...user, password: newPassword, mustChangePassword: false };
        await this.updateUser(updated);
    }
  },

  async updateRequestStatus(id: string, newStatus: RequestStatus, requests: TransportRequest[]) {
    const request = requests.find(r => r.id === id);
    if (request) {
        await this.updateRequest({ ...request, status: newStatus });
    }
  }
};
