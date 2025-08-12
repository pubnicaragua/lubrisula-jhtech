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

// Los tipos están ahora definidos en types/orders.ts y se importan desde ahí

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

      const { data, error } = await query.order('fecha_creacion', { ascending: false });
      if (error) throw error;

      return (data || []).map(order => ({
        ...order,
        // Map database fields to our type
        clientId: order.client_id,
        vehicleId: order.vehicle_id,
        technicianId: order.technician_id,
        estimatedCompletionDate: order.estimated_completion_date,
        completionDate: order.completion_date,
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
        estimatedCompletionDate: order.estimated_completion_date,
        completionDate: order.completion_date,
        paymentStatus: order.payment_status,
        paymentMethod: order.payment_method,
        paymentNotes: order.payment_notes,
        paidAmount: order.paid_amount,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        images: (images || []).map((img: any) => ({
          id: img.id,
          url: img.url,
          description: img.description,
          createdAt: img.created_at,
        })),
        comments: (comments || []).map((c: any) => ({
          id: c.id,
          userId: c.user_id,
          userName: c.user_name,
          userAvatar: c.user_avatar,
          content: c.content,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        })),
        items: (items || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unit_price),
          total: parseFloat(item.total_price),
          partNumber: item.part_number,
          supplier: item.supplier,
          status: item.status,
        })),
        repairProcesses: (repairProcesses || []).map((p: any) => ({
          id: p.id,
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

  // Create a new order
  createOrder: async (
    orderData: CreateOrderData
  ): Promise<Order> => {
    try {
      const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newOrder = {
        ...orderData,
        number: orderNumber,
        payment_status: orderData.paymentStatus,
        payment_method: orderData.paymentMethod,
        payment_notes: orderData.paymentNotes,
        estimated_completion_date: orderData.estimatedCompletionDate,
        completion_date: orderData.completionDate,
        paid_amount: orderData.paidAmount || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
      const updateData = {
        ...updates,
        payment_status: updates.paymentStatus,
        payment_method: updates.paymentMethod,
        payment_notes: updates.paymentNotes,
        estimated_completion_date: updates.estimatedCompletionDate,
        completion_date: updates.completionDate,
        paid_amount: updates.paidAmount,
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

  async updateOrderStatus(id: string, status: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('ordenes_trabajo')
        .update({ status })
        .eq('id', id)

      if (error) throw error
      return orderService.getOrderById(id)
    } catch (error) {
      handleSupabaseError(error, `update order status ${id}`);
      throw error;
    }
  },

  async deleteOrder(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('ordenes_trabajo').delete().eq('id', id)
      if (error) throw error
    } catch (error) {
      handleSupabaseError(error, `delete order ${id}`);
      throw error;
    }
  },

  // Add a comment to an order
  addOrderComment: async (
    orderId: string,
    comment: CreateOrderCommentData
  ): Promise<OrderComment> => {
    try {
      const newComment = {
        order_id: orderId,
        user_id: comment.userId,
        user_name: comment.userName,
        user_avatar: comment.userAvatar,
        content: comment.content,
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
        content: data.content,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        type: 'technician' // Default type, can be made configurable
      };
    } catch (error) {
      handleSupabaseError(error, `add comment to order ${orderId}`);
      throw error;
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
        // Map database fields to our type
        clientId: order.client_id,
        vehicleId: order.vehicle_id,
        technicianId: order.technician_id,
        estimatedCompletionDate: order.estimated_completion_date,
        completionDate: order.completion_date,
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
      }))
    } catch (error) {
      console.error('Error in getOrdersByClientId:', error)
      return []
    }
  },
  
  async initializeOrders(): Promise<void> {
    try {
      const orders = await orderService.getAllOrders();
    } catch (error) {
      console.error('Error initializing orders:', error);
      throw new Error('Failed to initialize orders. Please check your connection and try again.');
    }
  },

  // Get parts for a specific order
  async getOrderParts(orderId: string): Promise<OrderItem[]> {
    try {
      const { data, error } = await supabase
        .from('order_parts')
        .select('*')
        .eq('order_id', orderId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching order parts for order ${orderId}:`, error);
      throw error;
    }
  },

  // Add a part to an order
  async addPartToOrder(orderId: string, partData: CreateOrderItemData): Promise<OrderItem> {
    try {
      const { data, error } = await supabase
        .from('order_parts')
        .insert([{
          order_id: orderId,
          name: partData.name,
          quantity: partData.quantity,
          unit_price: partData.unitPrice,
          total: partData.total,
          part_number: partData.partNumber,
          supplier: partData.supplier,
          status: partData.status
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error adding part to order ${orderId}:`, error);
      throw error;
    }
  },

  // Update an order part
  async updateOrderPart(partId: string, updates: Partial<OrderItem>): Promise<OrderItem> {
    try {
      const updateData: any = { ...updates };
      
      // Map fields if necessary
      if ('unitPrice' in updates) updateData.unit_price = updates.unitPrice;
      if ('partNumber' in updates) updateData.part_number = updates.partNumber;

      const { data, error } = await supabase
        .from('order_parts')
        .update(updateData)
        .eq('id', partId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error updating order part ${partId}:`, error);
      throw error;
    }
  },

  // Remove a part from an order
  async removePartFromOrder(partId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('order_parts')
        .delete()
        .eq('id', partId);

      if (error) throw error;
    } catch (error) {
      console.error(`Error removing order part ${partId}:`, error);
      throw error;
    }
  },

  // Get orders by vehicle ID
  async getOrdersByVehicleId(vehicleId: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('ordenes_trabajo')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching orders for vehicle ${vehicleId}:`, error);
      throw error;
    }
  }
};

export default orderService;