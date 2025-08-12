import { AppImage } from './index'  
  
// ✅ CORREGIDO: Sincronizar campos de vehículo  
export interface Vehicle {  
  id: string  
  // ✅ CORREGIDO: Usar client_id del schema real  
  client_id: string  
  make: string  
  model: string  
  year: string  
  vin?: string  
  // ✅ CORREGIDO: Usar license_plate del schema real  
  license_plate: string  
  color?: string  
  mileage?: number  
  fuel_type?: 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'other'  
  transmission?: 'manual' | 'automatic' | 'cvt' | 'other'  
  engine_size?: string  
  images: AppImage[]  
  notes?: string  
  created_at: string  
  updated_at?: string  
  last_service_date?: string  
  next_service_date?: string  
  service_history?: ServiceRecord[]  
    
  // ✅ CORREGIDO: Campos computados para compatibilidad  
  get displayName(): string  
  get fullInfo(): string  
}  
  
export interface ServiceRecord {  
  date: string  
  mileage: number  
  description: string  
  cost: number  
  technicianId?: string  
  orderId?: string  
  notes?: string  
}  
  
// ✅ CORREGIDO: Implementación de campos computados  
export class VehicleImpl implements Vehicle {  
  constructor(  
    public id: string,  
    public client_id: string,  
    public make: string,  
    public model: string,  
    public year: string,  
    public license_plate: string,  
    public vin: string = '',  
    public color: string = '',  
    public mileage: number = 0,  
    public fuel_type: 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'other' = 'gasoline',  
    public transmission: 'manual' | 'automatic' | 'cvt' | 'other' = 'manual',  
    public engine_size: string = '',  
    public images: AppImage[] = [],  
    public notes: string = '',  
    public created_at: string = new Date().toISOString(),  
    public updated_at: string = new Date().toISOString(),  
    public last_service_date?: string,  
    public next_service_date?: string,  
    public service_history: ServiceRecord[] = []  
  ) {}  
  
  get displayName(): string {  
    return `${this.make} ${this.model} (${this.year})`  
  }  
  
  get fullInfo(): string {  
    return `${this.make} ${this.model} ${this.year} - ${this.license_plate}`  
  }  
}  
  
// ✅ CORREGIDO: Función helper para mapear campos legacy  
export const mapLegacyVehicleFields = (vehicleData: any): Vehicle => {  
  return {  
    id: vehicleData.id,  
    // Mapear client_id vs clientId  
    client_id: vehicleData.client_id || vehicleData.clientId,  
    make: vehicleData.make,  
    model: vehicleData.model,  
    year: vehicleData.year,  
    vin: vehicleData.vin,  
    // Mapear license_plate vs licensePlate  
    license_plate: vehicleData.license_plate || vehicleData.licensePlate,  
    color: vehicleData.color,  
    mileage: vehicleData.mileage,  
    fuel_type: vehicleData.fuel_type || vehicleData.fuelType,  
    transmission: vehicleData.transmission,  
    engine_size: vehicleData.engine_size || vehicleData.engineSize,  
    images: vehicleData.images || [],  
    notes: vehicleData.notes,  
    created_at: vehicleData.created_at || vehicleData.createdAt || new Date().toISOString(),  
    updated_at: vehicleData.updated_at || vehicleData.updatedAt,  
    last_service_date: vehicleData.last_service_date || vehicleData.lastServiceDate,  
    next_service_date: vehicleData.next_service_date || vehicleData.nextServiceDate,  
    service_history: vehicleData.service_history || vehicleData.serviceHistory || [],  
    get displayName() {  
      return `${this.make} ${this.model} (${this.year})`  
    },  
    get fullInfo() {  
      return `${this.make} ${this.model} ${this.year} - ${this.license_plate}`  
    }  
  }  
}  
  
// ✅ CORREGIDO: Tipo para crear vehículos con campos reales  
export interface CreateVehicleData {  
  client_id: string  
  make: string  
  model: string  
  year: string  
  license_plate: string  
  vin?: string  
  color?: string  
  mileage?: number  
  fuel_type?: 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'other'  
  transmission?: 'manual' | 'automatic' | 'cvt' | 'other'  
  engine_size?: string  
  notes?: string  
}  
  
export interface UpdateVehicleData {  
  make?: string  
  model?: string  
  year?: string  
  license_plate?: string  
  vin?: string  
  color?: string  
  mileage?: number  
  fuel_type?: 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'other'  
  transmission?: 'manual' | 'automatic' | 'cvt' | 'other'  
  engine_size?: string  
  notes?: string  
  last_service_date?: string  
  next_service_date?: string  
}  
  
// ✅ CORREGIDO: Tipo para vehículos enriquecidos con datos relacionados  
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
  
export type VehicleStatus = 'active' | 'inactive' | 'maintenance' | 'sold'  
  
export type FuelType = 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'other'  
  
export type TransmissionType = 'manual' | 'automatic' | 'cvt' | 'other'