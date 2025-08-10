"use client"  
  
import { useState, useCallback, useEffect } from "react"  
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native"  
import { Feather } from "@expo/vector-icons"  
import { useFocusEffect } from "@react-navigation/native"  
// Importaciones corregidas para usar servicios de Supabase  
import * as orderService from "../services/supabase/order-service"  
import * as clientService from "../services/supabase/client-service"  
import * as inventoryService from "../services/supabase/inventory-service"  
import * as dashboardService from "../services/supabase/dashboard-service"  
import * as userService from "../services/supabase/user-service"  
import * as accessService from "../services/supabase/access-service"  
import { useAuth } from "../context/auth-context"  
import { Client } from "../services/supabase/client-service"
import { DashboardInventoryItem } from "../types/dashboard"
import { Order } from '../types/order';

// Tipos TypeScript para resolver errores  
interface DashboardScreenProps {  
  navigation: any  
}  

interface StatsType {  
  totalOrders: number  
  pendingOrders: number  
  completedOrders: number  
  totalRevenue: number  
  totalClients: number  
  lowStockItems: number  
}  

export default function DashboardScreen({ navigation }: DashboardScreenProps) {  
  const { user } = useAuth()  
  const [isLoading, setIsLoading] = useState(true)  
  const [refreshing, setRefreshing] = useState(false)  
  const [orders, setOrders] = useState<Order[]>([])  
  const [clients, setClients] = useState<Client[]>([])  
  const [lowStockItems, setLowStockItems] = useState<DashboardInventoryItem[]>([])  
  const [stats, setStats] = useState<StatsType>({  
    totalOrders: 0,  
    pendingOrders: 0,  
    completedOrders: 0,  
    totalRevenue: 0,  
    totalClients: 0,  
    lowStockItems: 0  
  })  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
  
  // Cargar datos del dashboard  
  const loadDashboardData = useCallback(async () => {  
    try {  
      setIsLoading(true)  
      setRefreshing(true)  
      setError(null)  
  
      if (!user?.id) return  
  
      // Validar permisos del usuario  
      const userTallerId = await userService.userService.GET_TALLER_ID(user.id)  
      if (!userTallerId) {
        setError("No se pudo obtener la información del taller")
        return
      }
      const userPermissions = await accessService.accessService.GET_PERMISOS_USUARIO(user.id, userTallerId)  
      setUserRole(userPermissions?.rol || 'client')  
  
      // Cargar datos según el rol del usuario  
      if (userPermissions?.rol === "client") {  
        // Para clientes, solo cargar sus órdenes  
        const clientOrders = await orderService.orderService.getOrdersByClientId(user.id)  
        setOrders(clientOrders)  
  
        // Calcular estadísticas del cliente  
        const pendingOrders = clientOrders.filter(  
          (order: Order) => order.status !== "completed" && order.status !== "delivered"  
        )  
        const completedOrders = clientOrders.filter(  
          (order: Order) => order.status === "completed" || order.status === "delivered"  
        )  
  
        setStats({  
          totalOrders: clientOrders.length,  
          pendingOrders: pendingOrders.length,  
          completedOrders: completedOrders.length,  
          totalRevenue: clientOrders.reduce((sum: number, order: Order) => sum + (order.total || 0), 0),  
          totalClients: 0,  
          lowStockItems: 0  
        })  
      } else {  
        // Para técnicos y administradores, cargar todos los datos  
        const [allOrders, allClients, lowStock] = await Promise.all([  
          orderService.orderService.getAllOrders(),  
          clientService.clientService.getAllClients(),  
          inventoryService.inventoryService.getLowStockItems(),  
        ])  
  
        setOrders(allOrders)  
        setClients(allClients)  
        setLowStockItems(lowStock)  
  
        // Calcular estadísticas generales  
        const pendingOrders = allOrders.filter((order: Order) =>   
          order.status !== "completed" && order.status !== "delivered"  
        )  
        const completedOrders = allOrders.filter(  
          (order: Order) => order.status === "completed" || order.status === "delivered"  
        )  
  
        setStats({  
          totalOrders: allOrders.length,  
          pendingOrders: pendingOrders.length,  
          completedOrders: completedOrders.length,  
          totalRevenue: allOrders.reduce((sum: number, order: Order) => sum + (order.total || 0), 0),  
          totalClients: allClients.length,  
          lowStockItems: lowStock.length  
        })  
      }  
    } catch (error) {  
      console.error("Error al cargar datos del dashboard:", error)  
      setError("No se pudieron cargar los datos. Intente nuevamente.")  
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
  
  // Manejar navegación  
  const handleNavigation = (screen: string) => {  
    switch (screen) {  
      case "orders":  
        navigation.navigate("OrdersTab")  
        break  
      case "clients":  
        navigation.navigate("ClientsTab")  
        break  
      case "inventory":  
        navigation.navigate("InventoryTab")  
        break  
      case "reports":  
        navigation.navigate("ReportsTab")  
        break  
      default:  
        break  
    }  
  }  
  
  if (isLoading) {  
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
        <Feather name="alert-circle" size={64} color="#f44336" />  
        <Text style={styles.errorText}>{error}</Text>  
        <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>  
          <Text style={styles.retryButtonText}>Reintentar</Text>  
        </TouchableOpacity>  
      </View>  
    )  
  }  
  
  return (  
    <ScrollView   
      style={styles.container}  
      refreshControl={  
        <RefreshControl refreshing={refreshing} onRefresh={loadDashboardData} colors={["#1a73e8"]} />  
      }  
    >  
      {/* Header */}  
      <View style={styles.header}>  
        <Text style={styles.welcomeText}>¡Bienvenido!</Text>  
        <Text style={styles.dateText}>{new Date().toLocaleDateString("es-ES")}</Text>  
      </View>  
  
      {/* Estadísticas principales */}  
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
            <Text style={styles.statLabel}>Pendientes</Text>  
          </View>  
        </View>  
  
        <View style={styles.statCard}>  
          <View style={styles.statIconContainer}>  
            <Feather name="check-circle" size={24} color="#4caf50" />  
          </View>  
          <View style={styles.statContent}>  
            <Text style={styles.statValue}>{stats.completedOrders}</Text>  
            <Text style={styles.statLabel}>Completadas</Text>  
          </View>  
        </View>  
  
        <View style={styles.statCard}>  
          <View style={styles.statIconContainer}>  
            <Feather name="dollar-sign" size={24} color="#9c27b0" />  
          </View>  
          <View style={styles.statContent}>  
            <Text style={styles.statValue}>${stats.totalRevenue.toFixed(2)}</Text>  
            <Text style={styles.statLabel}>Ingresos</Text>  
          </View>  
        </View>  
      </View>  
  
      {/* Acciones rápidas */}  
      <View style={styles.quickActionsContainer}>  
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>  
          
        <View style={styles.quickActionsGrid}>  
          <TouchableOpacity style={styles.quickActionCard} onPress={() => handleNavigation("orders")}>  
            <Feather name="plus-circle" size={32} color="#1a73e8" />  
            <Text style={styles.quickActionText}>Nueva Orden</Text>  
          </TouchableOpacity>  
  
          {userRole !== "client" && (  
            <>  
              <TouchableOpacity style={styles.quickActionCard} onPress={() => handleNavigation("clients")}>  
                <Feather name="users" size={32} color="#4caf50" />  
                <Text style={styles.quickActionText}>Clientes</Text>  
              </TouchableOpacity>  
  
              <TouchableOpacity style={styles.quickActionCard} onPress={() => handleNavigation("inventory")}>  
                <Feather name="package" size={32} color="#f5a623" />  
                <Text style={styles.quickActionText}>Inventario</Text>  
              </TouchableOpacity>  
  
              <TouchableOpacity style={styles.quickActionCard} onPress={() => handleNavigation("reports")}>  
                <Feather name="bar-chart-2" size={32} color="#9c27b0" />  
                <Text style={styles.quickActionText}>Reportes</Text>  
              </TouchableOpacity>  
            </>  
          )}  
        </View>  
      </View>  
  
      {/* Órdenes recientes */}  
      <View style={styles.recentContainer}>  
        <View style={styles.sectionHeader}>  
          <Text style={styles.sectionTitle}>Órdenes Recientes</Text>  
          <TouchableOpacity onPress={() => handleNavigation("orders")}>  
            <Text style={styles.seeAllText}>Ver todas</Text>  
          </TouchableOpacity>  
        </View>  
  
        {orders.length > 0 ? (  
          orders.slice(0, 5).map((order: Order) => (  
            <TouchableOpacity  
              key={order.id}  
              style={styles.orderCard}  
              onPress={() =>  
                navigation.navigate("OrdersTab", {  
                  screen: "OrderDetail",  
                  params: { orderId: order.id },  
                })  
              }  
            >  
              <View style={styles.orderInfo}>  
                <Text style={styles.orderNumber}>#{order.number}</Text>  
                <Text style={styles.orderDescription} numberOfLines={1}>  
                  {order.description}  
                </Text>  
                <Text style={styles.orderDate}>  
                  {new Date(order.createdAt).toLocaleDateString("es-ES")}  
                </Text>  
              </View>  
              <View style={styles.orderStatus}>  
                <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>  
                  {getStatusText(order.status)}  
                </Text>  
                <Text style={styles.orderAmount}>${(order.total || 0).toFixed(2)}</Text>  
              </View>  
            </TouchableOpacity>  
          ))  
        ) : (  
          <View style={styles.emptyState}>  
            <Feather name="clipboard" size={48} color="#ccc" />  
            <Text style={styles.emptyText}>No hay órdenes registradas</Text>  
          </View>  
        )}  
      </View>  
  
      {userRole !== "client" && (  
        <>  
          {/* Clientes recientes */}  
          <View style={styles.recentContainer}>  
            <View style={styles.sectionHeader}>  
              <Text style={styles.sectionTitle}>Clientes Recientes</Text>  
              <TouchableOpacity onPress={() => handleNavigation("clients")}>  
                <Text style={styles.seeAllText}>Ver todos</Text>  
              </TouchableOpacity>  
            </View>  
  
            {clients.length > 0 ? (  
              clients.slice(0, 3).map((client: Client) => (  
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
  
          {/* Inventario bajo */}  
          <View style={styles.recentContainer}>  
            <View style={styles.sectionHeader}>  
              <Text style={styles.sectionTitle}>Inventario Bajo</Text>  
              <TouchableOpacity onPress={() => handleNavigation("inventory")}>  
                <Text style={styles.seeAllText}>Ver inventario</Text>  
              </TouchableOpacity>  
            </View>  
  
            {lowStockItems.length > 0 ? (  
              lowStockItems.slice(0, 3).map((item: DashboardInventoryItem) => (  
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
                    <Text style={styles.inventorySku}>Stock: {item.stock}</Text>  
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
    </ScrollView>  
  )  
  
  // Función para obtener color del estado  
  function getStatusColor(status: string) {  
    switch (status) {  
      case "reception":  
        return "#1a73e8"  
      case "diagnosis":  
        return "#f5a623"  
      case "waiting_parts":  
        return "#9c27b0"  
      case "in_progress":  
        return "#ff9800"  
      case "quality_check":  
        return "#607d8b"  
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

  // Función para obtener texto del estado  
  function getStatusText(status: string) {  
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
        return "Control Calidad"  
      case "completed":  
        return "Completada"  
      case "delivered":  
        return "Entregada"  
      case "cancelled":  
        return "Cancelada"  
      default:  
        return status  
    }  
  }  
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
    alignItems: "center",  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
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
  quickActionsGrid: {  
    flexDirection: "row",  
    flexWrap: "wrap",  
    justifyContent: "space-between",  
  },  
  quickActionCard: {  
    backgroundColor: "#fff",  
    borderRadius: 8,  
    padding: 16,  
    width: "48%",  
    alignItems: "center",  
    marginBottom: 12,  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 1 },  
    shadowOpacity: 0.1,  
    shadowRadius: 2,  
    elevation: 2,  
  },  
  quickActionText: {  
    fontSize: 14,  
    color: "#333",  
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
    flexDirection: "row",  
    alignItems: "center",  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 1 },  
    shadowOpacity: 0.1,  
    shadowRadius: 2,  
    elevation: 2,  
  },  
  orderInfo: {  
    flex: 1,  
  },  
  orderNumber: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 4,  
  },  
  orderDescription: {  
    fontSize: 14,  
    color: "#666",  
    marginBottom: 4,  
  },  
  orderDate: {  
    fontSize: 12,  
    color: "#999",  
  },  
  orderStatus: {  
    alignItems: "flex-end",  
  },  
  statusText: {  
    fontSize: 12,  
    fontWeight: "500",  
    marginBottom: 4,  
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