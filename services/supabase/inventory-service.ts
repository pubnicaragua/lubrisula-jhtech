import { supabase } from '../../lib/supabase'
import { InventoryItem, InventoryItemFormData, MaterialCategory, Supplier } from '../../types/inventory'  
  
export class InventoryService {  
  // Obtener todos los elementos del inventario  
  async getAllInventory(): Promise<InventoryItem[]> {  
    try {  
      const { data, error } = await supabase  
        .from('inventario')  
        .select(`  
          *,  
          categoria_nombre:categoria_id(nombre)  
        `)  
        .order('created_at', { ascending: false })  
  
      if (error) {  
        console.error('Error fetching inventory:', error)  
        throw new Error(`Error al obtener inventario: ${error.message}`)  
      }  
  
      // Mapear datos para incluir campos calculados  
      return (data || []).map(item => ({  
        ...item,  
        categoria_nombre: item.categoria_nombre?.nombre || null,  
        // Mapear campos legacy para compatibilidad  
        name: item.producto,  
        sku: item.id,  
        description: item.proceso,  
        stock: item.cantidad || 0,  
        minStock: 5, // Valor por defecto hasta que se implemente en BD  
        maxStock: 100, // Valor por defecto hasta que se implemente en BD  
        cost: item.costo,  
        priceUSD: item.precio_unitario,  
        priceHNL: item.precio_unitario ? item.precio_unitario * 24.5 : undefined,  
        location: item.lugar_compra,  
        category: item.categoria_nombre?.nombre || null,  
      }))  
    } catch (error) {  
      console.error('Error in getAllInventory:', error)  
      throw error  
    }  
  }  
  
  // Obtener elemento del inventario por ID  
  async getInventoryItemById(id: string): Promise<InventoryItem | null> {  
    try {  
      const { data, error } = await supabase  
        .from('inventario')  
        .select(`  
          *,  
          categoria_nombre:categoria_id(nombre)  
        `)  
        .eq('id', id)  
        .single()  
  
      if (error) {  
        if (error.code === 'PGRST116') {  
          return null // No encontrado  
        }  
        console.error('Error fetching inventory item:', error)  
        throw new Error(`Error al obtener artículo: ${error.message}`)  
      }  
  
      // Mapear datos para incluir campos calculados  
      return {  
        ...data,  
        categoria_nombre: data.categoria_nombre?.nombre || null,  
        // Mapear campos legacy para compatibilidad  
        name: data.producto,  
        sku: data.id,  
        description: data.proceso,  
        stock: data.cantidad || 0,  
        minStock: 5,  
        maxStock: 100,  
        cost: data.costo,  
        priceUSD: data.precio_unitario,  
        priceHNL: data.precio_unitario ? data.precio_unitario * 24.5 : undefined,  
        location: data.lugar_compra,  
        category: data.categoria_nombre?.nombre || null,  
      }  
    } catch (error) {  
      console.error('Error in getInventoryItemById:', error)  
      throw error  
    }  
  }  
  
  // Crear nuevo elemento del inventario  
  async createInventoryItem(itemData: InventoryItemFormData): Promise<InventoryItem> {  
    try {  
      // Validar datos requeridos  
      if (!itemData.producto || !itemData.precio_unitario) {  
        throw new Error('Producto y precio son requeridos')  
      }  
  
      const { data, error } = await supabase  
        .from('inventario')  
        .insert([{  
          producto: itemData.producto,  
          proceso: itemData.proceso,  
          unidad_medida: itemData.unidad_medida,  
          lugar_compra: itemData.lugar_compra,  
          precio_unitario: itemData.precio_unitario,  
          cantidad: itemData.cantidad || 0,  
          categoria_id: itemData.categoria_id,  
          taller_id: itemData.taller_id,  
          material_pintura: itemData.material_pintura || false,  
          material_reparacion: itemData.material_reparacion || false,  
          // Calcular campos derivados  
          precio_total: (itemData.precio_unitario || 0) * (itemData.cantidad || 0),  
          costo: itemData.precio_unitario ? itemData.precio_unitario * 0.7 : 0, // 70% del precio como costo estimado  
        }])  
        .select()  
        .single()  
  
      if (error) {  
        console.error('Error creating inventory item:', error)  
        throw new Error(`Error al crear artículo: ${error.message}`)  
      }  
  
      return this.getInventoryItemById(data.id) as Promise<InventoryItem>  
    } catch (error) {  
      console.error('Error in createInventoryItem:', error)  
      throw error  
    }  
  }  
  
  // Actualizar elemento del inventario  
  async updateInventoryItem(id: string, updates: Partial<InventoryItemFormData>): Promise<InventoryItem> {  
    try {  
      // Preparar datos de actualización  
      const updateData: any = { ...updates }  
        
      // Recalcular campos derivados si es necesario  
      if (updates.precio_unitario || updates.cantidad) {  
        const currentItem = await this.getInventoryItemById(id)  
        if (currentItem) {  
          const newPrecio = updates.precio_unitario || currentItem.precio_unitario || 0  
          const newCantidad = updates.cantidad || currentItem.cantidad || 0  
          updateData.precio_total = newPrecio * newCantidad  
          updateData.costo = newPrecio * 0.7 // 70% del precio como costo estimado  
        }  
      }  
  
      const { data, error } = await supabase  
        .from('inventario')  
        .update(updateData)  
        .eq('id', id)  
        .select()  
        .single()  
  
      if (error) {  
        console.error('Error updating inventory item:', error)  
        throw new Error(`Error al actualizar artículo: ${error.message}`)  
      }  
  
      return this.getInventoryItemById(id) as Promise<InventoryItem>  
    } catch (error) {  
      console.error('Error in updateInventoryItem:', error)  
      throw error  
    }  
  }  
  
  // Eliminar elemento del inventario  
  async deleteInventoryItem(id: string): Promise<void> {  
    try {  
      const { error } = await supabase  
        .from('inventario')  
        .delete()  
        .eq('id', id)  
  
      if (error) {  
        console.error('Error deleting inventory item:', error)  
        throw new Error(`Error al eliminar artículo: ${error.message}`)  
      }  
    } catch (error) {  
      console.error('Error in deleteInventoryItem:', error)  
      throw error  
    }  
  }  
  
  // Actualizar stock (para uso en órdenes)  
  // Actualizar stock (para uso en órdenes)  
  async updateStock(id: string, newQuantity: number): Promise<void> {  
    try {  
      if (newQuantity < 0) {  
        throw new Error('La cantidad no puede ser negativa')  
      }  
  
      const { error } = await supabase  
        .from('inventario')  
        .update({ cantidad: newQuantity })  
        .eq('id', id)  
  
      if (error) {  
        console.error('Error updating stock:', error)  
        throw new Error(`Error al actualizar stock: ${error.message}`)  
      }  
    } catch (error) {  
      console.error('Error in updateStock:', error)  
      throw error  
    }  
  }  
  
  // Obtener categorías de inventario  
  async getInventoryCategories(): Promise<MaterialCategory[]> {  
    try {  
      const { data, error } = await supabase  
        .from('categorias_materiales')  
        .select('*')  
        .order('nombre', { ascending: true })  
  
      if (error) {  
        console.error('Error fetching categories:', error)  
        throw new Error(`Error al obtener categorías: ${error.message}`)  
      }  
  
      return data || []  
    } catch (error) {  
      console.error('Error in getInventoryCategories:', error)  
      throw error  
    }  
  }  
  
  // Obtener proveedores  
  async getSuppliers(): Promise<Supplier[]> {  
    try {  
      const { data, error } = await supabase  
        .from('suppliers')  
        .select('*')  
        .order('name', { ascending: true })  
  
      if (error) {  
        console.error('Error fetching suppliers:', error)  
        throw new Error(`Error al obtener proveedores: ${error.message}`)  
      }  
  
      return data || []  
    } catch (error) {  
      console.error('Error in getSuppliers:', error)  
      throw error  
    }  
  }  
  
  // Obtener elementos con stock bajo  
  async getLowStockItems(): Promise<InventoryItem[]> {  
    try {  
      const allItems = await this.getAllInventory()  
      return allItems.filter(item => (item.cantidad || 0) <= (item.minStock || 5))  
    } catch (error) {  
      console.error('Error in getLowStockItems:', error)  
      throw error  
    }  
  }  
}  
  
// Exportar instancia del servicio  
export const inventoryService = new InventoryService()  
export default inventoryService