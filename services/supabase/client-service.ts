import { supabase } from '../../lib/supabase';  
  
// ✅ CORREGIDO: Tipo Client sincronizado con schema real  
export type Client = {  
  id: string;  
  name: string;  
  email?: string;  
  phone?: string;  
  company?: string;  
  client_type: 'Individual' | 'Empresa';  
  user_id?: string;  
  taller_id?: string;  
  created_at: string;  
  updated_at?: string;  
};  
  
// ✅ CORREGIDO: Tipos para operaciones CRUD  
export type CreateClientData = Omit<Client, 'id' | 'created_at' | 'updated_at'>;  
export type UpdateClientData = Partial<Omit<Client, 'id' | 'created_at'>>;  
  
export const clientService = {  
  // Get all clients  
  getAllClients: async (): Promise<Client[]> => {  
    try {  
      const { data, error } = await supabase  
        .from('clients')  
        .select('*')  
        .order('name');  
  
      if (error) throw error;  
      return data || [];  
    } catch (error) {  
      console.error('Error fetching clients:', error);  
      throw error;  
    }  
  },  
  
  // Get client by ID  
  getClientById: async (id: string): Promise<Client | null> => {  
    try {  
      const { data, error } = await supabase  
        .from('clients')  
        .select('*')  
        .eq('id', id)  
        .single();  
  
      if (error && error.code !== 'PGRST116') throw error;  
      return data;  
    } catch (error) {  
      console.error(`Error fetching client with ID ${id}:`, error);  
      throw error;  
    }  
  },  
  
  // Get client by user ID  
  getClientByUserId: async (userId: string): Promise<Client | null> => {  
    try {  
      const { data, error } = await supabase  
        .from('clients')  
        .select('*')  
        .eq('user_id', userId)  
        .single();  
  
      if (error && error.code !== 'PGRST116') throw error;  
      return data;  
    } catch (error) {  
      console.error(`Error fetching client with user ID ${userId}:`, error);  
      return null;  
    }  
  },  
  
  // Create client  
  createClient: async (clientData: CreateClientData): Promise<Client> => {  
    try {  
      const newClient = {  
        ...clientData,  
        created_at: new Date().toISOString(),  
        updated_at: new Date().toISOString(),  
      };  
  
      const { data, error } = await supabase  
        .from('clients')  
        .insert([newClient])  
        .select()  
        .single();  
  
      if (error) throw error;  
      return data;  
    } catch (error) {  
      console.error('Error creating client:', error);  
      throw error;  
    }  
  },  
  
  // Update client  
  updateClient: async (id: string, updates: UpdateClientData): Promise<Client | null> => {  
    try {  
      const updateData = {  
        ...updates,  
        updated_at: new Date().toISOString(),  
      };  
  
      const { data, error } = await supabase  
        .from('clients')  
        .update(updateData)  
        .eq('id', id)  
        .select()  
        .single();  
  
      if (error) throw error;  
      return data;  
    } catch (error) {  
      console.error(`Error updating client with ID ${id}:`, error);  
      throw error;  
    }  
  },  
  
  // Delete client  
  deleteClient: async (id: string): Promise<boolean> => {  
    try {  
      const { error } = await supabase  
        .from('clients')  
        .delete()  
        .eq('id', id);  
  
      if (error) throw error;  
      return true;  
    } catch (error) {  
      console.error(`Error deleting client with ID ${id}:`, error);  
      throw error;  
    }  
  },  
  
  // Search clients  
  searchClients: async (query: string): Promise<Client[]> => {  
    try {  
      if (!query.trim()) return [];  
  
      const searchTerm = `%${query}%`;  
  
      const { data, error } = await supabase  
        .from('clients')  
        .select('*')  
        .or(`name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)  
        .order('name');  
  
      if (error) throw error;  
      return data || [];  
    } catch (error) {  
      console.error('Error searching clients:', error);  
      throw error;  
    }  
  },  
  
  // Get clients by taller ID  
  getClientsByTallerId: async (tallerId: string): Promise<Client[]> => {  
    try {  
      const { data, error } = await supabase  
        .from('clients')  
        .select('*')  
        .eq('taller_id', tallerId)  
        .order('name');  
  
      if (error) throw error;  
      return data || [];  
    } catch (error) {  
      console.error(`Error fetching clients for taller ID ${tallerId}:`, error);  
      throw error;  
    }  
  },  
  
  // Initialize clients  
  initializeClients: async (): Promise<void> => {  
    try {  
      const clients = await clientService.getAllClients();  
      console.log(`Initialized ${clients.length} clients`);  
    } catch (error) {  
      console.error('Error initializing clients:', error);  
      throw error;  
    }  
  },  
};  
  
export default clientService;