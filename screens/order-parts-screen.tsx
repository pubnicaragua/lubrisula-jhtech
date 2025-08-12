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
  Modal,  
  FlatList,  
  TextInput,  
  SafeAreaView,  
  RefreshControl,  
} from "react-native"  
import { Feather } from "@expo/vector-icons"  
import { useFocusEffect } from "@react-navigation/native"  
import { useAuth } from "../context/auth-context"  
// Usar los servicios que realmente existen  
import * as orderService from "../services/supabase/order-service"  
import * as inventoryService from "../services/supabase/inventory-service"  
// Importar tipos consolidados
import type { Order, OrderItem, OrderType, OrderPartType } from "../types"

// Tipos TypeScript para resolver errores  
interface OrderPartsScreenProps {  
  route: any  
  navigation: any  
}  

// Usar tipos consolidados en lugar de interfaces locales
// interface OrderType { ... } - ELIMINADO
// interface OrderPartType { ... } - ELIMINADO

interface InventoryItemType {  
  id: string  
  name: string  
  sku: string  
  description?: string  
  stock: number  
  priceUSD?: number  
  category?: string  
}  

export default function OrderPartsScreen({ route, navigation }: OrderPartsScreenProps) {  
  const { orderId } = route.params  
  const { user } = useAuth()  
    
  const [order, setOrder] = useState<Order | null>(null)  
  const [orderParts, setOrderParts] = useState<OrderItem[]>([])  
  const [inventory, setInventory] = useState<InventoryItemType[]>([])  
  const [loading, setLoading] = useState(true)  
  const [saving, setSaving] = useState(false)  
  const [refreshing, setRefreshing] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  
  // Estados del modal  
  const [showAddPartModal, setShowAddPartModal] = useState(false)  
  const [searchQuery, setSearchQuery] = useState("")  
  const [filteredInventory, setFilteredInventory] = useState<InventoryItemType[]>([])  
  
  // Cargar datos de la orden y repuestos  
  const loadOrderData = useCallback(async () => {  
    try {  
      setLoading(true)  
      setRefreshing(true)  
      setError(null)  
  
      if (!user?.id) return  
  
      // Verificar permisos básicos  
      if (user.role === 'client') {  
        setError("No tienes permisos para gestionar repuestos de órdenes")  
        return  
      }  
  
      // Cargar datos de la orden usando el servicio existente  
      const orderData = await orderService.orderService.getOrderById(orderId)  
      if (!orderData) {  
        setError("Orden no encontrada")  
        return  
      }  
      setOrder(orderData)  
  
      // Cargar repuestos de la orden  
      const parts = await orderService.orderService.getOrderParts(orderId)  
      setOrderParts(parts)  
  
      // Cargar inventario disponible usando el servicio existente  
      const inventoryItems = await inventoryService.inventoryService.getInventoryItems()  
      const availableItems = inventoryItems.filter((item: InventoryItemType) => item.stock > 0)  
      setInventory(availableItems)  
      setFilteredInventory(availableItems)  
  
    } catch (error) {  
      console.error("Error loading order data:", error)  
      setError("No se pudieron cargar los datos de la orden")  
    } finally {  
      setLoading(false)  
      setRefreshing(false)  
    }  
  }, [orderId, user])  
  
  useFocusEffect(  
    useCallback(() => {  
      loadOrderData()  
    }, [loadOrderData])  
  )  
  
  // Filtrar inventario  
  const filterInventory = (query: string) => {  
    setSearchQuery(query)  
    if (!query.trim()) {  
      setFilteredInventory(inventory)  
    } else {  
      const filtered = inventory.filter((item: InventoryItemType) =>  
        item.name.toLowerCase().includes(query.toLowerCase()) ||  
        item.sku.toLowerCase().includes(query.toLowerCase()) ||  
        (item.category && item.category.toLowerCase().includes(query.toLowerCase()))  
      )  
      setFilteredInventory(filtered)  
    }  
  }  
  
  // Agregar repuesto a la orden  
  const addPartToOrder = async (inventoryItem: InventoryItemType) => {  
    try {  
      setSaving(true)  
        
      const quantity = 1  
      const unitPrice = inventoryItem.priceUSD || 0  
        
      // Verificar stock disponible  
      if (quantity > inventoryItem.stock) {  
        Alert.alert("Error", "No hay suficiente stock disponible")  
        return  
      }  
  
      // Agregar repuesto a la orden  
      await orderService.orderService.addPartToOrder(orderId, {  
        name: inventoryItem.name,
        quantity: quantity,  
        unitPrice: unitPrice,
        total: quantity * unitPrice,
        status: 'pending',
        partNumber: inventoryItem.sku,
        inventoryItemId: inventoryItem.id,
        sku: inventoryItem.sku,
        category: inventoryItem.category,
        stock: inventoryItem.stock
      })  
  
      // Actualizar inventario  
      await inventoryService.inventoryService.updateInventoryItem(inventoryItem.id, {  
        stock: inventoryItem.stock - quantity,  
      })  
  
      // Recargar datos  
      loadOrderData()  
      setShowAddPartModal(false)  
        
      Alert.alert("Éxito", "Repuesto agregado correctamente")  
  
    } catch (error) {  
      console.error("Error adding part to order:", error)  
      Alert.alert("Error", "No se pudo agregar el repuesto")  
    } finally {  
      setSaving(false)  
    }  
  }  
  
  // Actualizar cantidad de repuesto  
  const updatePartQuantity = async (partId: string, newQuantity: number) => {  
    if (newQuantity < 1) return  
  
    try {  
      setSaving(true)  
  
      const part = orderParts.find(p => p.id === partId)  
      if (!part) return  
  
      const quantityDiff = newQuantity - part.quantity  
        
      // Verificar stock disponible si se aumenta la cantidad  
      if (quantityDiff > 0) {  
        const inventoryItem = inventory.find(item => item.id === part.inventoryItemId)  
        if (!inventoryItem || quantityDiff > inventoryItem.stock) {  
          Alert.alert("Error", "No hay suficiente stock disponible")  
          return  
        }  
      }  
  
      // Actualizar repuesto en la orden  
      await orderService.orderService.updateOrderPart(partId, {  
        quantity: newQuantity,  
        total: newQuantity * part.unitPrice,  
      })  
  
      // Actualizar inventario si hay cambio en cantidad  
      if (quantityDiff !== 0) {  
        const inventoryItem = inventory.find(item => item.id === part.inventoryItemId)  
        if (inventoryItem) {  
          await inventoryService.inventoryService.updateInventoryItem(inventoryItem.id, {  
            stock: inventoryItem.stock - quantityDiff,  
          })  
        }  
      }  
  
      // Recargar datos  
      loadOrderData()  
  
    } catch (error) {  
      console.error("Error updating part quantity:", error)  
      Alert.alert("Error", "No se pudo actualizar la cantidad")  
    } finally {  
      setSaving(false)  
    }  
  }  
  
  // Remover repuesto de la orden  
  const removePartFromOrder = async (partId: string) => {  
    Alert.alert(  
      "Confirmar",  
      "¿Estás seguro de que quieres remover este repuesto?",  
      [  
        { text: "Cancelar", style: "cancel" },  
        {  
          text: "Remover",  
          style: "destructive",  
          onPress: async () => {  
            try {  
              setSaving(true)  
  
              const part = orderParts.find(p => p.id === partId)  
              if (!part) return  
  
              // Remover repuesto de la orden  
              await orderService.orderService.removePartFromOrder(partId)  
  
              // Devolver stock al inventario  
              const inventoryItem = inventory.find(item => item.id === part.inventoryItemId)  
              if (inventoryItem) {  
                await inventoryService.inventoryService.updateInventoryItem(inventoryItem.id, {  
                  stock: inventoryItem.stock + part.quantity,  
                })  
              }  
  
              // Recargar datos  
              loadOrderData()  
                
              Alert.alert("Éxito", "Repuesto removido correctamente")  
  
            } catch (error) {  
              console.error("Error removing part from order:", error)  
              Alert.alert("Error", "No se pudo remover el repuesto")  
            } finally {  
              setSaving(false)  
            }  
          },  
        },  
      ]  
    )  
  }  
  
  // Calcular total  
  const calculateTotal = () => {  
    return orderParts.reduce((sum, part) => sum + part.total, 0)  
  }  
  
  // Renderizar item de repuesto en la orden  
  const renderOrderPartItem = ({ item }: { item: OrderItem }) => (  
    <View style={styles.partCard}>  
      <View style={styles.partHeader}>  
        <View style={styles.partInfo}>  
          <Text style={styles.partName}>{item.name}</Text>  
          <Text style={styles.partCode}>Código: {item.sku}</Text>  
        </View>  
        <TouchableOpacity  
          style={styles.removeButton}  
          onPress={() => removePartFromOrder(item.id)}  
          disabled={saving}  
        >  
          <Feather name="trash-2" size={20} color="#e53935" />  
        </TouchableOpacity>  
      </View>  
  
      <View style={styles.partDetails}>  
        <View style={styles.quantityContainer}>  
          <Text style={styles.quantityLabel}>Cantidad:</Text>  
          <View style={styles.quantityControls}>  
            <TouchableOpacity  
              style={styles.quantityButton}  
              onPress={() => updatePartQuantity(item.id, item.quantity - 1)}  
              disabled={saving || item.quantity <= 1}  
            >  
              <Feather name="minus" size={16} color="#666" />  
            </TouchableOpacity>  
              
            <Text style={styles.quantityText}>{item.quantity}</Text>  
              
            <TouchableOpacity  
              style={styles.quantityButton}  
              onPress={() => updatePartQuantity(item.id, item.quantity + 1)}  
              disabled={saving}  
            >  
              <Feather name="plus" size={16} color="#666" />  
            </TouchableOpacity>  
          </View>  
        </View>  
  
        <View style={styles.priceContainer}>  
          <Text style={styles.priceLabel}>Precio unitario:</Text>  
          <Text style={styles.priceValue}>${item.unitPrice.toFixed(2)}</Text>  
        </View>  
  
        <View style={styles.subtotalContainer}>  
          <Text style={styles.subtotalLabel}>Subtotal:</Text>  
          <Text style={styles.subtotalValue}>${item.total.toFixed(2)}</Text>  
        </View>  
      </View>  
    </View>  
  )  
  
  // Renderizar item de inventario disponible  
  const renderInventoryItem = ({ item }: { item: InventoryItemType }) => (  
    <TouchableOpacity  
      style={styles.inventoryItem}  
      onPress={() => addPartToOrder(item)}  
    >  
      <View style={styles.inventoryItemInfo}>  
        <Text style={styles.inventoryItemName}>{item.name}</Text>  
        <Text style={styles.inventoryItemCode}>Código: {item.sku}</Text>  
        <View style={styles.inventoryItemDetails}>  
          <Text style={styles.inventoryItemCategory}>{item.category}</Text>  
          <Text style={styles.inventoryItemStock}>  
            Stock: <Text style={item.stock <= 5 ? styles.lowStock : styles.normalStock}>  
              {item.stock}  
            </Text>  
          </Text>  
        </View>  
      </View>  
      <View style={styles.inventoryItemPrice}>  
        <Text style={styles.priceText}>${(item.priceUSD || 0).toFixed(2)}</Text>  
        <Feather name="plus-circle" size={20} color="#1a73e8" />  
      </View>  
    </TouchableOpacity>  
  )  
  
  // Renderizar modal de agregar repuesto  
  const renderAddPartModal = () => (  
    <Modal  
      visible={showAddPartModal}  
      animationType="slide"  
      transparent={true}  
      onRequestClose={() => setShowAddPartModal(false)}  
    >  
      <View style={styles.modalOverlay}>  
        <View style={styles.modalContainer}>  
          <View style={styles.modalHeader}>  
            <Text style={styles.modalTitle}>Agregar Repuesto</Text>  
            <TouchableOpacity onPress={() => setShowAddPartModal(false)}>  
              <Feather name="x" size={24} color="#333" />  
            </TouchableOpacity>  
          </View>  
  
          <View style={styles.searchContainer}>  
            <Feather name="search" size={20} color="#666" />  
            <TextInput  
              style={styles.searchInput}  
              placeholder="Buscar repuesto..."  
              value={searchQuery}  
              onChangeText={filterInventory}  
            />  
          </View>  
  
          <FlatList  
            data={filteredInventory}  
            keyExtractor={(item) => item.id}  
            renderItem={renderInventoryItem}  
            ListEmptyComponent={  
              <View style={styles.emptyList}>  
                <Text style={styles.emptyListText}>No se encontraron repuestos</Text>  
              </View>  
            }  
            style={styles.inventoryList}  
          />  
        </View>  
      </View>  
    </Modal>  
  )  
  
  if (loading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#1a73e8" />  
        <Text style={styles.loadingText}>Cargando repuestos...</Text>  
      </View>  
    )  
  }  
  
  if (error) {  
    return (  
      <View style={styles.errorContainer}>  
        <Feather name="alert-circle" size={64} color="#f44336" />  
        <Text style={styles.errorText}>{error}</Text>  
        <TouchableOpacity style={styles.retryButton} onPress={loadOrderData}>  
          <Text style={styles.retryButtonText}>Reintentar</Text>          
        </TouchableOpacity>  
        <TouchableOpacity style={styles.retryButton} onPress={loadOrderData}>  
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
        <Text style={styles.headerTitle}>Repuestos de la Orden</Text>  
        <TouchableOpacity   
          style={styles.addButton}  
          onPress={() => setShowAddPartModal(true)}  
        >  
          <Feather name="plus" size={24} color="#1a73e8" />  
        </TouchableOpacity>  
      </View>  
  
      {order && (  
        <View style={styles.orderInfo}>  
          <Text style={styles.orderNumber}>Orden #{order.number}</Text>  
          <Text style={styles.orderDescription}>{order.description}</Text>  
        </View>  
      )}  
  
      <ScrollView   
        style={styles.content}  
        refreshControl={  
          <RefreshControl refreshing={refreshing} onRefresh={loadOrderData} />  
        }  
      >  
        {/* Lista de repuestos en la orden */}  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>Repuestos en la Orden</Text>  
            
          {orderParts.length > 0 ? (  
            <FlatList  
              data={orderParts}  
              keyExtractor={(item) => item.id}  
              renderItem={renderOrderPartItem}  
              scrollEnabled={false}  
            />  
          ) : (  
            <View style={styles.emptyState}>  
              <Feather name="package" size={48} color="#ccc" />  
              <Text style={styles.emptyStateText}>No hay repuestos agregados</Text>  
            </View>  
          )}  
        </View>  
  
        {/* Resumen de totales */}  
        <View style={styles.totalsSection}>  
          <Text style={styles.sectionTitle}>Resumen</Text>  
            
          <View style={styles.totalRow}>  
            <Text style={styles.totalLabel}>Total de repuestos:</Text>  
            <Text style={styles.totalValue}>{orderParts.length}</Text>  
          </View>  
            
          <View style={styles.totalRow}>  
            <Text style={styles.totalLabel}>Cantidad total:</Text>  
            <Text style={styles.totalValue}>  
              {orderParts.reduce((sum, part) => sum + part.quantity, 0)} unidades  
            </Text>  
          </View>  
            
          <View style={[styles.totalRow, styles.grandTotalRow]}>  
            <Text style={styles.grandTotalLabel}>TOTAL:</Text>  
            <Text style={styles.grandTotalValue}>${calculateTotal().toFixed(2)}</Text>  
          </View>  
        </View>  
      </ScrollView>  
  
      {renderAddPartModal()}  
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
  addButton: {  
    padding: 8,  
  },  
  orderInfo: {  
    backgroundColor: "#fff",  
    padding: 16,  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  orderNumber: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 4,  
  },  
  orderDescription: {  
    fontSize: 14,  
    color: "#666",  
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
    marginBottom: 16,  
  },  
  partCard: {  
    backgroundColor: "#f8f9fa",  
    borderRadius: 8,  
    padding: 12,  
    marginBottom: 8,  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  partHeader: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    marginBottom: 8,  
  },  
  partInfo: {  
    flex: 1,  
  },  
  partName: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 2,  
  },  
  partCode: {  
    fontSize: 12,  
    color: "#666",  
  },  
  removeButton: {  
    padding: 4,  
  },  
  partDetails: {  
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
    backgroundColor: "#fff",  
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
  priceContainer: {  
    alignItems: "flex-end",  
  },  
  priceLabel: {  
    fontSize: 12,  
    color: "#666",  
  },  
  priceValue: {  
    fontSize: 14,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  subtotalContainer: {  
    alignItems: "flex-end",  
  },  
  subtotalLabel: {  
    fontSize: 12,  
    color: "#666",  
  },  
  subtotalValue: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#1a73e8",  
  },  
  emptyState: {  
    alignItems: "center",  
    paddingVertical: 40,  
  },  
  emptyStateText: {  
    fontSize: 16,  
    color: "#999",  
    marginTop: 12,  
  },  
  totalsSection: {  
    backgroundColor: "#fff",  
    borderRadius: 8,  
    padding: 16,  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 1 },  
    shadowOpacity: 0.1,  
    shadowRadius: 2,  
    elevation: 2,  
  },  
  totalRow: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    paddingVertical: 8,  
    borderBottomWidth: 1,  
    borderBottomColor: "#f0f0f0",  
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
    borderBottomWidth: 0,  
    borderTopWidth: 1,  
    borderTopColor: "#e1e4e8",  
    paddingTop: 12,  
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
  inventoryList: {  
    maxHeight: 400,  
  },  
  inventoryItem: {  
    flexDirection: "row",  
    alignItems: "center",  
    paddingVertical: 12,  
    paddingHorizontal: 16,  
    borderBottomWidth: 1,  
    borderBottomColor: "#f0f0f0",  
  },  
  inventoryItemInfo: {  
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
  normalStock: {  
    color: "#4caf50",  
  },  
  inventoryItemPrice: {  
    alignItems: "flex-end",  
    marginLeft: 12,  
  },  
  priceText: {  
    fontSize: 14,  
    fontWeight: "bold",  
    color: "#1a73e8",  
    marginBottom: 4,  
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
})