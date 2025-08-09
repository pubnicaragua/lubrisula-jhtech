"use client"  
  
import { useState, useCallback, useEffect } from "react"  
import {  
  StyleSheet,  
  View,  
  Text,  
  TouchableOpacity,  
  ScrollView,  
  Image,  
  ActivityIndicator,  
  RefreshControl,  
} from "react-native"  
import { Feather } from "@expo/vector-icons"  
import { useFocusEffect } from "@react-navigation/native"  
import { useAuth } from "../context/auth-context"  
// Importaciones corregidas para usar servicios de Supabase  
import * as orderService from "../services/supabase/order-service"  
import * as clientService from "../services/supabase/client-service"  
import * as vehicleService from "../services/supabase/vehicle-service"  
import * as appointmentService from "../services/supabase/appointment-service"  
import * as userService from "../services/supabase/user-service"  
  
// Tipos TypeScript para resolver errores  
interface ClientDashboardScreenProps {  
  navigation: any  
}  
  
interface OrderType {  
  id: string  
  numero_orden: string  
  descripcion: string  
  estado: string  
  prioridad: string  
  client_id: string  
  vehiculo_id: string  
  costo?: number  
  fecha_creacion: string  
  observacion?: string  
}  
  
interface VehicleType {  
  id: string  
  marca: string  
  modelo: string  
  año: number  
  placa: string  
  client_id: string  
  proximo_servicio?: string  
  imagenes?: string[]  
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
    
  const [isLoading, setIsLoading] = useState(true)  
  const [refreshing, setRefreshing] = useState(false)  
  const [clientData, setClientData] = useState<clientService.Client | null>(null)  
  const [vehicles, setVehicles] = useState<vehicleService.Vehicle[]>([])  
  const [orders, setOrders] = useState<OrderType[]>([])  
  const [appointments, setAppointments] = useState<AppointmentType[]>([])  
  const [stats, setStats] = useState<StatsType>({  
    totalVehicles: 0,  
    activeOrders: 0,  
    completedOrders: 0,  
    upcomingServices: 0,  
  })  
  const [upcomingServices, setUpcomingServices] = useState<VehicleType[]>([])  
  const [recentOrders, setRecentOrders] = useState<OrderType[]>([])  
  
  // Cargar datos del dashboard del cliente  
  const loadDashboardData = useCallback(async () => {  
    try {  
      setIsLoading(true)  
      setRefreshing(true)  
  
      if (!user?.id) return  
  
      // Obtener datos del cliente  
      const client = await clientService.clientService.getClientById(user.id) 
      if (client) {
        setClientData(client)  
      } 
  
      // Obtener vehículos del cliente  
      const clientVehicles = await vehicleService.vehicleService.getVehiclesByClientId(user.id)  
      setVehicles(clientVehicles)  
  
      // Obtener órdenes del cliente  
      const clientOrders = await orderService.orderService.getOrdersByClientId(user.id)  
      setOrders(clientOrders)  
  
      // Obtener citas del cliente  
      const clientAppointments = await appointmentService.getAppointmentsByClientId(user.id)  
      setAppointments(clientAppointments)  
  
      // Calcular estadísticas  
      const activeOrders = clientOrders.filter(  
        (order: OrderType) => order.estado !== "Completada" && order.estado !== "Entregada" && order.estado !== "Cancelada"  
      )  
      const completedOrders = clientOrders.filter(  
        (order: OrderType) => order.estado === "Completada" || order.estado === "Entregada"  
      )  
  
      // Identificar vehículos con servicios próximos  
      const vehiclesWithUpcomingService = clientVehicles.filter((vehicle: vehicleService.Vehicle) => {  
        if (!vehicle.nextServiceDate) return false  
  
        const nextService = new Date(vehicle.nextServiceDate)  
        const today = new Date()  
        const diffDays = Math.ceil((nextService.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))  
  
        return diffDays >= 0 && diffDays <= 30  
      })  
  
      setStats({  
        totalVehicles: clientVehicles.length,  
        activeOrders: activeOrders.length,  
        completedOrders: completedOrders.length,  
        upcomingServices: vehiclesWithUpcomingService.length,  
      })  
  
      // Preparar datos para servicios próximos  
      const upcomingServicesData = vehiclesWithUpcomingService.map((vehicle: VehicleType) => {  
        const nextService = new Date(vehicle.proximo_servicio!)  
        const today = new Date()  
        const diffDays = Math.ceil((nextService.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))  
  
        return {  
          ...vehicle,  
          daysToService: diffDays,  
          mainImage: vehicle.imagenes && vehicle.imagenes.length > 0 ? vehicle.imagenes[0] : null,  
        }  
      })  
  
      // Ordenar por proximidad del servicio  
      upcomingServicesData.sort((a: any, b: any) => a.daysToService - b.daysToService)  
      setUpcomingServices(upcomingServicesData)  
  
      // Preparar datos para órdenes recientes  
      const recentOrdersData = clientOrders  
        .sort((a: OrderType, b: OrderType) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime())  
        .slice(0, 3)  
        .map((order: OrderType) => {  
          const vehicle = clientVehicles.find((v: VehicleType) => v.id === order.vehiculo_id)  
  
          return {  
            ...order,  
            vehicleInfo: vehicle ? `${vehicle.marca} ${vehicle.modelo} (${vehicle.año})` : "Vehículo no encontrado",  
            statusColor: getStatusColor(order.estado),  
            statusText: getStatusText(order.estado),  
            formattedDate: new Date(order.fecha_creacion).toLocaleDateString("es-ES"),  
            formattedTotal: formatCurrency(order.costo || 0, "USD"),  
          }  
        })  
  
      setRecentOrders(recentOrdersData)  
  
    } catch (error) {  
      console.error("Error al cargar datos del dashboard:", error)  
    } finally {  
      setIsLoading(false)  
      setRefreshing(false)  
    }  
  }, [user])  
  
  useFocusEffect(  
    useCallback(() => {  
      loadDashboardData()  
    }, [loadDashboardData])  
  )  
  
  // Función para obtener texto según estado  
  const getStatusText = (estado: string) => {  
    switch (estado) {  
      case "Pendiente":  
        return "Pendiente"  
      case "En Diagnóstico":  
        return "En Diagnóstico"  
      case "Esperando Repuestos":  
        return "Esperando Repuestos"  
      case "En Proceso":  
        return "En Proceso"  
      case "Control Calidad":  
        return "Control Calidad"  
      case "Completada":  
        return "Completada"  
      case "Entregada":  
        return "Entregada"  
      case "Cancelada":  
        return "Cancelada"  
      default:  
        return "Desconocido"  
    }  
  }  
  
  // Función para obtener color según estado  
  const getStatusColor = (estado: string) => {  
    switch (estado) {  
      case "Pendiente":  
        return "#1a73e8"  
      case "En Diagnóstico":  
        return "#f5a623"  
      case "Esperando Repuestos":  
        return "#9c27b0"  
      case "En Proceso":  
        return "#ff9800"  
      case "Control Calidad":  
        return "#607d8b"  
      case "Completada":  
        return "#4caf50"  
      case "Entregada":  
        return "#607d8b"  
      case "Cancelada":  
        return "#e53935"  
      default:  
        return "#666"  
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
  
  const onRefresh = () => {  
    setRefreshing(true)  
    loadDashboardData()  
  }  
  
  if (isLoading) {  
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1a73e8"]} />}  
    >  
      <View style={styles.header}>  
        <Image   
          source={{uri: "https://images.pexels.com/photos/3785927/pexels-photo-3785927.jpeg"}}   
          style={styles.logo}   
          resizeMode="contain"   
        />  
        <Text style={styles.welcomeText}>Bienvenido, {clientData?.nombre || "Cliente"}</Text>  
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
                  <Text style={styles.vehicleName}>  
                    {vehicle.marca} {vehicle.modelo}  
                  </Text>  
                  <Text style={styles.vehicleDetails}>  
                    {vehicle.año} • {vehicle.placa}  
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
                <Text style={styles.orderNumber}>Orden #{order.numero_orden}</Text>  
                <View style={[styles.statusBadge, { backgroundColor: order.statusColor }]}>  
                  <Text style={styles.statusText}>{order.statusText}</Text>  
                </View>  
              </View>  
  
              <Text style={styles.orderDescription} numberOfLines={2}>  
                {order.descripcion}  
              </Text>  
  
              <View style={styles.orderFooter}>  
                <View style={styles.orderVehicleInfo}>  
                  <Feather name="truck" size={14} color="#666" />  
                  <Text style={styles.orderVehicleText}>{order.vehicleInfo}</Text>  
                </View>  
  
                <View style={styles.orderDateInfo}>  
                  <Feather name="calendar" size={14} color="#666" />  
                  <Text style={styles.orderDateText}>{order.formattedDate}</Text>  
                </View>  
              </View>  
  
              <Text style={styles.orderTotal}>{order.formattedTotal}</Text>  
            </TouchableOpacity>  
          ))  
        ) : (  
          <View style={styles.emptySection}>  
            <Text style={styles.emptyText}>No hay órdenes recientes</Text>  
          </View>  
        )}  
      </View>  
  
      {/* Acciones rápidas */}  
      <View style={styles.quickActionsContainer}>  
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>  
  
        <View style={styles.quickActions}>  
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("ClientOrdersTab")}>  
            <View style={[styles.actionIcon, { backgroundColor: "#e8f0fe" }]}>  
              <Feather name="clipboard" size={24} color="#1a73e8" />  
            </View>  
            <Text style={styles.actionText}>Mis Órdenes</Text>  
          </TouchableOpacity>  
  
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("ClientVehiclesTab")}>  
            <View style={[styles.actionIcon, { backgroundColor: "#fef8e8" }]}>  
              <Feather name="truck" size={24} color="#f5a623" />  
            </View>  
            <Text style={styles.actionText}>Mis Vehículos</Text>  
          </TouchableOpacity>  
  
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("ProfileTab")}>  
            <View style={[styles.actionIcon, { backgroundColor: "#e8f5e9" }]}>  
              <Feather name="user" size={24} color="#4caf50" />  
            </View>  
            <Text style={styles.actionText}>Mi Perfil</Text>  
          </TouchableOpacity>  
        </View>  
      </View>  
  
      <View style={styles.footer}>  
        <Image   
          source={{uri: "https://images.pexels.com/photos/3785927/pexels-photo-3785927.jpeg"}}   
          style={styles.footerLogo}   
          resizeMode="contain"   
        />  
        <Text style={styles.footerText}>© {new Date().getFullYear()} AutoFlowX. Todos los derechos reservados.</Text>  
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
  },  
  loadingText: {  
    marginTop: 12,  
    fontSize: 16,  
    color: "#666",  
  },  
  header: {  
    padding: 20,  
    backgroundColor: "#fff",  
    alignItems: "center",  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  logo: {  
    width: 150,  
    height: 50,  
    marginBottom: 16,  
  },  
  welcomeText: {  
    fontSize: 18,  
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
    justifyContent: "space-between",  
    padding: 16,  
  },  
  statCard: {  
    backgroundColor: "#fff",  
    borderRadius: 12,  
    padding: 16,  
    marginBottom: 16,  
    width: "48%",  
    flexDirection: "row",  
    alignItems: "center",  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 1 },  
    shadowOpacity: 0.1,  
    shadowRadius: 2,  
    elevation: 2,  
  },  
  statIconContainer: {  
    width: 48,  
    height: 48,  
    borderRadius: 24,  
    backgroundColor: "#f5f5f5",  
    justifyContent: "center",  
    alignItems: "center",  
    marginRight: 12,  
  },  
  statContent: {  
    flex: 1,  
  },  
  statValue: {  
    fontSize: 20,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  statLabel: {  
    fontSize: 14,  
    color: "#666",  
  },  
  sectionContainer: {  
    padding: 16,  
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
  },  
  upcomingServiceCard: {  
    backgroundColor: "#fff",  
    borderRadius: 8,  
    padding: 16,  
    marginBottom: 12,  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 1 },  
    shadowOpacity: 0.1,  
    shadowRadius: 2,  
    elevation: 2,  
  },  
  serviceCardContent: {  
    flexDirection: "row",  
    alignItems: "center",  
  },  
  vehicleImage: {  
    width: 60,  
    height: 60,  
    borderRadius: 8,  
    marginRight: 12,  
  },  
  noImageContainer: {  
    width: 60,  
    height: 60,  
    borderRadius: 8,  
    backgroundColor: "#f5f5f5",  
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
    marginBottom: 8,  
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
    backgroundColor: "#fff",  
    borderRadius: 8,  
    padding: 16,  
    marginBottom: 12,  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 1 },  
    shadowOpacity: 0.1,  
    shadowRadius: 2,  
    elevation: 2,  
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
    fontWeight: "500",  
  },  
  orderDescription: {  
    fontSize: 14,  
    color: "#666",  
    marginBottom: 12,  
  },  
  orderFooter: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    marginBottom: 8,  
  },  
  orderVehicleInfo: {  
    flexDirection: "row",  
    alignItems: "center",  
  },  
  orderVehicleText: {  
    fontSize: 12,  
    color: "#666",  
    marginLeft: 4,  
  },  
  orderDateInfo: {  
    flexDirection: "row",  
    alignItems: "center",  
  },  
  orderDateText: {  
    fontSize: 12,  
    color: "#666",  
    marginLeft: 4,  
  },  
  orderTotal: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#4caf50",  
    textAlign: "right",  
  },  
  quickActionsContainer: {  
    padding: 16,  
  },  
  quickActions: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
  },  
  actionButton: {  
    flex: 1,  
    alignItems: "center",  
    marginHorizontal: 4,  
  },  
  actionIcon: {  
    width: 60,  
    height: 60,  
    borderRadius: 30,  
    justifyContent: "center",  
    alignItems: "center",  
    marginBottom: 8,  
  },  
  actionText: {  
    fontSize: 12,  
    color: "#333",  
    textAlign: "center",  
  },  
  emptySection: {  
    padding: 20,  
    alignItems: "center",  
  },  
  emptyText: {  
    fontSize: 14,  
    color: "#999",  
    textAlign: "center",  
  },  
  footer: {  
    padding: 20,  
    alignItems: "center",  
    backgroundColor: "#fff",  
    marginTop: 20,  
  },  
  footerLogo: {  
    width: 100,  
    height: 30,  
    marginBottom: 8,  
  },  
  footerText: {  
    fontSize: 12,  
    color: "#666",  
    textAlign: "center",  
  },  
})