// types/index.ts - Archivo maestro de re-exportaciones  
import { StackNavigationProp } from "@react-navigation/stack"  
import {  
  ClientStackParamList,  
  ClientVehiclesStackParamList,  
  ClientOrdersStackParamList,  
  InventoryStackParamList,  
  OrdersStackParamList,  
  ProfileStackParamList,  
  ReportsStackParamList  
} from './navigation'  
  
// ✅ CORREGIDO: Re-exportar tipos centralizados (SIN DUPLICACIONES)  
export * from './entities'  
export * from './operations'  
export * from './api'  
export * from './user'  
export * from './navigation'  
export * from './inventory'  
export * from './order'  
export * from './services'  
export * from './dashboard'  
export * from './canvan'  
  
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
  
// Tipos de navegación para pantallas  
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
  
// ✅ ELIMINADO: CreateClientType duplicado  
// Este tipo ahora debe venir de './operations' como CreateClientData