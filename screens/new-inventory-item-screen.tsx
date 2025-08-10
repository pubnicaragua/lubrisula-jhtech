"use client"  
  
import { useState, useCallback, useEffect } from "react"  
import {  
  View,  
  Text,  
  TextInput,  
  TouchableOpacity,  
  StyleSheet,  
  ScrollView,  
  Alert,  
  ActivityIndicator,  
  Modal,  
  FlatList,  
} from "react-native"  
import { Feather } from "@expo/vector-icons"  
import { useAuth } from "../context/auth-context"  
import INVENTARIO_SERVICES from "../services/supabase/inventory-service"
import { InventoryItem, InventoryCategory, InventoryItemFormData } from "../types/inventory"  
import ACCESOS_SERVICES from "../services/supabase/access-service"  
import USER_SERVICE from "../services/supabase/user-service" 
  
export default function NewInventoryItemScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])
  const [categoryModalVisible, setCategoryModalVisible] = useState(false)
  const [supplierModalVisible, setSupplierModalVisible] = useState(false)
    
    const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: "",
    sku: "",
    description: "",
    category: "",
    stock: 0,
    minStock: 0,
    cost: 0,
    priceUSD: 0,
    priceHNL: 0,
    supplier: "",
    location: "",
    isActive: true,
  })  
  
  const [errors, setErrors] = useState<Record<string, string>>({})  
  
  useEffect(() => {  
    loadInitialData()  
  }, [])  
  
  const loadInitialData = async () => {  
    try {  
      if (!user?.id) return  
  
      // Validar permisos del usuario  
      const userTallerId = await USER_SERVICE.GET_TALLER_ID(user.id)  
      if (!userTallerId) {
        Alert.alert("Error", "No tienes permisos para agregar artículos al inventario")  
        navigation.goBack()  
        return  
      }
      const userPermissions = await ACCESOS_SERVICES.GET_PERMISOS_USUARIO(user.id, userTallerId)  
  
      if (userPermissions?.rol === 'client') {  
        Alert.alert("Error", "No tienes permisos para agregar artículos al inventario")  
        navigation.goBack()  
        return  
      }  
  
      // Cargar categorías y proveedores  
      const [categoriesData, suppliersData] = await Promise.all([  
        INVENTARIO_SERVICES.getInventoryCategories(),  
        Promise.resolve([]) // Placeholder for suppliers - not implemented in service
      ])  
  
      setCategories(categoriesData)  
      setSuppliers(suppliersData)  
  
    } catch (error) {  
      console.error("Error loading initial data:", error)  
      Alert.alert("Error", "No se pudieron cargar los datos necesarios")  
    }  
  }  
  
    const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.sku?.trim()) {
      newErrors.sku = "El código SKU es requerido"
    }

    if (!formData.name?.trim()) {
      newErrors.name = "El nombre es requerido"
    }

    if (!formData.category) {
      newErrors.category = "La categoría es requerida"
    }

    if (!formData.cost || formData.cost <= 0) {
      newErrors.cost = "El precio de compra debe ser mayor a 0"
    }

    if (!formData.priceUSD || formData.priceUSD <= 0) {
      newErrors.priceUSD = "El precio de venta debe ser mayor a 0"
    }

    if (formData.priceUSD && formData.cost && formData.priceUSD <= formData.cost) {
      newErrors.priceUSD = "El precio de venta debe ser mayor al precio de compra"
    }

    if (formData.stock === undefined || formData.stock < 0) {
      newErrors.stock = "El stock actual no puede ser negativo"
    }

    if (!formData.minStock || formData.minStock < 0) {
      newErrors.minStock = "El stock mínimo debe ser mayor o igual a 0"
    }

    if (!formData.location?.trim()) {
      newErrors.location = "La ubicación en almacén es requerida"
    }  
  
    setErrors(newErrors)  
    return Object.keys(newErrors).length === 0  
  }  
  
  const handleSave = async () => {  
    if (!validateForm()) return  
  
    try {  
      setLoading(true)  
        
      // Crear nuevo artículo de inventario  
      const newItem = await INVENTARIO_SERVICES.createInventoryItem(formData as InventoryItemFormData)  
        
      Alert.alert(  
        "Éxito",  
        "Artículo agregado al inventario correctamente",  
        [  
          {  
            text: "OK",  
            onPress: () => navigation.goBack()  
          }  
        ]  
      )  
    } catch (error) {  
      console.error("Error creating inventory item:", error)  
      Alert.alert("Error", "No se pudo agregar el artículo al inventario")  
    } finally {  
      setLoading(false)  
    }  
  }  
  
  const updateFormData = (field: keyof InventoryItem, value: string | number | boolean) => {  
    setFormData(prev => ({ ...prev, [field]: value }))  
    if (errors[field]) {  
      setErrors(prev => ({ ...prev, [field]: "" }))  
    }  
  }  
  
  const getSelectedCategoryName = () => {  
    return formData.category || "Seleccionar categoría"  
  }  
  
  const getSelectedSupplierName = () => {  
    const supplier = suppliers.find(sup => sup.id === formData.supplier)  
    return supplier?.name || "Seleccionar proveedor (opcional)"  
  }  
  
  const renderCategoryModal = () => (  
    <Modal  
      visible={categoryModalVisible}  
      animationType="slide"  
      presentationStyle="pageSheet"  
    >  
      <View style={styles.modalContainer}>  
        <View style={styles.modalHeader}>  
          <Text style={styles.modalTitle}>Seleccionar Categoría</Text>  
          <TouchableOpacity  
            onPress={() => setCategoryModalVisible(false)}  
            style={styles.closeButton}  
          >  
            <Feather name="x" size={24} color="#666" />  
          </TouchableOpacity>  
        </View>  
  
        <FlatList  
          data={categories}  
          keyExtractor={(item) => item}  
          renderItem={({ item }) => (  
            <TouchableOpacity  
              style={[  
                styles.modalOption,  
                formData.category === item && styles.modalOptionSelected  
              ]}  
              onPress={() => {  
                updateFormData('category', item)  
                setCategoryModalVisible(false)  
              }}  
            >  
              <Text style={[  
                styles.modalOptionText,  
                formData.category === item && styles.modalOptionTextSelected  
              ]}>  
                {item}  
              </Text>  
              {formData.category === item && (  
                <Feather name="check" size={20} color="#1a73e8" />  
              )}  
            </TouchableOpacity>  
          )}  
          style={styles.modalContent}  
        />  
      </View>  
    </Modal>  
  )  
  
  const renderSupplierModal = () => (  
    <Modal  
      visible={supplierModalVisible}  
      animationType="slide"  
      presentationStyle="pageSheet"  
    >  
      <View style={styles.modalContainer}>  
        <View style={styles.modalHeader}>  
          <Text style={styles.modalTitle}>Seleccionar Proveedor</Text>  
          <TouchableOpacity  
            onPress={() => setSupplierModalVisible(false)}  
            style={styles.closeButton}  
          >  
            <Feather name="x" size={24} color="#666" />  
          </TouchableOpacity>  
        </View>  
  
        <FlatList  
          data={suppliers}  
          keyExtractor={(item) => item.id}  
          renderItem={({ item }) => (  
            <TouchableOpacity  
              style={[  
                styles.modalOption,  
                formData.supplier === item.id && styles.modalOptionSelected  
              ]}  
              onPress={() => {  
                updateFormData('supplier', item.id)  
                setSupplierModalVisible(false)  
              }}  
            >  
              <Text style={[  
                styles.modalOptionText,  
                formData.supplier === item.id && styles.modalOptionTextSelected  
              ]}>  
                {item.name}  
              </Text>  
              {formData.supplier === item.id && (  
                <Feather name="check" size={20} color="#1a73e8" />  
              )}  
            </TouchableOpacity>  
          )}  
          style={styles.modalContent}  
        />  
      </View>  
    </Modal>  
  )  
  
  return (  
    <ScrollView style={styles.container}>  
      <View style={styles.header}>  
        <Text style={styles.title}>Nuevo Artículo</Text>  
        <Text style={styles.subtitle}>Agregar artículo al inventario</Text>  
      </View>  
  
      <View style={styles.form}>  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>Información Básica</Text>  
            
          <View style={styles.inputGroup}>  
            <Text style={styles.label}>Código *</Text>  
            <TextInput  
              style={[styles.input, errors.sku && styles.inputError]}  
              value={formData.sku}  
              onChangeText={(value) => updateFormData('sku', value)}  
              placeholder="Código único del artículo"  
              autoCapitalize="characters"  
            />  
            {errors.sku && <Text style={styles.errorText}>{errors.sku}</Text>}  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.label}>Nombre *</Text>  
            <TextInput  
              style={[styles.input, errors.name && styles.inputError]}  
              value={formData.name}  
              onChangeText={(value) => updateFormData('name', value)}  
              placeholder="Nombre del artículo"  
              autoCapitalize="words"  
            />  
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.label}>Categoría *</Text>  
            <TouchableOpacity  
              style={[styles.selector, errors.category && styles.inputError]}  
              onPress={() => setCategoryModalVisible(true)}  
            >  
              <Text style={[  
                styles.selectorText,  
                !formData.category && styles.placeholderText  
              ]}>  
                {getSelectedCategoryName()}  
              </Text>  
              <Feather name="chevron-down" size={20} color="#666" />  
            </TouchableOpacity>  
            {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.label}>Descripción</Text>  
            <TextInput  
              style={[styles.input, styles.textArea]}  
              value={formData.description}  
              onChangeText={(value) => updateFormData('description', value)}  
              placeholder="Descripción del artículo"  
              multiline  
              numberOfLines={3}  
              textAlignVertical="top"  
            />  
          </View>  
        </View>  
  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>Precios e Inventario</Text>  
            
          <View style={styles.inputGroup}>  
            <Text style={styles.label}>Precio de Compra *</Text>  
            <TextInput  
              style={[styles.input, errors.cost && styles.inputError]}  
              value={formData.cost?.toString()}  
              onChangeText={(value) => updateFormData('cost', parseFloat(value) || 0)}  
              placeholder="0.00"  
              keyboardType="decimal-pad"  
            />  
            {errors.cost && <Text style={styles.errorText}>{errors.cost}</Text>}  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.label}>Precio de Venta *</Text>  
            <TextInput  
              style={[styles.input, errors.priceUSD && styles.inputError]}  
              value={formData.priceUSD?.toString()}  
              onChangeText={(value) => updateFormData('priceUSD', parseFloat(value) || 0)}  
              placeholder="0.00"  
              keyboardType="decimal-pad"  
            />  
            {errors.priceUSD && <Text style={styles.errorText}>{errors.priceUSD}</Text>}  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.label}>Stock Inicial *</Text>  
            <TextInput  
              style={[styles.input, errors.stock && styles.inputError]}  
              value={formData.stock?.toString()}  
              onChangeText={(value) => updateFormData('stock', parseInt(value) || 0)}  
              placeholder="0"  
              keyboardType="number-pad"  
            />  
            {errors.stock && <Text style={styles.errorText}>{errors.stock}</Text>}  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.label}>Stock Mínimo *</Text>  
            <TextInput  
              style={[styles.input, errors.minStock && styles.inputError]}  
              value={formData.minStock?.toString()}  
              onChangeText={(value) => updateFormData('minStock', parseInt(value) || 0)}  
              placeholder="0"  
              keyboardType="number-pad"  
            />  
            {errors.minStock && <Text style={styles.errorText}>{errors.minStock}</Text>}  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.label}>Ubicación en Almacén *</Text>  
            <TextInput  
              style={[styles.input, errors.location && styles.inputError]}  
              value={formData.location}  
              onChangeText={(value) => updateFormData('location', value)}  
              placeholder="Ej: A-12, Estante 3"  
              autoCapitalize="characters"  
            />  
            {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.label}>Proveedor (Opcional)</Text>  
            <TouchableOpacity  
              style={styles.selector}  
              onPress={() => setSupplierModalVisible(true)}  
            >  
              <Text style={[  
                styles.selectorText,  
                !formData.supplier && styles.placeholderText  
              ]}>  
                {getSelectedSupplierName()}  
              </Text>  
              <Feather name="chevron-down" size={20} color="#666" />  
            </TouchableOpacity>  
          </View>  
        </View>  
      </View>  
  
      <View style={styles.footer}>  
        <TouchableOpacity  
          style={[styles.button, styles.cancelButton]}  
          onPress={() => navigation.goBack()}  
          disabled={loading}  
        >  
          <Text style={styles.cancelButtonText}>Cancelar</Text>  
        </TouchableOpacity>  
  
        <TouchableOpacity  
          style={[styles.button, styles.saveButton]}  
          onPress={handleSave}  
          disabled={loading}  
        >  
          {loading ? (  
            <ActivityIndicator size="small" color="#fff" />  
          ) : (  
            <>  
              <Feather name="save" size={20} color="#fff" />  
              <Text style={styles.saveButtonText}>Guardar Artículo</Text>  
            </>  
          )}  
        </TouchableOpacity>  
      </View>  
  
      {renderCategoryModal()}  
      {renderSupplierModal()}  
    </ScrollView>  
  )  
}  
  
const styles = StyleSheet.create({  
  container: {  
    flex: 1,  
    backgroundColor: "#f8f9fa",  
  },  
  header: {  
    backgroundColor: "#fff",  
    padding: 20,  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  title: {  
    fontSize: 24,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 4,  
  },  
  subtitle: {  
    fontSize: 16,  
    color: "#666",  
  },  
  form: {  
    padding: 16,  
  },  
  section: {  
    backgroundColor: "#fff",  
    borderRadius: 8,  
    padding: 16,  
    marginBottom: 16,  
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
    marginBottom: 16,  
  },  
  inputGroup: {  
    marginBottom: 16,  
  },  
  label: {  
    fontSize: 16,  
    fontWeight: "500",  
    color: "#333",  
    marginBottom: 8,  
  },  
  input: {  
    backgroundColor: "#f8f9fa",  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
    borderRadius: 8,  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    fontSize: 16,  
    color: "#333",  
  },  
  inputError: {  
    borderColor: "#e53935",  
  },  
  textArea: {  
    height: 80,  
    textAlignVertical: "top",  
  },  
  selector: {  
    backgroundColor: "#f8f9fa",  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
    borderRadius: 8,  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
  },  
  selectorText: {  
    fontSize: 16,  
    color: "#333",  
  },  
  placeholderText: {  
    color: "#999",  
  },  
  errorText: {  
    fontSize: 14,  
    color: "#e53935",  
    marginTop: 4,  
  },  
  footer: {  
    flexDirection: "row",  
    padding: 16,  
    gap: 12,  
    backgroundColor: "#fff",  
    borderTopWidth: 1,  
    borderTopColor: "#e1e4e8",  
  },  
  button: {  
    flex: 1,  
    flexDirection: "row",  
    justifyContent: "center",  
    alignItems: "center",  
    paddingVertical: 12,  
    borderRadius: 8,  
    gap: 8,  
  },  
  cancelButton: {  
    backgroundColor: "transparent",  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  cancelButtonText: {  
    fontSize: 16,  
    fontWeight: "500",  
    color: "#666",  
  },  
  saveButton: {  
    backgroundColor: "#1a73e8",  
  },  
  saveButtonText: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#fff",  
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
  modalOption: {  
    paddingVertical: 16,  
    paddingHorizontal: 16,  
    borderRadius: 8,  
    marginBottom: 8,  
    backgroundColor: "#f8f9fa",  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
  },  
  modalOptionSelected: {  
    backgroundColor: "#e8f0fe",  
  },  
  modalOptionText: {  
    fontSize: 16,  
    color: "#333",  
    flex: 1,  
  },  
  modalOptionTextSelected: {  
    color: "#1a73e8",  
    fontWeight: "500",  
  },  
  modalOptionDescription: {  
    fontSize: 14,  
    color: "#666",  
    marginTop: 4,  
  },  
})