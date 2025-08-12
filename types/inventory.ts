// Tipos de inventario sincronizados con el schema real de Supabase  
export interface InventoryItem {  
  // Campos del schema real  
  id: string  
  created_at?: string  
  producto: string  
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
  categoria_id?: string  
  taller_id?: string  
  vehiculo_id?: string  
  proceso_id?: number  
  material_pintura?: boolean  
  material_reparacion?: boolean  
    
  // Campos calculados/virtuales (no en BD, agregados por joins)  
  categoria_nombre?: string  
  proveedor_nombre?: string  
    
  // Campos legacy para compatibilidad (mapean a campos reales)  
  name?: string // mapea a producto  
  sku?: string // mapea a id o código generado  
  description?: string // mapea a proceso o descripción calculada  
  stock?: number // mapea a cantidad  
  minStock?: number // valor por defecto o calculado  
  maxStock?: number // valor por defecto o calculado  
  cost?: number // mapea a costo  
  priceUSD?: number // mapea a precio_unitario  
  priceHNL?: number // calculado desde precio_unitario  
  location?: string // mapea a lugar_compra  
  category?: string // mapea a categoria_nombre  
}  
  
export interface InventoryItemFormData {  
  producto: string  
  proceso?: string  
  unidad_medida?: string  
  lugar_compra?: string  
  precio_unitario?: number  
  cantidad?: number  
  categoria_id?: string  
  taller_id?: string  
  material_pintura?: boolean  
  material_reparacion?: boolean  
}  
  
export interface MaterialCategory {  
  id: string  
  nombre: string  
  descripcion?: string  
  created_at?: string  
}  
  
export interface Supplier {  
  id: string  
  name: string  
  contact_info?: string  
  created_at?: string  
}  
  
// Tipos para compatibilidad con pantallas existentes  
export interface InventoryItemType extends InventoryItem {  
  name: string  
  sku: string  
  stock: number  
}  
  
// Función helper para mapear InventoryItem a InventoryItemType  
export const mapToInventoryItemType = (item: InventoryItem): InventoryItemType => ({  
  ...item,  
  name: item.producto || item.name || '',  
  sku: item.id || item.sku || '',  
  stock: item.cantidad || item.stock || 0,  
})  
  
// Función helper para mapear campos legacy  
export const mapLegacyFields = (item: InventoryItem): InventoryItem => ({  
  ...item,  
  name: item.producto,  
  sku: item.id,  
  description: item.proceso,  
  stock: item.cantidad,  
  minStock: 5, // valor por defecto  
  maxStock: 100, // valor por defecto  
  cost: item.costo,  
  priceUSD: item.precio_unitario,  
  priceHNL: item.precio_unitario ? item.precio_unitario * 24.5 : undefined, // tasa de cambio aproximada  
  location: item.lugar_compra,  
  category: item.categoria_nombre,  
})