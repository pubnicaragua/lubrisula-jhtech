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
  Modal,  
  ScrollView,  
} from "react-native"  
import { Feather, MaterialIcons } from "@expo/vector-icons"  
import { useFocusEffect } from "@react-navigation/native"  
import { useAuth } from "../context/auth-context"  
import { inventoryService } from "../services/supabase/inventory-service"  
import { accessService} from "../services/supabase/access-service"  
import { userService } from "../services/supabase/user-service"
import { getSuppliers, getInventoryCategories } from "../services/supabase/services-service"
import { InventoryItem } from "../types/inventory"
import { UiScreenNavProp } from "../types"
  
export default function InventoryScreen({ navigation }: UiScreenNavProp) {  
  const { user } = useAuth()  
  const [inventory, setInventory] = useState<InventoryItem[]>([])  
  const [categories, setCategories] = useState<any[]>([])  
  const [suppliers, setSuppliers] = useState<any[]>([])  
  const [loading, setLoading] = useState(true)  
  const [refreshing, setRefreshing] = useState(false)  
  const [searchTerm, setSearchTerm] = useState("")  
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([])  
  const [selectedCategory, setSelectedCategory] = useState<string>("all")  
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)  
  const [itemDetailModalVisible, setItemDetailModalVisible] = useState(false)  
  const [filterModalVisible, setFilterModalVisible] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
  
  const loadInventoryData = useCallback(async () => {  
    try {  
      setLoading(true)  
      setError(null)  
  
      if (!user?.id) return  
  
      // Validar permisos del usuario  
      const userTallerId = await userService.GET_TALLER_ID(user.id)
      if (!userTallerId) {
        setError("No se pudo cargar la información del cliente")  
        return
      }  
      const userPermissions = await accessService.GET_PERMISOS_USUARIO(user.id, userTallerId)  
      setUserRole(userPermissions?.rol || 'client')  
  
      if (userPermissions?.rol === 'client') {   //cambiar !== por ===
        // Los clientes no tienen acceso al inventario  
        setError("No tienes permisos para ver el inventario")  
        return  
      }  
  
      // Cargar datos del inventario  
      const [inventoryData, categoriesData, suppliersData] = await Promise.all([  
        inventoryService.getAllInventory(),  
        getInventoryCategories(),  
        getSuppliers()  
      ])  
  
      setInventory(inventoryData)  
      setCategories(categoriesData)  
      setSuppliers(suppliersData)  
      setFilteredInventory(inventoryData)  
  
    } catch (error) {  
      console.error("Error loading inventory:", error)  
      setError("No se pudo cargar el inventario")  
    } finally {  
      setLoading(false)  
      setRefreshing(false)  
    }  
  }, [user])  
  
  useFocusEffect(  
    useCallback(() => {  
      loadInventoryData()  
    }, [loadInventoryData])  
  )  
  
  const handleSearch = useCallback((text: string) => {  
    setSearchTerm(text)  
    applyFilters(text, selectedCategory)  
  }, [selectedCategory, inventory])  
  
  const handleCategoryFilter = useCallback((categoryId: string) => {  
    setSelectedCategory(categoryId)  
    applyFilters(searchTerm, categoryId)  
    setFilterModalVisible(false)  
  }, [searchTerm, inventory])  
  
  const applyFilters = useCallback((search: string, category: string) => {  
    let filtered = inventory  
  
    // Filtrar por categoría  
    if (category !== "all") {  
      filtered = filtered.filter(item => item.category === category)  
    }  
  
    // Filtrar por búsqueda  
    if (search.trim() !== "") {  
      filtered = filtered.filter(item =>  
        item.name?.toLowerCase().includes(search.toLowerCase()) ||  
        item.sku?.toLowerCase().includes(search.toLowerCase()) ||  
        item.description?.toLowerCase().includes(search.toLowerCase()) ||  
        item.category?.toLowerCase().includes(search.toLowerCase()) ||  
        item.supplier?.toLowerCase().includes(search.toLowerCase())  
      )  
    }  
  
    setFilteredInventory(filtered)  
  }, [inventory])  
  
  const handleItemPress = (item: InventoryItem) => {  
    setSelectedItem(item)  
    setItemDetailModalVisible(true)  
  }  
  
  const handleAddItem = () => {  
    navigation.navigate("NewInventoryItem")  
  }  
  
  const handleEditItem = (item: InventoryItem) => {  
    setItemDetailModalVisible(false)  
    navigation.navigate("EditInventoryItem", { itemId: item.id })  
  }  
  
  const formatCurrency = (amount: number) => {  
    return amount.toLocaleString("es-ES", {  
      style: "currency",  
      currency: "USD",  
      minimumFractionDigits: 2,  
    })  
  }  
  
  const getStockStatus = (item: InventoryItem) => {  
    if (item.stock === 0) {  
      return { status: "Sin Stock", color: "#f44336" }  
    } else if (item.minStock && item.stock <= item.minStock) {  
      return { status: "Stock Bajo", color: "#ff9800" }  
    } else {  
      return { status: "En Stock", color: "#4caf50" }  
    }  
  }  
  
  const renderInventoryItem = ({ item }: { item: InventoryItem }) => {  
    const stockStatus = getStockStatus(item)  
      
    return (  
      <TouchableOpacity  
        style={styles.inventoryCard}  
        onPress={() => handleItemPress(item)}  
      >  
        <View style={styles.inventoryHeader}>  
          <View style={styles.inventoryIconContainer}>  
            <Feather name="package" size={24} color="#1a73e8" />  
          </View>  
          <View style={styles.inventoryInfo}>  
            <Text style={styles.inventoryName}>{item.name}</Text>  
            <Text style={styles.inventoryCode}>Código: {item.sku}</Text>  
            <Text style={styles.inventoryCategory}>  
              {item.category}  
            </Text>  
          </View>  
          <View style={styles.inventoryStatus}>  
            <View style={[  
              styles.stockBadge,  
              { backgroundColor: stockStatus.color }  
            ]}>  
              <Text style={styles.stockText}>{stockStatus.status}</Text>  
            </View>  
          </View>  
        </View>  
  
        <View style={styles.inventoryDetails}>  
          <View style={styles.inventoryDetail}>  
            <MaterialIcons name="inventory" size={16} color="#666" />  
                          <Text style={styles.inventoryStock}>  
                Stock: {item.stock} / {item.minStock ?? 0} mín.  
              </Text>  
          </View>  
  
          {item.supplier && (  
            <View style={styles.inventoryDetail}>  
              <Feather name="truck" size={16} color="#666" />  
              <Text style={styles.inventorySupplier}>{item.supplier}</Text>  
            </View>  
          )}  
  
          <View style={styles.inventoryDetail}>  
            <Feather name="map-pin" size={16} color="#666" />  
            <Text style={styles.inventoryLocation}>{item.location}</Text>  
          </View>  
        </View>  
  
        <View style={styles.inventoryFooter}>  
          <View style={styles.priceContainer}>  
            <Text style={styles.priceLabel}>Compra:</Text>  
            <Text style={styles.priceValue}>  
              {formatCurrency(item.cost ?? 0)}  
            </Text>  
          </View>  
          <View style={styles.priceContainer}>  
            <Text style={styles.priceLabel}>Venta:</Text>  
            <Text style={styles.priceValue}>  
              {formatCurrency(item.priceUSD)}  
            </Text>  
          </View>  
        </View>  
      </TouchableOpacity>  
    )  
  }  
  
  const renderFilterModal = () => (  
    <Modal  
      visible={filterModalVisible}  
      animationType="slide"  
      presentationStyle="pageSheet"  
    >  
      <View style={styles.modalContainer}>  
        <View style={styles.modalHeader}>  
          <Text style={styles.modalTitle}>Filtros de Inventario</Text>  
          <TouchableOpacity  
            onPress={() => setFilterModalVisible(false)}  
            style={styles.closeButton}  
          >  
            <Feather name="x" size={24} color="#666" />  
          </TouchableOpacity>  
        </View>  
  
        <ScrollView style={styles.modalContent}>  
          <Text style={styles.filterLabel}>Categoría</Text>  
          <TouchableOpacity  
            style={[  
              styles.filterOption,  
              selectedCategory === "all" && styles.filterOptionSelected  
            ]}  
            onPress={() => handleCategoryFilter("all")}  
          >  
            <Text style={[  
              styles.filterOptionText,  
              selectedCategory === "all" && styles.filterOptionTextSelected  
            ]}>  
              Todas las categorías  
            </Text>  
            {selectedCategory === "all" && (  
              <Feather name="check" size={20} color="#1a73e8" />  
            )}  
          </TouchableOpacity>  
  
          {categories.map((category) => (  
            <TouchableOpacity  
              key={category.id}  
              style={[  
                styles.filterOption,  
                selectedCategory === category.id && styles.filterOptionSelected  
              ]}  
              onPress={() => handleCategoryFilter(category.id)}  
            >  
              <Text style={[  
                styles.filterOptionText,  
                selectedCategory === category.id && styles.filterOptionTextSelected  
              ]}>  
                {category.nombre}  
              </Text>  
              {selectedCategory === category.id && (  
                <Feather name="check" size={20} color="#1a73e8" />  
              )}  
            </TouchableOpacity>  
          ))}  
        </ScrollView>  
  
        <View style={styles.modalFooter}>  
          <TouchableOpacity  
            style={[styles.modalButton, styles.resetButton]}  
            onPress={() => {  
              setSelectedCategory("all")  
              setSearchTerm("")  
              applyFilters("", "all")  
              setFilterModalVisible(false)  
            }}  
          >  
            <Text style={styles.buttonText}>Reiniciar</Text>  
          </TouchableOpacity>  
          <TouchableOpacity  
            style={[styles.modalButton, styles.applyButton]}  
            onPress={() => setFilterModalVisible(false)}  
          >  
            <Text style={styles.buttonText}>Aplicar</Text>  
          </TouchableOpacity>  
        </View>  
      </View>  
    </Modal>  
  )  
  
  const renderItemDetailModal = () => {  
    if (!selectedItem) return null  
  
    const stockStatus = getStockStatus(selectedItem)  
  
    return (  
      <Modal  
        visible={itemDetailModalVisible}  
        animationType="slide"  
        presentationStyle="pageSheet"  
      >  
        <View style={styles.modalContainer}>  
          <View style={styles.modalHeader}>  
            <Text style={styles.modalTitle}>Detalle del Artículo</Text>  
            <TouchableOpacity  
              onPress={() => setItemDetailModalVisible(false)}  
              style={styles.closeButton}  
            >  
              <Feather name="x" size={24} color="#666" />  
            </TouchableOpacity>  
          </View>  
  
          <ScrollView style={styles.modalContent}>  
            <View style={styles.itemDetailSection}>  
              <Text style={styles.sectionTitle}>Información General</Text>  
              <View style={styles.detailRow}>  
                <Text style={styles.detailLabel}>Nombre:</Text>  
                <Text style={styles.detailValue}>{selectedItem.name}</Text>  
              </View>  
              <View style={styles.detailRow}>  
                <Text style={styles.detailLabel}>Código:</Text>  
                <Text style={styles.detailValue}>{selectedItem.sku}</Text>  
              </View>  
              <View style={styles.detailRow}>  
                <Text style={styles.detailLabel}>Categoría:</Text>  
                <Text style={styles.detailValue}>  
                  {selectedItem.category}  
                </Text>  
              </View>  
              <View style={styles.detailRow}>  
                <Text style={styles.detailLabel}>Descripción:</Text>  
                <Text style={styles.detailValue}>{selectedItem.description}</Text>  
              </View>  
              <View style={styles.detailRow}>  
                <Text style={styles.detailLabel}>Proveedor:</Text>  
                <Text style={styles.detailValue}>{selectedItem.supplier}</Text>  
              </View>  
              <View style={styles.detailRow}>  
                <Text style={styles.detailLabel}>Ubicación:</Text>  
                <Text style={styles.detailValue}>{selectedItem.location}</Text>  
              </View>  
            </View>  
  
            <View style={styles.itemDetailSection}>  
              <Text style={styles.sectionTitle}>Inventario</Text>  
              <View style={styles.detailRow}>  
                <Text style={styles.detailLabel}>Stock Actual:</Text>  
                <Text style={[  
                  styles.detailValue,  
                  { color: stockStatus.color }  
                ]}>  
                  {selectedItem.stock} unidades  
                </Text>  
              </View>  
              <View style={styles.detailRow}>  
                <Text style={styles.detailLabel}>Stock Mínimo:</Text>  
                <Text style={styles.detailValue}>  
                  {selectedItem.minStock ?? 0} unidades  
                </Text>  
              </View>  
              <View style={styles.detailRow}>  
                <Text style={styles.detailLabel}>Estado:</Text>  
                <Text style={[  
                  styles.detailValue,  
                  { color: stockStatus.color }  
                ]}>  
                  {stockStatus.status}  
                </Text>  
              </View>  
            </View>  
  
            <View style={styles.itemDetailSection}>  
              <Text style={styles.sectionTitle}>Precios</Text>  
              <View style={styles.detailRow}>  
                <Text style={styles.detailLabel}>Precio de Compra:</Text>  
                <Text style={styles.detailValue}>  
                  {formatCurrency(selectedItem.cost ?? 0)}  
                </Text>  
              </View>  
              <View style={styles.detailRow}>  
                <Text style={styles.detailLabel}>Precio de Venta:</Text>  
                <Text style={styles.detailValue}>  
                  {formatCurrency(selectedItem.priceUSD)}  
                </Text>  
              </View>  
              <View style={styles.detailRow}>  
                <Text style={styles.detailLabel}>Margen:</Text>  
                <Text style={styles.detailValue}>  
                  {selectedItem.cost ? ((selectedItem.priceUSD - selectedItem.cost) / selectedItem.cost * 100).toFixed(1) : '0.0'}%  
                </Text>  
              </View>  
            </View>  
          </ScrollView>  
  
          {userRole !== 'client' && (  
            <View style={styles.modalFooter}>  
              <TouchableOpacity  
                style={[styles.modalButton, styles.editButton]}  
                onPress={() => handleEditItem(selectedItem)}  
              >  
                <Feather name="edit" size={20} color="#fff" />  
                <Text style={styles.buttonText}>Editar</Text>  
              </TouchableOpacity>  
            </View>  
          )}  
        </View>  
      </Modal>  
    )  
  }  
  
  if (loading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#1a73e8" />  
        <Text style={styles.loadingText}>Cargando inventario...</Text>  
      </View>  
    )  
  }  
  
  return (  
    <View style={styles.container}>  
      <View style={styles.header}>  
        <View style={styles.searchContainer}>  
          <Feather name="search" size={20} color="#666" style={styles.searchIcon} />  
          <TextInput  
            style={styles.searchInput}  
            placeholder="Buscar por nombre, código o descripción"  
            value={searchTerm}  
            onChangeText={handleSearch}  
            returnKeyType="search"  
          />  
          {searchTerm.length > 0 && (  
            <TouchableOpacity  
              onPress={() => handleSearch("")}  
              style={styles.clearButton}  
            >  
              <Feather name="x-circle" size={20} color="#666" />  
            </TouchableOpacity>  
          )}  
        </View>  
  
        <TouchableOpacity  
          style={styles.filterButton}  
          onPress={() => setFilterModalVisible(true)}  
        >  
          <Feather name="filter" size={20} color="#fff" />  
        </TouchableOpacity>  
      </View>  
  
      {error ? (  
        <View style={styles.errorContainer}>  
          <MaterialIcons name="error" size={64} color="#f44336" />  
          <Text style={styles.errorText}>{error}</Text>  
          <TouchableOpacity style={styles.retryButton} onPress={loadInventoryData}>  
            <Text style={styles.retryButtonText}>Reintentar</Text>  
          </TouchableOpacity>  
        </View>  
      ) : (  
        <>  
          {filteredInventory.length === 0 ? (  
            <View style={styles.emptyContainer}>  
              <Feather name="package" size={64} color="#ccc" />  
              <Text style={styles.emptyText}>No se encontraron artículos</Text>  
              {userRole !== 'client' && (  
                <TouchableOpacity style={styles.addFirstItemButton} onPress={handleAddItem}>  
                  <Text style={styles.addFirstItemText}>Agregar primer artículo</Text>  
                </TouchableOpacity>  
              )}  
            </View>  
          ) : (  
            <FlatList  
              data={filteredInventory}  
              keyExtractor={(item) => item.id!.toString()}  
              renderItem={renderInventoryItem}  
              refreshControl={  
                <RefreshControl refreshing={refreshing} onRefresh={loadInventoryData} colors={["#1a73e8"]} />  
              }  
              contentContainerStyle={styles.listContainer}  
              showsVerticalScrollIndicator={false}  
            />  
          )}  
  
          {userRole !== 'client' && (  
            <TouchableOpacity style={styles.fab} onPress={handleAddItem}>  
              <Feather name="plus" size={24} color="#fff" />  
            </TouchableOpacity>  
          )}  
        </>  
      )}  
  
      {renderFilterModal()}  
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
  header: {  
    backgroundColor: "#fff",  
    padding: 16,  
    flexDirection: "row",  
    alignItems: "center",  
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
    marginRight: 12,  
  },  
  searchIcon: {  
    marginRight: 8,  
  },  
  searchInput: {  
    flex: 1,  
    height: 40,  
    fontSize: 16,  
    color: "#333",  
  },  
  clearButton: {  
    padding: 4,  
  },  
  filterButton: {  
    backgroundColor: "#1a73e8",  
    padding: 10,  
    borderRadius: 8,  
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
  addFirstItemButton: {  
    backgroundColor: "#1a73e8",  
    paddingHorizontal: 20,  
    paddingVertical: 12,  
    borderRadius: 8,  
  },  
  addFirstItemText: {  
    color: "#fff",  
    fontWeight: "bold",  
    fontSize: 16,  
  },  
  listContainer: {  
    padding: 16,  
  },  
  inventoryCard: {  
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
  inventoryHeader: {  
    flexDirection: "row",  
    alignItems: "center",  
    marginBottom: 12,  
  },  
  inventoryIconContainer: {  
    width: 50,  
    height: 50,  
    borderRadius: 25,  
    backgroundColor: "#f0f0f0",  
    justifyContent: "center",  
    alignItems: "center",  
    marginRight: 12,  
  },  
  inventoryInfo: {  
    flex: 1,  
  },  
  inventoryName: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 4,  
  },  
  inventoryCode: {  
    fontSize: 14,  
    color: "#666",  
    marginBottom: 2,  
  },  
  inventoryCategory: {  
    fontSize: 14,  
    color: "#1a73e8",  
    fontWeight: "500",  
  },  
  inventoryStatus: {  
    alignItems: "flex-end",  
  },  
  stockBadge: {  
    paddingHorizontal: 8,  
    paddingVertical: 4,  
    borderRadius: 12,  
  },  
  stockText: {  
    color: "#fff",  
    fontSize: 12,  
    fontWeight: "bold",  
  },  
  inventoryDetails: {  
    marginBottom: 12,  
  },  
  inventoryDetail: {  
    flexDirection: "row",  
    alignItems: "center",  
    marginBottom: 4,  
  },  
  inventoryStock: {  
    fontSize: 14,  
    color: "#666",  
    marginLeft: 8,  
  },  
  inventorySupplier: {  
    fontSize: 14,  
    color: "#666",  
    marginLeft: 8,  
  },  
  inventoryLocation: {  
    fontSize: 14,  
    color: "#666",  
    marginLeft: 8,  
  },  
  inventoryFooter: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    borderTopWidth: 1,  
    borderTopColor: "#f0f0f0",  
    paddingTop: 8,  
  },  
  priceContainer: {  
    alignItems: "center",  
  },  
  priceLabel: {  
    fontSize: 12,  
    color: "#666",  
    marginBottom: 2,  
  },  
  priceValue: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  fab: {  
    position: "absolute",  
    bottom: 20,  
    right: 20,  
    width: 56,  
    height: 56,  
    borderRadius: 28,  
    backgroundColor: "#1a73e8",  
    justifyContent: "center",  
    alignItems: "center",  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 4 },  
    shadowOpacity: 0.3,  
    shadowRadius: 8,  
    elevation: 8,  
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
  filterLabel: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 16,  
  },  
  filterOption: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    paddingVertical: 12,  
    paddingHorizontal: 16,  
    borderRadius: 8,  
    marginBottom: 8,  
    backgroundColor: "#f8f9fa",  
  },  
  filterOptionSelected: {  
    backgroundColor: "#e8f0fe",  
  },  
  filterOptionText: {  
    fontSize: 16,  
    color: "#333",  
  },  
  filterOptionTextSelected: {  
    color: "#1a73e8",  
    fontWeight: "500",  
  },  
  itemDetailSection: {  
    marginBottom: 24,  
  },  
  sectionTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 16,  
  },  
  detailRow: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    paddingVertical: 8,  
    borderBottomWidth: 1,  
    borderBottomColor: "#f0f0f0",  
  },  
  detailLabel: {  
    fontSize: 16,  
    color: "#666",  
    fontWeight: "500",  
  },  
  detailValue: {  
    fontSize: 16,  
    color: "#333",  
    flex: 1,  
    textAlign: "right",  
  },  
  modalFooter: {  
    flexDirection: "row",  
    padding: 16,  
    borderTopWidth: 1,  
    borderTopColor: "#e1e4e8",  
  },  
  modalButton: {  
    flex: 1,  
    flexDirection: "row",  
    justifyContent: "center",  
    alignItems: "center",  
    paddingVertical: 12,  
    borderRadius: 8,  
    marginHorizontal: 8,  
  },  
  resetButton: {  
    backgroundColor: "#666",  
  },  
  applyButton: {  
    backgroundColor: "#1a73e8",  
  },  
  editButton: {  
    backgroundColor: "#1a73e8",  
  },  
  buttonText: {  
    color: "#fff",  
    fontWeight: "bold",  
    marginLeft: 8,  
  },  
})