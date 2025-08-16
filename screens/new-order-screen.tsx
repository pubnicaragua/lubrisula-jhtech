"use client"  
  
import { useState, useCallback } from "react"  
import {  
  View,  
  Text,  
  ScrollView,  
  TouchableOpacity,  
  TextInput,  
  StyleSheet,  
  ActivityIndicator,  
  Alert,  
} from "react-native"  
import { Feather } from "@expo/vector-icons"  
import { useFocusEffect } from "@react-navigation/native"  
import { StackNavigationProp } from '@react-navigation/stack'  
import { RouteProp } from '@react-navigation/native'  
import { useAuth } from "../context/auth-context"  
import { orderService } from "../services/supabase/order-service"  
import { clientService } from "../services/supabase/client-service"  
import { vehicleService } from "../services/supabase/vehicle-service"  
import { RootStackParamList, NewOrderParams } from '../types/navigation'  
import { Order, OrderStatus, CreateOrderData } from '../types/order'  
// ✅ CORREGIDO: Importar tipos desde servicios de Supabase  
import { Client } from '../services/supabase/client-service'  
import { Vehicle } from '../services/supabase/vehicle-service'  
  
type NewOrderScreenNavigationProp = StackNavigationProp<RootStackParamList, 'NewOrder'>  
type NewOrderScreenRouteProp = RouteProp<RootStackParamList, 'NewOrder'>  
  
interface Props {  
  navigation: NewOrderScreenNavigationProp  
  route: NewOrderScreenRouteProp  
}  
  
export default function NewOrderScreen({ navigation, route }: Props) {  
  const { user } = useAuth()  
  // Obtener parámetros de navegación de forma tipada  
  const params = route.params as NewOrderParams | undefined  
  const [loading, setLoading] = useState(false)  
  const [clients, setClients] = useState<Client[]>([])  
  const [vehicles, setVehicles] = useState<Vehicle[]>([])  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)  
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)  
  
  // Estados del formulario  
  const [description, setDescription] = useState("")  
  const [diagnosis, setDiagnosis] = useState("")  
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState<string | undefined>(undefined)  
  const [notes, setNotes] = useState("")  
  
  const loadInitialData = useCallback(async () => {  
    try {  
      setLoading(true)  
      // Cargar clientes y vehículos  
      const [clientsData, vehiclesData] = await Promise.all([  
        clientService.getAllClients(),  
        vehicleService.getAllVehicles()  
      ])  
  
      setClients(clientsData)  
      // ✅ CORREGIDO: Usar directamente sin mapeo ya que los tipos están sincronizados  
      setVehicles(vehiclesData)  
  
      // Si viene con parámetros, preseleccionar cliente y/o vehículo  
      if (params?.clientId) {  
        const client = clientsData.find(c => c.id === params.clientId)  
        if (client) {  
          setSelectedClient(client)  
          // Filtrar vehículos del cliente seleccionado  
          const clientVehicles = vehiclesData.filter(v => v.client_id === params.clientId)  
          // Si también viene vehicleId, preseleccionarlo  
          if (params.vehicleId) {  
            const vehicle = clientVehicles.find(v => v.id === params.vehicleId)  
            if (vehicle) {  
              setSelectedVehicle(vehicle)  
            }  
          }  
        }  
      }  
    } catch (error) {  
      console.error("Error loading initial data:", error)  
      Alert.alert("Error", "No se pudieron cargar los datos iniciales")  
    } finally {  
      setLoading(false)  
    }  
  }, [params])  
  
  useFocusEffect(useCallback(() => {  
    loadInitialData()  
  }, [loadInitialData]))  
  
  const handleClientSelect = (client: Client) => {  
    setSelectedClient(client)  
    // Filtrar vehículos del cliente seleccionado  
    const clientVehicles = vehicles.filter(v => v.client_id === client.id)  
    // Si el vehículo seleccionado no pertenece al nuevo cliente, limpiarlo  
    if (selectedVehicle && selectedVehicle.client_id !== client.id) {  
      setSelectedVehicle(null)  
    }  
  }  
  
  const handleVehicleSelect = (vehicle: Vehicle) => {  
    setSelectedVehicle(vehicle)  
    // Si no hay cliente seleccionado, seleccionar el dueño del vehículo  
    if (!selectedClient) {  
      const client = clients.find(c => c.id === vehicle.client_id)  
      if (client) {  
        setSelectedClient(client)  
      }  
    }  
  }  
  
  const handleCreateOrder = async () => {  
    try {  
      // Validaciones  
      if (!selectedClient) {  
        Alert.alert("Error", "Debe seleccionar un cliente")  
        return  
      }  
      if (!selectedVehicle) {  
        Alert.alert("Error", "Debe seleccionar un vehículo")  
        return  
      }  
      if (!description.trim()) {  
        Alert.alert("Error", "Debe ingresar una descripción del trabajo")  
        return  
      }  
  
      setLoading(true)  
  
      // ✅ CORREGIDO: Crear datos de la orden sin campo priority  
      const orderData: CreateOrderData = {  
        clientId: selectedClient.id,  
        vehicleId: selectedVehicle.id,  
        description: description.trim(),  
        diagnosis: diagnosis.trim(),  
        status: "reception" as OrderStatus,  
        estimatedCompletionDate: estimatedCompletionDate || undefined,  
        notes: notes.trim(),  
        technicianId: user?.id || "", // Asignar al usuario actual como técnico  
        subtotal: 0, // Inicializar en 0  
        tax: 0, // Inicializar en 0  
        discount: 0, // Inicializar en 0  
        total: 0, // Inicializar en 0  
        paymentStatus: "pending" as const,  
      }  
  
      const newOrder = await orderService.createOrder(orderData)  
      Alert.alert(  
        "Éxito",  
        "Orden creada correctamente",  
        [  
          {  
            text: "Ver Orden",  
            onPress: () => {  
              navigation.replace("OrderDetail", { orderId: newOrder.id })  
            }  
          }  
        ]  
      )  
    } catch (error) {  
      console.error("Error creating order:", error)  
      Alert.alert("Error", "No se pudo crear la orden")  
    } finally {  
      setLoading(false)  
    }  
  }  
  
  if (loading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#1a73e8" />  
        <Text style={styles.loadingText}>Cargando...</Text>  
      </View>  
    )  
  }  
  
  return (  
    <ScrollView style={styles.container}>  
      {/* Selección de Cliente */}  
      <View style={styles.section}>  
        <Text style={styles.sectionTitle}>Cliente</Text>  
        <TouchableOpacity  
          style={styles.          selector}  
          onPress={() => {  
            // Aquí iría la navegación a selector de cliente  
            Alert.alert("Info", "Selector de cliente pendiente de implementar")  
          }}  
        >  
          <Text style={styles.selectorText}>  
            {selectedClient ? selectedClient.name : "Seleccionar cliente"}  
          </Text>  
          <Feather name="chevron-down" size={20} color="#666" />  
        </TouchableOpacity>  
      </View>  
  
      {/* Selección de Vehículo */}  
      <View style={styles.section}>  
        <Text style={styles.sectionTitle}>Vehículo</Text>  
        <TouchableOpacity  
          style={styles.selector}  
          onPress={() => {  
            if (!selectedClient) {  
              Alert.alert("Error", "Primero debe seleccionar un cliente")  
              return  
            }  
            // Aquí iría la navegación a selector de vehículo  
            Alert.alert("Info", "Selector de vehículo pendiente de implementar")  
          }}  
        >  
          <Text style={styles.selectorText}>  
            {/* ✅ CORREGIDO: Usar campos reales del schema */}  
            {selectedVehicle   
              ? `${selectedVehicle.marca} ${selectedVehicle.modelo} (${selectedVehicle.placa})`   
              : "Seleccionar vehículo"  
            }  
          </Text>  
          <Feather name="chevron-down" size={20} color="#666" />  
        </TouchableOpacity>  
      </View>  
  
      {/* Descripción del Trabajo */}  
      <View style={styles.section}>  
        <Text style={styles.sectionTitle}>Descripción del Trabajo *</Text>  
        <TextInput  
          style={styles.textArea}  
          placeholder="Describa el trabajo a realizar..."  
          value={description}  
          onChangeText={setDescription}  
          multiline  
          numberOfLines={4}  
          textAlignVertical="top"  
        />  
      </View>  
  
      {/* Diagnóstico */}  
      <View style={styles.section}>  
        <Text style={styles.sectionTitle}>Diagnóstico Inicial</Text>  
        <TextInput  
          style={styles.textArea}  
          placeholder="Diagnóstico inicial del problema..."  
          value={diagnosis}  
          onChangeText={setDiagnosis}  
          multiline  
          numberOfLines={3}  
          textAlignVertical="top"  
        />  
      </View>  
  
      {/* Notas Adicionales */}  
      <View style={styles.section}>  
        <Text style={styles.sectionTitle}>Notas Adicionales</Text>  
        <TextInput  
          style={styles.textArea}  
          placeholder="Notas adicionales..."  
          value={notes}  
          onChangeText={setNotes}  
          multiline  
          numberOfLines={3}  
          textAlignVertical="top"  
        />  
      </View>  
  
      {/* Botón de Crear Orden */}  
      <View style={styles.buttonContainer}>  
        <TouchableOpacity  
          style={[styles.createButton, loading && styles.createButtonDisabled]}  
          onPress={handleCreateOrder}  
          disabled={loading}  
        >  
          {loading ? (  
            <ActivityIndicator size="small" color="#fff" />  
          ) : (  
            <Text style={styles.createButtonText}>Crear Orden</Text>  
          )}  
        </TouchableOpacity>  
      </View>  
  
      {/* Lista de vehículos del cliente seleccionado */}  
      {selectedClient && (  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>Vehículos del Cliente</Text>  
          {vehicles  
            .filter(v => v.client_id === selectedClient?.id)  
            .map((vehicle) => (  
              <TouchableOpacity  
                key={vehicle.id}  
                style={[  
                  styles.vehicleItem,  
                  selectedVehicle?.id === vehicle.id && styles.vehicleItemSelected  
                ]}  
                onPress={() => handleVehicleSelect(vehicle)}  
              >  
                <View style={styles.vehicleInfo}>  
                  {/* ✅ CORREGIDO: Usar campos reales del schema */}  
                  <Text style={styles.vehicleName}>  
                    {vehicle.marca} {vehicle.modelo}  
                  </Text>  
                  <Text style={styles.vehicleDetails}>  
                    {vehicle.ano} • {vehicle.placa}  
                  </Text>  
                </View>  
                {selectedVehicle?.id === vehicle.id && (  
                  <Feather name="check-circle" size={20} color="#4caf50" />  
                )}  
              </TouchableOpacity>  
            ))}  
        </View>  
      )}  
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
  section: {  
    backgroundColor: "#fff",  
    margin: 16,  
    borderRadius: 8,  
    padding: 16,  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 1 },  
    shadowOpacity: 0.1,  
    shadowRadius: 2,  
    elevation: 2,  
  },  
  sectionTitle: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 12,  
  },  
  selector: {  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "space-between",  
    paddingVertical: 12,  
    paddingHorizontal: 16,  
    backgroundColor: "#f5f5f5",  
    borderRadius: 8,  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  selectorText: {  
    fontSize: 16,  
    color: "#333",  
    flex: 1,  
  },  
  textArea: {  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
    borderRadius: 8,  
    padding: 12,  
    fontSize: 16,  
    color: "#333",  
    backgroundColor: "#fff",  
    minHeight: 100,  
  },  
  buttonContainer: {  
    padding: 16,  
  },  
  createButton: {  
    backgroundColor: "#1a73e8",  
    paddingVertical: 16,  
    borderRadius: 8,  
    alignItems: "center",  
  },  
  createButtonDisabled: {  
    backgroundColor: "#ccc",  
  },  
  createButtonText: {  
    color: "#fff",  
    fontSize: 18,  
    fontWeight: "bold",  
  },  
  vehicleItem: {  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "space-between",  
    paddingVertical: 12,  
    paddingHorizontal: 16,  
    backgroundColor: "#f8f9fa",  
    borderRadius: 8,  
    marginBottom: 8,  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  vehicleItemSelected: {  
    backgroundColor: "#e8f0fe",  
    borderColor: "#1a73e8",  
  },  
  vehicleInfo: {  
    flex: 1,  
  },  
  vehicleName: {  
    fontSize: 16,  
    fontWeight: "600",  
    color: "#333",  
    marginBottom: 2,  
  },  
  vehicleDetails: {  
    fontSize: 14,  
    color: "#666",  
  },  
})