import { supabase } from '../../lib/supabase';  
import type { AppImage } from '../../types';  
  
// ✅ CORREGIDO: Tipo Vehicle sincronizado con schema real  
export type Vehicle = {  
  id: string;  
  client_id: string;  
  // ✅ Campos reales del schema de la base de datos  
  marca: string;  
  modelo: string;  
  ano: string;  
  vin?: string;  
  placa: string;  
  color?: string;  
  kilometraje?: number;  
  fuel_type?: 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'other';  
  transmission?: 'manual' | 'automatic' | 'cvt' | 'other';  
  engine_size?: string;  
  // ✅ CORREGIDO: Eliminar campos que no existen en el schema  
  // images: AppImage[]; - No existe en el schema actual  
  notes?: string;  
  created_at: string;  
  updated_at?: string;  
  // ✅ CORREGIDO: Eliminar campos inexistentes  
  // last_service_date?: string; - No existe  
  // next_service_date?: string; - No existe  
  // service_history?: {...}[]; - No existe  
};  
  
// ✅ CORREGIDO: Tipo para crear vehículo sin campos inexistentes  
export type CreateVehicleData = Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>;  
export type UpdateVehicleData = Partial<Omit<Vehicle, 'id' | 'created_at'>>;  
  
export const vehicleService = {  
  // Get all vehicles with optional filtering  
  getAllVehicles: async (filters: Record<string, any> = {}): Promise<Vehicle[]> => {  
    try {  
      let query = supabase.from('vehicles').select('*');  
        
      // Apply filters if provided  
      Object.entries(filters).forEach(([key, value]) => {  
        if (value !== undefined && value !== null) {  
          query = query.eq(key, value);  
        }  
      });  
        
      // ✅ CORREGIDO: Usar campos reales para ordenamiento  
      const { data, error } = await query.order('marca').order('modelo');  
        
      if (error) throw error;  
      return data || [];  
    } catch (error) {  
      console.error('Error fetching vehicles:', error);  
      throw error;  
    }  
  },  
    
  // Get vehicle by ID  
  getVehicleById: async (id: string): Promise<Vehicle | null> => {  
    try {  
      const { data, error } = await supabase  
        .from('vehicles')  
        .select('*')  
        .eq('id', id)  
        .single();  
          
      if (error && error.code !== 'PGRST116') throw error;  
      return data;  
    } catch (error) {  
      console.error(`Error fetching vehicle with ID ${id}:`, error);  
      throw error;  
    }  
  },  
    
  // Get vehicles by client ID  
  getVehiclesByClientId: async (clientId: string): Promise<Vehicle[]> => {  
    try {  
      const { data, error } = await supabase  
        .from('vehicles')  
        .select('*')  
        .eq('client_id', clientId)  
        .order('marca')  
        .order('modelo');  
          
      if (error) throw error;  
      return data || [];  
    } catch (error) {  
      console.error(`Error fetching vehicles for client ID ${clientId}:`, error);  
      throw error;  
    }  
  },  
    
  // ✅ CORREGIDO: Crear vehículo sin campos inexistentes  
  createVehicle: async (vehicleData: CreateVehicleData): Promise<Vehicle> => {  
    try {  
      const newVehicle = {  
        ...vehicleData,  
        created_at: new Date().toISOString(),  
        updated_at: new Date().toISOString(),  
      };  
        
      const { data, error } = await supabase  
        .from('vehicles')  
        .insert([newVehicle])  
        .select()  
        .single();  
          
      if (error) throw error;  
      return data;  
    } catch (error) {  
      console.error('Error creating vehicle:', error);  
      throw error;  
    }  
  },  
    
  // ✅ CORREGIDO: Actualizar vehículo con tipo correcto  
  updateVehicle: async (id: string, updates: UpdateVehicleData): Promise<Vehicle | null> => {  
    try {  
      const updateData = {  
        ...updates,  
        updated_at: new Date().toISOString(),  
      };  
        
      const { data, error } = await supabase  
        .from('vehicles')  
        .update(updateData)  
        .eq('id', id)  
        .select()  
        .single();  
          
      if (error) throw error;  
      return data;  
    } catch (error) {  
      console.error(`Error updating vehicle with ID ${id}:`, error);  
      throw error;  
    }  
  },  
    
  // ✅ CORREGIDO: Eliminar métodos de imágenes hasta implementar  
  // addVehicleImage - Comentado hasta implementar sistema de imágenes  
  // removeVehicleImage - Comentado hasta implementar sistema de imágenes  
    
  // ✅ CORREGIDO: Eliminar método de historial de servicio hasta implementar  
  // addServiceRecord - Comentado hasta implementar sistema de historial  
    
  // Delete a vehicle  
  deleteVehicle: async (id: string): Promise<boolean> => {  
    try {  
      const { error } = await supabase  
        .from('vehicles')  
        .delete()  
        .eq('id', id);  
          
      if (error) throw error;  
      return true;  
    } catch (error) {  
      console.error(`Error deleting vehicle with ID ${id}:`, error);  
      throw error;  
    }  
  },  
    
  // Search vehicles by marca, modelo, placa, or VIN  
  searchVehicles: async (query: string): Promise<Vehicle[]> => {  
    try {  
      if (!query.trim()) return [];  
        
      const searchTerm = `%${query}%`;  
        
      const { data, error } = await supabase  
        .rpc('search_vehicles', { search_term: searchTerm });  
          
      if (error) throw error;  
      return data || [];  
    } catch (error) {  
      console.error('Error searching vehicles:', error);  
      throw error;  
    }  
  },  
    
  // Initialize with mock data (for development/testing)  
  initializeWithMockData: async (mockVehicles: Vehicle[]): Promise<void> => {  
    try {  
      // First, clear existing data  
      await supabase.from('vehicles').delete().neq('id', '0');  
        
      // Insert mock data  
      const { error } = await supabase  
        .from('vehicles')  
        .insert(mockVehicles);  
          
      if (error) throw error;  
    } catch (error) {  
      console.error('Error initializing mock vehicle data:', error);  
      throw error;  
    }  
  },  
  
  // ✅ CORREGIDO: Método de inicialización simplificado  
  initializeVehicles: async (): Promise<void> => {  
    try {  
      const vehicles = await vehicleService.getAllVehicles();  
      console.log(`Initialized ${vehicles.length} vehicles`);  
    } catch (error) {  
      console.error('Error initializing vehicles:', error);  
      throw error;  
    }  
  },  
};  
  
export default vehicleService;