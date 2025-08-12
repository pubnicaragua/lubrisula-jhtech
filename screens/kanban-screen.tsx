"use client"  
  
import { useState, useCallback, useEffect } from "react"  
import {  
  StyleSheet,  
  View,  
  Text,  
  TouchableOpacity,  
  ScrollView,  
  SafeAreaView,  
  Modal,  
  TextInput,  
  Alert,  
  ActivityIndicator,  
  RefreshControl,  
} from "react-native"  
import { Feather } from "@expo/vector-icons"  
import { useFocusEffect } from "@react-navigation/native"  
import { useAuth } from "../context/auth-context"  
// Importaciones corregidas para usar servicios de Supabase  
import * as orderService from "../services/supabase/order-service"  
import * as clientService from "../services/supabase/client-service"  
import * as vehicleService from "../services/supabase/vehicle-service"  
import * as accessService from "../services/supabase/access-service"  
import * as userService from "../services/supabase/user-service"
import { KanbanCardProps, KanbanColumnProps, KanbanOrderType, KanbanScreenProps, TechnicianType } from "../types/canvan"
  
// Estados disponibles para las órdenes  
const KANBAN_COLUMNS = [  
  {  
    id: "reception",  
    title: "Recepción",  
    color: "#1a73e8",  
    description: "Vehículos recién llegados pendientes de diagnóstico inicial",  
    allowedTransitions: ["diagnosis"],  
    status: "Pendiente"  
  },  
  {  
    id: "diagnosis",  
    title: "Diagnóstico",  
    color: "#f5a623",  
    description: "Evaluación técnica del problema",  
    allowedTransitions: ["waiting_parts", "in_progress"],  
    status: "En Diagnóstico"  
  },  
  {  
    id: "waiting_parts",  
    title: "Esperando Repuestos",  
    color: "#9c27b0",  
    description: "Esperando llegada de repuestos necesarios",  
    allowedTransitions: ["in_progress"],  
    status: "Esperando Repuestos"  
  },  
  {  
    id: "in_progress",  
    title: "En Proceso",  
    color: "#ff9800",  
    description: "Trabajo en progreso",  
    allowedTransitions: ["quality_check"],  
    status: "En Proceso"  
  },  
  {  
    id: "quality_check",  
    title: "Control de Calidad",  
    color: "#607d8b",  
    description: "Revisión final antes de entrega",  
    allowedTransitions: ["completed"],  
    status: "Control Calidad"  
  },  
  {  
    id: "completed",  
    title: "Completado",  
    color: "#4caf50",  
    description: "Trabajo terminado, listo para entrega",  
    allowedTransitions: [],  
    status: "Completada"  
  }  
]  
  
// Componente para tarjeta Kanban  
const KanbanCard = ({ card, onPress, onLongPress }: KanbanCardProps) => {  
  const getPriorityColor = (priority: string) => {  
    switch (priority) {  
      case "high": return "#f44336"  
      case "normal": return "#4caf50"  
      case "low": return "#607d8b"  
      default: return "#666"  
    }  
  }  
  
  return (  
    <TouchableOpacity  
      style={styles.kanbanCard}  
      onPress={onPress}  
      onLongPress={onLongPress}  
    >  
      <View style={styles.cardHeader}>  
        <Text style={styles.cardTitle} numberOfLines={1}>  
          {card.vehiculo_info?.marca} {card.vehiculo_info?.modelo}  
        </Text>  
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(card.prioridad) }]}>  
          <Text style={styles.priorityText}>{card.prioridad}</Text>  
        </View>  
      </View>  
        
      <Text style={styles.cardClient}>{card.client_info?.name}</Text>  
      <Text style={styles.cardPlate}>{card.vehiculo_info?.placa}</Text>  
      <Text style={styles.cardDescription} numberOfLines={2}>  
        {card.descripcion}  
      </Text>  
        
      <View style={styles.cardFooter}>  
        <Text style={styles.cardTime}>  
          {new Date(card.fecha_creacion).toLocaleDateString("es-ES")}  
        </Text>  
        <Text style={styles.cardAssignee}>  
          {card.tecnico_info?.nombre || "Sin asignar"}  
        </Text>  
      </View>  
    </TouchableOpacity>  
  )  
}  
  
// Componente para columna Kanban  
const KanbanColumn = ({ column, onCardPress, onCardLongPress, onDrop, isDropArea, onAddCard }: KanbanColumnProps) => {  
  return (  
    <View style={[styles.kanbanColumn, isDropArea && styles.dropArea]}>  
      <View style={[styles.columnHeader, { borderBottomColor: column.color }]}>  
        <Text style={styles.columnTitle}>{column.title}</Text>  
        <View style={[styles.columnBadge, { backgroundColor: column.color }]}>  
          <Text style={styles.columnCount}>{column.cards?.length || 0}</Text>  
        </View>  
      </View>  
  
      <Text style={styles.columnDescription}>{column.description}</Text>  
  
      <ScrollView style={styles.columnScroll}>  
        {column.cards?.map((card) => (  
          <KanbanCard  
            key={card.id}  
            card={card}  
            onPress={() => onCardPress(card, column)}  
            onLongPress={() => onCardLongPress(card, column)}  
          />  
        ))}  
      </ScrollView>  
  
      <TouchableOpacity style={styles.addCardButton} onPress={() => onAddCard(column)}>  
        <Feather name="plus" size={16} color="#1a73e8" />  
        <Text style={styles.addCardText}>Agregar Orden</Text>  
      </TouchableOpacity>  
    </View>  
  )  
}  
  
export default function KanbanScreen({ navigation }: KanbanScreenProps) {  
  const { user } = useAuth()  
  const [columns, setColumns] = useState(KANBAN_COLUMNS.map(col => ({ ...col, cards: [] as KanbanOrderType[] })))  
  const [orders, setOrders] = useState<KanbanOrderType[]>([])  
  const [selectedCard, setSelectedCard] = useState<KanbanOrderType | null>(null)  
  const [selectedColumn, setSelectedColumn] = useState<any>(null)  
  const [showCardModal, setShowCardModal] = useState(false)  
  const [showMoveModal, setShowMoveModal] = useState(false)  
  const [loading, setLoading] = useState(true)  
  const [refreshing, setRefreshing] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
  const [filterPriority, setFilterPriority] = useState("all")  
  const [filterAssignee, setFilterAssignee] = useState("all")  
  const [showFilter, setShowFilter] = useState(false)  
  
  const loadKanbanData = useCallback(async () => {  
    try {  
      setLoading(true)  
      setError(null)  
  
      if (!user?.id) return  
  
      // Validar permisos del usuario  
      const userTallerId = await userService.userService.GET_TALLER_ID(user.id)
      if (!userTallerId) {
        setError("No se pudo cargar la información del cliente")  
        return
      }    
      const userPermissions = await accessService.accessService.GET_PERMISOS_USUARIO(user.id, userTallerId)  
      setUserRole(userPermissions?.rol || 'client')  
  
      if (userPermissions?.rol === 'client') {  
        setError("No tienes permisos para ver el tablero Kanban")  
        return  
      }  
  
      // Cargar todas las órdenes  
      const allOrders = await orderService.orderService.getAllOrders()  
        
      // Enriquecer órdenes con información adicional  
      const enrichedOrders = await Promise.all(  
        allOrders.map(async (order: any) => {  
          const [clientInfo, vehicleInfo, technicianInfo] = await Promise.all([  
            order.client_id ? clientService.clientService.getClientById(order.client_id) : null,  
            order.vehiculo_id ? vehicleService.vehicleService.getVehicleById(order.vehiculo_id) : null,  
            order.tecnico_id ? userService.userService.GetUserById(order.tecnico_id) : null  
          ])  
  
          return {  
            ...order,  
            client_info: clientInfo,  
            vehiculo_info: vehicleInfo,  
            tecnico_info: technicianInfo  
          }  
        })  
      )  
  
      setOrders(enrichedOrders)  
        
      // Organizar órdenes por columnas  
      const updatedColumns = KANBAN_COLUMNS.map(column => ({  
        ...column,  
        cards: enrichedOrders.filter((order: KanbanOrderType) => {  
          // Mapear estados de órdenes a columnas del Kanban  
          const statusMapping: Record<string, string> = {  
            "Pendiente": "reception",  
            "En Diagnóstico": "diagnosis",   
            "Esperando Repuestos": "waiting_parts",  
            "En Proceso": "in_progress",  
            "Control Calidad": "quality_check",  
            "Completada": "completed"  
          }  
          return statusMapping[order.estado] === column.id  
        })  
      }))  
  
      setColumns(updatedColumns)  
  
    } catch (error) {  
      console.error("Error loading kanban data:", error)  
      setError("No se pudieron cargar los datos del tablero")  
    } finally {  
      setLoading(false)  
      setRefreshing(false)  
    }  
  }, [user])  
  
  useFocusEffect(  
    useCallback(() => {  
      loadKanbanData()  
    }, [loadKanbanData])  
  )  
  
  // Función para manejar el clic en una tarjeta  
  const handleCardPress = (card: KanbanOrderType, column: any) => {  
    setSelectedCard(card)  
    setSelectedColumn(column)  
    setShowCardModal(true)  
  }  
  
  // Función para manejar el clic largo en una tarjeta  
  const handleCardLongPress = (card: KanbanOrderType, column: any) => {  
    setShowMoveModal(true)  
    setSelectedCard(card)  
    setSelectedColumn(column)  
  }  
  
  // Función para mover una tarjeta entre columnas  
  const moveCard = async (targetColumnId: string, cardId: string) => {  
    try {  
      const targetColumn = KANBAN_COLUMNS.find(col => col.id === targetColumnId)  
      if (!targetColumn) return  
  
      // Actualizar estado en Supabase  
      await orderService.orderService.updateOrderStatus(cardId, targetColumn.status)  
        
      // Recargar datos  
      loadKanbanData()  
      setShowMoveModal(false)  
        
      Alert.alert("Éxito", "Orden movida correctamente")  
    } catch (error) {  
      console.error("Error moving card:", error)  
      Alert.alert("Error", "No se pudo mover la orden")  
    }  
  }  
  
  // Función para agregar una nueva orden  
  const handleAddCard = (column: any) => {  
    navigation.navigate("NewOrder", {   
      initialStatus: column.status,  
      returnTo: "Kanban"  
    })  
  }  
  
  // Función para eliminar una tarjeta  
  const deleteCard = () => {  
    if (!selectedCard) return  
  
    Alert.alert(  
      "Eliminar Orden",  
      "¿Estás seguro de que quieres eliminar esta orden?",  
      [  
        { text: "Cancelar", style: "cancel" },  
        {  
          text: "Eliminar",  
          style: "destructive",  
          onPress: async () => {  
            try {  
              await orderService.orderService.deleteOrder(selectedCard.id)  
              setShowCardModal(false)  
              loadKanbanData()  
              Alert.alert("Éxito", "Orden eliminada correctamente")  
            } catch (error) {  
              console.error("Error deleting order:", error)  
              Alert.alert("Error", "No se pudo eliminar la orden")  
            }  
          }  
        }  
      ]  
    )  
  }  
  
  // Filtrar columnas según filtros aplicados  
  const getFilteredColumns = () => {  
    return columns.map(column => ({  
      ...column,  
      cards: column.cards?.filter((card: KanbanOrderType) => {  
        if (filterPriority !== "all" && card.prioridad !== filterPriority) return false  
        if (filterAssignee !== "all" && card.tecnico_id !== filterAssignee) return false  
        return true  
      }) || []  
    }))  
  }  
  
  // Obtener técnicos para filtro  
  const getTechnicians = (): TechnicianType[] => {  
    const technicians = new Set()  
    orders.forEach((order: KanbanOrderType) => {  
      if (order.tecnico_info) {  
        technicians.add({  
          id: order.tecnico_id,  
          name: order.tecnico_info.nombre  
        })  
      }  
    })  
    return Array.from(technicians) as TechnicianType[]  
  }  
  
  const filteredColumns = getFilteredColumns()  
  const technicians = getTechnicians()  
  
  if (loading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#1a73e8" />  
        <Text style={styles.loadingText}>Cargando tablero Kanban...</Text>  
      </View>  
    )  
  }  
  
  return (  
    <SafeAreaView style={styles.container}>  
      <View style={styles.header}>  
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>  
          <Feather name="arrow-left" size={24} color="#333" />  
        </TouchableOpacity>  
        <Text style={styles.headerTitle}>Tablero Kanban</Text>  
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilter(!showFilter)}>  
          <Feather name="filter" size={20} color="#1a73e8" /> 
          </TouchableOpacity>  
      </View>  
  
      {showFilter && (  
        <View style={styles.filterContainer}>  
          <View style={styles.filterSection}>  
            <Text style={styles.filterLabel}>Prioridad:</Text>  
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>  
              <TouchableOpacity  
                style={[styles.filterChip, filterPriority === "all" && styles.filterChipActive]}  
                onPress={() => setFilterPriority("all")}  
              >  
                <Text style={[styles.filterChipText, filterPriority === "all" && styles.filterChipTextActive]}>  
                  Todas  
                </Text>  
              </TouchableOpacity>  
              <TouchableOpacity  
                style={[styles.filterChip, filterPriority === "high" && styles.filterChipActive]}  
                onPress={() => setFilterPriority("high")}  
              >  
                <Text style={[styles.filterChipText, filterPriority === "high" && styles.filterChipTextActive]}>  
                  Alta  
                </Text>  
              </TouchableOpacity>  
              <TouchableOpacity  
                style={[styles.filterChip, filterPriority === "normal" && styles.filterChipActive]}  
                onPress={() => setFilterPriority("normal")}  
              >  
                <Text style={[styles.filterChipText, filterPriority === "normal" && styles.filterChipTextActive]}>  
                  Normal  
                </Text>  
              </TouchableOpacity>  
              <TouchableOpacity  
                style={[styles.filterChip, filterPriority === "low" && styles.filterChipActive]}  
                onPress={() => setFilterPriority("low")}  
              >  
                <Text style={[styles.filterChipText, filterPriority === "low" && styles.filterChipTextActive]}>  
                  Baja  
                </Text>  
              </TouchableOpacity>  
            </ScrollView>  
          </View>  
  
          <View style={styles.filterSection}>  
            <Text style={styles.filterLabel}>Asignado a:</Text>  
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>  
              <TouchableOpacity  
                style={[styles.filterChip, filterAssignee === "all" && styles.filterChipActive]}  
                onPress={() => setFilterAssignee("all")}  
              >  
                <Text style={[styles.filterChipText, filterAssignee === "all" && styles.filterChipTextActive]}>  
                  Todos  
                </Text>  
              </TouchableOpacity>  
              <TouchableOpacity  
                style={[styles.filterChip, filterAssignee === "unassigned" && styles.filterChipActive]}  
                onPress={() => setFilterAssignee("unassigned")}  
              >  
                <Text style={[styles.filterChipText, filterAssignee === "unassigned" && styles.filterChipTextActive]}>  
                  Sin asignar  
                </Text>  
              </TouchableOpacity>  
              {technicians.map((tech) => (  
                <TouchableOpacity  
                  key={tech.id}  
                  style={[styles.filterChip, filterAssignee === tech.id && styles.filterChipActive]}  
                  onPress={() => setFilterAssignee(tech.id)}  
                >  
                  <Text style={[styles.filterChipText, filterAssignee === tech.id && styles.filterChipTextActive]}>  
                    {tech.nombre}  
                  </Text>  
                </TouchableOpacity>  
              ))}  
            </ScrollView>  
          </View>  
        </View>  
      )}  
  
      <ScrollView   
        horizontal   
        showsHorizontalScrollIndicator={false}   
        contentContainerStyle={styles.kanbanContainer}  
        refreshControl={  
          <RefreshControl refreshing={refreshing} onRefresh={loadKanbanData} colors={["#1a73e8"]} />  
        }  
      >  
        {filteredColumns.map((column) => (  
          <KanbanColumn  
            key={column.id}  
            column={column}  
            onCardPress={handleCardPress}  
            onCardLongPress={handleCardLongPress}  
            onDrop={(cardId) => moveCard(column.id, cardId)}  
            isDropArea={false}  
            onAddCard={handleAddCard}  
          />  
        ))}  
      </ScrollView>  
  
      {/* Modal para ver/editar detalles de tarjeta */}  
      <Modal  
        visible={showCardModal}  
        animationType="slide"  
        presentationStyle="pageSheet"  
      >  
        <SafeAreaView style={styles.modalContainer}>  
          <View style={styles.modalHeader}>  
            <TouchableOpacity style={styles.modalBackButton} onPress={() => setShowCardModal(false)}>  
              <Feather name="arrow-left" size={24} color="#333" />  
            </TouchableOpacity>  
            <Text style={styles.modalTitle}>Detalles de la Orden</Text>  
            <View style={styles.modalHeaderActions}>  
              <TouchableOpacity style={styles.modalHeaderButton} onPress={() => setShowMoveModal(true)}>  
                <Feather name="move" size={20} color="#1a73e8" />  
              </TouchableOpacity>  
              <TouchableOpacity style={[styles.modalHeaderButton, { marginLeft: 16 }]} onPress={deleteCard}>  
                <Feather name="trash-2" size={20} color="#f44336" />  
              </TouchableOpacity>  
            </View>  
          </View>  
  
          <ScrollView style={styles.modalContent}>  
            {selectedCard && (  
              <>  
                <View style={styles.cardDetailSection}>  
                  <Text style={styles.cardDetailLabel}>Número de Orden</Text>  
                  <Text style={styles.cardDetailValue}>{selectedCard.numero_orden}</Text>  
                </View>  
  
                <View style={styles.cardDetailSection}>  
                  <Text style={styles.cardDetailLabel}>Cliente</Text>  
                  <Text style={styles.cardDetailValue}>{selectedCard.client_info?.name}</Text>  
                </View>  
  
                <View style={styles.cardDetailSection}>  
                  <Text style={styles.cardDetailLabel}>Vehículo</Text>  
                  <Text style={styles.cardDetailValue}>  
                    {selectedCard.vehiculo_info?.marca} {selectedCard.vehiculo_info?.modelo} - {selectedCard.vehiculo_info?.placa}  
                  </Text>  
                </View>  
  
                <View style={styles.cardDetailSection}>  
                  <Text style={styles.cardDetailLabel}>Descripción</Text>  
                  <Text style={styles.cardDetailValue}>{selectedCard.descripcion}</Text>  
                </View>  
  
                <View style={styles.cardDetailSection}>  
                  <Text style={styles.cardDetailLabel}>Técnico Asignado</Text>  
                  <Text style={styles.cardDetailValue}>{selectedCard.tecnico_info?.nombre || "Sin asignar"}</Text>  
                </View>  
  
                <View style={styles.cardDetailSection}>  
                  <Text style={styles.cardDetailLabel}>Prioridad</Text>  
                  <Text style={styles.cardDetailValue}>{selectedCard.prioridad}</Text>  
                </View>  
  
                <View style={styles.cardDetailSection}>  
                  <Text style={styles.cardDetailLabel}>Costo</Text>  
                  <Text style={styles.cardDetailValue}>  
                    ${selectedCard.costo?.toFixed(2) || "0.00"}  
                  </Text>  
                </View>  
  
                <View style={styles.cardDetailSection}>  
                  <Text style={styles.cardDetailLabel}>Fecha de Creación</Text>  
                  <Text style={styles.cardDetailValue}>  
                    {new Date(selectedCard.fecha_creacion).toLocaleDateString("es-ES")}  
                  </Text>  
                </View>  
  
                {selectedCard.observacion && (  
                  <View style={styles.cardDetailSection}>  
                    <Text style={styles.cardDetailLabel}>Observaciones</Text>  
                    <Text style={styles.cardDetailValue}>{selectedCard.observacion}</Text>  
                  </View>  
                )}  
              </>  
            )}  
          </ScrollView>  
  
          <View style={styles.modalFooter}>  
            <TouchableOpacity   
              style={styles.modalActionButton}  
              onPress={() => {  
                setShowCardModal(false)  
                navigation.navigate("OrderDetail", { orderId: selectedCard?.id })  
              }}  
            >  
              <Feather name="eye" size={20} color="#1a73e8" />  
              <Text style={styles.modalActionButtonText}>Ver Detalle</Text>  
            </TouchableOpacity>  
              
            <TouchableOpacity   
              style={styles.modalActionButton}  
              onPress={() => {  
                setShowCardModal(false)  
                navigation.navigate("UpdateOrder", { orderId: selectedCard?.id })  
              }}  
            >  
              <Feather name="edit-2" size={20} color="#1a73e8" />  
              <Text style={styles.modalActionButtonText}>Editar</Text>  
            </TouchableOpacity>  
          </View>  
        </SafeAreaView>  
      </Modal>  
  
      {/* Modal para mover tarjeta */}  
      <Modal  
        visible={showMoveModal}  
        animationType="slide"  
        transparent={true}  
      >  
        <View style={styles.moveModalOverlay}>  
          <View style={styles.moveModalContainer}>  
            <Text style={styles.moveModalTitle}>Mover Orden</Text>  
            <Text style={styles.moveModalSubtitle}>  
              Selecciona la nueva columna para la orden  
            </Text>  
  
            <ScrollView style={styles.moveModalContent}>  
              {KANBAN_COLUMNS.map((column) => (  
                <TouchableOpacity  
                  key={column.id}  
                  style={[  
                    styles.moveModalOption,  
                    selectedColumn?.id === column.id && styles.moveModalOptionDisabled  
                  ]}  
                  onPress={() => moveCard(column.id, selectedCard?.id || '')}  
                  disabled={selectedColumn?.id === column.id}  
                >  
                  <View style={[styles.moveModalOptionColor, { backgroundColor: column.color }]} />  
                  <View style={styles.moveModalOptionContent}>  
                    <Text style={styles.moveModalOptionTitle}>{column.title}</Text>  
                    <Text style={styles.moveModalOptionDescription}>{column.description}</Text>  
                  </View>  
                  {selectedColumn?.id === column.id && (  
                    <Text style={styles.moveModalCurrentLabel}>Actual</Text>  
                  )}  
                </TouchableOpacity>  
              ))}  
            </ScrollView>  
  
            <TouchableOpacity   
              style={styles.moveModalCancelButton}  
              onPress={() => setShowMoveModal(false)}  
            >  
              <Text style={styles.moveModalCancelText}>Cancelar</Text>  
            </TouchableOpacity>  
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
  loadingContainer: {  
    flex: 1,  
    justifyContent: "center",  
    alignItems: "center",  
    backgroundColor: "#f5f5f5",  
  },  
  loadingText: {  
    marginTop: 10,  
    fontSize: 16,  
    color: "#666",  
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
  filterButton: {  
    padding: 8,  
  },  
  filterContainer: {  
    backgroundColor: "#fff",  
    paddingHorizontal: 16,  
    paddingVertical: 8,  
    borderBottomWidth: 1,  
    borderBottomColor: "#eee",  
  },  
  filterSection: {  
    marginBottom: 8,  
  },  
  filterLabel: {  
    fontSize: 12,  
    fontWeight: "500",  
    color: "#666",  
    marginBottom: 4,  
  },  
  filterChip: {  
    paddingHorizontal: 12,  
    paddingVertical: 6,  
    borderRadius: 16,  
    borderWidth: 1,  
    borderColor: "#ddd",  
    marginRight: 8,  
    marginBottom: 4,  
  },  
  filterChipActive: {  
    backgroundColor: "#e6f0ff",  
    borderColor: "#1a73e8",  
  },  
  filterChipText: {  
    fontSize: 12,  
    color: "#666",  
  },  
  filterChipTextActive: {  
    color: "#1a73e8",  
    fontWeight: "500",  
  },  
  kanbanContainer: {  
    padding: 16,  
  },  
  kanbanColumn: {  
    width: 280,  
    height: 600,  
    backgroundColor: "#f0f0f0",  
    borderRadius: 12,  
    padding: 12,  
    marginRight: 16,  
  },  
  dropArea: {  
    backgroundColor: "#e6f0ff",  
    borderWidth: 2,  
    borderColor: "#1a73e8",  
    borderStyle: "dashed",  
  },  
  columnHeader: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    paddingBottom: 12,  
    marginBottom: 8,  
    borderBottomWidth: 2,  
  },  
  columnTitle: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  columnBadge: {  
    width: 24,  
    height: 24,  
    borderRadius: 12,  
    justifyContent: "center",  
    alignItems: "center",  
  },  
  columnCount: {  
    color: "#fff",  
    fontSize: 12,  
    fontWeight: "bold",  
  },  
  columnDescription: {  
    fontSize: 12,  
    color: "#666",  
    marginBottom: 12,  
    lineHeight: 16,  
  },  
  columnScroll: {  
    flex: 1,  
    marginBottom: 12,  
  },  
  addCardButton: {  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "center",  
    padding: 12,  
    backgroundColor: "#fff",  
    borderRadius: 8,  
    borderWidth: 1,  
    borderColor: "#ddd",  
    borderStyle: "dashed",  
  },  
  addCardText: {  
    marginLeft: 8,  
    fontSize: 14,  
    color: "#1a73e8",  
    fontWeight: "500",  
  },  
  kanbanCard: {  
    backgroundColor: "#fff",  
    borderRadius: 8,  
    padding: 12,  
    marginBottom: 8,  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 1 },  
    shadowOpacity: 0.1,  
    shadowRadius: 2,  
    elevation: 2,  
  },  
  cardHeader: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    marginBottom: 8,  
  },  
  cardTitle: {  
    fontSize: 14,  
    fontWeight: "bold",  
    color: "#333",  
    flex: 1,  
  },  
  priorityBadge: {  
    width: 8,  
    height: 8,  
    borderRadius: 4,  
    marginLeft: 8,  
  },  
  priorityText: {  
    fontSize: 0, // Hidden text for accessibility  
  },  
  cardClient: {  
    fontSize: 12,  
    color: "#666",  
    marginBottom: 4,  
  },  
  cardPlate: {  
    fontSize: 12,  
    color: "#1a73e8",  
    fontWeight: "500",  
    marginBottom: 8,  
  },  
  cardDescription: {  
    fontSize: 12,  
    color: "#666",  
    lineHeight: 16,  
    marginBottom: 8,  
  },  
  cardFooter: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
  },  
  cardTime: {  
    fontSize: 10,  
    color: "#999",  
  },  
  cardAssignee: {  
    fontSize: 10,  
    color: "#666",  
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
    backgroundColor: "#fff",  
    borderBottomWidth: 1,  
    borderBottomColor: "#eee",  
  },  
  modalBackButton: {  
    padding: 8,  
  },  
  modalTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  modalHeaderActions: {  
    flexDirection: "row",  
    alignItems: "center",  
  },  
  modalHeaderButton: {  
    padding: 8,  
  },  
  modalContent: {  
    flex: 1,  
    padding: 16,  
  },  
  modalFooter: {  
    flexDirection: "row",  
    padding: 16,  
    backgroundColor: "#fff",  
    borderTopWidth: 1,  
    borderTopColor: "#eee",  
    justifyContent: "space-between",  
  },  
  modalActionButton: {  
    flex: 1,  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "center",  
    backgroundColor: "#f8f9fa",  
    borderRadius: 8,  
    paddingVertical: 12,  
    marginHorizontal: 4,  
    gap: 8,  
  },  
  modalActionButtonText: {  
    color: "#1a73e8",  
    fontSize: 14,  
    fontWeight: "500",  
  },  
  cardDetailSection: {  
    backgroundColor: "#f8f9fa",  
    borderRadius: 8,  
    padding: 12,  
    marginBottom: 12,  
  },  
  cardDetailLabel: {  
    fontSize: 14,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 4,  
  },  
  cardDetailValue: {  
    fontSize: 14,  
    color: "#666",  
  },  
  moveModalOverlay: {  
    flex: 1,  
    backgroundColor: "rgba(0, 0, 0, 0.5)",  
    justifyContent: "center",  
    alignItems: "center",  
  },  
  moveModalContainer: {  
    backgroundColor: "#fff",  
    borderRadius: 12,  
    padding: 20,  
    margin: 20,  
    maxHeight: "80%",  
    width: "90%",  
  },  
  moveModalTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 8,  
    textAlign: "center",  
  },  
  moveModalSubtitle: {  
    fontSize: 14,  
    color: "#666",  
    marginBottom: 20,  
    textAlign: "center",  
  },  
  moveModalContent: {  
    maxHeight: 300,  
  },  
  moveModalOption: {  
    flexDirection: "row",  
    alignItems: "center",  
    padding: 12,  
    borderRadius: 8,  
    marginBottom: 8,  
    backgroundColor: "#f8f9fa",  
  },  
  moveModalOptionDisabled: {  
    opacity: 0.5,  
  },  
  moveModalOptionColor: {  
    width: 16,  
    height: 16,  
    borderRadius: 8,  
    marginRight: 12,  
  },  
  moveModalOptionContent: {  
    flex: 1,  
  },  
  moveModalOptionTitle: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 2,  
  },  
  moveModalOptionDescription: {  
    fontSize: 12,  
    color: "#666",  
  },  
  moveModalCurrentLabel: {  
    fontSize: 12,  
    color: "#1a73e8",  
    fontWeight: "bold",  
  },  
  moveModalCancelButton: {  
    backgroundColor: "#e1e4e8",  
    borderRadius: 8,  
    paddingVertical: 12,  
    alignItems: "center",  
    marginTop: 16,  
  },  
  moveModalCancelText: {  
    fontSize: 16,  
    fontWeight: "500",  
    color: "#666",  
  },  
})