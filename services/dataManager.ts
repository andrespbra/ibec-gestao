
import { TransportRequest, DriverExpense, VehicleRate, INITIAL_RATES, RequestStatus, User, FixedContract, FinancialTransaction, Driver, Client } from '../types';
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
    { id: '1', username: 'admin', password: 'admin', role: 'ADMIN', name: 'Administrador', mustChangePassword: false },
    { id: '2', username: 'operacional', password: '123', role: 'OPERATIONAL', name: 'Operador Logístico', mustChangePassword: false },
    { id: '4', username: 'edna', password: '123', role: 'ADMIN', name: 'Edna (Admin)', mustChangePassword: true }
];

async function executeInternal<T>(supabaseCall: Promise<{ data: T | null, error: any }>, storageKey: string): Promise<T> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabaseCall;
      if (error) throw error;
      return data as T;
    } catch (err) {
      console.warn(`Supabase error for ${storageKey}, falling back to local:`, err);
    }
  }
  const local = localStorage.getItem(storageKey);
  return (local ? JSON.parse(local) : []) as unknown as T;
}

export const DataManager = {
  isOnline: isSupabaseConfigured,

  execute: executeInternal,

  async fetchUsers(): Promise<User[]> {
    if (this.isOnline && supabase) {
      const { data } = await supabase.from('users').select('*');
      if (data && data.length > 0) return data as User[];
    }
    const stored = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!stored) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
        return INITIAL_USERS;
    }
    return JSON.parse(stored);
  },

  async seedData() {
    // Sistema limpo: Não inserimos mais dados de demonstração (clientes, motoristas ou solicitações).
    // Apenas garantimos que o usuário admin inicial exista caso o banco local esteja vazio.
    const users = await this.fetchUsers();
    if (users.length === 0) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
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
    if (this.isOnline && supabase) {
        await supabase.from(table).insert([item]);
    }
    const current = JSON.parse(localStorage.getItem(storageKey) || '[]');
    localStorage.setItem(storageKey, JSON.stringify([item, ...current]));
  },

  async update(table: string, storageKey: string, item: any, idField: string = 'id') {
    if (this.isOnline && supabase) {
        await supabase.from(table).update(item).eq(idField, item[idField]);
    }
    const current = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const updated = current.map((i: any) => i[idField] === item[idField] ? item : i);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  },

  async delete(table: string, storageKey: string, id: string, idField: string = 'id') {
    if (this.isOnline && supabase) {
        await supabase.from(table).delete().eq(idField, id);
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
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
    await this.add('expenses', STORAGE_KEYS.EXPENSES, newItem); 
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
