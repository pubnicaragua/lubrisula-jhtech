"use client"  
  
import { useState, useCallback, useEffect } from "react"  
import {  
  View,  
  Text,  
  ScrollView,  
  TouchableOpacity,  
  StyleSheet,  
  RefreshControl,  
  Image,  
  Alert,  
  ActivityIndicator,  
} from "react-native"  
import { Feather } from "@expo/vector-icons"  
import { useFocusEffect } from "@react-navigation/native"  
import { useAuth } from "../context/auth-context"  
// ✅ CORREGIDO: Importar tipos centralizados  
import { Client, Vehicle, EnhancedVehicle } from "../types"  
import { clientService } from "../services/supabase/client-service"  
import { vehicleService } from "../services/supabase/vehicle-service"  
import { orderService } from "../services/supabase/order-service"  
import { CITAS_SERVICES } from "../services/supabase/citas-services"  
import { Order } from '../types/order'  
  
// ✅ CORREGIDO: Tipos TypeScript actualizados  
interface ClientDashboardScreenProps {  
  navigation: any  
}  
  
interface AppointmentType {  
  id: string  
  client_id: string  
  vehiculo_id: string  
  fecha: string  
  hora: string  
  tipo_servicio: string  
  estado: string  
}  
  
interface StatsType {  
  totalVehicles: number  
  activeOrders: number  
  completedOrders: number  
  upcomingServices: number  
}  
  
export default function ClientDashboardScreen({ navigation }: ClientDashboardScreenProps) {  
  const { user } = useAuth()  
    
  // ✅ CORREGIDO: Usar tipos centralizados  
  const [client, setClient] = useState<Client | null>(null)  
  const [vehicles, setVehicles] = useState<EnhancedVehicle[]>([])  
  const [orders, setOrders] = useState<Order[]>([])  
  const [appointments, setAppointments] = useState<AppointmentType[]>([])  
  const [stats, setStats] = useState<StatsType>({  
    totalVehicles: 0,  
    activeOrders: 0,  
    completedOrders: 0,  
    upcomingServices: 0  
  })  
  const [loading, setLoading] = useState(true)  
  const [refreshing, setRefreshing] = useState(false)  
  const [upcomingServices, setUpcomingServices] = useState<Vehicle[]>([])  
  const [recentOrders, setRecentOrders] = useState<Order[]>([])  
  
  const loadData = useCallback(async () => {  
    if (!user?.id) return  
  
    try {  
      setLoading(true)  
        
      // ✅ CORREGIDO: Usar servicios centralizados  
      const [clientData, vehiclesData, ordersData, appointmentsData] = await Promise.all([  
        clientService.getClientByUserId(user.id),  
        vehicleService.getEnhancedVehicles({ client_id: user.id }),  
        orderService.getAllOrders(),  
        CITAS_SERVICES.GET_ALL_CITAS_PROGRAMADAS_RECIENTES()  
      ])  
  
      setClient(clientData)  
      setVehicles(vehiclesData)  
  
      // Filtrar órdenes del cliente  
      const clientOrders = ordersData.filter(order => order.clientId === user.id)  
      setOrders(clientOrders)  
  
      // Filtrar citas del cliente  
      const clientAppointments = appointmentsData.filter(apt => apt.client_id === user.id)  
      setAppointments(clientAppointments)  
  
      // Calcular estadísticas  
      const activeOrders = clientOrders.filter(order =>  
        order.status !== "completed" && order.status !== "delivered" && order.status !== "cancelled"  
      ).length  
  
      const completedOrders = clientOrders.filter(order =>  
        order.status === "completed" || order.status === "delivered"  
      ).length  
  
      // Calcular servicios próximos (vehículos con mantenimiento debido en 30 días)  
      const upcomingServices = vehiclesData.filter(vehicle => {  
        if (!vehicle.next_service_date) return false  
        const nextServiceDate = new Date(vehicle.next_service_date)  
        const now = new Date()  
        const daysUntilService = Math.ceil((nextServiceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))  
        return daysUntilService <= 30 && daysUntilService >= 0  
      }).length  
  
      setStats({  
        totalVehicles: vehiclesData.length,  
        activeOrders,  
        completedOrders,  
        upcomingServices  
      })  
  
      // Preparar datos para servicios próximos  
      const upcomingServicesData = vehiclesData.filter(vehicle => {  
        if (!vehicle.next_service_date) return false  
        const nextServiceDate = new Date(vehicle.next_service_date)  
        const now = new Date()  
        const daysUntilService = Math.ceil((nextServiceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))  
        return daysUntilService <= 30 && daysUntilService >= 0  
      }).map(vehicle => {  
        const nextServiceDate = new Date(vehicle.next_service_date!)  
        const now = new Date()  
        const daysUntilService = Math.ceil((nextServiceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))  
        return {  
          ...vehicle,  
          daysToService: daysUntilService,  
          mainImage: vehicle.images && vehicle.images.length > 0 ? vehicle.images[0].uri : null,  
        }  
      })  
  
      upcomingServicesData.sort((a: any, b: any) => a.daysToService - b.daysToService)  
      setUpcomingServices(upcomingServicesData)  
  
      // Preparar datos para órdenes recientes  
      const recentOrdersData = clientOrders  
        .sort((a: Order, b: Order) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())  
        .slice(0, 3)  
        .map((order: Order) => {  
          const vehicle = vehiclesData.find((v: Vehicle) => v.id === order.vehicleId)  
          return {  
            ...order,  
            // ✅ CORREGIDO: Usar campos reales del schema de vehículos  
            vehicleInfo: vehicle ? `${vehicle.marca} ${vehicle.modelo} (${vehicle.ano})` : "Vehículo no encontrado",  
            statusColor: getStatusColor(order.status),  
            statusText: getStatusText(order.status),  
            formattedDate: new Date(order.created_at).toLocaleDateString("es-ES"),  
            formattedTotal: formatCurrency(order.total || 0),  
          }  
        })  
  
      setRecentOrders(recentOrdersData)  
  
    } catch (error) {  
      console.error('Error loading dashboard data:', error)  
      Alert.alert('Error', 'No se pudieron cargar los datos del dashboard')  
    } finally {  
      setLoading(false)  
    }  
  }, [user?.id])  
  
  useFocusEffect(  
    useCallback(() => {  
      loadData()  
    }, [loadData])  
  )  
  
  // Función para obtener texto según estado  
  const getStatusText = (estado: string) => {  
    switch (estado) {  
      case "reception": return "Recepción"  
      case "diagnosis": return "Diagnóstico"  
      case "waiting_parts": return "Esperando Repuestos"  
      case "in_progress": return "En Proceso"  
      case "quality_check": return "Control de Calidad"  
      case "completed": return "Completada"  
      case "delivered": return "Entregada"  
      case "cancelled": return "Cancelada"  
      default: return "Desconocido"  
    }  
  }  
  
  // Función para obtener color según estado  
  const getStatusColor = (estado: string) => {  
    switch (estado) {  
      case "reception": return "#1a73e8"  
      case "diagnosis": return "#9c27b0"  
      case "waiting_parts": return "#ff9800"  
      case "in_progress": return "#4caf50"  
      case "quality_check": return "#2196f3"  
      case "completed": return "#607d8b"  
      case "delivered": return "#4caf50"  
      case "cancelled": return "#f44336"  
      default: return "#666"  
    }  
  }  
  
  // Formatear moneda  
  const formatCurrency = (amount: number, currencyCode = "USD") => {  
    return amount.toLocaleString("es-ES", {  
      style: "currency",  
      currency: currencyCode,  
      minimumFractionDigits: 2,  
    })  
  }  
  
  const onRefresh = async () => {  
    setRefreshing(true)  
    await loadData()  
    setRefreshing(false)  
  }  
  
  if (loading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#1a73e8" />  
        <Text style={styles.loadingText}>Cargando datos...</Text>  
      </View>  
    )  
  }  
  
  return (  
    <ScrollView  
      style={styles.container}  
      refreshControl={  
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1a73e8"]} />  
      }  
    >  
      <View style={styles.header}>  
        <Image  
          source={{ uri: "https://images.pexels.com/photos/3785927/pexels-photo-3785927.jpeg" }}  
          style={styles.logo}  
          resizeMode="contain"  
        />  
        <Text style={styles.welcomeText}>Bienvenido, {client?.name || "Cliente"}</Text>  
        <Text style={styles.dateText}>  
          {new Date().toLocaleDateString("es-ES", {  
            weekday: "long",  
            year: "numeric",  
            month: "long",  
            day: "numeric",  
          })}  
        </Text>  
      </View>  
  
      <View style={styles.statsContainer}>  
        <View style={styles.statCard}>  
          <View style={styles.statIconContainer}>  
            <Feather name="truck" size={24} color="#1a73e8" />  
          </View>  
          <View style={styles.statContent}>  
          <Text style={styles.statValue}>{stats.totalVehicles}</Text>  
            <Text style={styles.statLabel}>Vehículos</Text>  
          </View>  
        </View>  
  
        <View style={styles.statCard}>  
          <View style={styles.statIconContainer}>  
            <Feather name="clock" size={24} color="#f5a623" />  
          </View>  
          <View style={styles.statContent}>  
            <Text style={styles.statValue}>{stats.activeOrders}</Text>  
            <Text style={styles.statLabel}>Órdenes Activas</Text>  
          </View>  
        </View>  
  
        <View style={styles.statCard}>  
          <View style={styles.statIconContainer}>  
            <Feather name="check-circle" size={24} color="#4caf50" />  
          </View>  
          <View style={styles.statContent}>  
            <Text style={styles.statValue}>{stats.completedOrders}</Text>  
            <Text style={styles.statLabel}>Servicios Completados</Text>  
          </View>  
        </View>  
  
        <View style={styles.statCard}>  
          <View style={styles.statIconContainer}>  
            <Feather name="calendar" size={24} color="#9c27b0" />  
          </View>  
          <View style={styles.statContent}>  
            <Text style={styles.statValue}>{stats.upcomingServices}</Text>  
            <Text style={styles.statLabel}>Servicios Próximos</Text>  
          </View>  
        </View>  
      </View>  
  
      {/* Servicios próximos */}  
      <View style={styles.sectionContainer}>  
        <View style={styles.sectionHeader}>  
          <Text style={styles.sectionTitle}>Servicios Próximos</Text>  
          <TouchableOpacity onPress={() => navigation.navigate("ClientVehiclesTab")}>  
            <Text style={styles.seeAllText}>Ver todos</Text>  
          </TouchableOpacity>  
        </View>  
  
        {upcomingServices.length > 0 ? (  
          upcomingServices.map((vehicle: any) => (  
            <TouchableOpacity  
              key={vehicle.id}  
              style={styles.upcomingServiceCard}  
              onPress={() => navigation.navigate("VehicleDetail", { vehicleId: vehicle.id })}  
            >  
              <View style={styles.serviceCardContent}>  
                {vehicle.mainImage ? (  
                  <Image source={{ uri: vehicle.mainImage }} style={styles.vehicleImage} />  
                ) : (  
                  <View style={styles.noImageContainer}>  
                    <Feather name="truck" size={24} color="#ccc" />  
                  </View>  
                )}  
  
                <View style={styles.serviceInfo}>  
                  {/* ✅ CORREGIDO: Usar campos reales del schema */}  
                  <Text style={styles.vehicleName}>  
                    {vehicle.marca} {vehicle.modelo}  
                  </Text>  
                  <Text style={styles.vehicleDetails}>  
                    {vehicle.ano} • {vehicle.placa}  
                  </Text>  
  
                  <View style={styles.serviceDateContainer}>  
                    <Feather name="calendar" size={14} color={vehicle.daysToService <= 7 ? "#e53935" : "#f5a623"} />  
                    <Text  
                      style={[styles.serviceDateText, { color: vehicle.daysToService <= 7 ? "#e53935" : "#f5a623" }]}  
                    >  
                      {vehicle.daysToService === 0  
                        ? "¡Servicio hoy!"  
                        : vehicle.daysToService === 1  
                          ? "¡Servicio mañana!"  
                          : `Servicio en ${vehicle.daysToService} días`}  
                    </Text>  
                  </View>  
                </View>  
  
                <Feather name="chevron-right" size={20} color="#999" />  
              </View>  
            </TouchableOpacity>  
          ))  
        ) : (  
          <View style={styles.emptySection}>  
            <Text style={styles.emptyText}>No hay servicios próximos programados</Text>  
          </View>  
        )}  
      </View>  
  
      {/* Órdenes recientes */}  
      <View style={styles.sectionContainer}>  
        <View style={styles.sectionHeader}>  
          <Text style={styles.sectionTitle}>Órdenes Recientes</Text>  
          <TouchableOpacity onPress={() => navigation.navigate("ClientOrdersTab")}>  
            <Text style={styles.seeAllText}>Ver todas</Text>  
          </TouchableOpacity>  
        </View>  
  
        {recentOrders.length > 0 ? (  
          recentOrders.map((order: any) => (  
            <TouchableOpacity  
              key={order.id}  
              style={styles.orderCard}  
              onPress={() => navigation.navigate("OrderDetail", { orderId: order.id })}  
            >  
              <View style={styles.orderHeader}>  
                <Text style={styles.orderNumber}>Orden #{order.number || order.id.slice(0, 8)}</Text>  
                <View style={[styles.statusBadge, { backgroundColor: order.statusColor }]}>  
                  <Text style={styles.statusText}>{order.statusText}</Text>  
                </View>  
              </View>  
  
              <Text style={styles.orderDescription} numberOfLines={2}>  
                {order.description || "Sin descripción"}  
              </Text>  
  
              <View style={styles.orderFooter}>  
                <Text style={styles.orderDate}>{order.formattedDate}</Text>  
                <Text style={styles.orderAmount}>{order.formattedTotal}</Text>  
              </View>  
  
              <Text style={styles.vehicleInfo} numberOfLines={1}>  
                {order.vehicleInfo}  
              </Text>  
            </TouchableOpacity>  
          ))  
        ) : (  
          <View style={styles.emptySection}>  
            <Text style={styles.emptyText}>No hay órdenes registradas</Text>  
          </View>  
        )}  
      </View>  
  
      {/* Acciones rápidas */}  
      <View style={styles.sectionContainer}>  
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>  
        <View style={styles.quickActionsGrid}>  
          <TouchableOpacity  
            style={styles.quickActionCard}  
            onPress={() => navigation.navigate("NewOrder")}  
          >  
            <View style={styles.quickActionIcon}>  
              <Feather name="plus-circle" size={24} color="#1a73e8" />  
            </View>  
            <Text style={styles.quickActionText}>Nueva Orden</Text>  
          </TouchableOpacity>  
  
          <TouchableOpacity  
            style={styles.quickActionCard}  
            onPress={() => navigation.navigate("ClientVehiclesTab")}  
          >  
            <View style={styles.quickActionIcon}>  
              <Feather name="truck" size={24} color="#4caf50" />  
            </View>  
            <Text style={styles.quickActionText}>Mis Vehículos</Text>  
          </TouchableOpacity>  
  
          <TouchableOpacity  
            style={styles.quickActionCard}  
            onPress={() => navigation.navigate("ClientOrdersTab")}  
          >  
            <View style={styles.quickActionIcon}>  
              <Feather name="file-text" size={24} color="#ff9800" />  
            </View>  
            <Text style={styles.quickActionText}>Historial</Text>  
          </TouchableOpacity>  
  
          <TouchableOpacity  
            style={styles.quickActionCard}  
            onPress={() => navigation.navigate("ProfileTab")}  
          >  
            <View style={styles.quickActionIcon}>  
              <Feather name="user" size={24} color="#9c27b0" />  
            </View>  
            <Text style={styles.quickActionText}>Mi Perfil</Text>  
          </TouchableOpacity>  
        </View>  
      </View>  
  
      {/* Próximas citas */}  
      {appointments.length > 0 && (  
        <View style={styles.sectionContainer}>  
          <Text style={styles.sectionTitle}>Próximas Citas</Text>  
          {appointments.slice(0, 3).map((appointment) => (  
            <View key={appointment.id} style={styles.appointmentCard}>  
              <View style={styles.appointmentIcon}>  
                <Feather name="calendar" size={20} color="#1a73e8" />  
              </View>  
              <View style={styles.appointmentInfo}>  
                <Text style={styles.appointmentService}>{appointment.tipo_servicio}</Text>  
                <Text style={styles.appointmentDate}>  
                  {new Date(appointment.fecha).toLocaleDateString("es-ES")} a las {appointment.hora}  
                </Text>  
                <Text style={styles.appointmentStatus}>Estado: {appointment.estado}</Text>  
              </View>  
            </View>  
          ))}  
        </View>  
      )}  
    </ScrollView>  
  )  
}  
  
// Los estilos permanecen igual que en el archivo original...  
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
  header: {  
    backgroundColor: "#fff",  
    padding: 20,  
    alignItems: "center",  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  logo: {  
    width: 80,  
    height: 80,  
    borderRadius: 40,  
    marginBottom: 12,  
  },  
  welcomeText: {  
    fontSize: 20,  
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
    padding: 16,  
    gap: 12,  
  },  
  statCard: {  
    flex: 1,  
    backgroundColor: "#fff",  
    borderRadius: 12,  
    padding: 16,  
    alignItems: "center",  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 2 },  
    shadowOpacity: 0.1,  
    shadowRadius: 4,  
    elevation: 3,  
  },  
  statIconContainer: {  
    width: 48,  
    height: 48,  
    borderRadius: 24,  
    backgroundColor: "#f0f8ff",  
    justifyContent: "center",  
    alignItems: "center",  
    marginBottom: 8,  
  },  
  statContent: {  
    alignItems: "center",  
  },  
  statValue: {  
    fontSize: 24,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 4,  
  },  
  statLabel: {  
    fontSize: 12,  
    color: "#666",  
    textAlign: "center",  
  },  
  sectionContainer: {  
    backgroundColor: "#fff",  
    margin: 16,  
    marginTop: 0,  
    borderRadius: 12,  
    padding: 16,  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 2 },  
    shadowOpacity: 0.1,  
    shadowRadius: 4,  
    elevation: 3,  
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
  upcomingServiceCard: {  
    borderBottomWidth: 1,  
    borderBottomColor: "#f0f0f0",  
    paddingVertical: 12,  
  },  
  serviceCardContent: {  
    flexDirection: "row",  
    alignItems: "center",  
  },  
  vehicleImage: {  
    width: 50,  
    height: 50,  
    borderRadius: 8,  
    marginRight: 12,  
  },  
  noImageContainer: {  
    width: 50,  
    height: 50,  
    borderRadius: 8,  
    backgroundColor: "#f0f0f0",  
    justifyContent: "center",  
    alignItems: "center",  
    marginRight: 12,  
  },  
  serviceInfo: {  
    flex: 1,  
  },  
  vehicleName: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 4,  
  },  
  vehicleDetails: {  
    fontSize: 14,  
    color: "#666",  
    marginBottom: 6,  
  },  
  serviceDateContainer: {  
    flexDirection: "row",  
    alignItems: "center",  
  },  
  serviceDateText: {  
    fontSize: 12,  
    fontWeight: "500",  
    marginLeft: 4,  
  },  
  orderCard: {  
    borderBottomWidth: 1,  
    borderBottomColor: "#f0f0f0",  
    paddingVertical: 12,  
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
    color: "#fff",  
    fontSize: 12,  
    fontWeight: "bold",  
  },  
  orderDescription: {  
    fontSize: 14,  
    color: "#666",  
    marginBottom: 8,  
  },  
  orderFooter: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    marginBottom: 4,  
  },  
  orderDate: {  
    fontSize: 12,  
    color: "#999",  
  },  
  orderAmount: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#4caf50",  
  },  
  vehicleInfo: {  
    fontSize: 12,  
    color: "#666",  
    fontStyle: "italic",  
  },  
  emptySection: {  
    alignItems: "center",  
    justifyContent: "center",  
    padding: 20,  
  },  
  emptyText: {  
    fontSize: 14,  
    color: "#999",  
    textAlign: "center",  
  },  
  quickActionsGrid: {  
    flexDirection: "row",  
    flexWrap: "wrap",  
    gap: 12,  
  },  
  quickActionCard: {  
    flex: 1,  
    minWidth: "45%",  
    backgroundColor: "#f8f9fa",  
    borderRadius: 12,  
    padding: 16,  
    alignItems: "center",  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  quickActionIcon: {  
    width: 48,  
    height: 48,  
    borderRadius: 24,  
    backgroundColor: "#fff",  
    justifyContent: "center",  
    alignItems: "center",  
    marginBottom: 8,  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 1 },  
    shadowOpacity: 0.1,  
    shadowRadius: 2,  
    elevation: 2,  
  },  
  quickActionText: {  
    fontSize: 12,  
    fontWeight: "500",  
    color: "#333",  
    textAlign: "center",  
  },  
  appointmentCard: {  
    flexDirection: "row",  
    alignItems: "center",  
    paddingVertical: 12,  
    borderBottomWidth: 1,  
    borderBottomColor: "#f0f0f0",  
  },  
  appointmentIcon: {  
    width: 40,  
    height: 40,  
    borderRadius: 20,  
    backgroundColor: "#e8f0fe",  
    justifyContent: "center",  
    alignItems: "center",  
    marginRight: 12,  
  },  
  appointmentInfo: {  
    flex: 1,  
  },  
  appointmentService: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 4,  
  },  
  appointmentDate: {  
    fontSize: 14,  
    color: "#666",  
    marginBottom: 2,  
  },  
  appointmentStatus: {  
    fontSize: 12,  
    color: "#999",  
  },  
})