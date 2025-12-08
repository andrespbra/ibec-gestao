
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { TransportRequest, Driver, Client, DriverExpense, VehicleRate, INITIAL_RATES, RequestStatus } from '../types';

// Keys for LocalStorage
const STORAGE_KEYS = {
  RATES: 'logitrack_rates',
  REQUESTS: 'logitrack_requests',
  DRIVERS: 'logitrack_drivers',
  CLIENTS: 'logitrack_clients',
  EXPENSES: 'logitrack_expenses'
};

export const DataManager = {
  isOnline: isSupabaseConfigured,

  async fetchAllData() {
    if (this.isOnline && supabase) {
      try {
        const [reqs, driv, cli, exp, rates] = await Promise.all([
          supabase.from('requests').select('*').order('createdAt', { ascending: false }),
          supabase.from('drivers').select('*').order('createdAt', { ascending: false }),
          supabase.from('clients').select('*').order('createdAt', { ascending: false }),
          supabase.from('expenses').select('*'),
          supabase.from('rates').select('*')
        ]);

        return {
          requests: (reqs.data as unknown as TransportRequest[]) || [],
          drivers: (driv.data as unknown as Driver[]) || [],
          clients: (cli.data as unknown as Client[]) || [],
          expenses: (exp.data as unknown as DriverExpense[]) || [],
          rates: (rates.data && rates.data.length > 0) ? (rates.data as unknown as VehicleRate[]) : INITIAL_RATES
        };
      } catch (error) {
        console.error("ERRO CRÍTICO: Falha ao buscar dados do Supabase. Verifique sua conexão e chaves.", error);
      }
    }

    // Fallback to LocalStorage
    return {
      requests: JSON.parse(localStorage.getItem(STORAGE_KEYS.REQUESTS) || '[]'),
      drivers: JSON.parse(localStorage.getItem(STORAGE_KEYS.DRIVERS) || '[]'),
      clients: JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS) || '[]'),
      expenses: JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES) || '[]'),
      rates: JSON.parse(localStorage.getItem(STORAGE_KEYS.RATES) || JSON.stringify(INITIAL_RATES))
    };
  },

  // --- Generic Helpers ---
  async add(table: string, storageKey: string, item: any) {
    // Save Local
    const current = JSON.parse(localStorage.getItem(storageKey) || '[]');
    localStorage.setItem(storageKey, JSON.stringify([item, ...current]));

    // Save Cloud
    if (this.isOnline && supabase) {
      const { error } = await supabase.from(table).insert([item]);
      if (error) {
        console.error(`Erro ao salvar em '${table}':`, error.message, error.details);
        alert(`Erro de sincronização: Os dados foram salvos localmente, mas falharam na nuvem.\nMotivo: ${error.message}`);
      }
    }
  },

  async update(table: string, storageKey: string, item: any, idField: string = 'id') {
    // Update Local
    const current = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const updated = current.map((i: any) => i[idField] === item[idField] ? item : i);
    localStorage.setItem(storageKey, JSON.stringify(updated));

    // Update Cloud
    if (this.isOnline && supabase) {
      const { error } = await supabase.from(table).update(item).eq(idField, item[idField]);
      if (error) {
        console.error(`Erro ao atualizar '${table}':`, error.message);
      }
    }
  },

  async delete(table: string, storageKey: string, id: string) {
    // Delete Local
    const current = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const filtered = current.filter((i: any) => i.id !== id);
    localStorage.setItem(storageKey, JSON.stringify(filtered));

    // Delete Cloud
    if (this.isOnline && supabase) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) {
         console.error(`Erro ao deletar de '${table}':`, error.message);
      }
    }
  },

  // --- Specific Methods ---
  async addRequest(item: TransportRequest) {
    await this.add('requests', STORAGE_KEYS.REQUESTS, item);
  },
  
  async updateRequestStatus(id: string, status: RequestStatus, allRequests: TransportRequest[]) {
    const request = allRequests.find(r => r.id === id);
    if (request) {
      const updated = { ...request, status };
      await this.update('requests', STORAGE_KEYS.REQUESTS, updated);
    }
  },

  async updateRequest(item: TransportRequest) {
    await this.update('requests', STORAGE_KEYS.REQUESTS, item);
  },

  async deleteRequest(id: string) {
    await this.delete('requests', STORAGE_KEYS.REQUESTS, id);
  },

  async addDriver(item: Driver) {
    await this.add('drivers', STORAGE_KEYS.DRIVERS, item);
  },

  async updateDriver(item: Driver) {
    await this.update('drivers', STORAGE_KEYS.DRIVERS, item);
  },

  async addClient(item: Client) {
    await this.add('clients', STORAGE_KEYS.CLIENTS, item);
  },

  async updateClient(item: Client) {
    await this.update('clients', STORAGE_KEYS.CLIENTS, item);
  },

  async addExpense(item: DriverExpense) {
    await this.add('expenses', STORAGE_KEYS.EXPENSES, item);
  },

  async updateRate(item: VehicleRate) {
    // Rates usually don't have unique IDs in this simple model, keyed by 'type'
    // We update local and try to update cloud
    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.RATES) || JSON.stringify(INITIAL_RATES));
    const updated = current.map((r: VehicleRate) => r.type === item.type ? item : r);
    localStorage.setItem(STORAGE_KEYS.RATES, JSON.stringify(updated));

    if (this.isOnline && supabase) {
        // Upsert based on type
        await supabase.from('rates').upsert(item, { onConflict: 'type' });
    }
  }
};
