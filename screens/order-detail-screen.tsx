"use client"

import React from "react"

import { useState, useRef } from "react"
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  Alert,
  FlatList,
  Share,
  Modal,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { useAuth } from "../context/auth-context"
import { formatDate, formatCurrency } from "../utils/helpers"
import { generateInvoicePDF, generateQuotePDF } from "../utils/pdf-generator"
import { Picker } from "@react-native-picker/picker" // Importación correcta del Picker
import { useFocusEffect } from "@react-navigation/native" // Para recargar datos al enfocar

// Importar servicios directamente
import * as orderService from "../services/order-service"
import * as clientService from "../services/client-service"
import * as vehicleService from "../services/vehicle-service"
import * as userService from "../services/user-service"
import * as currencyService from "../services/currency-service" // Asegurarse de que esté importado

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

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params
  const { user, hasPermission } = useAuth() // Usar hasPermission del AuthContext
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [order, setOrder] = useState<any>(null) // Usar 'any' temporalmente para evitar errores de tipo
  const [client, setClient] = useState<any>(null)
  const [vehicle, setVehicle] = useState<any>(null)
  const [technician, setTechnician] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [isSendingComment, setIsSendingComment] = useState(false)
  const [activeTab, setActiveTab] = useState("details") // details, parts, comments, images
  const scrollViewRef = useRef(null)
  const [showCurrencyModal, setShowCurrencyModal] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState("USD")

  // Usar useFocusEffect para recargar datos cuando la pantalla se enfoca
  useFocusEffect(
    React.useCallback(() => {
      loadOrderData()
    }, [orderId]),
  )

  const loadOrderData = async () => {
    try {
      setIsLoading(true)

      // Cargar orden
      const orderData = await orderService.getOrderById(orderId)
      if (!orderData) {
        Alert.alert("Error", "No se pudo encontrar la orden")
        navigation.goBack()
        return
      }
      setOrder(orderData)
      // Establecer la moneda preferida del usuario o la de la orden
      const preferredCurrency = await currencyService.getPreferredCurrency()
      setSelectedCurrency(orderData.currency || preferredCurrency || "USD")

      // Cargar cliente
      const clientData = await clientService.getClientById(orderData.clientId)
      setClient(clientData)

      // Cargar vehículo
      const vehicleData = await vehicleService.getVehicleById(orderData.vehicleId)
      setVehicle(vehicleData)

      // Cargar técnico
      if (orderData.technicianId) {
        const technicianData = await userService.getUserById(orderData.technicianId)
        setTechnician(technicianData)
      } else {
        setTechnician(null) // Asegurarse de que sea null si no hay técnico
      }

      // Cargar comentarios
      const orderComments = await orderService.getOrderComments(orderId)
      setComments(orderComments)
    } catch (error) {
      console.error("Error al cargar datos de la orden:", error)
      Alert.alert("Error", "No se pudieron cargar los datos de la orden")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendComment = async () => {
    if (!newComment.trim()) return

    try {
      setIsSendingComment(true)

      // Determinar tipo de comentario según rol del usuario
      const commentType = user?.role === "client" ? "client" : "technician"

      // Añadir comentario
      const comment = {
        userId: user?.id || "anonymous", // Usar un ID por defecto si no hay usuario
        userName: user?.name || (user?.role === "client" ? "Cliente" : "Técnico"),
        text: newComment.trim(),
        type: commentType,
        date: new Date().toISOString(), // Añadir fecha del comentario
      }

      await orderService.addOrderComment(orderId, comment)

      // Recargar comentarios para reflejar el nuevo
      const updatedComments = await orderService.getOrderComments(orderId)
      setComments(updatedComments)

      // Limpiar campo
      setNewComment("")

      // Scroll al final
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true })
      }
    } catch (error) {
      console.error("Error al enviar comentario:", error)
      Alert.alert("Error", "No se pudo enviar el comentario")
    } finally {
      setIsSendingComment(false)
    }
  }

  const handleUpdateOrder = () => {
    // Usar hasPermission del AuthContext
    if (!hasPermission("update_order_details")) {
      Alert.alert("Acceso denegado", "No tienes permiso para actualizar órdenes.")
      return
    }

    navigation.navigate("UpdateOrder", { orderId })
  }

  const handleViewVehicle = () => {
    if (vehicle?.id) {
      navigation.navigate("VehicleDetail", { vehicleId: vehicle.id })
    } else {
      Alert.alert("Información", "No hay un vehículo asociado a esta orden o los datos no están disponibles.")
    }
  }

  const generateInvoice = async () => {
    if (!order || !client || !vehicle) {
      Alert.alert("Error", "Faltan datos de la orden, cliente o vehículo para generar la factura.")
      return
    }
    try {
      setIsGeneratingPDF(true)

      // Generar PDF
      const pdfPath = await generateInvoicePDF(order, client, vehicle, selectedCurrency)

      // Compartir PDF
      await Share.share({
        url: pdfPath,
        title: `Factura ${order.number}`,
        message: `Factura ${order.number} para ${client.name}`,
      })
    } catch (error) {
      console.error("Error al generar factura:", error)
      Alert.alert("Error", "No se pudo generar la factura. Asegúrese de que todos los datos estén completos.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const generateQuote = async () => {
    if (!order || !client || !vehicle) {
      Alert.alert("Error", "Faltan datos de la orden, cliente o vehículo para generar la cotización.")
      return
    }
    try {
      setIsGeneratingPDF(true)

      // Generar PDF
      const pdfPath = await generateQuotePDF(order, client, vehicle, selectedCurrency)

      // Compartir PDF
      await Share.share({
        url: pdfPath,
        title: `Cotización ${order.number}`,
        message: `Cotización ${order.number} para ${client.name}`,
      })
    } catch (error) {
      console.error("Error al generar cotización:", error)
      Alert.alert("Error", "No se pudo generar la cotización. Asegúrese de que todos los datos estén completos.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  if (isLoading || !order) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Cargando datos de la orden...</Text>
      </View>
    )
  }

  const renderDetailsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información General</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Número de Orden:</Text>
          <Text style={styles.infoValue}>#{order.number}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Estado:</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Fecha de Creación:</Text>
          <Text style={styles.infoValue}>{formatDate(order.dates?.created)}</Text>
        </View>
        {order.dates?.updated && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Última Actualización:</Text>
            <Text style={styles.infoValue}>{formatDate(order.dates.updated)}</Text>
          </View>
        )}
        {order.dates?.completed && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha de Finalización:</Text>
            <Text style={styles.infoValue}>{formatDate(order.dates.completed)}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Técnico Asignado:</Text>
          <Text style={styles.infoValue}>{technician ? technician.name : "No asignado"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Moneda:</Text>
          <TouchableOpacity onPress={() => setShowCurrencyModal(true)}>
            <Text style={[styles.infoValue, styles.currencySelector]}>
              {selectedCurrency === "USD" ? "Dólares (USD)" : "Lempiras (HNL)"}{" "}
              <Feather name="edit-2" size={12} color="#1a73e8" />
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {client && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nombre:</Text>
            <Text style={styles.infoValue}>{client.name}</Text>
          </View>
          {client.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Teléfono:</Text>
              <Text style={styles.infoValue}>{client.phone}</Text>
            </View>
          )}
          {client.email && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{client.email}</Text>
            </View>
          )}
        </View>
      )}

      {vehicle && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Vehículo</Text>
            <TouchableOpacity style={styles.viewDetailsButton} onPress={handleViewVehicle}>
              <Text style={styles.viewDetailsButtonText}>Ver Detalles</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Marca / Modelo:</Text>
            <Text style={styles.infoValue}>
              {vehicle.make} {vehicle.model}
            </Text>
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
          {vehicle.mileage && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kilometraje:</Text>
              <Text style={styles.infoValue}>{vehicle.mileage.toLocaleString()} km</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Descripción del Problema</Text>
        <Text style={styles.descriptionText}>{order.description || "No especificado"}</Text>
      </View>

      {order.diagnosis && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagnóstico</Text>
          <Text style={styles.descriptionText}>{order.diagnosis}</Text>
        </View>
      )}

      {order.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notas Adicionales</Text>
          <Text style={styles.descriptionText}>{order.notes}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resumen de Costos</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Repuestos:</Text>
          <Text style={styles.infoValue}>{formatCurrency(order.totalParts || 0, selectedCurrency)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Mano de Obra:</Text>
          <Text style={styles.infoValue}>{formatCurrency(order.laborCost || 0, selectedCurrency)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Impuestos:</Text>
          <Text style={styles.infoValue}>{formatCurrency(order.tax || 0, selectedCurrency)}</Text>
        </View>
        {order.discount && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Descuento:</Text>
            <Text style={styles.infoValue}>-{formatCurrency(order.discount.amount || 0, selectedCurrency)}</Text>
          </View>
        )}
        <View style={[styles.infoRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>TOTAL:</Text>
          <Text style={styles.totalValue}>{formatCurrency(order.total || 0, selectedCurrency)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Estado de Pago:</Text>
          <Text
            style={[styles.paymentStatus, order.paymentStatus === "paid" ? styles.paidStatus : styles.pendingStatus]}
          >
            {order.paymentStatus === "paid" ? "Pagado" : "Pendiente"}
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        {hasPermission("update_order_details") && ( // Usar hasPermission
          <TouchableOpacity style={styles.updateButton} onPress={handleUpdateOrder}>
            <Feather name="edit-2" size={20} color="#fff" />
            <Text style={styles.updateButtonText}>Actualizar Orden</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.invoiceButton} onPress={generateInvoice} disabled={isGeneratingPDF}>
          {isGeneratingPDF ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Feather name="file-text" size={20} color="#fff" />
              <Text style={styles.invoiceButtonText}>Generar Factura</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.quoteButton} onPress={generateQuote} disabled={isGeneratingPDF}>
          {isGeneratingPDF ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Feather name="file" size={20} color="#fff" />
              <Text style={styles.quoteButtonText}>Generar Cotización</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  )

  const renderPartsTab = () => (
    <View style={styles.tabContent}>
      {order.items && order.items.length > 0 ? (
        <FlatList
          data={order.items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.partCard}>
              <View style={styles.partHeader}>
                <Text style={styles.partName}>{item.name}</Text>
                <Text style={styles.partPrice}>{formatCurrency(item.unitPrice, selectedCurrency)}</Text>
              </View>
              {item.partNumber && <Text style={styles.partNumber}>SKU: {item.partNumber}</Text>}
              <View style={styles.partDetails}>
                <Text style={styles.partQuantity}>Cantidad: {item.quantity}</Text>
                <Text style={styles.partTotal}>Total: {formatCurrency(item.total, selectedCurrency)}</Text>
              </View>
              {item.status && (
                <View
                  style={[
                    styles.partStatus,
                    item.status === "pending"
                      ? styles.pendingPartStatus
                      : item.status === "ordered"
                        ? styles.orderedPartStatus
                        : styles.receivedPartStatus,
                  ]}
                >
                  <Text style={styles.partStatusText}>
                    {item.status === "pending" ? "Pendiente" : item.status === "ordered" ? "Ordenado" : "Recibido"}
                  </Text>
                </View>
              )}
            </View>
          )}
          contentContainerStyle={styles.partsList}
        />
      ) : (
        <View style={styles.emptyState}>
          <Feather name="package" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No hay repuestos registrados</Text>
        </View>
      )}
    </View>
  )

  const renderCommentsTab = () => (
    <View style={styles.tabContent}>
      <ScrollView ref={scrollViewRef} style={styles.commentsContainer}>
        {comments.length > 0 ? (
          comments.map((comment, index) => (
            <View
              key={index}
              style={[
                styles.commentBubble,
                comment.type === "client" ? styles.clientCommentBubble : styles.technicianCommentBubble,
              ]}
            >
              <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor}>{comment.userName}</Text>
                <Text style={styles.commentDate}>{formatDate(comment.date)}</Text>
              </View>
              <Text style={styles.commentText}>{comment.text}</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Feather name="message-square" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No hay comentarios</Text>
          </View>
        )}
      </ScrollView>

      {hasPermission("create_comments") && ( // Solo permitir comentar si tiene permiso
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Escribe un comentario..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !newComment.trim() && styles.disabledButton]}
            onPress={handleSendComment}
            disabled={!newComment.trim() || isSendingComment}
          >
            {isSendingComment ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  )

  const renderImagesTab = () => (
    <View style={styles.tabContent}>
      {order.images && order.images.length > 0 ? (
        <FlatList
          data={order.images}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <View style={styles.imageContainer}>
              <Image source={{ uri: item.uri }} style={styles.image} />
              {item.description && <Text style={styles.imageDescription}>{item.description}</Text>}
            </View>
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

  const renderCurrencyModal = () => (
    <Modal
      visible={showCurrencyModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCurrencyModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Moneda</Text>
            <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
              <Feather name="x" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Seleccione la moneda para generar facturas y cotizaciones:</Text>

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedCurrency}
                onValueChange={(itemValue) => setSelectedCurrency(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Dólares (USD)" value="USD" />
                <Picker.Item label="Lempiras (HNL)" value="HNL" />
              </Picker>
            </View>

            <Text style={styles.modalNote}>
              Nota: Los precios se convertirán automáticamente según la tasa de cambio actual.
            </Text>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowCurrencyModal(false)}>
              <Text style={styles.modalButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>Orden #{order.number}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
          </View>
        </View>
        <Text style={styles.orderDate}>{formatDate(order.dates?.created)}</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "details" && styles.activeTabButton]}
          onPress={() => setActiveTab("details")}
        >
          <Text style={[styles.tabButtonText, activeTab === "details" && styles.activeTabButtonText]}>Detalles</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "parts" && styles.activeTabButton]}
          onPress={() => setActiveTab("parts")}
        >
          <Text style={[styles.tabButtonText, activeTab === "parts" && styles.activeTabButtonText]}>Repuestos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "comments" && styles.activeTabButton]}
          onPress={() => setActiveTab("comments")}
        >
          <Text style={[styles.tabButtonText, activeTab === "comments" && styles.activeTabButtonText]}>
            Comentarios
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "images" && styles.activeTabButton]}
          onPress={() => setActiveTab("images")}
        >
          <Text style={[styles.tabButtonText, activeTab === "images" && styles.activeTabButtonText]}>Imágenes</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "details" && renderDetailsTab()}
      {activeTab === "parts" && renderPartsTab()}
      {activeTab === "comments" && renderCommentsTab()}
      {activeTab === "images" && renderImagesTab()}

      {renderCurrencyModal()}
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
  orderInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 18,
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
  orderDate: {
    fontSize: 14,
    color: "#666",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e4e8",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTabButton: {
    borderBottomWidth: 2,
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
    flex: 1,
  },
  section: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
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
  currencySelector: {
    color: "#1a73e8",
    textDecorationLine: "underline",
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e1e4e8",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4caf50",
  },
  paymentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: "bold",
    overflow: "hidden",
  },
  paidStatus: {
    backgroundColor: "#4caf50",
    color: "#fff",
  },
  pendingStatus: {
    backgroundColor: "#f5a623",
    color: "#fff",
  },
  descriptionText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  viewDetailsButton: {
    backgroundColor: "#1a73e8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  viewDetailsButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  actionButtons: {
    margin: 16,
    marginTop: 8,
  },
  updateButton: {
    backgroundColor: "#1a73e8",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  updateButtonText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 8,
  },
  invoiceButton: {
    backgroundColor: "#4caf50",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  invoiceButtonText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 8,
  },
  quoteButton: {
    backgroundColor: "#f5a623",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  quoteButtonText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 8,
  },
  partsList: {
    padding: 16,
  },
  partCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  partHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  partName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    flex: 1,
    marginRight: 8,
  },
  partPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4caf50",
  },
  partNumber: {
    fontSize: 12,
    color: "#999",
    marginBottom: 8,
  },
  partDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  partQuantity: {
    fontSize: 14,
    color: "#666",
  },
  partTotal: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  partStatus: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  pendingPartStatus: {
    backgroundColor: "#f5a623",
  },
  orderedPartStatus: {
    backgroundColor: "#1a73e8",
  },
  receivedPartStatus: {
    backgroundColor: "#4caf50",
  },
  partStatusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  commentsContainer: {
    flex: 1,
    padding: 16,
  },
  commentBubble: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    maxWidth: "80%",
  },
  clientCommentBubble: {
    backgroundColor: "#e8f0fe",
    alignSelf: "flex-start",
    borderTopLeftRadius: 0,
  },
  technicianCommentBubble: {
    backgroundColor: "#f0f0f0",
    alignSelf: "flex-end",
    borderTopRightRadius: 0,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  commentDate: {
    fontSize: 12,
    color: "#999",
  },
  commentText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e1e4e8",
    backgroundColor: "#fff",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1a73e8",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  imagesList: {
    padding: 8,
  },
  imageContainer: {
    width: "48%",
    aspectRatio: 1,
    margin: "1%",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageDescription: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 8,
    color: "#fff",
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
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
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalContent: {
    padding: 16,
  },
  modalText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#e1e4e8",
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  modalNote: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: "#e1e4e8",
    padding: 16,
    alignItems: "flex-end",
  },
  modalButton: {
    backgroundColor: "#1a73e8",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
})
