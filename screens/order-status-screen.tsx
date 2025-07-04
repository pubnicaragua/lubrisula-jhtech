"use client"

import { useState, useCallback, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  Dimensions,
} from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import { Feather, MaterialIcons } from "@expo/vector-icons"
import DraggableFlatList from "react-native-draggable-flatlist"
import { useAuth } from "../context/auth-context"
import notificationService from "../services/notification-service"
import { formatDate, formatCurrency } from "../utils/helpers"
import { theme } from "../styles/theme"

// Definir estados de órdenes
const ORDER_STATUSES = [
  { id: "reception", label: "Recepción", color: "#1a73e8", icon: "clipboard" },
  { id: "diagnosis", label: "Diagnóstico", color: "#f5a623", icon: "search" },
  { id: "waiting_parts", label: "Esperando Repuestos", color: "#9c27b0", icon: "package" },
  { id: "in_progress", label: "En Proceso", color: "#f5a623", icon: "tool" },
  { id: "quality_check", label: "Control de Calidad", color: "#4caf50", icon: "check-circle" },
  { id: "completed", label: "Completada", color: "#4caf50", icon: "check-square" },
  { id: "delivered", label: "Entregada", color: "#607d8b", icon: "truck" },
  { id: "cancelled", label: "Cancelada", color: "#e53935", icon: "x-circle" },
]

export default function OrderStatusScreen({ navigation }) {
  const { user, hasPermission } = useAuth()
  const [orders, setOrders] = useState({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const scrollX = useRef(new Animated.Value(0)).current
  const windowWidth = Dimensions.get("window").width

  // Verificar si el usuario puede cambiar el estado de las órdenes
  const canChangeOrderStatus = hasPermission("update_order_status")

  // Cargar órdenes cuando la pantalla obtiene el foco
  useFocusEffect(
    useCallback(() => {
      loadOrders()
    }, []),
  )

  const loadOrders = async () => {
    try {
      setLoading(true)
      console.log("Cargando órdenes para el tablero Kanban")

      // Importar servicios dinámicamente
      const orderService = await import("../services/order-service")
      const vehicleService = await import("../services/vehicle-service")
      const clientService = await import("../services/client-service")

      // Obtener todas las órdenes
      const allOrders = await orderService.getAllOrders()
      console.log(`Se encontraron ${allOrders.length} órdenes en total`)

      // Agrupar órdenes por estado
      const groupedOrders = {}
      ORDER_STATUSES.forEach((status) => {
        groupedOrders[status.id] = []
      })

      // Enriquecer órdenes con información adicional
      for (const order of allOrders) {
        try {
          const vehicle = await vehicleService.getVehicleById(order.vehicleId)
          const client = await clientService.getClientById(order.clientId)

          const enrichedOrder = {
            ...order,
            vehicleInfo: vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.year})` : "Vehículo no encontrado",
            clientName: client ? client.name : "Cliente no encontrado",
            formattedDates: {
              created: formatDate(order.dates.created),
              promised: order.dates.promised ? formatDate(order.dates.promised) : "No definida",
            },
            formattedTotal: formatCurrency(order.total, order.currency),
          }

          if (groupedOrders[order.status]) {
            groupedOrders[order.status].push(enrichedOrder)
          }
        } catch (error) {
          console.error(`Error al procesar la orden ${order.id}:`, error)
        }
      }

      // Ordenar órdenes por fecha (más reciente primero)
      Object.keys(groupedOrders).forEach((status) => {
        groupedOrders[status].sort((a, b) => new Date(b.dates.created).getTime() - new Date(a.dates.created).getTime())
      })

      setOrders(groupedOrders)
    } catch (error) {
      console.error("Error al cargar órdenes:", error)
      Alert.alert("Error", "No se pudieron cargar las órdenes. Por favor, intente de nuevo.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadOrders()
  }

  const handleOrderPress = (order) => {
    navigation.navigate("OrderDetail", { orderId: order.id })
  }

  const handleStatusChange = async (order, newStatus) => {
    if (!canChangeOrderStatus) {
      Alert.alert(
        "Permiso Denegado",
        "No tienes permisos para cambiar el estado de las órdenes. Solo el jefe de taller puede realizar esta acción.",
      )
      return
    }

    try {
      // Importar servicio de órdenes dinámicamente
      const orderService = await import("../services/order-service")

      // Confirmar cambio de estado
      Alert.alert(
        "Cambiar Estado",
        `¿Estás seguro de cambiar el estado de la orden #${order.number} a "${
          ORDER_STATUSES.find((s) => s.id === newStatus)?.label
        }"?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Cambiar",
            onPress: async () => {
              // Actualizar estado de la orden
              const updatedOrder = await orderService.updateOrder(order.id, { status: newStatus })

              if (updatedOrder) {
                // Actualizar estado local
                const updatedOrders = { ...orders }
                updatedOrders[order.status] = updatedOrders[order.status].filter((o) => o.id !== order.id)
                updatedOrders[newStatus] = [...updatedOrders[newStatus], { ...order, status: newStatus }]
                setOrders(updatedOrders)

                // Enviar notificación
                await notificationService.sendOrderStatusNotification(
                  order.id,
                  order.number,
                  ORDER_STATUSES.find((s) => s.id === newStatus)?.label || newStatus,
                )

                // Mostrar mensaje de éxito
                Alert.alert("Éxito", `Estado de la orden #${order.number} actualizado correctamente.`)
              }
            },
          },
        ],
      )
    } catch (error) {
      console.error("Error al cambiar estado de la orden:", error)
      Alert.alert("Error", "No se pudo cambiar el estado de la orden. Por favor, intente de nuevo.")
    }
  }

  const renderOrderItem = ({ item, drag, isActive }) => {
    const statusInfo = ORDER_STATUSES.find((s) => s.id === item.status)

    return (
      <TouchableOpacity
        style={[
          styles.orderCard,
          isActive && styles.orderCardActive,
          { borderLeftColor: statusInfo?.color || theme.colors.primary },
        ]}
        onPress={() => handleOrderPress(item)}
        onLongPress={canChangeOrderStatus ? drag : undefined}
        delayLongPress={200}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>#{item.number}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo?.color || theme.colors.primary }]}>
            <Feather name={statusInfo?.icon || "circle"} size={12} color="#fff" style={styles.statusIcon} />
            <Text style={styles.statusText}>{statusInfo?.label || item.status}</Text>
          </View>
        </View>

        <View style={styles.orderContent}>
          <Text style={styles.vehicleInfo}>{item.vehicleInfo}</Text>
          <Text style={styles.clientName}>{item.clientName}</Text>
          <Text style={styles.orderDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </View>

        <View style={styles.orderFooter}>
          <View style={styles.orderDates}>
            <Text style={styles.dateLabel}>Creada: {item.formattedDates.created}</Text>
            <Text style={styles.dateLabel}>Entrega: {item.formattedDates.promised}</Text>
          </View>
          <Text style={styles.orderTotal}>{item.formattedTotal}</Text>
        </View>

        {canChangeOrderStatus && (
          <View style={styles.actionButtons}>
            {item.status !== "reception" && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#f5a623" }]}
                onPress={() => {
                  const currentIndex = ORDER_STATUSES.findIndex((s) => s.id === item.status)
                  if (currentIndex > 0) {
                    handleStatusChange(item, ORDER_STATUSES[currentIndex - 1].id)
                  }
                }}
              >
                <Feather name="arrow-left" size={16} color="#fff" />
              </TouchableOpacity>
            )}

            {item.status !== "delivered" && item.status !== "cancelled" && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#4caf50" }]}
                onPress={() => {
                  const currentIndex = ORDER_STATUSES.findIndex((s) => s.id === item.status)
                  if (currentIndex < ORDER_STATUSES.length - 2) {
                    // -2 para excluir "cancelled"
                    handleStatusChange(item, ORDER_STATUSES[currentIndex + 1].id)
                  }
                }}
              >
                <Feather name="arrow-right" size={16} color="#fff" />
              </TouchableOpacity>
            )}

            {item.status !== "cancelled" && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#e53935" }]}
                onPress={() => handleStatusChange(item, "cancelled")}
              >
                <Feather name="x" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    )
  }

  const renderStatusColumn = (status, index) => {
    const statusOrders = orders[status.id] || []

    return (
      <View style={styles.columnContainer} key={status.id}>
        <View style={[styles.columnHeader, { backgroundColor: status.color }]}>
          <Feather name={status.icon} size={18} color="#fff" style={styles.columnHeaderIcon} />
          <Text style={styles.columnHeaderText}>{status.label}</Text>
          <View style={styles.orderCount}>
            <Text style={styles.orderCountText}>{statusOrders.length}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={status.color} />
          </View>
        ) : (
          <DraggableFlatList
            data={statusOrders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item.id}
            onDragEnd={({ data, from, to }) => {
              if (canChangeOrderStatus && from.droppableId !== to.droppableId) {
                // Si se arrastra a una columna diferente, cambiar el estado
                const order = statusOrders[from.index]
                handleStatusChange(order, to.droppableId)
              }
            }}
            contentContainerStyle={styles.columnContent}
            ListEmptyComponent={
              <View style={styles.emptyColumn}>
                <Feather name="inbox" size={24} color="#ccc" />
                <Text style={styles.emptyText}>No hay órdenes</Text>
              </View>
            }
          />
        )}
      </View>
    )
  }

  const renderTabs = () => {
    return (
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
          {ORDER_STATUSES.map((status, index) => (
            <TouchableOpacity
              key={status.id}
              style={[styles.tab, activeTab === index && { backgroundColor: status.color }]}
              onPress={() => {
                setActiveTab(index)
                scrollX.setValue(index * windowWidth)
              }}
            >
              <Feather
                name={status.icon}
                size={16}
                color={activeTab === index ? "#fff" : status.color}
                style={styles.tabIcon}
              />
              <Text style={[styles.tabText, activeTab === index && { color: "#fff" }]}>{status.label}</Text>
              {orders[status.id] && orders[status.id].length > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: activeTab === index ? "#fff" : status.color }]}>
                  <Text style={[styles.tabBadgeText, { color: activeTab === index ? status.color : "#fff" }]}>
                    {orders[status.id].length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tablero de Órdenes</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Feather name="refresh-cw" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {renderTabs()}

      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
          listener: (event) => {
            const newIndex = Math.round(event.nativeEvent.contentOffset.x / windowWidth)
            if (newIndex !== activeTab) {
              setActiveTab(newIndex)
            }
          },
        })}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1a73e8"]} />}
      >
        {ORDER_STATUSES.map((status, index) => (
          <View key={status.id} style={[styles.page, { width: windowWidth }]}>
            {renderStatusColumn(status, index)}
          </View>
        ))}
      </Animated.ScrollView>

      {canChangeOrderStatus ? (
        <View style={styles.permissionInfo}>
          <MaterialIcons name="drag-indicator" size={20} color={theme.colors.textLight} />
          <Text style={styles.permissionText}>Mantén presionada una orden para arrastrarla y cambiar su estado</Text>
        </View>
      ) : (
        <View style={styles.permissionInfo}>
          <Feather name="lock" size={16} color={theme.colors.error} />
          <Text style={styles.permissionText}>Solo el jefe de taller puede cambiar el estado de las órdenes</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e4e8",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  refreshButton: {
    padding: 8,
  },
  tabContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e4e8",
  },
  tabScrollContent: {
    paddingHorizontal: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.text,
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  scrollContent: {
    flexGrow: 1,
  },
  page: {
    flex: 1,
  },
  columnContainer: {
    flex: 1,
    margin: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  columnHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  columnHeaderIcon: {
    marginRight: 8,
  },
  columnHeaderText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
  },
  orderCount: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  orderCountText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  columnContent: {
    padding: 8,
    paddingBottom: 100, // Espacio adicional al final
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyColumn: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 8,
    color: "#999",
    fontSize: 14,
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderCardActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    transform: [{ scale: 1.02 }],
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
    color: theme.colors.text,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  orderContent: {
    marginBottom: 8,
  },
  vehicleInfo: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.text,
    marginBottom: 2,
  },
  clientName: {
    fontSize: 13,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  orderDescription: {
    fontSize: 13,
    color: theme.colors.text,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 8,
  },
  orderDates: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: "bold",
    color: theme.colors.success,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  actionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  permissionInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#e1e4e8",
  },
  permissionText: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginLeft: 8,
  },
})
