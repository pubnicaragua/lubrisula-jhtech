import React from 'react'  
import { createStackNavigator } from '@react-navigation/stack'  
import { NavigationContainer } from '@react-navigation/native'  
  
// Importar tipos  
import { RootStackParamList } from '../types/navigation'  
  
// Importar pantallas  
import DashboardScreen from '../screens/dashboard-screen'  
import OrdersScreen from '../screens/orders-screen'  
import OrderDetailScreen from '../screens/order-detail-screen'  
import NewOrderScreen from '../screens/new-order-screen'  
import UpdateOrderScreen from '../screens/update-order-screen'  
import OrderHistoryScreen from '../screens/order-history-screen'  
import ClientsScreen from '../screens/clients-screen'  
import ClientDetailScreen from '../screens/client-detail-screen'  
import NewClientScreen from '../screens/new-client-screen'  
import VehicleDetailScreen from '../screens/vehicle-detail-screen'  
import NewVehicleScreen from '../screens/new-vehicle-screen'  
import InventoryScreen from '../screens/inventory-screen'  
import InventoryItemDetailScreen from '../screens/inventory-item-detail-screen'  
import NewInventoryItemScreen from '../screens/new-inventory-item-screen'  
import ReportsScreen from '../screens/reports-screen'  
import AnalyticsScreen from '../screens/analytics-screen'  
import FinancialReportsScreen from '../screens/financial-reports-screen'  
import ProfileScreen from '../screens/profile-screen'  
import SettingsScreen from '../screens/settings-screen'  
import ChangePasswordScreen from '../screens/change-password-screen'  
import ServiceSelectionScreen from '../screens/service-selection-screen'  
import PartSelectionScreen from '../screens/part-selection-screen'  
import KanbanScreen from '../screens/kanban-screen'  
import NotificationsScreen from '../screens/notifications-screen'  
import HelpScreen from '../screens/help-screen'  
import AboutScreen from '../screens/about-screen'  
  
const Stack = createStackNavigator<RootStackParamList>()  
  
export default function AppNavigator() {  
  return (  
    <NavigationContainer>  
      <Stack.Navigator  
        initialRouteName="Dashboard"  
        screenOptions={{  
          headerStyle: {  
            backgroundColor: '#1a73e8',  
          },  
          headerTintColor: '#fff',  
          headerTitleStyle: {  
            fontWeight: 'bold',  
          },  
        }}  
      >  
        {/* Dashboard */}  
        <Stack.Screen   
          name="Dashboard"   
          component={DashboardScreen}   
          options={{ title: "Dashboard" }}   
        />  
          
        {/* Órdenes */}  
        <Stack.Screen   
          name="Orders"   
          component={OrdersScreen}   
          options={{ title: "Órdenes" }}   
        />  
        <Stack.Screen   
          name="OrderDetail"   
          component={OrderDetailScreen}   
          options={{ title: "Detalle de Orden" }}   
        />  
        <Stack.Screen   
          name="NewOrder"   
          component={NewOrderScreen}   
          options={{ title: "Nueva Orden" }}   
        />  
        <Stack.Screen   
          name="UpdateOrder"   
          component={UpdateOrderScreen}   
          options={{ title: "Editar Orden" }}   
        />  
        <Stack.Screen   
          name="OrderHistory"   
          component={OrderHistoryScreen}   
          options={{ title: "Historial de Órdenes" }}   
        />  
          
        {/* Clientes */}  
        <Stack.Screen   
          name="Clients"   
          component={ClientsScreen}   
          options={{ title: "Clientes" }}   
        />  
        <Stack.Screen   
          name="ClientDetail"   
          component={ClientDetailScreen}   
          options={{ title: "Detalle del Cliente" }}   
        />  
        <Stack.Screen   
          name="NewClient"   
          component={NewClientScreen}   
          options={{ title: "Nuevo Cliente" }}   
        />  
          
        {/* Vehículos */}  
        <Stack.Screen   
          name="VehicleDetail"   
          component={VehicleDetailScreen}   
          options={{ title: "Detalle del Vehículo" }}   
        />  
        <Stack.Screen   
          name="NewVehicle"   
          component={NewVehicleScreen}   
          options={{ title: "Nuevo Vehículo" }}   
        />  
          
        {/* Inventario */}  
        <Stack.Screen   
          name="Inventory"   
          component={InventoryScreen}   
          options={{ title: "Inventario" }}   
        />  
        <Stack.Screen   
          name="InventoryItemDetail"   
          component={InventoryItemDetailScreen}   
          options={{ title: "Detalle del Artículo" }}   
        />  
        <Stack.Screen   
          name="NewInventoryItem"   
          component={NewInventoryItemScreen}   
          options={{ title: "Nuevo Artículo" }}   
        />  
          
        {/* Reportes */}  
        <Stack.Screen   
          name="Reports"   
          component={ReportsScreen}   
          options={{ title: "Reportes" }}   
        />  
        <Stack.Screen   
          name="Analytics"   
          component={AnalyticsScreen}   
          options={{ title: "Analíticas" }}   
        />  
        <Stack.Screen   
          name="FinancialReports"   
          component={FinancialReportsScreen}   
          options={{ title: "Reportes Financieros" }}   
        />  
          
        {/* Perfil */}  
        <Stack.Screen   
          name="Profile"   
          component={ProfileScreen}   
          options={{ title: "Perfil" }}   
        />  
        <Stack.Screen   
          name="Settings"   
          component={SettingsScreen}   
          options={{ title: "Configuraciones" }}   
        />  
        <Stack.Screen   
          name="ChangePassword"   
          component={ChangePasswordScreen}   
          options={{ title: "Cambiar Contraseña" }}   
        />  
          
        {/* Selección */}  
        <Stack.Screen   
          name="ServiceSelection"   
          component={ServiceSelectionScreen}   
          options={{ title: "Seleccionar Servicios" }}   
        />  
        <Stack.Screen   
          name="PartSelection"   
          component={PartSelectionScreen}   
          options={{ title: "Seleccionar Repuestos" }}   
        />  
          
        {/* Kanban */}  
        <Stack.Screen   
          name="Kanban"   
          component={KanbanScreen}   
          options={{ title: "Tablero Kanban" }}   
        />  
          
        {/* Otras pantallas */}  
        <Stack.Screen   
          name="Notifications"   
          component={NotificationsScreen}   
          options={{ title: "Notificaciones" }}   
        />  
        <Stack.Screen   
          name="Help"   
          component={HelpScreen}   
          options={{ title: "Ayuda" }}   
        />  
        <Stack.Screen   
          name="About"   
          component={AboutScreen}   
          options={{ title: "Acerca de" }}   
        />  
      </Stack.Navigator>  
    </NavigationContainer>  
  )  
}