"use client"  
  
import { useState, useCallback } from "react"  
import {  
  View,  
  Text,  
  ScrollView,  
  TouchableOpacity,  
  StyleSheet,  
  ActivityIndicator,  
  RefreshControl,  
  Alert,  
} from "react-native"  
import { Feather, MaterialIcons } from "@expo/vector-icons"  
import { useFocusEffect } from "@react-navigation/native"  
import { StackNavigationProp } from '@react-navigation/stack'  
import { useAuth } from "../context/auth-context"  
import { orderService } from "../services/supabase/order-service"  
import { clientService } from "../services/supabase/client-service"  
import { vehicleService } from "../services/supabase/vehicle-service"  
import ACCESOS_SERVICES from "../services/supabase/access-service"  
import USER_SERVICE from "../services/supabase/user-service"  
import { RootStackParamList } from '../types/navigation'  
import { Order } from '../types/order'  
import { Client } from '../types/client'  
import { Vehicle } from '../types/vehicle'  
  
type ClientDashboardNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>  
  
interface Props {  
  navigation: ClientDashboardNavigationProp  
}  
  
interface DashboardData {  
  orders: Order[]  
  recentOrders: Order[]  
  vehicles: Vehicle[]  
  clientInfo: Client | null  
  stats: {  
    totalOrders: number  
    pendingOrders: number  
    completedOrders: number  
    totalVehicles: number  
  }  
}  
  
export default function ClientDashboardScreen({ navigation }: Props) {  
  const { user } = useAuth()  
  const [loading, setLoading] = useState(true)  
  const [refreshing, setRefreshing] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)  
  
  const loadDashboardData = useCallback(async () => {  
    try {  
      setLoading(true)  
      setError(null)  
  
      if (!user?.id) return  
  
      // Validar permisos del usuario  
      const userId = user.id as string  
      const userTallerId = await USER_SERVICE.GET_TALLER_ID(userId)  
        
      if (!userTallerId) {  
        setError("No se pudo obtener la información del taller")  
        return  
      }  
        
      const userPermissions = await ACCESOS_SERVICES.GET_PERMISOS_USUARIO(userId, userTallerId)  
      setUserRole(userPermissions?.rol || 'client')  
  
      // Cargar datos según el rol  
      let clientInfo: Client | null = null  
      let orders: Order[] = []  
      let vehicles: Vehicle[] = []  
  
      if (userPermissions?.rol === 'client') {  
        // Cliente: solo sus datos  
        clientInfo = await clientService.getClientByUserId(userId)  
        if (clientInfo) {  
          orders = await orderService.getOrdersByClientId(clientInfo.id)  
          vehicles = await vehicleService.getVehiclesByClientId(clientInfo.id)  
        }  
      } else {  
        // Staff: datos generales del taller  
        orders = await orderService.getAllOrders()  
        vehicles = await vehicleService.getAllVehicles()  
      }  
  
      // Procesar estadísticas  
      const stats = {  
        totalOrders: orders.length,  
        pendingOrders: orders.filter(order =>   
          order.status === 'reception' ||   
          order.status === 'diagnosis' ||   
          order.status === 'in_progress'  
        ).length,  
        completedOrders: orders.filter(order =>   
          order.status === 'completed' ||   
          order.status === 'delivered'  
        ).length,  
        totalVehicles: vehicles.length  
      }  
  
      // Órdenes recientes (últimas 5)  
      const recentOrders = orders  
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())  
        .slice(0, 5)  
  
      setDashboardData({  
        orders,  
        recentOrders,  
        vehicles,  
        clientInfo,  
        stats  
      })  
  
    } catch (error) {  
      console.error("Error loading dashboard data:", error)  
      setError("No se pudieron cargar los datos del dashboard")  
    } finally {  
      setLoading(false)  
      setRefreshing(false)  
    }  
  }, [user])  
  
  useFocusEffect(  
    useCallback(() => {  
      loadDashboardData()  
    }, [loadDashboardData])  
  )  
  
  const onRefresh = () => {  
    setRefreshing(true)  
    loadDashboardData()  
  }  
  
  const getStatusColor = (status: string) => {  
    switch (status) {  
      case 'reception': return '#ff9800'  
      case 'diagnosis': return '#2196f3'  
      case 'waiting_parts': return '#9c27b0'  
      case 'in_progress': return '#ff5722'  
      case 'quality_check': return '#607d8b'  
      case 'completed': return '#4caf50'  
      case 'delivered': return '#8bc34a'  
      case 'cancelled': return '#f44336'  
      default: return '#666'  
    }  
  }  
  
  const getStatusText = (status: string) => {  
    switch (status) {  
      case 'reception': return 'Recepción'  
      case 'diagnosis': return 'Diagnóstico'  
      case 'waiting_parts': return 'Esperando Repuestos'  
      case 'in_progress': return 'En Proceso'  
      case 'quality_check': return 'Control de Calidad'  
      case 'completed': return 'Completada'  
      case 'delivered': return 'Entregada'  
      case 'cancelled': return 'Cancelada'  
      default: return status  
    }  
  }  
  
  const formatCurrency = (amount: number) => {  
    return amount.toLocaleString("es-ES", {  
      style: "currency",  
      currency: "USD",  
      minimumFractionDigits: 0,  
      maximumFractionDigits: 0,  
    })  
  }  
  
  const renderStatCard = (title: string, value: string | number, icon: string, color: string) => (  
    <View style={[styles.statCard, { borderLeftColor: color }]}>  
      <View style={styles.statHeader}>  
        <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>  
          <Feather name={icon as any} size={20} color={color} />  
        </View>  
        <Text style={styles.statTitle}>{title}</Text>  
      </View>  
      <Text style={styles.statValue}>{value}</Text>  
    </View>  
  )  
  
  const renderOrderCard = (order: Order) => (  
    <TouchableOpacity  
      key={order.id}  
      style={styles.orderCard}  
      onPress={() => navigation.navigate("OrderDetail", { orderId: order.id })}  
    >  
      <View style={styles.orderHeader}>  
        <Text style={styles.orderNumber}>#{order.orderNumber || order.id.slice(0, 8)}</Text>  
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>  
          <Text style={styles.statusText}>{getStatusText(order.status)}</Text>  
        </View>  
      </View>  
        
      <Text style={styles.orderDescription} numberOfLines={2}>  
        {order.description || 'Sin descripción'}  
      </Text>  
        
      <View style={styles.orderFooter}>  
        <Text style={styles.orderDate}>  
          {new Date(order.created_at).toLocaleDateString('es-ES')}  
        </Text>  
        {order.total && (  
          <Text style={styles.orderTotal}>  
            {formatCurrency(order.total)}  
          </Text>  
        )}  
      </View>  
    </TouchableOpacity>  
  )  
  
  if (loading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#1a73e8" />  
        <Text style={styles.loadingText}>Cargando dashboard...</Text>  
      </View>  
    )  
  }  
  
  if (error) {  
    return (  
      <View style={styles.errorContainer}>  
        <MaterialIcons name="error" size={64} color="#f44336" />  
        <Text style={styles.errorText}>{error}</Text>  
        <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>  
          <Text style={styles.retryButtonText}>Reintentar</Text>  
        </TouchableOpacity>  
      </View>  
    )  
  }  
  
  if (!dashboardData) return null  
  
  return (  
    <ScrollView   
      style={styles.container}  
      refreshControl={  
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />  
      }  
    >  
      {/* Header de bienvenida */}  
      <View style={styles.header}>  
        <Text style={styles.welcomeText}>  
          {userRole === 'client'   
            ? `Bienvenido, ${dashboardData.clientInfo?.name || 'Cliente'}`  
            : 'Dashboard del Taller'  
          }  
        </Text>  
        <Text style={styles.dateText}>  
          {new Date().toLocaleDateString('es-ES', {   
            weekday: 'long',   
            year: 'numeric',   
            month: 'long',   
            day: 'numeric'   
          })}  
        </Text>  
      </View>  
  
      {/* Estadísticas */}  
      <View style={styles.statsContainer}>  
        {renderStatCard(  
          "Total Órdenes",  
          dashboardData.stats.totalOrders,  
          "clipboard",  
          "#1a73e8"  
        )}  
          
        {renderStatCard(  
          "Pendientes",  
          dashboardData.stats.pendingOrders,  
          "clock",  
          "#ff9800"  
        )}  
          
        {renderStatCard(  
          "Completadas",  
          dashboardData.stats.completedOrders,  
          "check-circle",  
          "#4caf50"  
        )}  
          
        {renderStatCard(  
          "Vehículos",  
          dashboardData.stats.totalVehicles,  
          "truck",  
          "#9c27b0"  
        )}  
      </View>  
  
      {/* Órdenes recientes */}  
      <View style={styles.section}>  
        <View style={styles.sectionHeader}>  
          <Text style={styles.sectionTitle}>Órdenes Recientes</Text>  
          <TouchableOpacity onPress={() => navigation.navigate("Orders")}>  
            <Text style={styles.seeAllText}>Ver todas</Text>  
          </TouchableOpacity>  
        </View>  
  
        {dashboardData.recentOrders.length > 0 ? (  
          dashboardData.recentOrders.map(renderOrderCard)  
        ) : (  
          <View style={styles.emptyState}>  
            <Feather name="clipboard" size={48} color="#ccc" />  
            <Text style={styles.emptyText}>No hay órdenes recientes</Text>  
          </View>  
        )}  
      </View>  
  
      {/* Acciones rápidas */}  
      <View style={styles.section}>  
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>  
          
        <View style={styles.quickActions}>  
        {userRole !== 'client' && (  
            <TouchableOpacity  
              style={styles.quickActionCard}  
              onPress={() => navigation.navigate("NewOrder")}  
            >  
              <View style={[styles.quickActionIcon, { backgroundColor: "#e8f0fe" }]}>  
                <Feather name="plus-circle" size={24} color="#1a73e8" />  
              </View>  
              <Text style={styles.quickActionTitle}>Nueva Orden</Text>  
              <Text style={styles.quickActionSubtitle}>Crear orden de trabajo</Text>  
            </TouchableOpacity>  
          )}  
  
          <TouchableOpacity  
            style={styles.quickActionCard}  
            onPress={() => navigation.navigate("Orders")}  
          >  
            <View style={[styles.quickActionIcon, { backgroundColor: "#fff3e0" }]}>  
              <Feather name="clipboard" size={24} color="#ff9800" />  
            </View>  
            <Text style={styles.quickActionTitle}>Ver Órdenes</Text>  
            <Text style={styles.quickActionSubtitle}>Gestionar órdenes</Text>  
          </TouchableOpacity>  
  
          {userRole !== 'client' && (  
            <TouchableOpacity  
              style={styles.quickActionCard}  
              onPress={() => navigation.navigate("Inventory")}  
            >  
              <View style={[styles.quickActionIcon, { backgroundColor: "#e8f5e9" }]}>  
                <Feather name="package" size={24} color="#4caf50" />  
              </View>  
              <Text style={styles.quickActionTitle}>Inventario</Text>  
              <Text style={styles.quickActionSubtitle}>Gestionar stock</Text>  
            </TouchableOpacity>  
          )}  
  
          <TouchableOpacity  
            style={styles.quickActionCard}  
            onPress={() => navigation.navigate("Profile")}  
          >  
            <View style={[styles.quickActionIcon, { backgroundColor: "#f3e5f5" }]}>  
              <Feather name="user" size={24} color="#9c27b0" />  
            </View>  
            <Text style={styles.quickActionTitle}>Perfil</Text>  
            <Text style={styles.quickActionSubtitle}>Configuración</Text>  
          </TouchableOpacity>  
        </View>  
      </View>  
    </ScrollView>  
  )  
}  
  
const styles = StyleSheet.create({  
  container: {  
    flex: 1,  
    backgroundColor: "#f8f9fa",  
  },  
  loadingContainer: {  
    flex: 1,  
    justifyContent: "center",  
    alignItems: "center",  
    backgroundColor: "#f8f9fa",  
  },  
  loadingText: {  
    marginTop: 10,  
    fontSize: 16,  
    color: "#666",  
  },  
  errorContainer: {  
    flex: 1,  
    justifyContent: "center",  
    alignItems: "center",  
    padding: 20,  
  },  
  errorText: {  
    fontSize: 16,  
    color: "#f44336",  
    textAlign: "center",  
    marginTop: 16,  
    marginBottom: 20,  
  },  
  retryButton: {  
    backgroundColor: "#1a73e8",  
    paddingHorizontal: 20,  
    paddingVertical: 10,  
    borderRadius: 8,  
  },  
  retryButtonText: {  
    color: "#fff",  
    fontWeight: "bold",  
  },  
  header: {  
    backgroundColor: "#fff",  
    padding: 20,  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  welcomeText: {  
    fontSize: 24,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 4,  
  },  
  dateText: {  
    fontSize: 14,  
    color: "#666",  
    textTransform: "capitalize",  
  },  
  statsContainer: {  
    flexDirection: "row",  
    flexWrap: "wrap",  
    padding: 16,  
    gap: 12,  
  },  
  statCard: {  
    backgroundColor: "#fff",  
    borderRadius: 8,  
    padding: 16,  
    width: "48%",  
    borderLeftWidth: 4,  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 1 },  
    shadowOpacity: 0.1,  
    shadowRadius: 2,  
    elevation: 2,  
  },  
  statHeader: {  
    flexDirection: "row",  
    alignItems: "center",  
    marginBottom: 8,  
  },  
  statIcon: {  
    width: 32,  
    height: 32,  
    borderRadius: 16,  
    justifyContent: "center",  
    alignItems: "center",  
    marginRight: 8,  
  },  
  statTitle: {  
    fontSize: 14,  
    color: "#666",  
    fontWeight: "500",  
  },  
  statValue: {  
    fontSize: 24,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  section: {  
    backgroundColor: "#fff",  
    margin: 16,  
    borderRadius: 8,  
    padding: 16,  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 1 },  
    shadowOpacity: 0.1,  
    shadowRadius: 2,  
    elevation: 2,  
  },  
  sectionHeader: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    marginBottom: 16,  
  },  
  sectionTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  seeAllText: {  
    fontSize: 14,  
    color: "#1a73e8",  
    fontWeight: "500",  
  },  
  orderCard: {  
    backgroundColor: "#f8f9fa",  
    borderRadius: 8,  
    padding: 12,  
    marginBottom: 8,  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  orderHeader: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    marginBottom: 8,  
  },  
  orderNumber: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  statusBadge: {  
    paddingHorizontal: 8,  
    paddingVertical: 4,  
    borderRadius: 12,  
  },  
  statusText: {  
    fontSize: 12,  
    color: "#fff",  
    fontWeight: "bold",  
  },  
  orderDescription: {  
    fontSize: 14,  
    color: "#666",  
    marginBottom: 8,  
    lineHeight: 20,  
  },  
  orderFooter: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
  },  
  orderDate: {  
    fontSize: 12,  
    color: "#999",  
  },  
  orderTotal: {  
    fontSize: 14,  
    fontWeight: "bold",  
    color: "#4caf50",  
  },  
  emptyState: {  
    alignItems: "center",  
    padding: 20,  
  },  
  emptyText: {  
    fontSize: 16,  
    color: "#999",  
    marginTop: 8,  
    textAlign: "center",  
  },  
  quickActions: {  
    flexDirection: "row",  
    flexWrap: "wrap",  
    gap: 12,  
  },  
  quickActionCard: {  
    backgroundColor: "#f8f9fa",  
    borderRadius: 8,  
    padding: 16,  
    width: "48%",  
    alignItems: "center",  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  quickActionIcon: {  
    width: 48,  
    height: 48,  
    borderRadius: 24,  
    justifyContent: "center",  
    alignItems: "center",  
    marginBottom: 8,  
  },  
  quickActionTitle: {  
    fontSize: 14,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 2,  
  },  
  quickActionSubtitle: {  
    fontSize: 12,  
    color: "#666",  
    textAlign: "center",  
  },  
})