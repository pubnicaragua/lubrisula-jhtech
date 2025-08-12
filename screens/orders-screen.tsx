"use client"  
  
import { useState, useCallback, useEffect } from "react"  
import {  
  View,  
  Text,  
  FlatList,  
  TouchableOpacity,  
  StyleSheet,  
  ActivityIndicator,  
  RefreshControl,  
  Alert,  
  TextInput,  
  Modal,  
} from "react-native"  
import { Feather, MaterialIcons } from "@expo/vector-icons"  
import { useFocusEffect } from "@react-navigation/native"  
import { StackNavigationProp } from "@react-navigation/stack"  
import { useAuth } from "../context/auth-context"  
import { orderService } from "../services/supabase/order-service"  
import ACCESOS_SERVICES from "../services/supabase/access-service"  
import USER_SERVICE from "../services/supabase/user-service"  
import { Order, OrderStatus } from '../types/order'  
import { RootStackParamList } from '../types/navigation'  
  
interface OrdersScreenProps {  
  navigation: StackNavigationProp<RootStackParamList>  
}  
  
export default function OrdersScreen({ navigation }: OrdersScreenProps) {  
  const { user } = useAuth()  
  const [orders, setOrders] = useState<Order[]>([])  
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])  
  const [loading, setLoading] = useState(true)  
  const [refreshing, setRefreshing] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
  const [searchTerm, setSearchTerm] = useState("")  
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all")  
  const [filterModalVisible, setFilterModalVisible] = useState(false)  
  
  const loadOrders = useCallback(async () => {  
    try {  
      setLoading(true)  
      setError(null)  
  
      if (!user?.id) return  
  
      // Validar permisos del usuario siguiendo el patrón establecido  
      const userId = user.id as string  
      const userTallerId = await USER_SERVICE.GET_TALLER_ID(userId)  
        
      if (!userTallerId) {  
        setError("No se pudo obtener la información del taller")  
        return  
      }  
        
      const userPermissions = await ACCESOS_SERVICES.GET_PERMISOS_USUARIO(userId, userTallerId)  
      setUserRole(userPermissions?.rol || 'client')  
  
      let ordersData: Order[] = []  
  
      if (userPermissions?.rol === 'client') {  
        // Los clientes solo ven sus propias órdenes  
        ordersData = await orderService.getOrdersByClientId(userId)  
      } else {  
        // Staff ve todas las órdenes del taller  
        ordersData = await orderService.getAllOrders()  
      }  
  
      setOrders(ordersData)  
      setFilteredOrders(ordersData)  
  
    } catch (error) {  
      console.error("Error loading orders:", error)  
      setError("No se pudieron cargar las órdenes")  
    } finally {  
      setLoading(false)  
      setRefreshing(false)  
    }  
  }, [user])  
  
  useFocusEffect(  
    useCallback(() => {  
      loadOrders()  
    }, [loadOrders])  
  )  
  
  const applyFilters = useCallback(() => {  
    let filtered = orders  
  
    if (filterStatus !== "all") {  
      filtered = filtered.filter(order => order.status === filterStatus)  
    }  
  
    if (searchTerm.trim() !== "") {  
      filtered = filtered.filter(order =>  
        order.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||  
        order.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||  
        order.clientName?.toLowerCase().includes(searchTerm.toLowerCase())  
      )  
    }  
  
    setFilteredOrders(filtered)  
  }, [orders, filterStatus, searchTerm])  
  
  useEffect(() => {  
    applyFilters()  
  }, [applyFilters])  
  
  const getStatusColor = (status: string) => {  
    switch (status) {  
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
  
  const getStatusText = (status: string) => {  
    switch (status) {  
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
  
  const formatCurrency = (amount: number) => {  
    return amount.toLocaleString("es-ES", {  
      style: "currency",  
      currency: "USD",  
      minimumFractionDigits: 2,  
    })  
  }  
  
  const renderOrderItem = ({ item }: { item: Order }) => (  
    <TouchableOpacity  
      style={styles.orderCard}  
      onPress={() => navigation.navigate("OrderDetail", { orderId: item.id })}  
    >  
      <View style={styles.orderHeader}>  
        <Text style={styles.orderNumber}>Orden #{item.number}</Text>  
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>  
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>  
        </View>  
      </View>  
  
      <Text style={styles.orderDescription} numberOfLines={2}>  
        {item.description}  
      </Text>  
  
      <View style={styles.orderDetails}>  
        <View style={styles.orderDetailItem}>  
          <Feather name="user" size={14} color="#666" />  
          <Text style={styles.orderDetailText}>{item.clientName || "Cliente no especificado"}</Text>  
        </View>  
        <View style={styles.orderDetailItem}>  
          <Feather name="truck" size={14} color="#666" />  
          <Text style={styles.orderDetailText}>{item.vehicleInfo || "Vehículo no especificado"}</Text>  
        </View>  
      </View>  
  
      <View style={styles.orderFooter}>  
        <Text style={styles.orderDate}>  
          {new Date(item.createdAt).toLocaleDateString("es-ES")}  
        </Text>  
        <Text style={styles.orderAmount}>{formatCurrency(item.total || 0)}</Text>  
      </View>  
    </TouchableOpacity>  
  )  
  
  if (loading) {  
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
        <MaterialIcons name="error" size={64} color="#f44336" />  
        <Text style={styles.errorText}>{error}</Text>  
        <TouchableOpacity style={styles.retryButton} onPress={loadOrders}>  
          <Text style={styles.retryButtonText}>Reintentar</Text>  
        </TouchableOpacity>  
      </View>  
    )  
  }  
  
  return (  
    <View style={styles.container}>  
      <View style={styles.header}>  
        <Text style={styles.headerTitle}>Órdenes de Trabajo</Text>  
        {userRole !== 'client' && (  
          <TouchableOpacity  
            style={styles.addButton}  
            onPress={() => navigation.navigate("NewOrder")}  
          >  
            <Feather name="plus" size={24} color="#fff" />  
          </TouchableOpacity>  
        )}  
      </View>  
  
      <View style={styles.searchContainer}>  
        <View style={styles.searchInputContainer}>  
          <Feather name="search" size={20} color="#666" />  
          <TextInput  
            style={styles.searchInput}  
            placeholder="Buscar órdenes..."  
            value={searchTerm}  
            onChangeText={setSearchTerm}  
          />  
        </View>  
        <TouchableOpacity  
          style={styles.filterButton}  
          onPress={() => setFilterModalVisible(true)}  
        >  
          <Feather name="filter" size={20} color="#1a73e8" />  
        </TouchableOpacity>  
      </View>  
  
      <FlatList  
        data={filteredOrders}  
        renderItem={renderOrderItem}  
        keyExtractor={(item) => item.id}  
        contentContainerStyle={styles.listContainer}  
        refreshControl={  
          <RefreshControl refreshing={refreshing} onRefresh={loadOrders} />  
        }  
        ListEmptyComponent={  
          <View style={styles.emptyContainer}>  
            <Feather name="clipboard" size={64} color="#ccc" />  
            <Text style={styles.emptyText}>No hay órdenes disponibles</Text>  
          </View>  
        }  
      />  
    </View>  
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
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "space-between",  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    backgroundColor: "#fff",  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  headerTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  addButton: {  
    width: 40,  
    height: 40,  
    borderRadius: 20,  
    backgroundColor: "#1a73e8",  
    justifyContent: "center",  
    alignItems: "center",  
  },  
  searchContainer: {  
    flexDirection: "row",  
    alignItems: "center",  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    backgroundColor: "#fff",  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  searchInputContainer: {  
    flex: 1,  
    flexDirection: "row",  
    alignItems: "center",  
    backgroundColor: "#f5f5f5",  
    borderRadius: 8,  
    paddingHorizontal: 12,  
    paddingVertical: 8,  
    marginRight: 12,  
  },  
  searchInput: {  
    flex: 1,  
    marginLeft: 8,  
    fontSize: 16,  
    color: "#333",  
  },  
  filterButton: {  
    width: 40,  
    height: 40,  
    borderRadius: 8,  
    backgroundColor: "#e8f0fe",  
    justifyContent: "center",  
    alignItems: "center",  
  },  
  listContainer: {  
    padding: 16,  
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
    color: "#fff",  
    fontSize: 12,  
    fontWeight: "bold",  
  },  
  orderDescription: {  
    fontSize: 14,  
    color: "#666",  
    marginBottom: 12,  
  },  
  orderDetails: {  
    marginBottom: 12,  
  },  
  orderDetailItem: {  
    flexDirection: "row",  
    alignItems: "center",  
    marginBottom: 4,  
  },  
  orderDetailText: {  
    fontSize: 14,  
    color: "#666",  
    marginLeft: 6,  
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
  modalContainer: {  
    flex: 1,  
    backgroundColor: "#fff",  
  },  
  modalHeader: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    padding: 16,  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  modalTitle: {  
    fontSize: 20,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  closeButton: {  
    padding: 8,  
  },  
  modalContent: {  
    flex: 1,  
    padding: 16,  
  },  
  filterSectionTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 16,  
  },  
  filterOption: {  
    paddingVertical: 12,  
    paddingHorizontal: 16,  
    borderRadius: 8,  
    marginBottom: 8,  
    backgroundColor: "#f5f5f5",  
  },  
  filterOptionSelected: {  
    backgroundColor: "#1a73e8",  
  },  
  filterOptionText: {  
    fontSize: 16,  
    color: "#333",  
  },  
  filterOptionTextSelected: {  
    color: "#fff",  
    fontWeight: "bold",  
  },  
})