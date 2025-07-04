"use client"

import { useEffect, useState, useCallback } from "react"
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, RefreshControl } from "react-native"
import { Feather } from "@expo/vector-icons"
import { useAuth } from "../context/auth-context"
import * as orderService from "../services/order-service"
import * as clientService from "../services/client-service"
import * as inventoryService from "../services/inventory-service"
import * as currencyService from "../services/currency-service"

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [clients, setClients] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
  })
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cargar datos del dashboard
  const loadDashboardData = useCallback(async () => {
    try {
      setRefreshing(true)
      setError(null)

      // Cargar datos según el rol del usuario
      if (user?.role === "client") {
        // Para clientes, solo cargar sus órdenes
        const clientOrders = await orderService.getOrdersByClientId(user.id)
        setOrders(clientOrders)

        // Calcular estadísticas del cliente
        const pendingOrders = clientOrders.filter(
          (order) => order.status !== "completed" && order.status !== "delivered",
        )
        const completedOrders = clientOrders.filter(
          (order) => order.status === "completed" || order.status === "delivered",
        )

        setStats({
          totalOrders: clientOrders.length,
          pendingOrders: pendingOrders.length,
          completedOrders: completedOrders.length,
          totalRevenue: clientOrders.reduce((sum, order) => sum + order.total, 0),
        })
      } else {
        // Para técnicos y administradores, cargar todos los datos
        const [allOrders, allClients, lowStock] = await Promise.all([
          orderService.getAllOrders(),
          clientService.getAllClients(),
          inventoryService.getLowStockItems(),
        ])

        setOrders(allOrders)
        setClients(allClients)
        setLowStockItems(lowStock)

        // Calcular estadísticas generales
        const pendingOrders = allOrders.filter((order) => order.status !== "completed" && order.status !== "delivered")
        const completedOrders = allOrders.filter(
          (order) => order.status === "completed" || order.status === "delivered",
        )

        setStats({
          totalOrders: allOrders.length,
          pendingOrders: pendingOrders.length,
          completedOrders: completedOrders.length,
          totalRevenue: allOrders.reduce((sum, order) => sum + order.total, 0),
        })
      }
    } catch (error) {
      console.error("Error al cargar datos del dashboard:", error)
      setError("No se pudieron cargar los datos. Intente nuevamente.")
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }, [user])

  // Cargar datos al montar el componente
  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Manejar navegación según el rol
  const handleNavigation = (screen) => {
    if (user?.role === "client") {
      if (screen === "orders") {
        navigation.navigate("ClientOrdersTab")
      }
    } else {
      if (screen === "clients") {
        navigation.navigate("ClientsTab")
      } else if (screen === "inventory") {
        navigation.navigate("InventoryTab")
      } else if (screen === "orders") {
        navigation.navigate("OrdersTab")
      } else if (screen === "reports") {
        navigation.navigate("ReportsTab")
      }
    }
  }

  // Formatear moneda
  const formatCurrency = async (amount) => {
    return currencyService.formatCurrency(amount, "USD")
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadDashboardData} />}
    >
      <View style={styles.header}>
        <Image source={require("../assets/autoflowx-logo.png")} style={styles.logo} resizeMode="contain" />
        <Text style={styles.welcomeText}>Bienvenido, {user?.name || "Usuario"}</Text>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color="#e53935" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Feather name="clipboard" size={24} color="#1a73e8" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{stats.totalOrders}</Text>
                <Text style={styles.statLabel}>Órdenes Totales</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Feather name="clock" size={24} color="#f5a623" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{stats.pendingOrders}</Text>
                <Text style={styles.statLabel}>Órdenes Pendientes</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Feather name="check-circle" size={24} color="#4caf50" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{stats.completedOrders}</Text>
                <Text style={styles.statLabel}>Órdenes Completadas</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Feather name="dollar-sign" size={24} color="#9c27b0" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>${stats.totalRevenue.toFixed(2)}</Text>
                <Text style={styles.statLabel}>Ingresos Totales</Text>
              </View>
            </View>
          </View>

          {user?.role !== "client" && (
            <View style={styles.quickActionsContainer}>
              <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate("ClientsTab", { screen: "NewClient" })}
                >
                  <Feather name="user-plus" size={24} color="#1a73e8" />
                  <Text style={styles.actionText}>Nuevo Cliente</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate("ClientsTab", { screen: "NewOrder" })}
                >
                  <Feather name="file-plus" size={24} color="#1a73e8" />
                  <Text style={styles.actionText}>Nueva Orden</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate("InventoryTab", { screen: "NewInventoryItem" })}
                >
                  <Feather name="package" size={24} color="#1a73e8" />
                  <Text style={styles.actionText}>Nuevo Artículo</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.recentContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Órdenes Recientes</Text>
              <TouchableOpacity onPress={() => handleNavigation("orders")}>
                <Text style={styles.seeAllText}>Ver todas</Text>
              </TouchableOpacity>
            </View>

            {orders.length > 0 ? (
              orders.slice(0, 3).map((order) => (
                <TouchableOpacity
                  key={order.id}
                  style={styles.orderCard}
                  onPress={() =>
                    navigation.navigate(user?.role === "client" ? "ClientOrdersTab" : "OrdersTab", {
                      screen: "OrderDetail",
                      params: { orderId: order.id },
                    })
                  }
                >
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderNumber}>Orden #{order.number}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                    </View>
                  </View>
                  <Text style={styles.orderDescription}>{order.description}</Text>
                  <View style={styles.orderFooter}>
                    <Text style={styles.orderDate}>{new Date(order.dates.created).toLocaleDateString("es-ES")}</Text>
                    <Text style={styles.orderAmount}>${order.total.toFixed(2)}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Feather name="clipboard" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No hay órdenes recientes</Text>
              </View>
            )}
          </View>

          {user?.role !== "client" && (
            <>
              <View style={styles.recentContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Clientes Recientes</Text>
                  <TouchableOpacity onPress={() => handleNavigation("clients")}>
                    <Text style={styles.seeAllText}>Ver todos</Text>
                  </TouchableOpacity>
                </View>

                {clients.length > 0 ? (
                  clients.slice(0, 3).map((client) => (
                    <TouchableOpacity
                      key={client.id}
                      style={styles.clientCard}
                      onPress={() =>
                        navigation.navigate("ClientsTab", {
                          screen: "ClientDetail",
                          params: { clientId: client.id },
                        })
                      }
                    >
                      <View style={styles.clientAvatar}>
                        <Feather name="user" size={24} color="#1a73e8" />
                      </View>
                      <View style={styles.clientInfo}>
                        <Text style={styles.clientName}>{client.name}</Text>
                        <Text style={styles.clientContact}>{client.phone}</Text>
                      </View>
                      <Feather name="chevron-right" size={20} color="#999" />
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Feather name="users" size={48} color="#ccc" />
                    <Text style={styles.emptyText}>No hay clientes registrados</Text>
                  </View>
                )}
              </View>

              <View style={styles.recentContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Inventario Bajo</Text>
                  <TouchableOpacity onPress={() => handleNavigation("inventory")}>
                    <Text style={styles.seeAllText}>Ver inventario</Text>
                  </TouchableOpacity>
                </View>

                {lowStockItems.length > 0 ? (
                  lowStockItems.slice(0, 3).map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.inventoryCard}
                      onPress={() =>
                        navigation.navigate("InventoryTab", {
                          screen: "InventoryItemDetail",
                          params: { itemId: item.id },
                        })
                      }
                    >
                      <View style={styles.inventoryIconContainer}>
                        <Feather name="package" size={24} color="#f5a623" />
                      </View>
                      <View style={styles.inventoryInfo}>
                        <Text style={styles.inventoryName}>{item.name}</Text>
                        <Text style={styles.inventorySku}>{item.sku}</Text>
                      </View>
                      <View style={styles.inventoryQuantity}>
                        <Text
                          style={[
                            styles.quantityText,
                            item.stock <= (item.minStock || 0) / 2 ? styles.criticalStock : styles.lowStock,
                          ]}
                        >
                          {item.stock} unid.
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Feather name="package" size={48} color="#ccc" />
                    <Text style={styles.emptyText}>No hay items con bajo stock</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </>
      )}
    </ScrollView>
  )
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
    default:
      return "#666"
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e4e8",
  },
  logo: {
    width: 150,
    height: 50,
    marginBottom: 10,
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
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#e53935",
    textAlign: "center",
    marginTop: 10,
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
    fontWeight: "bold",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 16,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
  quickActionsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    width: "30%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    color: "#1a73e8",
    marginTop: 8,
    textAlign: "center",
  },
  recentContainer: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: "#1a73e8",
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
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
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
  clientCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  clientContact: {
    fontSize: 14,
    color: "#666",
  },
  inventoryCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inventoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  inventoryInfo: {
    flex: 1,
  },
  inventoryName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  inventorySku: {
    fontSize: 14,
    color: "#666",
  },
  inventoryQuantity: {
    marginLeft: "auto",
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  lowStock: {
    color: "#f5a623",
  },
  criticalStock: {
    color: "#e53935",
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 8,
  },
})
