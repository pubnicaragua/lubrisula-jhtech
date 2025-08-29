import { supabase } from '../../lib/supabase'  
import type {  
  Order,  
  OrderStatus,  
  PaymentStatus,  
  RepairProcess,  
  CreateOrderData,  
  UpdateOrderData,  
} from '../../types'  
  
// ✅ CORREGIDO: Definir tipos faltantes localmente  
interface OrderItem {  
  id: string  
  orderId?: string  
  name: string  
  quantity: number  
  unitPrice: number  
  total: number  
  partNumber?: string  
  supplier?: string  
  status?: 'pending' | 'ordered' | 'received' | 'installed'  
  createdAt?: string  
  updatedAt?: string  
}  
  
interface OrderImage {  
  id: string  
  orderId: string  
  url: string  
  description?: string  
  createdAt: string  
}  
  
interface OrderComment {  
  id: string  
  orderId: string  
  userId: string  
  userName: string  
  userAvatar?: string  
  content: string  
  type: 'client' | 'technician' | 'system'  
  createdAt: string  
  updatedAt?: string  
}  
  
interface CreateOrderItemData {  
  name: string  
  quantity: number  
  unitPrice: number  
  total: number  
  partNumber?: string  
  supplier?: string  
  status?: 'pending' | 'ordered' | 'received' | 'installed'  
}  
  
interface CreateOrderCommentData {  
  content: string  
  type: 'client' | 'technician' | 'system'  
}  
  
// ✅ CORREGIDO: Extender tipos existentes con campos faltantes  
interface ExtendedCreateOrderData extends CreateOrderData {  
  priority?: 'low' | 'normal' | 'high'  
  notes?: string  
}  
  
interface ExtendedUpdateOrderData extends UpdateOrderData {  
  priority?: 'low' | 'normal' | 'high'  
  notes?: string  
}  
  
const handleSupabaseError = (error: any, context: string) => {  
  console.error(`Error ${context}:`, error)  
  throw new Error(`Failed to ${context}: ${error.message}`)  
}  
  
// Estados válidos del sistema  
export const ORDER_STATUSES = [  
  'Pendiente',
  'En Proceso',
  'Completada',
  'Cancelada',
  'Entregada',
] as const;
  
// Validación de estado  
export const isValidOrderStatus = (status: string): boolean => {  
  return ORDER_STATUSES.includes(status as any)  
}  
  
export const orderService = {  
  // Get all orders with optional filtering  
  getAllOrders: async (filters: Record<string, any> = {}): Promise<Order[]> => {  
    try {  
      let query = supabase.from('ordenes_trabajo').select('*')  
  
      Object.entries(filters).forEach(([key, value]) => {  
        if (value !== undefined && value !== null) {  
          query = query.eq(key, value)  
        }  
      })  
  
      const { data, error } = await query.order('fecha_creacion', { ascending: false })  
      if (error) throw error  
  
      return (data || []).map(order => ({  
        ...order,  
        id: order.id,  
        client_id: order.client_id,  
        vehiculo_id: order.vehiculo_id,  
        tecnico_id: order.tecnico_id,  
        description: order.descripcion || order.description,  
        diagnosis: order.diagnostico || order.diagnosis,  
        status: order.estado || order.status,  
        total: order.costo || order.total || 0,  
        fecha_creacion: order.fecha_creacion,  
        fecha_entrega: order.fecha_entrega,  
        prioridad: order.prioridad,  
        observacion: order.observacion,  
        // Campos computados para compatibilidad  
        clientId: order.client_id,  
        vehicleId: order.vehiculo_id,  
        technicianId: order.tecnico_id,  
        estimatedCompletionDate: order.fecha_entrega,  
        created_at: order.fecha_creacion,  
        // Inicializar arrays vacíos  
        images: [],  
        comments: [],  
        items: [],  
        repairProcesses: [],  
      }))  
    } catch (error) {  
      handleSupabaseError(error, 'fetch orders')  
      return []  
    }  
  },  
  
  // Get order by ID with all related data  
  getOrderById: async (id: string): Promise<Order | null> => {  
    try {  
      const { data: order, error } = await supabase  
        .from('ordenes_trabajo')  
        .select('*')  
        .eq('id', id)  
        .single()  
  
      if (error) throw error  
      if (!order) return null  
  
      const { data: parts, error: partsError } = await supabase  
        .from('orden_repuestos')  
        .select('*')  
        .eq('orden_id', id)  
  
      if (partsError) {  
        console.warn("Error al cargar repuestos:", partsError)  
      }  
  
      return {  
        ...order,  
        id: order.id,  
        client_id: order.client_id,  
        vehiculo_id: order.vehiculo_id,  
        tecnico_id: order.tecnico_id,  
        description: order.descripcion || order.description,  
        diagnosis: order.diagnostico || order.diagnosis,  
        status: order.estado || order.status,  
        total: order.costo || order.total || 0,  
        fecha_creacion: order.fecha_creacion,  
        fecha_entrega: order.fecha_entrega,  
        prioridad: order.prioridad,  
        observacion: order.observacion,  
        // Campos computados para compatibilidad  
        clientId: order.client_id,  
        vehicleId: order.vehiculo_id,  
        technicianId: order.tecnico_id,  
        estimatedCompletionDate: order.fecha_entrega,  
        created_at: order.fecha_creacion,  
        // Arrays de datos relacionados  
        images: [],  
        comments: [],  
        items: (parts || []).map((part: any) => ({  
          id: part.id,  
          name: part.nombre || part.name,  
          quantity: part.cantidad || part.quantity,  
          unitPrice: part.precio_unitario || part.unit_price || 0,  
          total: part.total || 0,  
          partNumber: part.numero_parte || part.part_number,  
          supplier: part.proveedor || part.supplier,  
          status: part.estado || part.status || 'pending'  
        })),  
        repairProcesses: [],  
      }  
    } catch (error) {  
      handleSupabaseError(error, `fetch order ${id}`)  
      return null  
    }  
  },  
  
  // Create a new order  
  createOrder: async (orderData: ExtendedCreateOrderData): Promise<Order> => {  
    try {  
      // Mapear estado interno a valores válidos del constraint
      const estadoMap: Record<string, string> = {
        'reception': 'Pendiente',
        'diagnosis': 'En Proceso',
        'waiting_parts': 'En Proceso',
        'in_progress': 'En Proceso',
        'quality_check': 'En Proceso',
        'completed': 'Completada',
        'delivered': 'Entregada',
        'cancelled': 'Cancelada',
      };
      const estadoDB = estadoMap[orderData.status || 'reception'] || 'Pendiente';
      const newOrder: any = {
        client_id: orderData.clientId,
        vehiculo_id: orderData.vehicleId,
        descripcion: orderData.description,
        estado: estadoDB,
        costo: orderData.total || 0,
        fecha_creacion: new Date().toISOString(),
        fecha_entrega: orderData.estimatedCompletionDate,
        prioridad: orderData.priority || 'normal',
        observacion: orderData.notes || '',
        // numero_orden: se autogenera por la base de datos
      };
      // Solo enviar tecnico_id si es bigint (número)
      if (orderData.technicianId && !isNaN(Number(orderData.technicianId))) {
        newOrder.tecnico_id = Number(orderData.technicianId);
      }
  
      const { data, error } = await supabase  
        .from('ordenes_trabajo')  
        .insert([newOrder])  
        .select()  
        .single()  
  
      if (error) throw error  
  
      return orderService.getOrderById(data.id) as Promise<Order>  
    } catch (error) {  
      handleSupabaseError(error, 'create order')  
      throw error  
    }  
  },  
  
  // Update an order  
  updateOrder: async (id: string, updates: ExtendedUpdateOrderData): Promise<Order | null> => {  
    try {  
      const updateData = {  
        descripcion: updates.description,  
        diagnostico: updates.diagnosis,  
        estado: updates.status,  
        costo: updates.total,  
        fecha_entrega: updates.estimatedCompletionDate,  
        prioridad: updates.priority,  
        observacion: updates.notes,  
        fecha_actualizacion: new Date().toISOString(),  
      }  
  
      const { error } = await supabase  
        .from('ordenes_trabajo')  
        .update(updateData)  
        .eq('id', id)  
  
      if (error) throw error  
  
      return orderService.getOrderById(id)  
    } catch (error) {  
      handleSupabaseError(error, `update order ${id}`)  
      throw error  
    }  
  },  
  
  async updateOrderStatus(id: string, status: string): Promise<Order | null> {  
    try {  
      const { error } = await supabase  
        .from('ordenes_trabajo')  
        .update({ estado: status })  
        .eq('id', id)  
  
      if (error) throw error  
      return orderService.getOrderById(id)  
    } catch (error) {  
      handleSupabaseError(error, `update order status ${id}`)  
      throw error  
    }  
  },  
  
  async deleteOrder(id: string): Promise<void> {  
    try {  
      const { error } = await supabase.from('ordenes_trabajo').delete().eq('id', id)  
      if (error) throw error  
    } catch (error) {  
      handleSupabaseError(error, `delete order ${id}`)  
      throw error  
    }  
  },  
  
  async getOrdersByClientId(clientId: string): Promise<Order[]> {  
    try {  
      const { data, error } = await supabase  
        .from('ordenes_trabajo')  
        .select('*')  
        .eq('client_id', clientId)  
        .order('fecha_creacion', { ascending: false })  
  
      if (error) {  
        console.error('Error getting orders by client ID:', error)  
        return []  
      }  
  
      return (data || []).map(order => ({  
        ...order,  
        id: order.id,  
        client_id: order.client_id,  
        vehiculo_id: order.vehiculo_id,  
        tecnico_id: order.tecnico_id,  
        description: order.descripcion,  
        diagnosis: order.diagnostico,  
        status: order.estado,  
        total: order.costo || 0,  
        fecha_creacion: order.fecha_creacion,  
        fecha_entrega: order.fecha_entrega,  
        prioridad: order.prioridad,  
        observacion: order.observacion,  
        // Campos computados para compatibilidad  
        clientId: order.client_id,  
        vehicleId: order.vehiculo_id,  
        technicianId: order.tecnico_id,  
        estimatedCompletionDate: order.fecha_entrega,  
        created_at: order.fecha_creacion,  
        images: [],  
        comments: [],  
        items: [],  
        repairProcesses: [],  
      }))  
    } catch (error) {  
      console.error('Error in getOrdersByClientId:', error)  
      return []  
    }  
  },  
  
  async getOrdersByVehicleId(vehicleId: string): Promise<Order[]> {  
    try {  
      const { data, error } = await supabase  
        .from('ordenes_trabajo')  
        .select('*')  
        .eq('vehiculo_id', vehicleId)  
        .order('fecha_creacion', { ascending: false })  
  
      if (error) throw error  
      return (data || []).map(order => ({  
        ...order,  
        // Mapear campos del schema real  
        clientId: order.client_id,  
        vehicleId: order.vehiculo_id,  
        technicianId: order.tecnico_id,  
        description: order.descripcion,  
        diagnosis: order.diagnostico,  
        status: order.estado,  
        total: order.costo || 0,  
        estimatedCompletionDate: order.fecha_entrega,  
        created_at: order.fecha_creacion,  
        images: [],  
        comments: [],  
        items: [],  
        repairProcesses: [],  
      }))  
    } catch (error) {  
      console.error(`Error fetching orders for vehicle ${vehicleId}:`, error)  
      throw error  
    }  
  },  
  
  async getOrderParts(orderId: string): Promise<OrderItem[]> {  
    try {  
      const { data, error } = await supabase  
        .from('orden_repuestos')  
        .select('*')  
        .eq('orden_id', orderId)  
  
      if (error) throw error  
  
      return (data || []).map((part: any) => ({  
        id: part.id,  
        name: part.nombre,  
        quantity: part.cantidad,  
        unitPrice: part.precio_unitario,  
        total: part.total,  
        partNumber: part.numero_parte,  
        supplier: part.proveedor,  
        status: part.estado  
      }))  
    } catch (error) {  
      console.error(`Error fetching order parts for order ${orderId}:`, error)  
      throw error  
    }  
  },  
  
  async addPartToOrder(orderId: string, partData: CreateOrderItemData): Promise<OrderItem> {  
    try {  
      const { data, error } = await supabase  
        .from('orden_repuestos')  
        .insert([{  
          orden_id: orderId,  
          nombre: partData.name,  
          cantidad: partData.quantity,  
          precio_unitario: partData.unitPrice,  
          total: partData.total,  
          numero_parte: partData.partNumber,  
          proveedor: partData.supplier,  
          estado: partData.status || 'pending'  
        }])  
        .select()  
        .single()  
  
      if (error) throw error  
  
      return {  
        id: data.id,  
        name: data.nombre,  
        quantity: data.cantidad,  
        unitPrice: data.precio_unitario,  
        total: data.total,  
        partNumber: data.numero_parte,  
        supplier: data.proveedor,  
        status: data.estado  
      }  
    } catch (error) {  
      console.error(`Error adding part to order ${orderId}:`, error)  
      throw error  
    }  
  },  
  
  async updateOrderPart(partId: string, updates: Partial<CreateOrderItemData>): Promise<OrderItem | null> {  
    try {  
      const { data, error } = await supabase  
        .from('orden_repuestos')  
        .update({  
          cantidad: updates.quantity,  
          precio_unitario: updates.unitPrice,  
          total: updates.total,  
          estado: updates.status  
        })  
        .eq('id', partId)  
        .select()  
        .single()  
  
      if (error) throw error  
  
      return {  
        id: data.id,  
        name: data.nombre,  
        quantity: data.cantidad,  
        unitPrice: data.precio_unitario,  
        total: data.total,  
        partNumber: data.numero_parte,  
        supplier: data.proveedor,  
        status: data.estado  
      }  
    } catch (error) {  
      console.error(`Error updating order  part ${partId}:`, error)  
      throw error  
    }  
  },  
  
  async removePartFromOrder(partId: string): Promise<void> {  
    try {  
      const { error } = await supabase  
        .from('orden_repuestos')  
        .delete()  
        .eq('id', partId)  
  
      if (error) throw error  
    } catch (error) {  
      console.error(`Error removing part ${partId}:`, error)  
      throw error  
    }  
  },  
  
  async initializeOrders(): Promise<void> {  
    try {  
      const orders = await orderService.getAllOrders()  
      console.log(`Initialized ${orders.length} orders`)  
    } catch (error) {  
      console.error('Error initializing orders:', error)  
      throw new Error('Failed to initialize orders. Please check your connection and try again.')  
    }  
  },  
}  
  
export default orderService