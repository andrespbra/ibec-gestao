

export type VehicleType = 'MOTO' | 'CARRO' | 'UTILITARIO' | 'CAMINHAO';

export type RequestStatus = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO';

export type ActivityType = 'COLETAR' | 'ENTREGAR' | 'COLETAR_ENTREGAR' | 'OUTROS';

export type UserRole = 'ADMIN' | 'OPERATIONAL' | 'CLIENT';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  clientId?: string; // If role is CLIENT, links to specific client
  name: string;
  password?: string; // Optional in interface for security, but used in management
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
  createdAt: string; // ISO String
  scheduledFor?: string; // ISO String or DateTime string
  driverId?: string;
  activityType?: ActivityType;
  contactOnSite?: string;
  observations?: string;
  waypoints?: string[]; // Intermediate addresses
  paymentDate?: string; // ISO String, indicates when the client paid
}

export interface VehicleRate {
  type: VehicleType;
  label: string;
  costPerKm: number; // Driver pay
  chargePerKm: number; // Client charge
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
];