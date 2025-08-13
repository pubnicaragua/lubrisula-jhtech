import { supabase } from '../../lib/supabase'  
// ✅ CORREGIDO: Importar tipos centralizados  
import {   
  Client,   
  EnhancedClient,   
  CreateClientData,   
  UpdateClientData,  
  ClientFilters,  
  ClientSearchResult   
} from '../../types'  
  
// ❌ ELIMINADO: Definición duplicada de Client  
// export type Client = { ... } - REMOVIDO  
  
export const clientService = {  
  // ✅ CORREGIDO: Usar tipos centralizados  
  async getAllClients(filters?: ClientFilters): Promise<Client[]> {  
    try {  
      let query = supabase.from('clients').select('*')  
        
      if (filters?.searchTerm) {  
        query = query.or(`name.ilike.%${filters.searchTerm}%,email.ilike.%${filters.searchTerm}%`)  
      }  
        
      if (filters?.client_type) {  
        query = query.eq('client_type', filters.client_type)  
      }  
        
      if (filters?.taller_id) {  
        query = query.eq('taller_id', filters.taller_id)  
      }  
  
      const { data, error } = await query.order('name')  
        
      if (error) throw error  
      return data || []  
    } catch (error) {  
      console.error('Error getting all clients:', error)  
      throw error  
    }  
  },  
  
  async getClientById(id: string): Promise<Client | null> {  
    try {  
      const { data, error } = await supabase  
        .from('clients')  
        .select('*')  
        .eq('id', id)  
        .single()  
  
      if (error && error.code !== 'PGRST116') throw error  
      return data  
    } catch (error) {  
      console.error('Error getting client by ID:', error)  
      throw error  
    }  
  },  
  
  async getClientByUserId(userId: string): Promise<Client | null> {  
    try {  
      const { data, error } = await supabase  
        .from('clients')  
        .select('*')  
        .eq('user_id', userId)  
        .single()  
  
      if (error && error.code !== 'PGRST116') throw error  
      return data  
    } catch (error) {  
      console.error('Error getting client by user ID:', error)  
      throw error  
    }  
  },  
  
  // ✅ CORREGIDO: Usar CreateClientData tipado  
  async createClient(clientData: CreateClientData): Promise<Client> {  
    try {  
      const newClient = {  
        ...clientData,  
        created_at: new Date().toISOString(),  
        updated_at: new Date().toISOString(),  
      }  
  
      const { data, error } = await supabase  
        .from('clients')  
        .insert([newClient])  
        .select()  
        .single()  
  
      if (error) throw error  
      return data  
    } catch (error) {  
      console.error('Error creating client:', error)  
      throw error  
    }  
  },  
  
  // ✅ CORREGIDO: Usar UpdateClientData tipado  
  async updateClient(id: string, updates: UpdateClientData): Promise<Client | null> {  
    try {  
      const updateData = {  
        ...updates,  
        updated_at: new Date().toISOString(),  
      }  
  
      const { data, error } = await supabase  
        .from('clients')  
        .update(updateData)  
        .eq('id', id)  
        .select()  
        .single()  
  
      if (error) throw error  
      return data  
    } catch (error) {  
      console.error('Error updating client:', error)  
      throw error  
    }  
  },  
  
  async deleteClient(id: string): Promise<boolean> {  
    try {  
      const { error } = await supabase  
        .from('clients')  
        .delete()  
        .eq('id', id)  
  
      if (error) throw error  
      return true  
    } catch (error) {  
      console.error('Error deleting client:', error)  
      throw error  
    }  
  },  
  
  // ✅ CORREGIDO: Usar ClientSearchResult tipado  
  async searchClients(query: string): Promise<ClientSearchResult> {  
    try {  
      const searchTerm = `%${query}%`  
      const { data, error, count } = await supabase  
        .rpc('search_clients', { search_term: searchTerm })  
        .select('*', { count: 'exact' })  
  
      if (error) throw error  
        
      return {  
        clients: data || [],  
        total: count || 0,  
        page: 1,  
        limit: data?.length || 0  
      }  
    } catch (error) {  
      console.error('Error searching clients:', error)  
      throw error  
    }  
  },  
  
  // ✅ NUEVO: Obtener clientes enriquecidos con estadísticas  
  async getEnhancedClients(filters?: ClientFilters): Promise<EnhancedClient[]> {  
    try {  
      const clients = await this.getAllClients(filters)  
        
      // Enriquecer con datos adicionales  
      const enhancedClients = await Promise.all(  
        clients.map(async (client) => {  
          // Obtener estadísticas del cliente  
          const { data: orders } = await supabase  
            .from('orders')  
            .select('id, total, created_at')  
            .eq('client_id', client.id)  
  
          const { data: vehicles } = await supabase  
            .from('vehicles')  
            .select('id')  
            .eq('client_id', client.id)  
  
          const orderCount = orders?.length || 0  
          const vehicleCount = vehicles?.length || 0  
          const totalSpent = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0  
          const lastOrderDate = orders?.[0]?.created_at  
  
          return {  
            ...client,  
            orderCount,  
            vehicleCount,  
            totalSpent,  
            lastOrderDate  
          } as EnhancedClient  
        })  
      )  
  
      return enhancedClients  
    } catch (error) {  
      console.error('Error getting enhanced clients:', error)  
      throw error  
    }  
  }  
}  
  
export default clientService