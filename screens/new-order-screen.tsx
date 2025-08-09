"use client"  
  
import { useState, useCallback, useEffect } from "react"  
import {  
  StyleSheet,  
  View,  
  Text,  
  TextInput,  
  TouchableOpacity,  
  ScrollView,  
  ActivityIndicator,  
  Alert,  
  Image,  
  Modal,  
  FlatList,  
  SafeAreaView,  
} from "react-native"  
import { Feather } from "@expo/vector-icons"  
import { Picker } from "@react-native-picker/picker"  
import * as ImagePicker from "expo-image-picker"  
import { useFocusEffect } from "@react-navigation/native"  
import { useAuth } from "../context/auth-context"  
import type { CurrencyCode } from "../types"  
import { formatCurrency } from "../utils/helpers"  
import { Share } from "react-native"  
import { generateQuotePDF } from "../utils/pdf-generator"  
  
// Importaciones corregidas para usar servicios de Supabase  
import * as orderService from "../services/supabase/order-service"  
import * as clientService from "../services/supabase/client-service"  
import * as vehicleService from "../services/supabase/vehicle-service"  
import * as inventoryService from "../services/supabase/inventory-service"  
import * as servicesService from "../services/supabase/services-service" // Corregido: services-service  
import * as userService from "../services/supabase/user-service"  
import * as accessService from "../services/supabase/access-service"  
import * as imageService from "../services/supabase/image-service"  
import * as currencyService from "../services/supabase/currency-service"  
import * as companyService from "../services/supabase/company-service"  
  
// Tipos TypeScript para resolver errores  
interface NewOrderScreenProps {  
  navigation: any  
  route: any  
}  
  
interface ClientType {  
  id: string  
  nombre: string  
  email?: string  
  telefono?: string  
}  
  
interface VehicleType {  
  id: string  
  marca: string  
  modelo: string  
  año: number  
  placa: string  
  client_id: string  
}  
  
interface InventoryItemType {  
  id: string  
  nombre: string  
  codigo: string  
  descripcion?: string  
  stock_actual: number  
  precio_venta?: number  
  categoria?: string  
}  
  
interface ServiceType {  
  id: string  
  nombre: string  
  descripcion?: string  
  precio: number  
  duracion?: number  
}  
  
interface CurrencyType {  
  code: CurrencyCode  
  name: string  
  symbol: string  
}  
  
interface CompanySettingsType {  
  id: string  
  nombre: string  
  direccion?: string  
  telefono?: string  
  email?: string  
  logo?: string  
  impuesto_porcentaje?: number  
}  
  
interface SelectedItemType {  
  id: string  
  type: 'part' | 'service'  
  name: string  
  code?: string  
  quantity: number  
  unitPrice: number  
  total: number  
  partNumber?: string  
}  
  
export default function NewOrderScreen({ navigation, route }: NewOrderScreenProps) {  
  const { user } = useAuth()  
  const [isLoading, setIsLoading] = useState(true)  
  const [isSaving, setIsSaving] = useState(false)  
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)  
  const [clients, setClients] = useState<ClientType[]>([])  
  const [vehicles, setVehicles] = useState<VehicleType[]>([])  
  const [currencies, setCurrencies] = useState<CurrencyType[]>([])  
  const [companySettings, setCompanySettings] = useState<CompanySettingsType | null>(null)  
  const [inventoryItems, setInventoryItems] = useState<InventoryItemType[]>([])  
  const [predefinedServices, setPredefinedServices] = useState<ServiceType[]>([])  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
  
  // Datos del formulario  
  const [selectedClient, setSelectedClient] = useState("")  
  const [selectedVehicle, setSelectedVehicle] = useState("")  
  const [description, setDescription] = useState("")  
  const [notes, setNotes] = useState("")  
  const [images, setImages] = useState<{ uri: string; type: string }[]>([])  
  const [currency, setCurrency] = useState<CurrencyCode>("USD")  
  const [selectedItems, setSelectedItems] = useState<SelectedItemType[]>([])  
  const [laborCost, setLaborCost] = useState("0")  
  
  // Modales  
  const [showItemModal, setShowItemModal] = useState(false)  
  const [showServiceModal, setShowServiceModal] = useState(false)  
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItemType | null>(null)  
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null)  
  const [itemQuantity, setItemQuantity] = useState("1")  
  const [searchQuery, setSearchQuery] = useState("")  
  const [filteredItems, setFilteredItems] = useState<InventoryItemType[]>([])  
  
  // Cargar datos iniciales  
  const loadInitialData = useCallback(async () => {  
    try {  
      setIsLoading(true)  
      setError(null)  
  
      if (!user?.id) return  
  
      // Validar permisos del usuario - métodos corregidos  
      const userTallerId = await userService.getUserTaller(user.id)  
      const userPermissions = await accessService.checkUserPermissions(user.id, userTallerId)  
      setUserRole(userPermissions?.rol || 'client')  
  
      if (userPermissions?.rol === 'client') {  
        setError("No tienes permisos para crear órdenes")  
        return  
      }  
  
      // Cargar datos necesarios - métodos corregidos  
      const [  
        allClients,  
        allCurrencies,  
        companyData,  
        allInventory,  
        allServices  
      ] = await Promise.all([  
        clientService.getClients(), // Corregido: getClients en lugar de getAllClients  
        currencyService.getAllCurrencies(),  
        companyService.getCompanySettings(),  
        inventoryService.getInventoryItems(), // Corregido: getInventoryItems en lugar de getAllInventory  
        servicesService.getAllServices()  
      ])  
  
      setClients(allClients)  
      setCurrencies(allCurrencies)  
      setCompanySettings(companyData)  
        
      // Filtrar items con stock disponible  
      const availableItems = allInventory.filter((item: InventoryItemType) => item.stock_actual > 0)  
      setInventoryItems(availableItems)  
      setFilteredItems(availableItems)  
        
      setPredefinedServices(allServices)  
  
    } catch (error) {  
      console.error("Error loading initial data:", error)  
      setError("No se pudieron cargar los datos iniciales")  
    } finally {  
      setIsLoading(false)  
    }  
  }, [user])  
  
  useFocusEffect(  
    useCallback(() => {  
      loadInitialData()  
    }, [loadInitialData])  
  )  
  
  // Cargar vehículos para el cliente seleccionado  
  const loadVehiclesForClient = async (clientId: string) => {  
    try {  
      // Método corregido  
      const clientVehicles = await vehicleService.getClientVehicles(clientId)  
      setVehicles(clientVehicles)  
      setSelectedVehicle("") // Reset vehicle selection  
    } catch (error) {  
      console.error("Error loading vehicles:", error)  
      Alert.alert("Error", "No se pudieron cargar los vehículos del cliente")  
    }  
  }  
  
  // Manejar cambio de cliente  
  const handleClientChange = (clientId: string) => {  
    setSelectedClient(clientId)  
    if (clientId) {  
      loadVehiclesForClient(clientId)  
    } else {  
      setVehicles([])  
      setSelectedVehicle("")  
    }  
  }  
  
  // Seleccionar imagen de la galería  
  const pickImage = async () => {  
    try {  
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()  
  
      if (!permissionResult.granted) {  
        Alert.alert("Permiso denegado", "Necesitamos permiso para acceder a tu galería de fotos")  
        return  
      }  
  
      const result = await ImagePicker.launchImageLibraryAsync({  
        mediaTypes: ImagePicker.MediaTypeOptions.Images,  
        allowsEditing: true,  
        aspect: [4, 3],  
        quality: 0.8,  
      })  
  
      if (!result.canceled && result.assets && result.assets.length > 0) {  
        setImages([...images, { uri: result.assets[0].uri, type: "vehicle" }])  
      }  
    } catch (error) {  
      console.error("Error al seleccionar imagen:", error)  
      Alert.alert("Error", "No se pudo seleccionar la imagen")  
    }  
  }  
  
  // Tomar foto con la cámara  
  const takePhoto = async () => {  
    try {  
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync()  
  
      if (!permissionResult.granted) {  
        Alert.alert("Permiso denegado", "Necesitamos permiso para acceder a la cámara")  
        return  
      }  
  
      const result = await ImagePicker.launchCameraAsync({  
        allowsEditing: true,  
        aspect: [4, 3],  
        quality: 0.8,  
      })  
  
      if (!result.canceled && result.assets && result.assets.length > 0) {  
        setImages([...images, { uri: result.assets[0].uri, type: "vehicle" }])  
      }  
    } catch (error) {  
      console.error("Error al tomar foto:", error)  
      Alert.alert("Error", "No se pudo tomar la foto")  
    }  
  }  
  
  // Remover imagen  
  const removeImage = (index: number) => {  
    const newImages = images.filter((_, i) => i !== index)  
    setImages(newImages)  
  }  
  
  // Filtrar items de inventario  
  const filterInventoryItems = (query: string) => {  
    setSearchQuery(query)  
    if (!query.trim()) {  
      setFilteredItems(inventoryItems)  
    } else {  
      const filtered = inventoryItems.filter((item: InventoryItemType) =>  
        item.nombre.toLowerCase().includes(query.toLowerCase()) ||  
        item.codigo.toLowerCase().includes(query.toLowerCase()) ||  
        (item.descripcion && item.descripcion.toLowerCase().includes(query.toLowerCase()))  
      )  
      setFilteredItems(filtered)  
    }  
  }  
  
  // Agregar item de inventario  
  const addInventoryItem = () => {  
    if (!selectedInventoryItem) return  
  
    const quantity = parseInt(itemQuantity) || 1  
    const unitPrice = selectedInventoryItem.precio_venta || 0  
  
    const newItem: SelectedItemType = {  
      id: `${selectedInventoryItem.id}-${Date.now()}`,  
      type: 'part',  
      name: selectedInventoryItem.nombre,  
      code: selectedInventoryItem.codigo,  
      quantity,  
      unitPrice,  
      total: quantity * unitPrice,  
      partNumber: selectedInventoryItem.codigo,  
    }  
  
    setSelectedItems([...selectedItems, newItem])  
    setShowItemModal(false)  
    setSelectedInventoryItem(null)  
    setItemQuantity("1")  
    setSearchQuery("")  
  }  
  
  // Agregar servicio predefinido  
  const addPredefinedService = () => {  
    if (!selectedService) return  
  
    const newItem: SelectedItemType = {  
      id: `${selectedService.id}-${Date.now()}`,  
      type: 'service',  
      name: selectedService.nombre,  
      quantity: 1,  
      unitPrice: selectedService.precio,  
      total: selectedService.precio,  
    }  
  
    setSelectedItems([...selectedItems, newItem])  
    setShowServiceModal(false)  
    setSelectedService(null)  
  }  
  
  // Actualizar cantidad de item  
  const updateItemQuantity = (itemId: string, newQuantity: number) => {  
    if (newQuantity < 1) return  
  
    setSelectedItems(selectedItems.map(item => {  
      if (item.id === itemId) {  
        return {  
          ...item,  
          quantity: newQuantity,  
          total: newQuantity * item.unitPrice  
        }  
      }  
      return item  
    }))  
  }  
  
  // Remover item  
  const removeItem = (itemId: string) => {  
    setSelectedItems(selectedItems.filter(item => item.id !== itemId))  
  }  
  
  // Calcular totales  
  const calculateTotals = () => {  
    const totalParts = selectedItems.reduce((sum, item) => sum + item.total, 0)  
    const laborCostNum = parseFloat(laborCost) || 0  
    const subtotal = totalParts + laborCostNum  
    const taxRate = companySettings?.impuesto_porcentaje || 0  
    const tax = subtotal * (taxRate / 100)  
    const total = subtotal + tax  
  
    return {  
      totalParts,  
      laborCost: laborCostNum,  
      subtotal,  
      tax,  
      total  
    }  
  }  
  
  // Validar formulario  
  const validateForm = () => {  
    if (!selectedClient) {  
      Alert.alert("Error", "Debe seleccionar un cliente")  
      return false  
    }  
  
    if (!selectedVehicle) {  
      Alert.alert("Error", "Debe seleccionar un vehículo")  
      return false  
    }  
  
    if (!description.trim()) {  
      Alert.alert("Error", "Debe ingresar una descripción del problema")  
      return false  
    }  
  
    return true  
  }  
  
  // Guardar orden  
  const saveOrder = async () => {  
    if (!validateForm()) return  
  
    try {  
      setIsSaving(true)  
  
      const totals = calculateTotals()  
  
      // Crear la orden - método corregido  
      const newOrder = await orderService.create({  
        client_id: selectedClient,  
        vehiculo_id: selectedVehicle,  
        tecnico_id: user?.id,  
        estado: "Pendiente",  
        descripcion: description,  
        observacion: notes,  
        items: selectedItems,  
        costo_mano_obra: totals.laborCost,  
        total_repuestos: totals.totalParts,  
        impuesto: totals.tax,  
        total: totals.total,  
        moneda: currency,  
        estado_pago: "pendiente",  
      })  
  
      // Actualizar inventario  
      for (const item of selectedItems) {  
        if (item.type === 'part' && item.partNumber) {  
          const inventoryItem = inventoryItems.find((invItem: InventoryItemType) => invItem.codigo === item.partNumber)  
          if (inventoryItem) {  
            // Método corregido  
            await inventoryService.updateItem(inventoryItem.id, {  
              stock_actual: inventoryItem.stock_actual - item.quantity,  
            })  
          }  
        }  
      }  
  
        // Guardar imágenes  
        for (const image of images) {  
          // Método corregido  
          const savedImage = await imageService.saveImage(  
            image.uri,  
            "vehicle",  
            newOrder.id,  
            "Imagen inicial del vehículo",  
          )  
  
          // Añadir imagen a la orden  
          await orderService.addOrderImage(newOrder.id, savedImage)  
        }  
  
        // Añadir comentario inicial  
        await orderService.addOrderComment(newOrder.id, {  
          userId: user?.id || "",  
          userName: user?.name || "Técnico",  
          text: `Vehículo recibido. Descripción del problema: ${description}`,  
          type: "technician",  
        })  
  
        Alert.alert("Éxito", "Orden creada correctamente", [  
          {  
            text: "OK",  
            onPress: () => navigation.navigate("OrderDetail", { orderId: newOrder.id }),  
          },  
        ])  
      } catch (error) {  
        console.error("Error al guardar orden:", error)  
        Alert.alert("Error", "No se pudo guardar la orden")  
      } finally {  
        setIsSaving(false)  
      }  
    }  
  
    // Generar cotización en PDF  
    const generateQuote = async () => {  
      if (!validateForm()) return  
  
      try {  
        setIsGeneratingPDF(true)  
  
        const totals = calculateTotals()  
  
        // Obtener datos del cliente y vehículo  
        const client = await clientService.getClientById(selectedClient)  
        const vehicle = await vehicleService.getVehicleById(selectedVehicle)  
  
        // Crear objeto de orden temporal para la cotización  
        const tempOrder = {  
          id: "temp_" + Date.now(),  
          number: "COT-" + Math.floor(Math.random() * 10000),  
          clientId: selectedClient,  
          vehicleId: selectedVehicle,  
          technicianId: user?.id,  
          status: "quote",  
          description,  
          notes,  
          items: selectedItems,  
          laborCost: totals.laborCost,  
          totalParts: totals.totalParts,  
          tax: totals.tax,  
          total: totals.total,  
          currency,  
          paymentStatus: "pending",  
          dates: {  
            created: new Date().toISOString(),  
            updated: new Date().toISOString(),  
          },  
        }  
  
        // Generar PDF  
        const pdfPath = await generateQuotePDF(tempOrder, client, vehicle)  
  
        // Compartir PDF  
        await Share.share({  
          url: pdfPath,  
          title: `Cotización ${tempOrder.number}`,  
          message: `Cotización ${tempOrder.number} para ${client.name}`,  
        })  
      } catch (error) {  
        console.error("Error al generar cotización:", error)  
        Alert.alert("Error", "No se pudo generar la cotización")  
      } finally {  
        setIsGeneratingPDF(false)  
      }  
    }  
  
    // Renderizar modal de selección de items  
    const renderItemModal = () => (  
      <Modal  
        visible={showItemModal}  
        animationType="slide"  
        transparent={true}  
        onRequestClose={() => setShowItemModal(false)}  
      >  
        <View style={styles.modalOverlay}>  
          <View style={styles.modalContainer}>  
            <View style={styles.modalHeader}>  
              <Text style={styles.modalTitle}>Seleccionar Repuesto</Text>  
              <TouchableOpacity onPress={() => setShowItemModal(false)}>  
                <Feather name="x" size={24} color="#333" />  
              </TouchableOpacity>  
            </View>  
  
            <View style={styles.searchContainer}>  
              <Feather name="search" size={20} color="#666" />  
              <TextInput  
                style={styles.searchInput}  
                placeholder="Buscar por nombre, código o categoría..."  
                value={searchQuery}  
                onChangeText={filterInventoryItems}  
              />  
            </View>  
  
            <FlatList  
              data={filteredItems}  
              keyExtractor={(item) => item.id}  
              renderItem={({ item }) => (  
                <TouchableOpacity  
                  style={[  
                    styles.inventoryItem,  
                    selectedInventoryItem?.id === item.id && styles.selectedInventoryItem  
                  ]}  
                  onPress={() => setSelectedInventoryItem(item)}  
                >  
                  <View style={styles.itemInfo}>  
                    <Text style={styles.inventoryItemName}>{item.nombre}</Text>  
                    <Text style={styles.inventoryItemCode}>Código: {item.codigo}</Text>  
                    <View style={styles.inventoryItemDetails}>  
                      <Text style={styles.inventoryItemCategory}>{item.categoria}</Text>  
                      <Text style={styles.inventoryItemStock}>  
                        Stock: <Text style={item.stock_actual <= 5 ? styles.lowStock : null}>  
                          {item.stock_actual}  
                        </Text>  
                      </Text>  
                    </View>  
                  </View>  
                  <Text style={styles.inventoryItemPrice}>  
                    {formatCurrency(item.precio_venta || 0, currency)}  
                  </Text>  
                </TouchableOpacity>  
              )}  
              ListEmptyComponent={  
                <View style={styles.emptyList}>  
                  <Text style={styles.emptyListText}>No se encontraron repuestos</Text>  
                </View>  
              }  
            />  
  
            {selectedInventoryItem && (  
              <View style={styles.quantityContainer}>  
                <Text style={styles.quantityLabel}>Cantidad:</Text>  
                <TextInput  
                  style={styles.quantityInput}  
                  keyboardType="numeric"  
                  value={itemQuantity}  
                  onChangeText={setItemQuantity}  
                />  
              </View>  
            )}  
  
            <View style={styles.modalActions}>  
              <TouchableOpacity   
                style={styles.cancelButton}   
                onPress={() => setShowItemModal(false)}  
              >  
                <Text style={styles.cancelButtonText}>Cancelar</Text>  
              </TouchableOpacity>  
  
              <TouchableOpacity  
                style={[styles.addButton, !selectedInventoryItem && styles.disabledButton]}  
                onPress={addInventoryItem}  
                disabled={!selectedInventoryItem}  
              >  
                <Text style={styles.addButtonText}>Añadir</Text>  
              </TouchableOpacity>  
            </View>  
          </View>  
        </View>  
      </Modal>  
    )  
  
    // Renderizar modal de selección de servicios  
    const renderServiceModal = () => (  
      <Modal  
        visible={showServiceModal}  
        animationType="slide"  
        transparent={true}  
        onRequestClose={() => setShowServiceModal(false)}  
      >  
        <View style={styles.modalOverlay}>  
          <View style={styles.modalContainer}>  
            <View style={styles.modalHeader}>  
              <Text style={styles.modalTitle}>Seleccionar Servicio</Text>  
              <TouchableOpacity onPress={() => setShowServiceModal(false)}>  
                <Feather name="x" size={24} color="#333" />  
              </TouchableOpacity>  
            </View>  
  
            <FlatList  
              data={predefinedServices}  
              keyExtractor={(item) => item.id}  
              renderItem={({ item }) => (  
                <TouchableOpacity  
                  style={[  
                    styles.serviceItem,  
                    selectedService?.id === item.id && styles.selectedServiceItem  
                  ]}  
                  onPress={() => setSelectedService(item)}  
                >  
                  <View style={styles.serviceInfo}>  
                    <Text style={styles.serviceName}>{item.nombre}</Text>  
                    <Text style={styles.serviceDescription}>{item.descripcion}</Text>  
                    {item.duracion && (  
                      <Text style={styles.serviceDuration}>  
                        Duración: {item.duracion} min  
                      </Text>  
                    )}  
                  </View>  
                  <Text style={styles.servicePrice}>  
                    {formatCurrency(item.precio, currency)}  
                  </Text>  
                </TouchableOpacity>  
              )}  
              ListEmptyComponent={  
                <View style={styles.emptyList}>  
                  <Text style={styles.emptyListText}>No hay servicios disponibles</Text>  
                </View>  
              }  
            />  
  
            <View style={styles.modalActions}>  
              <TouchableOpacity   
                style={styles.cancelButton}   
                onPress={() => setShowServiceModal(false)}  
              >  
                <Text style={styles.cancelButtonText}>Cancelar</Text>  
              </TouchableOpacity>  
  
              <TouchableOpacity  
                style={[styles.addButton, !selectedService && styles.disabledButton]}  
                onPress={addPredefinedService}  
                disabled={!selectedService}  
              >  
                <Text style={styles.addButtonText}>Añadir</Text>  
              </TouchableOpacity>  
            </View>  
          </View>  
        </View>  
      </Modal>  
    )  
  
    const totals = calculateTotals()  
  
    if (isLoading) {  
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
          <Feather name="alert-circle" size={64} color="#f44336" />  
          <Text style={styles.errorText}>{error}</Text>  
          <TouchableOpacity style={styles.retryButton} onPress={loadInitialData}>  
            <Text style={styles.retryButtonText}>Reintentar</Text>  
          </TouchableOpacity>  
        </View>  
      )  
    }  
  
    return (  
      <SafeAreaView style={styles.container}>  
        <View style={styles.header}>  
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>  
            <Feather name="arrow-left" size={24} color="#333" />  
          </TouchableOpacity>  
          <Text style={styles.headerTitle}>Nueva Orden</Text>  
        </View>  
  
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>  
          {/* Selección de cliente */}  
          <View style={styles.formGroup}>  
            <Text style={styles.label}>Cliente *</Text>  
            <View style={styles.pickerContainer}>  
              <Picker  
                selectedValue={selectedClient}  
                onValueChange={handleClientChange}  
                style={styles.picker}  
              >  
                <Picker.Item label="Seleccionar cliente..." value="" />  
                {clients.map((client) => (  
                  <Picker.Item   
                    key={client.id}   
                    label={client.nombre}   
                    value={client.id}   
                  />  
                ))}  
              </Picker>  
            </View>  
          </View>  
  
          {/* Selección de vehículo */}  
          <View style={styles.formGroup}>  
            <Text style={styles.label}>Vehículo *</Text>  
            <View style={styles.pickerContainer}>  
              <Picker  
                selectedValue={selectedVehicle}  
                onValueChange={setSelectedVehicle}  
                style={styles.picker}  
                enabled={vehicles.length > 0}  
              >  
                <Picker.Item label="Seleccionar vehículo..." value="" />  
                {vehicles.map((vehicle) => (  
                  <Picker.Item   
                    key={vehicle.id}   
                    label={`${vehicle.marca} ${vehicle.modelo} (${vehicle.placa})`}   
                    value={vehicle.id}   
                  />  
                ))}  
              </Picker>  
            </View>  
          </View>  
  
          {/* Descripción del problema */}  
          <View style={styles.formGroup}>  
            <Text style={styles.label}>Descripción del problema *</Text>  
            <TextInput  
              style={styles.textArea}  
              multiline  
              numberOfLines={4}  
              placeholder="Describe el problema o servicio requerido..."  
              value={description}  
              onChangeText={setDescription}  
              textAlignVertical="top"  
            />  
          </View>  
  
          {/* Items y servicios */}  
          <View style={styles.formGroup}>  
            <View style={styles.sectionHeader}>  
              <Text style={styles.label}>Repuestos y Servicios</Text>  
              <View style={styles.addButtonsContainer}>  
                <TouchableOpacity   
                  style={styles.addButton}   
                  onPress={() => setShowItemModal(true)}  
                >  
                  <Feather name="package" size={16} color="#fff" />  
                  <Text style={styles.addButtonText}>Repuesto</Text>  
                </TouchableOpacity>  
                  
                <TouchableOpacity   
                  style={styles.addButton}   
                  onPress={() => setShowServiceModal(true)}  
                >  
                  <Feather name="tool" size={16} color="#fff" />  
                  <Text style={styles.addButtonText}>Servicio</Text>  
                </TouchableOpacity>  
              </View>  
            </View>  
  
            {selectedItems.length > 0 ? (  
              selectedItems.map((item) => (  
                <View key={item.id} style={styles.itemCard}>  
                  <View style={styles.itemHeader}>  
                    <Text style={styles.itemName}>{item.name}</Text>  
                    <TouchableOpacity  
                      style={styles.removeButton}  
                      onPress={() => removeItem(item.id)}  
                    >  
                      <Feather name="trash-2" size={20} color="#e53935" />  
                    </TouchableOpacity>  
                  </View>  
                    
                  {item.code && (  
                    <Text style={styles.itemCode}>Código: {item.code}</Text>  
                  )}  
                    
                  <View style={styles.itemDetails}>  
                    <View style={styles.quantityContainer}>  
                      <Text style={styles.quantityLabel}>Cantidad:</Text>  
                      <View style={styles.quantityControls}>  
                        <TouchableOpacity  
                          style={styles.quantityButton}  
                          onPress={() => updateItemQuantity(item.id, item.quantity - 1)}  
                        >  
                          <Feather name="minus" size={16} color="#666" />  
                        </TouchableOpacity>  
                          
                        <Text style={styles.quantityText}>{item.quantity}</Text>  
                          
                        <TouchableOpacity  
                          style={styles.quantityButton}  
                          onPress={() => updateItemQuantity(item.id, item.quantity + 1)}  
                        >  
                          <Feather name="plus" size={16} color="#666" />  
                        </TouchableOpacity>  
                      </View>  
                    </View>  
                      
                    <Text style={styles.itemTotal}>  
                      {formatCurrency(item.total, currency)}  
                    </Text>  
                  </View>  
                </View>  
              ))  
            ) : (  
              <View style={styles.emptyItems}>  
                <Text style={styles.emptyItemsText}>  
                  No hay repuestos o servicios agregados  
                </Text>  
              </View>  
            )}  
  
            {/* Costo de mano de obra */}  
            <View style={styles.laborCostContainer}>  
              <Text style={styles.laborCostLabel}>Costo de mano de obra</Text>  
              <TextInput  
                style={styles.laborCostInput}  
                placeholder="0.00"  
                value={laborCost}  
                onChangeText={setLaborCost}  
                keyboardType="numeric"  
              />  
            </View>  
          </View>  
  
          {/* Observaciones */}  
          <View style={styles.formGroup}>  
            <Text style={styles.label}>Observaciones</Text>  
            <TextInput  
              style={styles.textArea}  
              multiline  
              numberOfLines={3}  
              placeholder="Observaciones adicionales..."  
              value={notes}  
              onChangeText={setNotes}  
              textAlignVertical="top"  
            />  
          </View>  
  
          {/* Imágenes */}  
          <View style={styles.formGroup}>  
            <Text style={styles.label}>Imágenes del vehículo</Text>  
            <View style={styles.imageActions}>  
              <TouchableOpacity style={styles.imageActionButton} onPress={pickImage}>  
                <Feather name="image" size={20} color="#1a73e8" />  
                <Text style={styles.imageActionText}>Galería</Text>  
              </TouchableOpacity>  
                
              <TouchableOpacity style={styles.imageActionButton} onPress={takePhoto}>  
                <Feather name="camera" size={20} color="#1a73e8" />  
                <Text style={styles.imageActionText}>Cámara</Text>  
              </TouchableOpacity>  
            </View>  
  
            {images.length > 0 && (  
              <ScrollView horizontal style={styles.imagesList}>  
                {images.map((image, index) => (  
                  <View key={index} style={styles.imageContainer}>  
                    <Image source={{ uri: image.uri }} style={styles.imagePreview} />  
                    <TouchableOpacity  
                      style={styles.removeImageButton}  
                      onPress={() => removeImage(index)}  
                    >  
                      <Feather name="x" size={16} color="#fff" />  
                    </TouchableOpacity>  
                  </View>  
                ))}  
              </ScrollView>  
            )}  
          </View>  
  
          {/* Resumen de totales */}  
          <View style={styles.totalsContainer}>  
            <Text style={styles.totalsTitle}>Resumen</Text>  
              
            <View style={styles.totalRow}>  
              <Text style={styles.totalLabel}>Repuestos:</Text>  
              <Text style={styles.totalValue}>{formatCurrency(totals.totalParts, currency)}</Text>  
            </View>  
              
            <View style={styles.totalRow}>  
              <Text style={styles.totalLabel}>Mano de obra:</Text>  
              <Text style={styles.totalValue}>{formatCurrency(totals.laborCost, currency)}</Text>  
            </View>  
              
            <View style={styles.totalRow}>  
              <Text style={styles.totalLabel}>Subtotal:</Text>  
              <Text style={styles.totalValue}>{formatCurrency(totals.subtotal, currency)}</Text>  
            </View>  
              
            <View style={styles.totalRow}>  
              <Text style={styles.totalLabel}>Impuesto ({companySettings?.impuesto_porcentaje || 0}%):</Text>  
              <Text style={styles.totalValue}>{formatCurrency(totals.tax, currency)}</Text>  
            </View>  
              
            <View style={[styles.totalRow, styles.grandTotalRow]}>  
              <Text style={styles.grandTotalLabel}>TOTAL:</Text>  
              <Text style={styles.grandTotalValue}>{formatCurrency(totals.total, currency)}</Text>  
            </View>  
          </View>  
  
          {/* Botones de acción */}  
          <View style={styles.actionButtons}>  
            <TouchableOpacity  
              style={styles.quoteButton}  
              onPress={generateQuote}  
              disabled={isGeneratingPDF}  
            >  
              {isGeneratingPDF ? (  
                <ActivityIndicator size="small" color="#1a73e8" />  
              ) : (  
                <>  
                  <Feather name="file-text" size={20} color="#1a73e8" />  
                  <Text style={styles.quoteButtonText}>Generar Cotización</Text>  
                </>  
              )}  
            </TouchableOpacity>  
  
            <TouchableOpacity  
              style={styles.saveButton}  
              onPress={saveOrder}  
              disabled={isSaving}  
            >  
              {isSaving ? (  
                <ActivityIndicator size="small" color="#fff" />  
              ) : (  
                <>  
                  <Feather name="save" size={20} color="#fff" />  
                  <Text style={styles.saveButtonText}>Crear Orden</Text>  
                </>  
              )}  
            </TouchableOpacity>  
          </View>  
        </ScrollView>  
  
        {renderItemModal()}  
        {renderServiceModal()}  
      </SafeAreaView>  
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
    flex: 1,  
  },  
  content: {  
    flex: 1,  
    padding: 16,  
  },  
  formGroup: {  
    marginBottom: 20,  
  },  
  label: {  
    fontSize: 16,  
    fontWeight: "500",  
    color: "#333",  
    marginBottom: 8,  
  },  
  pickerContainer: {  
    backgroundColor: "#fff",  
    borderRadius: 8,  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  picker: {  
    height: 50,  
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
    textAlignVertical: "top",  
  },  
  sectionHeader: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    marginBottom: 12,  
  },  
  addButtonsContainer: {  
    flexDirection: "row",  
    gap: 8,  
  },  
  addButton: {  
    backgroundColor: "#1a73e8",  
    flexDirection: "row",  
    alignItems: "center",  
    paddingHorizontal: 12,  
    paddingVertical: 8,  
    borderRadius: 6,  
    gap: 4,  
  },  
  addButtonText: {  
    color: "#fff",  
    fontSize: 12,  
    fontWeight: "500",  
  },  
  itemCard: {  
    backgroundColor: "#fff",  
    borderRadius: 8,  
    padding: 12,  
    marginBottom: 8,  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  itemHeader: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    marginBottom: 8,  
  },  
  itemName: {  
    fontSize: 16,  
    fontWeight: "500",  
    color: "#333",  
    flex: 1,  
  },  
  removeButton: {  
    padding: 4,  
  },  
  itemCode: {  
    fontSize: 12,  
    color: "#666",  
    marginBottom: 8,  
  },  
  itemDetails: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
  },  
  quantityContainer: {  
    flexDirection: "row",  
    alignItems: "center",  
  },  
  quantityLabel: {  
    fontSize: 14,  
    color: "#666",  
    marginRight: 8,  
  },  
  quantityControls: {  
    flexDirection: "row",  
    alignItems: "center",  
  },  
  quantityButton: {  
    width: 32,  
    height: 32,  
    borderRadius: 16,  
    backgroundColor: "#f8f9fa",  
    justifyContent: "center",  
    alignItems: "center",  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  quantityText: {  
    fontSize: 16,  
    fontWeight: "500",  
    color: "#333",  
    marginHorizontal: 12,  
    minWidth: 20,  
    textAlign: "center",  
  },  
  itemTotal: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#1a73e8",  
  },  
  emptyItems: {  
    padding: 20,  
    alignItems: "center",  
  },  
  emptyItemsText: {  
    fontSize: 14,  
    color: "#999",  
    textAlign: "center",  
  },  
  laborCostContainer: {  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "space-between",  
    backgroundColor: "#fff",  
    borderRadius: 8,  
    padding: 12,  
    marginTop: 12,  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  laborCostLabel: {  
    fontSize: 14,  
    color: "#333",  
    fontWeight: "500",  
  },  
  laborCostInput: {  
    backgroundColor: "#f8f9fa",  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
    borderRadius: 6,  
    paddingHorizontal: 12,  
    paddingVertical: 8,  
    fontSize: 16,  
    color: "#333",  
    minWidth: 100,  
    textAlign: "right",  
  },  
  imageActions: {  
    flexDirection: "row",  
    gap: 12,  
    marginBottom: 12,  
  },  
  imageActionButton: {  
    flex: 1,  
    backgroundColor: "#fff",  
    borderWidth: 1,  
    borderColor: "#1a73e8",  
    borderRadius: 8,  
    paddingVertical: 12,  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "center",  
    gap: 8,  
  },  
  imageActionText: {  
    color: "#1a73e8",  
    fontSize: 14,  
    fontWeight: "500",  
  },  
  imagesList: {  
    marginTop: 8,  
  },  
  imageContainer: {  
    position: "relative",  
    marginRight: 8,  
  },  
  imagePreview: {  
    width: 80,  
    height: 80,  
    borderRadius: 8,  
  },  
  removeImageButton: {  
    position: "absolute",  
    top: -8,  
    right: -8,  
    backgroundColor: "#e53935",  
    borderRadius: 12,  
    width: 24,  
    height: 24,  
    justifyContent: "center",  
    alignItems: "center",  
  },  
  totalsContainer: {  
    backgroundColor: "#fff",  
    borderRadius: 8,  
    padding: 16,  
    marginBottom: 20,  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  totalsTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 12,  
  },  
  totalRow: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    marginBottom: 8,  
  },  
  totalLabel: {  
    fontSize: 14,  
    color: "#666",  
  },  
  totalValue: {  
    fontSize: 14,  
    fontWeight: "500",  
    color: "#333",  
  },  
  grandTotalRow: {  
    borderTopWidth: 1,  
    borderTopColor: "#e1e4e8",  
    paddingTop: 8,  
    marginTop: 8,  
  },  
  grandTotalLabel: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  grandTotalValue: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#1a73e8",  
  },  
  actionButtons: {  
    flexDirection: "row",  
    gap: 12,  
    marginBottom: 20,  
  },  
  quoteButton: {  
    flex: 1,  
    backgroundColor: "#fff",  
    borderWidth: 1,  
    borderColor: "#1a73e8",  
    borderRadius: 8,  
    paddingVertical: 12,  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "center",  
    gap: 8,  
  },  
  quoteButtonText: {  
    color: "#1a73e8",  
    fontSize: 16,  
    fontWeight: "500",  
  },  
  saveButton: {  
    flex: 1,  
    backgroundColor: "#1a73e8",  
    borderRadius: 8,  
    paddingVertical: 12,  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "center",  
    gap: 8,  
  },  
  saveButtonText: {  
    color: "#fff",  
    fontSize: 16,  
    fontWeight: "bold",  
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
  searchContainer: {  
    flexDirection: "row",  
    alignItems: "center",  
    backgroundColor: "#f8f9fa",  
    borderRadius: 8,  
    paddingHorizontal: 12,  
    marginBottom: 16,  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  searchInput: {  
    flex: 1,  
    paddingVertical: 12,  
    fontSize: 16,  
    color: "#333",  
    marginLeft: 8,  
  },  
  inventoryItem: {  
    flexDirection: "row",  
    alignItems: "center",  
    paddingVertical: 12,  
    paddingHorizontal: 16,  
    borderBottomWidth: 1,  
    borderBottomColor: "#f0f0f0",  
  },  
  selectedInventoryItem: {  
    backgroundColor: "#e6f0ff",  
  },  
  itemInfo: {  
    flex: 1,  
  },  
  inventoryItemName: {  
    fontSize: 16,  
    fontWeight: "500",  
    color: "#333",  
    marginBottom: 4,  
  },  
  inventoryItemCode: {  
    fontSize: 12,  
    color: "#666",  
    marginBottom: 4,  
  },  
  inventoryItemDetails: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
  },  
  inventoryItemCategory: {  
    fontSize: 12,  
    color: "#999",  
  },  
  inventoryItemStock: {  
    fontSize: 12,  
    color: "#4caf50",  
  },  
  lowStock: {  
    color: "#e53935",  
  },  
  inventoryItemPrice: {  
    fontSize: 14,  
    fontWeight: "bold",  
    color: "#1a73e8",  
    marginLeft: 12,  
  },  
  serviceItem: {  
    flexDirection: "row",  
    alignItems: "center",  
    paddingVertical: 12,  
    paddingHorizontal: 16,  
    borderBottomWidth: 1,  
    borderBottomColor: "#f0f0f0",  
  },  
  selectedServiceItem: {  
    backgroundColor: "#e6f0ff",  
  },  
  serviceInfo: {  
    flex: 1,  
  },  
  serviceName: {  
    fontSize: 16,  
    fontWeight: "500",  
    color: "#333",  
    marginBottom: 4,  
  },  
  serviceDescription: {  
    fontSize: 12,  
    color: "#666",  
    marginBottom: 4,  
  },  
  serviceDuration: {  
    fontSize: 12,  
    color: "#999",  
  },  
  servicePrice: {  
    fontSize: 14,  
    fontWeight: "bold",  
    color: "#4caf50",  
    marginLeft: 12,  
  },  
  emptyList: {  
    padding: 40,  
    alignItems: "center",  
  },  
  emptyListText: {  
    fontSize: 16,  
    color: "#999",  
    textAlign: "center",  
  },  
  quantityInput: {  
    backgroundColor: "#fff",  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
    borderRadius: 6,  
    paddingHorizontal: 12,  
    paddingVertical: 8,  
    fontSize: 16,  
    color: "#333",  
    minWidth: 80,  
    textAlign: "center",  
  },  
  modalActions: {  
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
  disabledButton: {  
    opacity: 0.5,  
  },  
})