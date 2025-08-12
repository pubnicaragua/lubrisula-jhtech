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
  TextInput,  
  Modal,  
} from "react-native"  
import { Feather, MaterialIcons } from "@expo/vector-icons"  
import { useFocusEffect } from "@react-navigation/native"  
import { useAuth } from "../context/auth-context"  
// Importaciones corregidas para usar servicios de Supabase  
import { orderService } from "../services/supabase/order-service"  
import { clientService } from "../services/supabase/client-service"  
import { vehicleService } from "../services/supabase/vehicle-service"  
import { getAllServices } from "../services/supabase/services-service"  
import { userService } from "../services/supabase/user-service"  
import { accessService } from "../services/supabase/access-service"  
import { UiScreenProps } from "../types"
import { Order } from "../types/order"
  
interface TechnicianType {  
  id: string  
  nombre: string  
}  
  
interface ServiceType {  
  id: string  
  nombre: string  
  precio?: number  
}  
  
export default function UpdateOrderScreen({ route, navigation }: UiScreenProps) {  
  const { orderId } = route.params  
  const { user } = useAuth()  
    
  const [order, setOrder] = useState<Order | null>(null)  
  const [loading, setLoading] = useState(true)  
  const [saving, setSaving] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
    
  // Form fields  
  const [descripcion, setDescripcion] = useState("")  
  const [observacion, setObservacion] = useState("")  
  const [prioridad, setPrioridad] = useState("normal")  
  const [estado, setEstado] = useState("Pendiente")  
  const [costo, setCosto] = useState("")  
  const [tecnicoId, setTecnicoId] = useState("")  
  const [servicioId, setServicioId] = useState("")  
    
  // Data for dropdowns  
  const [technicians, setTechnicians] = useState<TechnicianType[]>([])  
  const [services, setServices] = useState<ServiceType[]>([])  
  const [showTechnicianModal, setShowTechnicianModal] = useState(false)  
  const [showServiceModal, setShowServiceModal] = useState(false)  
  const [showStatusModal, setShowStatusModal] = useState(false)  
  
  const PRIORITY_OPTIONS = [  
    { value: "low", label: "Baja", color: "#607d8b" },  
    { value: "normal", label: "Normal", color: "#4caf50" },  
    { value: "high", label: "Alta", color: "#f44336" },  
  ]  
  
  const STATUS_OPTIONS = [  
    { value: "Pendiente", label: "Pendiente", color: "#1a73e8" },  
    { value: "En Diagnóstico", label: "En Diagnóstico", color: "#f5a623" },  
    { value: "Esperando Repuestos", label: "Esperando Repuestos", color: "#9c27b0" },  
    { value: "En Proceso", label: "En Proceso", color: "#ff9800" },  
    { value: "Control Calidad", label: "Control Calidad", color: "#607d8b" },  
    { value: "Completada", label: "Completada", color: "#4caf50" },  
    { value: "Entregada", label: "Entregada", color: "#607d8b" },  
    { value: "Cancelada", label: "Cancelada", color: "#e53935" },  
  ]  
  
  const loadOrderData = useCallback(async () => {  
    try {  
      setLoading(true)  
      setError(null)  
  
      if (!user?.id) return  
  
      // Validar permisos del usuario  
      const userTallerId = await userService.getTallerId(user.id)  
      if (!userTallerId) {
        setError("No se pudo obtener la información del taller")
        return
      }
      const userPermissions = await accessService.GET_PERMISOS_USUARIO(user.id, userTallerId)  
      setUserRole(userPermissions?.rol || 'client')  
  
      if (userPermissions?.rol === 'client') {  
        setError("No tienes permisos para editar órdenes")  
        return  
      }  
  
      // Cargar datos de la orden  
      const orderData = await orderService.getOrderById(orderId)  
      if (!orderData) {  
        setError("Orden no encontrada")  
        return  
      }  
  
      setOrder(orderData)  
        
      // Llenar formulario con datos existentes  
      setDescripcion(orderData.description || "")  
      setObservacion(orderData.notes || "")  
      setPrioridad(orderData.priority || "normal")  
      setEstado(orderData.status || "reception")  
      setCosto(orderData.total?.toString() || "")  
      setTecnicoId(orderData.technicianId || "")  
      setServicioId("") // Order type doesn't have serviceId, we'll handle this separately

      // Cargar técnicos y servicios para los dropdowns  
      const [allTechnicians, allServices] = await Promise.all([  
        userService.getAllTechnicians(),  
        getAllServices()  
      ])  
  
      // Map UserProfile to TechnicianType
      const mappedTechnicians = allTechnicians.map(tech => ({
        id: tech.id,
        nombre: tech.fullName || `${tech.firstName} ${tech.lastName}`.trim()
      }))
      setTechnicians(mappedTechnicians)  
      setServices(allServices)  
  
    } catch (error) {  
      console.error("Error loading order data:", error)  
      setError("No se pudo cargar la información de la orden")  
    } finally {  
      setLoading(false)  
    }  
  }, [orderId, user])  
  
  useFocusEffect(  
    useCallback(() => {  
      loadOrderData()  
    }, [loadOrderData])  
  )  
  
  const validateForm = () => {  
    if (!descripcion.trim()) {  
      Alert.alert("Error", "La descripción es obligatoria")  
      return false  
    }  
  
    if (costo && (isNaN(parseFloat(costo)) || parseFloat(costo) < 0)) {  
      Alert.alert("Error", "El costo debe ser un número válido")  
      return false  
    }  
  
    return true  
  }  
  
  const handleUpdateOrder = async () => {  
    if (!validateForm()) return  
  
    try {  
      setSaving(true)  
  
      const updatedOrder = {  
        description: descripcion.trim(),  
        notes: observacion.trim(),  
        priority: prioridad as any,  
        status: estado as any,  
        total: costo ? parseFloat(costo) : 0,  
        technicianId: tecnicoId || undefined,  
        updatedAt: new Date().toISOString()  
      }  
  
      await orderService.updateOrder(orderId, updatedOrder)  
  
      Alert.alert("Éxito", "Orden actualizada correctamente", [  
        {  
          text: "OK",  
          onPress: () => navigation.goBack()  
        }  
      ])  
  
    } catch (error) {  
      console.error("Error updating order:", error)  
      Alert.alert("Error", "No se pudo actualizar la orden")  
    } finally {  
      setSaving(false)  
    }  
  }  
  
  const getPriorityColor = (priority: string) => {  
    const option = PRIORITY_OPTIONS.find(p => p.value === priority)  
    return option?.color || "#666"  
  }  
  
  const getStatusColor = (status: string) => {  
    const option = STATUS_OPTIONS.find(s => s.value === status)  
    return option?.color || "#666"  
  }  
  
  const renderTechnicianModal = () => (  
    <Modal  
      visible={showTechnicianModal}  
      animationType="slide"  
      transparent={true}  
    >  
      <View style={styles.modalOverlay}>  
        <View style={styles.modalContainer}>  
          <View style={styles.modalHeader}>  
            <Text style={styles.modalTitle}>Seleccionar Técnico</Text>  
            <TouchableOpacity onPress={() => setShowTechnicianModal(false)}>  
              <Feather name="x" size={24} color="#333" />  
            </TouchableOpacity>  
          </View>  
            
          <ScrollView style={styles.modalContent}>  
            <TouchableOpacity  
              style={styles.optionItem}  
              onPress={() => {  
                setTecnicoId("")  
                setShowTechnicianModal(false)  
              }}  
            >  
              <Text style={styles.optionText}>Sin asignar</Text>  
              {!tecnicoId && <Feather name="check" size={20} color="#1a73e8" />}  
            </TouchableOpacity>  
              
            {technicians.map((tech) => (  
              <TouchableOpacity  
                key={tech.id}  
                style={styles.optionItem}  
                onPress={() => {  
                  setTecnicoId(tech.id)  
                  setShowTechnicianModal(false)  
                }}  
              >  
                <Text style={styles.optionText}>{tech.nombre}</Text>  
                {tecnicoId === tech.id && <Feather name="check" size={20} color="#1a73e8" />}  
              </TouchableOpacity>  
            ))}  
          </ScrollView>  
        </View>  
      </View>  
    </Modal>  
  )  
  
  const renderServiceModal = () => (  
    <Modal  
      visible={showServiceModal}  
      animationType="slide"  
      transparent={true}  
    >  
      <View style={styles.modalOverlay}>  
        <View style={styles.modalContainer}>  
          <View style={styles.modalHeader}>  
            <Text style={styles.modalTitle}>Seleccionar Servicio</Text>  
            <TouchableOpacity onPress={() => setShowServiceModal(false)}>  
              <Feather name="x" size={24} color="#333" />  
            </TouchableOpacity>  
          </View>  
            
          <ScrollView style={styles.modalContent}>  
            <TouchableOpacity  
              style={styles.optionItem}  
              onPress={() => {  
                setServicioId("")  
                setShowServiceModal(false)  
              }}  
            >  
              <Text style={styles.optionText}>Sin servicio específico</Text>  
              {!servicioId && <Feather name="check" size={20} color="#1a73e8" />}  
            </TouchableOpacity>  
              
            {services.map((service) => (  
              <TouchableOpacity  
                key={service.id}  
                style={styles.optionItem}  
                onPress={() => {  
                  setServicioId(service.id)  
                  setShowServiceModal(false)  
                }}  
              >  
                <View style={styles.serviceOption}>  
                  <Text style={styles.optionText}>{service.nombre}</Text>  
                  <Text style={styles.servicePrice}>${service.precio?.toFixed(2)}</Text>  
                </View>  
                {servicioId === service.id && <Feather name="check" size={20} color="#1a73e8" />}  
              </TouchableOpacity>  
            ))}  
          </ScrollView>  
        </View>  
      </View>  
    </Modal>  
  )  
  
  const renderStatusModal = () => (  
    <Modal  
      visible={showStatusModal}  
      animationType="slide"  
      transparent={true}  
    >  
      <View style={styles.modalOverlay}>  
        <View style={styles.modalContainer}>  
          <View style={styles.modalHeader}>  
            <Text style={styles.modalTitle}>Cambiar Estado</Text>  
            <TouchableOpacity onPress={() => setShowStatusModal(false)}>  
              <Feather name="x" size={24} color="#333" />  
            </TouchableOpacity>  
          </View>  
            
          <ScrollView style={styles.modalContent}>  
            {STATUS_OPTIONS.map((status) => (  
              <TouchableOpacity  
                key={status.value}  
                style={styles.optionItem}  
                onPress={() => {  
                  setEstado(status.value)  
                  setShowStatusModal(false)  
                }}  
              >  
                <View style={styles.statusOption}>  
                  <View style={[styles.statusIndicator, { backgroundColor: status.color }]} />  
                  <Text style={styles.optionText}>{status.label}</Text>  
                </View>  
                {estado === status.value && <Feather name="check" size={20} color="#1a73e8" />}  
              </TouchableOpacity>  
            ))}  
          </ScrollView>  
        </View>  
      </View>  
    </Modal>  
  )  
  
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
  
  const selectedTechnician = technicians.find(t => t.id === tecnicoId)  
  const selectedService = services.find(s => s.id === servicioId)  
  const selectedStatus = STATUS_OPTIONS.find(s => s.value === estado)  
  
  return (  
    <View style={styles.container}>  
      <View style={styles.header}>  
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>  
          <Feather name="arrow-left" size={24} color="#333" />  
        </TouchableOpacity>  
        <Text style={styles.headerTitle}>Editar Orden #{order.number}</Text>  
        <TouchableOpacity   
          style={styles.saveButton}  
          onPress={handleUpdateOrder}  
          disabled={saving}  
        >  
          {saving ? (  
            <ActivityIndicator size="small" color="#1a73e8" />  
          ) : (  
            <Feather name="save" size={24} color="#1a73e8" />  
          )}  
        </TouchableOpacity>  
      </View>  
  
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>Información Básica</Text>  
            
          <View style={styles.inputGroup}>  
            <Text style={styles.inputLabel}>Descripción *</Text>  
            <TextInput  
              style={styles.textArea}  
              value={descripcion}  
              onChangeText={setDescripcion}  
              placeholder="Describe el trabajo a realizar..."  
              multiline  
              numberOfLines={4}  
              textAlignVertical="top"  
            />  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.inputLabel}>Observaciones</Text>  
            <TextInput  
              style={styles.textArea}  
              value={observacion}  
              onChangeText={setObservacion}  
              placeholder="Observaciones adicionales..."  
              multiline  
              numberOfLines={3}  
              textAlignVertical="top"  
            />  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.inputLabel}>Costo Estimado</Text>  
            <TextInput  
              style={styles.input}  
              value={costo}  
              onChangeText={setCosto}  
              placeholder="0.00"  
              keyboardType="numeric"  
            />  
          </View>  
        </View>  
  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>Asignación</Text>  
            
          <View style={styles.inputGroup}>  
            <Text style={styles.inputLabel}>Técnico Asignado</Text>  
            <TouchableOpacity  
              style={styles.selectButton}  
              onPress={() => setShowTechnicianModal(true)}  
            >  
              <Text style={styles.selectButtonText}>  
                {selectedTechnician ? selectedTechnician.nombre : "Sin asignar"}  
              </Text>  
              <Feather name="chevron-down" size={20} color="#666" />  
            </TouchableOpacity>  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.inputLabel}>Servicio</Text>  
            <TouchableOpacity  
              style={styles.selectButton}  
              onPress={() => setShowServiceModal(true)}  
            >  
              <Text style={styles.selectButtonText}>  
                {selectedService ? selectedService.nombre : "Sin servicio específico"}  
              </Text>  
              <Feather name="chevron-down" size={20} color="#666" />  
            </TouchableOpacity>  
          </View>  
        </View>  
  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>Estado y Prioridad</Text>  
            
          <View style={styles.inputGroup}>  
            <Text style={styles.inputLabel}>Estado</Text>  
            <TouchableOpacity  
              style={styles.selectButton}  
              onPress={() => setShowStatusModal(true)}  
            >  
              <View style={styles.statusDisplay}>  
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(estado) }]} />  
                <Text style={styles.selectButtonText}>  
                  {selectedStatus ? selectedStatus.label : estado}  
                </Text>  
              </View>  
              <Feather name="chevron-down" size={20} color="#666" />  
            </TouchableOpacity>  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.inputLabel}>Prioridad</Text>  
            <View style={styles.priorityContainer}>  
              {PRIORITY_OPTIONS.map((option) => (  
                <TouchableOpacity  
                  key={option.value}  
                  style={[  
                    styles.priorityButton,  
                    { borderColor: option.color },  
                    prioridad === option.value && { backgroundColor: option.color }  
                  ]}  
                  onPress={() => setPrioridad(option.value)}  
                >  
                  <Text style={[  
                    styles.priorityButtonText,  
                    prioridad === option.value && { color: "#fff" }  
                  ]}>  
                    {option.label}  
                  </Text>  
                </TouchableOpacity>  
              ))}  
            </View>  
          </View>  
        </View>  
  
        <View style={styles.actionButtons}>  
          <TouchableOpacity  
            style={styles.cancelButton}  
            onPress={() => navigation.goBack()}  
            disabled={saving}  
          >  
            <Text style={styles.cancelButtonText}>Cancelar</Text>  
          </TouchableOpacity>  
  
          <TouchableOpacity  
            style={styles.updateButton}  
            onPress={handleUpdateOrder}  
            disabled={saving}  
          >  
            {saving ? (  
              <ActivityIndicator size="small" color="#fff" />  
            ) : (  
              <>  
                <Feather name="save" size={20} color="#fff" />  
                <Text style={styles.updateButtonText}>Actualizar</Text>  
              </>  
            )}  
          </TouchableOpacity>  
        </View>
        </ScrollView>  
  
  {renderTechnicianModal()}  
  {renderServiceModal()}  
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
saveButton: {  
padding: 8,  
},  
content: {  
flex: 1,  
padding: 16,  
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
textArea: {  
backgroundColor: "#f8f9fa",  
borderWidth: 1,  
borderColor: "#e1e4e8",  
borderRadius: 8,  
paddingHorizontal: 16,  
paddingVertical: 12,  
fontSize: 16,  
color: "#333",  
height: 100,  
textAlignVertical: "top",  
},  
selectButton: {  
backgroundColor: "#f8f9fa",  
borderWidth: 1,  
borderColor: "#e1e4e8",  
borderRadius: 8,  
paddingHorizontal: 16,  
paddingVertical: 12,  
flexDirection: "row",  
justifyContent: "space-between",  
alignItems: "center",  
},  
selectButtonText: {  
fontSize: 16,  
color: "#333",  
},  
statusDisplay: {  
flexDirection: "row",  
alignItems: "center",  
},  
statusIndicator: {  
width: 12,  
height: 12,  
borderRadius: 6,  
marginRight: 8,  
},  
priorityContainer: {  
flexDirection: "row",  
gap: 8,  
},  
priorityButton: {  
flex: 1,  
paddingVertical: 8,  
paddingHorizontal: 12,  
borderRadius: 8,  
borderWidth: 1,  
alignItems: "center",  
},  
priorityButtonText: {  
fontSize: 14,  
fontWeight: "500",  
},  
actionButtons: {  
flexDirection: "row",  
gap: 12,  
marginTop: 16,  
},  
cancelButton: {  
flex: 1,  
backgroundColor: "transparent",  
borderWidth: 1,  
borderColor: "#e1e4e8",  
borderRadius: 8,  
paddingVertical: 12,  
alignItems: "center",  
},  
cancelButtonText: {  
fontSize: 16,  
fontWeight: "500",  
color: "#666",  
},  
updateButton: {  
flex: 1,  
backgroundColor: "#1a73e8",  
borderRadius: 8,  
paddingVertical: 12,  
flexDirection: "row",  
alignItems: "center",  
justifyContent: "center",  
gap: 8,  
},  
updateButtonText: {  
fontSize: 16,  
fontWeight: "bold",  
color: "#fff",  
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
maxHeight: 300,  
},  
optionItem: {  
flexDirection: "row",  
justifyContent: "space-between",  
alignItems: "center",  
paddingVertical: 12,  
borderBottomWidth: 1,  
borderBottomColor: "#f0f0f0",  
},  
optionText: {  
fontSize: 16,  
color: "#333",  
},  
serviceOption: {  
flex: 1,  
flexDirection: "row",  
justifyContent: "space-between",  
alignItems: "center",  
},  
servicePrice: {  
fontSize: 14,  
color: "#4caf50",  
fontWeight: "500",  
},  
statusOption: {  
flexDirection: "row",  
alignItems: "center",  
flex: 1,  
},  
})