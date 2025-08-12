import { StackNavigationProp } from "@react-navigation/stack"  
  
// Tipos centralizados para la navegación de la aplicación  
export type RootStackParamList = {  
  // Dashboard  
  Dashboard: undefined  
    
  // Órdenes  
  Orders: undefined  
  OrderDetail: { orderId: string }  
  NewOrder: { clientId?: string; vehicleId?: string } | undefined  
  UpdateOrder: { orderId: string }  
  OrderStatus: { orderId: string }  
  OrderParts: { orderId: string }  
  OrderHistory: undefined  
    
  // Clientes  
  Clients: undefined  
  ClientDetail: { clientId: string }  
  NewClient: undefined  
  ClientOrders: { clientId: string }  
  ClientVehicles: { clientId: string }  
    
  // Vehículos  
  VehicleDetail: { vehicleId: string }  
  NewVehicle: { clientId: string }  
    
  // Inventario  
  Inventory: undefined  
  InventoryItemDetail: { itemId: string }  
  NewInventoryItem: undefined  
    
  // Citas  
  Appointments: undefined  
  AppointmentDetail: { appointmentId: string }  
    
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
}  
  
// Tipos específicos para cada stack  
export type ClientStackParamList = Pick<RootStackParamList,   
  'Clients' | 'ClientDetail' | 'NewClient' | 'OrderDetail' | 'NewOrder' | 'VehicleDetail'  
>  
  
export type ClientVehiclesStackParamList = Pick<RootStackParamList,  
  'ClientVehicles' | 'VehicleDetail' | 'OrderDetail' | 'NewOrder' | 'NewVehicle'  
>  
  
export type ClientOrdersStackParamList = Pick<RootStackParamList,  
  'ClientOrders' | 'OrderDetail' | 'NewOrder'  
>  
  
export type InventoryStackParamList = Pick<RootStackParamList,  
  'Inventory' | 'InventoryItemDetail' | 'NewInventoryItem'  
>  
  
export type OrdersStackParamList = Pick<RootStackParamList,  
  'Kanban' | 'OrderDetail' | 'UpdateOrder' | 'OrderParts' | 'VehicleDetail' | 'ServiceSelection' | 'PartSelection'  
>  
  
export type ProfileStackParamList = Pick<RootStackParamList,  
  'Profile' | 'Settings' | 'ChangePassword'  
>  
  
export type ReportsStackParamList = Pick<RootStackParamList,  
  'Reports' | 'Analytics' | 'FinancialReports'  
>  
  
// Tipos para parámetros específicos  
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
  
export type NewOrderParams = {  
  clientId?: string  
  vehicleId?: string  
}  
  
export type PartSelectionParams = {  
  orderId: string  
  onPartSelect?: (parts: any[]) => void  
}  
  
// Tipos de navegación para componentes  
export type NavigationProp<T extends keyof RootStackParamList> = StackNavigationProp<RootStackParamList, T>