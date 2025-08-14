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
import ACCESOS_SERVICES from "../services/supabase/access-service"  
import USER_SERVICE from "../services/supabase/user-service"  
import { RootStackParamList } from '../types/navigation'  
import { Order } from '../types/order'  
// ✅ CORREGIDO: Importar desde types/entities en lugar de types/client  
import { Client } from '../types/entities'  
import { Vehicle } from '../types/entities'  
  
type OrdersNavigationProp = StackNavigationProp<RootStackParamList, 'Orders'>  
type OrdersRouteProp = RouteProp<RootStackParamList, 'Orders'>  
  
interface Props {  
  navigation: OrdersNavigationProp  
  route: OrdersRouteProp  
}  
  
interface EnhancedOrder extends Order {  
  clientName?: string  
  vehicleInfo?: string  
}  
  
export default function OrdersScreen({ navigation, route }: Props) {  
  const { user } = useAuth()  
  const [loading, setLoading] = useState(true)  
  const [refreshing, setRefreshing] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
  const [orders, setOrders] = useState<EnhancedOrder[]>([])  
  const [filteredOrders, setFilteredOrders] = useState<EnhancedOrder[]>([])  
  const [searchTerm, setSearchTerm] = useState("")  
  const [selectedStatus, setSelectedStatus] = useState<string>("all")  
  
  const loadOrders = useCallback(async () => {  
    try {  
      setLoading(true)  
      setError(null)  
  
      if (!user?.id) return  
  
      // Validar permisos del usuario  
      const userId = user.id as string  
      const userTallerId = await USER_SERVICE.GET_TALLER_ID(userId)  
      if (!userTallerId) {  
        setError("No se pudo obtener la información del taller")  
        return  
      }  
  
      const userPermissions = await ACCESOS_SERVICES.GET_PERMISOS_USUARIO(userId, userTallerId)  
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
        // Staff: todas las órdenes  
        ordersData = await orderService.getAllOrders()  
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
        // ✅ CORREGIDO: Usar createdAt en lugar de created_at  
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()  
      )  
  
      setOrders(enhancedOrders)  
      setFilteredOrders(enhancedOrders)  
  
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
  
  const filterOrders = useCallback(() => {  
    let filtered = orders  
  
    // Filtrar por término de búsqueda  
    if (searchTerm) {  
      filtered = filtered.filter(order =>  
        // ✅ CORREGIDO: Usar 'id' en lugar de 'orderNumber' que no existe  
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||  
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
  
  const handleAddOrder = () => {  
    navigation.navigate("NewOrder")  
  }  
  
  const onRefresh = () => {  
    setRefreshing(true)  
    loadOrders()  
  }  
  
  const getStatusColor = (status: string) => {  
    switch (status) {  
      case 'reception': return '#ff9800'  
      case 'diagnosis': return '#2196f3'  
      case 'waiting_parts': return '#9c27b0'  
      case 'in_progress': return '#ff5722'  
      case 'quality_check': return '#607d8b'  
      case 'completed': return '#4caf50'  
      case 'delivered': return '#8bc34a'  
      case 'cancelled': return '#f44336'  
      default: return '#666'  
    }  
  }  
  
  const getStatusText = (status: string) => {  
    switch (status) {  
      case 'reception': return 'Recepción'  
      case 'diagnosis': return 'Diagnóstico'  
      case 'waiting_parts': return 'Esperando Repuestos'  
      case 'in_progress': return 'En Proceso'  
      case 'quality_check': return 'Control de Calidad'  
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
        {/* ✅ CORREGIDO: Usar 'id' en lugar de 'orderNumber' que no existe */}  
        <Text style={styles.orderNumber}>#{item.id.slice(0, 8)}</Text>  
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
          {/* ✅ CORREGIDO: Usar createdAt en lugar de created_at */}  
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
        {userRole !== 'client' && (  
          <TouchableOpacity style={styles.addButton} onPress={handleAddOrder}>  
            <Feather name="plus" size={24} color="#fff" />  
          </TouchableOpacity>  
        )}  
      </View>  
  
      {/* Filtros de estado */}  
      <View style={styles.filtersContainer}>  
        <Text style={styles.filterLabel}>Filtrar por estado:</Text>  
        <View style={styles.statusFilters}>  
          {[  
            { key: "all", label: "Todas" },  
            { key: "reception", label: "Recepción" },  
            { key: "diagnosis", label: "Diagnóstico" },  
            { key: "in_progress", label: "En Proceso" },  
            { key: "completed", label: "Completadas" },  
            { key: "delivered", label: "Entregadas" },  
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
                : "No hay órdenes disponibles"}  
            </Text>  
            {userRole !== 'client' && (  
              <TouchableOpacity style={styles.emptyButton} onPress={handleAddOrder}>  
                <Text style={styles.emptyButtonText}>Crear Primera Orden</Text>  
              </TouchableOpacity>  
            )}  
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
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    backgroundColor: "#fff",  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  searchContainer: {  
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
  addButton: {  
    backgroundColor: "#1a73e8",  
    width: 48,  
    height: 48,  
    borderRadius: 24,  
    justifyContent: "center",  
    alignItems: "center",  
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
    marginBottom: 20,  
    textAlign: "center",  
  },  
  emptyButton: {  
    backgroundColor: "#1a73e8",  
    paddingHorizontal: 20,  
    paddingVertical: 12,  
    borderRadius: 8,  
  },  
  emptyButtonText: {  
    color: "#fff",  
    fontWeight: "bold",  
    fontSize: 16,  
  },  
})