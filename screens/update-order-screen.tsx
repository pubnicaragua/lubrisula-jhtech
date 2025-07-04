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
  FlatList,
  Modal,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { useAuth } from "../context/auth-context"
import { formatCurrency } from "../utils/helpers"
import { Picker } from "@react-native-picker/picker"

export default function UpdateOrderScreen({ route, navigation }) {
  const { orderId } = route.params
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [order, setOrder] = useState(null)
  const [client, setClient] = useState(null)
  const [vehicle, setVehicle] = useState(null)
  const [inventoryItems, setInventoryItems] = useState([])
  const [selectedItems, setSelectedItems] = useState([])
  const [laborCost, setLaborCost] = useState("0")
  const [diagnosis, setDiagnosis] = useState("")
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState("")
  const [showItemModal, setShowItemModal] = useState(false)
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null)
  const [itemQuantity, setItemQuantity] = useState("1")
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredItems, setFilteredItems] = useState([])
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [predefinedServices, setPredefinedServices] = useState([])
  const [selectedService, setSelectedService] = useState(null)

  // Cargar datos de la orden
  useEffect(() => {
    loadOrderData()
  }, [orderId])

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

  const loadOrderData = async () => {
    try {
      setIsLoading(true)
      // Importar servicios
      const orderService = await import("../services/order-service")
      const clientService = await import("../services/client-service")
      const vehicleService = await import("../services/vehicle-service")
      const inventoryService = await import("../services/inventory-service")

      // Cargar orden
      const orderData = await orderService.getOrderById(orderId)
      if (!orderData) {
        Alert.alert("Error", "No se pudo encontrar la orden")
        navigation.goBack()
        return
      }
      setOrder(orderData)
      setStatus(orderData.status)
      setDiagnosis(orderData.diagnosis || "")
      setNotes(orderData.notes || "")
      setLaborCost(orderData.laborCost.toString())

      // Inicializar items seleccionados
      setSelectedItems(orderData.items || [])

      // Cargar cliente
      const clientData = await clientService.getClientById(orderData.clientId)
      setClient(clientData)

      // Cargar vehículo
      const vehicleData = await vehicleService.getVehicleById(orderData.vehicleId)
      setVehicle(vehicleData)

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
        { id: "5", name: "Cambio de filtro de aire", price: 25, description: "Reemplazo de filtro de aire del motor" },
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
    } catch (error) {
      console.error("Error al cargar datos de la orden:", error)
      Alert.alert("Error", "No se pudieron cargar los datos de la orden")
    } finally {
      setIsLoading(false)
    }
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

  // Guardar cambios en la orden
  const saveOrder = async () => {
    try {
      setIsSaving(true)

      // Validar datos
      if (!diagnosis.trim()) {
        Alert.alert("Error", "Debe ingresar un diagnóstico")
        setIsSaving(false)
        return
      }

      // Calcular totales
      const totals = calculateTotals()

      // Importar servicio
      const orderService = await import("../services/order-service")

      // Preparar datos actualizados
      const updatedOrder = {
        status,
        diagnosis,
        notes,
        items: selectedItems,
        laborCost: totals.laborCost,
        totalParts: totals.totalParts,
        tax: totals.tax,
        total: totals.total,
      }

      // Actualizar orden
      const result = await orderService.updateOrder(orderId, updatedOrder)

      if (result) {
        // Añadir comentario sobre la actualización
        await orderService.addOrderComment(orderId, {
          userId: user?.id || "",
          userName: user?.name || "Técnico",
          text: `Orden actualizada. Estado: ${getStatusText(status)}`,
          type: "technician",
        })

        Alert.alert("Éxito", "Orden actualizada correctamente", [{ text: "OK", onPress: () => navigation.goBack() }])
      } else {
        Alert.alert("Error", "No se pudo actualizar la orden")
      }
    } catch (error) {
      console.error("Error al guardar orden:", error)
      Alert.alert("Error", "No se pudo guardar la orden")
    } finally {
      setIsSaving(false)
    }
  }

  // Obtener texto según estado
  const getStatusText = (statusValue) => {
    switch (statusValue) {
      case "reception":
        return "Recepción"
      case "diagnosis":
        return "Diagnóstico"
      case "waiting_parts":
        return "Esperando Repuestos"
      case "in_progress":
        return "En Proceso"
      case "quality_check":
        return "Control de Calidad"
      case "completed":
        return "Completada"
      case "delivered":
        return "Entregada"
      case "cancelled":
        return "Cancelada"
      default:
        return "Desconocido"
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
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Actualizar Orden #{order.number}</Text>
          <Text style={styles.subtitle}>
            {client?.name} - {vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.year})` : ""}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado de la Orden</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={status} onValueChange={(itemValue) => setStatus(itemValue)} style={styles.picker}>
              <Picker.Item label="Recepción" value="reception" />
              <Picker.Item label="Diagnóstico" value="diagnosis" />
              <Picker.Item label="Esperando Repuestos" value="waiting_parts" />
              <Picker.Item label="En Proceso" value="in_progress" />
              <Picker.Item label="Control de Calidad" value="quality_check" />
              <Picker.Item label="Completada" value="completed" />
              <Picker.Item label="Entregada" value="delivered" />
              <Picker.Item label="Cancelada" value="cancelled" />
            </Picker>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagnóstico</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="Ingrese el diagnóstico detallado"
            value={diagnosis}
            onChangeText={setDiagnosis}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Repuestos</Text>
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

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mano de Obra</Text>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notas Adicionales</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="Ingrese notas adicionales (opcional)"
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <View style={styles.totalsSection}>
          <Text style={styles.totalsSectionTitle}>Resumen</Text>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal Repuestos:</Text>
            <Text style={styles.totalValue}>{formatCurrency(totals.totalParts)}</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Mano de Obra:</Text>
            <Text style={styles.totalValue}>{formatCurrency(totals.laborCost)}</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Impuestos (13%):</Text>
            <Text style={styles.totalValue}>{formatCurrency(totals.tax)}</Text>
          </View>

          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.grandTotalLabel}>TOTAL:</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(totals.total)}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelOrderButton} onPress={() => navigation.goBack()} disabled={isSaving}>
            <Text style={styles.cancelOrderButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveOrderButton} onPress={saveOrder} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveOrderButtonText}>Guardar Cambios</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {renderItemModal()}
      {renderServiceModal()}
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  section: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
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
  },
  totalsSection: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    margin: 16,
    marginTop: 8,
  },
  cancelOrderButton: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 8,
    marginRight: 8,
    alignItems: "center",
  },
  cancelOrderButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  saveOrderButton: {
    flex: 1,
    backgroundColor: "#4caf50",
    padding: 16,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: "center",
  },
  saveOrderButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
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