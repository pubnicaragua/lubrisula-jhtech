"use client"  
  
import { useState, useCallback, useEffect } from "react"  
import {  
  View,  
  Text,  
  ScrollView,  
  TouchableOpacity,  
  StyleSheet,  
  ActivityIndicator,  
  Alert,  
  Modal,  
} from "react-native"  
import { Feather, MaterialIcons } from "@expo/vector-icons"  
import { useAuth } from "../context/auth-context"  
import ORDENES_TRABAJO_SERVICES, { OrdenTrabajoType } from "../services/supabase/order-service"  
import VEHICULO_SERVICES, { VehiculoType } from "../services/"  
import CLIENTS_SERVICES, { ClienteType } from "../services/CLIENTES_SERVICES.SERVICE"  
import ACCESOS_SERVICES from "../services/ACCESOS_SERVICES.service"  
import USER_SERVICE from "../services/USER_SERVICES.SERVICE" 
  
export default function OrderDetailScreen({ route, navigation }) {  
  const { orderId } = route.params  
  const { user } = useAuth()  
  const [order, setOrder] = useState<OrdenTrabajoType | null>(null)  
  const [vehicle, setVehicle] = useState<VehiculoType | null>(null)  
  const [client, setClient] = useState<ClienteType | null>(null)  
  const [loading, setLoading] = useState(true)  
  const [updating, setUpdating] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
  const [statusModalVisible, setStatusModalVisible] = useState(false)  
  
  const loadOrderData = useCallback(async () => {  
    try {  
      setLoading(true)  
      setError(null)  
  
      if (!user?.id) return  
  
      // Validar permisos del usuario  
      const userTallerId = await USER_SERVICE.GET_TALLER_ID(user.id)  
      const userPermissions = await ACCESOS_SERVICES.GET_PERMISOS_USUARIO(user.id, userTallerId)  
      setUserRole(userPermissions?.rol || 'client')  
  
      // Obtener datos de la orden  
      const allOrders = await ORDENES_TRABAJO_SERVICES.GET_ALL_ORDENES()  
      const orderData = allOrders.find(o => o.id === orderId)  
        
      if (!orderData) {  
        setError("Orden no encontrada")  
        return  
      }  
  
      // Verificar permisos de acceso  
      if (userPermissions?.rol === 'client' && orderData.client_id !== user.id) {  
        setError("No tienes permisos para ver esta orden")  
        return  
      }  
  
      setOrder(orderData)  
  
      // Obtener datos del vehículo y cliente  
      const [vehicleData, clientData] = await Promise.all([  
        VEHICULO_SERVICES.GET_VEHICULOS_BY_ID(orderData.vehiculo_id),  
        CLIENTS_SERVICES.GET_CLIENTS_BY_ID(orderData.client_id)  
      ])  
  
      setVehicle(vehicleData)  
      setClient(clientData)  
  
    } catch (error) {  
      console.error("Error loading order data:", error)  
      setError("No se pudo cargar la información de la orden")  
    } finally {  
      setLoading(false)  
    }  
  }, [orderId, user])  
  
  useEffect(() => {  
    loadOrderData()  
  }, [loadOrderData])  
  
  const handleStatusUpdate = async (newStatus: string) => {  
    try {  
      setUpdating(true)  
        
      const updatedOrder = {  
        ...order,  
        estado: newStatus,  
        fecha_actualizacion: new Date().toISOString()  
      }  
  
      await ORDENES_TRABAJO_SERVICES.UPDATE_ORDEN(orderId, updatedOrder)  
      setOrder(prev => ({ ...prev, estado: newStatus }))  
      setStatusModalVisible(false)  
        
      Alert.alert("Éxito", "Estado de la orden actualizado correctamente")  
    } catch (error) {  
      console.error("Error updating order status:", error)  
      Alert.alert("Error", "No se pudo actualizar el estado de la orden")  
    } finally {  
      setUpdating(false)  
    }  
  }  
  
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
  
  const renderStatusModal = () => {  
    const statusOptions = ["Pendiente", "En Proceso", "Completada", "Entregada", "Cancelada"]  
      
    return (  
      <Modal  
        visible={statusModalVisible}  
        animationType="slide"  
        presentationStyle="pageSheet"  
      >  
        <View style={styles.modalContainer}>  
          <View style={styles.modalHeader}>  
            <Text style={styles.modalTitle}>Cambiar Estado</Text>  
            <TouchableOpacity  
              onPress={() => setStatusModalVisible(false)}  
              style={styles.closeButton}  
            >  
              <Feather name="x" size={24} color="#666" />  
            </TouchableOpacity>  
          </View>  
  
          <View style={styles.modalContent}>  
            {statusOptions.map((status) => (  
              <TouchableOpacity  
                key={status}  
                style={[  
                  styles.statusOption,  
                  order?.estado === status && styles.statusOptionSelected  
                ]}  
                onPress={() => handleStatusUpdate(status)}  
                disabled={updating}  
              >  
                <View style={[  
                  styles.statusIndicator,  
                  { backgroundColor: getStatusColor(status) }  
                ]} />  
                <Text style={[  
                  styles.statusOptionText,  
                  order?.estado === status && styles.statusOptionTextSelected  
                ]}>  
                  {status}  
                </Text>  
                {order?.estado === status && (  
                  <Feather name="check" size={20} color="#1a73e8" />  
                )}  
              </TouchableOpacity>  
            ))}  
          </View>  
        </View>  
      </Modal>  
    )  
  }  
  
  if (loading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#1a73e8" />  
        <Text style={styles.loadingText}>Cargando orden...</Text>  
      </View>  
    )  
  }  
  
  if (error) {  
    return (  
      <View style={styles.errorContainer}>  
        <MaterialIcons name="error" size={64} color="#f44336" />  
        <Text style={styles.errorText}>{error}</Text>  
        <TouchableOpacity style={styles.retryButton} onPress={loadOrderData}>  
          <Text style={styles.retryButtonText}>Reintentar</Text>  
        </TouchableOpacity>  
      </View>  
    )  
  }  
  
  if (!order) return null  
  
  return (  
    <ScrollView style={styles.container}>  
      <View style={styles.header}>  
        <View style={styles.orderHeader}>  
          <Text style={styles.orderNumber}>Orden #{order.numero_orden}</Text>  
          <TouchableOpacity  
            style={[styles.statusBadge, { backgroundColor: getStatusColor(order.estado) }]}  
            onPress={() => userRole !== 'client' && setStatusModalVisible(true)}  
            disabled={userRole === 'client'}  
          >  
            <Text style={styles.statusText}>{order.estado}</Text>  
            {userRole !== 'client' && (  
              <Feather name="chevron-down" size={16} color="#fff" style={{ marginLeft: 4 }} />  
            )}  
          </TouchableOpacity>  
        </View>  
          
        <Text style={styles.orderDescription}>{order.descripcion}</Text>  
          
        <View style={styles.orderMeta}>  
          <View style={styles.metaItem}>  
            <Feather name="calendar" size={16} color="#666" />  
            <Text style={styles.metaText}>  
              Creada: {new Date(order.fecha_creacion).toLocaleDateString("es-ES")}  
            </Text>  
          </View>  
          <View style={styles.metaItem}>  
            <Feather name="clock" size={16} color="#666" />  
            <Text style={styles.metaText}>  
              Entrega: {new Date(order.fecha_entrega).toLocaleDateString("es-ES")}  
            </Text>  
          </View>  
          <View style={styles.metaItem}>  
            <Feather name="flag" size={16} color="#666" />  
            <Text style={styles.metaText}>Prioridad: {order.prioridad}</Text>  
          </View>  
        </View>  
      </View>  
  
      <View style={styles.section}>  
        <Text style={styles.sectionTitle}>Información del Cliente</Text>  
        {client && (  
          <View style={styles.clientInfo}>  
            <View style={styles.clientAvatar}>  
              <Feather name="user" size={24} color="#1a73e8" />  
            </View>  
            <View style={styles.clientDetails}>  
              <Text style={styles.clientName}>{client.name}</Text>  
              <Text style={styles.clientContact}>{client.email}</Text>  
              <Text style={styles.clientContact}>{client.phone}</Text>  
            </View>  
          </View>  
        )}  
      </View>  
  
      <View style={styles.section}>  
        <Text style={styles.sectionTitle}>Información del Vehículo</Text>  
        {vehicle && (  
          <View style={styles.vehicleInfo}>  
            <View style={styles.vehicleHeader}>  
              <View style={styles.vehicleIcon}>  
                <Feather name="truck" size={24} color="#1a73e8" />  
              </View>  
              <View style={styles.vehicleDetails}>  
                <Text style={styles.vehicleName}>  
                  {vehicle.marca} {vehicle.modelo}  
                </Text>  
                <Text style={styles.vehicleSpecs}>  
                  {vehicle.ano} • {vehicle.placa}  
                </Text>  
                <Text style={styles.vehicleSpecs}>  
                  {vehicle.kilometraje?.toLocaleString()} km  
                </Text>  
              </View>  
            </View>  
          </View>  
        )}  
      </View>  
  
      <View style={styles.section}>  
        <Text style={styles.sectionTitle}>Detalles del Servicio</Text>  
        <View style={styles.serviceDetails}>  
          <View style={styles.detailRow}>  
            <Text style={styles.detailLabel}>Servicio:</Text>  
            <Text style={styles.detailValue}>{order.servicio_name}</Text>  
          </View>  
          <View style={styles.detailRow}>  
            <Text style={styles.detailLabel}>Técnico Asignado:</Text>  
            <Text style={styles.detailValue}>{order.tecnico_name || "No asignado"}</Text>  
          </View>  
          <View style={styles.detailRow}>  
            <Text style={styles.detailLabel}>Costo Total:</Text>  
            <Text style={[styles.detailValue, styles.costValue]}>  
              {formatCurrency(order.costo)}  
            </Text>  
          </View>  
        </View>  
      </View>  
  
      {order.observacion && (  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>Observaciones</Text>  
          <Text style={styles.observationText}>{order.observacion}</Text>  
        </View>  
      )}  
  
      {userRole !== 'client' && (  
        <View style={styles.actionButtons}>  
          <TouchableOpacity  
            style={[styles.actionButton, styles.editButton]}  
            onPress={() => navigation.navigate("EditOrder", { orderId: order.id })}  
          >  
            <Feather name="edit" size={20} color="#fff" />  
            <Text style={styles.actionButtonText}>Editar Orden</Text>  
          </TouchableOpacity>  
            
          <TouchableOpacity  
            style={[styles.actionButton, styles.statusButton]}  
            onPress={() => setStatusModalVisible(true)}  
          >  
            <Feather name="refresh-cw" size={20} color="#fff" />  
            <Text style={styles.actionButtonText}>Cambiar Estado</Text>  
          </TouchableOpacity>  
        </View>  
      )}  
  
      {renderStatusModal()}  
    </ScrollView>  
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
    backgroundColor: "#fff",  
    padding: 20,  
    marginBottom: 16,  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  orderHeader: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    marginBottom: 12,  
  },  
  orderNumber: {  
    fontSize: 24,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  statusBadge: {  
    flexDirection: "row",  
    alignItems: "center",  
    paddingHorizontal: 12,  
    paddingVertical: 6,  
    borderRadius: 20,  
  },  
  statusText: {  
    color: "#fff",  
    fontSize: 14,  
    fontWeight: "bold",  
  },  
  orderDescription: {  
    fontSize: 16,  
    color: "#666",  
    marginBottom: 16,  
    lineHeight: 24,  
  },  
  orderMeta: {  
    gap: 8,  
  },  
  metaItem: {  
    flexDirection: "row",  
    alignItems: "center",  
    gap: 8,  
  },  
  metaText: {  
    fontSize: 14,  
    color: "#666",  
  },  
  section: {  
    backgroundColor: "#fff",  
    marginBottom: 16,  
    marginHorizontal: 16,  
    padding: 16,  
    borderRadius: 8,  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 1 },  
    shadowOpacity: 0.1,  
    shadowRadius: 2,  
    elevation: 2,  
  },  
  sectionTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 12,  
  },  
  clientInfo: {  
    flexDirection: "row",  
    alignItems: "center",  
  },  
  clientAvatar: {  
    width: 50,  
    height: 50,  
    borderRadius: 25,  
    backgroundColor: "#f0f0f0",  
    justifyContent: "center",  
    alignItems: "center",  
    marginRight: 12,  
  },  
  clientDetails: {  
    flex: 1,  
  },  
  clientName: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 4,  
  },  
  clientContact: {  
    fontSize: 14,  
    color: "#666",  
    marginBottom: 2,  
  },  
  vehicleInfo: {  
    flex: 1,  
  },  
  vehicleHeader: {  
    flexDirection: "row",  
    alignItems: "center",  
  },  
  vehicleIcon: {  
    width: 50,  
    height: 50,  
    borderRadius: 25,  
    backgroundColor: "#f0f0f0",  
    justifyContent: "center",  
    alignItems: "center",  
    marginRight: 12,  
  },  
  vehicleDetails: {  
    flex: 1,  
  },  
  vehicleName: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 4,  
  },  
  vehicleSpecs: {  
    fontSize: 14,  
    color: "#666",  
    marginBottom: 2,  
  },  
  serviceDetails: {  
    gap: 12,  
  },  
  detailRow: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
  },  
  detailLabel: {  
    fontSize: 16,  
    color: "#666",  
    fontWeight: "500",  
  },  
  detailValue: {  
    fontSize: 16,  
    color: "#333",  
    fontWeight: "500",  
  },  
  costValue: {  
    color: "#4caf50",  
    fontSize: 18,  
    fontWeight: "bold",  
  },  
  observationText: {  
    fontSize: 16,  
    color: "#333",  
    lineHeight: 24,  
  },  
  actionButtons: {  
    flexDirection: "row",  
    padding: 16,  
    gap: 12,  
  },  
  actionButton: {  
    flex: 1,  
    flexDirection: "row",  
    justifyContent: "center",  
    alignItems: "center",  
    paddingVertical: 12,  
    borderRadius: 8,  
    gap: 8,  
  },  
  editButton: {  
    backgroundColor: "#1a73e8",  
  },  
  statusButton: {  
    backgroundColor: "#f5a623",  
  },  
  actionButtonText: {  
    color: "#fff",  
    fontWeight: "bold",  
    fontSize: 16,  
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
  statusOption: {  
    flexDirection: "row",  
    alignItems: "center",  
    paddingVertical: 16,  
    paddingHorizontal: 16,  
    borderRadius: 8,  
    marginBottom: 8,  
    backgroundColor: "#f8f9fa",  
  },  
  statusOptionSelected: {  
    backgroundColor: "#e8f0fe",  
  },  
  statusIndicator: {  
    width: 12,  
    height: 12,  
    borderRadius: 6,  
    marginRight: 12,  
  },  
  statusOptionText: {  
    flex: 1,  
    fontSize: 16,  
    color: "#333",  
  },  
  statusOptionTextSelected: {  
    color: "#1a73e8",  
    fontWeight: "500",  
  },  
})