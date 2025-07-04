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

// Componente para campo de formulario
const FormField = ({ label, icon, placeholder, value, onChangeText, keyboardType = "default" }) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.inputContainer}>
      <Feather name={icon} size={20} color="#666" style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  </View>
)

// Componente para selector
const FormSelector = ({ label, icon, value, placeholder, onPress }) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TouchableOpacity style={styles.selectorContainer} onPress={onPress}>
      <Feather name={icon} size={20} color="#666" style={styles.inputIcon} />
      <Text style={[styles.selectorText, !value && styles.placeholderText]}>{value || placeholder}</Text>
      <Feather name="chevron-down" size={20} color="#666" />
    </TouchableOpacity>
  </View>
)

export default function NewInventoryItemScreen({ navigation }) {
  // Estados para el formulario
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [category, setCategory] = useState("")
  const [brand, setBrand] = useState("")
  const [type, setType] = useState("")
  const [price, setPrice] = useState("")
  const [stock, setStock] = useState("")
  const [minStock, setMinStock] = useState("")
  const [location, setLocation] = useState("")
  const [supplier, setSupplier] = useState("")
  const [description, setDescription] = useState("")

  // Estados para modales
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showBrandModal, setShowBrandModal] = useState(false)
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [showSupplierModal, setShowSupplierModal] = useState(false)

  // Datos de ejemplo
  const categories = [
    { id: "1", name: "Filtros" },
    { id: "2", name: "Aceites" },
    { id: "3", name: "Frenos" },
    { id: "4", name: "Suspensión" },
    { id: "5", name: "Eléctricos" },
  ]

  const brands = [
    { id: "1", name: "Toyota" },
    { id: "2", name: "Honda" },
    { id: "3", name: "Nissan" },
    { id: "4", name: "Ford" },
    { id: "5", name: "Genérico" },
  ]

  const types = [
    { id: "1", name: "Original" },
    { id: "2", name: "Genérico" },
    { id: "3", name: "Remanufacturado" },
  ]

  const suppliers = [
    { id: "1", name: "AutoPartes S.A." },
    { id: "2", name: "Lubricantes Express" },
    { id: "3", name: "Frenos Seguros" },
    { id: "4", name: "ElectroAuto" },
    { id: "5", name: "Suspensiones Pro" },
  ]

  // Función para validar el formulario
  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Por favor ingresa el nombre del repuesto")
      return false
    }
    if (!code.trim()) {
      Alert.alert("Error", "Por favor ingresa el código del repuesto")
      return false
    }
    if (!price.trim() || isNaN(Number.parseFloat(price))) {
      Alert.alert("Error", "Por favor ingresa un precio válido")
      return false
    }
    if (!stock.trim() || isNaN(Number.parseInt(stock))) {
      Alert.alert("Error", "Por favor ingresa una cantidad de stock válida")
      return false
    }
    return true
  }

  // Función para guardar el repuesto
  const saveItem = () => {
    if (validateForm()) {
      const saveItemAsync = async () => {
        try {
          // Importar servicio de inventario
          const inventoryService = await import("../services/inventory-service");
          
          // Crear nuevo artículo
          const newItem = await inventoryService.createInventoryItem({
            name,
            sku: code,
            category,
            brand,
            type,
            priceUSD: parseFloat(price),
            priceHNL: parseFloat(price) * 24.5, // Convertir a lempiras
            stock: parseInt(stock),
            minStock: minStock ? parseInt(minStock) : undefined,
            supplier,
            location,
            description,
            isActive: true,
          });
          
          if (newItem) {
            Alert.alert("Éxito", "Repuesto guardado correctamente", [
              {
                text: "OK",
                onPress: () => navigation.goBack(),
              },
            ]);
          } else {
            Alert.alert("Error", "No se pudo guardar el repuesto");
          }
        } catch (error) {
          console.error("Error al guardar repuesto:", error);
          Alert.alert("Error", "No se pudo guardar el repuesto");
        }
      };
      
      saveItemAsync();
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
          <Text style={styles.headerTitle}>Nuevo Repuesto</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Información Básica</Text>

            <FormField
              label="Nombre"
              icon="package"
              placeholder="Nombre del repuesto"
              value={name}
              onChangeText={setName}
            />

            <FormField label="Código" icon="hash" placeholder="Código único" value={code} onChangeText={setCode} />

            <FormSelector
              label="Categoría"
              icon="folder"
              value={category}
              placeholder="Seleccionar categoría"
              onPress={() => setShowCategoryModal(true)}
            />

            <FormSelector
              label="Marca"
              icon="tag"
              value={brand}
              placeholder="Seleccionar marca"
              onPress={() => setShowBrandModal(true)}
            />

            <FormSelector
              label="Tipo"
              icon="layers"
              value={type}
              placeholder="Seleccionar tipo"
              onPress={() => setShowTypeModal(true)}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Inventario</Text>

            <FormField
              label="Precio (L.)"
              icon="dollar-sign"
              placeholder="0.00"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />

            <FormField
              label="Stock Inicial"
              icon="box"
              placeholder="0"
              value={stock}
              onChangeText={setStock}
              keyboardType="number-pad"
            />

            <FormField
              label="Stock Mínimo"
              icon="alert-circle"
              placeholder="0"
              value={minStock}
              onChangeText={setMinStock}
              keyboardType="number-pad"
            />

            <FormField
              label="Ubicación"
              icon="map-pin"
              placeholder="Ej. A-12"
              value={location}
              onChangeText={setLocation}
            />

            <FormSelector
              label="Proveedor"
              icon="truck"
              value={supplier}
              placeholder="Seleccionar proveedor"
              onPress={() => setShowSupplierModal(true)}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Descripción</Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Descripción</Text>
              <View style={styles.textAreaContainer}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Descripción detallada del repuesto"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={saveItem}>
            <Text style={styles.saveButtonText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Modal para seleccionar categoría */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Categoría</Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowCategoryModal(false)}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={categories}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setCategory(item.name)
                    setShowCategoryModal(false)
                  }}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  {category === item.name && <Feather name="check" size={20} color="#1a73e8" />}
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.modalList}
            />
          </View>
        </View>
      </Modal>

      {/* Modal para seleccionar marca */}
      <Modal
        visible={showBrandModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBrandModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Marca</Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowBrandModal(false)}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={brands}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setBrand(item.name)
                    setShowBrandModal(false)
                  }}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  {brand === item.name && <Feather name="check" size={20} color="#1a73e8" />}
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.modalList}
            />
          </View>
        </View>
      </Modal>

      {/* Modal para seleccionar tipo */}
      <Modal
        visible={showTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Tipo</Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowTypeModal(false)}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={types}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setType(item.name)
                    setShowTypeModal(false)
                  }}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  {type === item.name && <Feather name="check" size={20} color="#1a73e8" />}
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.modalList}
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  inputIcon: {
    padding: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
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
  modalList: {
    padding: 16,
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
})

