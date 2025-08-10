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
  Modal,  
  TextInput,  
} from "react-native"  
import { Feather, MaterialIcons } from "@expo/vector-icons"  
import { useFocusEffect } from "@react-navigation/native"  
import { useAuth } from "../context/auth-context"  
import ORDENES_TRABAJO_SERVICES from "../services/supabase/order-service"  
import ACCESOS_SERVICES from "../services/supabase/access-service"  
import USER_SERVICE from "../services/supabase/user-service" 
import { UiScreenNavProp } from "../types"
import { Order } from "../types/order"
  
// Estados disponibles para las órdenes  
const ORDER_STATUSES = [  
  { id: "reception", label: "Recepción", color: "#1a73e8", icon: "clock" as const },  
  { id: "diagnosis", label: "En Diagnóstico", color: "#f5a623", icon: "search" as const },  
  { id: "waiting_parts", label: "Esperando Repuestos", color: "#9c27b0", icon: "package" as const },  
  { id: "in_progress", label: "En Proceso", color: "#ff9800", icon: "tool" as const },  
  { id: "quality_check", label: "Control Calidad", color: "#607d8b", icon: "check-circle" as const },  
  { id: "completed", label: "Completada", color: "#4caf50", icon: "check-square" as const },  
  { id: "delivered", label: "Entregada", color: "#607d8b", icon: "truck" as const },  
  { id: "cancelled", label: "Cancelada", color: "#e53935", icon: "x-circle" as const },  
]  
  
export default function OrderStatusScreen({ navigation }: UiScreenNavProp) {  
  const { user } = useAuth()  
  const [orders, setOrders] = useState<Order[]>([])  
  const [loading, setLoading] = useState(true)  
  const [refreshing, setRefreshing] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)  
  const [showStatusModal, setShowStatusModal] = useState(false)  
  const [statusNote, setStatusNote] = useState("")  
  const [filterStatus, setFilterStatus] = useState("all")  
  
  const loadOrders = useCallback(async () => {  
    try {  
      setLoading(true)  
      setError(null)  
  
      if (!user?.id) return  
  
      // Validar permisos del usuario  
      const userTallerId = await USER_SERVICE.GET_TALLER_ID(user.id)  
      if (!userTallerId) {
        setError("No se pudo obtener la información del taller")
        return
      }
      const userPermissions = await ACCESOS_SERVICES.GET_PERMISOS_USUARIO(user.id, userTallerId)  
      if (!userPermissions) {
        setError("No se pudo obtener los permisos del usuario")
        return
      }
      setUserRole(userPermissions?.rol || 'client')  
  
      // Cargar órdenes según el rol  
      let allOrders = []  
      if (userPermissions?.rol === 'client') {  
        // Cliente solo ve sus órdenes  
        const clientOrders = await ORDENES_TRABAJO_SERVICES.getAllOrders()  
        allOrders = clientOrders.filter(order => order.clientId === user.id)  
      } else {  
        // Admin/técnico ve todas las órdenes  
        allOrders = await ORDENES_TRABAJO_SERVICES.getAllOrders()  
      }  
  
      setOrders(allOrders)  
  
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
  
  const getStatusInfo = (status: string) => {  
    return ORDER_STATUSES.find(s => s.id === status) || ORDER_STATUSES[0]  
  }  
  
  const handleStatusChange = (order: Order, newStatus: string) => {  
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
      await ORDENES_TRABAJO_SERVICES.updateOrderStatus(selectedOrder.id!, newStatus)  
        
      // Actualizar orden local  
      setOrders(prev =>   
        prev.map(order =>   
          order.id === selectedOrder.id   
            ? { ...order, estado: newStatus }  
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
  
  const filteredOrders = orders.filter(order => {  
    if (filterStatus === "all") return true  
    return order.status === filterStatus  
  })  
  
  const renderOrderItem = ({ item }: { item: Order }) => {  
    const statusInfo = getStatusInfo(item.status)  
  
    return (  
      <TouchableOpacity  
        style={styles.orderCard}  
        onPress={() => navigation.navigate("OrderDetail", { orderId: item.id })}  
      >  
        <View style={styles.orderHeader}>  
          <Text style={styles.orderNumber}>Orden #{item.number}</Text>  
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>  
            <Feather name={statusInfo.icon} size={12} color="#fff" />  
            <Text style={styles.statusText}>{statusInfo.label}</Text>  
          </View>  
        </View>  
  
        <Text style={styles.orderDescription} numberOfLines={2}>  
          {item.description}  
        </Text>  
  
        <View style={styles.orderDetails}>  
          <View style={styles.orderDetail}>  
            <Feather name="user" size={16} color="#666" />  
            <Text style={styles.orderDetailText}>Cliente #{item.clientId}</Text>  
          </View>  
          <View style={styles.orderDetail}>  
            <Feather name="truck" size={16} color="#666" />  
            <Text style={styles.orderDetailText}>Vehículo #{item.vehicleId}</Text>  
          </View>  
          <View style={styles.orderDetail}>  
            <Feather name="calendar" size={16} color="#666" />  
            <Text style={styles.orderDetailText}>  
              {new Date(item.createdAt).toLocaleDateString("es-ES")}  
            </Text>  
          </View>  
        </View>  
  
        {userRole !== 'client' && (  
          <View style={styles.statusActions}>  
            {ORDER_STATUSES.map((status) => (  
              <TouchableOpacity  
                key={status.id}  
                style={[  
                  styles.statusButton,  
                  { backgroundColor: status.color },  
                  item.status === status.id && styles.statusButtonActive  
                ]}  
                onPress={() => handleStatusChange(item, status.id)}  
                disabled={item.status === status.id}  
              >  
                <Feather name={status.icon} size={14} color="#fff" />  
              </TouchableOpacity>  
            ))}  
          </View>  
        )}  
      </TouchableOpacity>  
    )  
  }  
  
  if (loading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#1a73e8" />  
        <Text style={styles.loadingText}>Cargando órdenes...</Text>  
      </View>  
    )  
  }  
  
  return (  
    <View style={styles.container}>  
      <View style={styles.header}>  
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>  
          <Feather name="arrow-left" size={24} color="#333" />  
        </TouchableOpacity>  
        <Text style={styles.headerTitle}>Estados de Órdenes</Text>  
      </View>  
  
      <View style={styles.filterContainer}>  
        <TouchableOpacity  
          style={[styles.filterButton, filterStatus === "all" && styles.filterButtonActive]}  
          onPress={() => setFilterStatus("all")}  
        >  
          <Text style={[styles.filterButtonText, filterStatus === "all" && styles.filterButtonTextActive]}>  
            Todas  
          </Text>  
        </TouchableOpacity>  
        {ORDER_STATUSES.slice(0, 4).map((status) => (  
          <TouchableOpacity  
            key={status.id}  
            style={[styles.filterButton, filterStatus === status.id && styles.filterButtonActive]}  
            onPress={() => setFilterStatus(status.id)}  
          >  
            <Text style={[styles.filterButtonText, filterStatus === status.id && styles.filterButtonTextActive]}>  
              {status.label}  
            </Text>  
          </TouchableOpacity>  
        ))}  
      </View>  
  
      {error ? (  
        <View style={styles.errorContainer}>  
          <MaterialIcons name="error" size={64} color="#f44336" />  
          <Text style={styles.errorText}>{error}</Text>  
          <TouchableOpacity style={styles.retryButton} onPress={loadOrders}>  
            <Text style={styles.retryButtonText}>Reintentar</Text>  
          </TouchableOpacity>  
        </View>  
      ) : (  
        <FlatList  
          data={filteredOrders}  
          keyExtractor={(item) => item.id!}  
          renderItem={renderOrderItem}  
          refreshControl={  
            <RefreshControl refreshing={refreshing} onRefresh={loadOrders} colors={["#1a73e8"]} />  
          }  
          contentContainerStyle={styles.listContainer}  
          showsVerticalScrollIndicator={false}  
          ListEmptyComponent={  
            <View style={styles.emptyContainer}>  
              <Feather name="clipboard" size={64} color="#ccc" />  
              <Text style={styles.emptyText}>No hay órdenes para mostrar</Text>  
            </View>  
          }  
        />  
      )}  
  
      {/* Modal para cambio de estado */}  
      <Modal  
        visible={showStatusModal}  
        animationType="slide"  
        transparent={true}  
      >  
        <View style={styles.modalOverlay}>  
          <View style={styles.modalContainer}>  
            <Text style={styles.modalTitle}>Cambiar Estado</Text>  
              
            {selectedOrder && (  
              <>  
                <Text style={styles.modalOrderInfo}>  
                  Orden #{selectedOrder.number}  
                </Text>  
                  
                <View style={styles.statusGrid}>  
                  {ORDER_STATUSES.map((status) => (  
                    <TouchableOpacity  
                      key={status.id}  
                      style={[  
                        styles.statusOption,  
                        { borderColor: status.color },  
                        selectedOrder.status === status.id && styles.statusOptionDisabled  
                      ]}  
                      onPress={() => confirmStatusChange(status.id)}  
                      disabled={selectedOrder.status === status.id}  
                    >  
                      <Feather name={status.icon} size={20} color={status.color} />  
                      <Text style={[styles.statusOptionText, { color: status.color }]}>  
                        {status.label}  
                      </Text>  
                      {selectedOrder.status === status.id && (  
                        <Text style={styles.currentStatusLabel}>Actual</Text>  
                      )}  
                    </TouchableOpacity>  
                  ))}  
                </View>  
  
                <View style={styles.noteContainer}>  
                  <Text style={styles.noteLabel}>Nota (opcional):</Text>  
                  <TextInput  
                    style={styles.noteInput}  
                    value={statusNote}  
                    onChangeText={setStatusNote}  
                    placeholder="Agregar una nota sobre el cambio de estado..."  
                    multiline  
                    numberOfLines={3}  
                    textAlignVertical="top"  
                  />  
                </View>  
              </>  
            )}  
  
            <TouchableOpacity   
              style={styles.modalCancelButton}  
              onPress={() => setShowStatusModal(false)}  
            >  
              <Text style={styles.modalCancelText}>Cancelar</Text>  
            </TouchableOpacity>  
          </View>  
        </View>  
      </Modal>  
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
  header: {  
    flexDirection: "row",  
    alignItems: "center",  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    backgroundColor: "#fff",  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  backButton: {  
    padding: 8,  
    marginRight: 8,  
  },  
  headerTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  filterContainer: {  
    flexDirection: "row",  
    backgroundColor: "#fff",  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
    gap: 8,  
  },  
  filterButton: {  
    paddingHorizontal: 12,  
    paddingVertical: 6,  
    borderRadius: 16,  
    backgroundColor: "#f5f5f5",  
  },  
  filterButtonActive: {  
    backgroundColor: "#1a73e8",  
  },  
  filterButtonText: {  
    fontSize: 12,  
    color: "#666",  
  },  
  filterButtonTextActive: {  
    color: "#fff",  
    fontWeight: "bold",  
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
  listContainer: {  
    padding: 16,  
  },  
  emptyContainer: {  
    flex: 1,  
    justifyContent: "center",  
    alignItems: "center",  
    padding: 40,  
  },  
  emptyText: {  
    fontSize: 16,  
    color: "#999",  
    marginTop: 16,  
    textAlign: "center",  
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
    fontSize: 16,  
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
    gap: 8,  
    marginBottom: 12,  
  },  
  orderDetail: {  
    flexDirection: "row",  
    alignItems: "center",  
    gap: 8,  
  },  
  orderDetailText: {  
    fontSize: 14,  
    color: "#666",  
  },  
  statusActions: {  
    flexDirection: "row",  
    flexWrap: "wrap",  
    gap: 8,  
    marginTop: 8,  
  },  
  statusButton: {  
    width: 32,  
    height: 32,  
    borderRadius: 16,  
    justifyContent: "center",  
    alignItems: "center",  
  },  
  statusButtonActive: {  
    opacity: 0.5,  
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
  modalTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 16,  
    textAlign: "center",  
  },  
  modalOrderInfo: {  
    fontSize: 16,  
    color: "#666",  
    marginBottom: 20,  
    textAlign: "center",  
  },  
  statusGrid: {  
    flexDirection: "row",  
    flexWrap: "wrap",  
    gap: 12,  
    marginBottom: 20,  
  },  
  statusOption: {  
    flex: 1,  
    minWidth: "45%",  
    flexDirection: "row",  
    alignItems: "center",  
    padding: 12,  
    borderRadius: 8,  
    borderWidth: 1,  
    gap: 8,  
  },  
  statusOptionDisabled: {  
    opacity: 0.5,  
  },  
  statusOptionText: {  
    fontSize: 14,  
    fontWeight: "500",  
  },  
  currentStatusLabel: {  
    fontSize: 12,  
    color: "#1a73e8",  
    fontWeight: "bold",  
    marginLeft: "auto",  
  },  
  noteContainer: {  
    marginBottom: 20,  
  },  
  noteLabel: {  
    fontSize: 16,  
    fontWeight: "500",  
    color: "#333",  
    marginBottom: 8,  
  },  
  noteInput: {  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
    borderRadius: 8,  
    paddingHorizontal: 12,  
    paddingVertical: 8,  
    fontSize: 16,  
    height: 80,  
    textAlignVertical: "top",  
  },  
  modalCancelButton: {  
    backgroundColor: "#e1e4e8",  
    borderRadius: 8,  
    paddingVertical: 12,  
    alignItems: "center",  
  },  
  modalCancelText: {  
    fontSize: 16,  
    fontWeight: "500",  
    color: "#666",  
  },  
})