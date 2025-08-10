import { supabase } from '../../lib/supabase'  
  
export interface InventarioType {  
  id: string  
  codigo: string  
  nombre: string  
  descripcion?: string  
  categoria_id: string  
  proveedor_id?: string  
  precio_compra: number  
  precio_venta: number  
  stock_actual: number  
  stock_minimo: number  
  stock_maximo?: number  
  ubicacion_almacen: string  
  estado: 'Activo' | 'Inactivo'  
  fecha_ingreso: string  
  categorias_materiales?: {  
    nombre: string  
  }  
  suppliers?: {  
    name: string  
  }  
}  
  
export interface CategoriaMaterialType {  
  id: string  
  nombre: string  
  descripcion?: string  
}  
  
export interface ProveedorType {  
  id: string  
  name: string  
  contact_name?: string  
  phone?: string  
}  

export interface ServicioType {
  id: string
  nombre: string
  descripcion?: string
  precio: number
  categoria: string
  tiempo_estimado?: number
  estado: 'Activo' | 'Inactivo'
}

// Funciones exportadas siguiendo el patrón moderno  
export async function getAllInventory(): Promise<InventarioType[]> {  
  try {  
    const { data, error } = await supabase  
      .from('inventory')  
      .select(`  
        *,  
        categorias_materiales:inventory_categories(nombre),  
        suppliers(name)  
      `)  
      .order('nombre', { ascending: true })  
  
    if (error) {  
      console.error('Error getting inventory:', error)  
      return []  
    }  
  
    return data || []  
  } catch (error) {  
    console.error('Error in getAllInventory:', error)  
    return []  
  }  
}  
  
export async function getInventoryCategories(): Promise<CategoriaMaterialType[]> {  
  try {  
    const { data, error } = await supabase  
      .from('inventory_categories')  
      .select('*')  
      .order('nombre', { ascending: true })  
  
    if (error) {  
      console.error('Error getting categories:', error)  
      return []  
    }  
  
    return data || []  
  } catch (error) {  
    console.error('Error in getInventoryCategories:', error)  
    return []  
  }  
}  
  
export async function getSuppliers(): Promise<ProveedorType[]> {  
  try {  
    const { data, error } = await supabase  
      .from('suppliers')  
      .select('*')  
      .order('name', { ascending: true })  
  
    if (error) {  
      console.error('Error getting suppliers:', error)  
      return []  
    }  
  
    return data || []  
  } catch (error) {  
    console.error('Error in getSuppliers:', error)  
    return []  
  }  
}  
  
export async function createInventoryItem(item: Omit<InventarioType, 'id'>): Promise<InventarioType | null> {  
  try {  
    const { data, error } = await supabase  
      .from('inventory')  
      .insert([item])  
      .select()  
      .single()  
  
    if (error) {  
      console.error('Error creating inventory item:', error)  
      return null  
    }  
  
    return data  
  } catch (error) {  
    console.error('Error in createInventoryItem:', error)  
    return null  
  }  
}  
  
export async function updateInventoryItem(id: string, updates: Partial<InventarioType>): Promise<InventarioType | null> {  
  try {  
    const { data, error } = await supabase  
      .from('inventory')  
      .update(updates)  
      .eq('id', id)  
      .select()  
      .single()  
  
    if (error) {  
      console.error('Error updating inventory item:', error)  
      return null  
    }  
  
    return data  
  } catch (error) {  
    console.error('Error in updateInventoryItem:', error)  
    return null  
  }  
}

export async function getAllServices(): Promise<ServicioType[]> {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('estado', 'Activo')
      .order('nombre', { ascending: true })

    if (error) {
      console.error('Error getting services:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getAllServices:', error)
    return []
  }
}

// Funciones de compatibilidad con servicios legacy  
export const inventarioService = {  
  GET_INVENTARIO: getAllInventory,  
  GET_CATEGORIA_MATERIALES: getInventoryCategories,  
  GET_PROVEEDORES: getSuppliers,  
  INSERT_INVENTARIO: createInventoryItem,  
}  
  
export default inventarioService