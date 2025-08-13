import { supabase } from '../../lib/supabase'  
// ✅ CORREGIDO: Importar tipos centralizados  
import {   
  Vehicle,   
  EnhancedVehicle,   
  CreateVehicleData,   
  UpdateVehicleData,  
  VehicleFilters,  
  VehicleSearchResult,  
  AppImage   
} from '../../types'  
  
// ❌ ELIMINADO: Definición duplicada de Vehicle  
// export type Vehicle = { ... } - REMOVIDO  
  
export const vehicleService = {  
  // ✅ CORREGIDO: Usar tipos centralizados  
  async getAllVehicles(filters?: VehicleFilters): Promise<Vehicle[]> {  
    try {  
      let query = supabase.from('vehicles').select('*')  
        
      if (filters?.searchTerm) {  
        query = query.or(`marca.ilike.%${filters.searchTerm}%,modelo.ilike.%${filters.searchTerm}%,placa.ilike.%${filters.searchTerm}%`)  
      }  
        
      if (filters?.client_id) {  
        query = query.eq('client_id', filters.client_id)  
      }  
        
      if (filters?.marca) {  
        query = query.eq('marca', filters.marca)  
      }  
        
      if (filters?.estado) {  
        query = query.eq('estado', filters.estado)  
      }  
        
      if (filters?.taller_id) {  
        query = query.eq('taller_id', filters.taller_id)  
      }  
  
      const { data, error } = await query.order('marca').order('modelo')  
        
      if (error) throw error  
      return data || []  
    } catch (error) {  
      console.error('Error getting all vehicles:', error)  
      throw error  
    }  
  },  
  
  async getVehicleById(id: string): Promise<Vehicle | null> {  
    try {  
      const { data, error } = await supabase  
        .from('vehicles')  
        .select('*')  
        .eq('id', id)  
        .single()  
  
      if (error && error.code !== 'PGRST116') throw error  
      return data  
    } catch (error) {  
      console.error('Error getting vehicle by ID:', error)  
      throw error  
    }  
  },  
  
  async getVehiclesByClientId(clientId: string): Promise<Vehicle[]> {  
    try {  
      const { data, error } = await supabase  
        .from('vehicles')  
        .select('*')  
        .eq('client_id', clientId)  
        .order('marca')  
        .order('modelo')  
  
      if (error) throw error  
      return data || []  
    } catch (error) {  
      console.error('Error getting vehicles by client ID:', error)  
      throw error  
    }  
  },  
  
  // ✅ CORREGIDO: Usar CreateVehicleData tipado  
  async createVehicle(vehicleData: CreateVehicleData): Promise<Vehicle> {  
    try {  
      const newVehicle = {  
        ...vehicleData,  
        created_at: new Date().toISOString(),  
        updated_at: new Date().toISOString(),  
        images: [],  
        service_history: []  
      }  
  
      const { data, error } = await supabase  
        .from('vehicles')  
        .insert([newVehicle])  
        .select()  
        .single()  
  
      if (error) throw error  
      return data  
    } catch (error) {  
      console.error('Error creating vehicle:', error)  
      throw error  
    }  
  },  
  
  // ✅ CORREGIDO: Usar UpdateVehicleData tipado  
  async updateVehicle(id: string, updates: UpdateVehicleData): Promise<Vehicle | null> {  
    try {  
      const updateData = {  
        ...updates,  
        updated_at: new Date().toISOString(),  
      }  
  
      const { data, error } = await supabase  
        .from('vehicles')  
        .update(updateData)  
        .eq('id', id)  
        .select()  
        .single()  
  
      if (error) throw error  
      return data  
    } catch (error) {  
      console.error('Error updating vehicle:', error)  
      throw error  
    }  
  },  
  
  async deleteVehicle(id: string): Promise<boolean> {  
    try {  
      const { error } = await supabase  
        .from('vehicles')  
        .delete()  
        .eq('id', id)  
  
      if (error) throw error  
      return true  
    } catch (error) {  
      console.error('Error deleting vehicle:', error)  
      throw error  
    }  
  },  
  
  // ✅ CORREGIDO: Usar VehicleSearchResult tipado  
  async searchVehicles(query: string): Promise<VehicleSearchResult> {  
    try {  
      const searchTerm = `%${query}%`  
      const { data, error, count } = await supabase  
        .rpc('search_vehicles', { search_term: searchTerm })  
        .select('*', { count: 'exact' })  
  
      if (error) throw error  
        
      return {  
        vehicles: data || [],  
        total: count || 0,  
        page: 1,  
        limit: data?.length || 0  
      }  
    } catch (error) {  
      console.error('Error searching vehicles:', error)  
      throw error  
    }  
  },  
  
  // ✅ NUEVO: Obtener vehículos enriquecidos con datos del cliente  
        // ✅ NUEVO: Obtener vehículos enriquecidos con datos del cliente  
  async getEnhancedVehicles(filters?: VehicleFilters): Promise<EnhancedVehicle[]> {  
    try {  
      const vehicles = await this.getAllVehicles(filters)  
        
      // Enriquecer con datos del cliente y estadísticas  
      const enhancedVehicles = await Promise.all(  
        vehicles.map(async (vehicle) => {  
          // Obtener datos del cliente  
          const { data: clientData } = await supabase  
            .from('clients')  
            .select('id, name, phone, email')  
            .eq('id', vehicle.client_id)  
            .single()  
  
          // Obtener estadísticas del vehículo  
          const { data: orders } = await supabase  
            .from('orders')  
            .select('id, total, created_at, status')  
            .eq('vehicle_id', vehicle.id)  
  
          const orderCount = orders?.length || 0  
          const pendingOrders = orders?.filter(order =>   
            order.status !== 'completed' && order.status !== 'delivered'  
          ).length || 0  
          const totalSpent = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0  
          const lastOrderDate = orders?.[0]?.created_at  
  
          // Determinar estado de mantenimiento  
          let maintenanceStatus: 'up_to_date' | 'due_soon' | 'overdue' = 'up_to_date'  
          if (vehicle.next_service_date) {  
            const nextServiceDate = new Date(vehicle.next_service_date)  
            const now = new Date()  
            const daysUntilService = Math.ceil((nextServiceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))  
              
            if (daysUntilService < 0) {  
              maintenanceStatus = 'overdue'  
            } else if (daysUntilService <= 30) {  
              maintenanceStatus = 'due_soon'  
            }  
          }  
  
          return {  
            ...vehicle,  
            clientData,  
            orderCount,  
            lastOrderDate,  
            pendingOrders,  
            totalSpent,  
            maintenanceStatus  
          } as EnhancedVehicle  
        })  
      )  
  
      return enhancedVehicles  
    } catch (error) {  
      console.error('Error getting enhanced vehicles:', error)  
      throw error  
    }  
  },  
  
  // ✅ NUEVO: Agregar imagen a vehículo  
  async addVehicleImage(vehicleId: string, image: AppImage): Promise<Vehicle | null> {  
    try {  
      const vehicle = await this.getVehicleById(vehicleId)  
      if (!vehicle) throw new Error('Vehicle not found')  
  
      const updatedImages = [...(vehicle.images || []), image]  
        
      return await this.updateVehicle(vehicleId, { images: updatedImages })  
    } catch (error) {  
      console.error('Error adding vehicle image:', error)  
      throw error  
    }  
  },  
  
  // ✅ NUEVO: Remover imagen de vehículo  
  async removeVehicleImage(vehicleId: string, imageId: string): Promise<Vehicle | null> {  
    try {  
      const vehicle = await this.getVehicleById(vehicleId)  
      if (!vehicle) throw new Error('Vehicle not found')  
  
      const updatedImages = (vehicle.images || []).filter(img => img.id !== imageId)  
        
      return await this.updateVehicle(vehicleId, { images: updatedImages })  
    } catch (error) {  
      console.error('Error removing vehicle image:', error)  
      throw error  
    }  
  }  
}  
  
export default vehicleService