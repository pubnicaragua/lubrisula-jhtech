"use client"

import { useState, useEffect } from "react"
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
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { Picker } from "@react-native-picker/picker"
import * as ImagePicker from "expo-image-picker"
import { useAuth } from "../context/auth-context"
import type { CurrencyCode } from "../types"
import { formatCurrency } from "../utils/helpers"
import { Share } from "react-native"
import { generateQuotePDF } from "../utils/pdf-generator"

export default function NewOrderScreen({ navigation, route }) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [clients, setClients] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [currencies, setCurrencies] = useState([])
  const [companySettings, setCompanySettings] = useState(null)
  const [inventoryItems, setInventoryItems] = useState([])
  const [predefinedServices, setPredefinedServices] = useState([])

  // Datos del formulario
  const [selectedClient, setSelectedClient] = useState("")
  const [selectedVehicle, setSelectedVehicle] = useState("")
  const [description, setDescription] = useState("")
  const [notes, setNotes] = useState("")
  const [images, setImages] = useState([])
  const [currency, setCurrency] = useState<CurrencyCode>("USD")
  const [selectedItems, setSelectedItems] = useState([])
  const [laborCost, setLaborCost] = useState("0")

  // Modales
  const [showItemModal, setShowItemModal] = useState(false)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null)
  const [selectedService, setSelectedService] = useState(null)
  const [itemQuantity, setItemQuantity] = useState("1")
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredItems, setFilteredItems] = useState([])

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true)

        // Importar servicios
        const clientService = await import("../services/client-service")
        const currencyService = await import("../services/currency-service")
        const companyService = await import("../services/company-service")
        const inventoryService = await import("../services/inventory-service")

        // Cargar clientes
        const allClients = await clientService.getAllClients()
        setClients(allClients)

        // Cargar monedas
        const allCurrencies = await currencyService.getAllCurrencies()
        setCurrencies(allCurrencies)

        // Cargar configuración de la empresa
        const settings = await companyService.getCompanySettings()
        setCompanySettings(settings)
        setCurrency(settings.defaultCurrency)

        // Cargar inventario
        const inventory = await inventoryService.getAllInventoryItems()
        setInventoryItems(inventory)
        setFilteredItems(inventory)

        // Cargar servicios predefinidos
        const services = [
          {
            id: "1",
            name: "Cambio de aceite y filtro",
            price: 50,
            description: "Incluye aceite sintético y filtro de aceite",
          },
          { id: "2", name: "Revisión de frenos", price: 75, description: "Inspección completa del sistema de frenos" },
          {
            id: "3",
            name: "Alineación y balanceo",
            price: 80,
            description: "Alineación de dirección y balanceo de ruedas",
          },
          {
            id: "4",
            name: "Diagnóstico electrónico",
            price: 60,
            description: "Escaneo completo de sistemas electrónicos",
          },
          {
            id: "5",
            name: "Cambio de filtro de aire",
            price: 25,
            description: "Reemplazo de filtro de aire del motor",
          },
          {
            id: "6",
            name: "Cambio de filtro de habitáculo",
            price: 30,
            description: "Reemplazo de filtro de aire de cabina",
          },
          { id: "7", name: "Cambio de bujías", price: 90, description: "Reemplazo de juego completo de bujías" },
          {
            id: "8",
            name: "Limpieza de inyectores",
            price: 120,
            description: "Limpieza y calibración de inyectores de combustible",
          },
        ]
        setPredefinedServices(services)

        // Si se pasa un cliente como parámetro, seleccionarlo
        if (route.params?.clientId) {
          setSelectedClient(route.params.clientId)
          loadVehiclesForClient(route.params.clientId)
        }

        // Si se pasa un vehículo como parámetro, seleccionarlo
        if (route.params?.vehicleId) {
          setSelectedVehicle(route.params.vehicleId)
        }
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error)
        Alert.alert("Error", "No se pudieron cargar los datos iniciales")
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [route.params])

  // Filtrar inventario cuando cambia la búsqueda
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredItems(inventoryItems)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = inventoryItems.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.sku.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query),
      )
      setFilteredItems(filtered)
    }
  }, [searchQuery, inventoryItems])

  // Cargar vehículos cuando se selecciona un cliente
  const loadVehiclesForClient = async (clientId) => {
    if (!clientId) {
      setVehicles([])
      setSelectedVehicle("")
      return
    }

    try {
      const vehicleService = await import("../services/vehicle-service")
      const clientVehicles = await vehicleService.getVehiclesByClientId(clientId)
      setVehicles(clientVehicles)

      // Si hay vehículos, seleccionar el primero por defecto
      if (clientVehicles.length > 0 && !selectedVehicle) {
        setSelectedVehicle(clientVehicles[0].id)
      } else {
        setSelectedVehicle("")
      }
    } catch (error) {
      console.error("Error al cargar vehículos:", error)
      Alert.alert("Error", "No se pudieron cargar los vehículos del cliente")
    }
  }

  // Manejar cambio de cliente
  const handleClientChange = (clientId) => {
    setSelectedClient(clientId)
    loadVehiclesForClient(clientId)
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
        // Añadir la nueva imagen al array de imágenes
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
        Alert.alert("Permiso denegado", "Necesitamos permiso para acceder a tu cámara")
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Añadir la nueva imagen al array de imágenes
        setImages([...images, { uri: result.assets[0].uri, type: "vehicle" }])
      }
    } catch (error) {
      console.error("Error al tomar foto:", error)
      Alert.alert("Error", "No se pudo tomar la foto")
    }
  }

  // Eliminar imagen
  const removeImage = (index) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    setImages(newImages)
  }

  // Añadir item de inventario a la orden
  const addInventoryItem = () => {
    if (!selectedInventoryItem) return

    const quantity = Number.parseInt(itemQuantity)
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert("Error", "La cantidad debe ser un número mayor que cero")
      return
    }

    // Verificar si hay suficiente stock
    if (quantity > selectedInventoryItem.quantity) {
      Alert.alert("Error", `No hay suficiente stock. Disponible: ${selectedInventoryItem.quantity}`)
      return
    }

    // Verificar si el item ya está en la lista
    const existingItemIndex = selectedItems.findIndex((item) => item.partNumber === selectedInventoryItem.sku)

    if (existingItemIndex >= 0) {
      // Actualizar cantidad si ya existe
      const updatedItems = [...selectedItems]
      const newQuantity = updatedItems[existingItemIndex].quantity + quantity

      if (newQuantity > selectedInventoryItem.quantity) {
        Alert.alert("Error", `No hay suficiente stock. Disponible: ${selectedInventoryItem.quantity}`)
        return
      }

      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: newQuantity,
        total: newQuantity * selectedInventoryItem.price,
      }

      setSelectedItems(updatedItems)
    } else {
      // Añadir nuevo item
      const newItem = {
        id: Date.now().toString(),
        name: selectedInventoryItem.name,
        quantity: quantity,
        unitPrice: selectedInventoryItem.price,
        total: quantity * selectedInventoryItem.price,
        partNumber: selectedInventoryItem.sku,
        supplier: selectedInventoryItem.supplier || "Desconocido",
        status: "pending",
      }

      setSelectedItems([...selectedItems, newItem])
    }

    // Limpiar selección
    setSelectedInventoryItem(null)
    setItemQuantity("1")
    setShowItemModal(false)
  }

  // Añadir servicio predefinido
  const addPredefinedService = () => {
    if (!selectedService) return

    // Añadir como mano de obra
    setLaborCost((Number.parseFloat(laborCost) + selectedService.price).toString())

    // Añadir nota sobre el servicio
    const newNotes = notes
      ? `${notes}\n\n- ${selectedService.name}: ${selectedService.description}`
      : `- ${selectedService.name}: ${selectedService.description}`

    setNotes(newNotes)

    // Limpiar selección
    setSelectedService(null)
    setShowServiceModal(false)

    Alert.alert("Servicio añadido", `Se ha añadido "${selectedService.name}" a la orden`)
  }

  // Eliminar item de la orden
  const removeItem = (itemId) => {
    const updatedItems = selectedItems.filter((item) => item.id !== itemId)
    setSelectedItems(updatedItems)
  }

  // Calcular totales
  const calculateTotals = () => {
    const totalParts = selectedItems.reduce((sum, item) => sum + item.total, 0)
    const labor = Number.parseFloat(laborCost) || 0

    // Calcular impuesto (asumiendo 13%)
    const taxRate = 0.13
    const subtotal = totalParts + labor
    const tax = subtotal * taxRate

    const total = subtotal + tax

    return {
      totalParts,
      laborCost: labor,
      tax,
      total,
    }
  }

  // Generar cotización en PDF
  const generateQuote = async () => {
    try {
      setIsGeneratingPDF(true)

      // Validar formulario
      if (!selectedClient) {
        Alert.alert("Error", "Debe seleccionar un cliente")
        setIsGeneratingPDF(false)
        return
      }

      if (!selectedVehicle) {
        Alert.alert("Error", "Debe seleccionar un vehículo")
        setIsGeneratingPDF(false)
        return
      }

      if (!description.trim()) {
        Alert.alert("Error", "Debe ingresar una descripción del problema")
        setIsGeneratingPDF(false)
        return
      }

      // Calcular totales
      const totals = calculateTotals()

      // Importar servicios
      const clientService = await import("../services/client-service")
      const vehicleService = await import("../services/vehicle-service")

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

  // Guardar orden
  const saveOrder = async () => {
    // Validar formulario
    if (!selectedClient) {
      Alert.alert("Error", "Debe seleccionar un cliente")
      return
    }

    if (!selectedVehicle) {
      Alert.alert("Error", "Debe seleccionar un vehículo")
      return
    }

    if (!description.trim()) {
      Alert.alert("Error", "Debe ingresar una descripción del problema")
      return
    }

    try {
      setIsSaving(true)

      // Calcular totales
      const totals = calculateTotals()

      // Importar servicios
      const orderService = await import("../services/order-service")
      const imageService = await import("../services/image-service")
      const inventoryService = await import("../services/inventory-service")

      // Crear la orden
      const newOrder = await orderService.createOrder({
        clientId: selectedClient,
        vehicleId: selectedVehicle,
        technicianId: user?.id,
        status: "reception",
        description,
        notes,
        items: selectedItems,
        laborCost: totals.laborCost,
        totalParts: totals.totalParts,
        tax: totals.tax,
        total: totals.total,
        currency,
        paymentStatus: "pending",
      })

      // Actualizar inventario
      for (const item of selectedItems) {
        if (item.partNumber) {
          // Buscar el item en el inventario
          const inventoryItem = inventoryItems.find((invItem) => invItem.sku === item.partNumber)
          if (inventoryItem) {
            // Actualizar cantidad
            await inventoryService.updateInventoryItem(inventoryItem.id, {
              quantity: inventoryItem.quantity - item.quantity,
            })
          }
        }
      }

      // Guardar imágenes
      for (const image of images) {
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

  // Renderizar modal de selección de items
  const renderItemModal = () => (
    <Modal
      visible={showItemModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowItemModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Repuesto</Text>
            <TouchableOpacity onPress={() => setShowItemModal(false)}>
              <Feather name="x" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, SKU o categoría..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.inventoryItem, selectedInventoryItem?.id === item.id && styles.selectedInventoryItem]}
                onPress={() => setSelectedInventoryItem(item)}
              >
                <View>
                  <Text style={styles.inventoryItemName}>{item.name}</Text>
                  <Text style={styles.inventoryItemSku}>SKU: {item.sku}</Text>
                  <View style={styles.inventoryItemDetails}>
                    <Text style={styles.inventoryItemCategory}>{item.category}</Text>
                    <Text style={styles.inventoryItemStock}>
                      Stock:{" "}
                      <Text style={item.quantity <= item.minQuantity ? styles.lowStock : null}>{item.quantity}</Text>
                    </Text>
                  </View>
                </View>
                <Text style={styles.inventoryItemPrice}>{formatCurrency(item.price)}</Text>
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
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowItemModal(false)}>
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
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
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
                style={[styles.serviceItem, selectedService?.id === item.id && styles.selectedServiceItem]}
                onPress={() => setSelectedService(item)}
              >
                <View style={styles.serviceItemContent}>
                  <Text style={styles.serviceItemName}>{item.name}</Text>
                  <Text style={styles.serviceItemDescription}>{item.description}</Text>
                </View>
                <Text style={styles.serviceItemPrice}>{formatCurrency(item.price)}</Text>
              </TouchableOpacity>
            )}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowServiceModal(false)}>
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    )
  }

  // Calcular totales para mostrar
  const totals = calculateTotals()

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nueva Orden de Servicio</Text>
      </View>

      <View style={styles.formContainer}>
        {/* Selección de cliente */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Cliente</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={selectedClient} onValueChange={handleClientChange} style={styles.picker}>
              <Picker.Item label="Seleccione un cliente" value="" />
              {clients.map((client) => (
                <Picker.Item key={client.id} label={client.name} value={client.id} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Selección de vehículo */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Vehículo</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedVehicle}
              onValueChange={(value) => setSelectedVehicle(value)}
              style={styles.picker}
              enabled={vehicles.length > 0}
            >
              <Picker.Item
                label={vehicles.length > 0 ? "Seleccione un vehículo" : "Seleccione un cliente primero"}
                value=""
              />
              {vehicles.map((vehicle) => (
                <Picker.Item
                  key={vehicle.id}
                  label={`${vehicle.make} ${vehicle.model} (${vehicle.year}) - ${vehicle.licensePlate}`}
                  value={vehicle.id}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Descripción del problema */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Descripción del problema</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="Describa el problema o servicio requerido"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Repuestos */}
        <View style={styles.formGroup}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Repuestos</Text>
            <TouchableOpacity style={styles.addItemButton} onPress={() => setShowItemModal(true)}>
              <Feather name="plus" size={16} color="#fff" />
              <Text style={styles.addItemButtonText}>Añadir Repuesto</Text>
            </TouchableOpacity>
          </View>

          {selectedItems.length > 0 ? (
            selectedItems.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <TouchableOpacity onPress={() => removeItem(item.id)}>
                    <Feather name="trash-2" size={18} color="#e53935" />
                  </TouchableOpacity>
                </View>

                <View style={styles.itemDetails}>
                  <Text style={styles.itemInfo}>
                    {item.quantity} x {formatCurrency(item.unitPrice)} = {formatCurrency(item.total)}
                  </Text>
                  {item.partNumber && <Text style={styles.itemPartNumber}>SKU: {item.partNumber}</Text>}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyItems}>No hay repuestos seleccionados</Text>
          )}
        </View>

        {/* Mano de Obra */}
        <View style={styles.formGroup}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Mano de Obra</Text>
            <TouchableOpacity style={styles.addServiceButton} onPress={() => setShowServiceModal(true)}>
              <Feather name="tool" size={16} color="#fff" />
              <Text style={styles.addServiceButtonText}>Añadir Servicio</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.laborCostContainer}>
            <Text style={styles.laborCostLabel}>Costo de mano de obra:</Text>
            <TextInput
              style={styles.laborCostInput}
              keyboardType="numeric"
              value={laborCost}
              onChangeText={setLaborCost}
            />
          </View>
        </View>

        {/* Notas adicionales */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Notas adicionales</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={3}
            placeholder="Notas adicionales (opcional)"
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Selección de moneda */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Moneda</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={currency}
              onValueChange={(value) => setCurrency(value as CurrencyCode)}
              style={styles.picker}
            >
              {currencies.map((curr) => (
                <Picker.Item key={curr.code} label={`${curr.name} (${curr.symbol})`} value={curr.code} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Resumen de totales */}
        <View style={styles.totalsSection}>
          <Text style={styles.totalsSectionTitle}>Resumen</Text>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal Repuestos:</Text>
            <Text style={styles.totalValue}>{formatCurrency(totals.totalParts, currency)}</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Mano de Obra:</Text>
            <Text style={styles.totalValue}>{formatCurrency(totals.laborCost, currency)}</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Impuestos (13%):</Text>
            <Text style={styles.totalValue}>{formatCurrency(totals.tax, currency)}</Text>
          </View>

          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.grandTotalLabel}>TOTAL:</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(totals.total, currency)}</Text>
          </View>
        </View>

        {/* Imágenes */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Imágenes del vehículo</Text>
          <View style={styles.imageButtons}>
            <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
              <Feather name="camera" size={20} color="#fff" />
              <Text style={styles.imageButtonText}>Tomar foto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <Feather name="image" size={20} color="#fff" />
              <Text style={styles.imageButtonText}>Galería</Text>
            </TouchableOpacity>
          </View>

          {images.length > 0 && (
            <View style={styles.imagePreviewContainer}>
              {images.map((image, index) => (
                <View key={index} style={styles.imagePreview}>
                  <Image source={{ uri: image.uri }} style={styles.previewImage} />
                  <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(index)}>
                    <Feather name="x" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.quoteButton} onPress={generateQuote} disabled={isGeneratingPDF}>
            {isGeneratingPDF ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="file-text" size={20} color="#fff" />
                <Text style={styles.quoteButtonText}>Generar Cotización</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} disabled={isSaving}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={saveOrder} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="save" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Guardar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {renderItemModal()}
      {renderServiceModal()}
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e4e8",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a73e8",
  },
  formContainer: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  textArea: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addItemButton: {
    backgroundColor: "#1a73e8",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  addItemButtonText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 4,
  },
  addServiceButton: {
    backgroundColor: "#4caf50",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  addServiceButtonText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 4,
  },
  emptyItems: {
    textAlign: "center",
    color: "#999",
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  itemCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
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
  },
  itemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemInfo: {
    fontSize: 14,
    color: "#666",
  },
  itemPartNumber: {
    fontSize: 12,
    color: "#999",
  },
  laborCostContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
  },
  laborCostLabel: {
    fontSize: 16,
    color: "#333",
  },
  laborCostInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 8,
    width: 120,
    textAlign: "right",
    fontSize: 16,
    backgroundColor: "#fff",
  },
  totalsSection: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e1e4e8",
  },
  totalsSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: "#666",
  },
  totalValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingTop: 8,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4caf50",
  },
  imageButtons: {
    flexDirection: "row",
    marginBottom: 16,
  },
  imageButton: {
    backgroundColor: "#1a73e8",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  imageButtonText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 8,
  },
  imagePreviewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  imagePreview: {
    width: 100,
    height: 100,
    margin: 4,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  removeImageButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  quoteButton: {
    backgroundColor: "#f5a623",
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginRight: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  quoteButtonText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#4caf50",
    borderRadius: 8,
    padding: 12,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 8,
    width: "90%",
    maxHeight: "80%",
    padding: 16,
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
  searchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  inventoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectedInventoryItem: {
    backgroundColor: "#e8f0fe",
  },
  inventoryItemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  inventoryItemSku: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  inventoryItemDetails: {
    flexDirection: "row",
  },
  inventoryItemCategory: {
    fontSize: 12,
    color: "#666",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  inventoryItemStock: {
    fontSize: 12,
    color: "#666",
  },
  lowStock: {
    color: "#e53935",
    fontWeight: "bold",
  },
  inventoryItemPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4caf50",
  },
  emptyList: {
    padding: 24,
    alignItems: "center",
  },
  emptyListText: {
    fontSize: 16,
    color: "#999",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 16,
    color: "#333",
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 8,
    width: 80,
    textAlign: "center",
    fontSize: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
  },
  addButton: {
    flex: 1,
    backgroundColor: "#4caf50",
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: "center",
  },
  addButtonText: {
    fontSize: 16,
    color: "#fff",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
  serviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectedServiceItem: {
    backgroundColor: "#e8f0fe",
  },
  serviceItemContent: {
    flex: 1,
    marginRight: 8,
  },
  serviceItemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  serviceItemDescription: {
    fontSize: 14,
    color: "#666",
  },
  serviceItemPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4caf50",
  },
})
