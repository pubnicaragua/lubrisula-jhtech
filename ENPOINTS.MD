Basándome en la información recopilada durante nuestra conversación, aquí está la tabla detallada con el formato solicitado de pantalla, método, path/rpc y parámetros body:

## Tabla de Pantallas con Métodos y Rutas API

| Pantalla | Método | Path/RPC | Parámetros Body | Estado |
|----------|--------|----------|-----------------|--------|
| **dashboard-screen.tsx** | `loadDashboardData()` | `POST /rest/v1/rpc/get_dashboard` | `{ "p_tecnico_id": integer }` | ✅ |
| **dashboard-screen.tsx** | `loadDashboardData()` | `POST /rest/v1/rpc/get_ordenes_por_tecnico` | `{ "p_tecnico_id": integer }` | ✅ |
| **dashboard-screen.tsx** | `loadDashboardData()` | `GET /rest/v1/clients` | `{}` | ✅ |
| **dashboard-screen.tsx** | `loadDashboardData()` | `GET /rest/v1/orders` | `{}` | ✅ |
| **dashboard-screen.tsx** | `loadDashboardData()` | `GET /rest/v1/inventory?stock=lte.5` | `{}` | ✅ |
| **client-dashboard-screen.tsx** | `loadDashboardData()` | `GET /rest/v1/clients?id=eq.{userId}` | `{}` | ⚠️ |
| **client-dashboard-screen.tsx** | `loadDashboardData()` | `GET /rest/v1/vehicles?client_id=eq.{userId}` | `{}` | ⚠️ |
| **client-dashboard-screen.tsx** | `loadDashboardData()` | `GET /rest/v1/orders?client_id=eq.{userId}` | `{}` | ⚠️ |
| **client-dashboard-screen.tsx** | `loadDashboardData()` | `GET /rest/v1/citas?client_id=eq.{userId}` | `{}` | ❌ |
| **inventory-screen.tsx** | `loadInventoryData()` | `GET /rest/v1/inventory` | `{}` | ❌ |
| **inventory-screen.tsx** | `loadInventoryData()` | `GET /rest/v1/inventory_categories` | `{}` | ❌ |
| **inventory-screen.tsx** | `loadInventoryData()` | `POST /rest/v1/rpc/user_has_role` | `{ "role_name": "string" }` | ❌ |
| **inventory-item-detail-screen.tsx** | `loadItemData()` | `GET /rest/v1/inventory?id=eq.{itemId}` | `{}` | ✅ |
| **inventory-item-detail-screen.tsx** | `adjustStock()` | `PUT /rest/v1/inventory?id=eq.{itemId}` | `{ "stock_actual": integer, "updated_at": "timestamp" }` | ✅ |
| **client-detail-screen.tsx** | `loadClientData()` | `GET /rest/v1/clients?id=eq.{clientId}` | `{}` | ❌ |
| **client-detail-screen.tsx** | `loadClientData()` | `GET /rest/v1/vehicles?client_id=eq.{clientId}` | `{}` | ❌ |
| **client-detail-screen.tsx** | `loadClientData()` | `GET /rest/v1/orders?client_id=eq.{clientId}` | `{}` | ❌ |
| **client-detail-screen.tsx** | `handleUpdateClient()` | `PUT /rest/v1/clients?id=eq.{clientId}` | `{ "name": "string", "email": "string", "phone": "string", "company": "string", "updated_at": "timestamp" }` | ❌ |
| **client-detail-screen.tsx** | `handleDeleteClient()` | `DELETE /rest/v1/clients?id=eq.{clientId}` | `{}` | ❌ |
| **vehicle-detail-screen.tsx** | `loadVehicleData()` | `GET /rest/v1/vehicles?id=eq.{vehicleId}` | `{}` | ✅ |
| **vehicle-detail-screen.tsx** | `loadVehicleData()` | `GET /rest/v1/clients?id=eq.{clientId}` | `{}` | ✅ |
| **vehicle-detail-screen.tsx** | `loadVehicleData()` | `GET /rest/v1/orders?vehiculo_id=eq.{vehicleId}` | `{}` | ✅ |
| **vehicle-detail-screen.tsx** | `loadVehicleData()` | `GET /rest/v1/citas?vehiculo_id=eq.{vehicleId}` | `{}` | ❌ |
| **profile-screen.tsx** | `loadUserProfile()` | `GET /rest/v1/perfil_usuario?id=eq.{userId}` | `{}` | ❌ |
| **profile-screen.tsx** | `loadUserProfile()` | `POST /rest/v1/rpc/user_has_role` | `{ "role_name": "string" }` | ❌ |
| **profile-screen.tsx** | `handleUpdateProfile()` | `PUT /rest/v1/perfil_usuario?id=eq.{userId}` | `{ "name": "string", "email": "string", "phone": "string", "company": "string" }` | ❌ |
| **new-client-screen.tsx** | `handleSave()` | `POST /rest/v1/clients` | `{ "name": "string", "email": "string", "phone": "string", "company": "string", "client_type": "string", "status": "string" }` | ❌ |
| **login-screen.tsx** | `handleLogin()` | `POST /auth/v1/token?grant_type=password` | `{ "email": "string", "password": "string" }` | ❌ |
| **login-screen.tsx** | `handleLogin()` | `GET /rest/v1/perfil_usuario?id=eq.{userId}` | `{}` | ❌ |
| **login-screen.tsx** | `handleLogin()` | `POST /rest/v1/rpc/user_has_role` | `{ "role_name": "string" }` | ❌ |

## Funciones RPC Especializadas Disponibles

| Función RPC | Parámetros | Body Example | Uso Recomendado |
|-------------|------------|--------------|-----------------|
| `get_dashboard` | `p_tecnico_id: integer` | `{ "p_tecnico_id": 123 }` | Dashboard de técnicos |
| `get_ordenes_por_tecnico` | `p_tecnico_id: integer` | `{ "p_tecnico_id": 123 }` | Órdenes por técnico específico |
| `get_ordenes_tecnico` | `p_taller_id: uuid, p_tecnico_id: uuid, p_estado: text, p_limit: integer, p_offset: integer` | `{ "p_taller_id": "uuid", "p_tecnico_id": "uuid", "p_estado": "Pendiente", "p_limit": 20, "p_offset": 0 }` | Órdenes con filtros avanzados |
| `user_has_role` | `role_name: text` | `{ "role_name": "admin" }` | Verificación de roles |
| `actualizar_costos_proceso` | - | `{}` | Trigger automático de costos |

## Leyenda de Estados

- ✅ **Moderno**: Usa servicios de Supabase modernos y funciona correctamente
- ⚠️ **Mixto**: Combina servicios modernos y legacy, requiere ajustes menores
- ❌ **Legacy**: Usa servicios legacy que no existen, requiere migración completa [1](#17-0) [2](#17-1) [3](#17-2) [4](#17-3) 

**Notes**


Esta tabla proporciona una vista detallada de cada pantalla con sus métodos específicos, las rutas de API que consumen y los parámetros body requeridos. Los estados indican el nivel de migración hacia la arquitectura moderna de Supabase.

Wiki pages you might want to explore:
- [Service Layer Architecture (pubnicaragua/autoflowx-apps)](/wiki/pubnicaragua/autoflowx-apps#3.3)
- [User Interface & Screens (pubnicaragua/autoflowx-apps)](/wiki/pubnicaragua/autoflowx-apps#4)




Basándome en el documento anterior, aquí está la versión expandida con todas las operaciones CRUD necesarias para cada pantalla:

# Endpoints por Pantalla con CRUD Completo - AutoFlowX

## Dashboard Principal

### `dashboard-screen.tsx`
**Estado**: ✅ Moderno (Funcional)

| Operación | Método HTTP | Endpoint/RPC | Body Parameters | Descripción |
|-----------|-------------|--------------|-----------------|-------------|
| **READ** | POST | `/rest/v1/rpc/get_dashboard` | `{"p_tecnico_id": integer}` | Estadísticas del dashboard |
| **READ** | POST | `/rest/v1/rpc/get_ordenes_por_tecnico` | `{"p_tecnico_id": integer}` | Órdenes por técnico |
| **READ** | GET | `/rest/v1/clients` | `{}` | Lista de clientes |
| **READ** | GET | `/rest/v1/orders` | `{}` | Lista de órdenes |
| **READ** | GET | `/rest/v1/inventory?stock=lte.5` | `{}` | Items con stock bajo | [1](#20-0) 

---

## Dashboard de Cliente

### `client-dashboard-screen.tsx`
**Estado**: ⚠️ Mixto (Requiere ajustes)

| Operación | Método HTTP | Endpoint/RPC | Body Parameters | Descripción |
|-----------|-------------|--------------|-----------------|-------------|
| **READ** | GET | `/rest/v1/clients?id=eq.{userId}` | `{}` | Datos del cliente |
| **READ** | GET | `/rest/v1/vehicles?client_id=eq.{userId}` | `{}` | Vehículos del cliente |
| **READ** | GET | `/rest/v1/orders?client_id=eq.{userId}` | `{}` | Órdenes del cliente |
| **READ** | GET | `/rest/v1/citas?client_id=eq.{userId}` | `{}` | ⚠️ Citas del cliente (servicio faltante) | [2](#20-1) 

---

## Gestión de Inventario

### `inventory-screen.tsx`
**Estado**: ❌ Legacy (Requiere migración completa)

| Operación | Método HTTP | Endpoint/RPC | Body Parameters | Descripción |
|-----------|-------------|--------------|-----------------|-------------|
| **CREATE** | POST | `/rest/v1/inventory` | `{"codigo": "string", "nombre": "string", "categoria_id": "string", "precio_compra": number, "precio_venta": number, "stock_actual": number, "stock_minimo": number, "ubicacion_almacen": "string"}` | ❌ Crear item de inventario |
| **READ** | GET | `/rest/v1/inventory` | `{}` | ❌ Lista de inventario |
| **READ** | GET | `/rest/v1/inventory_categories` | `{}` | ❌ Categorías |
| **UPDATE** | PUT | `/rest/v1/inventory?id=eq.{itemId}` | `{"stock_actual": integer, "precio_compra": number, "precio_venta": number, "updated_at": "timestamp"}` | ❌ Actualizar item |
| **DELETE** | DELETE | `/rest/v1/inventory?id=eq.{itemId}` | `{}` | ❌ Eliminar item |
| **READ** | POST | `/rest/v1/rpc/user_has_role` | `{"role_name": "string"}` | ❌ Verificar permisos | [3](#20-2) 

### `inventory-item-detail-screen.tsx`
**Estado**: ✅ Moderno (Funcional)

| Operación | Método HTTP | Endpoint/RPC | Body Parameters | Descripción |
|-----------|-------------|--------------|-----------------|-------------|
| **READ** | GET | `/rest/v1/inventory?id=eq.{itemId}` | `{}` | Detalles del item |
| **READ** | GET | `/rest/v1/inventory_history?item_id=eq.{itemId}` | `{}` | Historial de movimientos |
| **UPDATE** | PUT | `/rest/v1/inventory?id=eq.{itemId}` | `{"stock_actual": integer, "updated_at": "timestamp"}` | Ajustar stock |
| **CREATE** | POST | `/rest/v1/inventory_movements` | `{"item_id": "string", "tipo": "string", "cantidad": integer, "motivo": "string"}` | Registrar movimiento |
| **DELETE** | DELETE | `/rest/v1/inventory?id=eq.{itemId}` | `{}` | Eliminar item (con permisos) |

### `new-inventory-item-screen.tsx`
**Estado**: ❌ Legacy (Requiere migración)

| Operación | Método HTTP | Endpoint/RPC | Body Parameters | Descripción |
|-----------|-------------|--------------|-----------------|-------------|
| **CREATE** | POST | `/rest/v1/inventory` | `{"codigo": "string", "nombre": "string", "categoria_id": "string", "precio_compra": number, "precio_venta": number, "stock_actual": number, "stock_minimo": number, "ubicacion_almacen": "string"}` | ❌ Crear item |

---

## Gestión de Clientes

### `client-detail-screen.tsx`
**Estado**: ❌ Legacy (Requiere migración completa)

| Operación | Método HTTP | Endpoint/RPC | Body Parameters | Descripción |
|-----------|-------------|--------------|-----------------|-------------|
| **READ** | GET | `/rest/v1/clients?id=eq.{clientId}` | `{}` | ❌ Datos del cliente |
| **READ** | GET | `/rest/v1/vehicles?client_id=eq.{clientId}` | `{}` | ❌ Vehículos del cliente |
| **READ** | GET | `/rest/v1/orders?client_id=eq.{clientId}` | `{}` | ❌ Órdenes del cliente |
| **UPDATE** | PUT | `/rest/v1/clients?id=eq.{clientId}` | `{"name": "string", "email": "string", "phone": "string", "company": "string", "updated_at": "timestamp"}` | ❌ Actualizar cliente |
| **DELETE** | DELETE | `/rest/v1/clients?id=eq.{clientId}` | `{}` | ❌ Eliminar cliente | [4](#20-3) [5](#20-4) 

### `new-client-screen.tsx`
**Estado**: ❌ Legacy (Requiere migración)

| Operación | Método HTTP | Endpoint/RPC | Body Parameters | Descripción |
|-----------|-------------|--------------|-----------------|-------------|
| **CREATE** | POST | `/rest/v1/clients` | `{"name": "string", "email": "string", "phone": "string", "company": "string", "client_type": "string", "status": "string"}` | ❌ Crear cliente | [6](#20-5) 

### **Pantalla de Lista de Clientes** (Faltante)
**Estado**: ❌ Requiere creación

| Operación | Método HTTP | Endpoint/RPC | Body Parameters | Descripción |
|-----------|-------------|--------------|-----------------|-------------|
| **READ** | GET | `/rest/v1/clients` | `{}` | Lista todos los clientes |
| **READ** | GET | `/rest/v1/clients?name=ilike.%{searchTerm}%` | `{}` | Buscar clientes por nombre |
| **READ** | GET | `/rest/v1/clients?client_type=eq.{type}` | `{}` | Filtrar por tipo de cliente |

---

## Gestión de Vehículos

### `vehicle-detail-screen.tsx`
**Estado**: ⚠️ Mixto (Funcional con servicios faltantes)

| Operación | Método HTTP | Endpoint/RPC | Body Parameters | Descripción |
|-----------|-------------|--------------|-----------------|-------------|
| **READ** | GET | `/rest/v1/vehicles?id=eq.{vehicleId}` | `{}` | Datos del vehículo |
| **READ** | GET | `/rest/v1/clients?id=eq.{clientId}` | `{}` | Datos del propietario |
| **READ** | GET | `/rest/v1/orders?vehiculo_id=eq.{vehicleId}` | `{}` | Órdenes del vehículo |
| **READ** | GET | `/rest/v1/citas?vehiculo_id=eq.{vehicleId}` | `{}` | ⚠️ Citas del vehículo (servicio faltante) |
| **UPDATE** | PUT | `/rest/v1/vehicles?id=eq.{vehicleId}` | `{"marca": "string", "modelo": "string", "año": integer, "placa": "string", "kilometraje": integer, "updated_at": "timestamp"}` | Actualizar vehículo |
| **DELETE** | DELETE | `/rest/v1/vehicles?id=eq.{vehicleId}` | `{}` | Eliminar vehículo | [7](#20-6) 

### **Pantalla de Nuevo Vehículo** (Faltante)
**Estado**: ❌ Requiere creación

| Operación | Método HTTP | Endpoint/RPC | Body Parameters | Descripción |
|-----------|-------------|--------------|-----------------|-------------|
| **CREATE** | POST | `/rest/v1/vehicles` | `{"client_id": "string", "marca": "string", "modelo": "string", "año": integer, "placa": "string", "vin": "string", "color": "string", "kilometraje": integer}` | Crear nuevo vehículo |

### **Pantalla de Lista de Vehículos** (Faltante)
**Estado**: ❌ Requiere creación

| Operación | Método HTTP | Endpoint/RPC | Body Parameters | Descripción |
|-----------|-------------|--------------|-----------------|-------------|
| **READ** | GET | `/rest/v1/vehicles` | `{}` | Lista todos los vehículos |
| **READ** | GET | `/rest/v1/vehicles?marca=ilike.%{searchTerm}%` | `{}` | Buscar por marca |
| **READ** | GET | `/rest/v1/vehicles?placa=ilike.%{searchTerm}%` | `{}` | Buscar por placa |

---

## Gestión de Órdenes

### **Pantalla de Lista de Órdenes** (Faltante)
**Estado**: ❌ Requiere creación

| Operación | Método HTTP | Endpoint/RPC | Body Parameters | Descripción |
|-----------|-------------|--------------|-----------------|-------------|
| **CREATE** | POST | `/rest/v1/orders` | `{"client_id": "string", "vehiculo_id": "string", "descripcion": "string", "estado": "string", "prioridad": "string", "tecnico_id": "string"}` | Crear nueva orden |
| **READ** | GET | `/rest/v1/orders` | `{}` | Lista todas las órdenes |
| **READ** | POST | `/rest/v1/rpc/get_ordenes_tecnico` | `{"p_taller_id": "uuid", "p_tecnico_id": "uuid", "p_estado": "string", "p_limit": 20, "p_offset": 0}` | Órdenes con filtros |
| **UPDATE** | PUT | `/rest/v1/orders?id=eq.{orderId}` | `{"estado": "string", "descripcion": "string", "costo": number, "updated_at": "timestamp"}` | Actualizar orden |
| **DELETE** | DELETE | `/rest/v1/orders?id=eq.{orderId}` | `{}` | Eliminar orden |

### **Pantalla de Detalle de Orden** (Faltante)
**Estado**: ❌ Requiere creación

| Operación | Método HTTP | Endpoint/RPC | Body Parameters | Descripción |
|-----------|-------------|--------------|-----------------|-------------|
| **READ** | GET | `/rest/v1/orders?id=eq.{orderId}` | `{}` | Detalles de la orden |
| **READ** | GET | `/rest/v1/order_parts?order_id=eq.{orderId}` | `{}` | Partes de la orden |
| **READ** | GET | `/rest/v1/order_comments?order_id=eq.{orderId}` | `{}` | Comentarios de la orden |
| **CREATE** | POST | `/rest/v1/order_comments` | `{"order_id": "string", "comment": "string", "user_id": "string"}` | Agregar comentario |
| **CREATE** | POST | `/rest/v1/order_parts` | `{"order_id": "string", "part_id": "string", "cantidad": integer, "precio": number}` | Agregar parte |
| **UPDATE** | PUT | `/rest/v1/order_parts?id=eq.{partId}` | `{"cantidad": integer, "precio": number}` | Actualizar parte |
| **DELETE** | DELETE | `/rest/v1/order_parts?id=eq.{partId}` | `{}` | Eliminar parte |

---

## Gestión de Citas

### **Pantalla de Lista de Citas** (Faltante)
**Estado**: ❌ Requiere creación

| Operación | Método HTTP | Endpoint/RPC | Body Parameters | Descripción |
|-----------|-------------|--------------|-----------------|-------------|
| **CREATE** | POST | `/rest/v1/citas` | `{"client_id": "string", "vehiculo_id": "string", "fecha": "date", "hora": "time", "tipo_servicio": "string", "estado": "string", "notas": "string"}` | Crear nueva cita |
| **READ** | GET | `/rest/v1/citas` | `{}` | Lista todas las citas |
| **READ** | GET | `/rest/v1/citas?fecha=gte.{startDate}&fecha=lte.{endDate}` | `{}` | Citas por rango de fechas |
| **READ** | GET | `/rest/v1/citas?estado=eq.{status}` | `{}` | Filtrar por estado |
| **UPDATE** | PUT | `/rest/v1/citas?id=eq.{citaId}` | `{"fecha": "date", "hora": "time", "estado": "string", "notas": "string", "updated_at": "timestamp"}` | Actualizar c

Wiki pages you might want to explore:
- [Client Management (pubnicaragua/autoflowx-apps)](/wiki/pubnicaragua/autoflowx-apps#4.2)
- [Vehicle Management (pubnicaragua/autoflowx-apps)](/wiki/pubnicaragua/autoflowx-apps#4.3)