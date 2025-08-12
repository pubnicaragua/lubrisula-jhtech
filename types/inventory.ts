// Tipos basados en el esquema real de la base de datos
export interface InventoryItem {
  id: string
  producto: string // nombre del producto
  codigo?: string // código del producto - NO EXISTE EN SCHEMA
  descripcion?: string // descripción del producto - NO EXISTE EN SCHEMA
  categoria_id?: string
  categoria_nombre?: string // nombre de la categoría (campo calculado)
  proveedor_id?: string
  proveedor_nombre?: string // nombre del proveedor (campo calculado)
  precio_compra?: number // - NO EXISTE EN SCHEMA
  precio_venta?: number // - NO EXISTE EN SCHEMA
  stock_actual?: number // - NO EXISTE EN SCHEMA
  stock_minimo?: number // - NO EXISTE EN SCHEMA
  stock_maximo?: number // - NO EXISTE EN SCHEMA
  ubicacion_almacen?: string // - NO EXISTE EN SCHEMA
  estado?: 'Activo' | 'Inactivo' // - NO EXISTE EN SCHEMA
  fecha_ingreso?: string // - NO EXISTE EN SCHEMA
  created_at?: string
  updated_at?: string // - NO EXISTE EN SCHEMA
  
  // Campos que SÍ existen en el esquema
  proceso?: string
  unidad_medida?: string
  lugar_compra?: string
  precio_unitario?: number
  cantidad?: number
  precio_total?: number
  rendi_hora_reparar?: number
  ren_veh?: number
  costo?: number
  costo_total?: number
  rendi_hora_pin?: number
  cantidad_veh?: number
  cantidad_h_rep?: number
  cantidad_h_pin?: number
  ajuste?: number
  inv_inicial?: string
  com_1?: string
  com_2?: string
  com_3?: string
  com_4?: string
  inv_final?: string
  material_pintura?: boolean
  material_reparacion?: boolean
  vehiculo_id?: string
  proceso_id?: number
  taller_id?: string
}

// Tipo para crear/actualizar items de inventario
export interface InventoryItemFormData {
  producto: string
  codigo?: string // - NO EXISTE EN SCHEMA
  descripcion?: string // - NO EXISTE EN SCHEMA
  categoria_id?: string
  proveedor_id?: string
  precio_compra?: number // - NO EXISTE EN SCHEMA
  precio_venta?: number // - NO EXISTE EN SCHEMA
  stock_actual?: number // - NO EXISTE EN SCHEMA
  stock_minimo?: number // - NO EXISTE EN SCHEMA
  stock_maximo?: number // - NO EXISTE EN SCHEMA
  ubicacion_almacen?: string // - NO EXISTE EN SCHEMA
  estado?: 'Activo' | 'Inactivo' // - NO EXISTE EN SCHEMA
  fecha_ingreso?: string // - NO EXISTE EN SCHEMA
  created_at?: string
  updated_at?: string // - NO EXISTE EN SCHEMA
  
  // Campos que SÍ existen en el esquema de base de datos
  proceso?: string
  unidad_medida?: string
  lugar_compra?: string
  precio_unitario?: number
  cantidad?: number
  precio_total?: number
  rendi_hora_reparar?: number
  ren_veh?: number
  costo?: number
  costo_total?: number
  rendi_hora_pin?: number
  cantidad_veh?: number
  cantidad_h_rep?: number
  cantidad_h_pin?: number
  ajuste?: number
  inv_inicial?: string
  com_1?: string
  com_2?: string
  com_3?: string
  com_4?: string
  inv_final?: string
  material_pintura?: boolean
  material_reparacion?: boolean
  vehiculo_id?: string
  proceso_id?: number
  taller_id?: string
}

// Tipo para servicios basado en el esquema
export interface Service {
  id: string
  nombre?: string
  descripcion?: string
  precio?: number
  tiempo_estimado?: number
  categoria_servicio_id?: number
  categoria_nombre?: string
  activo?: boolean
  nivel_tarifa?: string
  vehiculo_id?: string
  materiales?: string
  orden_trabajo_id?: string
  tipo_tiempo_estimado?: string
  paquete_id?: number
  created_at?: string
}

// Tipo para categorías de materiales
export interface MaterialCategory {
  id: string
  nombre: string
  descripcion?: string
  categoria_padre_id?: string
  created_at?: string
  updated_at?: string
}

// Tipo para proveedores
export interface Supplier {
  id: string
  name: string
  contact_name?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

// Enums actualizados
export enum InventoryCategory {
  ENGINE = "Motor",
  TRANSMISSION = "Transmisión",
  BRAKES = "Frenos",
  SUSPENSION = "Suspensión",
  ELECTRICAL = "Eléctrico",
  BODY = "Carrocería",
  FLUIDS = "Fluidos",
  FILTERS = "Filtros",
  TIRES = "Neumáticos",
  ACCESSORIES = "Accesorios",
  OTHER = "Otros",
}

export enum ServiceCategory {
  MAINTENANCE = "Mantenimiento",
  REPAIR = "Reparación",
  DIAGNOSTIC = "Diagnóstico",
  INSTALLATION = "Instalación",
  INSPECTION = "Inspección",
  OTHER = "Otros",
}

export enum Currency {
  USD = "USD",
  HNL = "HNL",
}

// Filtros actualizados
export interface InventoryFilter {
  searchTerm?: string
  category?: string
  supplier?: string
  inStock?: boolean
  lowStock?: boolean
  sortBy?: "producto" | "codigo" | "stock_actual" | "precio_venta"
  sortOrder?: "asc" | "desc"
}

export interface ServiceFilter {
  searchTerm?: string
  category?: string
  sortBy?: "nombre" | "precio"
  sortOrder?: "asc" | "desc"
}
