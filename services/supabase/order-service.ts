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
} from '../../types/order';  
  
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
  
      const { data, error } = await query.order('created_at', { ascending: false });  
      if (error) throw error;  
  
      return (data || []).map(order => ({  
        ...order,  
        // ✅ CORREGIDO: Mapear campos de base de datos a tipos  
        clientId: order.client_id,  
        vehicleId: order.vehicle_id,  
        technicianId: order.technician_id,  
        estimatedCompletionDate: order.estimated_completion_date,  
        paymentStatus: order.payment_status,  
        paymentMethod: order.payment_method,  
        paymentNotes: order.payment_notes,  
        paidAmount: order.paid_amount,  
        createdAt: order.created_at,  
        updatedAt: order.updated_at,  
        // Initialize empty arrays that will be populated by separate queries  
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
      // Get the order  
      const { data: order, error } = await supabase  
        .from('ordenes_trabajo')  
        .select('*')  
        .eq('id', id)  
        .single();  
  
      if (error || !order) return null;  
  
      // Get related data  
      const [  
        { data: images },  
        { data: comments },  
        { data: items },  
        { data: repairProcesses },  
      ] = await Promise.all([  
        supabase.from('order_images').select('*').eq('order_id', id),  
        supabase.from('order_comments').select('*').eq('order_id', id).order('created_at', { ascending: false }),  
        supabase.from('order_items').select('*').eq('order_id', id),  
        supabase.from('repair_processes')  
          .select('*, images:process_images(*)')  
          .eq('order_id', id)  
          .order('start_date', { ascending: true }),  
      ]);  
  
      return {  
        ...order,  
        clientId: order.client_id,  
        vehicleId: order.vehicle_id,  
        technicianId: order.technician_id,  
        estimatedCompletionDate: order.estimated_completion_date,  
        paymentStatus: order.payment_status,  
        paymentMethod: order.payment_method,  
        paymentNotes: order.payment_notes,  
        paidAmount: order.paid_amount,  
        createdAt: order.created_at,  
        updatedAt: order.updated_at,  
        images: (images || []).map((img: any) => ({  
          id: img.id,  
          orderId: id,  
          url: img.url,  
          description: img.description,  
          createdAt: img.created_at,  
        })),  
        comments: (comments || []).map((c: any) => ({  
          id: c.id,  
          orderId: id,  
          userId: c.user_id,  
          userName: c.user_name,  
          userAvatar: c.user_avatar,  
          content: c.comment,  
          type: c.type || 'technician',  
          createdAt: c.created_at,  
          updatedAt: c.updated_at,  
        })),  
        items: (items || []).map((item: any) => ({  
          id: item.id,  
          orderId: id,  
          name: item.name,  
          quantity: item.quantity,  
          unitPrice: parseFloat(item.unit_price),  
          total: parseFloat(item.total),  
          partNumber: item.part_number,  
          supplier: item.supplier,  
          status: item.status,  
          createdAt: item.created_at,  
          updatedAt: item.updated_at,  
        })),  
        repairProcesses: (repairProcesses || []).map((p: any) => ({  
          id: p.id,  
          orderId: id,  
          name: p.name,  
          description: p.description,  
          startDate: p.start_date,  
          endDate: p.end_date,  
          status: p.status,  
          technicianId: p.technician_id,  
          technicianName: p.technician_name,  
          notes: p.notes,  
          images: (p.images || []).map((img: any) => ({  
            id: img.id,  
            orderId: id,  
            url: img.url,  
            description: img.description,  
            createdAt: img.created_at,  
          })),  
        })),  
      };  
    } catch (error) {  
      handleSupabaseError(error, `fetch order ${id}`);  
      return null;  
    }  
  },  
  
  // Get orders by client ID  
  getOrdersByClientId: async (clientId: string): Promise<Order[]> => {  
    try {  
      const { data, error } = await supabase  
        .from('ordenes_trabajo')  
        .select('*')  
        .eq('client_id', clientId)  
        .order('created_at', { ascending: false });  
  
      if (error) throw error;  
  
      return (data || []).map(order => ({  
        ...order,  
        clientId: order.client_id,  
        vehicleId: order.vehicle_id,  
        technicianId: order.technician_id,  
        estimatedCompletionDate: order.estimated_completion_date,  
        paymentStatus: order.payment_status,  
        paymentMethod: order.payment_method,  
        paymentNotes: order.payment_notes,  
        paidAmount: order.paid_amount,  
        createdAt: order.created_at,  
        updatedAt: order.updated_at,  
        images: [],  
        comments: [],  
        items: [],  
        repairProcesses: [],  
      }));  
    } catch (error) {  
      handleSupabaseError(error, 'fetch orders by client ID');  
      return [];  
    }  
  },  
  
  // Get orders by vehicle ID  
  getOrdersByVehicleId: async (vehicleId: string): Promise<Order[]> => {  
    try {  
      const { data, error } = await supabase  
        .from('ordenes_trabajo')  
        .select('*')  
        .eq('vehicle_id', vehicleId)  
        .order('created_at', { ascending: false });  
  
      if (error) throw error;  
  
      return (data || []).map(order => ({  
        ...order,  
        clientId: order.client_id,  
        vehicleId: order.vehicle_id,  
        technicianId: order.technician_id,  
        estimatedCompletionDate: order.estimated_completion_date,  
        paymentStatus: order.payment_status,  
        paymentMethod: order.payment_method,  
        paymentNotes: order.payment_notes,  
        paidAmount: order.paid_amount,  
        createdAt: order.created_at,  
        updatedAt: order.updated_at,  
        images: [],  
        comments: [],  
        items: [],  
        repairProcesses: [],  
      }));  
    } catch (error) {  
      handleSupabaseError(error, 'fetch orders by vehicle ID');  
      return [];  
    }  
  },  
  
  // ✅ CORREGIDO: Crear orden con todos los campos necesarios  
  createOrder: async (orderData: CreateOrderData): Promise<Order> => {  
    try {  
      const newOrder = {  
        client_id: orderData.clientId,  
        vehicle_id: orderData.vehicleId,  
        technician_id: orderData.technicianId,  
        description: orderData.description,  
        diagnosis: orderData.diagnosis,  
        status: orderData.status,  
        estimated_completion_date: orderData.estimatedCompletionDate,  
        total: orderData.total,  
        subtotal: orderData.subtotal,  
        tax: orderData.tax,  
        discount: orderData.discount,  
        currency: orderData.currency,  
        payment_status: orderData.paymentStatus,  
        payment_method: orderData.paymentMethod,  
        payment_notes: orderData.paymentNotes,  
        paid_amount: orderData.paidAmount,  
        notes: orderData.notes,  
        created_at: new Date().toISOString(),  
        updated_at: new Date().toISOString(),  
      };  
  
      const { data, error } = await supabase  
        .from('ordenes_trabajo')  
        .insert([newOrder])  
        .select()  
        .single();  
  
      if (error) throw error;  
  
      return {  
        ...data,  
        clientId: data.client_id,  
        vehicleId: data.vehicle_id,  
        technicianId: data.technician_id,  
        estimatedCompletionDate: data.estimated_completion_date,  
        paymentStatus: data.payment_status,  
        paymentMethod: data.payment_method,  
        paymentNotes: data.payment_notes,  
        paidAmount: data.paid_amount,  
        createdAt: data.created_at,  
        updatedAt: data.updated_at,  
        images: [],  
        comments: [],  
        items: [],  
        repairProcesses: [],  
      };  
    } catch (error) {  
      handleSupabaseError(error, 'create order');  
      throw error;  
    }  
  },  
  
   // ✅ CORREGIDO: Actualizar orden con todos los campos necesarios  
   updateOrder: async (id: string, updates: UpdateOrderData): Promise<Order | null> => {  
    try {  
      const updateData = {  
        description: updates.description,  
        diagnosis: updates.diagnosis,  
        status: updates.status,  
        estimated_completion_date: updates.estimatedCompletionDate,  
        total: updates.total,  
        subtotal: updates.subtotal,  
        tax: updates.tax,  
        discount: updates.discount,  
        payment_status: updates.paymentStatus,  
        payment_method: updates.paymentMethod,  
        payment_notes: updates.paymentNotes,  
        paid_amount: updates.paidAmount,  
        notes: updates.notes,  
        updated_at: new Date().toISOString(),  
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
  
  // Update order status  
  updateOrderStatus: async (id: string, status: OrderStatus): Promise<Order | null> => {  
    try {  
      const { error } = await supabase  
        .from('ordenes_trabajo')  
        .update({   
          status,  
          updated_at: new Date().toISOString()  
        })  
        .eq('id', id);  
  
      if (error) throw error;  
      return orderService.getOrderById(id);  
    } catch (error) {  
      handleSupabaseError(error, `update order status ${id}`);  
      throw error;  
    }  
  },  
  
  // Delete order  
  deleteOrder: async (id: string): Promise<void> => {  
    try {  
      const { error } = await supabase  
        .from('ordenes_trabajo')  
        .delete()  
        .eq('id', id);  
  
      if (error) throw error;  
    } catch (error) {  
      handleSupabaseError(error, `delete order ${id}`);  
      throw error;  
    }  
  },  
  
  // ✅ CORREGIDO: Agregar comentario sin campo userAvatar en el tipo  
  addOrderComment: async (orderId: string, comment: CreateOrderCommentData): Promise<OrderComment> => {  
    try {  
      const newComment = {  
        order_id: orderId,  
        user_id: comment.userId,  
        user_name: comment.userName,  
        user_avatar: comment.userAvatar,  
        comment: comment.content,  
        type: comment.type || 'technician',  
        created_at: new Date().toISOString(),  
        updated_at: new Date().toISOString(),  
      };  
  
      const { data, error } = await supabase  
        .from('order_comments')  
        .insert([newComment])  
        .select()  
        .single();  
  
      if (error) throw error;  
  
      return {  
        id: data.id,  
        orderId: orderId,  
        userId: data.user_id,  
        userName: data.user_name,  
        userAvatar: data.user_avatar,  
        content: data.comment,  
        type: data.type,  
        createdAt: data.created_at,  
        updatedAt: data.updated_at,  
      };  
    } catch (error) {  
      handleSupabaseError(error, `add comment to order ${orderId}`);  
      throw error;  
    }  
  },  
  
  // Get order parts  
  getOrderParts: async (orderId: string): Promise<OrderItem[]> => {  
    try {  
      const { data, error } = await supabase  
        .from('order_items')  
        .select('*')  
        .eq('order_id', orderId);  
  
      if (error) throw error;  
      return (data || []).map(item => ({  
        ...item,  
        orderId: orderId,  
        unitPrice: item.unit_price,  
        partNumber: item.part_number,  
        createdAt: item.created_at,  
        updatedAt: item.updated_at,  
      }));  
    } catch (error) {  
      handleSupabaseError(error, `fetch order parts for order ${orderId}`);  
      return [];  
    }  
  },  
  
  // Add part to order  
  addPartToOrder: async (orderId: string, partData: CreateOrderItemData): Promise<OrderItem> => {  
    try {  
      const newPart = {  
        order_id: orderId,  
        name: partData.name,  
        quantity: partData.quantity,  
        unit_price: partData.unitPrice,  
        total: partData.total,  
        part_number: partData.partNumber,  
        supplier: partData.supplier,  
        status: partData.status || 'pending',  
        created_at: new Date().toISOString(),  
        updated_at: new Date().toISOString(),  
      };  
  
      const { data, error } = await supabase  
        .from('order_items')  
        .insert([newPart])  
        .select()  
        .single();  
  
      if (error) throw error;  
  
      return {  
        ...data,  
        orderId: orderId,  
        unitPrice: data.unit_price,  
        partNumber: data.part_number,  
        createdAt: data.created_at,  
        updatedAt: data.updated_at,  
      };  
    } catch (error) {  
      handleSupabaseError(error, `add part to order ${orderId}`);  
      throw error;  
    }  
  },  
  
  // ✅ CORREGIDO: Update order part sin campo status en Partial<OrderItem>  
  updateOrderPart: async (partId: string, updates: Partial<CreateOrderItemData>): Promise<OrderItem> => {  
    try {  
      const updateData: any = {  
        name: updates.name,  
        quantity: updates.quantity,  
        unit_price: updates.unitPrice,  
        total: updates.total,  
        part_number: updates.partNumber,  
        supplier: updates.supplier,  
        status: updates.status,  
        updated_at: new Date().toISOString(),  
      };  
  
      const { data, error } = await supabase  
        .from('order_items')  
        .update(updateData)  
        .eq('id', partId)  
        .select()  
        .single();  
  
      if (error) throw error;  
  
      return {  
        ...data,  
        orderId: data.order_id,  
        unitPrice: data.unit_price,  
        partNumber: data.part_number,  
        createdAt: data.created_at,  
        updatedAt: data.updated_at,  
      };  
    } catch (error) {  
      handleSupabaseError(error, `update order part ${partId}`);  
      throw error;  
    }  
  },  
  
  // Remove part from order  
  removePartFromOrder: async (partId: string): Promise<void> => {  
    try {  
      const { error } = await supabase  
        .from('order_items')  
        .delete()  
        .eq('id', partId);  
  
      if (error) throw error;  
    } catch (error) {  
      handleSupabaseError(error, `remove order part ${partId}`);  
      throw error;  
    }  
  },  
  
  // ✅ CORREGIDO: Método de inicialización simplificado  
  initializeOrders: async (): Promise<void> => {  
    try {  
      const orders = await orderService.getAllOrders();  
      console.log(`Initialized ${orders.length} orders`);  
    } catch (error) {  
      console.error('Error initializing orders:', error);  
      throw error;  
    }  
  },  
};  
  
export default orderService;