"use client"

import { useState } from "react"
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  FlatList,
} from "react-native"
import { Feather } from "@expo/vector-icons"

// Componente para repuesto en la orden
const OrderPartItem = ({ part, onRemove, onChangeQuantity }) => (
  <View style={styles.partItem}>
    <View style={styles.partInfo}>
      <Text style={styles.partName}>{part.name}</Text>
      <Text style={styles.partType}>{part.type}</Text>
      <Text style={styles.partPrice}>L. {part.price.toFixed(2)} c/u</Text>
    </View>
    <View style={styles.quantityContainer}>
      <TouchableOpacity
        style={styles.quantityButton}
        onPress={() => onChangeQuantity(part.id, Math.max(1, part.quantity - 1))}
      >
        <Feather name="minus" size={16} color="#666" />
      </TouchableOpacity>
      <Text style={styles.quantityText}>{part.quantity}</Text>
      <TouchableOpacity style={styles.quantityButton} onPress={() => onChangeQuantity(part.id, part.quantity + 1)}>
        <Feather name="plus" size={16} color="#666" />
      </TouchableOpacity>
    </View>
    <TouchableOpacity style={styles.removeButton} onPress={() => onRemove(part.id)}>
      <Feather name="x" size={20} color="#f44336" />
    </TouchableOpacity>
  </View>
)

// Componente para repuesto disponible
const AvailablePartItem = ({ part, onAdd }) => (
  <TouchableOpacity style={styles.availablePartItem} onPress={() => onAdd(part)}>
    <View style={styles.availablePartInfo}>
      <Text style={styles.availablePartName}>{part.name}</Text>
      <View style={styles.availablePartDetails}>
        <Text style={styles.availablePartType}>{part.type}</Text>
        <Text style={styles.availablePartPrice}>L. {part.price.toFixed(2)}</Text>
      </View>
    </View>
    <Feather name="plus" size={20} color="#1a73e8" />
  </TouchableOpacity>
)

export default function OrderPartsScreen({ route, navigation }) {
  // Obtener repuestos iniciales de los parámetros de navegación (si existen)
  const { initialItems } = route.params || { initialItems: [] }

  // Estados
  const [searchQuery, setSearchQuery] = useState("")
  const [showPartsModal, setShowPartsModal] = useState(false)
  const [orderParts, setOrderParts] = useState(initialItems.map((item) => ({ ...item, quantity: 1 })))
  const [supplier, setSupplier] = useState("")
  const [notes, setNotes] = useState("")
  const [showSupplierModal, setShowSupplierModal] = useState(false)

  // Datos de ejemplo
  const availableParts = [
    { id: "1", name: "Filtro de aceite", type: "Original", price: 250.0, stock: 15 },
    { id: "2", name: "Aceite de motor 5W-30", type: "Original", price: 180.0, stock: 28 },
    { id: "3", name: "Pastillas de freno delanteras", type: "Original", price: 1200.0, stock: 8 },
    { id: "4", name: "Bujías", type: "Genérico", price: 85.0, stock: 32 },
    { id: "5", name: "Filtro de aire", type: "Genérico", price: 180.0, stock: 20 },
    { id: "6", name: "Amortiguador trasero", type: "Original", price: 1850.0, stock: 6 },
    { id: "7", name: "Líquido de frenos", type: "Original", price: 120.0, stock: 18 },
  ]

  const suppliers = [
    { id: "1", name: "AutoPartes S.A." },
    { id: "2", name: "Lubricantes Express" },
    { id: "3", name: "Frenos Seguros" },
    { id: "4", name: "ElectroAuto" },
    { id: "5", name: "Suspensiones Pro" },
  ]

  // Función para agregar repuesto a la orden
  const addPart = (part) => {
    if (!orderParts.some((p) => p.id === part.id)) {
      setOrderParts([...orderParts, { ...part, quantity: 1 }])
    }
    setShowPartsModal(false)
  }

  // Función para cambiar cantidad de repuesto
  const changePartQuantity = (partId, quantity) => {
    setOrderParts(orderParts.map((part) => (part.id === partId ? { ...part, quantity } : part)))
  }

  // Función para eliminar repuesto de la orden
  const removePart = (partId) => {
    setOrderParts(orderParts.filter((part) => part.id !== partId))
  }

  // Función para buscar repuestos
  const searchParts = (text) => {
    setSearchQuery(text)
  }

  // Filtrar repuestos disponibles según la búsqueda
  const filteredParts = availableParts.filter(
    (part) =>
      part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.type.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Calcular total de la orden
  const orderTotal = orderParts.reduce((sum, part) => sum + part.price * part.quantity, 0)

  // Función para validar el formulario
  const validateForm = () => {
    if (orderParts.length === 0) {
      Alert.alert("Error", "Por favor agrega al menos un repuesto a la orden")
      return false
    }
    if (!supplier) {
      Alert.alert("Error", "Por favor selecciona un proveedor")
      return false
    }
    return true
  }

  // Función para crear la orden
  const createOrder = () => {
    if (validateForm()) {
      // Aquí iría la lógica para guardar la orden en la base de datos
      Alert.alert("Éxito", "Orden de repuestos creada correctamente", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ])
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ordenar Repuestos</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Repuestos</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => setShowPartsModal(true)}>
                <Feather name="plus" size={20} color="#1a73e8" />
                <Text style={styles.addButtonText}>Agregar</Text>
              </TouchableOpacity>
            </View>

            {orderParts.length === 0 ? (
              <Text style={styles.emptyText}>No hay repuestos agregados</Text>
            ) : (
              orderParts.map((part) => (
                <OrderPartItem key={part.id} part={part} onRemove={removePart} onChangeQuantity={changePartQuantity} />
              ))
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Información de la Orden</Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Proveedor</Text>
              <TouchableOpacity style={styles.selectorContainer} onPress={() => setShowSupplierModal(true)}>
                <Feather name="truck" size={20} color="#666" style={styles.inputIcon} />
                <Text style={[styles.selectorText, !supplier && styles.placeholderText]}>
                  {supplier || "Seleccionar proveedor"}
                </Text>
                <Feather name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Notas</Text>
              <View style={styles.textAreaContainer}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Notas adicionales para la orden"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Resumen</Text>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total de Repuestos:</Text>
              <Text style={styles.summaryValue}>{orderParts.length}</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total de Unidades:</Text>
              <Text style={styles.summaryValue}>{orderParts.reduce((sum, part) => sum + part.quantity, 0)}</Text>
            </View>

            <View style={[styles.summaryItem, styles.totalItem]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>L. {orderTotal.toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={createOrder}>
            <Text style={styles.saveButtonText}>Crear Orden</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Modal para seleccionar repuestos */}
      <Modal
        visible={showPartsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPartsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Repuestos</Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowPartsModal(false)}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Feather name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar repuesto..."
                value={searchQuery}
                onChangeText={searchParts}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity style={styles.clearButton} onPress={() => setSearchQuery("")}>
                  <Feather name="x" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filteredParts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <AvailablePartItem part={item} onAdd={addPart} />}
              contentContainerStyle={styles.modalList}
              ListEmptyComponent={<Text style={styles.emptyText}>No se encontraron repuestos</Text>}
            />
          </View>
        </View>
      </Modal>

      {/* Modal para seleccionar proveedor */}
      <Modal
        visible={showSupplierModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSupplierModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Proveedor</Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowSupplierModal(false)}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={suppliers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSupplier(item.name)
                    setShowSupplierModal(false)
                  }}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  {supplier === item.name && <Feather name="check" size={20} color="#1a73e8" />}
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.modalList}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
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
  },
  scrollContent: {
    padding: 16,
  },
  formSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  addButtonText: {
    color: "#1a73e8",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 16,
  },
  partItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  partInfo: {
    flex: 1,
  },
  partName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  partType: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  partPrice: {
    fontSize: 12,
    color: "#1a73e8",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    width: 30,
    textAlign: "center",
  },
  removeButton: {
    padding: 8,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  selectorContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    height: 48,
  },
  inputIcon: {
    padding: 12,
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  placeholderText: {
    color: "#999",
  },
  textAreaContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  textArea: {
    height: 100,
    fontSize: 16,
    padding: 12,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  totalItem: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a73e8",
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#1a73e8",
    borderRadius: 8,
    paddingVertical: 12,
    marginRight: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#1a73e8",
    fontSize: 16,
    fontWeight: "500",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#1a73e8",
    borderRadius: 8,
    paddingVertical: 12,
    marginLeft: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalCloseButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
  },
  modalList: {
    padding: 16,
    paddingTop: 0,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalItemText: {
    fontSize: 16,
    color: "#333",
  },
  availablePartItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  availablePartInfo: {
    flex: 1,
  },
  availablePartName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  availablePartDetails: {
    flexDirection: "row",
  },
  availablePartType: {
    fontSize: 12,
    color: "#666",
    marginRight: 8,
  },
  availablePartPrice: {
    fontSize: 12,
    color: "#1a73e8",
  },
})

