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
import { useNavigation, useRoute } from '@react-navigation/native'  
import type { StackNavigationProp } from '@react-navigation/stack'  
import { useAuth } from "../context/auth-context"  
import { orderService } from "../services/supabase/order-service"  
import { clientService } from "../services/supabase/client-service"  
import { vehicleService } from "../services/supabase/vehicle-service"  
import ACCESOS_SERVICES from "../services/supabase/access-service"  
import USER_SERVICE from "../services/supabase/user-service"  
import { Order, OrderStatus } from '../types/order'  
import { Client } from '../services/supabase/client-service'  
import { Vehicle } from '../services/supabase/vehicle-service'  
  
interface NewOrderScreenProps {  
  route?: {  
    params?: {  
      clientId?: string  
      vehicleId?: string  
    }  
  }  
}  
  
export default function NewOrderScreen() {  
  const { user } = useAuth()  
  const navigation = useNavigation<StackNavigationProp<any>>()  
  const route = useRoute()  
  const params = route.params as NewOrderScreenProps['route']['params']  
  
  const [loading, setLoading] = useState(false)  
  const [saving, setSaving] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
    
  // Datos del formulario  
  const [formData, setFormData] = useState({  
    clientId: params?.clientId || "",  
    vehicleId: params?.vehicleId || "",  
    description: "",  
    diagnosis: "",  
    priority: "normal" as "low" | "normal" | "high" | "urgent",  
    estimatedCompletionDate: "",  
    notes: "",  
  })  
  
  // Estados para modales de selección  
  const [clientModalVisible, setClientModalVisible] = useState(false)  
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false)  
    
  // Datos para selección  
  const [clients, setClients] = useState<Client[]>([])  
  const [vehicles, setVehicles] = useState<Vehicle[]>([])  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)  
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)  
  
  const loadInitialData = useCallback(async () => {  
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
  
      // Solo staff puede crear órdenes  
      if (userPermissions?.rol === 'client') {  
        setError("No tienes permisos para crear órdenes")  
        return  
      }  
  
      // Cargar clientes y vehículos  
      const [clientsData, vehiclesData] = await Promise.all([  
        clientService.getAllClients(),  
        vehicleService.getAllVehicles()  
      ])  
  
      setClients(clientsData)  
      setVehicles(vehiclesData)  
  
      // Si viene con cliente preseleccionado  
      if (params?.clientId) {  
        const client = clientsData.find(c => c.id === params.clientId)  
        if (client) {  
          setSelectedClient(client)  
          // Filtrar vehículos del cliente  
          const clientVehicles = vehiclesData.filter(v => v.clientId === params.clientId)  
          setVehicles(clientVehicles)  
        }  
      }  
  
      // Si viene con vehículo preseleccionado  
      if (params?.vehicleId) {  
        const vehicle = vehiclesData.find(v => v.id === params.vehicleId)  
        if (vehicle) {  
          setSelectedVehicle(vehicle)  
          // También seleccionar el cliente del vehículo  
          const client = clientsData.find(c => c.id === vehicle.clientId)  
          if (client) {  
            setSelectedClient(client)  
          }  
        }  
      }  
  
    } catch (error) {  
      console.error("Error loading initial data:", error)  
      setError("No se pudieron cargar los datos iniciales")  
    } finally {  
      setLoading(false)  
    }  
  }, [user, params])  
  
  useEffect(() => {  
    loadInitialData()  
  }, [loadInitialData])  
  
  const handleClientSelect = (client: Client) => {  
    setSelectedClient(client)  
    setFormData(prev => ({ ...prev, clientId: client.id }))  
      
    // Filtrar vehículos del cliente seleccionado  
    const clientVehicles = vehicles.filter(v => v.clientId === client.id)  
    setVehicles(clientVehicles)  
      
    // Limpiar vehículo seleccionado si no pertenece al cliente  
    if (selectedVehicle && selectedVehicle.clientId !== client.id) {  
      setSelectedVehicle(null)  
      setFormData(prev => ({ ...prev, vehicleId: "" }))  
    }  
      
    setClientModalVisible(false)  
  }  
  
  const handleVehicleSelect = (vehicle: Vehicle) => {  
    setSelectedVehicle(vehicle)  
    setFormData(prev => ({ ...prev, vehicleId: vehicle.id }))  
    setVehicleModalVisible(false)  
  }  
  
  const validateForm = () => {  
    if (!formData.clientId) {  
      Alert.alert("Error", "Debe seleccionar un cliente")  
      return false  
    }  
      
    if (!formData.vehicleId) {  
      Alert.alert("Error", "Debe seleccionar un vehículo")  
      return false  
    }  
      
    if (!formData.description.trim()) {  
      Alert.alert("Error", "Debe ingresar una descripción del trabajo")  
      return false  
    }  
      
    return true  
  }  
  
  const handleSaveOrder = async () => {  
    if (!validateForm()) return  
  
    try {  
      setSaving(true)  
  
      const orderData = {  
        clientId: formData.clientId,  
        vehicleId: formData.vehicleId,  
        description: formData.description.trim(),  
        diagnosis: formData.diagnosis.trim(),  
        priority: formData.priority,  
        status: "reception" as OrderStatus,  
        estimatedCompletionDate: formData.estimatedCompletionDate || null,  
        notes: formData.notes.trim(),  
        createdAt: new Date().toISOString(),  
        updatedAt: new Date().toISOString(),  
        total: 0,  
        balance: 0,  
        paymentStatus: "pending" as const,  
      }  
  
      const newOrder = await orderService.createOrder(orderData)  
        
      Alert.alert(  
        "Éxito",   
        "Orden creada correctamente",  
        [  
          {  
            text: "Ver Orden",  
            onPress: () => navigation.navigate("OrderDetail", { orderId: newOrder.id })  
          },  
          {  
            text: "Crear Otra",  
            onPress: () => {  
              // Limpiar formulario  
              setFormData({  
                clientId: "",  
                vehicleId: "",  
                description: "",  
                diagnosis: "",  
                priority: "normal",  
                estimatedCompletionDate: "",  
                notes: "",  
              })  
              setSelectedClient(null)  
              setSelectedVehicle(null)  
            }  
          }  
        ]  
      )  
  
    } catch (error) {  
      console.error("Error creating order:", error)  
      Alert.alert("Error", "No se pudo crear la orden")  
    } finally {  
      setSaving(false)  
    }  
  }  
  
  const getPriorityColor = (priority: string) => {  
    switch (priority) {  
      case "low": return "#4caf50"  
      case "normal": return "#2196f3"  
      case "high": return "#ff9800"  
      case "urgent": return "#f44336"  
      default: return "#666"  
    }  
  }  
  
  const getPriorityText = (priority: string) => {  
    switch (priority) {  
      case "low": return "Baja"  
      case "normal": return "Normal"  
      case "high": return "Alta"  
      case "urgent": return "Urgente"  
      default: return "Normal"  
    }  
  }  
  
  if (loading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#1a73e8" />  
        <Text style={styles.loadingText}>Cargando datos...</Text>  
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
        <Text style={styles.headerTitle}>Nueva Orden</Text>  
        <TouchableOpacity   
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}  
          onPress={handleSaveOrder}  
          disabled={saving}  
        >  
          {saving ? (  
            <ActivityIndicator size="small" color="#fff" />  
          ) : (  
            <Feather name="check" size={24} color="#fff" />  
          )}  
        </TouchableOpacity>  
      </View>  
  
      <ScrollView style={styles.content}>  
        {/* Selección de Cliente */}  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>Cliente</Text>  
          <TouchableOpacity  
            style={styles.selectionButton}  
            onPress={() => setClientModalVisible(true)}  
          >  
            <View style={styles.selectionContent}>  
              <Feather name="user" size={20} color="#1a73e8" />  
              <Text style={[styles.selectionText, !selectedClient && styles.placeholderText]}>  
                {selectedClient ? selectedClient.name : "Seleccionar cliente"}  
              </Text>  
            </View>  
            <Feather name="chevron-right" size={20} color="#ccc" />  
          </TouchableOpacity>  
        </View>  
  
        {/* Selección de Vehículo */}  
                {/* Selección de Vehículo */}  
                <View style={styles.section}>  
          <Text style={styles.sectionTitle}>Vehículo</Text>  
          <TouchableOpacity  
            style={[styles.selectionButton, !selectedClient && styles.disabledButton]}  
            onPress={() => selectedClient && setVehicleModalVisible(true)}  
            disabled={!selectedClient}  
          >  
            <View style={styles.selectionContent}>  
              <Feather name="truck" size={20} color={selectedClient ? "#1a73e8" : "#ccc"} />  
              <Text style={[styles.selectionText, !selectedVehicle && styles.placeholderText]}>  
                {selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model} (${selectedVehicle.licensePlate})` : "Seleccionar vehículo"}  
              </Text>  
            </View>  
            <Feather name="chevron-right" size={20} color="#ccc" />  
          </TouchableOpacity>  
          {!selectedClient && (  
            <Text style={styles.helperText}>Primero selecciona un cliente</Text>  
          )}  
        </View>  
  
        {/* Descripción del trabajo */}  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>Descripción del Trabajo *</Text>  
          <TextInput  
            style={styles.textArea}  
            placeholder="Describe el problema o servicio requerido..."  
            value={formData.description}  
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}  
            multiline  
            numberOfLines={4}  
            textAlignVertical="top"  
          />  
        </View>  
  
        {/* Diagnóstico inicial */}  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>Diagnóstico Inicial</Text>  
          <TextInput  
            style={styles.textArea}  
            placeholder="Diagnóstico preliminar (opcional)..."  
            value={formData.diagnosis}  
            onChangeText={(text) => setFormData(prev => ({ ...prev, diagnosis: text }))}  
            multiline  
            numberOfLines={3}  
            textAlignVertical="top"  
          />  
        </View>  
  
        {/* Prioridad */}  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>Prioridad</Text>  
          <View style={styles.priorityContainer}>  
            {["low", "normal", "high", "urgent"].map((priority) => (  
              <TouchableOpacity  
                key={priority}  
                style={[  
                  styles.priorityOption,  
                  formData.priority === priority && styles.priorityOptionSelected,  
                  { borderColor: getPriorityColor(priority) }  
                ]}  
                onPress={() => setFormData(prev => ({ ...prev, priority: priority as any }))}  
              >  
                <View style={[  
                  styles.priorityIndicator,  
                  { backgroundColor: getPriorityColor(priority) },  
                  formData.priority === priority && styles.priorityIndicatorSelected  
                ]} />  
                <Text style={[  
                  styles.priorityText,  
                  formData.priority === priority && { color: getPriorityColor(priority) }  
                ]}>  
                  {getPriorityText(priority)}  
                </Text>  
              </TouchableOpacity>  
            ))}  
          </View>  
        </View>  
  
        {/* Fecha estimada de finalización */}  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>Fecha Estimada de Finalización</Text>  
          <TextInput  
            style={styles.input}  
            placeholder="YYYY-MM-DD (opcional)"  
            value={formData.estimatedCompletionDate}  
            onChangeText={(text) => setFormData(prev => ({ ...prev, estimatedCompletionDate: text }))}  
          />  
        </View>  
  
        {/* Notas adicionales */}  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>Notas Adicionales</Text>  
          <TextInput  
            style={styles.textArea}  
            placeholder="Notas adicionales, instrucciones especiales..."  
            value={formData.notes}  
            onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}  
            multiline  
            numberOfLines={3}  
            textAlignVertical="top"  
          />  
        </View>  
      </ScrollView>  
  
      {/* Modal de selección de cliente */}  
      <Modal  
        visible={clientModalVisible}  
        animationType="slide"  
        presentationStyle="pageSheet"  
      >  
        <View style={styles.modalContainer}>  
          <View style={styles.modalHeader}>  
            <Text style={styles.modalTitle}>Seleccionar Cliente</Text>  
            <TouchableOpacity  
              onPress={() => setClientModalVisible(false)}  
              style={styles.closeButton}  
            >  
              <Feather name="x" size={24} color="#666" />  
            </TouchableOpacity>  
          </View>  
  
          <ScrollView style={styles.modalContent}>  
            {clients.map((client) => (  
              <TouchableOpacity  
                key={client.id}  
                style={[  
                  styles.clientOption,  
                  selectedClient?.id === client.id && styles.clientOptionSelected  
                ]}  
                onPress={() => handleClientSelect(client)}  
              >  
                <View style={styles.clientInfo}>  
                  <Text style={styles.clientName}>{client.name}</Text>  
                  <Text style={styles.clientDetails}>{client.email}</Text>  
                  <Text style={styles.clientDetails}>{client.phone}</Text>  
                </View>  
                {selectedClient?.id === client.id && (  
                  <Feather name="check" size={20} color="#1a73e8" />  
                )}  
              </TouchableOpacity>  
            ))}  
          </ScrollView>  
        </View>  
      </Modal>  
  
      {/* Modal de selección de vehículo */}  
      <Modal  
        visible={vehicleModalVisible}  
        animationType="slide"  
        presentationStyle="pageSheet"  
      >  
        <View style={styles.modalContainer}>  
          <View style={styles.modalHeader}>  
            <Text style={styles.modalTitle}>Seleccionar Vehículo</Text>  
            <TouchableOpacity  
              onPress={() => setVehicleModalVisible(false)}  
              style={styles.closeButton}  
            >  
              <Feather name="x" size={24} color="#666" />  
            </TouchableOpacity>  
          </View>  
  
          <ScrollView style={styles.modalContent}>  
            {vehicles.filter(v => v.clientId === selectedClient?.id).map((vehicle) => (  
              <TouchableOpacity  
                key={vehicle.id}  
                style={[  
                  styles.vehicleOption,  
                  selectedVehicle?.id === vehicle.id && styles.vehicleOptionSelected  
                ]}  
                onPress={() => handleVehicleSelect(vehicle)}  
              >  
                <View style={styles.vehicleInfo}>  
                  <Text style={styles.vehicleName}>{vehicle.make} {vehicle.model}</Text>  
                  <Text style={styles.vehicleDetails}>{vehicle.year} • {vehicle.licensePlate}</Text>  
                </View>  
                {selectedVehicle?.id === vehicle.id && (  
                  <Feather name="check" size={20} color="#1a73e8" />  
                )}  
              </TouchableOpacity>  
            ))}  
          </ScrollView>  
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
    flex: 1,  
    textAlign: "center",  
  },  
  saveButton: {  
    width: 40,  
    height: 40,  
    borderRadius: 20,  
    backgroundColor: "#1a73e8",  
    justifyContent: "center",  
    alignItems: "center",  
  },  
  saveButtonDisabled: {  
    backgroundColor: "#ccc",  
  },  
  content: {  
    flex: 1,  
    padding: 16,  
  },  
  section: {  
    marginBottom: 24,  
  },  
  sectionTitle: {  
    fontSize: 16,  
    fontWeight: "600",  
    color: "#333",  
    marginBottom: 8,  
  },  
  selectionButton: {  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "space-between",  
    backgroundColor: "#fff",  
    borderRadius: 8,  
    padding: 16,  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  disabledButton: {  
    backgroundColor: "#f5f5f5",  
    borderColor: "#e1e4e8",  
  },  
  selectionContent: {  
    flexDirection: "row",  
    alignItems: "center",  
    flex: 1,  
  },  
  selectionText: {  
    fontSize: 16,  
    color: "#333",  
    marginLeft: 12,  
  },  
  placeholderText: {  
    color: "#999",  
  },  
  helperText: {  
    fontSize: 12,  
    color: "#999",  
    marginTop: 4,  
  },  
  input: {  
    backgroundColor: "#fff",  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
    borderRadius: 8,  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    fontSize: 16,  
    color: "#333",  
  },  
  textArea: {  
    backgroundColor: "#fff",  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
    borderRadius: 8,  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    fontSize: 16,  
    color: "#333",  
    minHeight: 100,  
  },  
  priorityContainer: {  
    flexDirection: "row",  
    flexWrap: "wrap",  
    gap: 12,  
  },  
  priorityOption: {  
    flexDirection: "row",  
    alignItems: "center",  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    borderRadius: 8,  
    borderWidth: 2,  
    backgroundColor: "#fff",  
    minWidth: 100,  
  },  
  priorityOptionSelected: {  
    backgroundColor: "#f8f9fa",  
  },  
  priorityIndicator: {  
    width: 12,  
    height: 12,  
    borderRadius: 6,  
    marginRight: 8,  
  },  
  priorityIndicatorSelected: {  
    width: 16,  
    height: 16,  
    borderRadius: 8,  
  },  
  priorityText: {  
    fontSize: 14,  
    fontWeight: "500",  
    color: "#666",  
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
  clientOption: {  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "space-between",  
    paddingVertical: 16,  
    paddingHorizontal: 16,  
    borderRadius: 8,  
    marginBottom: 8,  
    backgroundColor: "#f8f9fa",  
  },  
  clientOptionSelected: {  
    backgroundColor: "#e8f0fe",  
    borderWidth: 1,  
    borderColor: "#1a73e8",  
  },  
  clientInfo: {  
    flex: 1,  
  },  
  clientName: {  
    fontSize: 16,  
    fontWeight: "600",  
    color: "#333",  
    marginBottom: 4,  
  },  
  clientDetails: {  
    fontSize: 14,  
    color: "#666",  
    marginBottom: 2,  
  },  
  vehicleOption: {  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "space-between",  
    paddingVertical: 16,  
    paddingHorizontal: 16,  
    borderRadius: 8,  
    marginBottom: 8,  
    backgroundColor: "#f8f9fa",  
  },  
  vehicleOptionSelected: {  
    backgroundColor: "#e8f0fe",  
    borderWidth: 1,  
    borderColor: "#1a73e8",  
  },  
  vehicleInfo: {  
    flex: 1,  
  },  
  vehicleName: {  
    fontSize: 16,  
    fontWeight: "600",  
    color: "#333",  
    marginBottom: 4,  
  },  
  vehicleDetails: {  
    fontSize: 14,  
    color: "#666",  
  },  
})