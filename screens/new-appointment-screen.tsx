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
  Platform,  
} from "react-native"  
import { Feather, MaterialIcons } from "@expo/vector-icons"  
import DateTimePicker from '@react-native-community/datetimepicker'  
import { useFocusEffect } from "@react-navigation/native"  
import { useAuth } from "../context/auth-context"  
import { vehicleService } from "../services/supabase/vehicle-service"  
import { clientService } from "../services/supabase/client-service"  
import { CITAS_SERVICES } from "../services/supabase/citas-services"  
  
interface NewAppointmentScreenProps {  
  route: { params?: { preselectedVehicle?: string; clientId?: string } }  
  navigation: any  
}  
  
interface AppointmentFormData {  
  client_id: string  
  vehiculo_id: string  
  fecha: string  
  hora: string  
  tipo_servicio: string  
  descripcion: string  
  estado: string  
}  
  
const TIPOS_SERVICIO = [  
  "Mantenimiento Preventivo",  
  "Reparación General",  
  "Diagnóstico",  
  "Cambio de Aceite",  
  "Revisión de Frenos",  
  "Alineación y Balanceo",  
  "Revisión Eléctrica",  
  "Aire Acondicionado",  
  "Transmisión",  
  "Motor",  
  "Otros"  
]  
  
export default function NewAppointmentScreen({ route, navigation }: NewAppointmentScreenProps) {  
  const { user } = useAuth()  
  const { preselectedVehicle, clientId } = route.params || {}  
    
  const [loading, setLoading] = useState(true)  
  const [creating, setCreating] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
    
  const [clients, setClients] = useState<any[]>([])  
  const [vehicles, setVehicles] = useState<any[]>([])  
  const [filteredVehicles, setFilteredVehicles] = useState<any[]>([])  
    
  const [showDatePicker, setShowDatePicker] = useState(false)  
  const [showTimePicker, setShowTimePicker] = useState(false)  
  const [showServicePicker, setShowServicePicker] = useState(false)  
  const [showClientPicker, setShowClientPicker] = useState(false)  
  const [showVehiclePicker, setShowVehiclePicker] = useState(false)  
  
  const [formData, setFormData] = useState<AppointmentFormData>({  
    client_id: clientId || "",  
    vehiculo_id: preselectedVehicle || "",  
    fecha: new Date().toISOString().split('T')[0],  
    hora: "09:00",  
    tipo_servicio: "",  
    descripcion: "",  
    estado: "programada",  
  })  
  
  const loadInitialData = useCallback(async () => {  
    try {  
      setLoading(true)  
      setError(null)  
  
      // Si es cliente, solo cargar sus datos  
      if (user?.role === 'client') {  
        const clientData = await clientService.getClientByUserId(user.id)  
        if (clientData) {  
          setFormData(prev => ({ ...prev, client_id: clientData.id }))  
          const clientVehicles = await vehicleService.getVehiclesByClientId(clientData.id)  
          setVehicles(clientVehicles)  
          setFilteredVehicles(clientVehicles)  
        }  
      } else {  
        // Si es técnico/admin, cargar todos los clientes y vehículos  
        const [allClients, allVehicles] = await Promise.all([  
          clientService.getAllClients(),  
          vehicleService.getAllVehicles()  
        ])  
        setClients(allClients)  
        setVehicles(allVehicles)  
          
        // Si hay un cliente preseleccionado, filtrar vehículos  
        if (clientId) {  
          const clientVehicles = allVehicles.filter(v => v.client_id === clientId)  
          setFilteredVehicles(clientVehicles)  
        } else {  
          setFilteredVehicles(allVehicles)  
        }  
      }  
  
    } catch (error) {  
      console.error("Error loading initial data:", error)  
      setError("No se pudo cargar la información inicial")  
    } finally {  
      setLoading(false)  
    }  
  }, [user, clientId])  
  
  useFocusEffect(  
    useCallback(() => {  
      loadInitialData()  
    }, [loadInitialData])  
  )  
  
  const handleClientChange = (selectedClientId: string) => {  
    setFormData(prev => ({   
      ...prev,   
      client_id: selectedClientId,  
      vehiculo_id: "" // Reset vehicle selection  
    }))  
      
    // Filtrar vehículos del cliente seleccionado  
    const clientVehicles = vehicles.filter(v => v.client_id === selectedClientId)  
    setFilteredVehicles(clientVehicles)  
    setShowClientPicker(false)  
  }  
  
  const handleDateChange = (event: any, selectedDate?: Date) => {  
    setShowDatePicker(false)  
    if (selectedDate) {  
      setFormData(prev => ({   
        ...prev,   
        fecha: selectedDate.toISOString().split('T')[0]  
      }))  
    }  
  }  
  
  const handleTimeChange = (event: any, selectedTime?: Date) => {  
    setShowTimePicker(false)  
    if (selectedTime) {  
      const hours = selectedTime.getHours().toString().padStart(2, '0')  
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0')  
      setFormData(prev => ({   
        ...prev,   
        hora: `${hours}:${minutes}`  
      }))  
    }  
  }  
  
  const validateForm = () => {  
    if (!formData.client_id) {  
      Alert.alert("Error", "Por favor selecciona un cliente")  
      return false  
    }  
    if (!formData.vehiculo_id) {  
      Alert.alert("Error", "Por favor selecciona un vehículo")  
      return false  
    }  
    if (!formData.fecha) {  
      Alert.alert("Error", "Por favor selecciona una fecha")  
      return false  
    }  
    if (!formData.hora) {  
      Alert.alert("Error", "Por favor selecciona una hora")  
      return false  
    }  
    if (!formData.tipo_servicio) {  
      Alert.alert("Error", "Por favor selecciona un tipo de servicio")  
      return false  
    }  
    return true  
  }  
  
  const handleCreateAppointment = async () => {  
    if (!validateForm()) return  
  
    try {  
      setCreating(true)  
  
      const appointmentData = {  
        ...formData,  
        created_at: new Date().toISOString(),  
        updated_at: new Date().toISOString(),  
      }  
  
      await CITAS_SERVICES.CREATE_CITA(appointmentData)  
        
      Alert.alert(  
        "Éxito",   
        "Cita creada correctamente",  
        [  
          {  
            text: "OK",  
            onPress: () => navigation.goBack()  
          }  
        ]  
      )  
  
    } catch (error) {  
      console.error("Error creating appointment:", error)  
      Alert.alert("Error", "No se pudo crear la cita")  
    } finally {  
      setCreating(false)  
    }  
  }  
  
  const getClientName = (clientId: string) => {  
    const client = clients.find(c => c.id === clientId)  
    return client ? client.name : "Seleccionar cliente"  
  }  
  
  const getVehicleName = (vehicleId: string) => {  
    const vehicle = vehicles.find(v => v.id === vehicleId)  
    return vehicle ? `${vehicle.marca} ${vehicle.modelo} (${vehicle.placa})` : "Seleccionar vehículo"  
  }  
  
  if (loading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#1a73e8" />  
        <Text style={styles.loadingText}>Cargando...</Text>  
      </View>  
    )  
  }  
  
  if (error) {  
    return (  
      <View style={styles.errorContainer}>  
        <MaterialIcons name="error" size={64} color="#f44336" />  
        <Text style={styles.errorText}>{error}</Text>  
        <TouchableOpacity style={styles.retryButton} onPress={loadInitialData}>  
          <Text style={styles.retryButtonText}>Reintentar</Text>  
        </TouchableOpacity>  
      </View>  
    )  
  }  
  
  return (  
    <View style={styles.container}>  
      <View style={styles.header}>  
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>  
          <Feather name="arrow-left" size={24} color="#333" />  
        </TouchableOpacity>  
        <Text style={styles.headerTitle}>Nueva Cita</Text>  
        <View style={styles.placeholder} />  
      </View>  
  
      <ScrollView style={styles.content}>  
        <View style={styles.form}>  
          {/* Cliente (solo para técnicos/admin) */}  
          {user?.role !== 'client' && (  
            <View style={styles.inputGroup}>  
              <Text style={styles.inputLabel}>Cliente *</Text>  
              <TouchableOpacity  
                style={styles.picker}  
                onPress={() => setShowClientPicker(true)}  
              >  
                <Text style={[styles.pickerText, !formData.client_id && styles.placeholderText]}>  
                  {formData.client_id ? getClientName(formData.client_id) : "Seleccionar cliente"}  
                </Text>  
                <Feather name="chevron-down" size={20} color="#666" />  
              </TouchableOpacity>  
            </View>  
          )}  
  
          {/* Vehículo */}  
          <View style={styles.inputGroup}>  
            <Text style={styles.inputLabel}>Vehículo *</Text>  
            <TouchableOpacity  
              style={styles.picker}  
              onPress={() => setShowVehiclePicker(true)}  
              disabled={!formData.client_id}  
            >  
              <Text style={[styles.pickerText, !formData.vehiculo_id && styles.placeholderText]}>  
                {formData.vehiculo_id ? getVehicleName(formData.vehiculo_id) : "Seleccionar vehículo"}  
              </Text>  
              <Feather name="chevron-down" size={20} color="#666" />  
            </TouchableOpacity>  
          </View>  
  
          {/* Fecha y Hora */}  
          <View style={styles.row}>  
            <View style={[styles.inputGroup, styles.halfWidth]}>  
              <Text style={styles.inputLabel}>Fecha *</Text>  
              <TouchableOpacity  
                style={styles.picker}  
                onPress={() => setShowDatePicker(true)}  
              >  
                <Text style={styles.pickerText}>  
                  {new Date(formData.fecha).toLocaleDateString("es-ES")}  
                </Text>  
                <Feather name="calendar" size={20} color="#666" />  
              </TouchableOpacity>  
            </View>  
  
            <View style={[styles.inputGroup, styles.halfWidth]}>  
              <Text style={styles.inputLabel}>Hora *</Text>  
              <TouchableOpacity  
                style={styles.picker}  
                onPress={() => setShowTimePicker(true)}  
              >  
                <Text style={styles.pickerText}>{formData.hora}</Text>  
                <Feather name="clock" size={20} color="#666" />  
              </TouchableOpacity>  
            </View>  
          </View>  
  
                    {/* Tipo de Servicio */}  
                    <View style={styles.inputGroup}>  
            <Text style={styles.inputLabel}>Tipo de Servicio *</Text>  
            <TouchableOpacity  
              style={styles.picker}  
              onPress={() => setShowServicePicker(true)}  
            >  
              <Text style={[styles.pickerText, !formData.tipo_servicio && styles.placeholderText]}>  
                {formData.tipo_servicio || "Seleccionar tipo de servicio"}  
              </Text>  
              <Feather name="chevron-down" size={20} color="#666" />  
            </TouchableOpacity>  
          </View>  
  
          {/* Descripción */}  
          <View style={styles.inputGroup}>  
            <Text style={styles.inputLabel}>Descripción</Text>  
            <TextInput  
              style={[styles.input, styles.textArea]}  
              value={formData.descripcion}  
              onChangeText={(value) => setFormData(prev => ({ ...prev, descripcion: value }))}  
              placeholder="Descripción del servicio o problema a revisar"  
              multiline  
              numberOfLines={4}  
              textAlignVertical="top"  
            />  
          </View>  
        </View>  
      </ScrollView>  
  
      {/* Date Picker */}  
      {showDatePicker && (  
        <DateTimePicker  
          value={new Date(formData.fecha)}  
          mode="date"  
          display="default"  
          onChange={handleDateChange}  
          minimumDate={new Date()}  
        />  
      )}  
  
      {/* Time Picker */}  
      {showTimePicker && (  
        <DateTimePicker  
          value={new Date(`2000-01-01T${formData.hora}:00`)}  
          mode="time"  
          display="default"  
          onChange={handleTimeChange}  
        />  
      )}  
  
      {/* Client Picker Modal */}  
      {showClientPicker && (  
        <View style={styles.modalOverlay}>  
          <View style={styles.modalContainer}>  
            <View style={styles.modalHeader}>  
              <Text style={styles.modalTitle}>Seleccionar Cliente</Text>  
              <TouchableOpacity onPress={() => setShowClientPicker(false)}>  
                <Feather name="x" size={24} color="#666" />  
              </TouchableOpacity>  
            </View>  
            <ScrollView style={styles.modalContent}>  
              {clients.map((client) => (  
                <TouchableOpacity  
                  key={client.id}  
                  style={styles.modalItem}  
                  onPress={() => handleClientChange(client.id)}  
                >  
                  <Text style={styles.modalItemText}>{client.name}</Text>  
                  <Text style={styles.modalItemSubtext}>{client.email}</Text>  
                </TouchableOpacity>  
              ))}  
            </ScrollView>  
          </View>  
        </View>  
      )}  
  
      {/* Vehicle Picker Modal */}  
      {showVehiclePicker && (  
        <View style={styles.modalOverlay}>  
          <View style={styles.modalContainer}>  
            <View style={styles.modalHeader}>  
              <Text style={styles.modalTitle}>Seleccionar Vehículo</Text>  
              <TouchableOpacity onPress={() => setShowVehiclePicker(false)}>  
                <Feather name="x" size={24} color="#666" />  
              </TouchableOpacity>  
            </View>  
            <ScrollView style={styles.modalContent}>  
              {filteredVehicles.map((vehicle) => (  
                <TouchableOpacity  
                  key={vehicle.id}  
                  style={styles.modalItem}  
                  onPress={() => {  
                    setFormData(prev => ({ ...prev, vehiculo_id: vehicle.id }))  
                    setShowVehiclePicker(false)  
                  }}  
                >  
                  <Text style={styles.modalItemText}>  
                    {vehicle.marca} {vehicle.modelo}  
                  </Text>  
                  <Text style={styles.modalItemSubtext}>  
                    {vehicle.placa} • {vehicle.ano}  
                  </Text>  
                </TouchableOpacity>  
              ))}  
            </ScrollView>  
          </View>  
        </View>  
      )}  
  
      {/* Service Type Picker Modal */}  
      {showServicePicker && (  
        <View style={styles.modalOverlay}>  
          <View style={styles.modalContainer}>  
            <View style={styles.modalHeader}>  
              <Text style={styles.modalTitle}>Tipo de Servicio</Text>  
              <TouchableOpacity onPress={() => setShowServicePicker(false)}>  
                <Feather name="x" size={24} color="#666" />  
              </TouchableOpacity>  
            </View>  
            <ScrollView style={styles.modalContent}>  
              {TIPOS_SERVICIO.map((tipo) => (  
                <TouchableOpacity  
                  key={tipo}  
                  style={styles.modalItem}  
                  onPress={() => {  
                    setFormData(prev => ({ ...prev, tipo_servicio: tipo }))  
                    setShowServicePicker(false)  
                  }}  
                >  
                  <Text style={styles.modalItemText}>{tipo}</Text>  
                </TouchableOpacity>  
              ))}  
            </ScrollView>  
          </View>  
        </View>  
      )}  
  
      <View style={styles.footer}>  
        <TouchableOpacity  
          style={[styles.button, styles.cancelButton]}  
          onPress={() => navigation.goBack()}  
          disabled={creating}  
        >  
          <Text style={styles.cancelButtonText}>Cancelar</Text>  
        </TouchableOpacity>  
  
        <TouchableOpacity  
          style={[styles.button, styles.saveButton]}  
          onPress={handleCreateAppointment}  
          disabled={creating}  
        >  
          {creating ? (  
            <ActivityIndicator size="small" color="#fff" />  
          ) : (  
            <>  
              <Feather name="calendar" size={20} color="#fff" />  
              <Text style={styles.saveButtonText}>Crear Cita</Text>  
            </>  
          )}  
        </TouchableOpacity>  
      </View>  
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
  placeholder: {  
    width: 40,  
  },  
  content: {  
    flex: 1,  
    padding: 16,  
  },  
  form: {  
    backgroundColor: "#fff",  
    borderRadius: 12,  
    padding: 16,  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 2 },  
    shadowOpacity: 0.1,  
    shadowRadius: 4,  
    elevation: 3,  
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
    height: 100,  
    textAlignVertical: "top",  
  },  
  picker: {  
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
  pickerText: {  
    fontSize: 16,  
    color: "#333",  
  },  
  placeholderText: {  
    color: "#999",  
  },  
  row: {  
    flexDirection: "row",  
    gap: 12,  
  },  
  halfWidth: {  
    flex: 1,  
  },  
  modalOverlay: {  
    position: "absolute",  
    top: 0,  
    left: 0,  
    right: 0,  
    bottom: 0,  
    backgroundColor: "rgba(0, 0, 0, 0.5)",  
    justifyContent: "center",  
    alignItems: "center",  
  },  
  modalContainer: {  
    backgroundColor: "#fff",  
    borderRadius: 12,  
    margin: 20,  
    maxHeight: "80%",  
    width: "90%",  
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
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  modalContent: {  
    maxHeight: 300,  
  },  
  modalItem: {  
    padding: 16,  
    borderBottomWidth: 1,  
    borderBottomColor: "#f0f0f0",  
  },  
  modalItemText: {  
    fontSize: 16,  
    color: "#333",  
    marginBottom: 4,  
  },  
  modalItemSubtext: {  
    fontSize: 14,  
    color: "#666",  
  },  
  footer: {  
    flexDirection: "row",  
    padding: 16,  
    backgroundColor: "#fff",  
    borderTopWidth: 1,  
    borderTopColor: "#e1e4e8",  
    gap: 12,  
  },  
  button: {  
    flex: 1,  
    paddingVertical: 12,  
    borderRadius: 8,  
    alignItems: "center",  
    justifyContent: "center",  
    flexDirection: "row",  
    gap: 8,  
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