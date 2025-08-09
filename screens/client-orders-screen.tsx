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
} from "react-native"  
import { Feather, MaterialIcons } from "@expo/vector-icons"  
import { useFocusEffect } from "@react-navigation/native"  
import { useAuth } from "../context/auth-context"  
import ORDENES_TRABAJO_SERVICES, { OrdenTrabajoType } from "../services/ORDENES.SERVICE"  
import CLIENTS_SERVICES, { ClienteType } from "../services/CLIENTES_SERVICES.SERVICE"  
import ACCESOS_SERVICES from "../services/ACCESOS_SERVICES.service"  
import USER_SERVICE from "../services/USER_SERVICES.SERVICE" 
  
export default function ClientOrdersScreen({ route, navigation }) {  
  const { clientId } = route.params  
  const { user } = useAuth()  
  const [client, setClient] = useState<ClienteType | null>(null)  
  const [orders, setOrders] = useState<OrdenTrabajoType[]>([])  
  const [loading, setLoading] = useState(true)  
  const [refreshing, setRefreshing] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
  const [filterStatus, setFilterStatus] = useState<string>("all")  
  
  const loadClientOrders = useCallback(async () => {  
    try {  
      setLoading(true)  
      setError(null)  
  
      if (!user?.id) return  
  
      // Validar permisos del usuario  
      const userTallerId = await USER_SERVICE.GET_TALLER_ID(user.id)  
      const userPermissions = await ACCESOS_SERVICES.GET_PERMISOS_USUARIO(user.id, userTallerId)  
      setUserRole(userPermissions?.rol || 'client')  
  
      // Verificar permisos de acceso  
      if (userPermissions?.rol === 'client' && clientId !== user.id) {  
        setError("No tienes permisos para ver las órdenes de este cliente")  
        return  
      }  
  
      // Obtener datos del cliente y sus órdenes  
      const [clientData, allOrders] = await Promise.all([  
        CLIENTS_SERVICES.GET_CLIENTS_BY_ID(clientId),  
        ORDENES_TRABAJO_SERVICES.GET_ALL_ORDENES()  
      ])  
  
      if (!clientData) {  
        setError("Cliente no encontrado")  
        return  
      }  
  
      setClient(clientData)  
        
      // Filtrar órdenes del cliente  
      const clientOrders = allOrders.filter(order => order.client_id === clientId)  
      setOrders(clientOrders)  
  
    } catch (error) {  
      console.error("Error loading client orders:", error)  
      setError("No se pudieron cargar las órdenes del cliente")  
    } finally {  
      setLoading(false)  
      setRefreshing(false)  
    }  
  }, [clientId, user])  
  
  useFocusEffect(  
    useCallback(() => {  
      loadClientOrders()  
    }, [loadClientOrders])  
  )  
  
  const getStatusColor = (status: string) => {  
    switch (status) {  
      case "Pendiente": return "#1a73e8"  
      case "En Proceso": return "#f5a623"  
      case "Completada": return "#4caf50"  
      case "Entregada": return "#607d8b"  
      case "Cancelada": return "#e53935"  
      default: return "#666"  
    }  
  }  
  
  const formatCurrency = (amount: number) => {  
    return amount.toLocaleString("es-ES", {  
      style: "currency",  
      currency: "USD",  
      minimumFractionDigits: 2,  
    })  
  }  
  
  const filteredOrders = orders.filter(order => {  
    if (filterStatus === "all") return true  
    return order.estado === filterStatus  
  })  
  
  const renderOrderItem = ({ item }: { item: OrdenTrabajoType }) => (  
    <TouchableOpacity  
      style={styles.orderCard}  
      onPress={() => navigation.navigate("OrderDetail", { orderId: item.id })}  
    >  
      <View style={styles.orderHeader}>  
        <Text style={styles.orderNumber}>Orden #{item.numero_orden}</Text>  
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.estado) }]}>  
          <Text style={styles.statusText}>{item.estado}</Text>  
        </View>  
      </View>  
        
      <Text style={styles.orderDescription} numberOfLines={2}>  
        {item.descripcion}  
      </Text>  
        
      <View style={styles.orderDetails}>  
        <View style={styles.orderDetail}>  
          <Feather name="wrench" size={16} color="#666" />  
          <Text style={styles.orderDetailText}>{item.servicio_name || "Servicio"}</Text>  
        </View>  
        <View style={styles.orderDetail}>  
          <Feather name="user" size={16} color="#666" />  
          <Text style={styles.orderDetailText}>{item.tecnico_name || "Sin asignar"}</Text>  
        </View>  
        <View style={styles.orderDetail}>  
          <Feather name="flag" size={16} color="#666" />  
          <Text style={styles.orderDetailText}>Prioridad: {item.prioridad}</Text>  
        </View>  
      </View>  
        
      <View style={styles.orderFooter}>  
        <Text style={styles.orderDate}>  
          {new Date(item.fecha_creacion).toLocaleDateString("es-ES")}  
        </Text>  
        <Text style={styles.orderAmount}>{formatCurrency(item.costo)}</Text>  
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
  
  return (  
    <View style={styles.container}>  
            <View style={styles.header}>  
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>  
          <Feather name="arrow-left" size={24} color="#333" />  
        </TouchableOpacity>  
        <Text style={styles.headerTitle}>Órdenes de {client?.name}</Text>  
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
        <TouchableOpacity  
          style={[styles.filterButton, filterStatus === "Pendiente" && styles.filterButtonActive]}  
          onPress={() => setFilterStatus("Pendiente")}  
        >  
          <Text style={[styles.filterButtonText, filterStatus === "Pendiente" && styles.filterButtonTextActive]}>  
            Pendientes  
          </Text>  
        </TouchableOpacity>  
        <TouchableOpacity  
          style={[styles.filterButton, filterStatus === "En Proceso" && styles.filterButtonActive]}  
          onPress={() => setFilterStatus("En Proceso")}  
        >  
          <Text style={[styles.filterButtonText, filterStatus === "En Proceso" && styles.filterButtonTextActive]}>  
            En Proceso  
          </Text>  
        </TouchableOpacity>  
        <TouchableOpacity  
          style={[styles.filterButton, filterStatus === "Completada" && styles.filterButtonActive]}  
          onPress={() => setFilterStatus("Completada")}  
        >  
          <Text style={[styles.filterButtonText, filterStatus === "Completada" && styles.filterButtonTextActive]}>  
            Completadas  
          </Text>  
        </TouchableOpacity>  
      </View>  
  
      {error ? (  
        <View style={styles.errorContainer}>  
          <MaterialIcons name="error" size={64} color="#f44336" />  
          <Text style={styles.errorText}>{error}</Text>  
          <TouchableOpacity style={styles.retryButton} onPress={loadClientOrders}>  
            <Text style={styles.retryButtonText}>Reintentar</Text>  
          </TouchableOpacity>  
        </View>  
      ) : (  
        <>  
          {filteredOrders.length === 0 ? (  
            <View style={styles.emptyContainer}>  
              <Feather name="clipboard" size={64} color="#ccc" />  
              <Text style={styles.emptyText}>No hay órdenes para mostrar</Text>  
              <Text style={styles.emptySubtext}>  
                {filterStatus === "all"   
                  ? "Este cliente no tiene órdenes registradas"   
                  : `No hay órdenes con estado "${filterStatus}"`  
                }  
              </Text>  
            </View>  
          ) : (  
            <FlatList  
              data={filteredOrders}  
              keyExtractor={(item) => item.id!}  
              renderItem={renderOrderItem}  
              refreshControl={  
                <RefreshControl refreshing={refreshing} onRefresh={loadClientOrders} colors={["#1a73e8"]} />  
              }  
              contentContainerStyle={styles.listContainer}  
              showsVerticalScrollIndicator={false}  
            />  
          )}  
        </>  
      )}  
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
    flex: 1,  
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
    fontSize: 14,  
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
    marginBottom: 8,  
    textAlign: "center",  
  },  
  emptySubtext: {  
    fontSize: 14,  
    color: "#ccc",  
    textAlign: "center",  
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
  orderFooter: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    borderTopWidth: 1,  
    borderTopColor: "#f0f0f0",  
    paddingTop: 12,  
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
})