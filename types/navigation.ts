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
