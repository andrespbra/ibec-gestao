
import { TransportRequest, DriverExpense, VehicleRate, INITIAL_RATES, RequestStatus, User, FixedContract } from '../types';

const STORAGE_KEYS = {
  RATES: 'logitrack_rates',
  REQUESTS: 'logitrack_requests',
  DRIVERS: 'logitrack_drivers',
  CLIENTS: 'logitrack_clients',
  EXPENSES: 'logitrack_expenses',
  USERS: 'logitrack_users',
  CONTRACTS: 'logitrack_contracts'
};

const INITIAL_USERS: User[] = [
    { id: '1', username: 'admin', password: 'admin', role: 'ADMIN', name: 'Administrador', mustChangePassword: false },
    { id: '2', username: 'operacional', password: '123', role: 'OPERATIONAL', name: 'Operador Logístico', mustChangePassword: false },
    { id: '3', username: 'cliente', password: '123', role: 'CLIENT', name: 'Cliente Demo', clientId: 'client_demo_id', mustChangePassword: false },
    { id: '4', username: 'edna', password: '123', role: 'ADMIN', name: 'Edna (Admin)', mustChangePassword: true }
];

export const DataManager = {
  isOnline: false,

  async fetchUsers(): Promise<User[]> {
      const stored = localStorage.getItem(STORAGE_KEYS.USERS);
      if (!stored) {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
          return INITIAL_USERS;
      }
      return JSON.parse(stored);
  },

  async authenticate(username: string, password: string): Promise<User | null> {
    const users = await this.fetchUsers();
    return users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password) || null;
  },

  async fetchFixedData() {
    return {
      contracts: JSON.parse(localStorage.getItem(STORAGE_KEYS.CONTRACTS) || '[]') as FixedContract[]
    };
  },

  async addFixedContract(item: FixedContract) {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONTRACTS) || '[]');
    localStorage.setItem(STORAGE_KEYS.CONTRACTS, JSON.stringify([item, ...current]));
  },

  async updateFixedContract(item: FixedContract) {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONTRACTS) || '[]');
    const updated = current.map((i: FixedContract) => i.id === item.id ? item : i);
    localStorage.setItem(STORAGE_KEYS.CONTRACTS, JSON.stringify(updated));
  },

  async deleteFixedContract(id: string) {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONTRACTS) || '[]');
    localStorage.setItem(STORAGE_KEYS.CONTRACTS, JSON.stringify(current.filter((i: any) => i.id !== id)));
  },

  async fetchAllData() {
    return {
      requests: JSON.parse(localStorage.getItem(STORAGE_KEYS.REQUESTS) || '[]') as TransportRequest[],
      drivers: JSON.parse(localStorage.getItem(STORAGE_KEYS.DRIVERS) || '[]'),
      clients: JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS) || '[]'),
      expenses: JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES) || '[]') as DriverExpense[],
      rates: JSON.parse(localStorage.getItem(STORAGE_KEYS.RATES) || JSON.stringify(INITIAL_RATES)) as VehicleRate[]
    };
  },

  async add(storageKey: string, item: any) {
    const current = JSON.parse(localStorage.getItem(storageKey) || '[]');
    localStorage.setItem(storageKey, JSON.stringify([item, ...current]));
  },

  async update(storageKey: string, item: any, idField: string = 'id') {
    const current = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const updated = current.map((i: any) => i[idField] === item[idField] ? item : i);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  },

  async delete(storageKey: string, id: string) {
    const current = JSON.parse(localStorage.getItem(storageKey) || '[]');
    localStorage.setItem(storageKey, JSON.stringify(current.filter((i: any) => i.id !== id)));
  },

  async addRequest(item: TransportRequest) { await this.add(STORAGE_KEYS.REQUESTS, item); },
  async updateRequest(item: TransportRequest) { await this.update(STORAGE_KEYS.REQUESTS, item); },
  async deleteRequest(id: string) { await this.delete(STORAGE_KEYS.REQUESTS, id); },
  
  async addDriver(item: any) { 
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() };
    await this.add(STORAGE_KEYS.DRIVERS, newItem); 
  },
  async updateDriver(item: any) { await this.update(STORAGE_KEYS.DRIVERS, item); },
  
  async addClient(item: any) { 
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() };
    await this.add(STORAGE_KEYS.CLIENTS, newItem); 
  },
  async updateClient(item: any) { await this.update(STORAGE_KEYS.CLIENTS, item); },

  async updateRate(item: VehicleRate) {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.RATES) || JSON.stringify(INITIAL_RATES));
    const updated = current.map((r: VehicleRate) => r.type === item.type ? item : r);
    localStorage.setItem(STORAGE_KEYS.RATES, JSON.stringify(updated));
  },
  
  async addExpense(item: Omit<DriverExpense, 'id'>) { 
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
    await this.add(STORAGE_KEYS.EXPENSES, newItem); 
  },

  async addUser(item: User) { await this.add(STORAGE_KEYS.USERS, item); },
  async updateUser(item: User) { await this.update(STORAGE_KEYS.USERS, item); },
  async deleteUser(id: string) { await this.delete(STORAGE_KEYS.USERS, id); },

  async changePassword(userId: string, newPassword: string) {
    const users = await this.fetchUsers();
    const updated = users.map(u => u.id === userId ? { ...u, password: newPassword, mustChangePassword: false } : u);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
  },

  async updateRequestStatus(id: string, newStatus: RequestStatus, requests: TransportRequest[]) {
    const request = requests.find(r => r.id === id);
    if (request) {
        await this.updateRequest({ ...request, status: newStatus });
    }
  }
};
