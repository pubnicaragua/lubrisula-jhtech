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
import INVENTARIO_SERVICES, { InventarioType, CategoriaMaterialType, ProveedorType } from "../services/supabase/inventory-service"  
import ACCESOS_SERVICES from "../services/supabase/access-service"  
import USER_SERVICE from "../services/supabase/user-service" 
  
export default function NewInventoryItemScreen({ navigation }) {  
  const { user } = useAuth()  
  const [loading, setLoading] = useState(false)  
  const [categories, setCategories] = useState<CategoriaMaterialType[]>([])  
  const [suppliers, setSuppliers] = useState<ProveedorType[]>([])  
  const [categoryModalVisible, setCategoryModalVisible] = useState(false)  
  const [supplierModalVisible, setSupplierModalVisible] = useState(false)  
    
  const [formData, setFormData] = useState<Partial<InventarioType>>({  
    codigo: "",  
    nombre: "",  
    descripcion: "",  
    categoria_id: "",  
    estado: "Activo",  
    precio_compra: 0,  
    precio_venta: 0,  
    stock_actual: 0,  
    stock_minimo: 0,  
    proveedor_id: "",  
    ubicacion_almacen: "",  
    fecha_ingreso: new Date().toISOString().split('T')[0],  
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
      const userPermissions = await ACCESOS_SERVICES.GET_PERMISOS_USUARIO(user.id, userTallerId)  
  
      if (userPermissions?.rol === 'client') {  
        Alert.alert("Error", "No tienes permisos para agregar artículos al inventario")  
        navigation.goBack()  
        return  
      }  
  
      // Cargar categorías y proveedores  
      const [categoriesData, suppliersData] = await Promise.all([  
        INVENTARIO_SERVICES.GET_CATEGORIA_MATERIALES(),  
        INVENTARIO_SERVICES.GET_PROVEEDORES()  
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
  
    if (!formData.codigo?.trim()) {  
      newErrors.codigo = "El código es requerido"  
    }  
  
    if (!formData.nombre?.trim()) {  
      newErrors.nombre = "El nombre es requerido"  
    }  
  
    if (!formData.categoria_id) {  
      newErrors.categoria_id = "La categoría es requerida"  
    }  
  
    if (!formData.precio_compra || formData.precio_compra <= 0) {  
      newErrors.precio_compra = "El precio de compra debe ser mayor a 0"  
    }  
  
    if (!formData.precio_venta || formData.precio_venta <= 0) {  
      newErrors.precio_venta = "El precio de venta debe ser mayor a 0"  
    }  
  
    if (formData.precio_venta && formData.precio_compra && formData.precio_venta <= formData.precio_compra) {  
      newErrors.precio_venta = "El precio de venta debe ser mayor al precio de compra"  
    }  
  
    if (formData.stock_actual === undefined || formData.stock_actual < 0) {  
      newErrors.stock_actual = "El stock actual no puede ser negativo"  
    }  
  
    if (!formData.stock_minimo || formData.stock_minimo < 0) {  
      newErrors.stock_minimo = "El stock mínimo debe ser mayor o igual a 0"  
    }  
  
    if (!formData.ubicacion_almacen?.trim()) {  
      newErrors.ubicacion_almacen = "La ubicación en almacén es requerida"  
    }  
  
    setErrors(newErrors)  
    return Object.keys(newErrors).length === 0  
  }  
  
  const handleSave = async () => {  
    if (!validateForm()) return  
  
    try {  
      setLoading(true)  
        
      // Crear nuevo artículo de inventario  
      const newItem = await INVENTARIO_SERVICES.INSERT_INVENTARIO(formData as InventarioType)  
        
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
  
  const updateFormData = (field: keyof InventarioType, value: any) => {  
    setFormData(prev => ({ ...prev, [field]: value }))  
    if (errors[field]) {  
      setErrors(prev => ({ ...prev, [field]: "" }))  
    }  
  }  
  
  const getSelectedCategoryName = () => {  
    const category = categories.find(cat => cat.id === formData.categoria_id)  
    return category?.nombre || "Seleccionar categoría"  
  }  
  
  const getSelectedSupplierName = () => {  
    const supplier = suppliers.find(sup => sup.id === formData.proveedor_id)  
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
              {item.descripcion && (  
                <Text style={styles.modalOptionDescription}>{item.descripcion}</Text>  
              )}  
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
                formData.proveedor_id === item.id && styles.modalOptionSelected  
              ]}  
              onPress={() => {  
                updateFormData('proveedor_id', item.id)  
                setSupplierModalVisible(false)  
              }}  
            >  
              <Text style={[  
                styles.modalOptionText,  
                formData.proveedor_id === item.id && styles.modalOptionTextSelected  
              ]}>  
                {item.name}  
              </Text>  
              <Text style={styles.modalOptionDescription}>  
                {item.contact_name} • {item.phone}  
              </Text>  
              {formData.proveedor_id === item.id && (  
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
              style={[styles.input, errors.codigo && styles.inputError]}  
              value={formData.codigo}  
              onChangeText={(value) => updateFormData('codigo', value)}  
              placeholder="Código único del artículo"  
              autoCapitalize="characters"  
            />  
            {errors.codigo && <Text style={styles.errorText}>{errors.codigo}</Text>}  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.label}>Nombre *</Text>  
            <TextInput  
              style={[styles.input, errors.nombre && styles.inputError]}  
              value={formData.nombre}  
              onChangeText={(value) => updateFormData('nombre', value)}  
              placeholder="Nombre del artículo"  
              autoCapitalize="words"  
            />  
            {errors.nombre && <Text style={styles.errorText}>{errors.nombre}</Text>}  
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
            <Text style={styles.label}>Descripción</Text>  
            <TextInput  
              style={[styles.input, styles.textArea]}  
              value={formData.descripcion}  
              onChangeText={(value) => updateFormData('descripcion', value)}  
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
              style={[styles.input, errors.precio_compra && styles.inputError]}  
              value={formData.precio_compra?.toString()}  
              onChangeText={(value) => updateFormData('precio_compra', parseFloat(value) || 0)}  
              placeholder="0.00"  
              keyboardType="decimal-pad"  
            />  
            {errors.precio_compra && <Text style={styles.errorText}>{errors.precio_compra}</Text>}  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.label}>Precio de Venta *</Text>  
            <TextInput  
              style={[styles.input, errors.precio_venta && styles.inputError]}  
              value={formData.precio_venta?.toString()}  
              onChangeText={(value) => updateFormData('precio_venta', parseFloat(value) || 0)}  
              placeholder="0.00"  
              keyboardType="decimal-pad"  
            />  
            {errors.precio_venta && <Text style={styles.errorText}>{errors.precio_venta}</Text>}  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.label}>Stock Inicial *</Text>  
            <TextInput  
              style={[styles.input, errors.stock_actual && styles.inputError]}  
              value={formData.stock_actual?.toString()}  
              onChangeText={(value) => updateFormData('stock_actual', parseInt(value) || 0)}  
              placeholder="0"  
              keyboardType="number-pad"  
            />  
            {errors.stock_actual && <Text style={styles.errorText}>{errors.stock_actual}</Text>}  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.label}>Stock Mínimo *</Text>  
            <TextInput  
              style={[styles.input, errors.stock_minimo && styles.inputError]}  
              value={formData.stock_minimo?.toString()}  
              onChangeText={(value) => updateFormData('stock_minimo', parseInt(value) || 0)}  
              placeholder="0"  
              keyboardType="number-pad"  
            />  
            {errors.stock_minimo && <Text style={styles.errorText}>{errors.stock_minimo}</Text>}  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.label}>Ubicación en Almacén *</Text>  
            <TextInput  
              style={[styles.input, errors.ubicacion_almacen && styles.inputError]}  
              value={formData.ubicacion_almacen}  
              onChangeText={(value) => updateFormData('ubicacion_almacen', value)}  
              placeholder="Ej: A-12, Estante 3"  
              autoCapitalize="characters"  
            />  
            {errors.ubicacion_almacen && <Text style={styles.errorText}>{errors.ubicacion_almacen}</Text>}  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.label}>Proveedor (Opcional)</Text>  
            <TouchableOpacity  
              style={styles.selector}  
              onPress={() => setSupplierModalVisible(true)}  
            >  
              <Text style={[  
                styles.selectorText,  
                !formData.proveedor_id && styles.placeholderText  
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