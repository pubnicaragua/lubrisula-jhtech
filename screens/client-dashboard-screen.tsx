"use client"

import { useEffect, useState } from "react"
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
import { useAuth } from "../context/auth-context"

export default function ClientDashboardScreen({ navigation }) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [clientData, setClientData] = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeOrders: 0,
    completedOrders: 0,
    upcomingServices: 0,
  })
  const [upcomingServices, setUpcomingServices] = useState([])
  const [recentOrders, setRecentOrders] = useState([])

  // Cargar datos al montar el componente
  useEffect(() => {
    loadDashboardData()
  }, [user])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      if (user?.id) {
        // Importar servicios dinámicamente
        const clientService = await import("../services/client-service")
        const vehicleService = await import("../services/vehicle-service")
        const orderService = await import("../services/order-service")

        // Obtener datos del cliente
        const client = await clientService.getClientById(user.id)
        setClientData(client)

        // Obtener vehículos del cliente
        const clientVehicles = await vehicleService.getVehiclesByClientId(user.id)
        setVehicles(clientVehicles)

        // Obtener órdenes del cliente
        const clientOrders = await orderService.getOrdersByClientId(user.id)
        setOrders(clientOrders)

        // Calcular estadísticas
        const activeOrders = clientOrders.filter(
          (order) => order.status !== "completed" && order.status !== "delivered" && order.status !== "cancelled",
        )
        const completedOrders = clientOrders.filter(
          (order) => order.status === "completed" || order.status === "delivered",
        )

        // Identificar vehículos con servicios próximos
        const vehiclesWithUpcomingService = clientVehicles.filter((vehicle) => {
          if (!vehicle.nextServiceDate) return false

          const nextService = new Date(vehicle.nextServiceDate)
          const today = new Date()
          const diffDays = Math.ceil((nextService - today) / (1000 * 60 * 60 * 24))

          return diffDays >= 0 && diffDays <= 30
        })

        setStats({
          totalVehicles: clientVehicles.length,
          activeOrders: activeOrders.length,
          completedOrders: completedOrders.length,
          upcomingServices: vehiclesWithUpcomingService.length,
        })

        // Preparar datos para servicios próximos
        const upcomingServicesData = await Promise.all(
          vehiclesWithUpcomingService.map(async (vehicle) => {
            const nextService = new Date(vehicle.nextServiceDate)
            const today = new Date()
            const diffDays = Math.ceil((nextService - today) / (1000 * 60 * 60 * 24))

            return {
              ...vehicle,
              daysToService: diffDays,
              mainImage: vehicle.images.length > 0 ? vehicle.images[0].uri : null,
            }
          }),
        )

        // Ordenar por proximidad del servicio
        upcomingServicesData.sort((a, b) => a.daysToService - b.daysToService)
        setUpcomingServices(upcomingServicesData)

        // Preparar datos para órdenes recientes
        const recentOrdersData = await Promise.all(
          clientOrders
            .sort((a, b) => new Date(b.dates.created) - new Date(a.dates.created))
            .slice(0, 3)
            .map(async (order) => {
              const vehicle = clientVehicles.find((v) => v.id === order.vehicleId)

              return {
                ...order,
                vehicleInfo: vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.year})` : "Vehículo no encontrado",
                statusColor: getStatusColor(order.status),
                statusText: getStatusText(order.status),
                formattedDate: new Date(order.dates.created).toLocaleDateString("es-ES"),
                formattedTotal: formatCurrency(order.total, order.currency),
              }
            }),
        )

        setRecentOrders(recentOrdersData)
      }
    } catch (error) {
      console.error("Error al cargar datos del dashboard:", error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  // Función para obtener texto según estado
  const getStatusText = (status) => {
    switch (status) {
      case "reception":
        return "Recepción"
      case "diagnosis":
        return "Diagnóstico"
      case "waiting_parts":
        return "Esperando Repuestos"
      case "in_progress":
        return "En Proceso"
      case "quality_check":
        return "Control de Calidad"
      case "completed":
        return "Completada"
      case "delivered":
        return "Entregada"
      case "cancelled":
        return "Cancelada"
      default:
        return "Desconocido"
    }
  }

  // Función para obtener color según estado
  const getStatusColor = (status) => {
    switch (status) {
      case "reception":
        return "#1a73e8"
      case "diagnosis":
        return "#f5a623"
      case "waiting_parts":
        return "#9c27b0"
      case "in_progress":
        return "#f5a623"
      case "quality_check":
        return "#4caf50"
      case "completed":
        return "#4caf50"
      case "delivered":
        return "#607d8b"
      case "cancelled":
        return "#e53935"
      default:
        return "#666"
    }
  }

  // Formatear moneda
  const formatCurrency = (amount, currencyCode = "USD") => {
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
        <Text style={styles.welcomeText}>Bienvenido, {user?.name || "Cliente"}</Text>
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
          upcomingServices.map((vehicle) => (
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
                    {vehicle.make} {vehicle.model}
                  </Text>
                  <Text style={styles.vehicleDetails}>
                    {vehicle.year} • {vehicle.licensePlate}
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
          recentOrders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => navigation.navigate("OrderDetail", { orderId: order.id })}
            >
              <View style={styles.orderHeader}>
                <Text style={styles.orderNumber}>Orden #{order.number}</Text>
                <View style={[styles.statusBadge, { backgroundColor: order.statusColor }]}>
                  <Text style={styles.statusText}>{order.statusText}</Text>
                </View>
              </View>

              <Text style={styles.orderDescription} numberOfLines={2}>
                {order.description}
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
    backgroundColor: "#fff",
    marginBottom: 16,
    borderRadius: 12,
    marginHorizontal: 16,
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
  },
  upcomingServiceCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
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
    marginBottom: 2,
  },
  vehicleDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  serviceDateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  serviceDateText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  orderCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
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
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  orderDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  emptySection: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
  },
  quickActionsContainer: {
    padding: 16,
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  actionButton: {
    alignItems: "center",
    width: "30%",
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
    fontSize: 14,
    color: "#333",
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    padding: 24,
    marginBottom: 16,
  },
  footerLogo: {
    width: 120,
    height: 40,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
})
