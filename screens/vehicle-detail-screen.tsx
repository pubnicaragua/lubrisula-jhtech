"use client"  
  
import { useState, useCallback, useEffect } from "react"  
import {  
  StyleSheet,  
  View,  
  Text,  
  TouchableOpacity,  
  ScrollView,  
  ActivityIndicator,  
  Alert,  
  Image,  
  Modal,  
  FlatList,  
  SafeAreaView,  
  RefreshControl,  
} from "react-native"  
import { Feather } from "@expo/vector-icons"  
import { useFocusEffect } from "@react-navigation/native"  
import { useAuth } from "../context/auth-context"  
// Importaciones corregidas para usar servicios de Supabase  
import { vehicleService, Vehicle } from "../services/supabase/vehicle-service"  
import { orderService } from "../services/supabase/order-service"  
import { clientService, Client } from "../services/supabase/client-service"  
import { getAppointmentsByVehicleId, AppointmentType } from "../services/supabase/appointment-service"  
import { accessService } from "../services/supabase/access-service"  
import { userService } from "../services/supabase/user-service"  
import { Order, UiScreenProps } from "../types"
  
export default function VehicleDetailScreen({ route, navigation }: UiScreenProps) {  
  const { vehicleId } = route.params  
  const { user } = useAuth()  
    
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)  
  const [client, setClient] = useState<Client | null>(null)  
  const [orders, setOrders] = useState<Order[]>([])  
  const [appointments, setAppointments] = useState<AppointmentType[]>([])  
  const [loading, setLoading] = useState(true)  
  const [refreshing, setRefreshing] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)  
  
  // Cargar datos del vehículo  
  const loadVehicleData = useCallback(async () => {  
    try {  
      setLoading(true)  
      setRefreshing(true)  
      setError(null)  
  
      if (!user?.id) return  
  
      // Validar permisos del usuario  
      const userTallerId = await userService.getUserTaller(user.id)  
      if (!userTallerId) {
        setError("No se pudo obtener la información del taller")
        return
      }      
      const userPermissions = await accessService.checkUserPermissions(user.id, userTallerId)  
      setUserRole(userPermissions?.rol || 'client')  
  
      // Cargar datos del vehículo  
      const vehicleData = await vehicleService.getVehicleById(vehicleId)  
      if (!vehicleData) {  
        setError("Vehículo no encontrado")  
        return  
      }  
  
      setVehicle(vehicleData)  
  
      // Cargar datos del cliente propietario  
      const clientData = await clientService.getClientById(vehicleData.client_id)  
      setClient(clientData)  
  
      // Cargar órdenes del vehículo  
      const vehicleOrders = await orderService.getOrdersByVehicleId(vehicleId)  
      // Ordenar por fecha más reciente  
      const sortedOrders = vehicleOrders.sort((a: Order, b: Order) =>   
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()  
      )  
      setOrders(sortedOrders)  
  
      // Cargar citas del vehículo  
      const vehicleAppointments = await getAppointmentsByVehicleId(vehicleId)  
      // Ordenar por fecha más reciente  
      const sortedAppointments = vehicleAppointments.sort((a: AppointmentType, b: AppointmentType) =>   
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()  
      )  
      setAppointments(sortedAppointments)  
  
    } catch (error) {  
      console.error("Error loading vehicle data:", error)  
      setError("No se pudieron cargar los datos del vehículo")  
    } finally {  
      setLoading(false)  
      setRefreshing(false)  
    }  
  }, [vehicleId, user])  
  
  useFocusEffect(  
    useCallback(() => {  
      loadVehicleData()  
    }, [loadVehicleData])  
  )  
  
  // Obtener color del estado de la orden  
  const getStatusColor = (estado: string) => {  
    switch (estado) {  
      case "Pendiente":  
        return "#1a73e8"  
      case "En Diagnóstico":  
        return "#f5a623"  
      case "Esperando Repuestos":  
        return "#9c27b0"  
      case "En Proceso":  
        return "#ff9800"  
      case "Control Calidad":  
        return "#607d8b"  
      case "Completada":  
        return "#4caf50"  
      case "Entregada":  
        return "#607d8b"  
      case "Cancelada":  
        return "#e53935"  
      default:  
        return "#666"  
    }  
  }  
  
  // Obtener color del estado de la cita  
  const getAppointmentStatusColor = (estado: string) => {  
    switch (estado) {  
      case "programada":  
        return "#1a73e8"  
      case "confirmada":  
        return "#4caf50"  
      case "en_proceso":  
        return "#ff9800"  
      case "completada":  
        return "#607d8b"  
      case "cancelada":  
        return "#e53935"  
      default:  
        return "#666"  
    }  
  }  
  
  // Renderizar modal de imagen  
  const renderImageModal = () => (  
    <Modal  
      visible={selectedImageIndex !== null}  
      transparent={true}  
      animationType="fade"  
      onRequestClose={() => setSelectedImageIndex(null)}  
    >  
      <View style={styles.imageModalOverlay}>  
        <TouchableOpacity   
          style={styles.imageModalClose}  
          onPress={() => setSelectedImageIndex(null)}  
        >  
          <Feather name="x" size={24} color="#fff" />  
        </TouchableOpacity>  
          
        {selectedImageIndex !== null && vehicle?.images && (  
          <Image   
            source={{ uri: vehicle.images[selectedImageIndex].uri }}   
            style={styles.fullScreenImage}  
            resizeMode="contain"  
          />  
        )}  
      </View>  
    </Modal>  
  )  
  
  if (loading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#1a73e8" />  
        <Text style={styles.loadingText}>Cargando vehículo...</Text>  
      </View>  
    )  
  }  
  
  if (error) {  
    return (  
      <View style={styles.errorContainer}>  
        <Feather name="alert-circle" size={64} color="#f44336" />  
        <Text style={styles.errorText}>{error}</Text>  
        <TouchableOpacity style={styles.retryButton} onPress={loadVehicleData}>  
          <Text style={styles.retryButtonText}>Reintentar</Text>  
        </TouchableOpacity>  
      </View>  
    )  
  }  
  
  if (!vehicle) return null  
  
  return (  
    <SafeAreaView style={styles.container}>  
      <View style={styles.header}>  
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>  
          <Feather name="arrow-left" size={24} color="#333" />  
        </TouchableOpacity>  
        <Text style={styles.headerTitle}>Detalle del Vehículo</Text>  
        <TouchableOpacity   
          style={styles.editButton}  
          onPress={() => navigation.navigate("EditVehicle", { vehicleId: vehicle.id })}  
        >  
          <Feather name="edit-2" size={24} color="#1a73e8" />  
        </TouchableOpacity>  
      </View>  
  
      <ScrollView   
        style={styles.content}   
        showsVerticalScrollIndicator={false}  
        refreshControl={  
          <RefreshControl refreshing={refreshing} onRefresh={loadVehicleData} />  
        }  
      >  
        {/* Header del vehículo */}  
        <View style={styles.vehicleHeader}>  
          <View style={styles.vehicleInfo}>  
            <Text style={styles.vehicleName}>  
              {vehicle.make} {vehicle.model}  
            </Text>  
            <Text style={styles.vehicleYear}>{vehicle.year}</Text>  
            <Text style={styles.vehiclePlate}>Placa: {vehicle.license_plate}</Text>  
          </View>  
          <View style={styles.vehicleIcon}>  
            <Feather name="truck" size={32} color="#1a73e8" />  
          </View>  
        </View>  
  
        {/* Imágenes del vehículo */}  
        {vehicle.images && vehicle.images.length > 0 && (  
          <View style={styles.imagesSection}>  
            <Text style={styles.sectionTitle}>Imágenes</Text>  
            <ScrollView horizontal style={styles.imagesContainer}>  
              {vehicle.images.map((image, index: number) => (  
                <TouchableOpacity  
                  key={index}  
                  style={styles.imageContainer}  
                  onPress={() => setSelectedImageIndex(index)}  
                >  
                  <Image source={{ uri: image.uri }} style={styles.vehicleImage} />  
                </TouchableOpacity>  
              ))}  
            </ScrollView>  
          </View>  
        )}  
  
        {/* Información del cliente */}  
        {client && (  
          <View style={styles.section}>  
            <Text style={styles.sectionTitle}>Propietario</Text>  
            <TouchableOpacity  
              style={styles.clientCard}  
              onPress={() => navigation.navigate("ClientDetail", { clientId: client.id })}  
            >  
              <View style={styles.clientAvatar}>  
                <Feather name="user" size={24} color="#1a73e8" />  
              </View>  
              <View style={styles.clientInfo}>  
                <Text style={styles.clientName}>{client.name}</Text>  
                <Text style={styles.clientEmail}>{client.email}</Text>  
                <Text style={styles.clientPhone}>{client.phone}</Text>  
              </View>  
              <Feather name="chevron-right" size={20} color="#999" />  
            </TouchableOpacity>  
          </View>  
        )}  
  
        {/* Información del vehículo */}  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>Información del Vehículo</Text>  
          <View style={styles.infoCard}>  
            <View style={styles.infoRow}>  
              <Text style={styles.infoLabel}>Marca:</Text>  
              <Text style={styles.infoValue}>{vehicle.make}</Text>  
            </View>  
            <View style={styles.infoRow}>  
              <Text style={styles.infoLabel}>Modelo:</Text>  
              <Text style={styles.infoValue}>{vehicle.model}</Text>  
            </View>  
            <View style={styles.infoRow}>  
              <Text style={styles.infoLabel}>Año:</Text>  
              <Text style={styles.infoValue}>{vehicle.year}</Text>  
            </View>  
            <View style={styles.infoRow}>  
              <Text style={styles.infoLabel}>Placa:</Text>  
              <Text style={styles.infoValue}>{vehicle.license_plate}</Text>  
            </View>  
            {vehicle.vin && (  
              <View style={styles.infoRow}>  
                <Text style={styles.infoLabel}>VIN:</Text>  
                <Text style={styles.infoValue}>{vehicle.vin}</Text>  
              </View>  
            )}  
            {vehicle.color && (  
              <View style={styles.infoRow}>  
                <Text style={styles.infoLabel}>Color:</Text>  
                <Text style={styles.infoValue}>{vehicle.color}</Text>  
              </View>  
            )}  
            {vehicle.mileage && (  
              <View style={styles.infoRow}>  
                <Text style={styles.infoLabel}>Kilometraje:</Text>  
                <Text style={styles.infoValue}>{vehicle.mileage.toLocaleString()} km</Text>  
              </View>  
            )}  
          </View>  
        </View>  
  
        {/* Historial de órdenes */}  
        <View style={styles.section}>  
          <View style={styles.sectionHeader}>  
            <Text style={styles.sectionTitle}>Historial de Órdenes</Text>  
            <TouchableOpacity  
              style={styles.newOrderButton}  
              onPress={() => navigation.navigate("NewOrder", { preselectedVehicle: vehicle.id })}  
            >  
              <Feather name="plus" size={16} color="#fff" />  
              <Text style={styles.newOrderButtonText}>Nueva Orden</Text>  
            </TouchableOpacity>  
          </View>  
  
          {orders.length > 0 ? (  
            <FlatList  
              data={orders}  
              keyExtractor={(item) => item.id}  
              renderItem={({ item }) => (  
                <TouchableOpacity  
                  style={styles.orderCard}  
                  onPress={() => navigation.navigate("OrderDetail", { orderId: item.id })}  
                >  
                  <View style={styles.orderHeader}>  
                    <Text style={styles.orderNumber}>#{item.number}</Text>  
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>  
                      <Text style={styles.statusText}>{item.status}</Text>  
                    </View>  
                  </View>  
  
                  <Text style={styles.orderDescription} numberOfLines={2}>  
                    {item.description}  
                  </Text>  
  
                  <View style={styles.orderFooter}>  
                    <Text style={styles.orderDate}>  
                      {new Date(item.createdAt).toLocaleDateString("es-ES")}  
                    </Text>  
                    <Text style={styles.orderTotal}>  
                      ${(item.total || 0).toFixed(2)}  
                    </Text>  
                  </View>  
                </TouchableOpacity>  
              )}  
              scrollEnabled={false}  
            />  
          ) : (  
            <View style={styles.emptyState}>  
              <Feather name="clipboard" size={48} color="#ccc" />  
              <Text style={styles.emptyStateText}>No hay órdenes registradas</Text>  
            </View>  
          )}  
        </View>  
  
        {/* Citas programadas */}  
        <View style={styles.section}>  
          <View style={styles.sectionHeader}>  
            <Text style={styles.sectionTitle}>Citas Programadas</Text>  
            <TouchableOpacity  
              style={styles.newAppointmentButton}  
              onPress={() => navigation.navigate("NewAppointment", { preselectedVehicle: vehicle.id })}  
            >  
              <Feather name="calendar" size={16} color="#fff" />  
              <Text style={styles.newAppointmentButtonText}>Nueva Cita</Text>  
            </TouchableOpacity>  
          </View>  
  
          {appointments.length > 0 ? (  
            <FlatList  
              data={appointments}  
              keyExtractor={(item) => item.id}  
              renderItem={({ item }) => (  
                <TouchableOpacity  
                  style={styles.appointmentCard}  
                  onPress={() => navigation.navigate("AppointmentDetail", { appointmentId: item.id })}  
                >  
                  <View style={styles.appointmentHeader}>  
                    <Text style={styles.appointmentService}>{item.tipo_servicio}</Text>  
                    <View style={[styles.statusBadge, { backgroundColor: getAppointmentStatusColor(item.estado) }]}>  
                      <Text style={styles.statusText}>{item.estado}</Text>  
                    </View>  
                  </View>  
  
                  <View style={styles.appointmentDateTime}>  
                    <View style={styles.appointmentDateInfo}>  
                      <Feather name="calendar" size={14} color="#666" />  
                      <Text style={styles.appointmentDate}>  
                        {new Date(item.fecha).toLocaleDateString("es-ES")}  
                      </Text>  
                    </View>  
                    <View style={styles.appointmentTimeInfo}>  
                      <Feather name="clock" size={14} color="#666" />  
                      <Text style={styles.appointmentTime}>{item.hora}</Text>  
                    </View>  
                  </View>  
  
                  {item.notas && (  
                    <Text style={styles.appointmentNotes} numberOfLines={2}>  
                      {item.notas}  
                    </Text>  
                  )}  
                </TouchableOpacity>  
              )}  
              scrollEnabled={false}  
            />  
          ) : (  
            <View style={styles.emptyState}>  
              <Feather name="calendar" size={48} color="#ccc" />  
              <Text style={styles.emptyStateText}>No hay citas programadas</Text>  
            </View>  
          )}  
        </View>  
  
        {/* Notas del vehículo */}  
        {vehicle.notes && (  
          <View style={styles.section}>  
            <Text style={styles.sectionTitle}>Notas</Text>  
            <View style={styles.notesCard}>  
              <Text style={styles.notesText}>{vehicle.notes}</Text>  
            </View>  
          </View>  
        )}  
      </ScrollView>  
  
      {renderImageModal()}  
    </SafeAreaView>  
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
    flex: 1,  
    textAlign: "center",  
  },  
  editButton: {  
    padding: 8,  
  },  
  content: {  
    flex: 1,  
    padding: 16,  
  },  
  vehicleHeader: {  
    backgroundColor: "#fff",  
    borderRadius: 8,  
    padding: 16,  
    marginBottom: 16,  
    flexDirection: "row",  
    alignItems: "center",  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 1 },  
    shadowOpacity: 0.1,  
    shadowRadius: 2,  
    elevation: 2,  
  },  
  vehicleInfo: {  
    flex: 1,  
  },  
  vehicleName: {  
    fontSize: 20,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 4,  
  },  
  vehicleYear: {  
    fontSize: 16,  
    color: "#666",  
    marginBottom: 4,  
  },  
  vehiclePlate: {  
    fontSize: 14,  
    color: "#999",  
  },  
  vehicleIcon: {  
    width: 60,  
    height: 60,  
    borderRadius: 30,  
    backgroundColor: "#f5f5f5",  
    justifyContent: "center",  
    alignItems: "center",  
  },  
  imagesSection: {  
    backgroundColor: "#fff",  
    borderRadius: 8,  
    padding: 16,  
    marginBottom: 16,  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 1 },  
    shadowOpacity: 0.1,  
    shadowRadius: 2,  
    elevation: 2,  
  },  
  imagesContainer: {  
    marginTop: 12,  
  },  
  imageContainer: {  
    marginRight: 12,  
  },  
  vehicleImage: {  
    width: 100,  
    height: 100,  
    borderRadius: 8,  
  },  
  section: {  
    backgroundColor: "#fff",  
    borderRadius: 8,  
    padding: 16,  
    marginBottom: 16,  
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
    marginBottom: 16,  
  },  
  sectionHeader: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    marginBottom: 16,  
  },  
  newOrderButton: {  
    backgroundColor: "#1a73e8",  
    flexDirection: "row",  
    alignItems: "center",  
    paddingHorizontal: 12,  
    paddingVertical: 8,  
    borderRadius: 6,  
    gap: 4,  
  },  
  newOrderButtonText: {  
    color: "#fff",  
    fontSize: 12,  
    fontWeight: "500",  
  },  
  newAppointmentButton: {  
    backgroundColor: "#4caf50",  
    flexDirection: "row",  
    alignItems: "center",  
    paddingHorizontal: 12,  
    paddingVertical: 8,  
    borderRadius: 6,  
    gap: 4,  
  },  
  newAppointmentButtonText: {  
    color: "#fff",  
    fontSize: 12,  
    fontWeight: "500",  
  },  
  clientCard: {  
    flexDirection: "row",  
    alignItems: "center",  
    padding: 12,  
    backgroundColor: "#f8f9fa",  
    borderRadius: 8,  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  clientAvatar: {  
    width: 48,  
    height: 48,  
    borderRadius: 24,  
    backgroundColor: "#fff",  
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
    marginBottom: 2,  
  },  
  clientEmail: {  
    fontSize: 12,  
    color: "#666",  
    marginBottom: 2,  
  },  
  clientPhone: {  
    fontSize: 12,  
    color: "#666",  
  },  
  infoCard: {  
    backgroundColor: "#f8f9fa",  
    borderRadius: 8,  
    padding: 12,  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  infoRow: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    paddingVertical: 8,  
    borderBottomWidth: 1,  
    borderBottomColor: "#f0f0f0",  
  },  
  infoLabel: {  
    fontSize: 14,  
    color: "#666",  
  },  
  infoValue: {  
    fontSize: 14,  
    fontWeight: "500",  
    color: "#333",  
  },  
  orderCard: {  
    backgroundColor: "#f8f9fa",  
    borderRadius: 8,  
    padding: 12,  
    marginBottom: 8,  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
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
    fontSize: 12,  
    color: "#fff",  
    fontWeight: "500",  
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
    color: "#666",  
  },  
  orderTotal: {  
    fontSize: 14,  
    fontWeight: "bold",  
    color: "#4caf50",  
  },  
  appointmentCard: {  
    backgroundColor: "#f8f9fa",  
    borderRadius: 8,  
    padding: 12,  
    marginBottom: 8,  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  appointmentHeader: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    marginBottom: 8,  
  },  
  appointmentService: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  appointmentDateTime: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    marginBottom: 8,  
  },  
  appointmentDateInfo: {  
    flexDirection: "row",  
    alignItems: "center",  
  },  
  appointmentDate: {  
    fontSize: 12,  
    color: "#666",  
    marginLeft: 4,  
  },  
  appointmentTimeInfo: {  
    flexDirection: "row",  
    alignItems: "center",  
  },  
  appointmentTime: {  
    fontSize: 12,  
    color: "#666",  
    marginLeft: 4,  
  },  
  appointmentNotes: {  
    fontSize: 12,  
    color: "#999",  
    fontStyle: "italic",  
  },  
  emptyState: {  
    alignItems: "center",  
    paddingVertical: 40,  
  },  
  emptyStateText: {  
    fontSize: 16,  
    color: "#999",  
    marginTop: 12,  
  },  
  notesCard: {  
    backgroundColor: "#f8f9fa",  
    borderRadius: 8,  
    padding: 12,  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  notesText: {  
    fontSize: 14,  
    color: "#666",  
    lineHeight: 20,  
  },  
  imageModalOverlay: {  
    flex: 1,  
    backgroundColor: "rgba(0, 0, 0, 0.9)",  
    justifyContent: "center",  
    alignItems: "center",  
  },  
  imageModalClose: {  
    position: "absolute",  
    top: 50,  
    right: 20,  
    zIndex: 1,  
    padding: 10,  
  },  
  fullScreenImage: {  
    width: "90%",  
    height: "80%",  
  },  
})