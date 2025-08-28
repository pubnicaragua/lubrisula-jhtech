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
  TextInput,  
} from "react-native"  
import { Feather, MaterialIcons } from "@expo/vector-icons"  
import { useFocusEffect } from "@react-navigation/native"  
import { useAuth } from "../context/auth-context"  
import { clientService } from "../services/supabase/client-service"
import { Client } from '../types'
import { vehicleService } from "../services/supabase/vehicle-service"  
import { orderService } from "../services/supabase/order-service"  
  
interface ClientDetailScreenProps {  
  route: any  
  navigation: any  
}  
  
interface UpdateClientData {  
  name: string  
  email: string  
  phone: string  
  company: string  
  client_type: string  
}  
  
export default function ClientDetailScreen({ route, navigation }: ClientDetailScreenProps) {  
  const { user } = useAuth()  
  const [client, setClient] = useState<any>(null)  
  const [vehicles, setVehicles] = useState<any[]>([])  
  const [orders, setOrders] = useState<any[]>([])  
  const [loading, setLoading] = useState(true)  
  const [updating, setUpdating] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  const [editModalVisible, setEditModalVisible] = useState(false)  
  
  const [editFormData, setEditFormData] = useState<UpdateClientData>({  
    name: "",  
    email: "",  
    phone: "",  
    company: "",  
    client_type: "Individual",  
  })  
  
  // ✅ CORREGIDO: Usar getClientByUserId para buscar por user_id  
  const loadClientData = useCallback(async () => {  
    try {  
      setLoading(true)  
      setError(null)  
  
      if (!user?.id) {  
        setError("Usuario no autenticado")  
        return  
      }  
  
      // ✅ CORREGIDO: Usar getClientByUserId en lugar de getClientById  
  const clientData = await clientService.getClientByUserId(user.id)
      if (!clientData) {  
        setError("Cliente no encontrado")  
        return  
      }  
  
      setClient(clientData)  
      setEditFormData({  
        name: clientData.name || "",  
        email: clientData.email || "",  
        phone: clientData.phone || "",  
        company: clientData.company || "",  
        client_type: clientData.client_type || "Individual",  
      })  
  
      // Cargar vehículos y órdenes del cliente  
      const [clientVehicles, clientOrders] = await Promise.all([  
        vehicleService.getVehiclesByClientId(clientData.id),  
        orderService.getOrdersByClientId(clientData.id)  
      ])  
  
      setVehicles(clientVehicles)  
      setOrders(clientOrders)  
  
    } catch (error) {  
      console.error("Error loading client data:", error)  
      setError("No se pudo cargar la información del cliente")  
    } finally {  
      setLoading(false)  
    }  
  }, [user])  
  
  useFocusEffect(  
    useCallback(() => {  
      loadClientData()  
    }, [loadClientData])  
  )  
  
  const handleUpdateClient = async () => {  
    try {  
      setUpdating(true)  
      const updatedClient = {  
        ...editFormData,  
        updated_at: new Date().toISOString()  
      }  
  
      await clientService.updateClient(client.id, updatedClient)  
      setClient({ ...client, ...updatedClient })  
      setEditModalVisible(false)  
      Alert.alert("Éxito", "Cliente actualizado correctamente")  
    } catch (error) {  
      console.error("Error updating client:", error)  
      Alert.alert("Error", "No se pudo actualizar el cliente")  
    } finally {  
      setUpdating(false)  
    }  
  }  
  
  const formatCurrency = (amount: number) => {  
    return amount.toLocaleString("es-ES", {  
      style: "currency",  
      currency: "USD",  
      minimumFractionDigits: 2,  
    })  
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
  
  if (loading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#1a73e8" />  
        <Text style={styles.loadingText}>Cargando cliente...</Text>  
      </View>  
    )  
  }  
  
  if (error) {  
    return (  
      <View style={styles.errorContainer}>  
        <MaterialIcons name="error" size={64} color="#f44336" />  
        <Text style={styles.errorText}>{error}</Text>  
        <TouchableOpacity style={styles.retryButton} onPress={loadClientData}>  
          <Text style={styles.retryButtonText}>Reintentar</Text>  
        </TouchableOpacity>  
      </View>  
    )  
  }  
  
  if (!client) return null  
  
  return (  
    <View style={styles.container}>  
      <View style={styles.header}>  
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>  
          <Feather name="arrow-left" size={24} color="#333" />  
        </TouchableOpacity>  
        <Text style={styles.headerTitle}>Detalle de Cliente</Text>  
        <TouchableOpacity style={styles.editButton} onPress={() => setEditModalVisible(true)}>  
          <Feather name="edit-2" size={24} color="#1a73e8" />  
        </TouchableOpacity>  
      </View>  
  
      <ScrollView style={styles.content}>  
        <View style={styles.clientHeader}>  
          <View style={styles.clientAvatar}>  
            <Text style={styles.clientInitials}>  
              {client.name?.split(" ").map((n: string) => n[0]).join("") || "?"}  
            </Text>  
          </View>  
          <View style={styles.clientHeaderInfo}>  
            <Text style={styles.clientName}>{client.name}</Text>  
            <Text style={styles.contactText}>{client.phone}</Text>  
            <Text style={styles.contactText}>{client.email}</Text>  
          </View>  
        </View>  
  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>Estadísticas</Text>  
          <View style={styles.statsContainer}>  
            <View style={styles.statItem}>  
              <Text style={styles.statValue}>{vehicles.length}</Text>  
              <Text style={styles.statLabel}>Vehículos</Text>  
            </View>  
            <View style={styles.statDivider} />  
            <View style={styles.statItem}>  
              <Text style={styles.statValue}>{orders.length}</Text>  
              <Text style={styles.statLabel}>Órdenes</Text>  
            </View>  
            <View style={styles.statDivider} />  
            <View style={styles.statItem}>  
              <Text style={styles.statValue}>  
                {formatCurrency(orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0))}  
              </Text>  
              <Text style={styles.statLabel}>Total Gastado</Text>  
            </View>  
          </View>  
        </View>  
  
        {/* Sección de Vehículos */}  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>Vehículos</Text>  
          {vehicles.length > 0 ? (  
            vehicles.map((vehicle) => (  
              <TouchableOpacity  
                key={vehicle.id}  
                style={styles.vehicleCard}  
                onPress={() => navigation.navigate("VehicleDetail", { vehicleId: vehicle.id })}  
              >  
                <View style={styles.vehicleInfo}>  
                  <Text style={styles.vehicleName}>  
                    {vehicle.marca} {vehicle.modelo} ({vehicle.ano})  
                  </Text>  
                  <Text style={styles.vehicleDetails}>  
                    Placa: {vehicle.placa} • KM: {vehicle.kilometraje || 0}  
                  </Text>  
                </View>  
                <Feather name="chevron-right" size={20} color="#999" />  
              </TouchableOpacity>  
            ))  
          ) : (  
            <View style={styles.emptyState}>  
              <Feather name="truck" size={32} color="#ccc" />  
              <Text style={styles.emptyText}>No hay vehículos registrados</Text>  
            </View>  
          )}  
        </View>  
  
        {/* Sección de Órdenes Recientes */}  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>Órdenes Recientes</Text>  
          {orders.length > 0 ? (  
            orders.slice(0, 5).map((order) => (  
              <TouchableOpacity  
                key={order.id}  
                style={styles.orderCard}  
                onPress={() => navigation.navigate("OrderDetail", { orderId: order.id })}  
              >  
                <View style={styles.orderHeader}>  
                  <Text style={styles.orderNumber}>Orden #{order.numero_orden || order.id.slice(0, 8)}</Text>  
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.estado) }]}>  
                    <Text style={styles.statusText}>{order.estado}</Text>  
                  </View>  
                </View>  
                <Text style={styles.orderDescription} numberOfLines={2}>  
                  {order.descripcion || "Sin descripción"}  
                </Text>  
                <View style={styles.orderFooter}>  
                  <Text style={styles.orderDate}>  
                    {new Date(order.fecha_creacion).toLocaleDateString("es-ES")}  
                  </Text>  
                  <Text style={styles.orderAmount}>{formatCurrency(order.costo || 0)}</Text>  
                </View>  
              </TouchableOpacity>  
            ))  
          ) : (  
            <View style={styles.emptyState}>  
              <Feather name="file-text" size={32} color="#ccc" />  
              <Text style={styles.emptyText}>No hay órdenes registradas</Text>  
            </View>  
          )}  
        </View>  
  
        {/* Modal de Edición */}  
        <Modal  
          visible={editModalVisible}  
          animationType="slide"  
          presentationStyle="pageSheet"  
        >  
          <View style={styles.modalContainer}>  
            <View style={styles.modalHeader}>  
              <Text style={styles.modalTitle}>Editar Cliente</Text>  
              <TouchableOpacity  
                onPress={() => setEditModalVisible(false)}  
                style={styles.closeButton}  
              >  
                <Feather name="x" size={24} color="#666" />  
              </TouchableOpacity>  
            </View>  
  
            <ScrollView style={styles.modalContent}>  
              <View style={styles.inputGroup}>  
                <Text style={styles.inputLabel}>Nombre</Text>  
                <TextInput  
                  style={styles.input}  
                  value={editFormData.name}  
                  onChangeText={(value) =>  
                    setEditFormData(prev => ({ ...prev, name: value }))  
                  }  
                  placeholder="Nombre completo"  
                  autoCapitalize="words"  
                />  
              </View>  
  
              <View style={styles.inputGroup}>  
                <Text style={styles.inputLabel}>Email</Text>  
                <TextInput  
                  style={styles.input}  
                  value={editFormData.email}  
                  onChangeText={(value) =>  
                    setEditFormData(prev => ({ ...prev, email: value }))  
                  }  
                  placeholder="correo@ejemplo.com"  
                  keyboardType="email-address"  
                  autoCapitalize="none"  
                />  
              </View>  
  
              <View style={styles.inputGroup}>  
                <Text style={styles.inputLabel}>Teléfono</Text>  
                <TextInput  
                  style={styles.input}  
                  value={editFormData.phone}  
                  onChangeText={(value) =>  
                    setEditFormData(prev => ({ ...prev, phone: value }))  
                  }  
                  placeholder="+504 8888-8888"  
                  keyboardType="phone-pad"  
                />  
              </View>  
  
              <View style={styles.inputGroup}>  
                <Text style={styles.inputLabel}>Empresa</Text>  
                <TextInput  
                  style={styles.input}  
                  value={editFormData.company}  
                  onChangeText={(value) =>  
                    setEditFormData(prev => ({ ...prev, company: value }))  
                  }  
                  placeholder="Nombre de la empresa"  
                  autoCapitalize="words"  
                />  
              </View>  
            </ScrollView>  
  
            <View style={styles.modalFooter}>  
              <TouchableOpacity  
                style={[styles.modalButton, styles.cancelButton]}  
                onPress={() => setEditModalVisible(false)}  
                disabled={updating}  
              >  
                <Text style={styles.cancelButtonText}>Cancelar</Text>  
              </TouchableOpacity>  
  
              <TouchableOpacity  
                style={[styles.modalButton, styles.saveButton]}  
                onPress={handleUpdateClient}  
                disabled={updating}  
              >  
                {updating ? (  
                  <ActivityIndicator size="small" color="#fff" />  
                ) : (  
                  <Text style={styles.saveButtonText}>Guardar</Text>  
                )}  
              </TouchableOpacity>  
            </View>  
          </View>  
        </Modal>  
      </ScrollView>  
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
  backButton: {  
    padding: 8,  
  },  
  headerTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  editButton: {  
    padding: 8,  
  },  
  content: {  
    flex: 1,  
    padding: 16,  
  },  
  clientHeader: {  
    flexDirection: "row",  
    alignItems: "center",  
    padding: 16,  
    backgroundColor: "#fff",  
    borderRadius: 12,  
    marginBottom: 16,  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 2 },  
    shadowOpacity: 0.1,  
    shadowRadius: 4,  
    elevation: 3,  
  },  
  clientAvatar: {  
    width: 60,  
    height: 60,  
    borderRadius: 30,  
    backgroundColor: "#1a73e8",  
    justifyContent: "center",  
    alignItems: "center",  
    marginRight: 16,  
  },  
  clientInitials: {  
    fontSize: 24,  
    fontWeight: "bold",  
    color: "#fff",  
  },  
  clientHeaderInfo: {  
    flex: 1,  
  },  
  clientName: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 4,  
  },  
  contactText: {  
    fontSize: 14,  
    color: "#666",  
    marginBottom: 2,  
  },  
  section: {  
    backgroundColor: "#fff",  
    borderRadius: 12,  
    padding: 16,  
    marginBottom: 16,  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 2 },  
    shadowOpacity: 0.1,  
    shadowRadius: 4,  
    elevation: 3,  
  },  
  sectionTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 16,  
  },  
  statsContainer: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
  },  
  statItem: {  
    flex: 1,  
    alignItems: "center",  
  },  
  statValue: {  
    fontSize: 20,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 4,  
  },  
  statLabel: {  
    fontSize: 12,  
    color: "#666",  
    textAlign: "center",  
  },  
  statDivider: {  
    width: 1,  
    height: 40,  
    backgroundColor: "#e1e4e8",  
    marginHorizontal: 16,  
  },  
  vehicleCard: {  
    flexDirection: "row",  
    alignItems: "center",  
    paddingVertical: 12,  
    borderBottomWidth: 1,  
    borderBottomColor: "#f0f0f0",  
  },  
  vehicleInfo: {  
    flex: 1,  
  },  
  vehicleName: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 4,  
  },  
  vehicleDetails: {  
    fontSize: 14,  
    color: "#666",  
  },  
  orderCard: {  
    paddingVertical: 12,  
    borderBottomWidth: 1,  
    borderBottomColor: "#f0f0f0",  
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
  emptyState: {  
    alignItems: "center",  
    justifyContent: "center",  
    paddingVertical: 32,  
  },  
  emptyText: {  
    fontSize: 14,  
    color: "#999",  
    marginTop: 8,  
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
  inputGroup: {  
    marginBottom: 16,  
  },  
  inputLabel: {  
    fontSize: 16,  
    fontWeight: "500",  
    color: "#333",  
    marginBottom: 8,  
  },  
  input: {  
    backgroundColor: "#f8f9fa",  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
    borderRadius: 8,  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    fontSize: 16,  
    color: "#333",  
  },  
  modalFooter: {  
    flexDirection: "row",  
    padding: 16,  
    borderTopWidth: 1,  
    borderTopColor: "#e1e4e8",  
    gap: 12,  
  },  
  modalButton: {  
    flex: 1,  
    paddingVertical: 12,  
    borderRadius: 8,  
    alignItems: "center",  
    justifyContent: "center",  
  },  
  cancelButton: {  
    backgroundColor: "#f8f9fa",  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  cancelButtonText: {  
    fontSize: 16,  
    fontWeight: "500",  
    color: "#666",  
  },  
  saveButton: {  
    backgroundColor: "#1a73e8",  
  },  
  saveButtonText: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#fff",  
  },  
})