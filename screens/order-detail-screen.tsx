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
  RefreshControl,  
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
import { Order } from '../types/order'  
import { Client } from '../types/client'  
import { Vehicle } from '../types/vehicle'  
  
type OrderDetailNavigationProp = StackNavigationProp<RootStackParamList, 'OrderDetail'>  
type OrderDetailRouteProp = RouteProp<RootStackParamList, 'OrderDetail'>  
  
interface Props {  
  navigation: OrderDetailNavigationProp  
  route: OrderDetailRouteProp  
}  
  
interface EnhancedOrder extends Order {  
  clientName?: string  
  clientPhone?: string  
  clientEmail?: string  
  vehicleInfo?: string  
  vehiclePlate?: string  
}  
  
export default function OrderDetailScreen({ navigation, route }: Props) {  
  const { orderId } = route.params  
  const { user } = useAuth()  
    
  const [loading, setLoading] = useState(true)  
  const [refreshing, setRefreshing] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
  const [order, setOrder] = useState<EnhancedOrder | null>(null)  
  
  const loadOrderDetail = useCallback(async () => {  
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
  
      // Cargar datos de la orden  
      const orderData = await orderService.getOrderById(orderId)  
      if (!orderData) {  
        setError("Orden no encontrada")  
        return  
      }  
  
      // Cargar datos relacionados  
      const [client, vehicle] = await Promise.all([  
        clientService.getClientById(orderData.clientId),  
        vehicleService.getVehicleById(orderData.vehicleId)  
      ])  
  
      // ✅ CORREGIDO: Usar campos reales en lugar de campos inexistentes  
      const enhancedOrder: EnhancedOrder = {  
        ...orderData,  
        clientName: client?.name || "Cliente no especificado",  
        clientPhone: client?.phone || "No especificado",  
        clientEmail: client?.email || "No especificado",  
        vehicleInfo: vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.year})` : "Vehículo no especificado",  
        vehiclePlate: vehicle?.license_plate || "No especificada"  
      }  
  
      setOrder(enhancedOrder)  
  
    } catch (error) {  
      console.error("Error loading order detail:", error)  
      setError("No se pudieron cargar los detalles de la orden")  
    } finally {  
      setLoading(false)  
      setRefreshing(false)  
    }  
  }, [orderId, user])  
  
  useFocusEffect(  
    useCallback(() => {  
      loadOrderDetail()  
    }, [loadOrderDetail])  
  )  
  
  const getStatusColor = (status: string) => {  
    switch (status) {  
      case 'reception': return '#ff9800'  
      case 'diagnosis': return '#2196f3'  
      case 'waiting_parts': return '#9c27b0'  
      case 'in_progress': return '#ff5722'  
      case 'quality_check': return '#607d8b'  
      case 'completed': return '#4caf50'  
      case 'delivered': return '#8bc34a'  
      case 'cancelled': return '#f44336'  
      default: return '#666'  
    }  
  }  
  
  const getStatusText = (status: string) => {  
    switch (status) {  
      case 'reception': return 'Recepción'  
      case 'diagnosis': return 'Diagnóstico'  
      case 'waiting_parts': return 'Esperando Repuestos'  
      case 'in_progress': return 'En Proceso'  
      case 'quality_check': return 'Control de Calidad'  
      case 'completed': return 'Completada'  
      case 'delivered': return 'Entregada'  
      case 'cancelled': return 'Cancelada'  
      default: return status  
    }  
  }  
  
  const formatCurrency = (amount: number) => {  
    return amount.toLocaleString("es-ES", {  
      style: "currency",  
      currency: "USD",  
      minimumFractionDigits: 2,  
    })  
  }  
  
  const handleEditOrder = () => {  
    navigation.navigate("UpdateOrder", { orderId: order!.id })  
  }  
  
  const handleViewParts = () => {  
    navigation.navigate("OrderParts", { orderId: order!.id })  
  }  
  
  const handleViewVehicle = () => {  
    if (order?.vehicleId) {  
      navigation.navigate("VehicleDetail", { vehicleId: order.vehicleId })  
    }  
  }  
  
  const onRefresh = () => {  
    setRefreshing(true)  
    loadOrderDetail()  
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
        <TouchableOpacity style={styles.retryButton} onPress={loadOrderDetail}>  
          <Text style={styles.retryButtonText}>Reintentar</Text>  
        </TouchableOpacity>  
      </View>  
    )  
  }  
  
  if (!order) return null  
  
  return (  
    <ScrollView   
      style={styles.container}  
      refreshControl={  
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />  
      }  
    >  
      {/* Header de la orden */}  
      <View style={styles.header}>  
        <View style={styles.orderTitleContainer}>  
          <Text style={styles.orderNumber}>Orden #{order.orderNumber || order.id.slice(0, 8)}</Text>  
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>  
            <Text style={styles.statusText}>{getStatusText(order.status)}</Text>  
          </View>  
        </View>  
        <Text style={styles.orderDate}>  
          Creada: {new Date(order.created_at).toLocaleDateString('es-ES')}  
        </Text>  
      </View>  
  
      {/* Información del cliente */}  
      <View style={styles.section}>  
        <Text style={styles.sectionTitle}>Información del Cliente</Text>  
        <View style={styles.infoRow}>  
          <Feather name="user" size={16} color="#666" />  
          <Text style={styles.infoText}>{order.clientName}</Text>  
        </View>  
        {order.clientPhone && (  
          <View style={styles.infoRow}>  
            <Feather name="phone" size={16} color="#666" />  
            <Text style={styles.infoText}>{order.clientPhone}</Text>  
          </View>  
        )}  
        {order.clientEmail && (  
          <View style={styles.infoRow}>  
            <Feather name="mail" size={16} color="#666" />  
            <Text style={styles.infoText}>{order.clientEmail}</Text>  
          </View>  
        )}        </View>  
  
        {/* Información del vehículo */}  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>Información del Vehículo</Text>  
          <TouchableOpacity style={styles.vehicleContainer} onPress={handleViewVehicle}>  
            <View style={styles.infoRow}>  
              <Feather name="truck" size={16} color="#666" />  
              <Text style={styles.infoText}>{order.vehicleInfo}</Text>  
            </View>  
            {order.vehiclePlate && (  
              <View style={styles.infoRow}>  
                <Feather name="hash" size={16} color="#666" />  
                <Text style={styles.infoText}>Placa: {order.vehiclePlate}</Text>  
              </View>  
            )}  
            <Feather name="chevron-right" size={16} color="#1a73e8" />  
          </TouchableOpacity>  
        </View>  
    
        {/* Descripción del trabajo */}  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>Descripción del Trabajo</Text>  
          <Text style={styles.description}>  
            {order.description || 'Sin descripción disponible'}  
          </Text>  
        </View>  
    
        {/* Diagnóstico */}  
        {order.diagnosis && (  
          <View style={styles.section}>  
            <Text style={styles.sectionTitle}>Diagnóstico</Text>  
            <Text style={styles.description}>{order.diagnosis}</Text>  
          </View>  
        )}  
    
        {/* Información financiera */}  
        {(order.subtotal || order.total) && (  
          <View style={styles.section}>  
            <Text style={styles.sectionTitle}>Información Financiera</Text>  
              
            {order.subtotal && (  
              <View style={styles.priceRow}>  
                <Text style={styles.priceLabel}>Subtotal:</Text>  
                <Text style={styles.priceValue}>{formatCurrency(order.subtotal)}</Text>  
              </View>  
            )}  
              
            {order.tax && (  
              <View style={styles.priceRow}>  
                <Text style={styles.priceLabel}>Impuestos:</Text>  
                <Text style={styles.priceValue}>{formatCurrency(order.tax)}</Text>  
              </View>  
            )}  
              
            {order.discount && (  
              <View style={styles.priceRow}>  
                <Text style={styles.priceLabel}>Descuento:</Text>  
                <Text style={[styles.priceValue, { color: '#4caf50' }]}>  
                  -{formatCurrency(order.discount)}  
                </Text>  
              </View>  
            )}  
              
            {order.total && (  
              <View style={[styles.priceRow, styles.totalRow]}>  
                <Text style={styles.totalLabel}>TOTAL:</Text>  
                <Text style={styles.totalValue}>{formatCurrency(order.total)}</Text>  
              </View>  
            )}  
          </View>  
        )}  
    
        {/* Fechas importantes */}  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>Fechas Importantes</Text>  
            
          <View style={styles.dateRow}>  
            <Text style={styles.dateLabel}>Fecha de creación:</Text>  
            <Text style={styles.dateValue}>  
              {new Date(order.created_at).toLocaleDateString('es-ES')}  
            </Text>  
          </View>  
            
          {order.estimatedCompletionDate && (  
            <View style={styles.dateRow}>  
              <Text style={styles.dateLabel}>Fecha estimada de finalización:</Text>  
              <Text style={styles.dateValue}>  
                {new Date(order.estimatedCompletionDate).toLocaleDateString('es-ES')}  
              </Text>  
            </View>  
          )}  
            
          {order.updated_at && (  
            <View style={styles.dateRow}>  
              <Text style={styles.dateLabel}>Última actualización:</Text>  
              <Text style={styles.dateValue}>  
                {new Date(order.updated_at).toLocaleDateString('es-ES')}  
              </Text>  
            </View>  
          )}  
        </View>  
    
        {/* Notas adicionales */}  
        {order.notes && (  
          <View style={styles.section}>  
            <Text style={styles.sectionTitle}>Notas Adicionales</Text>  
            <Text style={styles.description}>{order.notes}</Text>  
          </View>  
        )}  
    
        {/* Acciones */}  
        {userRole !== 'client' && (  
          <View style={styles.section}>  
            <Text style={styles.sectionTitle}>Acciones</Text>  
              
            <TouchableOpacity style={styles.actionButton} onPress={handleEditOrder}>  
              <Feather name="edit" size={20} color="#1a73e8" />  
              <Text style={styles.actionButtonText}>Editar Orden</Text>  
            </TouchableOpacity>  
              
            <TouchableOpacity style={styles.actionButton} onPress={handleViewParts}>  
              <Feather name="package" size={20} color="#1a73e8" />  
              <Text style={styles.actionButtonText}>Gestionar Repuestos</Text>  
            </TouchableOpacity>  
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
      backgroundColor: "#fff",  
      padding: 20,  
      borderBottomWidth: 1,  
      borderBottomColor: "#e1e4e8",  
    },  
    orderTitleContainer: {  
      flexDirection: "row",  
      justifyContent: "space-between",  
      alignItems: "center",  
      marginBottom: 8,  
    },  
    orderNumber: {  
      fontSize: 24,  
      fontWeight: "bold",  
      color: "#333",  
    },  
    statusBadge: {  
      paddingHorizontal: 12,  
      paddingVertical: 6,  
      borderRadius: 16,  
    },  
    statusText: {  
      fontSize: 12,  
      color: "#fff",  
      fontWeight: "bold",  
    },  
    orderDate: {  
      fontSize: 14,  
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
      fontSize: 18,  
      fontWeight: "bold",  
      color: "#333",  
      marginBottom: 12,  
    },  
    infoRow: {  
      flexDirection: "row",  
      alignItems: "center",  
      marginBottom: 8,  
    },  
    infoText: {  
      fontSize: 16,  
      color: "#333",  
      marginLeft: 8,  
      flex: 1,  
    },  
    vehicleContainer: {  
      flexDirection: "row",  
      alignItems: "center",  
      justifyContent: "space-between",  
    },  
    description: {  
      fontSize: 16,  
      color: "#333",  
      lineHeight: 24,  
    },  
    priceRow: {  
      flexDirection: "row",  
      justifyContent: "space-between",  
      alignItems: "center",  
      paddingVertical: 8,  
      borderBottomWidth: 1,  
      borderBottomColor: "#f0f0f0",  
    },  
    priceLabel: {  
      fontSize: 16,  
      color: "#666",  
    },  
    priceValue: {  
      fontSize: 16,  
      fontWeight: "500",  
      color: "#333",  
    },  
    totalRow: {  
      borderBottomWidth: 0,  
      borderTopWidth: 2,  
      borderTopColor: "#e1e4e8",  
      paddingTop: 12,  
      marginTop: 8,  
    },  
    totalLabel: {  
      fontSize: 18,  
      fontWeight: "bold",  
      color: "#333",  
    },  
    totalValue: {  
      fontSize: 20,  
      fontWeight: "bold",  
      color: "#1a73e8",  
    },  
    dateRow: {  
      flexDirection: "row",  
      justifyContent: "space-between",  
      alignItems: "center",  
      paddingVertical: 6,  
    },  
    dateLabel: {  
      fontSize: 14,  
      color: "#666",  
      flex: 1,  
    },  
    dateValue: {  
      fontSize: 14,  
      fontWeight: "500",  
      color: "#333",  
    },  
    actionButton: {  
      flexDirection: "row",  
      alignItems: "center",  
      paddingVertical: 12,  
      paddingHorizontal: 16,  
      backgroundColor: "#f8f9fa",  
      borderRadius: 8,  
      marginBottom: 8,  
      borderWidth: 1,  
      borderColor: "#e1e4e8",  
    },  
    actionButtonText: {  
      fontSize: 16,  
      color: "#1a73e8",  
      fontWeight: "500",  
      marginLeft: 8,  
    },  
  })