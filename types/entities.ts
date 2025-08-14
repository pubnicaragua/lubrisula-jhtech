// ✅ CORREGIDO: Entidades sincronizadas con schema real  
  
export interface Vehicle {  
  id: string;  
  client_id: string;  
  // ✅ Campos reales del schema  
  marca: string;  
  modelo: string;  
  ano: string;  
  vin?: string;  
  placa: string;  
  color?: string;  
  kilometraje?: number;  
  fuel_type?: 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'other';  
  transmission?: 'manual' | 'automatic' | 'cvt' | 'other';  
  engine_size?: string;  
  notes?: string;  
  created_at: string;  
  updated_at?: string;  
}  
  
export interface Client {  
  id: string;  
  name: string;  
  email?: string;  
  phone?: string;  
  company?: string;  
  client_type: 'individual' | 'business';  
  user_id?: string;  
  taller_id?: string;  
  created_at: string;  
  updated_at?: string;  
}  
  
export interface Order {  
  id: string;  
  client_id: string;  
  vehicle_id: string;  
  technician_id?: string;  
  description: string;  
  diagnosis?: string;  
  status: OrderStatus;  
  estimated_completion_date?: string;  
  total?: number;  
  subtotal?: number;  
  tax?: number;  
  discount?: number;  
  currency?: string;  
  payment_status?: PaymentStatus;  
  payment_method?: string;  
  payment_notes?: string;  
  paid_amount?: number;  
  notes?: string;  
  created_at: string;  
  updated_at?: string;  
}  
  
export type OrderStatus =  
  | 'reception'  
  | 'diagnosis'  
  | 'waiting_parts'  
  | 'in_progress'  
  | 'quality_check'  
  | 'completed'  
  | 'delivered'  
  | 'cancelled';  
  
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue';  
  
// ✅ AGREGADO: Tipos adicionales para inventario  
export interface InventoryItem {  
  id: string;  
  producto: string;  
  proceso?: string;  
  unidad_medida?: string;  
  lugar_compra?: string;  
  precio_unitario?: number;  
  cantidad?: number;  
  precio_total?: number;  
  categoria_id?: string;  
  taller_id?: string;  
  vehiculo_id?: string;  
  material_pintura?: boolean;  
  material_reparacion?: boolean;  
  created_at: string;  
  updated_at?: string;  
}  
  
// ✅ AGREGADO: Tipos para citas  
export interface Appointment {  
  id: string;  
  client_id: string;  
  vehicle_id?: string;  
  technician_id?: string;  
  appointment_date: string;  
  appointment_time: string;  
  service_type: string;  
  description?: string;  
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';  
  notes?: string;  
  created_at: string;  
  updated_at?: string;  
}  
  
// ✅ AGREGADO: Tipos para servicios  
export interface Service {  
  id: string;  
  name: string;  
  description?: string;  
  base_price: number;  
  estimated_duration: number; // en minutos  
  category: string;  
  is_active: boolean;  
  created_at: string;  
  updated_at?: string;  
}  
  
// ✅ AGREGADO: Tipos para items de orden  
export interface OrderItem {  
  id: string;  
  order_id: string;  
  inventory_item_id?: string;  
  service_id?: string;  
  description: string;  
  quantity: number;  
  unit_price: number;  
  total_price: number;  
  created_at: string;  
  updated_at?: string;  
}