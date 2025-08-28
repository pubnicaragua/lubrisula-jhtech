"use client"  
import { createStackNavigator } from "@react-navigation/stack"  
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"  
import { Feather } from "@expo/vector-icons"  
import { useAuth } from "../context/auth-context"  
import { ActivityIndicator, View, Text } from "react-native"  
import type { StackScreenProps } from '@react-navigation/stack'  
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'  
  
// ✅ CORREGIDO: Definir tipos de navegación correctos  
export type RootStackParamList = {  
  Login: undefined  
  Dashboard: undefined  
  ClientDashboard: undefined  
  Clients: undefined  
  ClientDetail: { clientId: string }  
  NewClient: undefined  
  Inventory: undefined  
  InventoryItemDetail: { itemId: string }  
  NewInventoryItem: undefined  
  OrderDetail: { orderId: string }  
  NewOrder: { clientId?: string; vehicleId?: string }  
  UpdateOrder: { orderId: string }  
  OrderParts: { orderId: string }  
  Profile: undefined  
  Reports: undefined  
  Kanban: undefined  
  ClientOrders: undefined  
  ClientVehicles: undefined  
  VehicleDetail: { vehicleId: string }  
  Appointments: undefined  
  NewAppointment: undefined  
  AppointmentDetail: { appointmentId: string }  
  EditVehicle: { vehicleId: string }  
}  
  
export type TabParamList = {  
  Dashboard: undefined  
  ClientDashboard: undefined  
  ClientsTab: undefined  
  InventoryTab: undefined  
  OrdersTab: undefined  
  ClientOrdersTab: undefined  
  ClientVehiclesTab: undefined  
  AppointmentsTab: undefined  
  ReportsTab: undefined  
  ProfileTab: undefined  
}  
  
// Importar todas las pantallas  
import LoginScreen from "../screens/login-screen"  
import DashboardScreen from "../screens/dashboard-screen"  
import ClientDashboardScreen from "../screens/client-dashboard-screen"  
import ClientsScreen from "../screens/clients-screen"  
import ClientDetailScreen from "../screens/client-detail-screen"  
import NewClientScreen from "../screens/new-client-screen"  
import InventoryScreen from "../screens/inventory-screen"  
import InventoryItemDetailScreen from "../screens/inventory-item-detail-screen"  
import NewInventoryItemScreen from "../screens/new-inventory-item-screen"  
import OrderDetailScreen from "../screens/order-detail-screen"  
import NewOrderScreen from "../screens/new-order-screen"  
import UpdateOrderScreen from "../screens/update-order-screen"  
import OrderPartsScreen from "../screens/order-parts-screen"  
import ProfileScreen from "../screens/profile-screen"  
import ReportsScreen from "../screens/reports-screen"  
import KanbanScreen from "../screens/kanban-screen"  
import ClientOrdersScreen from "../screens/client-orders-screen"  
import ClientVehicleScreen from "../screens/client-vehicle-screen"  
import VehicleDetailScreen from "../screens/vehicle-detail-screen"  
import AppointmentsScreen from "../screens/appointments-screen"  
import NewAppointmentScreen from "../screens/new-appointment-screen"  
import AppointmentDetailScreen from "../screens/appointment-detail-screen"  
import EditVehicleScreen from "../screens/edit-vehicle-screen"  
  
const Stack = createStackNavigator<RootStackParamList>()  
const Tab = createBottomTabNavigator<TabParamList>()  
  
// Navegador de autenticación  
const AuthNavigator = () => {  
  return (  
    <Stack.Navigator screenOptions={{ headerShown: false }}>  
      <Stack.Screen name="Login" component={LoginScreen} />  
    </Stack.Navigator>  
  )  
}  
  
// Navegador de clientes  
const ClientStack = () => {  
  return (  
    <Stack.Navigator  
      screenOptions={{  
        headerStyle: { backgroundColor: "#1a73e8" },  
        headerTintColor: "#fff",  
        headerTitleStyle: { fontWeight: "bold" },  
      }}  
    >  
      <Stack.Screen name="Clients" component={ClientsScreen} options={{ title: "Clientes" }} />  
      <Stack.Screen name="ClientDetail" component={ClientDetailScreen} options={{ title: "Detalle del Cliente" }} />  
      <Stack.Screen name="NewClient" component={NewClientScreen} options={{ title: "Nuevo Cliente" }} />  
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: "Detalle de Orden" }} />  
      <Stack.Screen name="NewOrder" component={NewOrderScreen} options={{ title: "Nueva Orden" }} />  
      <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} options={{ title: "Detalle de Vehículo" }} />  
    </Stack.Navigator>  
  )  
}  
  
// Navegador de inventario  
const InventoryStack = () => {  
  return (  
    <Stack.Navigator  
      screenOptions={{  
        headerStyle: { backgroundColor: "#1a73e8" },  
        headerTintColor: "#fff",  
        headerTitleStyle: { fontWeight: "bold" },  
      }}  
    >  
      <Stack.Screen name="Inventory" component={InventoryScreen} options={{ title: "Inventario" }} />  
      <Stack.Screen name="InventoryItemDetail" component={InventoryItemDetailScreen} options={{ title: "Detalle de Artículo" }} />  
      <Stack.Screen name="NewInventoryItem" component={NewInventoryItemScreen} options={{ title: "Nuevo Artículo" }} />  
    </Stack.Navigator>  
  )  
}  
  
// Navegador de órdenes para técnicos  
const OrdersStack = () => {  
  return (  
    <Stack.Navigator  
      screenOptions={{  
        headerStyle: { backgroundColor: "#1a73e8" },  
        headerTintColor: "#fff",  
        headerTitleStyle: { fontWeight: "bold" },  
      }}  
    >  
      <Stack.Screen name="Kanban" component={KanbanScreen} options={{ title: "Órdenes de Trabajo" }} />  
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: "Detalle de Orden" }} />  
      <Stack.Screen name="UpdateOrder" component={UpdateOrderScreen} options={{ title: "Actualizar Orden" }} />  
      <Stack.Screen name="OrderParts" component={OrderPartsScreen} options={{ title: "Repuestos" }} />  
      <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} options={{ title: "Detalle de Vehículo" }} />  
      <Stack.Screen name="NewOrder" component={NewOrderScreen} options={{ title: "Nueva Orden" }} />  
    </Stack.Navigator>  
  )  
}  
  
// Navegador de órdenes para clientes  
const ClientOrdersStack = () => {  
  return (  
    <Stack.Navigator  
      screenOptions={{  
        headerStyle: { backgroundColor: "#1a73e8" },  
        headerTintColor: "#fff",  
        headerTitleStyle: { fontWeight: "bold" },  
      }}  
    >  
      <Stack.Screen name="ClientOrders" component={ClientOrdersScreen} options={{ title: "Mis Órdenes" }} />  
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: "Detalle de Orden" }} />  
    </Stack.Navigator>  
  )  
}  
  
// Navegador de vehículos para clientes  
const ClientVehiclesStack = () => {  
  return (  
    <Stack.Navigator  
      screenOptions={{  
        headerStyle: { backgroundColor: "#1a73e8" },  
        headerTintColor: "#fff",  
        headerTitleStyle: { fontWeight: "bold" },  
      }}  
    >  
      <Stack.Screen name="ClientVehicles" component={ClientVehicleScreen} options={{ title: "Mis Vehículos" }} />  
      <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} options={{ title: "Detalle de Vehículo" }} />  
      <Stack.Screen name="EditVehicle" component={EditVehicleScreen} options={{ title: "Editar Vehículo" }} />  
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: "Detalle de Orden" }} />  
      <Stack.Screen name="NewOrder" component={NewOrderScreen} options={{ title: "Nueva Orden" }} />  
    </Stack.Navigator>  
  )  
}  
  
// Navegador de citas  
const AppointmentsStack = () => {  
  return (  
    <Stack.Navigator  
      screenOptions={{  
        headerStyle: { backgroundColor: "#1a73e8" },  
        headerTintColor: "#fff",  
        headerTitleStyle: { fontWeight: "bold" },  
      }}  
    >  
      <Stack.Screen name="Appointments" component={AppointmentsScreen} options={{ title: "Citas" }} />  
      <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} options={{ title: "Detalle de Cita" }} />  
      <Stack.Screen name="NewAppointment" component={NewAppointmentScreen} options={{ title: "Nueva Cita" }} />  
    </Stack.Navigator>  
  )  
}  
  
// Navegador de reportes  
const ReportsStack = () => {  
  return (  
    <Stack.Navigator  
      screenOptions={{  
        headerStyle: { backgroundColor: "#1a73e8" },  
        headerTintColor: "#fff",  
        headerTitleStyle: { fontWeight: "bold" },  
      }}  
    >  
      <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: "Reportes" }} />  
    </Stack.Navigator>  
  )  
}  
  
// Navegador de perfil  
const ProfileStack = () => {  
  return (  
    <Stack.Navigator  
      screenOptions={{  
        headerStyle: { backgroundColor: "#1a73e8" },  
        headerTintColor: "#fff",  
        headerTitleStyle: { fontWeight: "bold" },  
      }}  
    >  
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Perfil" }} />  
    </Stack.Navigator>  
  )  
}  
  
// Navegador principal para técnicos  
const TechnicianTabNavigator = () => {  
  return (  
    <Tab.Navigator  
      screenOptions={({ route }) => ({  
        tabBarIcon: ({ color, size }) => {  
          let iconName: keyof typeof Feather.glyphMap  
          if (route.name === "Dashboard") {  
            iconName = "home"  
          } else if (route.name === "ClientsTab") {  
            iconName = "users"  
          } else if (route.name === "InventoryTab") {  
            iconName = "package"  
          } else if (route.name === "OrdersTab") {  
            iconName = "clipboard"  
          } else if (route.name === "AppointmentsTab") {  
            iconName = "calendar"  
          } else if (route.name === "ReportsTab") {  
            iconName = "bar-chart-2"  
          } else if (route.name === "ProfileTab") {  
            iconName = "user"  
          } else {  
            iconName = "home"  
          }  
          return <Feather name={iconName} size={size} color={color} />  
        },  
        tabBarActiveTintColor: "#1a73e8",  
        tabBarInactiveTintColor: "gray",  
        headerShown: false,  
      })}  
    >  
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Inicio" }} />  
      <Tab.Screen name="ClientsTab" component={ClientStack} options={{ title: "Clientes" }} />  
      <Tab.Screen name="InventoryTab" component={InventoryStack} options={{ title: "Inventario" }} />  
      <Tab.Screen name="OrdersTab" component={OrdersStack} options={{ title: "Órdenes" }} />  
      <Tab.Screen name="AppointmentsTab" component={AppointmentsStack} options={{ title: "Citas" }} />  
      <Tab.Screen name="ReportsTab" component={ReportsStack} options={{ title: "Reportes" }} />  
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: "Perfil" }} />  
    </Tab.Navigator>  
  )  
}  
  
// Navegador principal para clientes  
const ClientTabNavigator = () => {  
  return (  
    <Tab.Navigator  
      screenOptions={({ route }) => ({  
        tabBarIcon: ({ color, size }) => {  
          let iconName: keyof typeof Feather.glyphMap  
          if (route.name === "ClientDashboard") {  
            iconName = "home"  
          } else if (route.name === "ClientOrdersTab") {  
            iconName = "clipboard"  
          } else if (route.name === "ClientVehiclesTab") {  
            iconName = "truck"  
          } else if (route.name === "ProfileTab") {  
            iconName = "user"  
          } else {  
            iconName = "home"  
          }  
          return <Feather name={iconName} size={size} color={color} />  
        },  
        tabBarActiveTintColor: "#1a73e8",  
        tabBarInactiveTintColor: "gray",  
        headerShown: false,  
      })}  
    >  
      <Tab.Screen name="ClientDashboard" component={ClientDashboardScreen} options={{ title: "Inicio" }} />  
      <Tab.Screen name="ClientOrdersTab" component={ClientOrdersStack} options={{ title: "Mis Órdenes" }} />  
      <Tab.Screen name="ClientVehiclesTab" component={ClientVehiclesStack} options={{ title: "Mis Vehículos" }} />  
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: "Perfil" }} />  
    </Tab.Navigator>  
  )  
}  
  
// Navegador principal  
const AppNavigator = () => {  
  const { isAuthenticated, isLoading, user } = useAuth()  
  
  if (isLoading) {  
    return (  
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>  
        <ActivityIndicator size="large" color="#1a73e8" />  
        <Text style={{ marginTop: 16, fontSize: 16, color: "#666" }}>Cargando...</Text>  
      </View>  
    )  
  }  
  
  if (!isAuthenticated) {  
    return <AuthNavigator />  
  }  
  
  // Determinar qué navegador mostrar según el rol del usuario  
  if (user?.role === "client") {  
    return <ClientTabNavigator />  
  } else {  
    return <TechnicianTabNavigator />  
  }  
}  
  
export default AppNavigator