import { supabase } from '../../lib/supabase';
import type { AppImage } from '../../types';

// Define types
export type Vehicle = {
  id: string;
  clientId: string;
  make: string;
  model: string;
  year: string;
  vin?: string;
  licensePlate: string;
  color?: string;
  mileage?: number;
  fuelType?: 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'other';
  transmission?: 'manual' | 'automatic' | 'cvt' | 'other';
  engineSize?: string;
  images: AppImage[];
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  lastServiceDate?: string;
  nextServiceDate?: string;
  serviceHistory?: {
    date: string;
    mileage: number;
    description: string;
    cost: number;
  }[];
};

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
      
      const { data, error } = await query.order('make').order('model');
      
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
        .eq('clientId', clientId)
        .order('make')
        .order('model');
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching vehicles for client ID ${clientId}:`, error);
      throw error;
    }
  },
  
  // Create a new vehicle
  createVehicle: async (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'images' | 'serviceHistory'>): Promise<Vehicle> => {
    try {
      const newVehicle = {
        ...vehicleData,
        images: [],
        serviceHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
  
  // Update an existing vehicle
  updateVehicle: async (id: string, updates: Partial<Vehicle>): Promise<Vehicle | null> => {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
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
  
  // Add an image to a vehicle
  addVehicleImage: async (vehicleId: string, image: AppImage): Promise<Vehicle | null> => {
    try {
      // First get the current vehicle
      const { data: vehicle, error: fetchError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Add the new image to the images array
      const updatedImages = [...(vehicle.images || []), image];
      
      // Update the vehicle with the new images array
      const { data, error } = await supabase
        .from('vehicles')
        .update({ 
          images: updatedImages,
          updatedAt: new Date().toISOString() 
        })
        .eq('id', vehicleId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error adding image to vehicle ${vehicleId}:`, error);
      throw error;
    }
  },
  
  // Remove an image from a vehicle
  removeVehicleImage: async (vehicleId: string, imageId: string): Promise<Vehicle | null> => {
    try {
      // First get the current vehicle
      const { data: vehicle, error: fetchError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Filter out the image with the given ID
      const updatedImages = (vehicle.images || []).filter((img: AppImage) => img.id !== imageId);
      
      // Update the vehicle with the filtered images array
      const { data, error } = await supabase
        .from('vehicles')
        .update({ 
          images: updatedImages,
          updatedAt: new Date().toISOString() 
        })
        .eq('id', vehicleId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error removing image ${imageId} from vehicle ${vehicleId}:`, error);
      throw error;
    }
  },
  
  // Add a service record to a vehicle
  addServiceRecord: async (
    vehicleId: string, 
    serviceRecord: { date: string; mileage: number; description: string; cost: number }
  ): Promise<Vehicle | null> => {
    try {
      // First get the current vehicle
      const { data: vehicle, error: fetchError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Add the new service record to the service history
      const updatedServiceHistory = [
        ...(vehicle.serviceHistory || []), 
        { ...serviceRecord, id: crypto.randomUUID() }
      ];
      
      // Update the vehicle with the new service history
      const { data, error } = await supabase
        .from('vehicles')
        .update({ 
          serviceHistory: updatedServiceHistory,
          lastServiceDate: serviceRecord.date,
          updatedAt: new Date().toISOString() 
        })
        .eq('id', vehicleId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error adding service record to vehicle ${vehicleId}:`, error);
      throw error;
    }
  },
  
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
  
  // Search vehicles by make, model, license plate, or VIN
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

  initializeVehicles: async (): Promise<void> => {
    try {
      const vehicles = await vehicleService.getAllVehicles()
    } catch (error) {
      console.error('Error initializing mock vehicle data:', error);
      throw error;
    }
  },
};

export default vehicleService;
