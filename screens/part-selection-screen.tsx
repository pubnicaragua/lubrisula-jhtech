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
import inventoryService from "../services/inventory-service"
import currencyService from "../services/currency-service"
import { type InventoryItem, Currency } from "../types/inventory"
import { theme } from "../styles/theme"

const PartSelectionScreen = ({ navigation, route }) => {
  const { onPartSelect, selectedParts = [], currency = Currency.USD, multiSelect = true } = route.params || {}

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

  // Cargar inventario cuando la pantalla obtiene el foco
  useFocusEffect(
    useCallback(() => {
      loadInventory()
    }, []),
  )

  const loadInventory = async () => {
    try {
      setLoading(true)

      // Inicializar cantidades para partes ya seleccionadas
      const initialQuantities: Record<string, number> = {}
      selectedParts.forEach((part) => {
        initialQuantities[part.id] = part.quantity || 1
      })
      setQuantities(initialQuantities)

      // Cargar categorías
      const allCategories = await inventoryService.getUniqueCategories()
      setCategories(allCategories)

      // Cargar inventario
      const allItems = await inventoryService.getInventoryItems({ inStock: true })
      setInventoryItems(allItems)
      setFilteredItems(allItems)
    } catch (error) {
      console.error("Error al cargar inventario:", error)
      Alert.alert("Error", "No se pudieron cargar los repuestos")
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = useCallback(() => {
    let filtered = [...inventoryItems]

    // Aplicar filtro de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.sku.toLowerCase().includes(term) ||
          (item.description && item.description.toLowerCase().includes(term)),
      )
    }

    // Aplicar filtro de categoría
    if (selectedCategory) {
      filtered = filtered.filter((item) => item.category === selectedCategory)
    }

    setFilteredItems(filtered)
  }, [inventoryItems, searchTerm, selectedCategory])

  // Aplicar filtros cuando cambian los criterios
  useFocusEffect(
    useCallback(() => {
      applyFilters()
    }, [applyFilters]),
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
      onPartSelect && onPartSelect([{ ...item, quantity: 1 }])
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

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) return // No permitir cantidades menores a 1

    const item = inventoryItems.find((i) => i.id === itemId)
    if (item && quantity > item.stock) {
      Alert.alert("Cantidad no disponible", `Solo hay ${item.stock} unidades disponibles en inventario.`)
      return
    }

    setQuantities((prev) => ({ ...prev, [itemId]: quantity }))
  }

  const handleConfirmSelection = () => {
    // Preparar repuestos seleccionados con sus cantidades
    const partsWithQuantities = selectedItems.map((item) => ({
      ...item,
      quantity: quantities[item.id] || 1,
    }))

    onPartSelect && onPartSelect(partsWithQuantities)
    navigation.goBack()
  }

  const renderPartItem = ({ item }: { item: InventoryItem }) => {
    const isSelected = selectedItems.some((selectedItem) => selectedItem.id === item.id)
    const price = currency === Currency.USD ? item.priceUSD : item.priceHNL
    const formattedPrice = currencyService.formatCurrency(price, currency)

    const stockColor =
      item.stock === 0
        ? theme.colors.error
        : item.stock <= (item.minStock || 0)
          ? theme.colors.warning
          : theme.colors.success

    return (
      <TouchableOpacity
        style={[styles.partItem, isSelected && styles.selectedPartItem]}
        onPress={() => handleItemPress(item)}
      >
        <View style={styles.partContent}>
          <View style={styles.partHeader}>
            <Text style={styles.partName}>{item.name}</Text>
            {multiSelect && (
              <TouchableOpacity
                style={[styles.checkboxContainer, isSelected && styles.checkboxSelected]}
                onPress={() => toggleItemSelection(item)}
              >
                {isSelected && <Feather name="check" size={16} color="#fff" />}
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.partSku}>SKU: {item.sku}</Text>

          {item.description && <Text style={styles.partDescription}>{item.description}</Text>}

          <View style={styles.partFooter}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>

            <View style={styles.stockContainer}>
              <Feather name="box" size={14} color={stockColor} style={styles.stockIcon} />
              <Text style={[styles.stockText, { color: stockColor }]}>
                {item.stock} {item.unit || "unidades"}
              </Text>
            </View>

            <Text style={styles.partPrice}>{formattedPrice}</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const renderCategoryFilters = () => {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
        <TouchableOpacity
          style={[styles.categoryChip, selectedCategory === undefined && styles.categoryChipSelected]}
          onPress={() => handleCategorySelect(undefined)}
        >
          <Text style={[styles.categoryChipText, selectedCategory === undefined && styles.categoryChipTextSelected]}>
            Todos
          </Text>
        </TouchableOpacity>

        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[styles.categoryChip, selectedCategory === category && styles.categoryChipSelected]}
            onPress={() => handleCategorySelect(category)}
          >
            <Text style={[styles.categoryChipText, selectedCategory === category && styles.categoryChipTextSelected]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    )
  }

  const renderItemDetailModal = () => {
    if (!selectedItem) return null

    const isSelected = selectedItems.some((item) => item.id === selectedItem.id)
    const quantity = quantities[selectedItem.id] || 1
    const priceUSD = currencyService.formatCurrency(selectedItem.priceUSD, Currency.USD)
    const priceHNL = currencyService.formatCurrency(selectedItem.priceHNL, Currency.HNL)
    const totalPrice = currencyService.formatCurrency(
      (currency === Currency.USD ? selectedItem.priceUSD : selectedItem.priceHNL) * quantity,
      currency,
    )

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
              <Text style={styles.modalTitle}>Detalle del Repuesto</Text>
              <TouchableOpacity onPress={() => setItemDetailModalVisible(false)}>
                <Feather name="x" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.partDetailTitle}>{selectedItem.name}</Text>
              <Text style={styles.partDetailSku}>SKU: {selectedItem.sku}</Text>

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
                    <Text style={styles.detailValue}>
                      {currencyService.formatCurrency(selectedItem.cost, Currency.USD)}
                    </Text>
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
                          selectedItem.stock === 0
                            ? theme.colors.error
                            : selectedItem.stock <= (selectedItem.minStock || 0)
                              ? theme.colors.warning
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

              <View style={styles.quantitySection}>
                <Text style={styles.quantitySectionTitle}>Cantidad</Text>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(selectedItem.id, quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    <Feather name="minus" size={20} color={quantity <= 1 ? "#ccc" : theme.colors.primary} />
                  </TouchableOpacity>

                  <TextInput
                    style={styles.quantityInput}
                    value={quantity.toString()}
                    onChangeText={(text) => {
                      const newQuantity = Number.parseInt(text)
                      if (!isNaN(newQuantity) && newQuantity >= 1) {
                        updateQuantity(selectedItem.id, newQuantity)
                      }
                    }}
                    keyboardType="number-pad"
                  />

                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(selectedItem.id, quantity + 1)}
                    disabled={quantity >= selectedItem.stock}
                  >
                    <Feather
                      name="plus"
                      size={20}
                      color={quantity >= selectedItem.stock ? "#ccc" : theme.colors.primary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

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
        </View>
      </Modal>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color={theme.colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar repuestos por nombre o SKU"
            value={searchTerm}
            onChangeText={handleSearch}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm("")} style={styles.clearButton}>
              <Feather name="x-circle" size={18} color={theme.colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {renderCategoryFilters()}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando repuestos...</Text>
        </View>
      ) : (
        <>
          {filteredItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="inventory" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No se encontraron repuestos</Text>
              <Text style={styles.emptySubtext}>Intenta con otra búsqueda o categoría</Text>
            </View>
          ) : (
            <FlatList
              data={filteredItems}
              renderItem={renderPartItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
            />
          )}
        </>
      )}

      {multiSelect && selectedItems.length > 0 && (
        <View style={styles.selectionBar}>
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionCount}>{selectedItems.length} repuestos seleccionados</Text>
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
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 16,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
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
  categoriesContainer: {
    backgroundColor: theme.colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.lightGray,
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: theme.colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  categoryChipTextSelected: {
    color: theme.colors.white,
    fontWeight: "500",
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
    paddingBottom: 100, // Espacio para la barra de selección
  },
  partItem: {
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedPartItem: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  partContent: {
    padding: 16,
  },
  partHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  partName: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
    flex: 1,
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  partSku: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 8,
  },
  partDescription: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 12,
  },
  partFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  categoryBadge: {
    backgroundColor: theme.colors.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    color: theme.colors.text,
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
  },
  partPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  selectionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
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
    color: theme.colors.text,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: theme.colors.white,
    fontWeight: "bold",
    fontSize: 16,
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
  partDetailTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 4,
  },
  partDetailSku: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 16,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 16,
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
    fontSize: 14,
    color: theme.colors.textLight,
  },
  detailValue: {
    flex: 2,
    fontSize: 14,
    color: theme.colors.text,
  },
  quantitySection: {
    marginBottom: 16,
  },
  quantitySectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
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
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityInput: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 4,
    textAlign: "center",
    fontSize: 16,
    marginHorizontal: 8,
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: theme.colors.lightGray,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.white,
  },
})

export default PartSelectionScreen
