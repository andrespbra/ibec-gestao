
export type VehicleType = 'MOTO' | 'CARRO' | 'UTILITARIO' | 'CAMINHAO' | 'PRESSKIT';

export type RequestStatus = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO';

export type ActivityType = 'COLETAR' | 'ENTREGAR' | 'COLETAR_ENTREGAR' | 'OUTROS';

export type UserRole = 'ADMIN' | 'OPERATIONAL' | 'CLIENT';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  clientId?: string; 
  name: string;
  password?: string; 
  mustChangePassword?: boolean;
}

export interface TransportRequest {
  id: string;
  invoiceNumber: string;
  clientName: string;
  origin: string;
  destination: string;
  vehicleType: VehicleType;
  distanceKm: number;
  driverFee: number;
  clientCharge: number;
  status: RequestStatus;
  createdAt: string; 
  scheduledFor?: string; 
  driverId?: string;
  activityType?: ActivityType;
  contactOnSite?: string;
  observations?: string;
  waypoints?: string[]; 
  paymentDate?: string; 
  commissionedName?: string; 
  commissionPercentage?: number; 
}

export interface StaffExpense {
  id: string;
  employeeName: string;
  role: string;
  department?: string; 
  salary: number;
  createdAt: string;
}

export interface FixedContract {
  id: string;
  clientName: string;
  contractValue: number;
  invoiceDay: number;
  createdAt: string;
  staff: StaffExpense[]; 
}

export interface VehicleRate {
  type: VehicleType;
  label: string;
  costPerKm: number; 
  chargePerKm: number; 
  baseFee: number;
}

export interface Driver {
  id: string;
  name: string;
  cpf: string;
  address: string;
  vehicleType: VehicleType;
  phone: string;
  createdAt: string;
  plate?: string;
  model?: string;
  color?: string;
}

export interface Client {
  id: string;
  name: string;
  cnpj: string;
  address: string;
  costCenter: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  paymentDay: number;
  createdAt: string;
}

export type ExpenseType = 'GASOLINA' | 'VALE' | 'PEDAGIO' | 'OUTROS';

export interface DriverExpense {
  id: string;
  driverId: string;
  type: ExpenseType;
  amount: number;
  date: string;
  description?: string;
}

export const INITIAL_RATES: VehicleRate[] = [
  { type: 'MOTO', label: 'Motoboy', costPerKm: 1.50, chargePerKm: 2.50, baseFee: 5.00 },
  { type: 'CARRO', label: 'Carro', costPerKm: 2.50, chargePerKm: 4.00, baseFee: 8.00 },
  { type: 'UTILITARIO', label: 'Utilitário', costPerKm: 4.00, chargePerKm: 6.50, baseFee: 15.00 },
  { type: 'CAMINHAO', label: 'Caminhão', costPerKm: 8.00, chargePerKm: 12.00, baseFee: 50.00 },
  { type: 'PRESSKIT', label: 'Press Kit', costPerKm: 2.50, chargePerKm: 4.50, baseFee: 12.00 },
];
