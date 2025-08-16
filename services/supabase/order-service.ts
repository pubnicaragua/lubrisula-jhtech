import { supabase } from '../../lib/supabase';  
import type {   
  Order,   
  OrderItem,   
  OrderStatus,   
  PaymentStatus,   
  OrderImage,   
  OrderComment,   
  RepairProcess,  
  CreateOrderData,  
  UpdateOrderData,  
  CreateOrderItemData,  
  CreateOrderCommentData  
} from '../../types';  
  
const handleSupabaseError = (error: any, context: string) => {  
  console.error(`Error ${context}:`, error);  
  throw new Error(`Failed to ${context}: ${error.message}`);  
};  
  
export const orderService = {  
  // Get all orders with optional filtering  
  getAllOrders: async (filters: Record<string, any> = {}): Promise<Order[]> => {  
    try {  
      let query = supabase.from('ordenes_trabajo').select('*');  
  
      Object.entries(filters).forEach(([key, value]) => {  
        if (value !== undefined && value !== null) {  
          query = query.eq(key, value);  
        }  
      });  
  
      // ✅ CORREGIDO: Usar campo real del schema  
      const { data, error } = await query.order('fecha_creacion', { ascending: false });  
      if (error) throw error;  
  
      return (data || []).map(order => ({  
        ...order,  
        // ✅ CORREGIDO: Mapear solo campos que existen en el schema real  
        id: order.id,  
        client_id: order.client_id,  
        vehiculo_id: order.vehiculo_id, // ✅ Campo real del schema  
        tecnico_id: order.tecnico_id,   // ✅ Campo real del schema  
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
      }));  
    } catch (error) {  
      handleSupabaseError(error, 'fetch orders');  
      return [];  
    }  
  },  
  
  // Get order by ID with all related data  
  getOrderById: async (id: string): Promise<Order | null> => {  
    try {  
      // ✅ CORREGIDO: Consultar solo la tabla principal  
      const { data: order, error } = await supabase  
        .from('ordenes_trabajo')  
        .select('*')  
        .eq('id', id)  
        .single();  
  
      if (error) throw error;  
      if (!order) return null;  
  
      // ✅ CORREGIDO: Consultar tabla de repuestos real  
      const { data: parts, error: partsError } = await supabase  
        .from('orden_repuestos')  
        .select('*')  
        .eq('orden_id', id);  
  
        if (partsError) {  
          console.warn("Error al cargar repuestos:", partsError);  
        }  
    
        return {  
          ...order,  
          // ✅ CORREGIDO: Mapear campos del schema real  
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
        };  
      } catch (error) {  
        handleSupabaseError(error, `fetch order ${id}`);  
        return null;  
      }  
    },  
    
    // Create a new order  
    createOrder: async (orderData: CreateOrderData): Promise<Order> => {  
      try {  
        const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;  
    
        // ✅ CORREGIDO: Usar campos del schema real  
        const newOrder = {  
          client_id: orderData.clientId,  
          vehiculo_id: orderData.vehicleId,  
          tecnico_id: orderData.technicianId,  
          descripcion: orderData.description,  
          diagnostico: orderData.diagnosis,  
          estado: orderData.status || 'reception',  
          costo: orderData.total || 0,  
          fecha_creacion: new Date().toISOString(),  
          fecha_entrega: orderData.estimatedCompletionDate,  
          prioridad: orderData.priority || 'normal',  
          observacion: orderData.notes || '',  
          numero_orden: orderNumber,  
        };  
    
        const { data, error } = await supabase  
          .from('ordenes_trabajo')  
          .insert([newOrder])  
          .select()  
          .single();  
    
        if (error) throw error;  
    
        return orderService.getOrderById(data.id) as Promise<Order>;  
      } catch (error) {  
        handleSupabaseError(error, 'create order');  
        throw error;  
      }  
    },  
    
    // Update an order  
    updateOrder: async (id: string, updates: UpdateOrderData): Promise<Order | null> => {  
      try {  
        // ✅ CORREGIDO: Mapear campos para el schema real  
        const updateData = {  
          descripcion: updates.description,  
          diagnostico: updates.diagnosis,  
          estado: updates.status,  
          costo: updates.total,  
          fecha_entrega: updates.estimatedCompletionDate,  
          prioridad: updates.priority,  
          observacion: updates.notes,  
          fecha_actualizacion: new Date().toISOString(),  
        };  
    
        const { error } = await supabase  
          .from('ordenes_trabajo')  
          .update(updateData)  
          .eq('id', id);  
    
        if (error) throw error;  
    
        return orderService.getOrderById(id);  
      } catch (error) {  
        handleSupabaseError(error, `update order ${id}`);  
        throw error;  
      }  
    },  
    
    async updateOrderStatus(id: string, status: string): Promise<Order | null> {  
      try {  
        const { error } = await supabase  
          .from('ordenes_trabajo')  
          .update({ estado: status }) // ✅ CORREGIDO: Usar 'estado' del schema real  
          .eq('id', id);  
    
        if (error) throw error;  
        return orderService.getOrderById(id);  
      } catch (error) {  
        handleSupabaseError(error, `update order status ${id}`);  
        throw error;  
      }  
    },  
    
    async deleteOrder(id: string): Promise<void> {  
      try {  
        const { error } = await supabase.from('ordenes_trabajo').delete().eq('id', id);  
        if (error) throw error;  
      } catch (error) {  
        handleSupabaseError(error, `delete order ${id}`);  
        throw error;  
      }  
    },  
    
    async getOrdersByClientId(clientId: string): Promise<Order[]> {  
      try {  
        const { data, error } = await supabase  
          .from('ordenes_trabajo')  
          .select('*')  
          .eq('client_id', clientId)  
          .order('fecha_creacion', { ascending: false }); // ✅ CORREGIDO: Campo real  
    
        if (error) {  
          console.error('Error getting orders by client ID:', error);  
          return [];  
        }  
    
        return (data || []).map(order => ({  
          ...order,  
          // ✅ CORREGIDO: Mapear campos del schema real  
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
        }));  
      } catch (error) {  
        console.error('Error in getOrdersByClientId:', error);  
        return [];  
      }  
    },  
    
    async getOrdersByVehicleId(vehicleId: string): Promise<Order[]> {  
      try {  
        const { data, error } = await supabase  
          .from('ordenes_trabajo')  
          .select('*')  
          .eq('vehiculo_id', vehicleId) // ✅ CORREGIDO: Campo real del schema  
          .order('fecha_creacion', { ascending: false }); // ✅ CORREGIDO: Campo real  
    
        if (error) throw error;  
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
        }));  
      } catch (error) {  
        console.error(`Error fetching orders for vehicle ${vehicleId}:`, error);  
        throw error;  
      }  
    },  
    
    // ✅ CORREGIDO: Métodos para repuestos usando tabla real  
    async getOrderParts(orderId: string): Promise<OrderItem[]> {  
      try {  
        const { data, error } = await supabase  
          .from('orden_repuestos') // ✅ Tabla real del schema  
          .select('*')  
          .eq('orden_id', orderId);  
    
        if (error) throw error;  
        return (data || []).map((part: any) => ({  
          id: part.id,  
          name: part.nombre,  
          quantity: part.cantidad,  
          unitPrice: part.precio_unitario,  
          total: part.total,  
          partNumber: part.numero_parte,  
          supplier: part.proveedor,  
          status: part.estado  
        }));  
      } catch (error) {  
        console.error(`Error fetching order parts for order ${orderId}:`, error);  
        throw error;  
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
          .single();  
    
        if (error) throw error;  
        return {  
          id: data.id,  
          name: data.nombre,  
          quantity: data.cantidad,  
          unitPrice: data.precio_unitario,  
          total: data.total,  
          partNumber: data.numero_parte,  
          supplier: data.proveedor,  
          status: data.estado  
        };  
      } catch (error) {  
        console.error(`Error adding part to order ${orderId}:`, error);  
        throw error;  
      }  
    },  
    
    async initializeOrders(): Promise<void> {  
      try {  
        const orders = await orderService.getAllOrders();  
        console.log(`Initialized ${orders.length} orders`);  
      } catch (error) {  
        console.error('Error initializing orders:', error);  
        throw new Error('Failed to initialize orders. Please check your connection and try again.');  
      }  
    },  
  };  
    
  export default orderService;