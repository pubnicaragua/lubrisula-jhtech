import { supabase, supabaseService } from '../../lib/supabase';
import type { AppImage } from '../../types';

// Define types
export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  country?: string;
  taxId?: string;
  notes?: string;
  profileImage?: AppImage;
  createdAt: string;
  updatedAt?: string;
  userId?: string;
  insuranceInfo?: {
    company?: string;
    policyNumber?: string;
    expirationDate?: string;
    contactPerson?: string;
    contactPhone?: string;
  };
};

// Client Service with Supabase integration
export const clientService = {
  // Get all clients with optional filtering
  getAllClients: async (filters: Record<string, any> = {}): Promise<Client[]> => {
    try {
      let query = supabase.from('clients').select('*');

      // Apply filters if provided
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { data, error } = await query.order('name');

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

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
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
        .eq('userId', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error(`Error fetching client for user ID ${userId}:`, error);
      throw error;
    }
  },

  // Create a new client
  createClient: async (clientData: Omit<Client, 'id' | 'createdAt'>): Promise<Client> => {
    try {
      const newClient = {
        ...clientData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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

  // Update an existing client
  updateClient: async (id: string, updates: Partial<Client>): Promise<Client | null> => {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
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

  // Delete a client
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

  // Search clients by name, email, or phone
  searchClients: async (query: string): Promise<Client[]> => {
    try {
      if (!query.trim()) return [];

      const searchTerm = `%${query}%`;

      const { data, error } = await supabase
        .rpc('search_clients', { search_term: searchTerm });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching clients:', error);
      throw error;
    }
  },

  // Initialize with mock data (for development/testing)
  initializeWithMockData: async (mockClients: Client[]): Promise<void> => {
    try {
      // First, clear existing data
      await supabase.from('clients').delete().neq('id', '0');

      // Insert mock data
      const { error } = await supabase
        .from('clients')
        .insert(mockClients);

      if (error) throw error;
    } catch (error) {
      console.error('Error initializing mock client data:', error);
      throw error;
    }
  },

  initializeClients: async (): Promise<void> => {
    try {
      const clients = await clientService.getAllClients();
    } catch (error) {
      console.error('Error initializing client service:', error);
      throw error;
    }
  }
};

export default clientService;
