"use client"

import { useEffect, useState } from "react"
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  Share,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { useAuth } from "../context/auth-context"
import * as ImagePicker from "expo-image-picker"
import { formatDate, formatCurrency } from "../utils/helpers"
import { generateVehicleReportPDF } from "../utils/pdf-generator"

// Función para obtener texto según estado
const getStatusText = (status: string): string => {
  switch (status) {
    case "reception":
      return "Recepción"
    case "diagnosis":
      return "Diagnóstico"
    case "waiting_parts":
      return "Esperando Repuestos"
    case "in_progress":
      return "En Proceso"
    case "quality_check":
      return "Control de Calidad"
    case "completed":
      return "Completada"
    case "delivered":
      return "Entregada"
    case "cancelled":
      return "Cancelada"
    default:
      return "Desconocido"
  }
}

// Función para obtener color según estado
const getStatusColor = (status: string): string => {
  switch (status) {
    case "reception":
      return "#1a73e8"
    case "diagnosis":
      return "#f5a623"
    case "waiting_parts":
      return "#9c27b0"
    case "in_progress":
      return "#f5a623"
    case "quality_check":
      return "#4caf50"
    case "completed":
      return "#4caf50"
    case "delivered":
      return "#607d8b"
    case "cancelled":
      return "#e53935"
    default:
      return "#666"
  }
}

export default function VehicleDetailScreen({ route, navigation }) {
  const { vehicleId } = route.params
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [vehicle, setVehicle] = useState(null)
  const [orders, setOrders] = useState([])
  const [activeTab, setActiveTab] = useState("details") // details, history, images, documents
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  useEffect(() => {
    loadVehicleData()
  }, [vehicleId])

  const loadVehicleData = async () => {
    try {
      setIsLoading(true)
      // Importar servicios
      const vehicleService = await import("../services/vehicle-service")
      const orderService = await import("../services/order-service")

      // Cargar vehículo
      const vehicleData = await vehicleService.getVehicleById(vehicleId)
      if (!vehicleData) {
        Alert.alert("Error", "No se pudo encontrar el vehículo")
        navigation.goBack()
        return
      }
      setVehicle(vehicleData)

      // Cargar órdenes relacionadas
      const vehicleOrders = await orderService.getOrdersByVehicleId(vehicleId)

      // Ordenar por fecha (más reciente primero)
      vehicleOrders.sort((a, b) => new Date(b.dates.created) - new Date(a.dates.created))

      // Enriquecer órdenes con información adicional
      const enrichedOrders = vehicleOrders.map((order) => ({
        ...order,
        statusText: getStatusText(order.status),
        statusColor: getStatusColor(order.status),
        formattedDate: formatDate(order.dates.created),
        formattedTotal: formatCurrency(order.total, order.currency),
      }))

      setOrders(enrichedOrders)
    } catch (error) {
      console.error("Error al cargar datos del vehículo:", error)
      Alert.alert("Error", "No se pudieron cargar los datos del vehículo")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (!permissionResult.granted) {
        Alert.alert("Permiso denegado", "Necesitamos permiso para acceder a tu galería de fotos")
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Importar servicios
        const imageService = await import("../services/image-service")
        const vehicleService = await import("../services/vehicle-service")

        // Guardar imagen
        const savedImage = await imageService.saveImage(
          result.assets[0].uri,
          "vehicle",
          vehicleId,
          "Imagen del vehículo",
        )

        // Añadir imagen al vehículo
        const updatedVehicle = await vehicleService.addVehicleImage(vehicleId, savedImage)

        if (updatedVehicle) {
          setVehicle(updatedVehicle)
          Alert.alert("Éxito", "Imagen añadida correctamente")
        }
      }
    } catch (error) {
      console.error("Error al añadir imagen:", error)
      Alert.alert("Error", "No se pudo añadir la imagen")
    }
  }

  const handleGeneratePDF = async () => {
    try {
      setIsGeneratingPDF(true)

      // Generar PDF
      const pdfPath = await generateVehicleReportPDF(vehicle, orders)

      // Compartir PDF
      await Share.share({
        url: pdfPath,
        title: `Informe del vehículo ${vehicle.make} ${vehicle.model}`,
        message: `Informe del vehículo ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`,
      })
    } catch (error) {
      console.error("Error al generar PDF:", error)
      Alert.alert("Error", "No se pudo generar el informe PDF")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const renderDetailsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>Información General</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Marca:</Text>
          <Text style={styles.infoValue}>{vehicle.make}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Modelo:</Text>
          <Text style={styles.infoValue}>{vehicle.model}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Año:</Text>
          <Text style={styles.infoValue}>{vehicle.year}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Placa:</Text>
          <Text style={styles.infoValue}>{vehicle.licensePlate}</Text>
        </View>

        {vehicle.vin && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>VIN:</Text>
            <Text style={styles.infoValue}>{vehicle.vin}</Text>
          </View>
        )}

        {vehicle.color && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Color:</Text>
            <Text style={styles.infoValue}>{vehicle.color}</Text>
          </View>
        )}

        {vehicle.mileage && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Kilometraje:</Text>
            <Text style={styles.infoValue}>{vehicle.mileage.toLocaleString()} km</Text>
          </View>
        )}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>Especificaciones Técnicas</Text>

        {vehicle.fuelType && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Combustible:</Text>
            <Text style={styles.infoValue}>
              {vehicle.fuelType === "gasoline"
                ? "Gasolina"
                : vehicle.fuelType === "diesel"
                  ? "Diésel"
                  : vehicle.fuelType === "electric"
                    ? "Eléctrico"
                    : vehicle.fuelType === "hybrid"
                      ? "Híbrido"
                      : "Otro"}
            </Text>
          </View>
        )}

        {vehicle.transmission && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Transmisión:</Text>
            <Text style={styles.infoValue}>
              {vehicle.transmission === "manual"
                ? "Manual"
                : vehicle.transmission === "automatic"
                  ? "Automática"
                  : vehicle.transmission === "cvt"
                    ? "CVT"
                    : "Otra"}
            </Text>
          </View>
        )}

        {vehicle.engineSize && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Motor:</Text>
            <Text style={styles.infoValue}>{vehicle.engineSize}</Text>
          </View>
        )}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>Mantenimiento</Text>

        {vehicle.lastServiceDate && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Último servicio:</Text>
            <Text style={styles.infoValue}>{formatDate(vehicle.lastServiceDate)}</Text>
          </View>
        )}

        {vehicle.nextServiceDate && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Próximo servicio:</Text>
            <Text style={styles.infoValue}>{formatDate(vehicle.nextServiceDate)}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Total de servicios:</Text>
          <Text style={styles.infoValue}>{orders.length}</Text>
        </View>
      </View>

      {vehicle.notes && (
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Notas</Text>
          <Text style={styles.notesText}>{vehicle.notes}</Text>
        </View>
      )}
    </View>
  )

  const renderHistoryTab = () => (
    <View style={styles.tabContent}>
      {orders.length > 0 ? (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.orderCard}
              onPress={() => navigation.navigate("OrderDetail", { orderId: item.id })}
            >
              <View style={styles.orderHeader}>
                <Text style={styles.orderNumber}>Orden #{item.number}</Text>
                <View style={[styles.statusBadge, { backgroundColor: item.statusColor }]}>
                  <Text style={styles.statusText}>{item.statusText}</Text>
                </View>
              </View>

              <Text style={styles.orderDescription} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={styles.orderFooter}>
                <Text style={styles.orderDate}>{item.formattedDate}</Text>
                <Text style={styles.orderTotal}>{item.formattedTotal}</Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.ordersList}
        />
      ) : (
        <View style={styles.emptyState}>
          <Feather name="clipboard" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No hay historial de servicios</Text>
        </View>
      )}
    </View>
  )

  const renderImagesTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.imageActions}>
        <TouchableOpacity style={styles.addImageButton} onPress={handleAddImage}>
          <Feather name="plus" size={20} color="#fff" />
          <Text style={styles.addImageButtonText}>Añadir imagen</Text>
        </TouchableOpacity>
      </View>

      {vehicle.images && vehicle.images.length > 0 ? (
        <FlatList
          data={vehicle.images}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.imageItem}>
              <Image source={{ uri: item.uri }} style={styles.image} />
              {item.description && (
                <View style={styles.imageDescriptionContainer}>
                  <Text style={styles.imageDescription}>{item.description}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.imagesList}
        />
      ) : (
        <View style={styles.emptyState}>
          <Feather name="image" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No hay imágenes</Text>
        </View>
      )}
    </View>
  )

  const renderDocumentsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.documentActions}>
        <TouchableOpacity style={styles.generateReportButton} onPress={handleGeneratePDF} disabled={isGeneratingPDF}>
          {isGeneratingPDF ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Feather name="file-text" size={20} color="#fff" />
              <Text style={styles.generateReportButtonText}>Generar informe</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.documentsList}>
        <TouchableOpacity style={styles.documentItem} onPress={handleGeneratePDF}>
          <View style={styles.documentIconContainer}>
            <Feather name="file-text" size={24} color="#1a73e8" />
          </View>
          <View style={styles.documentInfo}>
            <Text style={styles.documentTitle}>Informe del vehículo</Text>
            <Text style={styles.documentDescription}>Detalles completos e historial de servicios</Text>
          </View>
          <Feather name="download" size={20} color="#666" />
        </TouchableOpacity>

        {vehicle.serviceHistory && vehicle.serviceHistory.length > 0 && (
          <TouchableOpacity style={styles.documentItem} onPress={handleGeneratePDF}>
            <View style={styles.documentIconContainer}>
              <Feather name="file-text" size={24} color="#4caf50" />
            </View>
            <View style={styles.documentInfo}>
              <Text style={styles.documentTitle}>Historial de mantenimiento</Text>
              <Text style={styles.documentDescription}>Registro detallado de todos los servicios</Text>
            </View>
            <Feather name="download" size={20} color="#666" />
          </TouchableOpacity>
        )}

        {orders.length > 0 && (
          <TouchableOpacity style={styles.documentItem} onPress={handleGeneratePDF}>
            <View style={styles.documentIconContainer}>
              <Feather name="file-text" size={24} color="#f5a623" />
            </View>
            <View style={styles.documentInfo}>
              <Text style={styles.documentTitle}>Historial de órdenes</Text>
              <Text style={styles.documentDescription}>Todas las órdenes de servicio</Text>
            </View>
            <Feather name="download" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Cargando datos del vehículo...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          {vehicle.images && vehicle.images.length > 0 ? (
            <Image source={{ uri: vehicle.images[0].uri }} style={styles.vehicleImage} />
          ) : (
            <View style={styles.noImageContainer}>
              <Feather name="truck" size={64} color="#ccc" />
            </View>
          )}

          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleName}>
              {vehicle.make} {vehicle.model}
            </Text>
            <Text style={styles.vehicleDetails}>
              {vehicle.year} • {vehicle.licensePlate}
            </Text>

            {vehicle.mileage && (
              <View style={styles.mileageContainer}>
                <Feather name="activity" size={16} color="#666" />
                <Text style={styles.mileageText}>{vehicle.mileage.toLocaleString()} km</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "details" && styles.activeTabButton]}
            onPress={() => setActiveTab("details")}
          >
            <Text style={[styles.tabButtonText, activeTab === "details" && styles.activeTabButtonText]}>Detalles</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === "history" && styles.activeTabButton]}
            onPress={() => setActiveTab("history")}
          >
            <Text style={[styles.tabButtonText, activeTab === "history" && styles.activeTabButtonText]}>Historial</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === "images" && styles.activeTabButton]}
            onPress={() => setActiveTab("images")}
          >
            <Text style={[styles.tabButtonText, activeTab === "images" && styles.activeTabButtonText]}>Imágenes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === "documents" && styles.activeTabButton]}
            onPress={() => setActiveTab("documents")}
          >
            <Text style={[styles.tabButtonText, activeTab === "documents" && styles.activeTabButtonText]}>
              Documentos
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "details" && renderDetailsTab()}
        {activeTab === "history" && renderHistoryTab()}
        {activeTab === "images" && renderImagesTab()}
        {activeTab === "documents" && renderDocumentsTab()}
      </ScrollView>
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  header: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e4e8",
  },
  vehicleImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  noImageContainer: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  vehicleInfo: {
    alignItems: "center",
  },
  vehicleName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  vehicleDetails: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  mileageContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  mileageText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
    fontWeight: "500",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e4e8",
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTabButton: {
    borderBottomColor: "#1a73e8",
  },
  tabButtonText: {
    fontSize: 14,
    color: "#666",
  },
  activeTabButtonText: {
    color: "#1a73e8",
    fontWeight: "bold",
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  infoCard: {
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
  infoCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    textAlign: "right",
  },
  notesText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  ordersList: {
    paddingBottom: 16,
  },
  orderCard: {
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
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  orderDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderDate: {
    fontSize: 12,
    color: "#999",
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4caf50",
  },
  imageActions: {
    marginBottom: 16,
  },
  addImageButton: {
    backgroundColor: "#1a73e8",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  addImageButtonText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 8,
  },
  imagesList: {
    paddingBottom: 16,
  },
  imageItem: {
    width: "48%",
    aspectRatio: 1,
    margin: "1%",
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageDescriptionContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 8,
  },
  imageDescription: {
    color: "#fff",
    fontSize: 12,
  },
  documentActions: {
    marginBottom: 16,
  },
  generateReportButton: {
    backgroundColor: "#4caf50",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  generateReportButtonText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 8,
  },
  documentsList: {
    marginBottom: 16,
  },
  documentItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  documentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  documentDescription: {
    fontSize: 14,
    color: "#666",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
  },
})
