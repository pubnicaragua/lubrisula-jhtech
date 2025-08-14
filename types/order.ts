// ✅ CORREGIDO: Tipos completos para órdenes  
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
  
export interface Order {  
  id: string;  
  clientId: string;  
  vehicleId: string;  
  technicianId?: string;  
  description: string;  
  diagnosis?: string;  
  status: OrderStatus;  
  estimatedCompletionDate?: string;  
  total?: number;  
  subtotal?: number;  
  tax?: number;  
  discount?: number;  
  currency?: string;  
  paymentStatus?: PaymentStatus;  
  paymentMethod?: string;  
  paymentNotes?: string;  
  paidAmount?: number;  
  notes?: string;  
  createdAt: string;  
  updatedAt?: string;  
  // Arrays relacionados  
  images: OrderImage[];  
  comments: OrderComment[];  
  items: OrderItem[];  
  repairProcesses: RepairProcess[];  
}  
  
// ✅ CORREGIDO: Tipos para crear orden con todas las propiedades necesarias  
export interface CreateOrderData {  
  clientId: string;  
  vehicleId: string;  
  technicianId?: string;  
  description: string;  
  diagnosis?: string;  
  status: OrderStatus;  
  estimatedCompletionDate?: string;  
  total?: number;  
  subtotal?: number;  
  tax?: number;  
  discount?: number;  
  currency?: string;  
  paymentStatus?: PaymentStatus;  
  paymentMethod?: string;  
  paymentNotes?: string;  
  paidAmount?: number;  
  notes?: string;  
}  
  
// ✅ CORREGIDO: Tipos para actualizar orden  
export interface UpdateOrderData {  
  description?: string;  
  diagnosis?: string;  
  status?: OrderStatus;  
  estimatedCompletionDate?: string;  
  total?: number;  
  subtotal?: number;  
  tax?: number;  
  discount?: number;  
  paymentStatus?: PaymentStatus;  
  paymentMethod?: string;  
  paymentNotes?: string;  
  paidAmount?: number;  
  notes?: string;  
}  
  
// ✅ CORREGIDO: Tipos para items de orden  
export interface OrderItem {  
  id: string;  
  orderId: string;  
  name: string;  
  quantity: number;  
  unitPrice: number;  
  total: number;  
  partNumber?: string;  
  supplier?: string;  
  status?: 'pending' | 'ordered' | 'received' | 'installed';  
  createdAt: string;  
  updatedAt?: string;  
}  
  
// ✅ CORREGIDO: Tipos para crear item de orden  
export interface CreateOrderItemData {  
  name: string;  
  quantity: number;  
  unitPrice: number;  
  total: number;  
  partNumber?: string;  
  supplier?: string;  
  status?: 'pending' | 'ordered' | 'received' | 'installed';  
}  
  
// ✅ CORREGIDO: Tipos para comentarios de orden  
export interface OrderComment {  
  id: string;  
  orderId: string;  
  userId: string;  
  userName: string;  
  userAvatar?: string;  
  content: string;  
  type: 'client' | 'technician' | 'system';  
  createdAt: string;  
  updatedAt?: string;  
}  
  
// ✅ CORREGIDO: Tipos para crear comentario  
export interface CreateOrderCommentData {  
  userId: string;  
  userName: string;  
  userAvatar?: string;  
  content: string;  
  type?: 'client' | 'technician' | 'system';  
}  
  
// ✅ CORREGIDO: Tipos para imágenes de orden  
export interface OrderImage {  
  id: string;  
  orderId: string;  
  url: string;  
  description?: string;  
  createdAt: string;  
}  
  
// ✅ CORREGIDO: Tipos para procesos de reparación  
export interface RepairProcess {  
  id: string;  
  orderId: string;  
  name: string;  
  description?: string;  
  startDate?: string;  
  endDate?: string;  
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';  
  technicianId?: string;  
  technicianName?: string;  
  notes?: string;  
  images: OrderImage[];  
}