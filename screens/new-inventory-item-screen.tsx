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
// ✅ CORREGIDO: Importar tipos centralizados  
import { InventoryItem } from "../types/inventory"  
import ACCESOS_SERVICES from "../services/supabase/access-service"  
import USER_SERVICE from "../services/supabase/user-service"  
import { CategoriaMaterialType } from "../services/supabase/services-service"  
  
// ✅ CORREGIDO: Definir interface para form data basada en campos reales  
interface InventoryFormData {  
  producto: string  
  categoria_id: string  
  precio_unitario: number  
  cantidad: number  
  minStock?: number  
  lugar_compra?: string  
  unidad_medida?: string  
  proceso?: string  
  estado?: string  
}  
  
export default function NewInventoryItemScreen({ navigation }: { navigation: any }) {  
  const { user } = useAuth()  
  const [loading, setLoading] = useState(false)  
  const [categories, setCategories] = useState<CategoriaMaterialType[]>([])  
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])  
  const [categoryModalVisible, setCategoryModalVisible] = useState(false)  
  const [supplierModalVisible, setSupplierModalVisible] = useState(false)  
    
  // ✅ CORREGIDO: Usar solo campos que existen en el schema real  
  const [formData, setFormData] = useState<InventoryFormData>({  
    producto: "",  
    categoria_id: "",  
    precio_unitario: 0,  
    cantidad: 0,  
    minStock: 0,  
    lugar_compra: "",  
    unidad_medida: "unidad",  
    proceso: "",  
    estado: "Activo",  
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
        
      // ✅ CORREGIDO: Usar 'role' en lugar de 'rol'  
      if (userPermissions?.role === 'client') {  
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
  
  // ✅ CORREGIDO: Validación usando campos reales  
  const validateForm = () => {  
    const newErrors: Record<string, string> = {}  
  
    if (!formData.producto?.trim()) {  
      newErrors.producto = "El nombre del producto es requerido"  
    }  
  
    if (!formData.categoria_id) {  
      newErrors.categoria_id = "La categoría es requerida"  
    }  
  
    if (!formData.precio_unitario || formData.precio_unitario <= 0) {  
      newErrors.precio_unitario = "El precio unitario debe ser mayor a 0"  
    }  
  
    if (formData.cantidad === undefined || formData.cantidad < 0) {  
      newErrors.cantidad = "La cantidad no puede ser negativa"  
    }  
  
    if (!formData.minStock || formData.minStock < 0) {  
      newErrors.minStock = "El stock mínimo debe ser mayor o igual a 0"  
    }  
  
    setErrors(newErrors)  
    return Object.keys(newErrors).length === 0  
  }  
  
  const handleSave = async () => {  
    if (!validateForm()) return  
  
    try {  
      setLoading(true)  
        
      // ✅ CORREGIDO: Crear item con campos del schema real  
      const newItem = await INVENTARIO_SERVICES.createInventoryItem(formData)  
        
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
  
  // ✅ CORREGIDO: Función para actualizar form data  
  const updateFormData = (field: keyof InventoryFormData, value: string | number) => {  
    setFormData(prev => ({ ...prev, [field]: value }))  
    if (errors[field]) {  
      setErrors(prev => ({ ...prev, [field]: "" }))  
    }  
  }  
  
  const getSelectedCategoryName = () => {  
    const selectedCategory = categories.find(cat => cat.id === formData.categoria_id)  
    return selectedCategory?.nombre || "Seleccionar categoría"  
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
          keyExtractor={(item) => item.id}  
          renderItem={({ item }) => (  
            <TouchableOpacity  
              style={[  
                styles.modalOption,  
                formData.categoria_id === item.id && styles.modalOptionSelected  
              ]}  
              onPress={() => {  
                updateFormData('categoria_id', item.id)  
                setCategoryModalVisible(false)  
              }}  
            >  
              <Text style={[  
                styles.modalOptionText,  
                formData.categoria_id === item.id && styles.modalOptionTextSelected  
              ]}>  
                {item.nombre}  
              </Text>  
              {formData.categoria_id === item.id && (  
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
            <Text style={styles.label}>Nombre del Producto *</Text>  
            <TextInput  
              style={[styles.input, errors.producto && styles.inputError]}  
              value={formData.producto}  
              onChangeText={(value) => updateFormData('producto', value)}  
              placeholder="Nombre del artículo"  
              autoCapitalize="words"  
            />  
            {errors.producto && <Text style={styles.errorText}>{errors.producto}</Text>}  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.label}>Categoría *</Text>  
            <TouchableOpacity  
              style={[styles.selector, errors.categoria_id && styles.inputError]}  
              onPress={() => setCategoryModalVisible(true)}  
            >  
              <Text style={[  
                styles.selectorText,  
                !formData.categoria_id && styles.placeholderText  
              ]}>  
                {getSelectedCategoryName()}  
              </Text>  
              <Feather name="chevron-down" size={20} color="#666" />  
            </TouchableOpacity>  
            {errors.categoria_id && <Text style={styles.errorText}>{errors.categoria_id}</Text>}  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.label}>Precio Unitario *</Text>  
            <TextInput  
              style={[styles.input, errors.precio_unitario && styles.inputError]}  
              value={formData.precio_unitario?.toString()}  
              onChangeText={(value) => updateFormData('precio_unitario', parseFloat(value) || 0)}  
              placeholder="0.00"  
              keyboardType="decimal-pad"  
            />  
            {errors.precio_unitario && <Text style={styles.errorText}>{errors.precio_unitario}</Text>}  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.label}>Cantidad Inicial *</Text>  
            <TextInput  
              style={[styles.input, errors.cantidad && styles.inputError]}  
              value={formData.cantidad?.toString()}  
              onChangeText={(value) => updateFormData('cantidad', parseInt(value) || 0)}  
              placeholder="0"  
              keyboardType="number-pad"  
            />  
            {errors.cantidad && <Text style={styles.errorText}>{errors.cantidad}</Text>}  
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
            <Text style={styles.label}>Lugar de Compra</Text>  
            <TextInput  
              style={styles.input}  
              value={formData.lugar_compra}  
              onChangeText={(value) => updateFormData('lugar_compra', value)}  
              placeholder="Proveedor o lugar de compra"  
              autoCapitalize="words"  
            />  
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
    </ScrollView>  
  )  
}  
  
// Estilos permanecen igual...  
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
})