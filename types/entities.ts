// types/entities.ts - Archivo maestro para entidades principales  
export interface Client {  
  id: string  
  name: string  
  user_id: string        // ✅ REQUERIDO  
  phone: string          // ✅ REQUERIDO    
  email: string          // ✅ REQUERIDO  
  company?: string       // ✅ Opcional  
  client_type: 'Individual' | 'Empresa'  // ✅ REQUERIDO  
  created_at: string  
  updated_at?: string  
  taller_id: string      // ✅ REQUERIDO  
}  
  
export interface Vehicle {  
  id: string  
  client_id: string  
  marca: string          // ✅ Campo real del schema  
  modelo: string         // ✅ Campo real del schema  
  ano: number           // ✅ Campo real del schema  
  color?: string  
  placa: string         // ✅ Campo real del schema  
  vin?: string  
  kilometraje?: number  // ✅ Campo real del schema  
  created_at: string  
  updated_at?: string  
  estado?: string       // ✅ Campo real del schema  
  taller_id?: string    // ✅ Campo real del schema  
}  
  
// Tipos enriquecidos  
export interface EnhancedClient extends Client {  
  vehicleCount?: number  
  lastOrderDate?: string  
  totalSpent?: number  
  orderCount?: number  
}  
  
export interface EnhancedVehicle extends Vehicle {  
  clientData?: {  
    id: string  
    name: string  
    phone?: string  
    email?: string  
  }  
  orderCount?: number  
  lastOrderDate?: string  
  pendingOrders?: number  
  totalSpent?: number  
  maintenanceStatus?: 'up_to_date' | 'due_soon' | 'overdue'  
}