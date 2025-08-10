import { supabase } from '../../lib/supabase'
import { DashboardInventoryItem } from '../../types/dashboard'
import type { InventoryItem, InventoryItemFormData } from '../../types/inventory'

// Tipos para el servicio de inventario
type InventoryFilters = {
  lowStock?: boolean
  category?: string
  searchTerm?: string
}

// Mapeo de tipos de inventario
const INVENTORY_TYPES = {
  part: 'Repuesto',
  material: 'Material',
  tool: 'Herramienta',
  consumable: 'Consumible'
}

// Mapeo de estados de inventario
const INVENTORY_STATUS = {
  in_stock: 'En Stock',
  low_stock: 'Poco Stock',
  out_of_stock: 'Sin Stock',
  on_order: 'En Pedido',
  discontinued: 'Descontinuado'
}

export const inventoryService = {

  async getAllInventory(): Promise<InventoryItem[]> {
    try {
      // Hacer fetch de todos los items del inventario desde Supabase  
      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) {
        console.error('Error fetching inventory:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllInventory:', error);
      throw error;
    }
  },

  // Obtener todos los artículos de inventario con filtros opcionales
  async getInventoryItems(filters: InventoryFilters = {}) {
    try {
      let query = supabase
        .from('inventory')
        .select('*')
        .order('name', { ascending: true })

      // Aplicar filtros
      if (filters.lowStock) {
        query = query.lte('stock', supabase.rpc('get_min_stock_threshold'))
      }

      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      if (filters.searchTerm) {
        query = query.ilike('name', `%${filters.searchTerm}%`)
      }

      const { data, error } = await query

      if (error) throw error

      return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        sku: item.sku,
        barcode: item.barcode,
        category: item.category,
        type: INVENTORY_TYPES[item.type as keyof typeof INVENTORY_TYPES] || item.type,
        stock: item.stock,
        minStock: item.min_stock,
        cost: item.cost,
        price: item.price,
        supplierId: item.supplier_id,
        location: item.location,
        status: INVENTORY_STATUS[item.status as keyof typeof INVENTORY_STATUS] || item.status,
        notes: item.notes,
        images: item.images || [],
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        priceUSD: item.priceUSD || item.price || 0,
        priceHNL: item.priceHNL || 0,
        isActive: item.isActive !== false
      })) as InventoryItem[]
    } catch (error) {
      console.error('Error fetching inventory items:', error)
      throw error
    }
  },

  // Obtener artículos con bajo stock
  async getLowStockItems(thresholdPercentage: number = 20) {
    try {
      const { data, error } = await supabase.rpc('get_low_stock_items', {
        threshold_percentage: thresholdPercentage
      })

      if (error) throw error

      return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        stock: item.stock,
        minStock: item.min_stock,
        status: 'low_stock',
        category: item.category,
        price: item.price,
        lastRestocked: item.last_restocked
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
        .from('inventory')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) throw new Error('Artículo no encontrado')

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        sku: data.sku,
        barcode: data.barcode,
        category: data.category,
        type: INVENTORY_TYPES[data.type as keyof typeof INVENTORY_TYPES] || data.type,
        stock: data.stock,
        minStock: data.min_stock,
        cost: data.cost,
        price: data.price,
        supplierId: data.supplier_id,
        location: data.location,
        status: INVENTORY_STATUS[data.status as keyof typeof INVENTORY_STATUS] || data.status,
        notes: data.notes,
        images: data.images || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        priceUSD: data.priceUSD || data.price || 0,
        priceHNL: data.priceHNL || 0,
        isActive: data.isActive !== false
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
        .from('inventory')
        .insert([{
          name: itemData.name,
          description: itemData.description,
          sku: itemData.sku,
          barcode: itemData.barcode,
          category: itemData.category,
          type: itemData.type,
          stock: itemData.stock || 0,
          min_stock: itemData.minStock || 0,
          cost: itemData.cost || 0,
          price: itemData.price,
          supplier_id: itemData.supplierId,
          location: itemData.location,
          status: itemData.stock <= 0 ? 'out_of_stock' :
            (itemData.minStock && itemData.stock <= itemData.minStock ? 'low_stock' : 'in_stock'),
          notes: itemData.notes,
          images: itemData.images || []
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
      if ('minStock' in updates) updateData.min_stock = updates.minStock
      if ('supplierId' in updates) updateData.supplier_id = updates.supplierId

      // Actualizar estado según stock
      if ('stock' in updates) {
        updateData.status = updates.stock === 0 ? 'out_of_stock' :
          (updates.minStock && updates.stock && updates.stock <= updates.minStock ? 'low_stock' : 'in_stock')
      }

      const { error } = await supabase
        .from('inventory')
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
        .from('inventory')
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
        .from('inventory')
        .select('stock, min_stock')
        .eq('id', id)
        .single()

      if (!currentItem) throw new Error('Artículo no encontrado')

      const newStock = currentItem.stock + quantity

      // Actualizamos el stock
      const { error } = await supabase
        .from('inventory')
        .update({
          stock: newStock,
          status: newStock === 0 ? 'out_of_stock' :
            (currentItem.min_stock && newStock <= currentItem.min_stock ? 'low_stock' : 'in_stock')
        })
        .eq('id', id)

      if (error) throw error

      // Registramos el movimiento de inventario
      await supabase
        .from('inventory_movements')
        .insert([{
          inventory_id: id,
          type: quantity > 0 ? 'in' : 'out',
          quantity: Math.abs(quantity),
          previous_stock: currentItem.stock,
          new_stock: newStock,
          notes: notes || (quantity > 0 ? 'Entrada de inventario' : 'Salida de inventario'),
          user_id: (await supabase.auth.getUser()).data.user?.id
        }])

      return this.getInventoryItemById(id)
    } catch (error) {
      console.error(`Error updating stock for item ${id}:`, error)
      throw error
    }
  },

  // Obtener categorías de inventario
  async getInventoryCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('category')
        .not('category', 'is', null)

      if (error) throw error

      // Eliminar duplicados y devolver array de categorías únicas
      return [...new Set(data.map((item: any) => item.category))].sort() as string[]
    } catch (error) {
      console.error('Error fetching inventory categories:', error)
      throw error
    }
  },

  // Obtener historial de movimientos de un artículo
  async getInventoryHistory(itemId: string) {
    try {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('*, user:profiles(full_name, email)')
        .eq('inventory_id', itemId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data.map((movement: any) => ({
        id: movement.id,
        type: movement.type,
        quantity: movement.quantity,
        previousStock: movement.previous_stock,
        newStock: movement.new_stock,
        notes: movement.notes,
        user: movement.user,
        createdAt: movement.created_at
      }))
    } catch (error) {
      console.error(`Error fetching history for item ${itemId}:`, error)
      throw error
    }
  },
  async initializeInventory(): Promise<void> {
    try {
      const inventory = await inventoryService.getAllInventory();
    } catch (error) {
      console.error('Error initializing orders:', error);
      throw new Error('Failed to initialize orders. Please check your connection and try again.');
    }
  }
}

export default inventoryService
