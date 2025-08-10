# Guía de Migración a Tipos Consolidados de Orders

Esta guía te ayudará a migrar tus pantallas y servicios existentes para usar los tipos consolidados de Orders.

## Paso 1: Actualizar Importaciones

### Antes
```typescript
// ❌ Importaciones individuales o tipos locales
import { OrderStatus, PaymentStatus } from '../services/supabase/order-service';

interface OrderType {
  id: string;
  numero_orden: string;
  estado: string;
  // ... más propiedades
}
```

### Después
```typescript
// ✅ Importación desde tipos consolidados
import { 
  Order, 
  OrderItem, 
  OrderStatus, 
  PaymentStatus,
  OrderType,        // Alias para compatibilidad
  OrderPartType     // Alias para compatibilidad
} from '../types';
```

## Paso 2: Actualizar Estados

### Antes
```typescript
const [order, setOrder] = useState<OrderType | null>(null);
const [orderParts, setOrderParts] = useState<OrderPartType[]>([]);
```

### Después
```typescript
const [order, setOrder] = useState<Order | null>(null);
const [orderParts, setOrderParts] = useState<OrderItem[]>([]);

// O mantener compatibilidad con alias
const [order, setOrder] = useState<OrderType | null>(null);
const [orderParts, setOrderParts] = useState<OrderPartType[]>([]);
```

## Paso 3: Actualizar Propiedades de Objetos

### Antes (propiedades en español)
```typescript
// ❌ Propiedades en español
order.numero_orden
order.estado
order.descripcion
order.fecha_creacion
order.client_id
order.vehiculo_id
order.tecnico_id
```

### Después (propiedades en inglés)
```typescript
// ✅ Propiedades en inglés
order.number
order.status
order.description
order.createdAt
order.clientId
order.vehicleId
order.technicianId
```

## Paso 4: Actualizar Llamadas a Servicios

### Antes
```typescript
// ❌ Llamadas con propiedades en español
const newOrder = await orderService.createOrder({
  client_id: selectedClient,
  vehiculo_id: selectedVehicle,
  estado: "reception",
  descripcion: description,
  observacion: notes,
  costo_mano_obra: laborCost,
  total_repuestos: partsTotal,
  impuesto: tax,
  moneda: currency,
  estado_pago: paymentStatus,
});
```

### Después
```typescript
// ✅ Llamadas con propiedades en inglés
const newOrder = await orderService.createOrder({
  clientId: selectedClient,
  vehicleId: selectedVehicle,
  status: "reception",
  description: description,
  notes: notes,
  laborCost: laborCost,
  partsTotal: partsTotal,
  tax: tax,
  currency: currency,
  paymentStatus: paymentStatus,
  // Propiedades requeridas adicionales
  subtotal: totals.totalParts,
  discount: 0,
  total: totals.total,
  paidAmount: 0,
  balance: totals.total,
  warranty: { parts: 0, labor: 0 },
  priority: 'medium',
});
```

## Paso 5: Actualizar Renderizado en JSX

### Antes
```typescript
// ❌ Propiedades en español en JSX
<Text>Orden: {order.numero_orden}</Text>
<Text>Estado: {order.estado}</Text>
<Text>Cliente: {client.nombre}</Text>
<Text>Vehículo: {vehicle.marca} {vehicle.modelo}</Text>
<Text>Placa: {vehicle.placa}</Text>
```

### Después
```typescript
// ✅ Propiedades en inglés en JSX
<Text>Orden: {order.number}</Text>
<Text>Estado: {order.status}</Text>
<Text>Cliente: {client.name}</Text>
<Text>Vehículo: {vehicle.make} {vehicle.model}</Text>
<Text>Placa: {vehicle.licensePlate}</Text>
```

## Paso 6: Actualizar Funciones de Filtrado y Búsqueda

### Antes
```typescript
// ❌ Filtrado con propiedades en español
const filtered = inventoryItems.filter((item: InventoryItemType) =>
  item.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
  item.codigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
  item.descripcion?.toLowerCase().includes(searchQuery.toLowerCase())
);
```

### Después
```typescript
// ✅ Filtrado con propiedades en inglés
const filtered = inventoryItems.filter((item: InventoryItemType) =>
  item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
  item.description?.toLowerCase().includes(searchQuery.toLowerCase())
);
```

## Paso 7: Actualizar Funciones de Cálculo

### Antes
```typescript
// ❌ Cálculos con propiedades en español
const total = selectedItems.reduce((sum, item) => {
  if (item.type === 'part' && item.partNumber) {
    const inventoryItem = inventoryItems.find((invItem: InventoryItemType) => 
      invItem.codigo === item.partNumber
    );
    return sum + (inventoryItem?.precio_venta || 0) * item.quantity;
  }
  return sum + (item.precio || 0) * item.quantity;
}, 0);
```

### Después
```typescript
// ✅ Cálculos con propiedades en inglés
const total = selectedItems.reduce((sum, item) => {
  if (item.type === 'part' && item.partNumber) {
    const inventoryItem = inventoryItems.find((invItem: InventoryItemType) => 
      invItem.sku === item.partNumber
    );
    return sum + (inventoryItem?.price || 0) * item.quantity;
  }
  return sum + (item.price || 0) * item.quantity;
}, 0);
```

## Paso 8: Actualizar Tipos de Parámetros

### Antes
```typescript
// ❌ Tipos locales o importaciones individuales
const handleOrderUpdate = (orderData: OrderType) => {
  // ...
};

const renderOrderItem = ({ item }: { item: OrderPartType }) => {
  // ...
};
```

### Después
```typescript
// ✅ Tipos consolidados
const handleOrderUpdate = (orderData: Order) => {
  // ...
};

const renderOrderItem = ({ item }: { item: OrderItem }) => {
  // ...
};

// O mantener compatibilidad
const handleOrderUpdate = (orderData: OrderType) => {
  // ...
};

const renderOrderItem = ({ item }: { item: OrderPartType }) => {
  // ...
};
```

## Paso 9: Eliminar Interfaces Locales

### Antes
```typescript
// ❌ Interfaces locales duplicadas
interface OrderType {
  id: string;
  numero_orden: string;
  estado: string;
  // ... más propiedades
}

interface OrderPartType {
  id: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  // ... más propiedades
}
```

### Después
```typescript
// ✅ Eliminar interfaces locales y usar tipos consolidados
// Las interfaces OrderType y OrderPartType ya están definidas en types/orders.ts
// como alias de Order y OrderItem respectivamente
```

## Paso 10: Verificar Compatibilidad

### Verificar que los alias funcionen
```typescript
// ✅ Estos tipos son equivalentes
type OrderType = Order;           // Alias para compatibilidad
type OrderPartType = OrderItem;   // Alias para compatibilidad

// Puedes usar cualquiera de los dos
const order1: Order = { /* ... */ };
const order2: OrderType = { /* ... */ }; // ✅ Funciona

const part1: OrderItem = { /* ... */ };
const part2: OrderPartType = { /* ... */ }; // ✅ Funciona
```

## Ejemplo Completo de Migración

### Archivo Antes
```typescript
// ❌ Archivo con tipos locales y propiedades en español
import { useState } from 'react';

interface OrderType {
  id: string;
  numero_orden: string;
  estado: string;
  descripcion: string;
  client_id: string;
  vehiculo_id: string;
}

export default function OrderScreen() {
  const [order, setOrder] = useState<OrderType | null>(null);
  
  const handleOrderUpdate = (orderData: OrderType) => {
    setOrder({
      ...orderData,
      estado: 'completed'
    });
  };
  
  return (
    <View>
      <Text>Orden: {order?.numero_orden}</Text>
      <Text>Estado: {order?.estado}</Text>
      <Text>Descripción: {order?.descripcion}</Text>
    </View>
  );
}
```

### Archivo Después
```typescript
// ✅ Archivo con tipos consolidados y propiedades en inglés
import { useState } from 'react';
import { Order, OrderType } from '../types';

export default function OrderScreen() {
  const [order, setOrder] = useState<Order | null>(null);
  
  const handleOrderUpdate = (orderData: Order) => {
    setOrder({
      ...orderData,
      status: 'completed'
    });
  };
  
  return (
    <View>
      <Text>Orden: {order?.number}</Text>
      <Text>Estado: {order?.status}</Text>
      <Text>Descripción: {order?.description}</Text>
    </View>
  );
}
```

## Verificación Final

Después de la migración, verifica que:

1. ✅ No hay errores de TypeScript
2. ✅ Las pantallas se renderizan correctamente
3. ✅ Los servicios funcionan con los nuevos tipos
4. ✅ No hay propiedades undefined o null inesperadas
5. ✅ El autocompletado funciona correctamente
6. ✅ Los tipos se exportan correctamente desde `types/index.ts`

## Resolución de Problemas Comunes

### Error: "Property does not exist on type"
- Verifica que estés usando las propiedades en inglés
- Asegúrate de que el tipo importado sea el correcto
- Revisa que no haya conflictos con tipos locales

### Error: "Type is not assignable"
- Verifica que los tipos de los parámetros coincidan
- Asegúrate de que las propiedades requeridas estén presentes
- Revisa que no haya incompatibilidades entre tipos

### Error: "Module has no exported member"
- Verifica que el tipo esté exportado desde `types/index.ts`
- Asegúrate de que la ruta de importación sea correcta
- Revisa que no haya errores de sintaxis en el archivo de tipos

## Recursos Adicionales

- [Documentación de tipos consolidados](./README.md)
- [Archivo de tipos de Orders](./orders.ts)
- [Exportaciones globales](./index.ts)
