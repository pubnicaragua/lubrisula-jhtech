import { OrderStatus } from '../services/supabase/order-service';

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
}

export interface DashboardOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
  } | null;
  createdAt: Date;
}

export interface DashboardClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  ordersCount: number;
  lastOrderDate?: string;
}

export interface DashboardInventoryItem {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  status: 'low' | 'ok';
}

export type DashboardSection = 'overview' | 'orders' | 'clients' | 'inventory';
