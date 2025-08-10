# Tipos Consolidados para Orders

Este directorio contiene todos los tipos TypeScript consolidados para el manejo de Orders en la aplicación AutoFlowX.

## Archivos

### `orders.ts` - Tipos principales de Orders
Contiene todas las interfaces y tipos relacionados con órdenes de trabajo, incluyendo:

- **OrderStatus**: Estados de una orden (reception, diagnosis, waiting_parts, etc.)
- **PaymentStatus**: Estados de pago (pending, partial, paid, refunded)
- **OrderPriority**: Prioridades (low, medium, high)
- **PartStatus**: Estados de repuestos (pending, ordered, received, installed)
- **Order**: Tipo principal de orden con todas las propiedades
- **OrderItem**: Tipo para items/repuestos en una orden
- **OrderImage**: Imágenes asociadas a una orden
- **OrderComment**: Comentarios en una orden
- **RepairProcess**: Procesos de reparación
- **ServiceItem**: Servicios que se pueden agregar a una orden

### `index.ts` - Exportaciones globales
Re-exporta todos los tipos de Orders para uso global en la aplicación.

## Uso

### Importación básica
```typescript
import { Order, OrderItem, OrderStatus } from '../types';
```

### Importación de tipos específicos
```typescript
import type { 
  CreateOrderData, 
  UpdateOrderData, 
  OrderFilters 
} from '../types';
```

### Tipos de compatibilidad
Para mantener compatibilidad con código existente, se incluyen alias:

```typescript
// Estos tipos son equivalentes
export type OrderType = Order;
export type OrderPartType = OrderItem;
export type OrdenTrabajoType = Order;
export type RepuestoOrdenType = OrderItem;
```

## Migración

### Antes (tipos locales)
```typescript
// ❌ NO USAR - Tipos locales duplicados
interface OrderType {
  id: string;
  numero_orden: string;
  estado: string;
  // ... más propiedades en español
}
```

### Después (tipos consolidados)
```typescript
// ✅ USAR - Tipos consolidados
import { Order } from '../types';

const [order, setOrder] = useState<Order | null>(null);
```

## Estructura de Order

```typescript
type Order = {
  // Identificación básica
  id: string;
  number: string;
  
  // Relaciones principales
  clientId: string;
  vehicleId: string;
  technicianId: string;
  
  // Estado y prioridad
  status: OrderStatus;
  priority: OrderPriority;
  
  // Información del trabajo
  description?: string;
  diagnosis?: string;
  notes?: string;
  
  // Fechas importantes
  estimatedCompletionDate?: string;
  completionDate?: string;
  
  // Información de pago
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  paymentNotes?: string;
  
  // Cálculos financieros
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paidAmount: number;
  balance: number;
  
  // Garantía
  warranty: {
    parts: number;
    labor: number;
  };
  
  // Arrays de datos relacionados
  images: OrderImage[];
  comments: OrderComment[];
  items: OrderItem[];
  repairProcesses: RepairProcess[];
  
  // Metadatos
  createdAt: string;
  updatedAt: string;
};
```

## Estructura de OrderItem

```typescript
type OrderItem = {
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
```

## Tipos para Creación y Actualización

```typescript
// Para crear una nueva orden
type CreateOrderData = Omit<
  Order, 
  'id' | 'number' | 'images' | 'comments' | 'items' | 'repairProcesses' | 'createdAt' | 'updatedAt'
>;

// Para actualizar una orden existente
type UpdateOrderData = Partial<CreateOrderData>;

// Para crear un item en una orden
type CreateOrderItemData = Omit<OrderItem, 'id'>;
```

## Filtros y Búsquedas

```typescript
type OrderFilters = {
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

type OrderSortOptions = {
  field: 'createdAt' | 'updatedAt' | 'total' | 'priority' | 'status';
  direction: 'asc' | 'desc';
};
```

## Beneficios de la Consolidación

1. **Consistencia**: Todos los tipos están definidos en un solo lugar
2. **Mantenibilidad**: Cambios en tipos se reflejan en toda la aplicación
3. **Reutilización**: Los tipos se pueden usar en pantallas y servicios
4. **Documentación**: Comentarios claros en español para cada propiedad
5. **Compatibilidad**: Alias para mantener código existente funcionando
6. **Tipado fuerte**: Mejor autocompletado y detección de errores

## Próximos Pasos

1. Migrar todas las pantallas para usar estos tipos consolidados
2. Eliminar interfaces duplicadas en archivos individuales
3. Actualizar servicios para usar los tipos consolidados
4. Agregar validaciones y transformaciones de datos
5. Implementar tests de tipos con TypeScript
