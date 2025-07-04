"use client"

import { useState } from "react"
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
} from "react-native"
import { Feather } from "@expo/vector-icons"

// Componente para sección de información
const InfoSection = ({ title, children }) => (
  <View style={styles.infoSection}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
)

// Componente para elemento de información
const InfoItem = ({ label, value }) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
)

// Componente para historial de movimientos
const HistoryItem = ({ history }) => (
  <View style={styles.historyItem}>
    <View style={styles.historyHeader}>
      <Text style={styles.historyDate}>{history.date}</Text>
      <View style={[styles.historyTypeBadge, { backgroundColor: history.type === "entrada" ? "#4caf50" : "#f44336" }]}>
        <Text style={styles.historyTypeText}>{history.type}</Text>
      </View>
    </View>
    <View style={styles.historyDetails}>
      <Text style={styles.historyQuantity}>
        {history.type === "entrada" ? "+" : "-"}
        {history.quantity} unidades
      </Text>
      <Text style={styles.historyReference}>{history.reference}</Text>
    </View>
    <Text style={styles.historyNote}>{history.note}</Text>
  </View>
)

export default function InventoryItemDetailScreen({ route, navigation }) {
  // Obtener ítem de los parámetros de navegación
  const { item } = route.params || {
    id: "1",
    name: "Filtro de aceite",
    code: "FIL-001",
    type: "Original",
    stock: 15,
    minStock: 5,
    price: 250.0,
    supplier: "AutoPartes S.A.",
    location: "A-12",
    description: "Filtro de aceite original para vehículos Toyota y Lexus.",
    category: "Filtros",
    brand: "Toyota",
    lastUpdated: "10 Mar 2023",
  }

  // Datos de ejemplo para historial
  const historyData = [
    {
      id: "1",
      date: "10 Mar 2023",
      type: "entrada",
      quantity: 10,
      reference: "Compra #1234",
      note: "Reposición de inventario",
    },
    {
      id: "2",
      date: "05 Mar 2023",
      type: "salida",
      quantity: 2,
      reference: "Orden #1156",
      note: "Servicio de cambio de aceite",
    },
    {
      id: "3",
      date: "01 Mar 2023",
      type: "salida",
      quantity: 3,
      reference: "Orden #1098",
      note: "Servicio de cambio de aceite",
    },
    {
      id: "4",
      date: "15 Feb 2023",
      type: "entrada",
      quantity: 20,
      reference: "Compra #1187",
      note: "Compra mensual",
    },
  ]

  // Estados
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [adjustQuantity, setAdjustQuantity] = useState("")
  const [adjustType, setAdjustType] = useState("entrada")
  const [adjustNote, setAdjustNote] = useState("")

  // Función para ajustar inventario
  const adjustInventory = () => {
    if (!adjustQuantity || isNaN(Number.parseInt(adjustQuantity)) || Number.parseInt(adjustQuantity) <= 0) {
      Alert.alert("Error", "Por favor ingresa una cantidad válida")
      return
    }

    // Aquí iría la lógica para ajustar el inventario en la base de datos
    Alert.alert("Éxito", `Inventario ajustado: ${adjustType === "entrada" ? "+" : "-"}${adjustQuantity} unidades`, [
      {
        text: "OK",
        onPress: () => {
          setShowAdjustModal(false)
          setAdjustQuantity("")
          setAdjustNote("")
        },
      },
    ])
  }

  // Determinar el color del indicador de stock
  const getStockColor = () => {
    if (item.stock <= 0) return "#f44336" // Rojo - Sin stock
    if (item.stock < item.minStock) return "#f5a623" // Amarillo - Bajo stock
    return "#4caf50" // Verde - Stock normal
  }

  // Determinar el estado del stock
  const getStockStatus = () => {
    if (item.stock <= 0) return "Sin Stock"
    if (item.stock < item.minStock) return "Bajo Stock"
    return "Stock Normal"
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle de Repuesto</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Feather name="more-vertical" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.itemHeader}>
          <View>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemCode}>{item.code}</Text>
          </View>
          <View style={[styles.stockBadge, { backgroundColor: getStockColor() }]}>
            <Text style={styles.stockText}>{item.stock}</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("EditInventoryItem", { item })}
          >
            <Feather name="edit-2" size={20} color="#1a73e8" />
            <Text style={styles.actionButtonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setShowAdjustModal(true)}>
            <Feather name="refresh-cw" size={20} color="#1a73e8" />
            <Text style={styles.actionButtonText}>Ajustar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("OrderParts", { initialItems: [item] })}
          >
            <Feather name="shopping-cart" size={20} color="#1a73e8" />
            <Text style={styles.actionButtonText}>Ordenar</Text>
          </TouchableOpacity>
        </View>

        <InfoSection title="Información General">
          <InfoItem label="Categoría" value={item.category} />
          <InfoItem label="Marca" value={item.brand} />
          <InfoItem label="Tipo" value={item.type} />
          <InfoItem label="Precio" value={`L. ${item.price.toFixed(2)}`} />
          <InfoItem label="Proveedor" value={item.supplier} />
        </InfoSection>

        <InfoSection title="Inventario">
          <InfoItem label="Stock Actual" value={item.stock} />
          <InfoItem label="Stock Mínimo" value={item.minStock} />
          <InfoItem label="Estado" value={getStockStatus()} />
          <InfoItem label="Ubicación" value={item.location} />
          <InfoItem label="Última Actualización" value={item.lastUpdated} />
        </InfoSection>

        <InfoSection title="Descripción">
          <Text style={styles.descriptionText}>{item.description}</Text>
        </InfoSection>

        <InfoSection title="Historial de Movimientos">
          {historyData.map((history) => (
            <HistoryItem key={history.id} history={history} />
          ))}
        </InfoSection>
      </ScrollView>

      {/* Modal para ajustar inventario */}
      <Modal
        visible={showAdjustModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAdjustModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajustar Inventario</Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowAdjustModal(false)}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalItemName}>{item.name}</Text>
              <Text style={styles.modalItemCode}>{item.code}</Text>

              <View style={styles.adjustTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.adjustTypeButton,
                    adjustType === "entrada" && styles.adjustTypeButtonActive,
                    { borderColor: "#4caf50" },
                  ]}
                  onPress={() => setAdjustType("entrada")}
                >
                  <Feather name="plus-circle" size={20} color={adjustType === "entrada" ? "#4caf50" : "#666"} />
                  <Text style={[styles.adjustTypeText, adjustType === "entrada" && { color: "#4caf50" }]}>Entrada</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.adjustTypeButton,
                    adjustType === "salida" && styles.adjustTypeButtonActive,
                    { borderColor: "#f44336" },
                  ]}
                  onPress={() => setAdjustType("salida")}
                >
                  <Feather name="minus-circle" size={20} color={adjustType === "salida" ? "#f44336" : "#666"} />
                  <Text style={[styles.adjustTypeText, adjustType === "salida" && { color: "#f44336" }]}>Salida</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Cantidad</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Cantidad"
                    value={adjustQuantity}
                    onChangeText={setAdjustQuantity}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Nota</Text>
                <View style={styles.textAreaContainer}>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Razón del ajuste"
                    value={adjustNote}
                    onChangeText={setAdjustNote}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAdjustModal(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveButton} onPress={adjustInventory}>
                <Text style={styles.saveButtonText}>Guardar</Text>
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
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  moreButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  itemCode: {
    fontSize: 14,
    color: "#666",
  },
  stockBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  stockText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButtonText: {
    color: "#1a73e8",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  infoSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  sectionContent: {},
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
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
    borderBottomColor: "#eee",
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  historyTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historyTypeText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
  },
  historyDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  historyQuantity: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  historyReference: {
    fontSize: 14,
    color: "#666",
  },
  historyNote: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
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
    justifyContent: "space-between",
    marginBottom: 16,
  },
  adjustTypeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
  },
  adjustTypeButtonActive: {
    backgroundColor: "#f9f9f9",
    borderWidth: 2,
  },
  adjustTypeText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  input: {
    height: 48,
    fontSize: 16,
    paddingHorizontal: 12,
  },
  textAreaContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  textArea: {
    height: 80,
    fontSize: 16,
    padding: 12,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#1a73e8",
    borderRadius: 8,
    paddingVertical: 12,
    marginRight: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#1a73e8",
    fontSize: 16,
    fontWeight: "500",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#1a73e8",
    borderRadius: 8,
    paddingVertical: 12,
    marginLeft: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
})

