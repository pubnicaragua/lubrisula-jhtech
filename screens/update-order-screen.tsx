"use client"  
  
import { useState, useCallback } from "react"  
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
import { StackNavigationProp } from '@react-navigation/stack'  
import { RouteProp } from '@react-navigation/native'  
import { useAuth } from "../context/auth-context"  
import { orderService } from "../services/supabase/order-service"  
import { clientService } from "../services/supabase/client-service"  
import { vehicleService } from "../services/supabase/vehicle-service"  
import ACCESOS_SERVICES from "../services/supabase/access-service"  
import USER_SERVICE from "../services/supabase/user-service"  
import { RootStackParamList } from '../types/navigation'  
import { Order, OrderStatus } from '../types/order'  
import { Client } from '../types/client'  
import { Vehicle } from '../types/vehicle'  
  
type UpdateOrderNavigationProp = StackNavigationProp<RootStackParamList, 'UpdateOrder'>  
type UpdateOrderRouteProp = RouteProp<RootStackParamList, 'UpdateOrder'>  
  
interface Props {  
  navigation: UpdateOrderNavigationProp  
  route: UpdateOrderRouteProp  
}  
  
interface OrderFormData {  
  description: string  
  diagnosis: string  
  estimatedCompletionDate: string  
  status: OrderStatus  
  notes: string  
  subtotal: number  
  tax: number  
  discount: number  
  total: number  
}  
  
export default function UpdateOrderScreen({ navigation, route }: Props) {  
  const { orderId } = route.params  
  const { user } = useAuth()  
    
  const [loading, setLoading] = useState(true)  
  const [saving, setSaving] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
  const [order, setOrder] = useState<Order | null>(null)  
  const [client, setClient] = useState<Client | null>(null)  
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)  
    
  const [formData, setFormData] = useState<OrderFormData>({  
    description: '',  
    diagnosis: '',  
    estimatedCompletionDate: '',  
    status: 'reception',  
    notes: '',  
    subtotal: 0,  
    tax: 0,  
    discount: 0,  
    total: 0,  
  })  
  
  const [showStatusModal, setShowStatusModal] = useState(false)  
  
  const ORDER_STATUSES = [  
    { id: 'reception', label: 'Recepción', color: '#ff9800' },  
    { id: 'diagnosis', label: 'Diagnóstico', color: '#2196f3' },  
    { id: 'waiting_parts', label: 'Esperando Repuestos', color: '#9c27b0' },  
    { id: 'in_progress', label: 'En Proceso', color: '#ff5722' },  
    { id: 'quality_check', label: 'Control de Calidad', color: '#607d8b' },  
    { id: 'completed', label: 'Completada', color: '#4caf50' },  
    { id: 'delivered', label: 'Entregada', color: '#8bc34a' },  
    { id: 'cancelled', label: 'Cancelada', color: '#f44336' },  
  ]  
  
  const loadOrderData = useCallback(async () => {  
    try {  
      setLoading(true)  
      setError(null)  
  
      if (!user?.id) return  
  
      // ✅ CORREGIDO: Usar user.id en lugar de user.userId  
      const userId = user.id as string  
      const userTallerId = await USER_SERVICE.GET_TALLER_ID(userId)  
        
      if (!userTallerId) {  
        setError("No se pudo obtener la información del taller")  
        return  
      }  
        
      const userPermissions = await ACCESOS_SERVICES.GET_PERMISOS_USUARIO(userId, userTallerId)  
      setUserRole(userPermissions?.rol || 'client')  
  
      // Solo staff puede editar órdenes  
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
  
      // Cargar datos relacionados  
      const [clientData, vehicleData] = await Promise.all([  
        clientService.getClientById(orderData.clientId),  
        vehicleService.getVehicleById(orderData.vehicleId)  
      ])  
        
      setClient(clientData)  
      setVehicle(vehicleData)  
  
      // ✅ CORREGIDO: Usar campos reales del schema en lugar de campos inexistentes  
      setFormData({  
        description: orderData.description || '',  
        diagnosis: orderData.diagnosis || '',  
        estimatedCompletionDate: orderData.estimatedCompletionDate || '',  
        status: orderData.status,  
        notes: orderData.notes || '',  
        subtotal: orderData.subtotal || 0,  
        tax: orderData.tax || 0,  
        discount: orderData.discount || 0,  
        total: orderData.total || 0,  
      })  
  
    } catch (error) {  
      console.error("Error loading order data:", error)  
      setError("No se pudieron cargar los datos de la orden")  
    } finally {  
      setLoading(false)  
    }  
  }, [orderId, user])  
  
  useFocusEffect(  
    useCallback(() => {  
      loadOrderData()  
    }, [loadOrderData])  
  )  
  
  const handleFormChange = (field: keyof OrderFormData, value: string | number) => {  
    setFormData(prev => {  
      const updated = { ...prev, [field]: value }  
        
      // Recalcular total automáticamente  
      if (field === 'subtotal' || field === 'tax' || field === 'discount') {  
        const subtotal = field === 'subtotal' ? Number(value) : updated.subtotal  
        const tax = field === 'tax' ? Number(value) : updated.tax  
        const discount = field === 'discount' ? Number(value) : updated.discount  
          
        updated.total = subtotal + tax - discount  
      }  
        
      return updated  
    })  
  }  
  
  const validateForm = (): boolean => {  
    if (!formData.description.trim()) {  
      Alert.alert("Error", "La descripción es requerida")  
      return false  
    }  
  
    if (formData.subtotal < 0) {  
      Alert.alert("Error", "El subtotal no puede ser negativo")  
      return false  
    }  
  
    if (formData.tax < 0) {  
      Alert.alert("Error", "Los impuestos no pueden ser negativos")  
      return false  
    }  
  
    if (formData.discount < 0) {  
      Alert.alert("Error", "El descuento no puede ser negativo")  
      return false  
    }  
  
    return true  
  }  
  
  const handleSaveOrder = async () => {  
    if (!validateForm()) return  
  
    try {  
      setSaving(true)  
  
      const updateData = {  
        description: formData.description,  
        diagnosis: formData.diagnosis,  
        estimatedCompletionDate: formData.estimatedCompletionDate || undefined,  
        status: formData.status,  
        notes: formData.notes,  
        subtotal: formData.subtotal,  
        tax: formData.tax,  
        discount: formData.discount,  
        total: formData.total,  
        // ✅ CORREGIDO: Usar user.id en lugar de user.userId  
        updated_by: user?.id,  
        updated_at: new Date().toISOString(),  
      }  
  
      await orderService.updateOrder(orderId, updateData)  
        
      Alert.alert("Éxito", "Orden actualizada correctamente", [  
        { text: "OK", onPress: () => navigation.goBack() }  
      ])  
  
    } catch (error) {  
      console.error("Error updating order:", error)  
      Alert.alert("Error", "No se pudo actualizar la orden")  
    } finally {  
      setSaving(false)  
    }  
  }  
  
  const getStatusInfo = (statusId: string) => {  
    return ORDER_STATUSES.find(s => s.id === statusId) || ORDER_STATUSES[0]  
  }  
  
  const formatCurrency = (amount: number) => {  
    return amount.toLocaleString("es-ES", {  
      style: "currency",  
      currency: "USD",  
      minimumFractionDigits: 2,  
    })  
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
  
  const statusInfo = getStatusInfo(formData.status)  
  
  return (  
    <ScrollView style={styles.container}>  
      {/* Header */}  
      <View style={styles.header}>  
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>  
          <Feather name="arrow-left" size={24} color="#333" />  
        </TouchableOpacity>  
        <Text style={styles.headerTitle}>Editar Orden</Text>  
        <TouchableOpacity   
          style={styles.saveButton}   
          onPress={handleSaveOrder}  
          disabled={saving}  
        >  
          {saving ? (  
            <ActivityIndicator size="small" color="#1a73e8" />  
          ) : (  
            <Feather name="save" size={24} color="#1a73e8" />  
          )}  
        </TouchableOpacity>  
      </View>  
  
      {/* Información de la orden */}  
      <View style={styles.section}>  
        <Text style={styles.sectionTitle}>Información de la Orden</Text>  
        <Text style={styles.orderNumber}>#{order.orderNumber || order.id.slice(0, 8)}</Text>  
        <Text style={styles.orderClient}>Cliente: {client?.name || 'No especificado'}</Text>  
        <Text style={styles.orderVehicle}>  
          Vehículo: {vehicle ? `${vehicle.make} ${vehicle.model}` : 'No especificado'}  
        </Text>  
      </View>  
  
      {/* Estado de la orden */}  
      <View style={styles.section}>  
        <Text style={styles.sectionTitle}>Estado de la Orden</Text>        
        
        <TouchableOpacity  
          style={styles.statusSelector}  
          onPress={() => setShowStatusModal(true)}  
        >  
          <View style={styles.statusInfo}>  
            <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />  
            <Text style={styles.statusText}>{statusInfo.label}</Text>  
          </View>  
          <Feather name="chevron-down" size={20} color="#666" />  
        </TouchableOpacity>  
      </View>  
  
      {/* Formulario de edición */}  
      <View style={styles.section}>  
        <Text style={styles.sectionTitle}>Detalles de la Orden</Text>  
          
        <View style={styles.formGroup}>  
          <Text style={styles.formLabel}>Descripción del Trabajo *</Text>  
          <TextInput  
            style={[styles.formInput, styles.textArea]}  
            value={formData.description}  
            onChangeText={(text) => handleFormChange('description', text)}  
            placeholder="Describe el trabajo a realizar..."  
            multiline  
            numberOfLines={3}  
            textAlignVertical="top"  
          />  
        </View>  
  
        <View style={styles.formGroup}>  
          <Text style={styles.formLabel}>Diagnóstico</Text>  
          <TextInput  
            style={[styles.formInput, styles.textArea]}  
            value={formData.diagnosis}  
            onChangeText={(text) => handleFormChange('diagnosis', text)}  
            placeholder="Diagnóstico del problema..."  
            multiline  
            numberOfLines={3}  
            textAlignVertical="top"  
          />  
        </View>  
  
        <View style={styles.formGroup}>  
          <Text style={styles.formLabel}>Fecha Estimada de Finalización</Text>  
          <TextInput  
            style={styles.formInput}  
            value={formData.estimatedCompletionDate}  
            onChangeText={(text) => handleFormChange('estimatedCompletionDate', text)}  
            placeholder="YYYY-MM-DD"  
          />  
        </View>  
  
        <View style={styles.formGroup}>  
          <Text style={styles.formLabel}>Notas Adicionales</Text>  
          <TextInput  
            style={[styles.formInput, styles.textArea]}  
            value={formData.notes}  
            onChangeText={(text) => handleFormChange('notes', text)}  
            placeholder="Notas adicionales..."  
            multiline  
            numberOfLines={2}  
            textAlignVertical="top"  
          />  
        </View>  
      </View>  
  
      {/* Información financiera */}  
      <View style={styles.section}>  
        <Text style={styles.sectionTitle}>Información Financiera</Text>  
          
        <View style={styles.formRow}>  
          <View style={styles.formGroupHalf}>  
            <Text style={styles.formLabel}>Subtotal</Text>  
            <TextInput  
              style={styles.formInput}  
              value={formData.subtotal.toString()}  
              onChangeText={(text) => handleFormChange('subtotal', parseFloat(text) || 0)}  
              placeholder="0.00"  
              keyboardType="numeric"  
            />  
          </View>  
            
          <View style={styles.formGroupHalf}>  
            <Text style={styles.formLabel}>Impuestos</Text>  
            <TextInput  
              style={styles.formInput}  
              value={formData.tax.toString()}  
              onChangeText={(text) => handleFormChange('tax', parseFloat(text) || 0)}  
              placeholder="0.00"  
              keyboardType="numeric"  
            />  
          </View>  
        </View>  
  
        <View style={styles.formRow}>  
          <View style={styles.formGroupHalf}>  
            <Text style={styles.formLabel}>Descuento</Text>  
            <TextInput  
              style={styles.formInput}  
              value={formData.discount.toString()}  
              onChangeText={(text) => handleFormChange('discount', parseFloat(text) || 0)}  
              placeholder="0.00"  
              keyboardType="numeric"  
            />  
          </View>  
            
          <View style={styles.formGroupHalf}>  
            <Text style={styles.formLabel}>Total</Text>  
            <Text style={styles.totalDisplay}>{formatCurrency(formData.total)}</Text>  
          </View>  
        </View>  
      </View>  
  
      {/* Modal de selección de estado */}  
      <Modal  
        visible={showStatusModal}  
        animationType="slide"  
        transparent={true}  
      >  
        <View style={styles.modalOverlay}>  
          <View style={styles.statusModal}>  
            <Text style={styles.modalTitle}>Seleccionar Estado</Text>  
              
            {ORDER_STATUSES.map((status) => (  
              <TouchableOpacity  
                key={status.id}  
                style={[  
                  styles.statusOption,  
                  formData.status === status.id && styles.statusOptionSelected  
                ]}  
                onPress={() => {  
                  handleFormChange('status', status.id as OrderStatus)  
                  setShowStatusModal(false)  
                }}  
              >  
                <View style={styles.statusOptionContent}>  
                  <View style={[styles.statusDot, { backgroundColor: status.color }]} />  
                  <Text style={styles.statusOptionText}>{status.label}</Text>  
                </View>  
                {formData.status === status.id && (  
                  <Feather name="check" size={20} color="#1a73e8" />  
                )}  
              </TouchableOpacity>  
            ))}  
  
            <TouchableOpacity  
              style={styles.closeStatusModal}  
              onPress={() => setShowStatusModal(false)}  
            >  
              <Text style={styles.closeStatusModalText}>Cerrar</Text>  
            </TouchableOpacity>  
          </View>  
        </View>  
      </Modal>  
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
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 12,  
  },  
  orderNumber: {  
    fontSize: 20,  
    fontWeight: "bold",  
    color: "#1a73e8",  
    marginBottom: 4,  
  },  
  orderClient: {  
    fontSize: 14,  
    color: "#666",  
    marginBottom: 2,  
  },  
  orderVehicle: {  
    fontSize: 14,  
    color: "#666",  
  },  
  statusSelector: {  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "space-between",  
    paddingVertical: 12,  
    paddingHorizontal: 16,  
    backgroundColor: "#f8f9fa",  
    borderRadius: 8,  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  statusInfo: {  
    flexDirection: "row",  
    alignItems: "center",  
  },  
  statusDot: {  
    width: 12,  
    height: 12,  
    borderRadius: 6,  
    marginRight: 8,  
  },  
  statusText: {  
    fontSize: 16,  
    color: "#333",  
    fontWeight: "500",  
  },  
  formGroup: {  
    marginBottom: 16,  
  },  
  formGroupHalf: {  
    flex: 1,  
    marginHorizontal: 4,  
  },  
  formRow: {  
    flexDirection: "row",  
    marginHorizontal: -4,  
  },  
  formLabel: {  
    fontSize: 14,  
    fontWeight: "600",  
    color: "#333",  
    marginBottom: 8,  
  },  
  formInput: {  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
    borderRadius: 8,  
    paddingHorizontal: 12,  
    paddingVertical: 10,  
    fontSize: 16,  
    color: "#333",  
    backgroundColor: "#fff",  
  },  
  textArea: {  
    minHeight: 80,  
    textAlignVertical: "top",  
  },  
  totalDisplay: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#1a73e8",  
    paddingVertical: 10,  
    paddingHorizontal: 12,  
    backgroundColor: "#e8f0fe",  
    borderRadius: 8,  
    textAlign: "center",  
  },  
  modalOverlay: {  
    flex: 1,  
    backgroundColor: "rgba(0, 0, 0, 0.5)",  
    justifyContent: "center",  
    alignItems: "center",  
  },  
  statusModal: {  
    backgroundColor: "#fff",  
    borderRadius: 12,  
    padding: 20,  
    margin: 20,  
    minWidth: 300,  
    maxHeight: "80%",  
  },  
  modalTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 16,  
    textAlign: "center",  
  },  
  statusOption: {  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "space-between",  
    paddingVertical: 12,  
    paddingHorizontal: 16,  
    borderRadius: 8,  
    marginVertical: 4,  
  },  
  statusOptionSelected: {  
    backgroundColor: "#e8f0fe",  
  },  
  statusOptionContent: {  
    flexDirection: "row",  
    alignItems: "center",  
  },  
  statusOptionText: {  
    fontSize: 16,  
    color: "#333",  
    marginLeft: 8,  
  },  
  closeStatusModal: {  
    marginTop: 16,  
    paddingVertical: 12,  
    alignItems: "center",  
  },  
  closeStatusModalText: {  
    fontSize: 16,  
    color: "#1a73e8",  
    fontWeight: "500",  
  },  
})