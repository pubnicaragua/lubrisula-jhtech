import { StackNavigationProp } from "@react-navigation/stack"

// Tipos para la navegación de la aplicación
// Este archivo centraliza todas las definiciones de tipos relacionados con la navegación

export type RootStackParamList = {
  // Pantallas de órdenes
  OrderDetail: { orderId: string }
  NewOrder: undefined
  UpdateOrder: { orderId: string }
  OrderStatus: { orderId: string }
  OrderParts: { orderId: string }
  
  // Pantallas de clientes
  ClientDetail: { clientId: string }
  NewClient: undefined
  ClientOrders: { clientId: string }
  ClientVehicles: { clientId: string }
  
  // Pantallas de inventario
  Inventory: undefined
  InventoryItemDetail: { itemId: string }
  NewInventoryItem: undefined
  
  // Pantallas de citas
  Appointments: undefined
  AppointmentDetail: { appointmentId: string }
  
  // Pantallas de reportes
  Reports: undefined
  
  // Pantallas de perfil
  Profile: undefined
  
  // Pantallas de dashboard
  Dashboard: undefined
  
  // Pantallas de selección
  ServiceSelection: { orderId: string }
  PartSelection: { orderId: string }
}

// Tipo específico para el ClientStack
export type ClientStackParamList = {
  Clients: undefined
  ClientDetail: { clientId: string }
  NewClient: undefined
  OrderDetail: { orderId: string }
  NewOrder: undefined
  VehicleDetail: { vehicleId: string }
}

export type ClientVehiclesStackParamList = {
  ClientVehicles: undefined
  VehicleDetail: { vehicleId: string }
  OrderDetail: { orderId: string }
  NewOrder: undefined
  NewVehicle: { clientId: string }
}

export type ClientOrdersStackParamList = {
  ClientOrders: undefined
  OrderDetail: { orderId: string }
  NewOrder: undefined
}

export type InventoryStackParamList = {
  Inventory: undefined
  InventoryItemDetail: { itemId: string }
  NewInventoryItem: undefined
}

export type OrdersStackParamList = {
  Kanban: undefined
  OrderDetail: { orderId: string }
  UpdateOrder: { orderId: string }
  OrderParts: { orderId: string }
  VehicleDetail: { vehicleId: string }
}

export type ProfileStackParamList = {
  Profile: undefined
}

export type ReportsStackParamList = {
  Reports: undefined
}

// Tipos para los parámetros de navegación específicos
export type OrderDetailParams = {
  orderId: string
}

export type ClientDetailParams = {
  clientId: string
}

export type InventoryItemDetailParams = {
  itemId: string
}

export type AppointmentDetailParams = {
  appointmentId: string
}

export type ServiceSelectionParams = {
  orderId: string
}

export type PartSelectionParams = {
  orderId: string
}
