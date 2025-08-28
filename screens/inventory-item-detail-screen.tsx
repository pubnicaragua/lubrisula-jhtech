"use client"  
  
import { useState, useCallback } from "react"  
import {  
  StyleSheet,  
  View,  
  Text,  
  TouchableOpacity,  
  ScrollView,  
  ActivityIndicator,  
  Alert,  
  TextInput,  
  Modal,  
  SafeAreaView,  
} from "react-native"  
import { Feather, MaterialIcons } from "@expo/vector-icons"  
import { useFocusEffect } from "@react-navigation/native"  
import { StackNavigationProp } from '@react-navigation/stack'  
import { RouteProp } from '@react-navigation/native'  
import { useAuth } from "../context/auth-context"  
import { inventoryService } from "../services/supabase/inventory-service"  
import ACCESOS_SERVICES from "../services/supabase/access-service"  
import USER_SERVICE from "../services/supabase/user-service"  
import { InventoryStackParamList } from '../types/navigation'  
import { InventoryItem, mapLegacyFields } from '../types/inventory'  
  
type InventoryItemDetailNavigationProp = StackNavigationProp<InventoryStackParamList, 'InventoryItemDetail'>  
type InventoryItemDetailRouteProp = RouteProp<InventoryStackParamList, 'InventoryItemDetail'>  
  
interface Props {  
  navigation: InventoryItemDetailNavigationProp  
  route: InventoryItemDetailRouteProp  
}  
  
interface SectionProps {  
  title: string  
  children: React.ReactNode  
}  
  
interface InfoRowProps {  
  label: string  
  value: string | number  
}  
  
const Section = ({ title, children }: SectionProps) => (  
  <View style={styles.section}>  
    <Text style={styles.sectionTitle}>{title}</Text>  
    {children}  
  </View>  
)  
  
const InfoRow = ({ label, value }: InfoRowProps) => (  
  <View style={styles.infoRow}>  
    <Text style={styles.infoLabel}>{label}:</Text>  
    <Text style={styles.infoValue}>{value}</Text>  
  </View>  
)  
  
export default function InventoryItemDetailScreen({ navigation, route }: Props) {  
  const { itemId } = route.params  
  const { user } = useAuth()  
    
  const [loading, setLoading] = useState(true)  
  const [saving, setSaving] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
  const [item, setItem] = useState<InventoryItem | null>(null)  
  const [showEditModal, setShowEditModal] = useState(false)  
    
  // Estados del formulario de edición  
  const [editForm, setEditForm] = useState({  
    producto: "",  
    proceso: "",  
    unidad_medida: "",  
    lugar_compra: "",  
    precio_unitario: 0,  
    cantidad: 0,  
  })  
  
  const loadItemData = useCallback(async () => {  
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
      // ✅ CORREGIDO: Usar 'role' en lugar de 'rol'  
      setUserRole(userPermissions?.role || 'client')  
  
      // Solo staff puede ver detalles de inventario  
      // ✅ CORREGIDO: Usar 'role' en lugar de 'rol'  
      if (userPermissions?.role === 'client') {  
        setError("No tienes permisos para ver detalles del inventario")  
        return  
      }  
  
      // Cargar datos del artículo  
      const itemData = await inventoryService.getInventoryItemById(itemId)  
        
      if (!itemData) {  
        setError("Artículo no encontrado")  
        return  
      }  
  
      // Mapear campos legacy para compatibilidad  
      const mappedItem = mapLegacyFields(itemData)  
      setItem(mappedItem)  
        
      // Inicializar formulario de edición  
      setEditForm({  
        producto: itemData.producto || "",  
        proceso: itemData.proceso || "",  
        unidad_medida: itemData.unidad_medida || "",  
        lugar_compra: itemData.lugar_compra || "",  
        precio_unitario: itemData.precio_unitario || 0,  
        cantidad: itemData.cantidad || 0,  
      })  
  
    } catch (error) {  
      console.error("Error loading item data:", error)  
      setError("No se pudieron cargar los datos del artículo")  
    } finally {  
      setLoading(false)  
    }  
  }, [itemId, user])  
  
  useFocusEffect(  
    useCallback(() => {  
      loadItemData()  
    }, [loadItemData])  
  )  
  
  const handleSaveChanges = async () => {  
    try {  
      setSaving(true)  
        
      await inventoryService.updateInventoryItem(itemId, editForm)  
        
      setShowEditModal(false)  
      loadItemData()  
        
      Alert.alert("Éxito", "Artículo actualizado correctamente")  
        
    } catch (error) {  
      console.error("Error updating item:", error)  
      Alert.alert("Error", "No se pudo actualizar el artículo")  
    } finally {  
      setSaving(false)  
    }  
  }  
  
  const handleDeleteItem = () => {  
    Alert.alert(  
      "Confirmar eliminación",  
      "¿Estás seguro de que quieres eliminar este artículo?",  
      [  
        { text: "Cancelar", style: "cancel" },  
        {  
          text: "Eliminar",  
          style: "destructive",  
          onPress: async () => {  
            try {  
              setSaving(true)  
              await inventoryService.deleteInventoryItem(itemId)  
              Alert.alert("Éxito", "Artículo eliminado correctamente")  
              navigation.goBack()  
            } catch (error) {  
              console.error("Error deleting item:", error)  
              Alert.alert("Error", "No se pudo eliminar el artículo")  
            } finally {  
              setSaving(false)  
            }  
          }  
        }  
      ]  
    )  
  }  
  
  const formatCurrency = (amount: number) => {  
    return amount.toLocaleString("es-ES", {  
      style: "currency",  
      currency: "USD",  
      minimumFractionDigits: 2,  
    })  
  }  
  
  const getStockStatus = () => {  
    if (!item) return { status: "unknown", color: "#666", text: "Desconocido" }  
      
    const stock = item.cantidad || 0  
    const minStock = item.minStock || 5  
      
    if (stock === 0) return { status: "out", color: "#f44336", text: "Agotado" }  
    if (stock <= minStock) return { status: "low", color: "#ff9800", text: "Stock Bajo" }  
    return { status: "ok", color: "#4caf50", text: "En Stock" }  
  }  
  
  if (loading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#1a73e8" />  
        <Text style={styles.loadingText}>Cargando artículo...</Text>  
      </View>  
    )  
  }  
  
  if (error) {  
    return (  
      <View style={styles.errorContainer}>  
        <MaterialIcons name="error" size={64} color="#f44336" />  
        <Text style={styles.errorText}>{error}</Text>  
        <TouchableOpacity style={styles.retryButton} onPress={loadItemData}>  
          <Text style={styles.retryButtonText}>Reintentar</Text>  
        </TouchableOpacity>  
      </View>  
    )  
  }  
  
  if (!item) return null  
  
  const stockStatus = getStockStatus()  
  
  return (  
    <SafeAreaView style={styles.container}>  
      {/* Header */}  
      <View style={styles.header}>  
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>  
          <Feather name="arrow-left" size={24} color="#333" />  
        </TouchableOpacity>  
        <Text style={styles.headerTitle}>Detalle del Artículo</Text>  
        {userRole !== 'client' && (  
          <TouchableOpacity  
            style={styles.editButton}  
            onPress={() => setShowEditModal(true)}  
          >  
            <Feather name="edit" size={24} color="#1a73e8" />  
          </TouchableOpacity>  
        )}  
      </View>  
  
      <ScrollView style={styles.content}>  
        {/* Información básica */}  
        <Section title="Información Básica">  
          <InfoRow label="Nombre" value={item.producto || "Sin nombre"} />  
          <InfoRow label="Código" value={item.id || "N/A"} />  
          {item.proceso && <InfoRow label="Proceso" value={item.proceso} />}  
          {item.categoria_nombre && <InfoRow label="Categoría" value={item.categoria_nombre} />}  
        </Section>  
  
        {/* Stock y precios */}  
        <Section title="Stock y Precios">  
          <View style={styles.stockRow}>  
            <Text style={styles.infoLabel}>Estado del Stock:</Text>  
            <View style={[styles.stockBadge, { backgroundColor: stockStatus.color }]}>  
              <Text style={styles.stockBadgeText}>{stockStatus.text}</Text>  
            </View>  
          </View>  
            
          <InfoRow   
            label="Cantidad Actual"   
            value={`${item.cantidad || 0} ${item.unidad_medida || 'unidades'}`}   
          />  
            
          {item.precio_unitario && (  
            <InfoRow label="Precio Unitario" value={formatCurrency(item.precio_unitario)} />  
          )}  
            
          {item.costo && (  
            <InfoRow label="Costo" value={formatCurrency(item.costo)} />  
          )}  
            
          {item.precio_unitario && item.costo && (  
            <InfoRow   
              label="Margen de Ganancia"   
              value={`${(((item.precio_unitario - item.costo) / item.costo) * 100).toFixed(1)}%`}   
            />  
          )}  
        </Section>  
  
        {/* Información adicional */}  
        {(item.proceso || item.lugar_compra) && (  
          <Section title="Información Adicional">  
            {item.proceso && (  
              <View style={styles.descriptionContainer}>  
                <Text style={styles.descriptionLabel}>Descripción:</Text>  
                <Text style={styles.descriptionText}>{item.proceso}</Text>  
              </View>  
            )}  
            {item.lugar_compra && <InfoRow label="Proveedor" value={item.lugar_compra} />}  
          </Section>  
        )}  
  
        {/* Acciones */}  
        {userRole !== 'client' && (  
          <Section title="Acciones">  
            <TouchableOpacity  
              style={styles.actionButton}  
              onPress={() => setShowEditModal(true)}  
            >  
              <Feather name="edit" size={20} color="#1a73e8" />  
              <Text style={styles.actionButtonText}>Editar Artículo</Text>  
            </TouchableOpacity>  
              
            <TouchableOpacity  
              style={[styles.actionButton, styles.deleteButton]}  
              onPress={handleDeleteItem}  
            >  
              <Feather name="trash-2" size={20} color="#f44336" />  
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>  
                Eliminar Artículo  
              </Text>  
            </TouchableOpacity>  
          </Section>  
        )}  
      </ScrollView>  
  
      {/* Modal de edición */}  
      <Modal  
        visible={showEditModal}  
        animationType="slide"  
        presentationStyle="pageSheet"  
      >  
        <View style={styles.modalContainer}>  
          <View style={styles.modalHeader}>  
            <Text style={styles.modalTitle}>Editar Artículo</Text>  
            <TouchableOpacity  
              onPress={() => setShowEditModal(false)}  
              style={styles.closeButton}  
            >  
              <Feather name="x" size={24} color="#666" />  
            </TouchableOpacity>  
          </View>  
  
          <ScrollView style={styles.modalContent}>  
            <View style={styles.formGroup}>  
              <Text style={styles.formLabel}>Nombre del Producto *</Text>  
              <TextInput  
                style={styles.formInput}  
                value={editForm.producto}  
                onChangeText={(text) => setEditForm(prev => ({ ...prev, producto: text }))}  
                placeholder="Nombre del producto"  
              />  
            </View>  
  
            <View style={styles.formGroup}>  
              <Text style={styles.formLabel}>Proceso/Descripción</Text>  
              <TextInput  
                style={[styles.formInput, styles.textArea]}  
                value={editForm.proceso}  
                onChangeText={(text) => setEditForm(prev => ({ ...prev, proceso: text }))}  
                placeholder="Descripción del proceso"  
                multiline  
                numberOfLines={3}  
              />  
            </View>  
  
            <View style={styles.formGroup}>  
              <Text style={styles.formLabel}>Unidad de Medida</Text>  
              <TextInput  
                style={styles.formInput}  
                value={editForm.unidad_medida}  
                onChangeText={(text) => setEditForm(prev => ({ ...prev, unidad_medida: text }))}  
                placeholder="ej: unidades, litros, kg"  
              />  
            </View>  
  
            <View style={styles.formGroup}>  
              <Text style={styles.formLabel}>Proveedor</Text>  
              <TextInput  
                style={styles.formInput}  
                value={editForm.lugar_compra}  
                onChangeText={(text) => setEditForm(prev => ({ ...prev, lugar_compra: text }))}  
                placeholder="Nombre del proveedor"  
              />  
            </View>  
  
            <View style={styles.formRow}>  
              <View style={styles.formGroupHalf}>  
                <Text style={styles.formLabel}>Precio Unitario *</Text>  
                <TextInput  
                  style={styles.formInput}  
                  value={editForm.precio_unitario.toString()}  
                  onChangeText={(text) => setEditForm(prev => ({   
                    ...prev,   
                    precio_unitario: parseFloat(text) || 0   
                  }))}  
                  placeholder="0.00"  
                  keyboardType="numeric"  
                />  
              </View>  
  
              <View style={styles.formGroupHalf}> 
                <Text style={styles.formLabel}>Cantidad</Text>  
                <TextInput  
                  style={styles.formInput}  
                  value={editForm.cantidad.toString()}  
                  onChangeText={(text) => setEditForm(prev => ({   
                    ...prev,   
                    cantidad: parseInt(text) || 0   
                  }))}  
                  placeholder="0"  
                  keyboardType="numeric"  
                />  
              </View>  
            </View>  
          </ScrollView>  
  
          <View style={styles.modalFooter}>  
            <TouchableOpacity  
              style={styles.cancelButton}  
              onPress={() => setShowEditModal(false)}  
              disabled={saving}  
            >  
              <Text style={styles.cancelButtonText}>Cancelar</Text>  
            </TouchableOpacity>  
  
            <TouchableOpacity  
              style={styles.saveButton}  
              onPress={handleSaveChanges}  
              disabled={saving}  
            >  
              {saving ? (  
                <ActivityIndicator size="small" color="#fff" />  
              ) : (  
                <Text style={styles.saveButtonText}>Guardar</Text>  
              )}  
            </TouchableOpacity>  
          </View>  
        </View>  
      </Modal>  
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
    justifyContent: "space-between",  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    backgroundColor: "#fff",  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  backButton: {  
    padding: 8,  
  },  
  headerTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
    flex: 1,  
    textAlign: "center",  
  },  
  editButton: {  
    padding: 8,  
  },  
  content: {  
    flex: 1,  
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
    marginBottom: 12,  
  },  
  infoRow: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    paddingVertical: 8,  
    borderBottomWidth: 1,  
    borderBottomColor: "#f0f0f0",  
  },  
  infoLabel: {  
    fontSize: 14,  
    color: "#666",  
    fontWeight: "500",  
  },  
  infoValue: {  
    fontSize: 14,  
    color: "#333",  
    fontWeight: "600",  
    textAlign: "right",  
    flex: 1,  
    marginLeft: 12,  
  },  
  stockRow: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    paddingVertical: 8,  
    marginBottom: 8,  
  },  
  stockBadge: {  
    paddingHorizontal: 12,  
    paddingVertical: 6,  
    borderRadius: 12,  
  },  
  stockBadgeText: {  
    color: "#fff",  
    fontSize: 12,  
    fontWeight: "bold",  
  },  
  descriptionContainer: {  
    paddingVertical: 8,  
  },  
  descriptionLabel: {  
    fontSize: 14,  
    color: "#666",  
    fontWeight: "500",  
    marginBottom: 4,  
  },  
  descriptionText: {  
    fontSize: 14,  
    color: "#333",  
    lineHeight: 20,  
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
  deleteButton: {  
    backgroundColor: "#fff5f5",  
    borderColor: "#fed7d7",  
  },  
  actionButtonText: {  
    fontSize: 16,  
    color: "#1a73e8",  
    fontWeight: "500",  
    marginLeft: 8,  
  },  
  deleteButtonText: {  
    color: "#f44336",  
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
  formGroup: {  
    marginBottom: 16,  
  },  
  formGroupHalf: {  
    flex: 1,  
    marginHorizontal: 4,  
  },  
  formRow: {  
    flexDirection: "row",  
    marginHorizontal: -4,  
  },  
  formLabel: {  
    fontSize: 14,  
    fontWeight: "600",  
    color: "#333",  
    marginBottom: 8,  
  },  
  formInput: {  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
    borderRadius: 8,  
    paddingHorizontal: 12,  
    paddingVertical: 10,  
    fontSize: 16,  
    color: "#333",  
    backgroundColor: "#fff",  
  },  
  textArea: {  
    minHeight: 80,  
    textAlignVertical: "top",  
  },  
  modalFooter: {  
    flexDirection: "row",  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    borderTopWidth: 1,  
    borderTopColor: "#e1e4e8",  
    gap: 12,  
  },  
  cancelButton: {  
    flex: 1,  
    paddingVertical: 12,  
    borderRadius: 8,  
    backgroundColor: "#f5f5f5",  
    alignItems: "center",  
  },  
  cancelButtonText: {  
    fontSize: 16,  
    color: "#666",  
    fontWeight: "500",  
  },  
  saveButton: {  
    flex: 1,  
    paddingVertical: 12,  
    borderRadius: 8,  
    backgroundColor: "#1a73e8",  
    alignItems: "center",  
  },  
  saveButtonText: {  
    fontSize: 16,  
    color: "#fff",  
    fontWeight: "bold",  
  },  
})