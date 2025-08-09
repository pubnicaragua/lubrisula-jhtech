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
  ScrollView,  
} from "react-native"  
import { Feather, MaterialIcons } from "@expo/vector-icons"  
import { useFocusEffect } from "@react-navigation/native"  
import { useAuth } from "../context/auth-context"  
import { CITAS_SERVICES, CitasDetalleType } from "../services/supabase/citas-services"  
import VEHICULO_SERVICES from "../services/supabase/vehicle-service"  
import CLIENTS_SERVICES from "../services/supabase/client-service"
import ACCESOS_SERVICES from "../services/supabase/access-service"  
import USER_SERVICE from "../services/supabase/user-service" 
  
export default function AppointmentsScreen({ navigation }) {  
  const { user } = useAuth()  
  const [appointments, setAppointments] = useState<CitasDetalleType[]>([])  
  const [loading, setLoading] = useState(true)  
  const [refreshing, setRefreshing] = useState(false)  
  const [selectedAppointment, setSelectedAppointment] = useState<CitasDetalleType | null>(null)  
  const [detailModalVisible, setDetailModalVisible] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
  const [filterStatus, setFilterStatus] = useState<string>("all")  
  
  const loadAppointments = useCallback(async () => {  
    try {  
      setLoading(true)  
      setError(null)  
  
      if (!user?.id) return  
  
      // Validar permisos del usuario  
      const userTallerId = await USER_SERVICE.GET_TALLER_ID(user.id)  
      const userPermissions = await ACCESOS_SERVICES.GET_PERMISOS_USUARIO(user.id, userTallerId)  
      setUserRole(userPermissions?.rol || 'client')  
  
      // Cargar citas según el rol  
      let allAppointments = []  
      if (userPermissions?.rol === 'client') {  
        // Cliente solo ve sus citas  
        const clientAppointments = await CITAS_SERVICES.GET_ALL_CITAS()  
        allAppointments = clientAppointments.filter(appointment => appointment.client_id === user.id)  
      } else {  
        // Admin/técnico ve todas las citas  
        allAppointments = await CITAS_SERVICES.GET_ALL_CITAS()  
      }  
  
      setAppointments(allAppointments)  
  
    } catch (error) {  
      console.error("Error loading appointments:", error)  
      setError("No se pudieron cargar las citas")  
    } finally {  
      setLoading(false)  
      setRefreshing(false)  
    }  
  }, [user])  
  
  useFocusEffect(  
    useCallback(() => {  
      loadAppointments()  
    }, [loadAppointments])  
  )  
  
  const getStatusColor = (status: string) => {  
    switch (status) {  
      case "programada": return "#1a73e8"  
      case "confirmada": return "#4caf50"  
      case "en_proceso": return "#f5a623"  
      case "completada": return "#607d8b"  
      case "cancelada": return "#e53935"  
      default: return "#666"  
    }  
  }  
  
  const getStatusText = (status: string) => {  
    switch (status) {  
      case "programada": return "Programada"  
      case "confirmada": return "Confirmada"  
      case "en_proceso": return "En Proceso"  
      case "completada": return "Completada"  
      case "cancelada": return "Cancelada"  
      default: return "Desconocido"  
    }  
  }  
  
  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {  
    try {  
      await CITAS_SERVICES.UPDATE_CITA_STATUS(appointmentId, newStatus)  
      loadAppointments()  
      setDetailModalVisible(false)  
      Alert.alert("Éxito", "Estado de la cita actualizado correctamente")  
    } catch (error) {  
      console.error("Error updating appointment status:", error)  
      Alert.alert("Error", "No se pudo actualizar el estado de la cita")  
    }  
  }  
  
  const filteredAppointments = appointments.filter(appointment => {  
    if (filterStatus === "all") return true  
    return appointment.estado === filterStatus  
  })  
  
  const renderAppointmentItem = ({ item }: { item: CitasDetalleType }) => (  
    <TouchableOpacity  
      style={styles.appointmentCard}  
      onPress={() => {  
        setSelectedAppointment(item)  
        setDetailModalVisible(true)  
      }}  
    >  
      <View style={styles.appointmentHeader}>  
        <View style={styles.appointmentInfo}>  
          <Text style={styles.appointmentTitle}>  
            {item.tipos_operacion?.nombre || "Servicio"}  
          </Text>  
          <Text style={styles.appointmentClient}>  
            {item.clients?.name || "Cliente"}  
          </Text>  
          <Text style={styles.appointmentVehicle}>  
            {item.vehicles?.marca} {item.vehicles?.modelo} - {item.vehicles?.placa}  
          </Text>  
        </View>  
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.estado) }]}>  
          <Text style={styles.statusText}>{getStatusText(item.estado)}</Text>  
        </View>  
      </View>  
  
      <View style={styles.appointmentDetails}>  
        <View style={styles.appointmentDetail}>  
          <Feather name="calendar" size={16} color="#666" />  
          <Text style={styles.appointmentDetailText}>  
            {new Date(item.fecha || '').toLocaleDateString("es-ES")}  
          </Text>  
        </View>  
        <View style={styles.appointmentDetail}>  
          <Feather name="clock" size={16} color="#666" />  
          <Text style={styles.appointmentDetailText}>  
            {item.hora_inicio} - {item.hora_fin}  
          </Text>  
        </View>  
        {item.tecnicos && (  
          <View style={styles.appointmentDetail}>  
            <Feather name="user" size={16} color="#666" />  
            <Text style={styles.appointmentDetailText}>  
              {item.tecnicos.nombre} {item.tecnicos.apellido}  
            </Text>  
          </View>  
        )}  
      </View>  
    </TouchableOpacity>  
  )  
  
  const renderDetailModal = () => (  
    <Modal  
      visible={detailModalVisible}  
      animationType="slide"  
      presentationStyle="pageSheet"  
    >  
      <View style={styles.modalContainer}>  
        <View style={styles.modalHeader}>  
          <Text style={styles.modalTitle}>Detalle de Cita</Text>  
          <TouchableOpacity  
            onPress={() => setDetailModalVisible(false)}  
            style={styles.closeButton}  
          >  
            <Feather name="x" size={24} color="#666" />  
          </TouchableOpacity>  
        </View>  
  
        {selectedAppointment && (  
          <ScrollView style={styles.modalContent}>  
            <View style={styles.detailSection}>  
              <Text style={styles.sectionTitle}>Información General</Text>  
              <View style={styles.detailRow}>  
                <Text style={styles.detailLabel}>Servicio:</Text>  
                <Text style={styles.detailValue}>  
                  {selectedAppointment.tipos_operacion?.nombre}  
                </Text>  
              </View>  
              <View style={styles.detailRow}>  
                <Text style={styles.detailLabel}>Cliente:</Text>  
                <Text style={styles.detailValue}>  
                  {selectedAppointment.clients?.name}  
                </Text>  
              </View>  
              <View style={styles.detailRow}>  
                <Text style={styles.detailLabel}>Vehículo:</Text>  
                <Text style={styles.detailValue}>  
                  {selectedAppointment.vehicles?.marca} {selectedAppointment.vehicles?.modelo}  
                </Text>  
              </View>  
              <View style={styles.detailRow}>  
                <Text style={styles.detailLabel}>Fecha:</Text>  
                <Text style={styles.detailValue}>  
                  {new Date(selectedAppointment.fecha || '').toLocaleDateString("es-ES")}  
                </Text>  
              </View>  
              <View style={styles.detailRow}>  
                <Text style={styles.detailLabel}>Horario:</Text>  
                <Text style={styles.detailValue}>  
                  {selectedAppointment.hora_inicio} - {selectedAppointment.hora_fin}  
                </Text>  
              </View>  
              <View style={styles.detailRow}>  
                <Text style={styles.detailLabel}>Estado:</Text>  
                <Text style={[  
                  styles.detailValue,  
                  { color: getStatusColor(selectedAppointment.estado) }  
                ]}>  
                  {getStatusText(selectedAppointment.estado)}  
                </Text>  
              </View>  
            </View>  
  
            {selectedAppointment.observaciones && (  
              <View style={styles.detailSection}>  
                <Text style={styles.sectionTitle}>Observaciones</Text>  
                <Text style={styles.observationText}>  
                  {selectedAppointment.observaciones}  
                </Text>  
              </View>  
            )}  
          </ScrollView>  
        )}  
  
        {userRole !== 'client' && selectedAppointment && (  
          <View style={styles.modalFooter}>  
            <TouchableOpacity  
              style={[styles.modalButton, styles.confirmButton]}  
              onPress={() => handleStatusUpdate(selectedAppointment.id!, "confirmada")}  
            >  
              <Feather name="check" size={20} color="#fff" />  
              <Text style={styles.buttonText}>Confirmar</Text>  
            </TouchableOpacity>  
              
            <TouchableOpacity  
              style={[styles.modalButton, styles.cancelButton]}  
              onPress={() => handleStatusUpdate(selectedAppointment.id!, "cancelada")}  
            >  
              <Feather name="x" size={20} color="#fff" />  
              <Text style={styles.buttonText}>Cancelar</Text>  
            </TouchableOpacity>  
          </View>  
        )}  
      </View>  
    </Modal>  
  )  
  
  if (loading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#1a73e8" />  
        <Text style={styles.loadingText}>Cargando citas...</Text>  
      </View>  
    )  
  }  
  
  return (  
    <View style={styles.container}>  
      <View style={styles.header}>  
        <Text style={styles.title}>Citas Programadas</Text>  
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
            style={[styles.filterButton, filterStatus === "programada" && styles.filterButtonActive]}  
            onPress={() => setFilterStatus("programada")}  
          >  
            <Text style={[styles.filterButtonText, filterStatus === "programada" && styles.filterButtonTextActive]}>  
              Programadas  
            </Text>  
          </TouchableOpacity>  
          <TouchableOpacity  
            style={[styles.filterButton, filterStatus === "confirmada" && styles.filterButtonActive]}  
            onPress={() => setFilterStatus("confirmada")}  
          >  
            <Text style={[styles.filterButtonText, filterStatus === "confirmada" && styles.filterButtonTextActive]}>  
              Confirmadas  
            </Text>  
          </TouchableOpacity>  
        </View>  
      </View>  
  
      {error ? (  
        <View style={styles.errorContainer}>  
          <MaterialIcons name="error" size={64} color="#f44336" />  
          <Text style={styles.errorText}>{error}</Text>  
          <TouchableOpacity style={styles.retryButton} onPress={loadAppointments}>  
            <Text style={styles.retryButtonText}>Reintentar</Text>  
          </TouchableOpacity>  
        </View>  
      ) : (  
        <>  
          {filteredAppointments.length === 0 ? (  
            <View style={styles.emptyContainer}>  
              <Feather name="calendar" size={64} color="#ccc" />  
              <Text style={styles.emptyText}>No hay citas programadas</Text>  
              {userRole !== 'client' && (  
                <TouchableOpacity   
                  style={styles.addButton}  
                  onPress={() => navigation.navigate("NewAppointment")}  
                >  
                  <Text style={styles.addButtonText}>Programar Nueva Cita</Text>  
                </TouchableOpacity>  
              )}  
            </View>  
          ) : (  
            <FlatList  
              data={filteredAppointments}  
              keyExtractor={(item) => item.id!}  
              renderItem={renderAppointmentItem}  
              refreshControl={  
                <RefreshControl refreshing={refreshing} onRefresh={loadAppointments} colors={["#1a73e8"]} />  
              }  
              contentContainerStyle={styles.listContainer}  
              showsVerticalScrollIndicator={false}  
            />  
          )}  
  
          {userRole !== 'client' && (  
            <TouchableOpacity   
              style={styles.fab}  
              onPress={() => navigation.navigate("NewAppointment")}  
            >  
              <Feather name="plus" size={24} color="#fff" />  
            </TouchableOpacity>  
          )}  
        </>  
      )}  
  
      {renderDetailModal()}  
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
    backgroundColor: "#fff",  
    padding: 16,  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  title: {  
    fontSize: 24,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 16,  
  },  
  filterContainer: {  
    flexDirection: "row",  
    gap: 8,  
  },  
  filterButton: {  
    paddingHorizontal: 16,  
    paddingVertical: 8,  
    borderRadius: 20,  
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
    marginBottom: 20,  
    textAlign: "center",  
  },  
  addButton: {  
    backgroundColor: "#1a73e8",  
    paddingHorizontal: 20,  
    paddingVertical: 12,  
    borderRadius: 8,  
  },  
  addButtonText: {  
    color: "#fff",  
    fontWeight: "bold",  
    fontSize: 16,  
  },  
  listContainer: {  
    padding: 16,  
  },  
  appointmentCard: {  
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
  appointmentHeader: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "flex-start",  
    marginBottom: 12,  
  },  
  appointmentInfo: {  
    flex: 1,  
    marginRight: 12,  
  },  
  appointmentTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 4,  
  },  
  appointmentClient: {  
    fontSize: 14,  
    color: "#666",  
    marginBottom: 2,  
  },  
  appointmentVehicle: {  
    fontSize: 14,  
    color: "#1a73e8",  
    fontWeight: "500",  
  },  
  statusBadge: {  
    paddingHorizontal: 12,  
    paddingVertical: 6,  
    borderRadius: 16,  
  },  
  statusText: {  
    color: "#fff",  
    fontSize: 12,  
    fontWeight: "bold",  
  },  
  appointmentDetails: {  
    gap: 8,  
  },  
  appointmentDetail: {  
    flexDirection: "row",  
    alignItems: "center",  
    gap: 8,  
  },  
  appointmentDetailText: {  
    fontSize: 14,  
    color: "#666",  
  },  
  fab: {  
    position: "absolute",  
    bottom: 20,  
    right: 20,  
    width: 56,  
    height: 56,  
    borderRadius: 28,  
    backgroundColor: "#1a73e8",  
    justifyContent: "center",  
    alignItems: "center",  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 4 },  
    shadowOpacity: 0.3,  
    shadowRadius: 8,  
    elevation: 8,  
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
  detailSection: {  
    marginBottom: 24,  
  },  
  sectionTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 16,  
  },  
  detailRow: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    paddingVertical: 8,  
    borderBottomWidth: 1,  
    borderBottomColor: "#f0f0f0",  
  },  
  detailLabel: {  
    fontSize: 16,  
    color: "#666",  
    fontWeight: "500",  
  },  
  detailValue: {  
    fontSize: 16,  
    color: "#333",  
    flex: 1,  
    textAlign: "right",  
  },  
  observationText: {  
    fontSize: 16,  
    color: "#333",  
    lineHeight: 24,  
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
    flexDirection: "row",  
    justifyContent: "center",  
    alignItems: "center",  
    paddingVertical: 12,  
    borderRadius: 8,  
    gap: 8,  
  },  
  confirmButton: {  
    backgroundColor: "#4caf50",  
  },  
  cancelButton: {  
    backgroundColor: "#e53935",  
  },  
  buttonText: {  
    color: "#fff",  
    fontWeight: "bold",  
    fontSize: 16,  
  },  
})