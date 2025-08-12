import { supabase } from '../../lib/supabase'
import { DashboardInventoryItem } from '../../types/dashboard'
import type { InventoryItem, InventoryItemFormData, MaterialCategory, Supplier } from '../../types/inventory'

// Tipos para el servicio de inventario
type InventoryFilters = {
  lowStock?: boolean
  category?: string
  searchTerm?: string
}

export const inventoryService = {

  async getAllInventory(): Promise<InventoryItem[]> {
    try {
      // Hacer fetch de todos los items del inventario desde Supabase
      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .order('producto', { ascending: true });

      if (error) {
        console.error('Error fetching inventory:', error);
        throw error;
      }

      // Obtener categorías y proveedores por separado
      const [categoriesData, suppliersData] = await Promise.all([
        supabase.from('categorias_materiales').select('id, nombre'),
        supabase.from('suppliers').select('id, name')
      ]);

      const categories = categoriesData.data || [];
      const suppliers = suppliersData.data || [];

      // Mapear los datos para incluir nombres de categoría y proveedor
      return (data || []).map(item => ({
        ...item,
        categoria_nombre: categories.find(cat => cat.id === item.categoria_id)?.nombre,
        proveedor_nombre: suppliers.find(sup => sup.id === item.proveedor_id)?.name
      }));
    } catch (error) {
      console.error('Error in getAllInventory:', error);
      throw error;
    }
  },

  // Obtener todos los artículos de inventario con filtros opcionales
  async getInventoryItems(filters: InventoryFilters = {}) {
    try {
      let query = supabase
        .from('inventario')
        .select('*')
        .order('producto', { ascending: true })

      // Aplicar filtros
      if (filters.lowStock) {
        query = query.lte('stock_actual', supabase.rpc('get_min_stock_threshold'))
      }

      if (filters.category) {
        query = query.eq('categoria_id', filters.category)
      }

      if (filters.searchTerm) {
        query = query.ilike('producto', `%${filters.searchTerm}%`)
      }

      const { data, error } = await query

      if (error) throw error

      // Obtener categorías y proveedores por separado
      const [categoriesData, suppliersData] = await Promise.all([
        supabase.from('categorias_materiales').select('id, nombre'),
        supabase.from('suppliers').select('id, name')
      ]);

      const categories = categoriesData.data || [];
      const suppliers = suppliersData.data || [];

      // Mapear los datos para incluir nombres de categoría y proveedor
      return (data || []).map(item => ({
        ...item,
        categoria_nombre: categories.find(cat => cat.id === item.categoria_id)?.nombre,
        proveedor_nombre: suppliers.find(sup => sup.id === item.proveedor_id)?.name
      })) as InventoryItem[]
    } catch (error) {
      console.error('Error fetching inventory items:', error)
      throw error
    }
  },

  // Obtener artículos con bajo stock
  async getLowStockItems(thresholdPercentage: number = 20) {
    try {
      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .lte('stock_actual', supabase.rpc('get_min_stock_threshold', { threshold_percentage: thresholdPercentage }))

      if (error) throw error

      return (data || []).map((item: any) => ({
        id: item.id,
        name: item.producto,
        stock: item.stock_actual || 0,
        minStock: item.stock_minimo || 0,
        status: (item.stock_actual || 0) <= (item.stock_minimo || 0) ? 'low' : 'ok'
      })) as DashboardInventoryItem[]
    } catch (error) {
      console.error('Error fetching low stock items:', error)
      throw error
    }
  },

  // Obtener un artículo por ID
  async getInventoryItemById(id: string): Promise<InventoryItem> {
    try {
      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) throw new Error('Artículo no encontrado')

      // Obtener categorías y proveedores por separado
      const [categoriesData, suppliersData] = await Promise.all([
        supabase.from('categorias_materiales').select('id, nombre'),
        supabase.from('suppliers').select('id, name')
      ]);

      const categories = categoriesData.data || [];
      const suppliers = suppliersData.data || [];

      return {
        ...data,
        categoria_nombre: categories.find(cat => cat.id === data.categoria_id)?.nombre,
        proveedor_nombre: suppliers.find(sup => sup.id === data.proveedor_id)?.name
      }
    } catch (error) {
      console.error(`Error fetching inventory item ${id}:`, error)
      throw error
    }
  },

  // Crear un nuevo artículo
  async createInventoryItem(itemData: InventoryItemFormData): Promise<InventoryItem> {
    try {
      const { data, error } = await supabase
        .from('inventario')
        .insert([{
          // Solo campos que existen en el schema.sql de la tabla inventario
          producto: itemData.producto,
          proceso: itemData.proceso,
          unidad_medida: itemData.unidad_medida,
          lugar_compra: itemData.lugar_compra,
          precio_unitario: itemData.precio_unitario,
          cantidad: itemData.cantidad,
          precio_total: itemData.precio_total,
          rendi_hora_reparar: itemData.rendi_hora_reparar,
          ren_veh: itemData.ren_veh,
          costo: itemData.costo,
          costo_total: itemData.costo_total,
          rendi_hora_pin: itemData.rendi_hora_pin,
          cantidad_veh: itemData.cantidad_veh,
          cantidad_h_rep: itemData.cantidad_h_rep,
          cantidad_h_pin: itemData.cantidad_h_pin,
          ajuste: itemData.ajuste,
          inv_inicial: itemData.inv_inicial,
          com_1: itemData.com_1,
          com_2: itemData.com_2,
          com_3: itemData.com_3,
          com_4: itemData.com_4,
          inv_final: itemData.inv_final,
          categoria_id: itemData.categoria_id,
          material_pintura: itemData.material_pintura,
          material_reparacion: itemData.material_reparacion,
          proveedor_id: itemData.proveedor_id,
          vehiculo_id: itemData.vehiculo_id,
          proceso_id: itemData.proceso_id,
          taller_id: itemData.taller_id
        }])
        .select()
        .single()

      if (error) throw error

      return this.getInventoryItemById(data.id)
    } catch (error) {
      console.error('Error creating inventory item:', error)
      throw error
    }
  },

  // Actualizar un artículo existente
  async updateInventoryItem(id: string, updates: Partial<InventoryItemFormData>): Promise<InventoryItem> {
    try {
      const updateData: any = { ...updates }

      // Mapear campos si es necesario
      if ('stock_minimo' in updates) updateData.stock_minimo = updates.stock_minimo
      if ('proveedor_id' in updates) updateData.proveedor_id = updates.proveedor_id

      // Actualizar estado según stock
      if ('stock_actual' in updates) {
        updateData.estado = updates.stock_actual === 0 ? 'Inactivo' : 'Activo'
      }

      const { error } = await supabase
        .from('inventario')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      return this.getInventoryItemById(id)
    } catch (error) {
      console.error(`Error updating inventory item ${id}:`, error)
      throw error
    }
  },

  // Eliminar un artículo
  async deleteInventoryItem(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('inventario')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error(`Error deleting inventory item ${id}:`, error)
      throw error
    }
  },

  // Actualizar el stock de un artículo
  async updateStock(id: string, quantity: number, notes?: string): Promise<InventoryItem> {
    try {
      // Primero obtenemos el stock actual
      const { data: currentItem } = await supabase
        .from('inventario')
        .select('stock_actual, stock_minimo')
        .eq('id', id)
        .single()

      if (!currentItem) throw new Error('Artículo no encontrado')

      const newStock = currentItem.stock_actual + quantity

      // Actualizamos el stock
      const { error } = await supabase
        .from('inventario')
        .update({
          stock_actual: newStock,
          estado: newStock === 0 ? 'Inactivo' : 'Activo'
        })
        .eq('id', id)

      if (error) throw error

      return this.getInventoryItemById(id)
    } catch (error) {
      console.error(`Error updating stock for item ${id}:`, error)
      throw error
    }
  },

  // Obtener categorías de inventario
  async getInventoryCategories(): Promise<MaterialCategory[]> {
    try {
      const { data, error } = await supabase
        .from('categorias_materiales')
        .select('*')
        .order('nombre', { ascending: true })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error fetching inventory categories:', error)
      throw error
    }
  },

  // Obtener proveedores
  async getSuppliers(): Promise<Supplier[]> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      throw error
    }
  },

  async initializeInventory(): Promise<void> {
    try {
      const inventory = await inventoryService.getAllInventory();
    } catch (error) {
      console.error('Error initializing inventory:', error);
      throw new Error('Failed to initialize inventory. Please check your connection and try again.');
    }
  }
}

export default inventoryService
