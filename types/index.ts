// types/index.ts - Archivo maestro corregido  
import { StackNavigationProp } from "@react-navigation/stack"  
  
// ✅ CORREGIDO: Importar tipos de navegación PRIMERO  
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
  
// ✅ Re-exportar tipos de navegación  
export * from './navigation'  
export * from './user'  
  
// ✅ Re-exportaciones selectivas SOLO de tipos que existen  
export type {   
  Client,   
  Vehicle   
  // ❌ ELIMINADO: Taller - no existe en entities  
} from './entities'  
  
export type {   
  CreateClientData,  
  UpdateClientData,  
  CreateVehicleData,  
  UpdateVehicleData   
} from './operations'  
  
export type {   
  ApiResponse  
  // ❌ ELIMINADO: ApiError - no existe en api  
} from './api'  
  
export type {   
  ServicioType  
  // ❌ ELIMINADO: CreateServiceData - no existe en services  
} from './services'  
  
export type {   
  DashboardStats  
  // ❌ ELIMINADO: RevenueData - no existe en dashboard  
} from './dashboard'  
  
export type {   
  KanbanOrderType,  
  KanbanCardProps,  
  KanbanColumnProps,  
  KanbanScreenProps,  
  TechnicianType   
} from './canvan'  
  
export type {   
  Order,  
  OrderStatus,  
  PaymentStatus,  
  CreateOrderData,  
  UpdateOrderData   
} from './order'  
  
export type {   
  MaterialCategory,  
  Supplier  
  // ❌ ELIMINADO: CreateInventoryData, UpdateInventoryData - no existen en inventory  
} from './inventory'  
  
// Tipos de moneda para los países de Centroamérica  
export type CurrencyCode = "USD" | "GTQ" | "HNL" | "NIO" | "CRC" | "PAB" | "SVC" | "BZD"  
  
export type Currency = {  
  code: CurrencyCode  
  name: string  
  symbol: string  
  exchangeRate: number  
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
  
// Tipo para configuración de empresa  
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
  
// ✅ CORREGIDO: Tipos de navegación ahora disponibles  
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
  
// Tipos específicos para cada stack  
export type ClientScreenProps = {  
  navigation: StackNavigationProp<ClientStackParamList>  
  route: any  
}  
  
export type ClientVehiclesScreenProps = {  
  navigation: StackNavigationProp<ClientVehiclesStackParamList>  
  route: any  
}  
  
export type ClientOrdersScreenProps = {  
  navigation: StackNavigationProp<ClientOrdersStackParamList>  
  route: any  
}  
  
export type InventoryScreenProps = {  
  navigation: StackNavigationProp<InventoryStackParamList>  
  route: any  
}  
  
export type OrdersScreenProps = {  
  navigation: StackNavigationProp<OrdersStackParamList>  
  route: any  
}  
  
export type ProfileScreenProps = {  
  navigation: StackNavigationProp<ProfileStackParamList>  
  route: any  
}  
  
export type ReportsScreenProps = {  
  navigation: StackNavigationProp<ReportsStackParamList>  
  route: any  
}  
  
// Common screen props type  
export type UiScreenProps = {  
  route: { params: any }  
  navigation: StackNavigationProp<any>  
}