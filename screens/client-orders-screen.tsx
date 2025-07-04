"use client"

import { useState, useCallback } from "react"
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Image,
  RefreshControl,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { useAuth } from "../context/auth-context"
import { formatDate, formatCurrency } from "../utils/helpers"
import { useFocusEffect } from "@react-navigation/native"

export default function ClientOrdersScreen({ navigation }) {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  // Cargar órdenes cuando la pantalla obtiene el foco
  useFocusEffect(
    useCallback(() => {
      loadOrders()
    }, [user]),
  )

  const loadOrders = async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (user?.id) {
        console.log("Cargando órdenes para el usuario:", user.id)

        // Importar servicios dinámicamente
        const orderService = await import("../services/order-service")
        const vehicleService = await import("../services/vehicle-service")
        const clientService = await import("../services/client-service")

        // Obtener órdenes del cliente
        const clientOrders = await orderService.getOrdersByClientId(user.id)
        console.log(`Se encontraron ${clientOrders.length} órdenes para el cliente`)

        // Obtener vehículos del cliente
        const clientVehicles = await vehicleService.getVehiclesByClientId(user.id)
        setVehicles(clientVehicles)
        console.log(`Se encontraron ${clientVehicles.length} vehículos para el cliente`)

        // Obtener cliente
        const clientData = await clientService.getClientById(user.id)

        // Enriquecer órdenes con información de vehículos
        const enrichedOrders = await Promise.all(
          clientOrders.map(async (order) => {
            const vehicle = clientVehicles.find((v) => v.id === order.vehicleId)

            // Formatear fechas para mostrar
            const formattedDates = {
              created: formatDate(order.dates.created),
              promised: order.dates.promised ? formatDate(order.dates.promised) : null,
              completed: order.dates.completed ? formatDate(order.dates.completed) : null,
              delivered: order.dates.delivered ? formatDate(order.dates.delivered) : null,
            }

            return {
              ...order,
              vehicleInfo: vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.year})` : "Vehículo no encontrado",
              vehicleImage: vehicle && vehicle.images.length > 0 ? vehicle.images[0].uri : null,
              formattedDates,
              formattedTotal: formatCurrency(order.total, order.currency),
              progressPercentage: calculateProgressPercentage(order.status),
              statusColor: getStatusColor(order.status),
              statusText: getStatusText(order.status),
              hasInsurance: !!order.insuranceResponse,
              insuranceApproved: order.insuranceResponse?.approved,
            }
          }),
        )

        // Ordenar por fecha de creación (más reciente primero)
        enrichedOrders.sort((a, b) => new Date(b.dates.created).getTime() - new Date(a.dates.created).getTime())

        setOrders(enrichedOrders)
      }
    } catch (error) {
      console.error("Error al cargar órdenes:", error)
      setError("No se pudieron cargar las órdenes. Por favor, intente de nuevo.")
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  // Calcular porcentaje de progreso según estado
  const calculateProgressPercentage = (status) => {
    switch (status) {
      case "reception":
        return 10
      case "diagnosis":
        return 25
      case "waiting_parts":
        return 40
      case "in_progress":
        return 60
      case "quality_check":
        return 80
      case "completed":
        return 90
      case "delivered":
        return 100
      case "cancelled":
        return 0
      default:
        return 0
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

  // Navegar al detalle de la orden
  const handleOrderPress = (order) => {
    navigation.navigate("OrderDetail", { orderId: order.id })
  }

  // Componente para cada orden en la lista
  const OrderItem = ({ order }) => (
    <TouchableOpacity style={styles.orderItem} onPress={() => handleOrderPress(order)}>
      <View style={styles.orderHeader}>
        <View style={styles.orderNumberContainer}>
          <Text style={styles.orderNumber}>Orden #{order.number}</Text>
          <View style={[styles.statusBadge, { backgroundColor: order.statusColor }]}>
            <Text style={styles.statusText}>{order.statusText}</Text>
          </View>
        </View>
        {order.hasInsurance && (
          <View style={[styles.insuranceBadge, { backgroundColor: order.insuranceApproved ? "#4caf50" : "#f5a623" }]}>
            <Feather name="shield" size={12} color="#fff" />
            <Text style={styles.insuranceText}>{order.insuranceApproved ? "Aprobado" : "En revisión"}</Text>
          </View>
        )}
      </View>

      <View style={styles.orderContent}>
        {order.vehicleImage ? (
          <Image source={{ uri: order.vehicleImage }} style={styles.vehicleImage} />
        ) : (
          <View style={styles.noImageContainer}>
            <Feather name="camera-off" size={24} color="#ccc" />
          </View>
        )}

        <View style={styles.orderDetails}>
          <Text style={styles.orderVehicle}>{order.vehicleInfo}</Text>
          <Text style={styles.orderDescription} numberOfLines={2}>
            {order.description}
          </Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${order.progressPercentage}%`,
                    backgroundColor: order.statusColor,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{order.progressPercentage}%</Text>
          </View>
        </View>
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.orderDates}>
          <Text style={styles.dateLabel}>Creada: {order.formattedDates.created}</Text>
          {order.formattedDates.promised && (
            <Text style={styles.dateLabel}>Entrega est.: {order.formattedDates.promised}</Text>
          )}
        </View>
        <Text style={styles.orderTotal}>{order.formattedTotal}</Text>
      </View>

      {order.comments && order.comments.length > 0 && (
        <View style={styles.commentsPreview}>
          <Feather name="message-circle" size={14} color="#666" />
          <Text style={styles.commentsCount}>{order.comments.length} comentarios</Text>
        </View>
      )}
    </TouchableOpacity>
  )

  const onRefresh = () => {
    setRefreshing(true)
    loadOrders()
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Cargando órdenes...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="alert-circle" size={48} color="#e53935" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadOrders}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Órdenes</Text>
        <Text style={styles.subtitle}>Consulta el estado de tus servicios y reparaciones</Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="clipboard" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No tienes órdenes activas</Text>
          <Text style={styles.emptySubtext}>Cuando solicites un servicio, tus órdenes aparecerán aquí</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <OrderItem order={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1a73e8"]} />}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e4e8",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a73e8",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#e53935",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#1a73e8",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 8,
  },
  listContent: {
    padding: 16,
  },
  orderItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderNumberContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginRight: 8,
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
  insuranceBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  insuranceText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 4,
  },
  orderContent: {
    flexDirection: "row",
    marginBottom: 12,
  },
  vehicleImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  noImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  orderDetails: {
    flex: 1,
  },
  orderVehicle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  orderDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#e1e4e8",
    borderRadius: 3,
    marginRight: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#666",
    width: 36,
    textAlign: "right",
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
  },
  orderDates: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 2,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4caf50",
  },
  commentsPreview: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  commentsCount: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
})
