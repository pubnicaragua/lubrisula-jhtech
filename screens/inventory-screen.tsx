"use client"  
import { useState, useCallback } from "react"  
import {  
  View,  
  Text,  
  FlatList,  
  TouchableOpacity,  
  TextInput,  
  StyleSheet,  
  ActivityIndicator,  
  RefreshControl,  
  Alert,  
} from "react-native"  
import { Feather, MaterialIcons } from "@expo/vector-icons"  
import { useFocusEffect } from "@react-navigation/native"  
import { StackNavigationProp } from '@react-navigation/stack'  
import { useAuth } from "../context/auth-context"  
import { inventoryService } from "../services/supabase/inventory-service"  
import ACCESOS_SERVICES from "../services/supabase/access-service"  
import USER_SERVICE from "../services/supabase/user-service"  
import { InventoryStackParamList } from '../types/navigation'  
import { InventoryItem, MaterialCategory, Supplier, mapLegacyFields } from '../types/inventory'  
  
type InventoryScreenNavigationProp = StackNavigationProp<InventoryStackParamList, 'Inventory'>  
  
interface Props {  
  navigation: InventoryScreenNavigationProp  
}  
  
export default function InventoryScreen({ navigation }: Props) {  
  console.log("📦 InventoryScreen - Iniciando componente")  
    
  const { user } = useAuth()  
  const [loading, setLoading] = useState(true)  
  const [refreshing, setRefreshing] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])  
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])  
  const [categories, setCategories] = useState<MaterialCategory[]>([])  
  const [suppliers, setSuppliers] = useState<Supplier[]>([])  
  const [searchTerm, setSearchTerm] = useState("")  
  const [selectedCategory, setSelectedCategory] = useState<string>("all")  
  const [showLowStock, setShowLowStock] = useState(false)  
  
  console.log("📦 InventoryScreen - Usuario actual:", user?.id, "Rol:", user?.role)  
  
  const loadInventoryData = useCallback(async () => {  
    try {  
      console.log("📦 InventoryScreen - Iniciando carga de datos del inventario")  
      setLoading(true)  
      setError(null)  
  
      if (!user?.id) {  
        console.error("❌ InventoryScreen - Usuario no autenticado")  
        return  
      }  
  
      // Validar permisos del usuario  
      console.log("🔐 InventoryScreen - Validando permisos para usuario:", user.id)  
      const userId = user.id as string  
      const userTallerId = await USER_SERVICE.GET_TALLER_ID(userId)  
      console.log("🏢 InventoryScreen - Taller ID obtenido:", userTallerId)  
        
      if (!userTallerId) {  
        console.error("❌ InventoryScreen - No se pudo obtener el taller ID")  
        setError("No se pudo obtener la información del taller")  
        return  
      }  
  
      const userPermissions = await ACCESOS_SERVICES.GET_PERMISOS_USUARIO(userId, userTallerId)  
      console.log("🔐 InventoryScreen - Permisos obtenidos:", userPermissions)  

      setUserRole(userPermissions?.role || 'client')

      // Permitir acceso a técnicos y admin, bloquear solo clientes
      if (userPermissions?.role === 'client') {
        console.error("❌ InventoryScreen - Cliente sin permisos para ver inventario")
        setError("No tienes permisos para ver el inventario")
        return
      }
  
      console.log("✅ InventoryScreen - Usuario autorizado, cargando datos del inventario")  
  
      // Cargar datos del inventario  
      console.log("📦 InventoryScreen - Iniciando carga paralela de datos")  
      const [inventoryData, categoriesData, suppliersData] = await Promise.all([  
        inventoryService.getAllInventory(),  
        inventoryService.getInventoryCategories(),  
        inventoryService.getSuppliers()  
      ])  
  
      console.log("📦 InventoryScreen - Datos cargados:", {  
        inventoryItems: inventoryData.length,  
        categories: categoriesData.length,  
        suppliers: suppliersData.length  
      })  
  
      // Mapear campos legacy para compatibilidad  
      const mappedInventory = inventoryData.map(mapLegacyFields)  
      console.log("🔄 InventoryScreen - Inventario mapeado:", mappedInventory.length, "items")  
  
      setInventoryItems(mappedInventory)  
      setFilteredItems(mappedInventory)  
      // Deduplicate categories by id
      const uniqueCategories = Array.from(
        new Map(categoriesData.map(cat => [cat.id, cat])).values()
      )
      setCategories(uniqueCategories)
      setSuppliers(suppliersData)  
  
      console.log("✅ InventoryScreen - Datos del inventario cargados exitosamente")  
  
    } catch (error) {  
      console.error("❌ InventoryScreen - Error cargando datos del inventario:", error)  
      setError("No se pudo cargar el inventario")  
    } finally {  
      setLoading(false)  
      setRefreshing(false)  
      console.log("📦 InventoryScreen - Finalizando carga de datos")  
    }  
  }, [user])  
  
  useFocusEffect(  
    useCallback(() => {  
      console.log("🎯 InventoryScreen - Pantalla enfocada, cargando datos")  
      loadInventoryData()  
    }, [loadInventoryData])  
  )  
  
  const filterItems = useCallback(() => {  
    console.log("🔍 InventoryScreen - Aplicando filtros:", {  
      searchTerm,  
      selectedCategory,  
      showLowStock,  
      totalItems: inventoryItems.length  
    })  
  
    let filtered = inventoryItems  
  
    // Filtrar por término de búsqueda  
    if (searchTerm) {  
      console.log("🔍 InventoryScreen - Filtrando por término de búsqueda:", searchTerm)  
      filtered = filtered.filter(item =>  
        (item.producto || item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||  
        (item.id || item.sku || '').toLowerCase().includes(searchTerm.toLowerCase())  
      )  
      console.log("🔍 InventoryScreen - Items después de filtro de búsqueda:", filtered.length)  
    }  
  
    // Filtrar por categoría  
    if (selectedCategory !== "all") {  
      console.log("🔍 InventoryScreen - Filtrando por categoría:", selectedCategory)  
      filtered = filtered.filter(item => item.categoria_id === selectedCategory)  
      console.log("🔍 InventoryScreen - Items después de filtro de categoría:", filtered.length)  
    }  
  
    // Filtrar por stock bajo  
    if (showLowStock) {  
      console.log("🔍 InventoryScreen - Filtrando por stock bajo")  
      filtered = filtered.filter(item => (item.cantidad || item.stock || 0) <= (item.minStock || 5))  
      console.log("🔍 InventoryScreen - Items después de filtro de stock bajo:", filtered.length)  
    }  
  
    setFilteredItems(filtered)  
    console.log("✅ InventoryScreen - Filtros aplicados, items finales:", filtered.length)  
  }, [inventoryItems, searchTerm, selectedCategory, showLowStock])  
  
  // Aplicar filtros cuando cambien las dependencias  
  useFocusEffect(  
    useCallback(() => {  
      console.log("🔄 InventoryScreen - Reaplicando filtros por cambio de dependencias")  
      filterItems()  
    }, [filterItems])  
  )  
  
  const handleItemPress = (item: InventoryItem) => {  
    console.log("👆 InventoryScreen - Item seleccionado:", item.id, item.producto || item.name)  
    navigation.navigate("InventoryItemDetail", { itemId: item.id })  
  }  
  
  const handleAddItem = () => {  
    console.log("➕ InventoryScreen - Navegando a agregar nuevo item")  
    navigation.navigate("NewInventoryItem")  
  }  
  
  const onRefresh = () => {  
    console.log("🔄 InventoryScreen - Iniciando refresh manual")  
    setRefreshing(true)  
    loadInventoryData()  
  }  
  
  const handleSearchChange = (text: string) => {  
    console.log("🔍 InventoryScreen - Término de búsqueda cambiado:", text)  
    setSearchTerm(text)  
  }  
  
  const handleCategoryChange = (categoryId: string) => {  
    console.log("📂 InventoryScreen - Categoría seleccionada:", categoryId)  
    setSelectedCategory(categoryId)  
  }  
  
  const handleLowStockToggle = () => {  
    const newValue = !showLowStock  
    console.log("⚠️ InventoryScreen - Toggle stock bajo:", newValue)  
    setShowLowStock(newValue)  
  }  
  
  const formatCurrency = (amount: number) => {  
    return amount.toLocaleString("es-ES", {  
      style: "currency",  
      currency: "USD",  
      minimumFractionDigits: 2,  
    })  
  }  
  
  const getStockStatus = (item: InventoryItem) => {  
    const stock = item.cantidad || item.stock || 0  
    const minStock = item.minStock || 5  
      
    if (stock === 0) return { status: "out", color: "#f44336", text: "Agotado" }  
    if (stock <= minStock) return { status: "low", color: "#ff9800", text: "Stock Bajo" }  
    return { status: "ok", color: "#4caf50", text: "En Stock" }  
  }  
  
  const renderInventoryItem = ({ item }: { item: InventoryItem }) => {  
    const stockStatus = getStockStatus(item)  
    const stock = item.cantidad || item.stock || 0  
    const price = item.precio_unitario || item.priceUSD || 0  
  
    return (  
      <TouchableOpacity  
        style={styles.itemCard}  
        onPress={() => handleItemPress(item)}  
      >  
        <View style={styles.itemHeader}>  
          <Text style={styles.itemName} numberOfLines={2}>  
            {item.producto || item.name || 'Sin nombre'}  
          </Text>  
          <View style={[styles.stockBadge, { backgroundColor: stockStatus.color }]}>  
            <Text style={styles.stockBadgeText}>{stockStatus.text}</Text>  
          </View>  
        </View>  
  
        <Text style={styles.itemCode}>Código: {item.id || item.sku || 'N/A'}</Text>  
  
        {(item.proceso || item.description) && (  
          <Text style={styles.itemDescription} numberOfLines={2}>  
            {item.proceso || item.description}  
          </Text>  
        )}  
  
        <View style={styles.itemDetails}>  
          <View style={styles.itemDetailRow}>  
            <Feather name="package" size={16} color="#666" />  
            <Text style={styles.itemDetailText}>  
              Stock: {stock} {item.unidad_medida || 'unidades'}  
            </Text>  
          </View>  
  
          <View style={styles.itemDetailRow}>  
            <Feather name="dollar-sign" size={16} color="#666" />  
            <Text style={styles.itemDetailText}>{formatCurrency(price)}</Text>  
          </View>  
  
          {item.categoria_nombre && (  
            <View style={styles.itemDetailRow}>  
              <Feather name="tag" size={16} color="#666" />  
              <Text style={styles.itemDetailText}>{item.categoria_nombre}</Text>  
            </View>  
          )}  
        </View>  
      </TouchableOpacity>  
    )  
  }  
  
  if (loading) {  
    console.log("⏳ InventoryScreen - Mostrando pantalla de carga")  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#1a73e8" />  
        <Text style={styles.loadingText}>Cargando inventario...</Text>  
      </View>  
    )  
  }  
  
  if (error) {  
    console.log("❌ InventoryScreen - Mostrando pantalla de error:", error)  
    return (  
      <View style={styles.errorContainer}>  
        <MaterialIcons name="error" size={64} color="#f44336" />  
        <Text style={styles.errorText}>{error}</Text>  
        <TouchableOpacity style={styles.retryButton} onPress={loadInventoryData}>  
          <Text style={styles.retryButtonText}>Reintentar</Text>  
        </TouchableOpacity>  
      </View>  
    )  
  }  
  
  console.log("✅ InventoryScreen - Renderizando pantalla principal con", filteredItems.length, "items")  
  
  return (  
    <View style={styles.container}>  
      {/* Header con búsqueda */}  
      <View style={styles.header}>  
        <View style={styles.searchContainer}>  
          <Feather name="search" size={20} color="#666" />  
          <TextInput  
            style={styles.searchInput}  
            placeholder="Buscar productos..."  
            value={searchTerm}  
            onChangeText={handleSearchChange}  
          />  
        </View>  
        {userRole !== 'client' && (  
          <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>  
            <Feather name="plus" size={24} color="#fff" />  
          </TouchableOpacity>  
        )}  
      </View>  
  
      {/* Filtros */}  
      <View style={styles.filtersContainer}>  
        <View style={styles.categoryFilter}>  
          <Text style={styles.filterLabel}>Categoría:</Text>  
          <View style={styles.categoryButtons}>  
            <TouchableOpacity  
              style={[  
                styles.categoryButton,  
                selectedCategory === "all" && styles.categoryButtonSelected  
              ]}  
              onPress={() => handleCategoryChange("all")}  
            >  
              <Text style={[  
                styles.categoryButtonText,  
                selectedCategory === "all" && styles.categoryButtonTextSelected  
              ]}>  
                Todas  
              </Text>  
            </TouchableOpacity>  
            {/* Deduplicate categories before rendering */}
            {Array.from(new Map(categories.map(cat => [cat.id, cat])).values()).map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonSelected
                ]}
                onPress={() => handleCategoryChange(category.id)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === category.id && styles.categoryButtonTextSelected
                ]}>
                  {category.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </View>  
        </View>  
  
        <TouchableOpacity  
          style={[styles.filterToggle, showLowStock && styles.filterToggleActive]}  
          onPress={handleLowStockToggle}  
        >  
          <Feather  name="alert-triangle"  
            size={16}  
            color={showLowStock ? "#fff" : "#ff9800"}  
          />  
          <Text style={[  
            styles.filterToggleText,  
            showLowStock && styles.filterToggleTextActive  
          ]}>  
            Solo Stock Bajo  
          </Text>  
        </TouchableOpacity>  
      </View>  
  
      {/* Lista de inventario */}  
      <FlatList  
        data={filteredItems}  
        renderItem={renderInventoryItem}  
        keyExtractor={(item) => item.id}  
        contentContainerStyle={styles.listContainer}  
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}  
        ListEmptyComponent={  
          <View style={styles.emptyContainer}>  
            <Feather name="package" size={64} color="#ccc" />  
            <Text style={styles.emptyText}>  
              {searchTerm || selectedCategory !== "all" || showLowStock  
                ? "No se encontraron productos con los filtros aplicados"  
                : "No hay productos en el inventario"}  
            </Text>  
            {userRole !== 'client' && (  
              <TouchableOpacity style={styles.emptyButton} onPress={handleAddItem}>  
                <Text style={styles.emptyButtonText}>Agregar Primer Producto</Text>  
              </TouchableOpacity>  
            )}  
          </View>  
        }  
      />  
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
  searchContainer: {  
    flex: 1,  
    flexDirection: "row",  
    alignItems: "center",  
    backgroundColor: "#f5f5f5",  
    borderRadius: 8,  
    paddingHorizontal: 12,  
    paddingVertical: 8,  
    marginRight: 12,  
  },  
  searchInput: {  
    flex: 1,  
    marginLeft: 8,  
    fontSize: 16,  
    color: "#333",  
  },  
  addButton: {  
    backgroundColor: "#1a73e8",  
    width: 48,  
    height: 48,  
    borderRadius: 24,  
    justifyContent: "center",  
    alignItems: "center",  
  },  
  filtersContainer: {  
    backgroundColor: "#fff",  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  categoryFilter: {  
    marginBottom: 12,  
  },  
  filterLabel: {  
    fontSize: 14,  
    fontWeight: "600",  
    color: "#333",  
    marginBottom: 8,  
  },  
  categoryButtons: {  
    flexDirection: "row",  
    flexWrap: "wrap",  
    gap: 8,  
  },  
  categoryButton: {  
    paddingHorizontal: 12,  
    paddingVertical: 6,  
    backgroundColor: "#f5f5f5",  
    borderRadius: 16,  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  categoryButtonSelected: {  
    backgroundColor: "#1a73e8",  
    borderColor: "#1a73e8",  
  },  
  categoryButtonText: {  
    fontSize: 14,  
    color: "#666",  
    fontWeight: "500",  
  },  
  categoryButtonTextSelected: {  
    color: "#fff",  
    fontWeight: "600",  
  },  
  filterToggle: {  
    flexDirection: "row",  
    alignItems: "center",  
    paddingHorizontal: 12,  
    paddingVertical: 8,  
    backgroundColor: "#fff3cd",  
    borderRadius: 8,  
    borderWidth: 1,  
    borderColor: "#ffeaa7",  
    gap: 8,  
  },  
  filterToggleActive: {  
    backgroundColor: "#ff9800",  
    borderColor: "#ff9800",  
  },  
  filterToggleText: {  
    fontSize: 14,  
    color: "#856404",  
    fontWeight: "500",  
  },  
  filterToggleTextActive: {  
    color: "#fff",  
    fontWeight: "600",  
  },  
  listContainer: {  
    padding: 16,  
  },  
  itemCard: {  
    backgroundColor: "#fff",  
    borderRadius: 12,  
    padding: 16,  
    marginBottom: 12,  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 2 },  
    shadowOpacity: 0.1,  
    shadowRadius: 4,  
    elevation: 3,  
  },  
  itemHeader: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "flex-start",  
    marginBottom: 8,  
  },  
  itemName: {  
    flex: 1,  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
    marginRight: 12,  
  },  
  stockBadge: {  
    paddingHorizontal: 8,  
    paddingVertical: 4,  
    borderRadius: 12,  
  },  
  stockBadgeText: {  
    color: "#fff",  
    fontSize: 12,  
    fontWeight: "bold",  
  },  
  itemCode: {  
    fontSize: 14,  
    color: "#666",  
    marginBottom: 4,  
  },  
  itemDescription: {  
    fontSize: 14,  
    color: "#888",  
    marginBottom: 12,  
    lineHeight: 20,  
  },  
  itemDetails: {  
    gap: 8,  
  },  
  itemDetailRow: {  
    flexDirection: "row",  
    alignItems: "center",  
    gap: 8,  
  },  
  itemDetailText: {  
    fontSize: 14,  
    color: "#666",  
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
    marginBottom: 20,  
    textAlign: "center",  
  },  
  emptyButton: {  
    backgroundColor: "#1a73e8",  
    paddingHorizontal: 20,  
    paddingVertical: 12,  
    borderRadius: 8,  
  },  
  emptyButtonText: {  
    color: "#fff",  
    fontWeight: "bold",  
    fontSize: 16,  
  },  
})