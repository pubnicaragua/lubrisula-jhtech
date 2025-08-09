"use client"  
  
import { useState, useCallback, useEffect } from "react"  
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
import { useAuth } from "../context/auth-context"  
// Importaciones corregidas para usar servicios de Supabase  
import * as inventoryService from "../services/supabase/inventory-service"  
import * as accessService from "../services/supabase/access-service"  
import * as userService from "../services/supabase/user-service"  
  
// Tipos TypeScript para resolver errores  
interface SectionProps {  
  title: string  
  children: React.ReactNode  
}  
  
interface InfoRowProps {  
  label: string  
  value: string | number  
}  
  
interface HistoryItemProps {  
  history: InventoryHistoryType[]  
}  
  
interface InventoryItemType {  
  id: string  
  nombre: string  
  codigo: string  
  descripcion?: string  
  stock_actual: number  
  stock_minimo?: number  
  stock_maximo?: number  
  precio_compra?: number  
  precio_venta?: number  
  categoria?: string  
  proveedor?: string  
  ubicacion?: string  
  fecha_creacion?: string  
  fecha_actualizacion?: string  
  activo?: boolean  
}  
  
interface InventoryHistoryType {  
  id: string  
  inventory_item_id: string  
  tipo: 'entrada' | 'salida' | 'ajuste'  
  cantidad: number  
  motivo?: string  
  fecha: string  
  usuario_id?: string  
  usuario_nombre?: string  
}  
  
interface InventoryItemDetailScreenProps {  
  route: any  
  navigation: any  
}  
  
// Componente para sección  
const Section = ({ title, children }: SectionProps) => (  
  <View style={styles.section}>  
    <Text style={styles.sectionTitle}>{title}</Text>  
    {children}  
  </View>  
)  
  
// Componente para fila de información  
const InfoRow = ({ label, value }: InfoRowProps) => (  
  <View style={styles.infoRow}>  
    <Text style={styles.infoLabel}>{label}:</Text>  
    <Text style={styles.infoValue}>{value}</Text>  
  </View>  
)  
  
// Componente para historial  
const HistorySection = ({ history }: HistoryItemProps) => (  
  <Section title="Historial de Movimientos">  
    {history.length > 0 ? (  
      history.map((item, index) => (  
        <View key={index} style={styles.historyItem}>  
          <View style={styles.historyHeader}>  
            <View style={[  
              styles.historyTypeIndicator,  
              { backgroundColor: getHistoryTypeColor(item.tipo) }  
            ]} />  
            <Text style={styles.historyType}>{getHistoryTypeLabel(item.tipo)}</Text>  
            <Text style={styles.historyDate}>  
              {new Date(item.fecha).toLocaleDateString("es-ES")}  
            </Text>  
          </View>  
          <Text style={styles.historyQuantity}>  
            {item.tipo === 'salida' ? '-' : '+'}{item.cantidad} unidades  
          </Text>  
          {item.motivo && (  
            <Text style={styles.historyReason}>{item.motivo}</Text>  
          )}  
          {item.usuario_nombre && (  
            <Text style={styles.historyUser}>Por: {item.usuario_nombre}</Text>  
          )}  
        </View>  
      ))  
    ) : (  
      <Text style={styles.emptyText}>No hay movimientos registrados</Text>  
    )}
      </Section>  
)  
  
// Funciones auxiliares para el historial  
const getHistoryTypeColor = (tipo: string) => {  
  switch (tipo) {  
    case 'entrada':  
      return '#4caf50'  
    case 'salida':  
      return '#f44336'  
    case 'ajuste':  
      return '#ff9800'  
    default:  
      return '#666'  
  }  
}  
  
const getHistoryTypeLabel = (tipo: string) => {  
  switch (tipo) {  
    case 'entrada':  
      return 'Entrada'  
    case 'salida':  
      return 'Salida'  
    case 'ajuste':  
      return 'Ajuste'  
    default:  
      return tipo  
  }  
}  
  
export default function InventoryItemDetailScreen({ route, navigation }: InventoryItemDetailScreenProps) {  
  const { itemId } = route.params  
  const { user } = useAuth()  
    
  const [item, setItem] = useState<InventoryItemType | null>(null)  
  const [history, setHistory] = useState<InventoryHistoryType[]>([])  
  const [loading, setLoading] = useState(true)  
  const [saving, setSaving] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
    
  // Estados del modal de ajuste  
  const [showAdjustModal, setShowAdjustModal] = useState(false)  
  const [adjustType, setAdjustType] = useState<'entrada' | 'salida'>('entrada')  
  const [adjustQuantity, setAdjustQuantity] = useState('')  
  const [adjustReason, setAdjustReason] = useState('')  
  
  // Cargar datos del item  
  const loadItemData = useCallback(async () => {  
    try {  
      setLoading(true)  
      setError(null)  
  
      if (!user?.id) return  
  
      // Validar permisos del usuario  
      const userTallerId = await userService.getTallerId(user.id)  
      const userPermissions = await accessService.getUserPermissions(user.id, userTallerId)  
      setUserRole(userPermissions?.rol || 'client')  
  
      if (userPermissions?.rol === 'client') {  
        setError("No tienes permisos para ver detalles de inventario")  
        return  
      }  
  
      // Cargar item del inventario  
      const itemData = await inventoryService.getInventoryItemById(itemId)  
      if (!itemData) {  
        setError("Item no encontrado")  
        return  
      }  
  
      setItem(itemData)  
  
      // Cargar historial de movimientos  
      const itemHistory = await inventoryService.getInventoryHistory(itemId)  
      setHistory(itemHistory)  
  
    } catch (error) {  
      console.error("Error loading item data:", error)  
      setError("No se pudieron cargar los datos del item")  
    } finally {  
      setLoading(false)  
    }  
  }, [itemId, user])  
  
  useFocusEffect(  
    useCallback(() => {  
      loadItemData()  
    }, [loadItemData])  
  )  
  
  // Validar formulario de ajuste  
  const validateAdjustForm = () => {  
    if (!adjustQuantity || isNaN(parseInt(adjustQuantity)) || parseInt(adjustQuantity) <= 0) {  
      Alert.alert("Error", "Ingresa una cantidad válida")  
      return false  
    }  
  
    if (adjustType === 'salida' && item && parseInt(adjustQuantity) > item.stock_actual) {  
      Alert.alert("Error", "No puedes sacar más stock del disponible")  
      return false  
    }  
  
    if (!adjustReason.trim()) {  
      Alert.alert("Error", "Debes proporcionar una razón para el ajuste")  
      return false  
    }  
  
    return true  
  }  
  
  // Realizar ajuste de inventario  
  const handleAdjustInventory = async () => {  
    if (!validateAdjustForm() || !item) return  
  
    try {  
      setSaving(true)  
  
      const quantity = parseInt(adjustQuantity)  
      const newStock = adjustType === 'entrada'   
        ? item.stock_actual + quantity   
        : item.stock_actual - quantity  
  
      // Actualizar stock en la base de datos  
      await inventoryService.updateInventoryItem(itemId, {  
        stock_actual: newStock  
      })  
  
      // Registrar movimiento en el historial  
      await inventoryService.addInventoryMovement({  
        inventory_item_id: itemId,  
        tipo: adjustType,  
        cantidad: quantity,  
        motivo: adjustReason.trim(),  
        fecha: new Date().toISOString(),  
        usuario_id: user?.id  
      })  
  
      // Recargar datos  
      loadItemData()  
        
      // Cerrar modal y limpiar formulario  
      setShowAdjustModal(false)  
      setAdjustQuantity('')  
      setAdjustReason('')  
        
      Alert.alert("Éxito", "Inventario ajustado correctamente")  
  
    } catch (error) {  
      console.error("Error adjusting inventory:", error)  
      Alert.alert("Error", "No se pudo ajustar el inventario")  
    } finally {  
      setSaving(false)  
    }  
  }  
  
  // Obtener color del stock  
  const getStockColor = () => {  
    if (!item) return '#666'  
      
    if (item.stock_actual <= 0) return '#f44336' // Rojo - Sin stock  
    if (item.stock_minimo && item.stock_actual <= item.stock_minimo) return '#ff9800' // Naranja - Bajo stock  
    return '#4caf50' // Verde - Stock normal  
  }  
  
  // Obtener estado del stock  
  const getStockStatus = () => {  
    if (!item) return 'Desconocido'  
      
    if (item.stock_actual <= 0) return 'Sin Stock'  
    if (item.stock_minimo && item.stock_actual <= item.stock_minimo) return 'Stock Bajo'  
    return 'Stock Normal'  
  }  
  
  if (loading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#1a73e8" />  
        <Text style={styles.loadingText}>Cargando item...</Text>  
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
  
  return (  
    <SafeAreaView style={styles.container}>  
      <View style={styles.header}>  
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>  
          <Feather name="arrow-left" size={24} color="#333" />  
        </TouchableOpacity>  
        <Text style={styles.headerTitle}>Detalle de Item</Text>  
        <TouchableOpacity   
          style={styles.editButton}  
          onPress={() => navigation.navigate("EditInventoryItem", { itemId: item.id })}  
        >  
          <Feather name="edit-2" size={24} color="#1a73e8" />  
        </TouchableOpacity>  
      </View>  
  
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>  
        {/* Header del item */}  
        <View style={styles.itemHeader}>  
          <View style={styles.itemInfo}>  
            <Text style={styles.itemName}>{item.nombre}</Text>  
            <Text style={styles.itemCode}>Código: {item.codigo}</Text>  
            <Text style={[styles.stockStatus, { color: getStockColor() }]}>  
              {getStockStatus()}  
            </Text>  
          </View>  
          <View style={[styles.stockBadge, { backgroundColor: getStockColor() }]}>  
            <Text style={styles.stockText}>{item.stock_actual}</Text>  
          </View>  
        </View>  
  
        {/* Botones de acción */}  
        <View style={styles.actionButtons}>  
          <TouchableOpacity  
            style={styles.actionButton}  
            onPress={() => setShowAdjustModal(true)}  
          >  
            <Feather name="refresh-cw" size={20} color="#1a73e8" />  
            <Text style={styles.actionButtonText}>Ajustar Stock</Text>  
          </TouchableOpacity>  
            
          <TouchableOpacity  
            style={styles.actionButton}  
            onPress={() => navigation.navigate("OrderParts", { preselectedItem: item })}  
          >  
            <Feather name="shopping-cart" size={20} color="#1a73e8" />  
            <Text style={styles.actionButtonText}>Usar en Orden</Text>  
          </TouchableOpacity>  
        </View>  
  
        {/* Información general */}  
        <Section title="Información General">  
          <InfoRow label="Nombre" value={item.nombre} />  
          <InfoRow label="Código" value={item.codigo} />  
          {item.categoria && <InfoRow label="Categoría" value={item.categoria} />}  
          {item.proveedor && <InfoRow label="Proveedor" value={item.proveedor} />}  
          {item.ubicacion && <InfoRow label="Ubicación" value={item.ubicacion} />}  
        </Section>  
  
        {/* Información de stock */}  
        <Section title="Stock e Inventario">  
          <InfoRow label="Stock Actual" value={`${item.stock_actual} unidades`} />  
          {item.stock_minimo && <InfoRow label="Stock Mínimo" value={`${item.stock_minimo} unidades`} />}  
          {item.stock_maximo && <InfoRow label="Stock Máximo" value={`${item.stock_maximo} unidades`} />}  
          <InfoRow label="Estado" value={getStockStatus()} />  
        </Section>  
  
        {/* Información de precios */}  
        <Section title="Precios">  
          {item.precio_compra && <InfoRow label="Precio de Compra" value={`$${item.precio_compra.toFixed(2)}`} />}  
          {item.precio_venta && <InfoRow label="Precio de Venta" value={`$${item.precio_venta.toFixed(2)}`} />}  
          {item.precio_compra && item.precio_venta && (  
            <InfoRow   
              label="Margen"   
              value={`${(((item.precio_venta - item.precio_compra) / item.precio_compra) * 100).toFixed(1)}%`}   
            />  
          )}  
        </Section>  
  
        {/* Descripción */}  
        {item.descripcion && (  
          <Section title="Descripción">  
            <Text style={styles.descriptionText}>{item.descripcion}</Text>  
          </Section>  
        )}  
  
        {/* Historial de movimientos */}  
        <HistorySection history={history} />  
      </ScrollView>  
  
      {/* Modal de ajuste de inventario */}  
      <Modal  
        visible={showAdjustModal}  
        animationType="slide"  
        transparent={true}  
        onRequestClose={() => setShowAdjustModal(false)}  
      >  
        <View style={styles.modalOverlay}>  
          <View style={styles.modalContainer}>  
            <View style={styles.modalHeader}>  
              <Text style={styles.modalTitle}>Ajustar Inventario</Text>  
              <TouchableOpacity onPress={() => setShowAdjustModal(false)}>  
                <Feather name="x" size={24} color="#333" />  
              </TouchableOpacity>  
            </View>  
  
            <View style={styles.modalContent}>  
              <Text style={styles.modalItemName}>{item.nombre}</Text>  
              <Text style={styles.modalItemCode}>Stock actual: {item.stock_actual} unidades</Text>  
  
              {/* Tipo de ajuste */}  
              <View style={styles.adjustTypeContainer}>  
                <TouchableOpacity  
                  style={[  
                    styles.adjustTypeButton,  
                    adjustType === 'entrada' && styles.adjustTypeButtonActive,  
                    { borderColor: '#4caf50' }  
                  ]}  
                  onPress={() => setAdjustType('entrada')}  
                >  
                  <Feather name="plus-circle" size={20} color={adjustType === 'entrada' ? '#4caf50' : '#666'} />  
                  <Text style={[  
                    styles.adjustTypeText,  
                    adjustType === 'entrada' && { color: '#4caf50' }  
                  ]}>  
                    Entrada  
                  </Text>  
                </TouchableOpacity>  
  
                <TouchableOpacity  
                  style={[  
                    styles.adjustTypeButton,  
                    adjustType === 'salida' && styles.adjustTypeButtonActive,  
                    { borderColor: '#f44336' }  
                  ]}  
                  onPress={() => setAdjustType('salida')}  
                >  
                  <Feather name="minus-circle" size={20} color={adjustType === 'salida' ? '#f44336' : '#666'} />  
                  <Text style={[  
                    styles.adjustTypeText,  
                    adjustType === 'salida' && { color: '#f44336' }  
                  ]}>  
                    Salida  
                  </Text>  
                </TouchableOpacity>  
              </View>  
  
              {/* Cantidad */}  
              <View style={styles.inputGroup}>  
                <Text style={styles.inputLabel}>Cantidad</Text>  
                <TextInput  
                  style={styles.input}  
                  placeholder="Ingresa la cantidad"  
                  value={adjustQuantity}  
                  onChangeText={setAdjustQuantity}  
                  keyboardType="numeric"  
                />  
              </View>  
  
              {/* Razón */}  
              <View style={styles.inputGroup}>  
                <Text style={styles.inputLabel}>Razón del ajuste *</Text>  
                <TextInput  
                  style={styles.textArea}  
                  placeholder="Explica por qué realizas este ajuste..."  
                  value={adjustReason}  
                  onChangeText={setAdjustReason}  
                  multiline  
                  numberOfLines={3}  
                  textAlignVertical="top"  
                />  
              </View>  
            </View>  
  
            <View style={styles.modalFooter}>  
              <TouchableOpacity  
                style={styles.cancelButton}  
                onPress={() => setShowAdjustModal(false)}  
                disabled={saving}  
              >  
                <Text style={styles.cancelButtonText}>Cancelar</Text>  
              </TouchableOpacity>  
  
              <TouchableOpacity  
                style={styles.saveButton}  
                onPress={handleAdjustInventory}  
                disabled={saving}  
              >  
                {saving ? (  
                  <ActivityIndicator size="small" color="#fff" />  
                ) : (  
                  <Text style={styles.saveButtonText}>Ajustar</Text>  
                )}  
              </TouchableOpacity>  
            </View>  
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
  itemHeader: {  
    backgroundColor: "#fff",  
    borderRadius: 8,  
    padding: 16,  
    marginBottom: 16,  
    flexDirection: "row",  
    alignItems: "center",  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 1 },  
    shadowOpacity: 0.1,  
    shadowRadius: 2,  
    elevation: 2,  
  },  
  itemInfo: {  
    flex: 1,  
  },  
  itemName: {  
    fontSize: 20,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 4,  
  },  
  itemCode: {  
    fontSize: 14,  
    color: "#666",  
    marginBottom: 4,  
  },  
  stockStatus: {  
    fontSize: 14,  
    fontWeight: "500",  
  },  
  stockBadge: {  
    width: 60,  
    height: 60,  
    borderRadius: 30,  
    justifyContent: "center",  
    alignItems: "center",  
  },  
  stockText: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#fff",  
  },  
  actionButtons: {  
    flexDirection: "row",  
    gap: 12,  
    marginBottom: 16,  
  },  
  actionButton: {  
    flex: 1,  
    backgroundColor: "#fff",  
    borderRadius: 8,  
    padding: 16,  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "center",  
    gap: 8,  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 1 },  
    shadowOpacity: 0.1,  
    shadowRadius: 2,  
    elevation: 2,  
  },  
  actionButtonText: {  
    fontSize: 14,  
    fontWeight: "500",  
    color: "#1a73e8",  
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
  },  
  infoValue: {  
    fontSize: 14,  
    fontWeight: "500",  
    color: "#333",  
  },  
  descriptionText: {  
    fontSize: 14,  
    color: "#666",  
    lineHeight: 20,  
  },  
  historyItem: {  
    paddingVertical: 12,  
    borderBottomWidth: 1,  
    borderBottomColor: "#f0f0f0",  
  },  
  historyHeader: {  
    flexDirection: "row",  
    alignItems: "center",  
    marginBottom: 8,  
  },  
  historyTypeIndicator: {  
    width: 12,  
    height: 12,  
    borderRadius: 6,  
    marginRight: 8,  
  },  
  historyType: {  
    fontSize: 14,  
    fontWeight: "500",  
    color: "#333",  
    flex: 1,  
  },  
  historyDate: {  
    fontSize: 12,  
    color: "#666",  
  },  
  historyQuantity: {  
    fontSize: 14,  
    color: "#333",  
    marginBottom: 4,  
  },  
  historyReason: {  
    fontSize: 12,  
    color: "#666",  
    marginBottom: 2,  
  },  
  historyUser: {  
    fontSize: 12,  
    color: "#999",  
  },  
  emptyText: {  
    fontSize: 14,  
    color: "#999",  
    textAlign: "center",  
    fontStyle: "italic",  
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
  modalContent: {  
    marginBottom: 20,  
  },  
  modalItemName: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 4,  
  },  
  modalItemCode: {  
    fontSize: 14,  
    color: "#666",  
    marginBottom: 16,  
  },  
  adjustTypeContainer: {  
    flexDirection: "row",  
    gap: 12,  
    marginBottom: 16,  
  },  
  adjustTypeButton: {  
    flex: 1,  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "center",  
    paddingVertical: 12,  
    borderRadius: 8,  
    borderWidth: 2,  
    gap: 8,  
  },  
  adjustTypeButtonActive: {  
    backgroundColor: "#f8f9fa",  
  },  
  adjustTypeText: {  
    fontSize: 14,  
    fontWeight: "500",  
    color: "#666",  
  },  
  inputGroup: {  
    marginBottom: 16,  
  },  
  inputLabel: {  
    fontSize: 14,  
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
  textArea: {  
    backgroundColor: "#f8f9fa",  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
    borderRadius: 8,  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    fontSize: 16,  
    color: "#333",  
    height: 80,  
    textAlignVertical: "top",  
  },  
  modalFooter: {  
    flexDirection: "row",  
    gap: 12,  
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
  saveButton: {  
    flex: 1,  
    backgroundColor: "#1a73e8",  
    borderRadius: 8,  
    paddingVertical: 12,  
    alignItems: "center",  
  },  
  saveButtonText: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#fff",  
  },  
})