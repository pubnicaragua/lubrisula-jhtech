"use client"  
  
import { useState, useCallback } from "react"  
import {  
  View,  
  Text,  
  StyleSheet,  
  FlatList,  
  TouchableOpacity,  
  TextInput,  
  ActivityIndicator,  
  Alert,  
  Modal,  
  ScrollView,  
} from "react-native"  
import { Feather, MaterialIcons } from "@expo/vector-icons"  
import { useFocusEffect } from "@react-navigation/native"  
import { StackNavigationProp } from '@react-navigation/stack'  
import { RouteProp } from '@react-navigation/native'  
import { useAuth } from "../context/auth-context"  
import { inventoryService } from "../services/supabase/inventory-service"  
import { InventoryItem, mapLegacyFields } from "../types/inventory"  
import ACCESOS_SERVICES from "../services/supabase/access-service"  
import USER_SERVICE from "../services/supabase/user-service"  
import { RootStackParamList, PartSelectionParams } from '../types/navigation'  
  
type PartSelectionNavigationProp = StackNavigationProp<RootStackParamList, 'PartSelection'>  
type PartSelectionRouteProp = RouteProp<RootStackParamList, 'PartSelection'>  
  
interface Props {  
  navigation: PartSelectionNavigationProp  
  route: PartSelectionRouteProp  
}  
  
export default function PartSelectionScreen({ navigation, route }: Props) {  
  const { onPartSelect, selectedParts = [], multiSelect = true } = route.params || {}  
  const { user } = useAuth()  
    
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])  
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])  
  const [loading, setLoading] = useState(true)  
  const [searchTerm, setSearchTerm] = useState("")  
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined)  
  const [selectedItems, setSelectedItems] = useState<InventoryItem[]>(selectedParts)  
  const [itemDetailModalVisible, setItemDetailModalVisible] = useState(false)  
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)  
  const [quantities, setQuantities] = useState<Record<string, number>>({})  
  const [categories, setCategories] = useState<string[]>([])  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
  
  // Cargar inventario cuando la pantalla obtiene el foco  
  useFocusEffect(  
    useCallback(() => {  
      loadInventory()  
    }, [])  
  )  
  
  const loadInventory = async () => {  
    try {  
      setLoading(true)  
      setError(null)  
  
      if (!user?.id) return  
  
      // Validar permisos del usuario  
      const userTallerId = await USER_SERVICE.GET_TALLER_ID(user.id)  
  
      if (!userTallerId) {  
        setError("No se pudo obtener la información del taller")  
        return  
      }  
  
      const userPermissions = await ACCESOS_SERVICES.GET_PERMISOS_USUARIO(user.id, userTallerId)  
      setUserRole(userPermissions?.rol || 'client')  
  
      // Inicializar cantidades para partes ya seleccionadas  
      const initialQuantities: Record<string, number> = {}  
      selectedParts.forEach((part) => {  
        initialQuantities[part.id] = 1  
      })  
      setQuantities(initialQuantities)  
  
      // Cargar inventario desde Supabase  
      const allItems = await inventoryService.getAllInventory()  
        
      // Mapear campos legacy para compatibilidad  
      const mappedItems = allItems.map(mapLegacyFields)  
        
      // Extraer categorías únicas  
      const categoryNames = [...new Set(mappedItems.map(item => item.categoria_nombre || item.category).filter(Boolean))]  
      setCategories(categoryNames)  
  
      // Filtrar solo items con stock disponible  
      const inStockItems = mappedItems.filter(item => (item.cantidad || item.stock || 0) > 0)  
        
      setInventoryItems(inStockItems)  
      setFilteredItems(inStockItems)  
    } catch (error) {  
      console.error("Error al cargar inventario:", error)  
      setError("No se pudieron cargar los repuestos")  
      Alert.alert("Error", "No se pudieron cargar los repuestos")  
    } finally {  
      setLoading(false)  
    }  
  }  
  
  // Filtrar items basado en búsqueda y categoría  
  const filterItems = useCallback(() => {  
    let filtered = inventoryItems  
  
    // Filtrar por término de búsqueda  
    if (searchTerm.trim()) {  
      filtered = filtered.filter(item =>  
        (item.producto || item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||  
        (item.id || item.sku || '').toLowerCase().includes(searchTerm.toLowerCase())  
      )  
    }  
  
    // Filtrar por categoría  
    if (selectedCategory) {  
      filtered = filtered.filter(item =>  
        (item.categoria_nombre || item.category) === selectedCategory  
      )  
    }  
  
    setFilteredItems(filtered)  
  }, [inventoryItems, searchTerm, selectedCategory])  
  
  // Ejecutar filtrado cuando cambien los criterios  
  useFocusEffect(  
    useCallback(() => {  
      filterItems()  
    }, [filterItems])  
  )  
  
  const handleSearch = (text: string) => {  
    setSearchTerm(text)  
  }  
  
  const handleCategorySelect = (category: string | undefined) => {  
    setSelectedCategory(category)  
  }  
  
  const handleItemPress = (item: InventoryItem) => {  
    if (multiSelect) {  
      // Si es selección múltiple, mostrar detalles  
      setSelectedItem(item)  
      setItemDetailModalVisible(true)  
    } else {  
      // Si es selección única, seleccionar directamente  
      const mappedItem = { ...item, stock: item.cantidad || item.stock || 1 }  
      onPartSelect && onPartSelect([mappedItem])  
      navigation.goBack()  
    }  
  }  
  
  const toggleItemSelection = (item: InventoryItem) => {  
    const isSelected = selectedItems.some((selectedItem) => selectedItem.id === item.id)  
  
    if (isSelected) {  
      // Deseleccionar  
      setSelectedItems(selectedItems.filter((selectedItem) => selectedItem.id !== item.id))  
      setQuantities((prev) => {  
        const newQuantities = { ...prev }  
        delete newQuantities[item.id]  
        return newQuantities  
      })  
    } else {  
      // Seleccionar  
      const quantity = 1 // Cantidad por defecto  
      setSelectedItems([...selectedItems, item])  
      setQuantities((prev) => ({ ...prev, [item.id]: quantity }))  
    }  
  }  
  
  const updateQuantity = (itemId: string, newQuantity: number) => {  
    const item = inventoryItems.find(i => i.id === itemId)  
    if (item && newQuantity > 0 && newQuantity <= (item.cantidad || item.stock || 0)) {  
      setQuantities((prev) => ({ ...prev, [itemId]: newQuantity }))  
    }  
  }  
  
  const handleConfirmSelection = () => {  
    if (selectedItems.length === 0) {  
      Alert.alert("Selección vacía", "Debe seleccionar al menos un repuesto")  
      return  
    }  
  
    // Validar que todas las cantidades sean válidas  
    for (const item of selectedItems) {  
      const quantity = quantities[item.id] || 1  
      const availableStock = item.cantidad || item.stock || 0  
        
      if (quantity > availableStock) {  
        Alert.alert(  
          "Cantidad no disponible",  
          `Solo hay ${availableStock} unidades disponibles de ${item.producto || item.name}`  
        )  
        return  
      }  
    }  
  
    // Preparar items con cantidades  
    const itemsWithQuantities = selectedItems.map(item => ({  
      ...item,  
      stock: quantities[item.id] || 1  
    }))  
  
    onPartSelect && onPartSelect(itemsWithQuantities)  
    navigation.goBack()  
  }  
  
  const formatCurrency = (amount: number) => {  
    return amount.toLocaleString("es-ES", {  
      style: "currency",  
      currency: "USD",  
      minimumFractionDigits: 2,  
    })  
  }  
  
  const renderCategoryFilters = () => (  
    <View style={styles.categoriesContainer}>  
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>  
        <TouchableOpacity  
          style={[  
            styles.categoryChip,  
            !selectedCategory && styles.categoryChipSelected  
          ]}  
          onPress={() => handleCategorySelect(undefined)}  
        >  
          <Text style={[  
            styles.categoryChipText,  
            !selectedCategory && styles.categoryChipTextSelected  
          ]}>  
            Todas  
          </Text>  
        </TouchableOpacity>  
          
        {categories.map((category) => (  
          <TouchableOpacity  
            key={category}  
            style={[  
              styles.categoryChip,  
              selectedCategory === category && styles.categoryChipSelected  
            ]}  
            onPress={() => handleCategorySelect(category)}  
          >  
            <Text style={[  
              styles.categoryChipText,  
              selectedCategory === category && styles.categoryChipTextSelected  
            ]}>  
              {category}  
            </Text>  
          </TouchableOpacity>  
        ))}  
      </ScrollView>  
    </View>  
  )  
  
  const renderPartItem = ({ item }: { item: InventoryItem }) => {  
    const isSelected = selectedItems.some((selectedItem) => selectedItem.id === item.id)  
    const formattedPrice = formatCurrency(item.precio_unitario || item.priceUSD || 0)  
    const stock = item.cantidad || item.stock || 0  
    const minStock = item.minStock || 5  
  
    const stockColor =  
      stock === 0  
        ? "#e53935"  
        : stock <= minStock  
        ? "#f5a623"  
        : "#4caf50"  
  
    return (  
      <TouchableOpacity  
        style={[styles.partItem, isSelected && styles.selectedPartItem]}  
        onPress={() => handleItemPress(item)}  
      >  
        <View style={styles.partContent}>  
          <View style={styles.partHeader}>  
            <Text style={styles.partName}>{item.producto || item.name || 'Sin nombre'}</Text>  
            {multiSelect && (  
              <TouchableOpacity  
                style={[styles.checkboxContainer, isSelected && styles.checkboxSelected]}  
                onPress={() => toggleItemSelection(item)}  
              >  
                {isSelected && <Feather name="check" size={16} color="#fff" />}  
              </TouchableOpacity>  
            )}  
          </View>  
  
          <Text style={styles.partSku}>Código: {item.id || item.sku || 'N/A'}</Text>  
  
          {(item.proceso || item.description) && (  
            <Text style={styles.partDescription}>{item.proceso || item.description}</Text>  
          )}  
  
          <View style={styles.partFooter}>  
            <View style={styles.categoryBadge}>  
              <Text style={styles.categoryText}>  
                {item.categoria_nombre || item.category || "Sin categoría"}  
              </Text>  
            </View>  
  
            <View style={styles.stockContainer}>  
              <Feather name="box" size={14} color={stockColor} style={styles.stockIcon} />  
              <Text style={[styles.stockText, { color: stockColor }]}>  
                {stock} unidades  
              </Text>  
            </View>  
  
            <Text style={styles.partPrice}>{formattedPrice}</Text>  
          </View>  
        </View>  
      </TouchableOpacity>  
    )  
  }  
  
  const renderItemDetailModal = () => {  
    if (!selectedItem) return null  
  
    const isSelected = selectedItems.some((item) => item.id === selectedItem.id)  
    const quantity = quantities[selectedItem.id] || 1  
    const formattedPrice = formatCurrency(selectedItem.precio_unitario || selectedItem.priceUSD || 0)  
    const totalPrice = formatCurrency((selectedItem.precio_unitario || selectedItem.priceUSD || 0) * quantity)  
  
    return (  
      <Modal  
        visible={itemDetailModalVisible}  
        animationType="slide"  
        presentationStyle="pageSheet"  
      >  
        <View style={styles.modalContainer}>  
          <View style={styles.modalHeader}>  
            <Text style={styles.modalTitle}>Detalle del Repuesto</Text>  
            <TouchableOpacity  
              style={styles.closeButton}  
              onPress={() => setItemDetailModalVisible(false)}  
            >  
              <Feather name="x" size={24} color="#666" />  
            </TouchableOpacity>  
          </View>  
  
          <ScrollView style={styles.modalContent}>  
            <Text style={styles.modalItemName}>{selectedItem.producto || selectedItem.name || 'Sin nombre'}</Text>  
            <Text style={styles.modalItemSku}>Código: {selectedItem.id || selectedItem.sku || 'N/A'}</Text>  
              
            {(selectedItem.proceso || selectedItem.description) && (  
              <Text style={styles.modalItemDescription}>  
                {selectedItem.proceso || selectedItem.description}  
              </Text>  
            )}  
  
            <View style={styles.modalItemDetails}>  
              <View style={styles.modalDetailRow}>  
                <Text style={styles.modalDetailLabel}>Categoría:</Text>  
                <Text style={styles.modalDetailValue}>  
                  {selectedItem.categoria_nombre || selectedItem.category || "Sin categoría"}  
                </Text>  
              </View>  
  
              <View style={styles.modalDetailRow}>  
                <Text style={styles.modalDetailLabel}>Stock disponible:</Text>  
                <Text style={styles.modalDetailValue}>  
                  {selectedItem.cantidad || selectedItem.stock || 0} unidades  
                </Text>  
              </View>  
  
              <View style={styles.modalDetailRow}>  
                <Text style={styles.modalDetailLabel}>Precio unitario:</Text>  
                <Text style={styles.modalDetailValue}>{formattedPrice}</Text>  
              </View>  
  
              <View style={styles.modalDetailRow}>  
                <Text style={styles.modalDetailLabel}>Ubicación:</Text>  
                <Text style={styles.modalDetailValue}>  
                  {selectedItem.lugar_compra || selectedItem.location || "No especificada"}  
                </Text>  
              </View>  
            </View>  
  
            {multiSelect && (  
              <View style={styles.quantitySection}>  
                <Text style={styles.quantityLabel}>Cantidad:</Text>  
                <View style={styles.quantityControls}>  
                  <TouchableOpacity  
                    style={styles.quantityButton}  
                    onPress={() => updateQuantity(selectedItem.id, quantity - 1)}  
                    disabled={quantity <= 1}  
                  >  
                    <Feather  
                      name="minus"  
                      size={20}  
                      color={quantity <= 1 ? "#ccc" : "#1a73e8"}  
                    />  
                  </TouchableOpacity>  
  
                  <TextInput  
                    style={styles.quantityInput}  
                    value={quantity.toString()}  
                    onChangeText={(text) => {  
                      const newQuantity = parseInt(text) || 1  
                      if (newQuantity >= 1) {  
                        updateQuantity(selectedItem.id, newQuantity)  
                      }  
                    }}  
                    keyboardType="numeric"  
                  />  
  
                  <TouchableOpacity  
                    style={styles.quantityButton}  
                    onPress={() => updateQuantity(selectedItem.id, quantity + 1)}  
                    disabled={quantity >= (selectedItem.cantidad || selectedItem.stock || 0)}  
                  >  
                    <Feather  
                      name="plus"  
                      size={20}  
                      color={quantity >= (selectedItem.cantidad || selectedItem.stock || 0) ? "#ccc" : "#1a73e8"}  
                    />  
                  </TouchableOpacity>  
                </View>  
              </View>  
            )}  
  
            <View style={styles.totalSection}>  
              <Text style={styles.totalLabel}>Total:</Text>  
              <Text style={styles.totalValue}>{totalPrice}</Text>  
            </View>  
          </ScrollView>  
  
          <View style={styles.modalFooter}>  
            <TouchableOpacity  
              style={[styles.button, styles.cancelButton]}  
              onPress={() => setItemDetailModalVisible(false)}  
            >  
              <Text style={styles.buttonText}>Cancelar</Text>  
            </TouchableOpacity>  
  
            <TouchableOpacity  
              style={[styles.button, styles.addButton]}  
              onPress={() => {  
                toggleItemSelection(selectedItem)  
                setItemDetailModalVisible(false)  
              }}  
            >  
              <Text style={styles.buttonText}>{isSelected ? "Quitar" : "Agregar"}</Text>  
            </TouchableOpacity>  
          </View>  
        </View>  
      </Modal>  
    )  
  }  
  
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
        <MaterialIcons name="error" size={64} color="#f44336" />  
        <Text style={styles.errorText}>{error}</Text>  
        <TouchableOpacity style={styles.retryButton} onPress={loadInventory}>  
          <Text style={styles.retryButtonText}>Reintentar</Text>  
        </TouchableOpacity>  
      </View>  
    )  
  }  
  
  return (  
    <View style={styles.container}>  
      <View style={styles.header}>  
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>  
          <Feather name="arrow-left" size={24} color="#333" />  
        </TouchableOpacity>  
        <Text style={styles.headerTitle}>Seleccionar Repuestos</Text>  
      </View>  
  
      <View style={styles.searchContainer}>  
        <Feather name="search" size={20} color="#666" style={styles.searchIcon} />  
        <TextInput  
          style={styles.searchInput}  
          placeholder="Buscar por nombre o código..."  
          value={searchTerm}  
          onChangeText={handleSearch}  
        />  
        {searchTerm.length > 0 && (  
          <TouchableOpacity style={styles.clearButton} onPress={() => setSearchTerm("")}>  
            <Feather name="x" size={20} color="#666" />  
          </TouchableOpacity>  
        )}  
      </View>  
  
      {renderCategoryFilters()}  
  
      <FlatList  
        data={filteredItems}  
        keyExtractor={(item) => item.id}  
        renderItem={renderPartItem}  
        contentContainerStyle={styles.listContainer}  
        showsVerticalScrollIndicator={false}  
        ListEmptyComponent={  
          <View style={styles.emptyContainer}>  
            <Feather name="package" size={64} color="#ccc" />  
            <Text style={styles.emptyText}>  
              {searchTerm || selectedCategory ? "No se encontraron repuestos" : "No hay repuestos disponibles"}  
            </Text>  
            {(searchTerm || selectedCategory) && (  
              <Text style={styles.emptySubtext}>  
                Intenta ajustar los filtros de búsqueda  
              </Text>  
            )}  
          </View>  
        }  
      />  
  
      {multiSelect && selectedItems.length > 0 && (  
        <View style={styles.selectionBar}>  
          <View style={styles.selectionInfo}>  
            <Text style={styles.selectionCount}>  
              {selectedItems.length} repuesto{selectedItems.length !== 1 ? "s" : ""} seleccionado{selectedItems.length !== 1 ? "s" : ""}  
            </Text>  
          </View>  
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmSelection}>  
            <Text style={styles.confirmButtonText}>Confirmar</Text>  
          </TouchableOpacity>  
        </View>  
      )}  
  
      {renderItemDetailModal()}  
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
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    backgroundColor: "#fff",  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  backButton: {  
    padding: 8,  
    marginRight: 8,  
  },  
  headerTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  searchContainer: {  
    flexDirection: "row",  
    alignItems: "center",  
    backgroundColor: "#fff",  
    marginHorizontal: 16,  
    marginVertical: 8,  
    borderRadius: 8,  
    paddingHorizontal: 12,  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  searchIcon: {  
    marginRight: 8,  
  },  
  searchInput: {  
    flex: 1,  
    paddingVertical: 12,  
    fontSize: 16,  
    color: "#333",  
  },  
  clearButton: {  
    padding: 4,  
  },  
  categoriesContainer: {  
    backgroundColor: "#fff",  
    paddingHorizontal: 16,  
    paddingVertical: 8,  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  categoryChip: {  
    paddingHorizontal: 12,  
    paddingVertical: 6,  
    borderRadius: 16,  
    backgroundColor: "#f5f5f5",  
    marginRight: 8,  
  },  
  categoryChipSelected: {  
    backgroundColor: "#1a73e8",  
  },  
  categoryChipText: {  
    fontSize: 14,  
    color: "#666",  
  },  
  categoryChipTextSelected: {  
    color: "#fff",  
    fontWeight: "bold",  
  },  
  listContainer: {  
    padding: 16,  
  },  
  partItem: {  
    backgroundColor: "#fff",  
    borderRadius: 8,  
    padding: 16,  
    marginBottom: 12,  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 1 },  
    shadowOpacity: 0.1,  
    shadowRadius: 2,  
    elevation: 2,  
  },  
  selectedPartItem: {  
    borderColor: "#1a73e8",  
    borderWidth: 2,  
  },  
  partContent: {  
    flex: 1,  
  },  
  partHeader: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    marginBottom: 8,  
  },  
  partName: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#333",  
    flex: 1,  
  },  
  checkboxContainer: {  
    width: 24,  
    height: 24,  
    borderRadius: 12,  
    borderWidth: 2,  
    borderColor: "#e1e4e8",  
    justifyContent: "center",  
    alignItems: "center",  
  },  
  checkboxSelected: {  
    backgroundColor: "#1a73e8",  
    borderColor: "#1a73e8",  
  },  
  partSku: {  
    fontSize: 14,  
    color: "#666",  
    marginBottom: 4,  
  },  
  partDescription: {  
    fontSize: 14,  
    color: "#888",  
    marginBottom: 8,  
    lineHeight: 20,  
  },  
  partFooter: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    flexWrap: "wrap",  
    gap: 8,  
  },  
  categoryBadge: {  
    backgroundColor: "#f0f0f0",  
    paddingHorizontal: 8,  
    paddingVertical: 4,  
    borderRadius: 12,  
  },  
  categoryText: {  
    fontSize: 12,  
    color: "#666",  
  },  
  stockContainer: {  
    flexDirection: "row",  
    alignItems: "center",  
  },  
  stockIcon: {  
    marginRight: 4,  
  },  
  stockText: {  
    fontSize: 12,  
    fontWeight: "500",  
  },  
  partPrice: {  
    fontSize: 14,  
    fontWeight: "bold",  
    color: "#1a73e8",  
  },  
  emptyContainer: {  
    flex: 1,  
    justifyContent: "center",  
    alignItems: "center",  
    padding: 40,  
  },  
  emptyText: {  
    fontSize: 18,  
    color: "#999",  
    marginTop: 16,  
    textAlign: "center",  
  },  
  emptySubtext: {  
    fontSize: 14,  
    color: "#ccc",  
    marginTop: 8,  
    textAlign: "center",  
  },  
  selectionBar: {  
    position: "absolute",  
    bottom: 0,  
    left: 0,  
    right: 0,  
    backgroundColor: "#fff",  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    padding: 16,  
    borderTopWidth: 1,  
    borderTopColor: "#e1e4e8",  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: -2 },  
    shadowOpacity: 0.1,  
    shadowRadius: 4,  
    elevation: 4,  
  },  
  selectionInfo: {  
    flex: 1,  
  },  
  selectionCount: {  
    fontSize: 14,  
    fontWeight: "500",  
    color: "#333",  
  },  
  confirmButton: {  
    backgroundColor: "#1a73e8",  
    paddingHorizontal: 20,  
    paddingVertical: 10,  
    borderRadius: 8,  
  },  
  confirmButtonText: {  
    color: "#fff",  
    fontWeight: "bold",  
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
  modalItemName: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 4,  
  },  
  modalItemSku: {  
    fontSize: 14,  
    color: "#666",  
    marginBottom: 16,  
  },  
  modalItemDescription: {  
    fontSize: 14,  
    color: "#333",  
    marginBottom: 16,  
    lineHeight: 20,  
  },  
  modalItemDetails: {  
    backgroundColor: "#f8f9fa",  
    borderRadius: 8,  
    padding: 12,  
    marginBottom: 16,  
  },  
  modalDetailRow: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    marginBottom: 8,  
  },  
  modalDetailLabel: {  
    fontSize: 14,  
    color: "#666",  
    fontWeight: "500",  
  },  
  modalDetailValue: {  
    fontSize: 14,  
    color: "#333",  
    fontWeight: "500",  
  },  
  quantitySection: {  
    marginBottom: 16,  
  },  
  quantityLabel: {  
    fontSize: 16,  
    fontWeight: "500",  
    color: "#333",  
    marginBottom: 8,  
  },  
  quantityControls: {  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "center",  
  },  
  quantityButton: {  
    width: 40,  
    height: 40,  
    borderRadius: 20,  
    backgroundColor: "#f5f5f5",  
    justifyContent: "center",  
    alignItems: "center",  
    marginHorizontal: 8,  
  },  
  quantityInput: {  
    width: 60,  
    height: 40,  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
    borderRadius: 8,  
    textAlign: "center",  
    fontSize: 16,  
    color: "#333",  
  },  
  totalSection: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    paddingTop: 16,  
    borderTopWidth: 1,  
    borderTopColor: "#e1e4e8",  
  },  
  totalLabel: {  
    fontSize: 16,  
    fontWeight: "500",  
    color: "#333",  
  },  
  totalValue: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#1a73e8",  
  },  
  modalFooter: {  
    flexDirection: "row",  
    padding: 16,  
    borderTopWidth: 1,  
    borderTopColor: "#e1e4e8",  
    gap: 12,  
  },  
  button: {  
    flex: 1,  
    paddingVertical: 12,  
    borderRadius: 8,  
    alignItems: "center",  
  },  
  cancelButton: {  
    backgroundColor: "#f5f5f5",  
  },  
  addButton: {  
    backgroundColor: "#1a73e8",  
  },  
  buttonText: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#333",  
  },  
})