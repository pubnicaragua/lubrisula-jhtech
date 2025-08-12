"use client"  
  
import { useState, useCallback } from "react"  
import {  
  View,  
  Text,  
  FlatList,  
  TouchableOpacity,  
  StyleSheet,  
  ActivityIndicator,  
  Alert,  
  Modal,  
  TextInput,  
  RefreshControl,  
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
import { Order, OrderStatus } from '../types/order'  
import { Client } from '../types/client'  
import { Vehicle } from '../types/vehicle'  
  
// ✅ CORREGIDO: Tipado estricto de navegación  
type OrderStatusNavigationProp = StackNavigationProp<RootStackParamList, 'OrderStatus'>  
type OrderStatusRouteProp = RouteProp<RootStackParamList, 'OrderStatus'>  
  
interface Props {  
  navigation: OrderStatusNavigationProp  
  route: OrderStatusRouteProp  
}  
  
interface EnhancedOrder extends Order {  
  clientName?: string  
  vehicleInfo?: string  
}  
  
const ORDER_STATUSES = [  
  { id: 'reception', label: 'Recepción', color: '#ff9800', icon: 'inbox' },  
  { id: 'diagnosis', label: 'Diagnóstico', color: '#2196f3', icon: 'search' },  
  { id: 'waiting_parts', label: 'Esperando Repuestos', color: '#9c27b0', icon: 'clock' },  
  { id: 'in_progress', label: 'En Proceso', color: '#ff5722', icon: 'tool' },  
  { id: 'quality_check', label: 'Control de Calidad', color: '#607d8b', icon: 'check-circle' },  
  { id: 'completed', label: 'Completada', color: '#4caf50', icon: 'check' },  
  { id: 'delivered', label: 'Entregada', color: '#8bc34a', icon: 'truck' },  
  { id: 'cancelled', label: 'Cancelada', color: '#f44336', icon: 'x-circle' },  
]  
  
export default function OrderStatusScreen({ navigation, route }: Props) {  
  const { user } = useAuth()  
  const [loading, setLoading] = useState(true)  
  const [refreshing, setRefreshing] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
  const [orders, setOrders] = useState<EnhancedOrder[]>([])  
  const [filteredOrders, setFilteredOrders] = useState<EnhancedOrder[]>([])  
  const [selectedStatus, setSelectedStatus] = useState<string>("all")  
  const [showStatusModal, setShowStatusModal] = useState(false)  
  const [selectedOrder, setSelectedOrder] = useState<EnhancedOrder | null>(null)  
  const [statusNote, setStatusNote] = useState("")  
  
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
      setUserRole(userPermissions?.rol || 'client')  
  
      // Cargar órdenes según el rol  
      let ordersData: Order[] = []  
        
      if (userPermissions?.rol === 'client') {  
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
          vehicleInfo: vehicle ? `${vehicle.make} ${vehicle.model}` : "Vehículo no especificado"  
        }  
      })  
  
      // Ordenar por fecha de creación (más recientes primero)  
      enhancedOrders.sort((a, b) =>   
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()  
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
  
    // Filtrar por estado  
    if (selectedStatus !== "all") {  
      filtered = filtered.filter(order => order.status === selectedStatus)  
    }  
  
    setFilteredOrders(filtered)  
  }, [orders, selectedStatus])  
  
  // Aplicar filtros cuando cambien las dependencias  
  useFocusEffect(  
    useCallback(() => {  
      filterOrders()  
    }, [filterOrders])  
  )  
  
  const getStatusInfo = (status: string) => {  
    return ORDER_STATUSES.find(s => s.id === status) || ORDER_STATUSES[0]  
  }  
  
  const handleStatusChange = (order: EnhancedOrder, newStatus: string) => {  
    if (userRole === 'client') {  
      Alert.alert("Error", "No tienes permisos para cambiar el estado de las órdenes")  
      return  
    }  
  
    setSelectedOrder(order)  
    setStatusNote("")  
    setShowStatusModal(true)  
  }  
  
  const confirmStatusChange = async (newStatus: string) => {  
    if (!selectedOrder) return  
  
    try {  
      await orderService.updateOrder(selectedOrder.id, {   
        status: newStatus as OrderStatus,  
        notes: statusNote.trim() || undefined  
      })  
          
      // Actualizar orden local  
      setOrders(prev =>   
        prev.map(order =>   
          order.id === selectedOrder.id   
            ? { ...order, status: newStatus as OrderStatus }  
            : order  
        )  
      )  
  
      setShowStatusModal(false)  
      setSelectedOrder(null)  
      setStatusNote("")  
  
      Alert.alert("Éxito", "Estado de la orden actualizado correctamente")  
    } catch (error) {  
      console.error("Error updating order status:", error)  
      Alert.alert("Error", "No se pudo actualizar el estado de la orden")  
    }  
  }  
  
  const handleOrderPress = (order: EnhancedOrder) => {  
    navigation.navigate("OrderDetail", { orderId: order.id })  
  }  
  
  const onRefresh = () => {  
    setRefreshing(true)  
    loadOrders()  
  }  
  
  const renderOrderItem = ({ item }: { item: EnhancedOrder }) => {  
    const statusInfo = getStatusInfo(item.status)  
      
    return (  
      <TouchableOpacity  
        style={styles.orderCard}  
        onPress={() => handleOrderPress(item)}  
      >  
        <View style={styles.orderHeader}>  
          <Text style={styles.orderNumber}>#{item.orderNumber || item.id.slice(0, 8)}</Text>  
          <TouchableOpacity  
            style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}  
            onPress={() => userRole !== 'client' && handleStatusChange(item, item.status)}  
            disabled={userRole === 'client'}  
          >  
            <Feather name={statusInfo.icon as any} size={12} color="#fff" />  
            <Text style={styles.statusText}>{statusInfo.label}</Text>  
          </TouchableOpacity>  
        </View>  
  
        <Text style={styles.orderDescription} numberOfLines={2}>  
          {item.description || 'Sin descripción'}  
        </Text>  
  
        <View style={styles.orderDetails}>  
          <Text style={styles.orderDetailText}>{item.clientName}</Text>  
          <Text style={styles.orderDetailText}>{item.vehicleInfo}</Text>  
        </View>  
  
        <View style={styles.orderFooter}>  
          <Text style={styles.orderDate}>  
            {new Date(item.created_at).toLocaleDateString('es-ES')}  
          </Text>  
          {item.total && (  
            <Text style={styles.orderTotal}>  
              ${item.total.toFixed(2)}  
            </Text>  
          )}  
        </View>  
      </TouchableOpacity>  
    )  
  }  
  
  const renderStatusModal = () => (  
    <Modal  
      visible={showStatusModal}  
      animationType="slide"  
      transparent={true}  
      onRequestClose={() => setShowStatusModal(false)}  
    >  
      <View style={styles.modalOverlay}>  
        <View style={styles.modalContainer}>  
          <View style={styles.modalHeader}>  
            <Text style={styles.modalTitle}>Cambiar Estado</Text>  
            <TouchableOpacity onPress={() => setShowStatusModal(false)}>  
              <Feather name="x" size={24} color="#333" />  
            </TouchableOpacity>  
          </View>  
  
          <View style={styles.modalContent}>  
            <Text style={styles.orderInfo}>  
              Orden: #{selectedOrder?.orderNumber || selectedOrder?.id.slice(0, 8)}  
            </Text>  
  
            <Text style={styles.sectionTitle}>Nuevo Estado:</Text>  
            <View style={styles.statusOptions}>  
              {ORDER_STATUSES.map((status) => (  
                <TouchableOpacity  
                  key={status.id}  
                  style={[  
                    styles.statusOption,  
                    selectedOrder?.status === status.id && styles.statusOptionSelected  
                  ]}  
                  onPress={() => confirmStatusChange(status.id)}  
                >  
                  <View style={[styles.statusIndicator, { backgroundColor: status.color }]}>  
                    <Feather name={status.icon as any} size={16} color="#fff" />  
                  </View>  
                  <Text style={styles.statusOptionText}>{status.label}</Text>  
                </TouchableOpacity>  
              ))}  
            </View>  
  
            <Text style={styles.sectionTitle}>Notas (opcional):</Text>  
            <TextInput  
              style={styles.notesInput}  
              placeholder="Agregar notas sobre el cambio de estado..."  
              value={statusNote}  
              onChangeText={setStatusNote}  
              multiline  
              numberOfLines={3}  
              textAlignVertical="top"  
            />  
          </View>  
        </View>  
      </View>  
    </Modal>  
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
      {/* Filtros de estado */}  
      <View style={styles.filtersContainer}>  
        <Text style={styles.filterLabel}>Filtrar por estado:</Text>  
        <View style={styles.statusFilters}>  
          <TouchableOpacity  
            style={[  
              styles.filterButton,  
              selectedStatus === "all" && styles.filterButtonSelected  
            ]}  
            onPress={() => setSelectedStatus("all")}  
          >  
            <Text style={[  
              styles.filterButtonText,  
              selectedStatus === "all" && styles.filterButtonTextSelected  
            ]}>  
              Todas  
            </Text>  
          </TouchableOpacity>  
            
          {ORDER_STATUSES.map((status) => (  
            <TouchableOpacity  
              key={status.id}  
              style={[  
                styles.filterButton,  
                selectedStatus === status.id && styles.filterButtonSelected  
              ]}  
              onPress={() => setSelectedStatus(status.id)}  
            >  
              <Text style={[  
                styles.filterButtonText,  
                selectedStatus === status.id && styles.filterButtonTextSelected  
              ]}>  
                {status.label}  
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
              {selectedStatus !== "all"  
                ? `No hay órdenes con estado "${getStatusInfo(selectedStatus).label}"`  
                : "No hay órdenes disponibles"}  
            </Text>  
          </View>  
        }  
      />  
  
      {renderStatusModal()}  
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
    flexDirection: "row",  
    alignItems: "center",  
    paddingHorizontal: 8,  
    paddingVertical: 4,  
    borderRadius: 12,  
    gap: 4,  
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
  modalOverlay: {  
    flex: 1,  
    backgroundColor: "rgba(0, 0, 0, 0.5)",  
    justifyContent: "center",  
    alignItems: "center",  
  },  
  modalContainer: {  
    backgroundColor: "#fff",  
    borderRadius: 12,  
    padding: 20,  
    margin: 20,  
    maxHeight: "80%",  
    width: "90%",  
  },  
  modalHeader: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    marginBottom: 16,  
  },  
  modalTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  modalContent: {  
    flex: 1,  
  },  
  orderInfo: {  
    fontSize: 16,  
    fontWeight: "500",  
    color: "#333",  
    marginBottom: 16,  
  },  
  sectionTitle: {  
    fontSize: 16,  
    fontWeight: "600",  
    color: "#333",  
    marginBottom: 12,  
    marginTop: 16,  
  },  
  statusOptions: {  
    gap: 8,  
  },  
  statusOption: {  
    flexDirection: "row",  
    alignItems: "center",  
    paddingVertical: 12,  
    paddingHorizontal: 16,  
    backgroundColor: "#f8f9fa",  
    borderRadius: 8,  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  statusOptionSelected: {  
    backgroundColor: "#e8f0fe",  
    borderColor: "#1a73e8",  
  },  
  statusIndicator: {  
    width: 32,  
    height: 32,  
    borderRadius: 16,  
    justifyContent: "center",  
    alignItems: "center",  
    marginRight: 12,  
  },  
  statusOptionText: {  
    fontSize: 16,  
    color: "#333",  
    fontWeight: "500",  
  },  
  notesInput: {  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
    borderRadius: 8,  
    padding: 12,  
    fontSize: 16,  
    color: "#333",  
    backgroundColor: "#fff",  
    minHeight: 80,  
    textAlignVertical: "top",  
  },  
})