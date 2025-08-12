import { StackNavigationProp } from "@react-navigation/stack"  
import { RouteProp } from "@react-navigation/native"  
import {   
  ClientStackParamList,   
  ClientVehiclesStackParamList,   
  ClientOrdersStackParamList,  
  InventoryStackParamList,  
  OrdersStackParamList,  
  ProfileStackParamList,  
  ReportsStackParamList,  
  RootStackParamList  
} from './navigation'  
  
// Tipos de moneda para los países de Centroamérica  
export type CurrencyCode = "USD" | "GTQ" | "HNL" | "NIO" | "CRC" | "PAB" | "SVC" | "BZD"  
  
export type Currency = {  
  code: CurrencyCode  
  name: string  
  symbol: string  
  exchangeRate: number // Tasa de cambio con respecto al dólar  
}  
  
// Tipo para imágenes  
export type AppImage = {  
  id: string  
  uri: string  
  type: "vehicle" | "damage" | "repair" | "invoice" | "insurance" | "other"  
  description?: string  
  createdAt: string  
}  
  
// Tipo para comentarios y notas  
export type Comment = {  
  id: string  
  userId: string  
  userName: string  
  text: string  
  createdAt: string  
  type: "client" | "technician" | "insurance" | "system"  
}  
  
// Tipo para respuestas de aseguradoras  
export type InsuranceResponse = {  
  id: string  
  insuranceCompany: string  
  policyNumber?: string  
  claimNumber?: string  
  approved: boolean  
  approvedAmount?: number  
  comments: string  
  responseDate: string  
  documents?: AppImage[]  
}  
  
// Tipo para procesos de reparación  
export type RepairProcess = {  
  id: string  
  name: string  
  description: string  
  startDate?: string  
  endDate?: string  
  status: "pending" | "in_progress" | "completed" | "cancelled"  
  technicianId: string  
  technicianName: string  
  images?: AppImage[]  
  notes?: string  
}  
  
// Tipo para configuración de la empresa  
export type CompanySettings = {  
  name: string  
  logo?: string  
  address?: string  
  phone?: string  
  email?: string  
  website?: string  
  taxId?: string  
  defaultCurrency: CurrencyCode  
  showPricesWithTax: boolean  
  taxRate: number  
  termsAndConditions?: string  
  invoiceFooter?: string  
  invoiceNotes?: string  
}  
  
export interface CitasDetalleType {    
  id: string    
  client_id: string    
  vehiculo_id: string    
  fecha: string    
  hora: string    
  tipo_servicio: string    
  estado: string    
  notas?: string    
  tecnico_id?: string    
  costo?: number    
  fecha_creacion: string    
  // Related data properties  
  tipos_operacion?: { nombre: string }  
  clients?: { name: string }  
  vehicles?: { marca: string; modelo: string; placa: string }  
  tecnicos?: { nombre: string; apellido: string }  
  hora_inicio?: string  
  hora_fin?: string  
  observaciones?: string  
}  
  
// ✅ CORREGIDO: Eliminado 'any' y tipado estricto  
export type UiScreenNavProp = {  
  navigation: StackNavigationProp<  
    | ClientStackParamList   
    | ClientVehiclesStackParamList   
    | ClientOrdersStackParamList  
    | InventoryStackParamList  
    | OrdersStackParamList  
    | ProfileStackParamList  
    | ReportsStackParamList  
  >  
}  
  
// ✅ CORREGIDO: Props tipadas específicamente para cada pantalla (eliminando 'any')  
export type ClientScreenProps = {  
  navigation: StackNavigationProp<ClientStackParamList>  
  route: RouteProp<ClientStackParamList, keyof ClientStackParamList>  
}  
  
export type ClientVehiclesScreenProps = {  
  navigation: StackNavigationProp<ClientVehiclesStackParamList>  
  route: RouteProp<ClientVehiclesStackParamList, keyof ClientVehiclesStackParamList>  
}  
  
export type ClientOrdersScreenProps = {  
  navigation: StackNavigationProp<ClientOrdersStackParamList>  
  route: RouteProp<ClientOrdersStackParamList, keyof ClientOrdersStackParamList>  
}  
  
export type InventoryScreenProps = {  
  navigation: StackNavigationProp<InventoryStackParamList>  
  route: RouteProp<InventoryStackParamList, keyof InventoryStackParamList>  
}  
  
export type OrdersScreenProps = {  
  navigation: StackNavigationProp<OrdersStackParamList>  
  route: RouteProp<OrdersStackParamList, keyof OrdersStackParamList>  
}  
  
export type ProfileScreenProps = {  
  navigation: StackNavigationProp<ProfileStackParamList>  
  route: RouteProp<ProfileStackParamList, keyof ProfileStackParamList>  
}  
  
export type ReportsScreenProps = {  
  navigation: StackNavigationProp<ReportsStackParamList>  
  route: RouteProp<ReportsStackParamList, keyof ReportsStackParamList>  
}  
  
// ✅ CORREGIDO: Props genéricas completamente tipadas  
export type UiScreenProps = {  
  route: RouteProp<RootStackParamList, keyof RootStackParamList>  
  navigation: StackNavigationProp<RootStackParamList>  
}  
  
// Re-exportar tipos de navegación  
export * from './navigation'  
  
// Export all order-related types  
export * from './order'  
export * from './canvan'  
export * from './services'  
  
// Tipo para crear un cliente según el schema de la base de datos  
export type CreateClientType = {  
  name: string                    // NOT NULL  
  user_id?: string               // uuid, opcional  
  company?: string               // text, opcional  
  phone?: string                 // text, opcional  
  email?: string                 // text, opcional  
  client_type?: 'Individual' | 'Empresa'  // text, default 'Individual'  
  taller_id?: string            // uuid, opcional, referencia a talleres(id)  
}  
  
// Re-export Client type from client service  
export type { Client } from '../services/supabase/client-service'