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
import { useFocusEffect } from "@react-navigation/native"  
import { StackNavigationProp } from "@react-navigation/stack"  
import { RouteProp } from "@react-navigation/native"  
import { useAuth } from "../context/auth-context"  
import { CITAS_SERVICES } from "../services/supabase/citas-services"  
import ACCESOS_SERVICES from "../services/supabase/access-service"  
import USER_SERVICE from "../services/supabase/user-service"  
import { CitasDetalleType } from "../types"  
import { RootStackParamList } from "../types/navigation"  
  
type AppointmentDetailNavigationProp = StackNavigationProp<RootStackParamList, 'AppointmentDetail'>  
type AppointmentDetailRouteProp = RouteProp<RootStackParamList, 'AppointmentDetail'>  
  
interface Props {  
  navigation: AppointmentDetailNavigationProp  
  route: AppointmentDetailRouteProp  
}  
  
export default function AppointmentDetailScreen({ navigation, route }: Props) {  
  const { appointmentId } = route.params  
  const { user } = useAuth()  
    
  const [appointment, setAppointment] = useState<CitasDetalleType | null>(null)  
  const [loading, setLoading] = useState(true)  
  const [updating, setUpdating] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
  const [showStatusModal, setShowStatusModal] = useState(false)  
  
  const loadAppointmentDetail = useCallback(async () => {  
    try {  
      setLoading(true)  
      setError(null)  
  
      if (!user?.id) return  
  
      // Validar permisos del usuario  
      const userTallerId = await USER_SERVICE.GET_TALLER_ID(user.id)  
      if (!userTallerId) {  
        setError("Usuario no asociado a un taller")  
        return  
      }  
  
      const userPermissions = await ACCESOS_SERVICES.GET_PERMISOS_USUARIO(user.id, userTallerId)  
      setUserRole(userPermissions?.rol || 'client')  
  
      // Cargar todas las citas y filtrar por ID  
      const allAppointments = await CITAS_SERVICES.GET_ALL_CITAS()  
      const appointmentDetail = allAppointments.find(apt => apt.id === appointmentId)  
  
      if (!appointmentDetail) {  
        setError("Cita no encontrada")  
        return  
      }  
  
      // Verificar permisos de acceso  
      if (userPermissions?.rol === 'client' && appointmentDetail.client_id !== user.id) {  
        setError("No tienes permisos para ver esta cita")  
        return  
      }  
  
      setAppointment(appointmentDetail)  
    } catch (error) {  
      console.error("Error loading appointment detail:", error)  
      setError("No se pudo cargar el detalle de la cita")  
    } finally {  
      setLoading(false)  
    }  
  }, [appointmentId, user])  
  
  useFocusEffect(  
    useCallback(() => {  
      loadAppointmentDetail()  
    }, [loadAppointmentDetail])  
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
  
  const handleStatusUpdate = async (newStatus: string) => {  
    if (!appointment) return  
  
    try {  
      setUpdating(true)  
      await CITAS_SERVICES.UPDATE_CITA_STATUS(appointment.id!, newStatus)  
        
      // Recargar datos  
      await loadAppointmentDetail()  
      setShowStatusModal(false)  
        
      Alert.alert("Éxito", "Estado de la cita actualizado correctamente")  
    } catch (error) {  
      console.error("Error updating appointment status:", error)  
      Alert.alert("Error", "No se pudo actualizar el estado de la cita")  
    } finally {  
      setUpdating(false)  
    }  
  }  
  
  const handleEditAppointment = () => {  
    if (appointment) {  
      navigation.navigate("NewAppointment", {  
        appointmentId: appointment.id,  
        preselectedVehicle: appointment.vehiculo_id,  
        clientId: appointment.client_id  
      })  
    }  
  }  
  
  const handleDeleteAppointment = () => {  
    Alert.alert(  
      "Confirmar eliminación",  
      "¿Estás seguro de que deseas eliminar esta cita?",  
      [  
        { text: "Cancelar", style: "cancel" },  
        {  
          text: "Eliminar",  
          style: "destructive",  
          onPress: async () => {  
            try {  
              if (appointment) {  
                await CITAS_SERVICES.DELETE_CITA(appointment.id!)  
                Alert.alert("Éxito", "Cita eliminada correctamente")  
                navigation.goBack()  
              }  
            } catch (error) {  
              console.error("Error deleting appointment:", error)  
              Alert.alert("Error", "No se pudo eliminar la cita")  
            }  
          }  
        }  
      ]  
    )  
  }  
  
  if (loading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#1a73e8" />  
        <Text style={styles.loadingText}>Cargando detalle de cita...</Text>  
      </View>  
    )  
  }  
  
  if (error) {  
    return (  
      <View style={styles.errorContainer}>  
        <MaterialIcons name="error" size={64} color="#f44336" />  
        <Text style={styles.errorText}>{error}</Text>  
        <TouchableOpacity style={styles.retryButton} onPress={loadAppointmentDetail}>  
          <Text style={styles.retryButtonText}>Reintentar</Text>  
        </TouchableOpacity>  
      </View>  
    )  
  }  
  
  if (!appointment) {  
    return (  
      <View style={styles.errorContainer}>  
        <Feather name="calendar" size={64} color="#ccc" />  
        <Text style={styles.errorText}>Cita no encontrada</Text>  
      </View>  
    )  
  }  
  
  return (  
    <View style={styles.container}>  
      {/* Header */}  
      <View style={styles.header}>  
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>  
          <Feather name="arrow-left" size={24} color="#333" />  
        </TouchableOpacity>  
        <Text style={styles.headerTitle}>Detalle de Cita</Text>  
        <View style={styles.headerActions}>  
          {userRole !== 'client' && (  
            <TouchableOpacity style={styles.headerButton} onPress={() => setShowStatusModal(true)}>  
              <Feather name="edit" size={20} color="#1a73e8" />  
            </TouchableOpacity>  
          )}  
        </View>  
      </View>  
  
      <ScrollView style={styles.content}>  
        {/* Estado de la cita */}  
        <View style={styles.statusContainer}>  
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.estado) }]}>  
            <Text style={styles.statusText}>{getStatusText(appointment.estado)}</Text>  
          </View>  
        </View>  
  
        {/* Información principal */}  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>Información General</Text>  
            
          <View style={styles.infoRow}>  
            <View style={styles.infoIcon}>  
              <Feather name="tool" size={20} color="#1a73e8" />  
            </View>  
            <View style={styles.infoContent}>  
              <Text style={styles.infoLabel}>Tipo de Servicio</Text>  
              <Text style={styles.infoValue}>{appointment.tipos_operacion?.nombre || "No especificado"}</Text>  
            </View>  
          </View>  
  
          <View style={styles.infoRow}>  
            <View style={styles.infoIcon}>  
              <Feather name="user" size={20} color="#1a73e8" />  
            </View>  
            <View style={styles.infoContent}>  
              <Text style={styles.infoLabel}>Cliente</Text>  
              <Text style={styles.infoValue}>{appointment.clients?.name || "No especificado"}</Text>  
            </View>  
          </View>  
  
          <View style={styles.infoRow}>  
            <View style={styles.infoIcon}>  
              <Feather name="truck" size={20} color="#1a73e8" />  
            </View>  
            <View style={styles.infoContent}>  
              <Text style={styles.infoLabel}>Vehículo</Text>  
              <Text style={styles.infoValue}>  
                {appointment.vehicles?.marca} {appointment.vehicles?.modelo}  
              </Text>  
              <Text style={styles.infoSubvalue}>Placa: {appointment.vehicles?.placa}</Text>  
            </View>  
          </View>  
  
          <View style={styles.infoRow}>  
            <View style={styles.infoIcon}>  
              <Feather name="calendar" size={20} color="#1a73e8" />  
            </View>  
            <View style={styles.infoContent}>  
              <Text style={styles.infoLabel}>Fecha</Text>  
              <Text style={styles.infoValue}>  
                {new Date(appointment.fecha || '').toLocaleDateString("es-ES", {  
                  weekday: 'long',  
                  year: 'numeric',  
                  month: 'long',  
                  day: 'numeric'  
                })}  
              </Text>  
            </View>  
          </View>  
  
          <View style={styles.infoRow}>  
            <View style={styles.infoIcon}>  
              <Feather name="clock" size={20} color="#1a73e8" />  
            </View>  
            <View style={styles.infoContent}>  
              <Text style={styles.infoLabel}>Horario</Text>  
              <Text style={styles.infoValue}>  
                {appointment.hora_inicio} - {appointment.hora_fin}  
              </Text>  
            </View>  
          </View>  
  
          {appointment.tecnicos && (  
            <View style={styles.infoRow}>  
              <View style={styles.infoIcon}>  
                <Feather name="user-check" size={20} color="#1a73e8" />  
              </View>  
              <View style={styles.infoContent}>  
                <Text style={styles.infoLabel}>Técnico Asignado</Text>  
                <Text style={styles.infoValue}>  
                  {appointment.tecnicos.nombre} {appointment.tecnicos.apellido}  
                </Text>  
              </View>  
            </View>  
          )}  
        </View>  
  
        {/* Observaciones */}  
        {appointment.observaciones && (  
          <View style={styles.section}>  
            <Text style={styles.sectionTitle}>Observaciones</Text>  
            <Text style={styles.observationText}>{appointment.observaciones}</Text>  
          </View>  
        )}  
  
        {/* Información de fechas */}  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>Información de Registro</Text>  
            
          <View style={styles.infoRow}>  
            <View style={styles.infoIcon}>  
              <Feather name="plus-circle" size={20} color="#666" />  
            </View>  
            <View style={styles.infoContent}>  
              <Text style={styles.infoLabel}>Fecha de Creación</Text>  
              <Text style={styles.infoValue}>  
                {new Date(appointment.created_at || '').toLocaleString("es-ES")}  
              </Text>  
            </View>  
          </View>  
  
          {appointment.updated_at && appointment.updated_at !== appointment.created_at && (  
            <View style={styles.infoRow}>  
              <View style={styles.infoIcon}>  
                <Feather name="edit-3" size={20} color="#666" />  
              </View>  
              <View style={styles.infoContent}>  
                <Text style={styles.infoLabel}>Última Actualización</Text>  
                <Text style={styles.infoValue}>  
                  {new Date(appointment.updated_at).toLocaleString("es-ES")}  
                </Text>  
              </View>  
            </View>  
          )}  
        </View>  
      </ScrollView>  
  
      {/* Acciones para técnicos */}  
      {userRole !== 'client' && (  
        <View style={styles.footer}>  
          <TouchableOpacity  
            style={[styles.footerButton, styles.editButton]}  
            onPress={handleEditAppointment}  
          >  
            <Feather name="edit" size={20} color="#1a73e8" />  
            <Text style={styles.editButtonText}>Editar</Text>  
          </TouchableOpacity>  
            
          <TouchableOpacity  
            style={[styles.footerButton, styles.deleteButton]}  
            onPress={handleDeleteAppointment}  
          >  
            <Feather name="trash-2" size={20} color="#e53935" />  
            <Text style={styles.deleteButtonText}>Eliminar</Text>  
          </TouchableOpacity>  
        </View>  
      )}  
  
      {/* Modal de cambio de estado */}  
      <Modal  
        visible={showStatusModal}  
        animationType="slide"  
        presentationStyle="pageSheet"  
      >  
        <View style={styles.modalContainer}>  
          <View style={styles.modalHeader}>  
            <Text style={styles.modalTitle}>Cambiar Estado</Text>  
            <TouchableOpacity onPress={() => setShowStatusModal(false)}>  
              <Feather name="x" size={24} color="#666" />  
            </TouchableOpacity>  
          </View>  
  
          <View style={styles.modalContent}>  
            {[  
              { key: 'programada', label: 'Programada', color: '#1a73e8' },  
              { key: 'confirmada', label: 'Confirmada', color: '#4caf50' },  
              { key: 'en_proceso', label: 'En Proceso', color: '#f5a623' },  
              { key: 'completada', label: 'Completada', color: '#607d8b' },  
              { key: 'cancelada', label: 'Cancelada', color: '#e53935' },  
            ].map((status) => (  
              <TouchableOpacity  
                key={status.key}  
                style={[styles.statusOption, { borderLeftColor: status.color }]}  
                onPress={() => handleStatusUpdate(status.key)}  
                disabled={updating}  
              >  
                <View style={[styles.statusDot, { backgroundColor: status.color }]} />  
                <Text style={styles.statusOptionText}>{status.label}</Text>  
                {updating && <ActivityIndicator size="small" color={status.color} />}  
              </TouchableOpacity>  
            ))}  
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
  headerActions: {  
    flexDirection: "row",  
    gap: 8,  
  },  
  headerButton: {  
    padding: 8,  
  },  
  content: {  
    flex: 1,  
    padding: 16,  
  },  
  statusContainer: {  
    alignItems: "center",  
    marginBottom: 20,  
  },  
  statusBadge: {  
    paddingHorizontal: 16,  
    paddingVertical: 8,  
    borderRadius: 20,  
  },  
  statusText: {  
    color: "#fff",  
    fontSize: 14,  
    fontWeight: "bold",  
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
  infoRow: {  
    flexDirection: "row",  
    alignItems: "flex-start",  
    marginBottom: 16,  
  },  
  infoIcon: {  
    width: 40,  
    height: 40,  
    borderRadius: 20,  
    backgroundColor: "#f0f8ff",  
    justifyContent: "center",  
    alignItems: "center",  
    marginRight: 12,  
  },  
  infoContent: {  
    flex: 1,  
  },  
  infoLabel: {  
    fontSize: 14,  
    color: "#666",  
    marginBottom: 4,  
  },  
  infoValue: {  
    fontSize: 16,  
    color: "#333",  
    fontWeight: "500",  
  },  
  infoSubvalue: {  
    fontSize: 14,  
    color: "#999",  
    marginTop: 2,  
  },  
  observationText: {  
    fontSize: 16,  
    color: "#333",  
    lineHeight: 24,  
  },  
  footer: {  
    flexDirection: "row",  
    padding: 16,  
    backgroundColor: "#fff",  
    borderTopWidth: 1,  
    borderTopColor: "#e1e4e8",  
    gap: 12,  
  },  
  footerButton: {  
    flex: 1,  
    flexDirection: "row",  
    justifyContent: "center",  
    alignItems: "center",  
    paddingVertical: 12,  
    borderRadius: 8,  
    gap: 8,  
  },  
  editButton: {  
    backgroundColor: "#f0f8ff",  
    borderWidth: 1,  
    borderColor: "#1a73e8",  
  },  
  editButtonText: {  
    color: "#1a73e8",  
    fontWeight: "bold",  
    fontSize: 16,  
  },  
  deleteButton: {  
    backgroundColor: "#fff5f5",  
    borderWidth: 1,  
    borderColor: "#e53935",  
  },  
  deleteButtonText: {  
    color: "#e53935",  
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
  modalContent: {  
    flex: 1,  
    padding: 16,  
  },  
  statusOption: {  
    flexDirection: "row",  
    alignItems: "center",  
    padding: 16,  
    backgroundColor: "#fff",  
    borderRadius: 8,  
    marginBottom: 12,  
    borderLeftWidth: 4,  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 1 },  
    shadowOpacity: 0.1,  
    shadowRadius: 2,  
    elevation: 2,  
  },  
  statusDot: {  
    width: 12,  
    height: 12,  
    borderRadius: 6,  
    marginRight: 12,  
  },  
  statusOptionText: {  
    flex: 1,  
    fontSize: 16,  
    color: "#333",  
    fontWeight: "500",  
  },  
})