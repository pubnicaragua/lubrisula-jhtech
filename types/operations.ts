// Tipos extendidos para reportes y vistas enriquecidas
export interface EnhancedClient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  client_type?: 'Individual' | 'Empresa';
  address?: string;
  totalOrders?: number;
  totalSpent?: number;
}

export interface EnhancedVehicle {
  id: string;
  marca: string;
  modelo: string;
  ano: number;
  placa: string;
  client_id?: string;
  totalOrders?: number;
  totalSpent?: number;
}
// types/operations.ts - Tipos para operaciones CRUD  
export interface CreateClientData {  
  name: string           // ✅ Requerido
  user_id: string        // ✅ Requerido
  phone: string          // ✅ Requerido
  email: string          // ✅ Requerido
  company?: string       // ✅ Opcional
  client_type?: 'Individual' | 'Empresa'  // ✅ Opcional
  address?: string       // ✅ Opcional
  taller_id: string      // ✅ Requerido
}  
  
export interface UpdateClientData {  
  name?: string  
  phone?: string  
  email?: string  
  company?: string  
  client_type?: 'Individual' | 'Empresa'  
}  
  
export interface CreateVehicleData {  
  client_id: string  
  marca: string  
  modelo: string  
  ano: number  
  color?: string  
  placa: string  
  vin?: string  
  kilometraje?: number  
  estado?: string  
  taller_id?: string  
}  
  
export interface UpdateVehicleData {  
  marca?: string  
  modelo?: string  
  ano?: number  
  color?: string  
  placa?: string  
  vin?: string  
  kilometraje?: number  
  estado?: string  
}  
  
// Tipos para filtros y búsqueda  
export interface ClientFilters {  
  searchTerm?: string  
  client_type?: 'Individual' | 'Empresa'  
  taller_id?: string  
  isActive?: boolean  
}  
  
export interface VehicleFilters {  
  searchTerm?: string  
  client_id?: string  
  marca?: string  
  estado?: string  
  taller_id?: string  
}  
  
// Tipos para respuestas de búsqueda  
export interface ClientSearchResult {  
  clients: EnhancedClient[]  
  total: number  
  page: number  
  limit: number  
}  
  
export interface VehicleSearchResult {  
  vehicles: EnhancedVehicle[]  
  total: number  
  page: number  
  limit: number  
}