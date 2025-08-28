"use client"  
import { useState, useCallback } from "react"  
import {  
  View,  
  Text,  
  FlatList,  
  TouchableOpacity,  
  TextInput,  
  StyleSheet,  
  ActivityIndicator,  
  RefreshControl,  
  Alert,  
} from "react-native"  
import { Feather, MaterialIcons } from "@expo/vector-icons"  
import { useFocusEffect } from "@react-navigation/native"  
import { StackNavigationProp } from '@react-navigation/stack'  
import { RouteProp } from '@react-navigation/native'  
import { useAuth } from "../context/auth-context"  
import { orderService } from "../services/supabase/order-service"  
import { clientService } from "../services/supabase/client-service"  
import { vehicleService } from "../services/supabase/vehicle-service"  
import accessService from "../services/supabase/access-service"  
import userService from "../services/supabase/user-service"  
import { RootStackParamList } from '../types/navigation'  
import { Order } from '../types/order'  
// ✅ CORREGIDO: Importar desde servicios centralizados  
import { Client } from '../services/supabase/client-service'  
import { Vehicle } from '../services/supabase/vehicle-service'  
  
type OrderHistoryNavigationProp = StackNavigationProp<RootStackParamList, 'OrderHistory'>  
type OrderHistoryRouteProp = RouteProp<RootStackParamList, 'OrderHistory'>  
  
interface Props {  
  navigation: OrderHistoryNavigationProp  
  route: OrderHistoryRouteProp  
}  
  
interface EnhancedOrder extends Order {  
  clientName?: string  
  vehicleInfo?: string  
}  
  
export default function OrderHistoryScreen({ navigation, route }: Props) {  
  const { user } = useAuth()  
  const [loading, setLoading] = useState(true)  
  const [refreshing, setRefreshing] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
  const [orders, setOrders] = useState<EnhancedOrder[]>([])  
  const [filteredOrders, setFilteredOrders] = useState<EnhancedOrder[]>([])  
  const [searchTerm, setSearchTerm] = useState("")  
  const [selectedStatus, setSelectedStatus] = useState<string>("all")  
  
  const loadOrderHistory = useCallback(async () => {  
    try {  
      setLoading(true)  
      setError(null)  
      if (!user?.id) return  
  
      // Validar permisos del usuario  
      const userId = user.id as string  
      const userTallerId = await userService.GET_TALLER_ID(userId)  
      if (!userTallerId) {  
        setError("No se pudo obtener la información del taller")  
        return  
      }  
  
      const userPermissions = await accessService.GET_PERMISOS_USUARIO(userId, userTallerId)  
      // ✅ CORREGIDO: Usar 'role' en lugar de 'rol'  
      setUserRole(userPermissions?.role || 'client')  
  
      // Cargar órdenes según el rol  
      let ordersData: Order[] = []  
      if (userPermissions?.role === 'client') {  
        // Cliente: solo sus órdenes  
        const client = await clientService.getClientByUserId(userId)  
        if (client) {  
          ordersData = await orderService.getOrdersByClientId(client.id)  
        }  
      } else {  
        // Staff: todas las órdenes completadas/entregadas  
        ordersData = await orderService.getAllOrders()  
        ordersData = ordersData.filter(order =>  
          order.status === 'completed' || order.status === 'delivered'  
        )  
      }  
  
      // Cargar datos relacionados para cada orden  
      const [clients, vehicles] = await Promise.all([  
        clientService.getAllClients(),  
        vehicleService.getAllVehicles()  
      ])  
  
      // Enriquecer órdenes con información de cliente y vehículo  
      const enhancedOrders: EnhancedOrder[] = ordersData.map(order => {  
        const client = clients.find(c => c.id === order.clientId)  
        const vehicle = vehicles.find(v => v.id === order.vehicleId)  
        return {  
          ...order,  
          clientName: client?.name || "Cliente no especificado",  
          // ✅ CORREGIDO: Usar campos reales del schema de vehículos  
          vehicleInfo: vehicle ? `${vehicle.marca} ${vehicle.modelo}` : "Vehículo no especificado"  
        }  
      })  
  
      // Ordenar por fecha de creación (más recientes primero)  
      enhancedOrders.sort((a, b) =>  
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()  
      )  
  
      setOrders(enhancedOrders)  
      setFilteredOrders(enhancedOrders)  
    } catch (error) {  
      console.error("Error loading order history:", error)  
      setError("No se pudo cargar el historial de órdenes")  
    } finally {  
      setLoading(false)  
      setRefreshing(false)  
    }  
  }, [user])  
  
  useFocusEffect(  
    useCallback(() => {  
      loadOrderHistory()  
    }, [loadOrderHistory])  
  )  
  
  const filterOrders = useCallback(() => {  
    let filtered = orders  
  
    // Filtrar por término de búsqueda  
    if (searchTerm) {  
      filtered = filtered.filter(order =>  
  (order.number ?? order.id)?.toLowerCase().includes(searchTerm.toLowerCase()) ||  
        order.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||  
        order.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||  
        order.vehicleInfo?.toLowerCase().includes(searchTerm.toLowerCase())  
      )  
    }  
  
    // Filtrar por estado  
    if (selectedStatus !== "all") {  
      filtered = filtered.filter(order => order.status === selectedStatus)  
    }  
  
    setFilteredOrders(filtered)  
  }, [orders, searchTerm, selectedStatus])  
  
  // Aplicar filtros cuando cambien las dependencias  
  useFocusEffect(  
    useCallback(() => {  
      filterOrders()  
    }, [filterOrders])  
  )  
  
  const handleOrderPress = (order: EnhancedOrder) => {  
    navigation.navigate("OrderDetail", { orderId: order.id })  
  }  
  
  const onRefresh = () => {  
    setRefreshing(true)  
    loadOrderHistory()  
  }  
  
  const getStatusColor = (status: string) => {  
    switch (status) {  
      case 'completed': return '#4caf50'  
      case 'delivered': return '#8bc34a'  
      case 'cancelled': return '#f44336'  
      default: return '#666'  
    }  
  }  
  
  const getStatusText = (status: string) => {  
    switch (status) {  
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
  
  const renderOrderItem = ({ item }: { item: EnhancedOrder }) => (  
    <TouchableOpacity  
      style={styles.orderCard}  
      onPress={() => handleOrderPress(item)}  
    >  
      <View style={styles.orderHeader}>  
        <Text style={styles.orderNumber}>#{item.number || item.id.slice(0, 8)}</Text>  
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>  
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>  
        </View>  
      </View>  
  
      <Text style={styles.orderDescription} numberOfLines={2}>  
        {item.description || 'Sin descripción'}  
      </Text>  
  
      <View style={styles.orderDetails}>  
        <Text style={styles.orderDetailText}>{item.clientName || "Cliente no especificado"}</Text>  
        <Text style={styles.orderDetailText}>{item.vehicleInfo || "Vehículo no especificado"}</Text>  
      </View>  
  
      <View style={styles.orderFooter}>  
        <Text style={styles.orderDate}>  
          {new Date(item.createdAt).toLocaleDateString('es-ES')}  
        </Text>  
        {item.total && (  
          <Text style={styles.orderTotal}>{formatCurrency(item.total)}</Text>  
        )}  
      </View>  
    </TouchableOpacity>  
  )  
  
  if (loading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#1a73e8" />  
        <Text style={styles.loadingText}>Cargando historial...</Text>  
      </View>  
    )  
  }  
  
  if (error) {  
    return (  
      <View style={styles.errorContainer}>  
        <MaterialIcons name="error" size={64} color="#f44336" />  
        <Text style={styles.errorText}>{error}</Text>  
        <TouchableOpacity style={styles.retryButton} onPress={loadOrderHistory}>  
          <Text style={styles.retryButtonText}>Reintentar</Text>  
        </TouchableOpacity>  
      </View>  
    )  
  }  
  
  return (  
    <View style={styles.container}>  
      {/* Header con búsqueda */}  
      <View style={styles.header}>  
        <View style={styles.searchContainer}>  
          <Feather name="search" size={20} color="#666" />  
          <TextInput  
            style={styles.searchInput}  
            placeholder="Buscar órdenes..."  
            value={searchTerm}  
            onChangeText={setSearchTerm}  
          />  
        </View>  
      </View>  
  
      {/* Filtros de estado */}  
      <View style={styles.filtersContainer}>  
        <Text style={styles.filterLabel}>Filtrar por estado:</Text>  
        <View style={styles.statusFilters}>  
          {[  
            { key: "all", label: "Todas" },  
            { key: "completed", label: "Completadas" },  
            { key: "delivered", label: "Entregadas" },  
            { key: "cancelled", label: "Canceladas" },  
          ].map((filter) => (  
            <TouchableOpacity  
              key={filter.key}  
              style={[  
                styles.filterButton,  
                selectedStatus === filter.key && styles.filterButtonSelected  
              ]}  
              onPress={() => setSelectedStatus(filter.key)}  
            >  
              <Text style={[  
                styles.filterButtonText,  
                selectedStatus === filter.key && styles.filterButtonTextSelected  
              ]}>  
                {filter.label}  
              </Text>  
            </TouchableOpacity>  
          ))}  
        </View>  
      </View>  
  
      {/* Lista de órdenes */}  
      <FlatList  
        data={filteredOrders}  
        renderItem={renderOrderItem}  
        keyExtractor={(item) => item.id}  
        contentContainerStyle={styles.listContainer}  
        refreshControl={  
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />  
        }  
        ListEmptyComponent={  
          <View style={styles.emptyContainer}>  
            <Feather name="clipboard" size={64} color="#ccc" />  
            <Text style={styles.emptyText}>  
              {searchTerm || selectedStatus !== "all"  
                ? "No se encontraron órdenes con los filtros aplicados"  
                : "No hay órdenes en el historial"}  
            </Text>  
          </View>  
        }  
      />  
    </View>  
  )  
}  
  
// Estilos del Order History Screen  
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
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    backgroundColor: "#fff",  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  searchContainer: {  
    flexDirection: "row",  
    alignItems: "center",  
    backgroundColor: "#f5f5f5",  
    borderRadius: 8,  
    paddingHorizontal: 12,  
    paddingVertical: 8,  
  },  
  searchInput: {  
    flex: 1,  
    marginLeft: 8,  
    fontSize: 16,  
    color: "#333",  
  },  
  filtersContainer: {  
    backgroundColor: "#fff",  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  filterLabel: {  
    fontSize: 14,  
    fontWeight: "600",  
    color: "#333",  
    marginBottom: 8,  
  },  
  statusFilters: {  
    flexDirection: "row",  
    flexWrap: "wrap",  
    gap: 8,  
  },  
  filterButton: {  
    paddingHorizontal: 12,  
    paddingVertical: 6,  
    backgroundColor: "#f5f5f5",  
    borderRadius: 16,  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  filterButtonSelected: {  
    backgroundColor: "#1a73e8",  
    borderColor: "#1a73e8",  
  },  
  filterButtonText: {  
    fontSize: 14,  
    color: "#666",  
    fontWeight: "500",  
  },  
  filterButtonTextSelected: {  
    color: "#fff",  
    fontWeight: "600",  
  },  
  listContainer: {  
    padding: 16,  
  },  
  orderCard: {  
    backgroundColor: "#fff",  
    borderRadius: 12,  
    padding: 16,  
    marginBottom: 12,  
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
    marginBottom: 8,  
  },  
  orderNumber: {  
    fontSize: 18,  
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
    marginBottom: 12,  
    lineHeight: 20,  
  },  
  orderDetails: {  
    marginBottom: 12,  
  },  
  orderDetailText: {  
    fontSize: 14,  
    color: "#888",  
    marginBottom: 4,  
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
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#4caf50",  
  },  
  emptyContainer: {  
    flex: 1,  
    justifyContent: "center",  
    alignItems: "center",  
    padding: 40,  
  },  
  emptyText: {  
    fontSize: 18,  
    color: "#999",  
    marginTop: 16,  
    textAlign: "center",  
  },  
})