"use client"  
import { createStackNavigator } from "@react-navigation/stack"  
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"  
import { Feather } from "@expo/vector-icons"  
import { useAuth } from "../context/auth-context"  
import { ActivityIndicator, View, Text } from "react-native"  
  
console.log("🚀 AppNavigator - Iniciando importación de pantallas")  
  
// Pantallas existentes  
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
  
// Pantallas de citas  
import AppointmentsScreen from "../screens/appointments-screen"  
import NewAppointmentScreen from "../screens/new-appointment-screen"  
import AppointmentDetailScreen from "../screens/appointment-detail-screen"  
  
// Pantalla de edición de vehículos  
import EditVehicleScreen from "../screens/edit-vehicle-screen"  
  
console.log("✅ AppNavigator - Todas las pantallas importadas correctamente")  
  
const Stack = createStackNavigator()  
const Tab = createBottomTabNavigator()  
  
// Navegador de autenticación  
const AuthNavigator = () => {  
  console.log("🔐 AuthNavigator - Renderizando navegador de autenticación")  
  return (  
    <Stack.Navigator screenOptions={{ headerShown: false }}>  
      <Stack.Screen name="Login" component={LoginScreen} />  
    </Stack.Navigator>  
  )  
}  
  
// Navegador de clientes  
const ClientStack = () => {  
  console.log("👥 ClientStack - Renderizando stack de clientes")  
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
      <Stack.Screen name="EditVehicle" component={EditVehicleScreen} options={{ title: "Editar Vehículo" }} />  
      <Stack.Screen name="NewAppointment" component={NewAppointmentScreen} options={{ title: "Nueva Cita" }} />  
    </Stack.Navigator>  
  )  
}  
  
// Navegador de inventario  
const InventoryStack = () => {  
  console.log("📦 InventoryStack - Renderizando stack de inventario")  
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
  console.log("📋 OrdersStack - Renderizando stack de órdenes")  
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
      <Stack.Screen name="EditVehicle" component={EditVehicleScreen} options={{ title: "Editar Vehículo" }} />  
      <Stack.Screen name="NewOrder" component={NewOrderScreen} options={{ title: "Nueva Orden" }} />  
      <Stack.Screen name="NewAppointment" component={NewAppointmentScreen} options={{ title: "Nueva Cita" }} />  
    </Stack.Navigator>  
  )  
}  
  
// Navegador de órdenes para clientes  
const ClientOrdersStack = () => {  
  console.log("📄 ClientOrdersStack - Renderizando stack de órdenes de cliente")  
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
  console.log("🚗 ClientVehiclesStack - Renderizando stack de vehículos de cliente")  
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
      <Stack.Screen name="NewAppointment" component={NewAppointmentScreen} options={{ title: "Nueva Cita" }} />  
    </Stack.Navigator>  
  )  
}  
  
// ✅ NUEVO: Navegador de citas  
const AppointmentsStack = () => {  
  console.log("📅 AppointmentsStack - Renderizando stack de citas")  
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
  console.log("📊 ReportsStack - Renderizando stack de reportes")  
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
  console.log("👤 ProfileStack - Renderizando stack de perfil")  
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
  console.log("🔧 TechnicianTabNavigator - Renderizando navegador de técnico")  
  return (  
    <Tab.Navigator  
      screenOptions={({ route }) => ({  
        tabBarIcon: ({ color, size }) => {  
          let iconName: any  
  
          console.log(`🎯 TechnicianTabNavigator - Configurando icono para ruta: ${route.name}`)  
  
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
  console.log("👤 ClientTabNavigator - Renderizando navegador de cliente")  
  return (  
    <Tab.Navigator  
      screenOptions={({ route }) => ({  
        tabBarIcon: ({ color, size }) => {  
          let iconName: any  
  
          console.log(`🎯 ClientTabNavigator - Configurando icono para ruta: ${route.name}`)  
  
          if (route.name === "ClientDashboard") {  
            iconName = "home"  
          } else if (route.name === "ClientOrdersTab") {  
            iconName = "clipboard"  
          } else if (route.name === "ClientVehiclesTab") {  
            iconName = "truck"  
          } else if (route.name === "ProfileTab") {  
            iconName = "user"  
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
  
  console.log("🚀 AppNavigator - Estado de autenticación:", { isAuthenticated, isLoading, userRole: user?.role })  
  
  if (isLoading) {  
    console.log("⏳ AppNavigator - Mostrando pantalla de carga")  
    return (  
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>  
        <ActivityIndicator size="large" color="#1a73e8" />  
        <Text style={{ marginTop: 16, fontSize: 16, color: "#666" }}>Cargando...</Text>  
      </View>  
    )  
  }  
  
  if (!isAuthenticated) {  
    console.log("🔐 AppNavigator - Usuario no autenticado, mostrando AuthNavigator")  
    return <AuthNavigator />  
  }  
  
  // Determinar qué navegador mostrar según el rol del usuario  
  if (user?.role === "client") {  
    console.log("👤 AppNavigator - Usuario es cliente, mostrando ClientTabNavigator")  
    return <ClientTabNavigator />  
  } else {  
    console.log("🔧 AppNavigator - Usuario es staff, mostrando TechnicianTabNavigator")  
    return <TechnicianTabNavigator />  
  }  
}  
  
export default AppNavigator