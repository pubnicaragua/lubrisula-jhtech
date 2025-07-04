"use client"

import { useEffect, useState } from "react"
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

export default function ClientVehicleScreen({ navigation }) {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Cargar vehículos al montar el componente
  useEffect(() => {
    loadVehicles()
  }, [user])

  const loadVehicles = async () => {
    try {
      setIsLoading(true)
      if (user?.id) {
        // Importar servicios dinámicamente
        const vehicleService = await import("../services/vehicle-service")
        const orderService = await import("../services/order-service")

        // Obtener vehículos del cliente
        const clientVehicles = await vehicleService.getVehiclesByClientId(user.id)

        // Enriquecer vehículos con información adicional
        const enrichedVehicles = await Promise.all(
          clientVehicles.map(async (vehicle) => {
            // Obtener órdenes relacionadas con este vehículo
            const vehicleOrders = await orderService.getOrdersByVehicleId(vehicle.id)

            // Obtener la última orden
            const lastOrder =
              vehicleOrders.length > 0
                ? vehicleOrders.sort((a, b) => new Date(b.dates.created) - new Date(a.dates.created))[0]
                : null

            // Calcular próximo servicio
            const nextServiceDate = vehicle.nextServiceDate ? new Date(vehicle.nextServiceDate) : null

            const daysToNextService = nextServiceDate
              ? Math.ceil((nextServiceDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : null

            return {
              ...vehicle,
              mainImage: vehicle.images.length > 0 ? vehicle.images[0].uri : null,
              ordersCount: vehicleOrders.length,
              lastOrderDate: lastOrder ? new Date(lastOrder.dates.created).toLocaleDateString("es-ES") : null,
              lastOrderStatus: lastOrder ? lastOrder.status : null,
              daysToNextService,
              needsService: daysToNextService !== null && daysToNextService <= 14,
            }
          }),
        )

        setVehicles(enrichedVehicles)
      }
    } catch (error) {
      console.error("Error al cargar vehículos:", error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  // Navegar al detalle del vehículo
  const handleVehiclePress = (vehicle) => {
    navigation.navigate("VehicleDetail", { vehicleId: vehicle.id })
  }

  // Obtener color según estado de la última orden
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

  // Obtener texto según estado de la última orden
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
        return "Sin órdenes"
    }
  }

  // Componente para cada vehículo en la lista
  const VehicleItem = ({ vehicle }) => (
    <TouchableOpacity style={styles.vehicleItem} onPress={() => handleVehiclePress(vehicle)}>
      <View style={styles.vehicleImageContainer}>
        {vehicle.mainImage ? (
          <Image source={{ uri: vehicle.mainImage }} style={styles.vehicleImage} />
        ) : (
          <View style={styles.noImageContainer}>
            <Feather name="truck" size={40} color="#ccc" />
          </View>
        )}

        {vehicle.needsService && (
          <View style={styles.serviceAlertBadge}>
            <Feather name="alert-triangle" size={14} color="#fff" />
          </View>
        )}
      </View>

      <View style={styles.vehicleInfo}>
        <Text style={styles.vehicleName}>
          {vehicle.make} {vehicle.model}
        </Text>
        <Text style={styles.vehicleDetails}>
          {vehicle.year} • {vehicle.licensePlate}
        </Text>

        <View style={styles.vehicleStats}>
          <View style={styles.statItem}>
            <Feather name="calendar" size={14} color="#666" />
            <Text style={styles.statText}>{vehicle.lastOrderDate || "Sin servicios"}</Text>
          </View>

          <View style={styles.statItem}>
            <Feather name="tool" size={14} color="#666" />
            <Text style={styles.statText}>
              {vehicle.ordersCount} {vehicle.ordersCount === 1 ? "servicio" : "servicios"}
            </Text>
          </View>
        </View>

        {vehicle.lastOrderStatus && (
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(vehicle.lastOrderStatus) }]}>
            <Text style={styles.statusText}>{getStatusText(vehicle.lastOrderStatus)}</Text>
          </View>
        )}

        {vehicle.needsService && (
          <View style={styles.serviceAlert}>
            <Feather name="alert-triangle" size={14} color="#f5a623" />
            <Text style={styles.serviceAlertText}>
              {vehicle.daysToNextService <= 0 ? "¡Servicio vencido!" : `Servicio en ${vehicle.daysToNextService} días`}
            </Text>
          </View>
        )}
      </View>

      <Feather name="chevron-right" size={20} color="#999" />
    </TouchableOpacity>
  )

  const onRefresh = () => {
    setRefreshing(true)
    loadVehicles()
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Cargando vehículos...</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Vehículos</Text>
        <Text style={styles.subtitle}>Consulta información y servicios de tus vehículos</Text>
      </View>

      {vehicles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="truck" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No tienes vehículos registrados</Text>
          <Text style={styles.emptySubtext}>Cuando registres un vehículo, aparecerá aquí</Text>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <VehicleItem vehicle={item} />}
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
  vehicleItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vehicleImageContainer: {
    position: "relative",
    marginRight: 16,
  },
  vehicleImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  noImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  serviceAlertBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#f5a623",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  vehicleInfo: {
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
    marginBottom: 8,
  },
  vehicleStats: {
    flexDirection: "row",
    marginBottom: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  serviceAlert: {
    flexDirection: "row",
    alignItems: "center",
  },
  serviceAlertText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#f5a623",
    marginLeft: 4,
  },
})
