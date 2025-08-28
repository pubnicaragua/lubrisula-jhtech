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
  
export default function EditOrderScreen() {  
  const { user } = useAuth()  
  const navigation = useNavigation<StackNavigationProp<any>>()  
  const route = useRoute()  
  const { orderId } = route.params as { orderId: string }  
  
  const [order, setOrder] = useState<Order | null>(null)  
  const [loading, setLoading] = useState(true)  
  const [saving, setSaving] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
    
  // Datos del formulario  
  const [formData, setFormData] = useState({  
    description: "",  
    diagnosis: "",  
    priority: "normal" as "low" | "normal" | "high" | "urgent",  
    estimatedCompletionDate: "",  
    notes: "",  
    status: "reception" as OrderStatus,  
  })  
  
  // Estados para modales  
  const [statusModalVisible, setStatusModalVisible] = useState(false)  
  
  const loadOrderData = useCallback(async () => {  
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
  setUserRole(userPermissions?.role || 'client')  
  
      // Solo staff puede editar órdenes  
  if (userPermissions?.role === 'client') {  
        setError("No tienes permisos para editar órdenes")  
        return  
      }  
  
      // Obtener datos de la orden  
      const orderData = await orderService.getOrderById(orderId)  
      if (!orderData) {  
        setError("Orden no encontrada")  
        return  
      }  
  
      setOrder(orderData)  
      setFormData({  
  description: orderData.description || "",  
  diagnosis: orderData.diagnosis || "",  
  priority: (orderData as any).priority || "normal",  
  estimatedCompletionDate: orderData.estimatedCompletionDate || "",  
  notes: orderData.notes || "",  
  status: orderData.status,
      })  
  
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
    if (!formData.description.trim()) {  
      Alert.alert("Error", "La descripción del trabajo es obligatoria")  
      return false  
    }  
    return true  
  }  
  
  const handleSaveOrder = async () => {  
    if (!validateForm()) return  
  
    try {  
      setSaving(true)  
  
      const updateData = {  
        description: formData.description.trim(),  
        diagnosis: formData.diagnosis.trim(),  
        priority: formData.priority,  
        status: formData.status,  
        estimatedCompletionDate: formData.estimatedCompletionDate || null,  
        notes: formData.notes.trim(),  
        updatedAt: new Date().toISOString(),  
      }  
  
  // Ajustar tipo de estimatedCompletionDate a string | undefined
  await orderService.updateOrder(orderId, { ...updateData, estimatedCompletionDate: updateData.estimatedCompletionDate || undefined })
        
      Alert.alert(  
        "Éxito",   
        "Orden actualizada correctamente",  
        [  
          {  
            text: "Ver Orden",  
            onPress: () => navigation.navigate("OrderDetail", { orderId })  
          }  
        ]  
      )  
  
    } catch (error) {  
      console.error("Error updating order:", error)  
      Alert.alert("Error", "No se pudo actualizar la orden")  
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
  
  const getStatusColor = (status: string) => {  
    switch (status) {  
      case "reception": return "#1a73e8"  
      case "diagnosis": return "#9c27b0"  
      case "waiting_parts": return "#ff9800"  
      case "in_progress": return "#4caf50"  
      case "quality_check": return "#2196f3"  
      case "completed": return "#607d8b"  
      case "delivered": return "#4caf50"  
      case "cancelled": return "#f44336"  
      default: return "#666"  
    }  
  }  
  
  const getStatusText = (status: string) => {  
    switch (status) {  
      case "reception": return "Recepción"  
      case "diagnosis": return "Diagnóstico"  
      case "waiting_parts": return "Esperando Repuestos"  
      case "in_progress": return "En Proceso"  
      case "quality_check": return "Control de Calidad"  
      case "completed": return "Completada"  
      case "delivered": return "Entregada"  
      case "cancelled": return "Cancelada"  
      default: return "Desconocido"  
    }  
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
    <View style={styles.container}>  
      <View style={styles.header}>  
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>  
          <Feather name="arrow-left" size={24} color="#333" />  
        </TouchableOpacity>  
  <Text style={styles.headerTitle}>Editar Orden #{order.id}</Text>
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
        {/* Estado actual */}  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>Estado de la Orden</Text>  
          <TouchableOpacity  
            style={styles.statusButton}  
            onPress={() => setStatusModalVisible(true)}  
          >  
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(formData.status) }]} />  
            <Text style={styles.statusButtonText}>{getStatusText(formData.status)}</Text>  
            <Feather name="chevron-down" size={20} color="#666" />  
          </TouchableOpacity>  
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
  
        {/* Diagnóstico */}  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>Diagnóstico</Text>  
          <TextInput  
            style={styles.textArea}  
            placeholder="Diagnóstico detallado..."  
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
            placeholder="YYYY-MM-DD"  
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
  
      {/* Modal de selección de estado */}  
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
  
          <ScrollView style={styles.modalContent}>  
            {["reception", "diagnosis", "waiting_parts", "in_progress", "quality_check", "completed", "delivered", "cancelled"].map((status) => (  
              <TouchableOpacity  
                key={status}  
                style={[  
                  styles.statusOption,  
                  formData.status === status && styles.statusOptionSelected  
                ]}  
                onPress={() => {  
                  setFormData(prev => ({ ...prev, status: status as OrderStatus }))  
                  setStatusModalVisible(false)  
                }}  
              >  
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(status) }]} />  
                <Text style={[  
                  styles.statusOptionText,  
                  formData.status === status && styles.statusOptionTextSelected  
                ]}>  
                  {getStatusText(status)}  
                </Text>  
                {formData.status === status && (  
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
  statusButton: {  
    flexDirection: "row",  
    alignItems: "center",  
    backgroundColor: "#fff",  
    borderRadius: 8,  
    padding: 16,  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  statusIndicator: {  
    width: 12,  
    height: 12,  
    borderRadius: 6,  
    marginRight: 12,  
  },  
  statusButtonText: {  
    fontSize: 16,  
    color: "#333",  
    flex: 1,  
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
  statusOption: {  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "space-between",  
    paddingVertical: 16,  
    paddingHorizontal: 16,  
    borderRadius: 8,  
    marginBottom: 8,  
    backgroundColor: "#f8f9fa",  
  },  
  statusOptionSelected: {  
    backgroundColor: "#e8f0fe",  
    borderWidth: 1,  
    borderColor: "#1a73e8",  
  },  
  statusOptionText: {  
    fontSize: 16,  
    color: "#333",  
    flex: 1,  
    marginLeft: 12,  
  },  
  statusOptionTextSelected: {  
    color: "#1a73e8",  
    fontWeight: "600",  
  },  
})