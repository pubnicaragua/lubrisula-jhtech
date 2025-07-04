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
  Image,
} from "react-native"
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons"
import { useFocusEffect } from "@react-navigation/native"
import { Picker } from "@react-native-picker/picker"
import * as inventoryService from "../services/inventory-service"
import * as currencyService from "../services/currency-service"
import { theme } from "../styles/theme"

const InventoryScreen = ({ navigation }) => {
  const [inventoryItems, setInventoryItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState(undefined)
  const [selectedSupplier, setSelectedSupplier] = useState(undefined)
  const [showInStock, setShowInStock] = useState(false)
  const [showLowStock, setShowLowStock] = useState(false)
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState("asc")
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState("USD")
  const [itemDetailModalVisible, setItemDetailModalVisible] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [error, setError] = useState(null)

// 
  // Usar el hook useAuth para verificar permisos
  const { hasPermission } = useAuth()
  const canManageInventory = hasPermission("create_inventory") || hasPermission("update_inventory")

  const loadInventoryItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Load categories and suppliers for filters
      const categoriesList = await inventoryService.getUniqueCategories()
      setCategories(categoriesList)

      const suppliersList = await inventoryService.getUniqueSuppliers()
      setSuppliers(suppliersList)

      // Get preferred currency
      const preferredCurrency = await currencyService.getPreferredCurrency()
      setSelectedCurrency(preferredCurrency)

      // Apply filters
      const filter = {
        searchTerm: searchTerm || undefined,
        category: selectedCategory,
        supplier: selectedSupplier,
        inStock: showInStock,
        lowStock: showLowStock,
        sortBy,
        sortOrder,
      }

      const items = await inventoryService.getInventoryItems(filter)
      setInventoryItems(items)
    } catch (error) {
      console.error("Error loading inventory items:", error)
      setError("No se pudieron cargar los artículos del inventario")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [searchTerm, selectedCategory, selectedSupplier, showInStock, showLowStock, sortBy, sortOrder])

  useFocusEffect(
    useCallback(() => {
      loadInventoryItems()
    }, [loadInventoryItems]),
  )

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadInventoryItems()
  }, [loadInventoryItems])

  const handleSearch = (text) => {
    setSearchTerm(text)
  }

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  }

  const handleItemPress = (item) => {
    setSelectedItem(item)
    setItemDetailModalVisible(true)
  }

  const handleAddItem = () => {
    navigation.navigate("NewInventoryItem")
  }

  const handleEditItem = (item) => {
    setItemDetailModalVisible(false)
    navigation.navigate("EditInventoryItem", { itemId: item.id })
  }

  const handleDeleteItem = (item) => {
    Alert.alert("Confirmar Eliminación", `¿Estás seguro de que deseas eliminar ${item.name}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await inventoryService.deleteInventoryItem(item.id)
            setItemDetailModalVisible(false)
            loadInventoryItems()
            Alert.alert("Éxito", "Artículo eliminado correctamente")
          } catch (error) {
            console.error("Error deleting item:", error)
            Alert.alert("Error", "No se pudo eliminar el artículo")
          }
        },
      },
    ])
  }

  const toggleCurrency = async () => {
    const newCurrency = selectedCurrency === "USD" ? "HNL" : "USD"
    setSelectedCurrency(newCurrency)
    await currencyService.setPreferredCurrency(newCurrency)
  }

  const renderItem = ({ item }) => {
    const price = selectedCurrency === "USD" ? item.priceUSD : item.priceHNL
    const formattedPrice = currencyService.formatCurrency(price, selectedCurrency)

    const stockColor =
      item.minStock && item.stock <= item.minStock
        ? theme.colors.error
        : item.stock === 0
          ? theme.colors.error
          : theme.colors.success

    return (
      <TouchableOpacity style={styles.itemContainer} onPress={() => handleItemPress(item)}>
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemSku}>SKU: {item.sku}</Text>
          </View>

          <View style={styles.itemDetails}>
            <View style={styles.itemDetail}>
              <MaterialIcons name="category" size={16} color={theme.colors.primary} />
              <Text style={styles.itemCategory}>{item.category}</Text>
            </View>

            {item.supplier && (
              <View style={styles.itemDetail}>
                <FontAwesome name="truck" size={16} color={theme.colors.primary} />
                <Text style={styles.itemSupplier}>{item.supplier}</Text>
              </View>
            )}

            <View style={styles.itemDetail}>
              <MaterialIcons name="inventory" size={16} color={stockColor} />
              <Text style={[styles.itemStock, { color: stockColor }]}>
                Stock: {item.stock} {item.unit || "unidades"}
              </Text>
            </View>
          </View>

          <View style={styles.itemFooter}>
            <Text style={styles.itemPrice}>{formattedPrice}</Text>

            {canManageInventory && (
              <TouchableOpacity style={styles.editButton} onPress={() => handleEditItem(item)}>
                <MaterialIcons name="edit" size={20} color={theme.colors.white} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const renderFilterModal = () => (
    <Modal
      visible={filterModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtros de Inventario</Text>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.filterLabel}>Categoría</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedCategory}
                onValueChange={(value) => setSelectedCategory(value)}
                style={styles.picker}
              >
                <Picker.Item label="Todas las categorías" value={undefined} />
                {categories.map((category, index) => (
                  <Picker.Item key={index} label={category} value={category} />
                ))}
              </Picker>
            </View>

            <Text style={styles.filterLabel}>Proveedor</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedSupplier}
                onValueChange={(value) => setSelectedSupplier(value)}
                style={styles.picker}
              >
                <Picker.Item label="Todos los proveedores" value={undefined} />
                {suppliers.map((supplier, index) => (
                  <Picker.Item key={index} label={supplier} value={supplier} />
                ))}
              </Picker>
            </View>

            <Text style={styles.filterLabel}>Ordenar por</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={sortBy} onValueChange={(value) => setSortBy(value)} style={styles.picker}>
                <Picker.Item label="Nombre" value="name" />
                <Picker.Item label="SKU" value="sku" />
                <Picker.Item label="Stock" value="stock" />
                <Picker.Item label="Precio" value="price" />
              </Picker>
            </View>

            <View style={styles.sortOrderContainer}>
              <Text style={styles.filterLabel}>Orden</Text>
              <TouchableOpacity onPress={toggleSortOrder} style={styles.sortOrderButton}>
                <Text style={styles.sortOrderText}>{sortOrder === "asc" ? "Ascendente" : "Descendente"}</Text>
                <Ionicons
                  name={sortOrder === "asc" ? "arrow-up" : "arrow-down"}
                  size={18}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.checkboxContainer}>
              <TouchableOpacity style={styles.checkbox} onPress={() => setShowInStock(!showInStock)}>
                <Ionicons name={showInStock ? "checkbox" : "square-outline"} size={24} color={theme.colors.primary} />
                <Text style={styles.checkboxLabel}>Mostrar solo en stock</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.checkbox} onPress={() => setShowLowStock(!showLowStock)}>
                <Ionicons name={showLowStock ? "checkbox" : "square-outline"} size={24} color={theme.colors.primary} />
                <Text style={styles.checkboxLabel}>Mostrar stock bajo</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.resetButton]}
              onPress={() => {
                setSelectedCategory(undefined)
                setSelectedSupplier(undefined)
                setShowInStock(false)
                setShowLowStock(false)
                setSortBy("name")
                setSortOrder("asc")
              }}
            >
              <Text style={styles.buttonText}>Reiniciar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.applyButton]}
              onPress={() => {
                setFilterModalVisible(false)
                loadInventoryItems()
              }}
            >
              <Text style={styles.buttonText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )

  const renderItemDetailModal = () => {
    if (!selectedItem) return null

    const priceUSD = currencyService.formatCurrency(selectedItem.priceUSD, "USD")
    const priceHNL = currencyService.formatCurrency(selectedItem.priceHNL, "HNL")

    return (
      <Modal
        visible={itemDetailModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setItemDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalle del Artículo</Text>
              <TouchableOpacity onPress={() => setItemDetailModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.itemDetailTitle}>{selectedItem.name}</Text>
              <Text style={styles.itemDetailSku}>SKU: {selectedItem.sku}</Text>

              {selectedItem.images && selectedItem.images.length > 0 && (
                <Image source={{ uri: selectedItem.images[0] }} style={styles.itemImage} resizeMode="contain" />
              )}

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Información General</Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Categoría:</Text>
                  <Text style={styles.detailValue}>{selectedItem.category}</Text>
                </View>

                {selectedItem.subcategory && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Subcategoría:</Text>
                    <Text style={styles.detailValue}>{selectedItem.subcategory}</Text>
                  </View>
                )}

                {selectedItem.description && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Descripción:</Text>
                    <Text style={styles.detailValue}>{selectedItem.description}</Text>
                  </View>
                )}

                {selectedItem.supplier && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Proveedor:</Text>
                    <Text style={styles.detailValue}>{selectedItem.supplier}</Text>
                  </View>
                )}

                {selectedItem.location && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Ubicación:</Text>
                    <Text style={styles.detailValue}>{selectedItem.location}</Text>
                  </View>
                )}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Precios</Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Precio (USD):</Text>
                  <Text style={styles.detailValue}>{priceUSD}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Precio (HNL):</Text>
                  <Text style={styles.detailValue}>{priceHNL}</Text>
                </View>

                {selectedItem.cost !== undefined && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Costo:</Text>
                    <Text style={styles.detailValue}>{currencyService.formatCurrency(selectedItem.cost, "USD")}</Text>
                  </View>
                )}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Inventario</Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Stock Actual:</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      {
                        color:
                          selectedItem.minStock && selectedItem.stock <= selectedItem.minStock
                            ? theme.colors.error
                            : theme.colors.success,
                      },
                    ]}
                  >
                    {selectedItem.stock} {selectedItem.unit || "unidades"}
                  </Text>
                </View>

                {selectedItem.minStock !== undefined && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Stock Mínimo:</Text>
                    <Text style={styles.detailValue}>
                      {selectedItem.minStock} {selectedItem.unit || "unidades"}
                    </Text>
                  </View>
                )}

                {selectedItem.maxStock !== undefined && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Stock Máximo:</Text>
                    <Text style={styles.detailValue}>
                      {selectedItem.maxStock} {selectedItem.unit || "unidades"}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            {canManageInventory && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.button, styles.deleteButton]}
                  onPress={() => handleDeleteItem(selectedItem)}
                >
                  <Text style={styles.buttonText}>Eliminar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.editDetailButton]}
                  onPress={() => handleEditItem(selectedItem)}
                >
                  <Text style={styles.buttonText}>Editar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.colors.text} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, SKU o descripción"
            value={searchTerm}
            onChangeText={handleSearch}
            returnKeyType="search"
            onSubmitEditing={() => loadInventoryItems()}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchTerm("")
                loadInventoryItems()
              }}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.filterButton} onPress={() => setFilterModalVisible(true)}>
            <Ionicons name="filter" size={24} color={theme.colors.white} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.currencyButton} onPress={toggleCurrency}>
            <Text style={styles.currencyButtonText}>{selectedCurrency}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={64} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadInventoryItems}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando inventario...</Text>
        </View>
      ) : (
        <>
          {inventoryItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="inventory" size={64} color={theme.colors.lightGray} />
              <Text style={styles.emptyText}>No se encontraron artículos</Text>
              <Text style={styles.emptySubtext}>
                {searchTerm || selectedCategory || selectedSupplier || showInStock || showLowStock
                  ? "Intenta con otros filtros de búsqueda"
                  : "Agrega artículos al inventario para comenzar"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={inventoryItems}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
          )}
        </>
      )}

      {canManageInventory && (
        <TouchableOpacity style={styles.fab} onPress={handleAddItem}>
          <Ionicons name="add" size={24} color={theme.colors.white} />
        </TouchableOpacity>
      )}

      {renderFilterModal()}
      {renderItemDetailModal()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  headerButtons: {
    flexDirection: "row",
    marginLeft: 8,
  },
  filterButton: {
    backgroundColor: theme.colors.primary,
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  currencyButton: {
    backgroundColor: theme.colors.secondary,
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  currencyButtonText: {
    color: theme.colors.white,
    fontWeight: "bold",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: "center",
    marginTop: 8,
  },
  listContent: {
    padding: 16,
  },
  itemContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  itemContent: {
    padding: 16,
  },
  itemHeader: {
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  itemSku: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  itemDetails: {
    marginBottom: 8,
  },
  itemDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  itemCategory: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 6,
  },
  itemSupplier: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 6,
  },
  itemStock: {
    fontSize: 14,
    marginLeft: 6,
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  editButton: {
    backgroundColor: theme.colors.secondary,
    padding: 6,
    borderRadius: 4,
  },
  fab: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: theme.colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  modalContent: {
    padding: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  sortOrderContainer: {
    marginBottom: 16,
  },
  sortOrderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
  },
  sortOrderText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  checkboxContainer: {
    marginBottom: 16,
  },
  checkbox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  checkboxLabel: {
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 8,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  resetButton: {
    backgroundColor: theme.colors.lightGray,
    marginRight: 8,
  },
  applyButton: {
    backgroundColor: theme.colors.primary,
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
    marginRight: 8,
  },
  editDetailButton: {
    backgroundColor: theme.colors.primary,
    marginLeft: 8,
  },
  buttonText: {
    color: theme.colors.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  itemDetailTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 4,
  },
  itemDetailSku: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 16,
  },
  itemImage: {
    width: "100%",
    height: 200,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.lightGray,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: 4,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  detailLabel: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  detailValue: {
    flex: 2,
    fontSize: 16,
    color: theme.colors.text,
  },
})

export default InventoryScreen
