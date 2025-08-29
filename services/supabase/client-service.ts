

import { supabase } from '../../lib/supabase'

// Tipos
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
  // Get all clients with their vehicles (for selects)
  getClientsWithVehicles: async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email, phone, company, client_type, user_id, taller_id, created_at, updated_at, vehicles(id, marca, modelo, ano, placa, client_id, created_at, updated_at)')
        .order('name');
      if (error) throw error;
      // Normalizar para cumplir con el tipo Client y Vehicle
      const normalized = (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        company: c.company,
        client_type: c.client_type,
        user_id: c.user_id,
        taller_id: c.taller_id,
        created_at: c.created_at,
        updated_at: c.updated_at,
        vehicles: (c.vehicles || []).map((v: any) => ({
          id: v.id,
          client_id: v.client_id,
          marca: v.marca,
          modelo: v.modelo,
          ano: v.ano,
          placa: v.placa,
          created_at: v.created_at,
          updated_at: v.updated_at
        }))
      }));
      return { data: normalized, error: null };
    } catch (error) {
      console.error('Error fetching clients with vehicles:', error);
      return { data: [], error };
    }
  },
  // Get client by ID
  getClientById: async (id: string): Promise<Client | null> => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
  .maybeSingle();
      if (error && error.code !== 'PGRST116' && error.code !== 'PGRST406') throw error;
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
        .maybeSingle();
      if (error && error.code !== 'PGRST116' && error.code !== 'PGRST406') throw error;
      return data;
    } catch (error) {
      console.error(`Error fetching client by user ID ${userId}:`, error);
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
  .maybeSingle();
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
  .maybeSingle();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating client:', error);
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