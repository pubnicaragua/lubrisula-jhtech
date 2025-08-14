"use client"  
  
import { useState, useCallback } from "react"  
import {  
  View,  
  Text,  
  StyleSheet,  
  FlatList,  
  TouchableOpacity,  
  TextInput,  
  ActivityIndicator,  
  Alert,  
  Modal,  
  ScrollView,  
} from "react-native"  
import { Feather, MaterialIcons } from "@expo/vector-icons"  
import { useFocusEffect } from "@react-navigation/native"  
import { StackNavigationProp } from '@react-navigation/stack'  
import { RouteProp } from '@react-navigation/native'  
import { useAuth } from "../context/auth-context"  
import { getAllServices } from "../services/supabase/services-service"  
import ACCESOS_SERVICES from "../services/supabase/access-service"  
import USER_SERVICE from "../services/supabase/user-service"  
import { RootStackParamList } from '../types/navigation'  
import { ServicioType } from '../types/services'  
  
// ✅ CORREGIDO: Tipado estricto de navegación con parámetros correctos  
type ServiceSelectionNavigationProp = StackNavigationProp<RootStackParamList, 'ServiceSelection'>  
type ServiceSelectionRouteProp = RouteProp<RootStackParamList, 'ServiceSelection'>  
  
// ✅ CORREGIDO: Definir los parámetros correctos para ServiceSelection  
interface ServiceSelectionParams {  
  orderId: string  
  onServiceSelect?: (service: ServicioType | ServicioType[]) => void  
  selectedService?: ServicioType | null  
  multiSelect?: boolean  
}  
  
interface Props {  
  navigation: ServiceSelectionNavigationProp  
  route: ServiceSelectionRouteProp  
}  
  
export default function ServiceSelectionScreen({ navigation, route }: Props) {  
  // ✅ CORREGIDO: Extraer parámetros con valores por defecto seguros  
  const params = route.params as ServiceSelectionParams  
  const {   
    orderId,  
    onServiceSelect = () => {},  
    selectedService = null,   
    multiSelect = false   
  } = params || { orderId: '' }  
  
  const { user } = useAuth()  
  const [services, setServices] = useState<ServicioType[]>([])  
  const [filteredServices, setFilteredServices] = useState<ServicioType[]>([])  
  const [loading, setLoading] = useState(true)  
  const [searchTerm, setSearchTerm] = useState("")  
  const [selectedServices, setSelectedServices] = useState<ServicioType[]>(  
    selectedService ? [selectedService] : []  
  )  
  const [serviceDetailModalVisible, setServiceDetailModalVisible] = useState(false)  
  const [selectedServiceDetail, setSelectedServiceDetail] = useState<ServicioType | null>(null)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
  
  // Cargar servicios cuando la pantalla obtiene el foco  
  useFocusEffect(  
    useCallback(() => {  
      loadServices()  
    }, [])  
  )  
  
  const loadServices = async () => {  
    try {  
      setLoading(true)  
      setError(null)  
  
      if (!user?.id) return  
  
      // Validar permisos del usuario  
      const userTallerId = await USER_SERVICE.GET_TALLER_ID(user.id)  
      if (!userTallerId) {  
        setError("No se pudo obtener la información del taller")  
        return  
      }  
  
      const userPermissions = await ACCESOS_SERVICES.GET_PERMISOS_USUARIO(user.id, userTallerId)  
      // ✅ CORREGIDO: Usar 'role' en lugar de 'rol'  
      setUserRole(userPermissions?.role || 'client')  
  
      // Cargar servicios desde Supabase  
      const allServices = await getAllServices()  
      // ✅ CORREGIDO: Mapear servicios para asegurar compatibilidad de tipos  
      const mappedServices: ServicioType[] = allServices.map(service => ({  
        id: service.id,  
        nombre: service.nombre || service.name || '',  
        descripcion: service.descripcion || service.description,  
        precio: service.precio || service.price || 0,  
        duracion_estimada: service.duracion_estimada || service.estimated_duration,  
        categoria: service.categoria || service.category,  
        activo: service.activo !== undefined ? service.activo : true,  
        created_at: service.created_at || new Date().toISOString(),  
        updated_at: service.updated_at  
      }))  
  
      setServices(mappedServices)  
      setFilteredServices(mappedServices)  
    } catch (error) {  
      console.error("Error al cargar servicios:", error)  
      setError("No se pudieron cargar los servicios")  
      Alert.alert("Error", "No se pudieron cargar los servicios")  
    } finally {  
      setLoading(false)  
    }  
  }  
  
  // Filtrar servicios basado en búsqueda  
  const filterServices = useCallback(() => {  
    let filtered = services  
  
    // Filtrar por término de búsqueda  
    if (searchTerm.trim()) {  
      filtered = filtered.filter(service =>  
        service.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||  
        service.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())  
      )  
    }  
  
    setFilteredServices(filtered)  
  }, [services, searchTerm])  
  
  // Ejecutar filtrado cuando cambien los criterios  
  useFocusEffect(  
    useCallback(() => {  
      filterServices()  
    }, [filterServices])  
  )  
  
  const handleSearch = (text: string) => {  
    setSearchTerm(text)  
  }  
  
  const handleServicePress = (service: ServicioType) => {  
    if (multiSelect) {  
      // Si es selección múltiple, mostrar detalles  
      setSelectedServiceDetail(service)  
      setServiceDetailModalVisible(true)  
    } else {  
      // Si es selección única, seleccionar directamente  
      onServiceSelect && onServiceSelect(service)  
      navigation.goBack()  
    }  
  }  
  
  const toggleServiceSelection = (service: ServicioType) => {  
    const isSelected = selectedServices.some((selectedService) => selectedService.id === service.id)  
      
    if (isSelected) {  
      // Deseleccionar  
      setSelectedServices(selectedServices.filter((selectedService) => selectedService.id !== service.id))  
    } else {  
      // Seleccionar  
      if (multiSelect) {  
        setSelectedServices([...selectedServices, service])  
      } else {  
        setSelectedServices([service])  
      }  
    }  
  }  
  
  const handleConfirmSelection = () => {  
    if (selectedServices.length === 0) {  
      Alert.alert("Error", "Debes seleccionar al menos un servicio")  
      return  
    }  
  
    onServiceSelect && onServiceSelect(multiSelect ? selectedServices : selectedServices[0])  
    navigation.goBack()  
  }  
  
  const formatCurrency = (amount: number) => {  
    return amount.toLocaleString("es-ES", {  
      style: "currency",  
      currency: "USD",  
      minimumFractionDigits: 2,  
    })  
  }  
  
  const getDurationText = (duration: number) => {  
    if (duration < 60) {  
      return `${duration} min`  
    } else {  
      const hours = Math.floor(duration / 60)  
      const minutes = duration % 60  
      return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`  
    }  
  }  
  
  const renderServiceItem = ({ item }: { item: ServicioType }) => {  
    const isSelected = selectedServices.some((selectedService) => selectedService.id === item.id)  
    const formattedPrice = formatCurrency(item.precio || 0)  
  
    return (  
      <TouchableOpacity  
        style={[styles.serviceItem, isSelected && styles.selectedServiceItem]}  
        onPress={() => handleServicePress(item)}  
      >  
        <View style={styles.serviceContent}>  
          <View style={styles.serviceHeader}>  
            <Text style={styles.serviceName}>{item.nombre}</Text>  
            {multiSelect && (  
              <TouchableOpacity  
                style={[styles.checkboxContainer, isSelected && styles.checkboxSelected]}  
                onPress={() => toggleServiceSelection(item)}  
              >  
                {isSelected && <Feather name="check" size={16} color="#fff" />}  
              </TouchableOpacity>  
            )}  
          </View>  
  
          {item.descripcion && (  
            <Text style={styles.serviceDescription} numberOfLines={2}>  
              {item.descripcion}  
            </Text>  
          )}  
  
          <View style={styles.serviceFooter}>  
            <View style={styles.serviceDetails}>  
              <View style={styles.serviceDetail}>  
                <Feather name="clock" size={14} color="#666" />  
                <Text style={styles.serviceDetailText}>  
                  {item.duracion_estimada ? getDurationText(item.duracion_estimada) : "No especificado"}  
                </Text>  
              </View>  
              {item.categoria && (  
                <View style={styles.categoryBadge}>  
                  <Text style={styles.categoryText}>{item.categoria}</Text>  
                </View>  
              )}  
            </View>  
            <Text style={styles.servicePrice}>{formattedPrice}</Text>  
          </View>  
        </View>  
      </TouchableOpacity>  
    )  
  }  
  
  const renderServiceDetailModal = () => {  
    if (!selectedServiceDetail) return null  
  
    const isSelected = selectedServices.some((service) => service.id === selectedServiceDetail.id)  
    const formattedPrice = formatCurrency(selectedServiceDetail.precio || 0)  
  
    return (  
      <Modal  
        visible={serviceDetailModalVisible}  
        animationType="slide"  
        presentationStyle="pageSheet"  
      >  
        <View style={styles.modalContainer}>  
          <View style={styles.modalHeader}>  
            <Text style={styles.modalTitle}>Detalle del Servicio</Text>  
            <TouchableOpacity  
              style={styles.closeButton}  
              onPress={() => setServiceDetailModalVisible(false)}  
            >  
              <Feather name="x" size={24} color="#666" />  
            </TouchableOpacity>  
          </View>  
  
          <ScrollView style={styles.modalContent}>  
            <Text style={styles.modalServiceName}>{selectedServiceDetail.nombre}</Text>  
              
            {selectedServiceDetail.descripcion && (  
              <Text style={styles.modalServiceDescription}>{selectedServiceDetail.descripcion}</Text>  
            )}  
  
            <View style={styles.modalServiceDetails}>  
              <View style={styles.modalDetailRow}>  
                <Text style={styles.modalDetailLabel}>Categoría:</Text>  
                <Text style={styles.modalDetailValue}>{selectedServiceDetail.categoria || "Sin categoría"}</Text>  
              </View>  
  
              <View style={styles.modalDetailRow}>  
                <Text style={styles.modalDetailLabel}>Duración estimada:</Text>  
                <Text style={styles.modalDetailValue}>  
                  {selectedServiceDetail.duracion_estimada  
                    ? getDurationText(selectedServiceDetail.duracion_estimada)  
                    : "No especificada"  
                  }  
                </Text>  
              </View>  
  
              <View style={styles.modalDetailRow}>  
                <Text style={styles.modalDetailLabel}>Precio:</Text>  
                <Text style={styles.modalDetailValue}>{formattedPrice}</Text>  
              </View>  
            </View>  
          </ScrollView>  
  
          <View style={styles.modalFooter}>  
            <TouchableOpacity  
              style={[styles.button, styles.cancelButton]}  
              onPress={() => setServiceDetailModalVisible(false)}  
            >  
              <Text style={styles.buttonText}>Cancelar</Text>  
            </TouchableOpacity>  
  
            <TouchableOpacity  
              style={[styles.button, styles.addButton]}  
              onPress={() => {  
                toggleServiceSelection(selectedServiceDetail)  
                setServiceDetailModalVisible(false)  
              }}  
            >  
              <Text style={styles.buttonText}>{isSelected ? "Quitar" : "Agregar"}</Text>  
            </TouchableOpacity>  
          </View>  
        </View>  
      </Modal>  
    )  
  }  
  
  if (loading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#1a73e8" />  
        <Text style={styles.loadingText}>Cargando servicios...</Text>  
      </View>  
    )  
  }  
  
  if (error) {  
    return (  
      <View style={styles.errorContainer}>  
        <MaterialIcons name="error" size={64} color="#f44336" />  
        <Text style={styles.errorText}>{error}</Text>  
        <TouchableOpacity style={styles.retryButton} onPress={loadServices}>  
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
        <Text style={styles.headerTitle}>Seleccionar Servicios</Text>  
      </View>  
  
      <View style={styles.searchContainer}>  
        <Feather name="search" size={20} color="#666" style={styles.searchIcon} />  
        <TextInput  
          style={styles.searchInput}  
          placeholder="Buscar servicios por nombre o descripción..."  
          value={searchTerm}  
          onChangeText={handleSearch}  
        />  
        {searchTerm.length > 0 && (  
          <TouchableOpacity style={styles.clearButton} onPress={() => setSearchTerm("")}>  
            <Feather name="x" size={20} color="#666" />  
          </TouchableOpacity>  
        )}  
      </View>  
  
      <FlatList  
        data={filteredServices}  
        keyExtractor={(item) => item.id!}  
        renderItem={renderServiceItem}  
        contentContainerStyle={styles.listContainer}  
        showsVerticalScrollIndicator={false}  
        ListEmptyComponent={  
          <View style={styles.emptyContainer}>  
            <Feather name="tool" size={64} color="#ccc" />  
            <Text style={styles.emptyText}>  
              {searchTerm ? "No se encontraron servicios" : "No hay servicios disponibles"}  
            </Text>  
            {searchTerm && (  
              <Text style={styles.emptySubtext}>  
                Intenta con otros términos de búsqueda  
              </Text>  
            )}  
          </View>  
        }  
      />  
  
      {multiSelect && selectedServices.length > 0 && (  
        <View style={styles.selectionBar}>  
          <View style={styles.selectionInfo}>  
            <Text style={styles.selectionCount}>  
              {selectedServices.length} servicio{selectedServices.length !== 1 ? "s" : ""} seleccionado{selectedServices.length !== 1 ? "s" : ""}  
            </Text>  
          </View>  
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmSelection}>  
            <Text style={styles.confirmButtonText}>Confirmar</Text>  
          </TouchableOpacity>  
        </View>  
      )}  
  
      {renderServiceDetailModal()}  
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
        paddingHorizontal: 16,  
        paddingVertical: 12,  
        backgroundColor: "#fff",  
        borderBottomWidth: 1,  
        borderBottomColor: "#e1e4e8",  
      },  
      backButton: {  
        padding: 8,  
        marginRight: 8,  
      },  
      headerTitle: {  
        fontSize: 18,  
        fontWeight: "bold",  
        color: "#333",  
      },  
      searchContainer: {  
        flexDirection: "row",  
        alignItems: "center",  
        backgroundColor: "#fff",  
        marginHorizontal: 16,  
        marginVertical: 8,  
        borderRadius: 8,  
        paddingHorizontal: 12,  
        borderWidth: 1,  
        borderColor: "#e1e4e8",  
      },  
      searchIcon: {  
        marginRight: 8,  
      },  
      searchInput: {  
        flex: 1,  
        paddingVertical: 12,  
        fontSize: 16,  
        color: "#333",  
      },  
      clearButton: {  
        padding: 4,  
      },  
      listContainer: {  
        padding: 16,  
      },  
      serviceItem: {  
        backgroundColor: "#fff",  
        borderRadius: 8,  
        padding: 16,  
        marginBottom: 12,  
        shadowColor: "#000",  
        shadowOffset: { width: 0, height: 1 },  
        shadowOpacity: 0.1,  
        shadowRadius: 2,  
        elevation: 2,  
      },  
      selectedServiceItem: {  
        borderColor: "#1a73e8",  
        borderWidth: 2,  
      },  
      serviceContent: {  
        flex: 1,  
      },  
      serviceHeader: {  
        flexDirection: "row",  
        justifyContent: "space-between",  
        alignItems: "center",  
        marginBottom: 8,  
      },  
      serviceName: {  
        fontSize: 16,  
        fontWeight: "bold",  
        color: "#333",  
        flex: 1,  
      },  
      checkboxContainer: {  
        width: 24,  
        height: 24,  
        borderRadius: 12,  
        borderWidth: 2,  
        borderColor: "#e1e4e8",  
        justifyContent: "center",  
        alignItems: "center",  
      },  
      checkboxSelected: {  
        backgroundColor: "#1a73e8",  
        borderColor: "#1a73e8",  
      },  
      serviceDescription: {  
        fontSize: 14,  
        color: "#666",  
        marginBottom: 12,  
        lineHeight: 20,  
      },  
      serviceFooter: {  
        flexDirection: "row",  
        justifyContent: "space-between",  
        alignItems: "center",  
      },  
      serviceDetails: {  
        flex: 1,  
      },  
      serviceDetail: {  
        flexDirection: "row",  
        alignItems: "center",  
        marginBottom: 4,  
      },  
      serviceDetailText: {  
        fontSize: 12,  
        color: "#666",  
        marginLeft: 4,  
      },  
      categoryBadge: {  
        backgroundColor: "#f0f0f0",  
        paddingHorizontal: 8,  
        paddingVertical: 4,  
        borderRadius: 12,  
        alignSelf: "flex-start",  
      },  
      categoryText: {  
        fontSize: 12,  
        color: "#666",  
      },  
      servicePrice: {  
        fontSize: 16,  
        fontWeight: "bold",  
        color: "#1a73e8",  
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
        textAlign: "center",  
      },  
      emptySubtext: {  
        fontSize: 14,  
        color: "#ccc",  
        marginTop: 8,  
        textAlign: "center",  
      },  
      selectionBar: {  
        position: "absolute",  
        bottom: 0,  
        left: 0,  
        right: 0,  
        backgroundColor: "#fff",  
        flexDirection: "row",  
        justifyContent: "space-between",  
        alignItems: "center",  
        padding: 16,  
        borderTopWidth: 1,  
        borderTopColor: "#e1e4e8",  
        shadowColor: "#000",  
        shadowOffset: { width: 0, height: -2 },  
        shadowOpacity: 0.1,  
        shadowRadius: 4,  
        elevation: 4,  
      },  
      selectionInfo: {  
        flex: 1,  
      },  
      selectionCount: {  
        fontSize: 14,  
        fontWeight: "500",  
        color: "#333",  
      },  
      confirmButton: {  
        backgroundColor: "#1a73e8",  
        paddingHorizontal: 20,  
        paddingVertical: 10,  
        borderRadius: 8,  
      },  
      confirmButtonText: {  
        color: "#fff",  
        fontWeight: "bold",  
      },  
      modalContainer: {  
        flex: 1,  
        backgroundColor: "#fff",  
      },  
      modalHeader: {  
        flexDirection: "row",  
        alignItems: "center",  
        justifyContent: "space-between",  
        paddingHorizontal: 16,  
        paddingVertical: 12,  
        borderBottomWidth: 1,  
        borderBottomColor: "#e1e4e8",  
      },  
      modalTitle: {  
        fontSize: 18,  
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
      modalServiceName: {  
        fontSize: 18,  
        fontWeight: "bold",  
        color: "#333",  
        marginBottom: 8,  
      },  
      modalServiceDescription: {  
        fontSize: 14,  
        color: "#666",  
        marginBottom: 16,  
        lineHeight: 20,  
      },  
      modalServiceDetails: {  
        backgroundColor: "#f8f9fa",  
        borderRadius: 8,  
        padding: 12,  
        marginBottom: 16,  
      },  
      modalDetailRow: {  
        flexDirection: "row",  
        justifyContent: "space-between",  
        marginBottom: 8,  
      },  
      modalDetailLabel: {  
        fontSize: 14,  
        color: "#666",  
        fontWeight: "500",  
      },  
      modalDetailValue: {  
        fontSize: 14,  
        color: "#333",  
        fontWeight: "500",  
      },  
      modalFooter: {  
        flexDirection: "row",  
        paddingHorizontal: 16,  
        paddingVertical: 12,  
        borderTopWidth: 1,  
        borderTopColor: "#e1e4e8",  
        gap: 12,  
      },  
      button: {  
        flex: 1,  
        paddingVertical: 12,  
        borderRadius: 8,  
        alignItems: "center",  
      },  
      cancelButton: {  
        backgroundColor: "#f5f5f5",  
      },  
      addButton: {  
        backgroundColor: "#1a73e8",  
      },  
      buttonText: {  
        fontSize: 16,  
        fontWeight: "bold",  
        color: "#333",  
      },  
    })