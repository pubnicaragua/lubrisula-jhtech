// Tipos consolidados para el manejo de Orders en toda la aplicación
// Este archivo centraliza todas las definiciones de tipos relacionados con órdenes

import type { AppImage } from './index';

// ============================================================================
// ENUMS Y TIPOS BASE
// ============================================================================

export type OrderStatus = 
  | 'reception'      // Recepción
  | 'diagnosis'      // Diagnóstico
  | 'waiting_parts'  // Esperando repuestos
  | 'in_progress'    // En progreso
  | 'quality_check'  // Control de calidad
  | 'completed'      // Completado
  | 'delivered'      // Entregado
  | 'cancelled';     // Cancelado

export type PaymentStatus = 
  | 'pending'        // Pendiente
  | 'partial'        // Parcial
  | 'paid'           // Pagado
  | 'refunded';      // Reembolsado

export type OrderPriority = 
  | 'low'            // Baja
  | 'medium'         // Media
  | 'high';          // Alta

export type PartStatus = 
  | 'pending'        // Pendiente
  | 'ordered'        // Ordenado
  | 'received'       // Recibido
  | 'installed';     // Instalado

// ============================================================================
// TIPOS DE ITEMS Y REPUESTOS
// ============================================================================

export type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  partNumber?: string;        // SKU del repuesto
  supplier?: string;          // Proveedor
  status: PartStatus;         // Estado del repuesto
  // Campos adicionales para compatibilidad con inventario
  inventoryItemId?: string;   // ID del item en inventario
  sku?: string;               // SKU alternativo
  category?: string;          // Categoría del repuesto
  stock?: number;             // Stock disponible
};

export type ServiceItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration?: number;          // Duración estimada en minutos
  category?: string;          // Tipo de servicio
};

// ============================================================================
// TIPOS DE IMÁGENES Y COMENTARIOS
// ============================================================================

export type OrderImage = AppImage & {
  orderId: string;
  type: 'damage' | 'repair' | 'invoice' | 'other';
};

export type OrderComment = {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  type?: 'client' | 'technician' | 'system';
};

// ============================================================================
// TIPOS DE PROCESOS DE REPARACIÓN
// ============================================================================

export type RepairProcess = {
  id: string;
  orderId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  technicianId: string;
  technicianName: string;
  notes?: string;
  images: OrderImage[];
  estimatedDuration?: number; // Duración estimada en minutos
};

// ============================================================================
// TIPO PRINCIPAL DE ORDER
// ============================================================================

export type Order = {
  // Identificación básica
  id: string;
  number: string;                    // Número de orden
  
  // Relaciones principales
  clientId: string;
  vehicleId: string;
  technicianId: string;
  
  // Estado y prioridad
  status: OrderStatus;
  priority: OrderPriority;
  
  // Información del trabajo
  description?: string;              // Descripción del trabajo
  diagnosis?: string;                // Diagnóstico técnico
  notes?: string;                    // Observaciones generales
  
  // Fechas importantes
  estimatedCompletionDate?: string;  // Fecha estimada de entrega
  completionDate?: string;           // Fecha real de entrega
  
  // Información de pago
  paymentStatus: PaymentStatus;
  paymentMethod?: string;            // Método de pago
  paymentNotes?: string;             // Notas de pago
  
  // Cálculos financieros
  subtotal: number;                  // Subtotal sin impuestos
  tax: number;                       // Impuestos
  discount: number;                  // Descuentos
  total: number;                     // Total final
  paidAmount: number;                // Monto pagado
  balance: number;                   // Saldo pendiente
  
  // Garantía
  warranty: {
    parts: number;                   // Garantía en repuestos (meses)
    labor: number;                   // Garantía en mano de obra (meses)
  };
  
  // Arrays de datos relacionados
  images: OrderImage[];
  comments: OrderComment[];
  items: OrderItem[];                // Repuestos y servicios
  repairProcesses: RepairProcess[];
  
  // Metadatos
  createdAt: string;
  updatedAt: string;
};

// ============================================================================
// TIPOS PARA CREACIÓN Y ACTUALIZACIÓN
// ============================================================================

export type CreateOrderData = Omit<
  Order, 
  'id' | 'number' | 'images' | 'comments' | 'items' | 'repairProcesses' | 'createdAt' | 'updatedAt'
>;

export type UpdateOrderData = Partial<CreateOrderData>;

export type CreateOrderItemData = Omit<OrderItem, 'id'>;

export type CreateOrderCommentData = Omit<OrderComment, 'id' | 'createdAt' | 'updatedAt'>;

export type CreateRepairProcessData = Omit<RepairProcess, 'id' | 'images'>;

// ============================================================================
// TIPOS PARA FILTROS Y BÚSQUEDAS
// ============================================================================

export type OrderFilters = {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  priority?: OrderPriority;
  clientId?: string;
  vehicleId?: string;
  technicianId?: string;
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
};

export type OrderSortOptions = {
  field: 'createdAt' | 'updatedAt' | 'total' | 'priority' | 'status';
  direction: 'asc' | 'desc';
};

// ============================================================================
// TIPOS PARA ESTADÍSTICAS Y REPORTES
// ============================================================================

export type OrderStatistics = {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
  ordersByPaymentStatus: Record<PaymentStatus, number>;
  topClients: Array<{ clientId: string; clientName: string; orderCount: number; totalSpent: number }>;
  topTechnicians: Array<{ technicianId: string; technicianName: string; completedOrders: number; totalRevenue: number }>;
};

// ============================================================================
// TIPOS PARA NOTIFICACIONES Y ALERTAS
// ============================================================================

export type OrderNotification = {
  id: string;
  orderId: string;
  type: 'status_change' | 'payment_received' | 'parts_arrived' | 'completion_reminder';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  userId: string;
};

// ============================================================================
// TIPOS PARA COMPATIBILIDAD CON CÓDIGO EXISTENTE
// ============================================================================

// Tipo para compatibilidad con código que usa nombres en español
export type OrderType = Order;

// Tipo para compatibilidad con código que usa nombres en español
export type OrderPartType = OrderItem;

// Tipo para compatibilidad con código que usa nombres en español
export type OrdenTrabajoType = Order;

// Tipo para compatibilidad con código que usa nombres en español
export type RepuestoOrdenType = OrderItem;
