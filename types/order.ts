import { OrderStatus } from './order-status'  
  
export interface Order {  
  id: string  
  orderNumber?: string  
  clientId: string  
  vehicleId: string  
  technicianId?: string  
  status: OrderStatus  
  description: string  
  diagnosis?: string  
  estimatedCompletionDate?: string  
  notes?: string  
    
  // Campos financieros  
  subtotal?: number  
  tax?: number  
  discount?: number  
  total?: number  
  currency?: 'USD' | 'HNL'  
    
  // Items de la orden  
  items?: OrderItem[]  
    
  // Timestamps  
  created_at: string  
  updated_at: string  
    // ✅ CORREGIDO: Campos computados para información relacionada  
    clientName?: string  
    clientPhone?: string  
    clientEmail?: string  
    vehicleInfo?: string  
    vehiclePlate?: string  
    vehicleMake?: string  
    vehicleModel?: string  
    vehicleYear?: string  
  }  
    
  export interface OrderItem {  
    id: string  
    orderId: string  
    name: string  
    description?: string  
    quantity: number  
    unitPrice: number  
    total: number  
    partNumber?: string  
    category?: string  
    supplier?: string  
    notes?: string  
    created_at: string  
    updated_at?: string  
  }  
    
  export interface OrderComment {  
    id: string  
    orderId: string  
    userId: string  
    userName?: string  
    comment: string  
    isInternal: boolean  
    created_at: string  
    updated_at?: string  
  }  
    
  export interface OrderImage {  
    id: string  
    orderId: string  
    url: string  
    description?: string  
    category: 'before' | 'during' | 'after' | 'damage' | 'repair'  
    created_at: string  
  }  
    
  export interface RepairProcess {  
    id: string  
    orderId: string  
    step: number  
    title: string  
    description: string  
    status: 'pending' | 'in_progress' | 'completed' | 'skipped'  
    estimatedDuration?: number  
    actualDuration?: number  
    technicianId?: string  
    notes?: string  
    created_at: string  
    updated_at?: string  
  }  
    
  // ✅ CORREGIDO: Tipos para crear órdenes con campos reales  
  export interface CreateOrderData {  
    clientId: string  
    vehicleId: string  
    technicianId?: string  
    description: string  
    diagnosis?: string  
    estimatedCompletionDate?: string  
    notes?: string  
    priority?: 'low' | 'medium' | 'high' | 'urgent'  
    serviceType?: string  
  }  
    
  export interface UpdateOrderData {  
    description?: string  
    diagnosis?: string  
    estimatedCompletionDate?: string  
    status?: OrderStatus  
    notes?: string  
    subtotal?: number  
    tax?: number  
    discount?: number  
    total?: number  
    technicianId?: string  
    priority?: 'low' | 'medium' | 'high' | 'urgent'  
  }  
    
  // ✅ CORREGIDO: Función helper para mapear campos de orden  
  export const mapLegacyOrderFields = (orderData: any): Order => {  
    return {  
      id: orderData.id,  
      orderNumber: orderData.orderNumber || orderData.order_number,  
      clientId: orderData.clientId || orderData.client_id,  
      vehicleId: orderData.vehicleId || orderData.vehicle_id,  
      technicianId: orderData.technicianId || orderData.technician_id,  
      status: orderData.status,  
      description: orderData.description,  
      diagnosis: orderData.diagnosis,  
      estimatedCompletionDate: orderData.estimatedCompletionDate || orderData.estimated_completion_date,  
      notes: orderData.notes,  
      subtotal: orderData.subtotal,  
      tax: orderData.tax,  
      discount: orderData.discount,  
      total: orderData.total,  
      currency: orderData.currency || 'USD',  
      items: orderData.items || [],  
      created_at: orderData.created_at || orderData.createdAt || new Date().toISOString(),  
      updated_at: orderData.updated_at || orderData.updatedAt,  
      // Campos computados  
      clientName: orderData.clientName || orderData.client_name,  
      clientPhone: orderData.clientPhone || orderData.client_phone,  
      clientEmail: orderData.clientEmail || orderData.client_email,  
      vehicleInfo: orderData.vehicleInfo || orderData.vehicle_info,  
      vehiclePlate: orderData.vehiclePlate || orderData.vehicle_plate,  
      vehicleMake: orderData.vehicleMake || orderData.vehicle_make,  
      vehicleModel: orderData.vehicleModel || orderData.vehicle_model,  
      vehicleYear: orderData.vehicleYear || orderData.vehicle_year,  
    }  
  }  
    
  // ✅ CORREGIDO: Tipo para órdenes enriquecidas con datos relacionados  
  export interface EnhancedOrder extends Order {  
    clientData?: {  
      id: string  
      name: string  
      phone?: string  
      email?: string  
      address?: string  
    }  
    vehicleData?: {  
      id: string  
      make: string  
      model: string  
      year: string  
      license_plate: string  
      vin?: string  
      mileage?: number  
    }  
    technicianData?: {  
      id: string  
      first_name: string  
      last_name: string  
      email: string  
      phone?: string  
    }  
    images?: OrderImage[]  
    comments?: OrderComment[]  
    repairProcesses?: RepairProcess[]  
  }  
    
  export type OrderStatus =   
    | 'reception'  
    | 'diagnosis'   
    | 'waiting_parts'  
    | 'in_progress'  
    | 'quality_check'  
    | 'completed'  
    | 'delivered'  
    | 'cancelled'  
    
  export type PaymentStatus =   
    | 'pending'  
    | 'partial'  
    | 'paid'  
    | 'overdue'  
    | 'cancelled'  
    
  export type OrderPriority =   
    | 'low'  
    | 'medium'  
    | 'high'  
    | 'urgent'