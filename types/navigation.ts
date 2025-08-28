import { StackNavigationProp } from "@react-navigation/stack"  
  
// Tipos centralizados para la navegación de la aplicación  
export type RootStackParamList = {  
  // Dashboard  
  Dashboard: undefined  
  ClientDashboard: undefined  
  
  // Órdenes  
  Orders: undefined  
  OrderDetail: { orderId: string }  
  NewOrder: { clientId?: string; vehicleId?: string; preselectedVehicle?: string } | undefined  
  UpdateOrder: { orderId: string }  
  OrderStatus: { orderId: string }  
  OrderParts: { orderId: string }  
  OrderHistory: undefined  
  
  // Clientes  
  Clients: undefined  
  ClientDetail: { clientId: string }  
  NewClient: undefined  
  ClientOrders: { clientId?: string }  
  ClientVehicles: { clientId?: string }  
  
  // Vehículos  
  VehicleDetail: { vehicleId: string }  
  NewVehicle: { clientId: string }  
  EditVehicle: { vehicleId: string }  
  
  // Inventario  
  Inventory: undefined  
  InventoryItemDetail: { itemId: string }  
  NewInventoryItem: undefined  
  
  // ✅ AGREGADO: Citas  
  Appointments: undefined  
  AppointmentDetail: { appointmentId: string }  
  NewAppointment: { preselectedVehicle?: string; clientId?: string } | undefined  
  
  // Reportes  
  Reports: undefined  
  Analytics: undefined  
  FinancialReports: undefined  
  
  // Perfil  
  Profile: undefined  
  Settings: undefined  
  ChangePassword: undefined  
  
  // Selección  
  ServiceSelection: { orderId: string }  
  PartSelection: { orderId: string; onPartSelect?: (parts: any[]) => void }  
  
  // Kanban  
  Kanban: undefined  
  
  // Notificaciones y ayuda  
  Notifications: undefined  
  Help: undefined  
  About: undefined  
  
  // Autenticación  
  Login: undefined  
}  
  
// ✅ CORREGIDO: Tipos específicos para cada stack  
export type ClientStackParamList = Pick<RootStackParamList,  
  'Clients' | 'ClientDetail' | 'NewClient' | 'OrderDetail' | 'NewOrder' | 'VehicleDetail' | 'EditVehicle'>  
  
export type ClientVehiclesStackParamList = Pick<RootStackParamList,  
  'ClientVehicles' | 'VehicleDetail' | 'OrderDetail' | 'NewOrder' | 'NewVehicle' | 'EditVehicle'>  
  
export type ClientOrdersStackParamList = Pick<RootStackParamList,  
  'ClientOrders' | 'OrderDetail' | 'NewOrder'>  
  
export type InventoryStackParamList = Pick<RootStackParamList,  
  'Inventory' | 'InventoryItemDetail'    | 'NewInventoryItem'>  
  
  export type OrdersStackParamList = Pick<RootStackParamList,  
    'Kanban' | 'OrderDetail' | 'UpdateOrder' | 'OrderParts' | 'VehicleDetail' | 'NewOrder' | 'ServiceSelection' | 'PartSelection' | 'EditVehicle'>  
    
  // ✅ AGREGADO: Stack de citas  
  export type AppointmentsStackParamList = Pick<RootStackParamList,  
    'Appointments' | 'AppointmentDetail' | 'NewAppointment'>  
    
  export type ProfileStackParamList = Pick<RootStackParamList,  
    'Profile' | 'Settings' | 'ChangePassword'>  
    
  export type ReportsStackParamList = Pick<RootStackParamList,  
    'Reports' | 'Analytics' | 'FinancialReports'>  
    
  // ✅ CORREGIDO: Tipos para parámetros específicos  
  export type OrderDetailParams = {  
    orderId: string  
  }  
    
  export type ClientDetailParams = {  
    clientId: string  
  }  
    
  export type InventoryItemDetailParams = {  
    itemId: string  
  }  
    
  export type VehicleDetailParams = {  
    vehicleId: string  
  }  
    
  export type EditVehicleParams = {  
    vehicleId: string  
  }  
    
  export type NewOrderParams = {  
    clientId?: string  
    vehicleId?: string  
    preselectedVehicle?: string  
  }  
    
  export type NewAppointmentParams = {  
    preselectedVehicle?: string  
    clientId?: string  
  }  
    
  export type AppointmentDetailParams = {  
    appointmentId: string  
  }  
    
  export type PartSelectionParams = {  
    orderId: string  
    onPartSelect?: (parts: any[]) => void  
  }  
    
  // Tipos de navegación para componentes  
  export type NavigationProp<T extends keyof RootStackParamList> = StackNavigationProp<RootStackParamList, T>