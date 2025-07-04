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
import { type Service, Currency, ServiceCategory } from "../types/inventory"
import { theme } from "../styles/theme"

const ServiceSelectionScreen = ({ navigation, route }) => {
  const { onServiceSelect, selectedServices = [], currency = Currency.USD, multiSelect = true } = route.params || {}

  const [services, setServices] = useState<Service[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined)
  const [selectedItems, setSelectedItems] = useState<Service[]>(selectedServices)
  const [serviceDetailModalVisible, setServiceDetailModalVisible] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  // Cargar servicios cuando la pantalla obtiene el foco
  useFocusEffect(
    useCallback(() => {
      loadServices()
    }, []),
  )

  const loadServices = async () => {
    try {
      setLoading(true)

      // Inicializar cantidades para servicios ya seleccionados
      const initialQuantities: Record<string, number> = {}
      selectedServices.forEach((service) => {
        initialQuantities[service.id] = service.quantity || 1
      })
      setQuantities(initialQuantities)

      // Cargar servicios
      const allServices = await inventoryService.getServices()
      setServices(allServices)
      setFilteredServices(allServices)
    } catch (error) {
      console.error("Error al cargar servicios:", error)
      Alert.alert("Error", "No se pudieron cargar los servicios")
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = useCallback(() => {
    let filtered = [...services]

    // Aplicar filtro de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (service) =>
          service.name.toLowerCase().includes(term) ||
          service.sku.toLowerCase().includes(term) ||
          (service.description && service.description.toLowerCase().includes(term)),
      )
    }

    // Aplicar filtro de categoría
    if (selectedCategory) {
      filtered = filtered.filter((service) => service.category === selectedCategory)
    }

    setFilteredServices(filtered)
  }, [services, searchTerm, selectedCategory])

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

  const handleServicePress = (service: Service) => {
    if (multiSelect) {
      // Si es selección múltiple, mostrar detalles
      setSelectedService(service)
      setServiceDetailModalVisible(true)
    } else {
      // Si es selección única, seleccionar directamente
      onServiceSelect && onServiceSelect([{ ...service, quantity: 1 }])
      navigation.goBack()
    }
  }

  const toggleServiceSelection = (service: Service) => {
    const isSelected = selectedItems.some((item) => item.id === service.id)

    if (isSelected) {
      // Deseleccionar
      setSelectedItems(selectedItems.filter((item) => item.id !== service.id))
      setQuantities((prev) => {
        const newQuantities = { ...prev }
        delete newQuantities[service.id]
        return newQuantities
      })
    } else {
      // Seleccionar
      const quantity = 1 // Cantidad por defecto
      setSelectedItems([...selectedItems, service])
      setQuantities((prev) => ({ ...prev, [service.id]: quantity }))
    }
  }

  const updateQuantity = (serviceId: string, quantity: number) => {
    if (quantity < 1) return // No permitir cantidades menores a 1

    setQuantities((prev) => ({ ...prev, [serviceId]: quantity }))
  }

  const handleConfirmSelection = () => {
    // Preparar servicios seleccionados con sus cantidades
    const servicesWithQuantities = selectedItems.map((service) => ({
      ...service,
      quantity: quantities[service.id] || 1,
    }))

    onServiceSelect && onServiceSelect(servicesWithQuantities)
    navigation.goBack()
  }

  const renderServiceItem = ({ item }: { item: Service }) => {
    const isSelected = selectedItems.some((service) => service.id === item.id)
    const price = currency === Currency.USD ? item.priceUSD : item.priceHNL
    const formattedPrice = currencyService.formatCurrency(price, currency)

    return (
      <TouchableOpacity
        style={[styles.serviceItem, isSelected && styles.selectedServiceItem]}
        onPress={() => handleServicePress(item)}
      >
        <View style={styles.serviceContent}>
          <View style={styles.serviceHeader}>
            <Text style={styles.serviceName}>{item.name}</Text>
            {multiSelect && (
              <TouchableOpacity
                style={[styles.checkboxContainer, isSelected && styles.checkboxSelected]}
                onPress={() => toggleServiceSelection(item)}
              >
                {isSelected && <Feather name="check" size={16} color="#fff" />}
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.serviceSku}>SKU: {item.sku}</Text>

          {item.description && <Text style={styles.serviceDescription}>{item.description}</Text>}

          <View style={styles.serviceFooter}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>

            {item.estimatedTime && (
              <View style={styles.timeBadge}>
                <Feather name="clock" size={12} color={theme.colors.primary} style={styles.timeIcon} />
                <Text style={styles.timeText}>
                  {item.estimatedTime >= 60
                    ? `${Math.floor(item.estimatedTime / 60)}h ${item.estimatedTime % 60}m`
                    : `${item.estimatedTime}m`}
                </Text>
              </View>
            )}

            <Text style={styles.servicePrice}>{formattedPrice}</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const renderCategoryFilters = () => {
    const categories = Object.values(ServiceCategory)

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

  const renderServiceDetailModal = () => {
    if (!selectedService) return null

    const isSelected = selectedItems.some((service) => service.id === selectedService.id)
    const quantity = quantities[selectedService.id] || 1
    const priceUSD = currencyService.formatCurrency(selectedService.priceUSD, Currency.USD)
    const priceHNL = currencyService.formatCurrency(selectedService.priceHNL, Currency.HNL)
    const totalPrice = currencyService.formatCurrency(
      (currency === Currency.USD ? selectedService.priceUSD : selectedService.priceHNL) * quantity,
      currency,
    )

    return (
      <Modal
        visible={serviceDetailModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setServiceDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalle del Servicio</Text>
              <TouchableOpacity onPress={() => setServiceDetailModalVisible(false)}>
                <Feather name="x" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.serviceDetailTitle}>{selectedService.name}</Text>
              <Text style={styles.serviceDetailSku}>SKU: {selectedService.sku}</Text>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Información General</Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Categoría:</Text>
                  <Text style={styles.detailValue}>{selectedService.category}</Text>
                </View>

                {selectedService.description && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Descripción:</Text>
                    <Text style={styles.detailValue}>{selectedService.description}</Text>
                  </View>
                )}

                {selectedService.estimatedTime && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Tiempo estimado:</Text>
                    <Text style={styles.detailValue}>
                      {selectedService.estimatedTime >= 60
                        ? `${Math.floor(selectedService.estimatedTime / 60)}h ${selectedService.estimatedTime % 60}m`
                        : `${selectedService.estimatedTime}m`}
                    </Text>
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
              </View>

              {selectedService.requiredParts && selectedService.requiredParts.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Repuestos Requeridos</Text>
                  {selectedService.requiredParts.map((partId, index) => (
                    <Text key={index} style={styles.requiredPartText}>
                      • {partId}
                    </Text>
                  ))}
                </View>
              )}

              {selectedService.notes && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Notas</Text>
                  <Text style={styles.notesText}>{selectedService.notes}</Text>
                </View>
              )}

              <View style={styles.quantitySection}>
                <Text style={styles.quantitySectionTitle}>Cantidad</Text>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(selectedService.id, quantity - 1)}
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
                        updateQuantity(selectedService.id, newQuantity)
                      }
                    }}
                    keyboardType="number-pad"
                  />

                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(selectedService.id, quantity + 1)}
                  >
                    <Feather name="plus" size={20} color={theme.colors.primary} />
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
                onPress={() => setServiceDetailModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.addButton]}
                onPress={() => {
                  toggleServiceSelection(selectedService)
                  setServiceDetailModalVisible(false)
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
            placeholder="Buscar servicios por nombre o SKU"
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
          <Text style={styles.loadingText}>Cargando servicios...</Text>
        </View>
      ) : (
        <>
          {filteredServices.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="build" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No se encontraron servicios</Text>
              <Text style={styles.emptySubtext}>Intenta con otra búsqueda o categoría</Text>
            </View>
          ) : (
            <FlatList
              data={filteredServices}
              renderItem={renderServiceItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
            />
          )}
        </>
      )}

      {multiSelect && selectedItems.length > 0 && (
        <View style={styles.selectionBar}>
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionCount}>{selectedItems.length} servicios seleccionados</Text>
          </View>
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmSelection}>
            <Text style={styles.confirmButtonText}>Confirmar</Text>
          </TouchableOpacity>
        </View>
      )}

      {renderServiceDetailModal()}
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
  serviceItem: {
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedServiceItem: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  serviceContent: {
    padding: 16,
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  serviceName: {
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
  serviceSku: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 12,
  },
  serviceFooter: {
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
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeIcon: {
    marginRight: 4,
  },
  timeText: {
    fontSize: 12,
    color: theme.colors.primary,
  },
  servicePrice: {
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
  serviceDetailTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 4,
  },
  serviceDetailSku: {
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
  requiredPartText: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: theme.colors.text,
    fontStyle: "italic",
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

export default ServiceSelectionScreen
