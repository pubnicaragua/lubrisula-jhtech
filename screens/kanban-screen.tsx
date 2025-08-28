"use client"  
import { useState, useCallback } from "react"  
import {  
  StyleSheet,  
  View,  
  Text,  
  TouchableOpacity,  
  ScrollView,  
  SafeAreaView,  
  Modal,  
  Alert,  
  ActivityIndicator,  
  RefreshControl,  
} from "react-native"  
import { Feather } from "@expo/vector-icons"  
import { useFocusEffect } from "@react-navigation/native"  
import { useAuth } from "../context/auth-context"  
import { supabase } from "../lib/supabase"  
import ACCESOS_SERVICES from "../services/supabase/access-service"  
import USER_SERVICE from "../services/supabase/user-service"  
  
// Tipos para Kanban  
interface KanbanColumn {  
  id: string  
  title: string  
  color: string  
  position: number  
  cards: KanbanCard[]  
}  
  
interface KanbanCard {  
  id: string  
  column_id: string  
  vehicle_id: string  
  position: number  
  title: string  
  description: string  
  priority: 'high' | 'normal' | 'low'  
  created_at: string  
  vehicle?: {  
    marca: string  
    modelo: string  
    placa: string  
    client_id: string  
  }  
}  
  
interface KanbanScreenProps {  
  navigation: any  
}  
  
export default function KanbanScreen({ navigation }: KanbanScreenProps) {  
  const { user } = useAuth()  
  const [columns, setColumns] = useState<KanbanColumn[]>([])  
  const [loading, setLoading] = useState(true)  
  const [refreshing, setRefreshing] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null)  
  const [showCardModal, setShowCardModal] = useState(false)  
  const [showMoveModal, setShowMoveModal] = useState(false)  
  
  // Cargar datos del Kanban  
  const loadKanbanData = useCallback(async () => {  
    try {  
      setLoading(true)  
      setRefreshing(true)  
      setError(null)  
  
      if (!user?.id) return  
  
      // Validar permisos del usuario  
      const userTallerId = await USER_SERVICE.GET_TALLER_ID(user.id)  
      if (!userTallerId) {  
        setError("No se pudo obtener la información del taller")  
        return  
      }  
  
      const userPermissions = await ACCESOS_SERVICES.GET_PERMISOS_USUARIO(user.id, userTallerId)  
      setUserRole(userPermissions?.role || 'client')  
  
      if (userPermissions?.role === 'client') {  
        setError("No tienes permisos para ver el tablero Kanban")  
        return  
      }  
  
      // Cargar columnas del Kanban  
      const { data: columnsData, error: columnsError } = await supabase  
        .from('kanban_columns')  
        .select('*')  
        .order('position', { ascending: true })  
  
      if (columnsError) throw columnsError  
  
      // Cargar tarjetas con información de vehículos  
      const { data: cardsData, error: cardsError } = await supabase  
        .from('kanban_cards')  
        .select(`  
          *,  
          vehicle:vehicle_id(  
            marca,  
            modelo,  
            placa,  
            client_id  
          )  
        `)  
        .order('position', { ascending: true })  
  
      if (cardsError) throw cardsError  
  
      // Organizar tarjetas por columnas  
      const columnsWithCards = columnsData.map(column => ({  
        ...column,  
        cards: cardsData.filter(card => card.column_id === column.id)  
      }))  
  
      setColumns(columnsWithCards)  
  
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
  
  // Mover tarjeta entre columnas  
  const moveCard = async (cardId: string, targetColumnId: string) => {  
    try {  
      // Obtener la posición más alta en la columna destino  
      const { data: maxPositionData } = await supabase  
        .from('kanban_cards')  
        .select('position')  
        .eq('column_id', targetColumnId)  
        .order('position', { ascending: false })  
        .limit(1)  
  
      const newPosition = maxPositionData?.[0]?.position ? maxPositionData[0].position + 1 : 1  
  
      // Actualizar la tarjeta  
      const { error } = await supabase  
        .from('kanban_cards')  
        .update({  
          column_id: targetColumnId,  
          position: newPosition  
        })  
        .eq('id', cardId)  
  
      if (error) throw error  
  
      // Recargar datos  
      loadKanbanData()  
      setShowMoveModal(false)  
      Alert.alert("Éxito", "Tarjeta movida correctamente")  
  
    } catch (error) {  
      console.error("Error moving card:", error)  
      Alert.alert("Error", "No se pudo mover la tarjeta")  
    }  
  }  
  
  // Crear nueva tarjeta  
  const createNewCard = async (columnId: string) => {  
    try {  
      // Obtener vehículos disponibles  
      const { data: vehicles, error: vehiclesError } = await supabase  
        .from('vehicles')  
        .select('*')  
        .order('created_at', { ascending: false })  
  
      if (vehiclesError) throw vehiclesError  
  
      if (vehicles.length === 0) {  
        Alert.alert("Sin vehículos", "No hay vehículos disponibles para crear una tarjeta")  
        return  
      }  
  
      // Por simplicidad, usar el primer vehículo (en una implementación real, mostrarías un selector)  
      const selectedVehicle = vehicles[0]  
  
      // Obtener la posición más alta en la columna  
      const { data: maxPositionData } = await supabase  
        .from('kanban_cards')  
        .select('position')  
        .eq('column_id', columnId)  
        .order('position', { ascending: false })  
        .limit(1)  
  
      const newPosition = maxPositionData?.[0]?.position ? maxPositionData[0].position + 1 : 1  
  
      // Crear nueva tarjeta  
      const { error } = await supabase  
        .from('kanban_cards')  
        .insert({  
          column_id: columnId,  
          vehicle_id: selectedVehicle.id,  
          position: newPosition,  
          title: `${selectedVehicle.marca} ${selectedVehicle.modelo}`,  
          description: `Placa: ${selectedVehicle.placa}`,  
          priority: 'normal'  
        })  
  
      if (error) throw error  
  
      // Recargar datos  
      loadKanbanData()  
      Alert.alert("Éxito", "Nueva tarjeta creada correctamente")  
  
    } catch (error) {  
      console.error("Error creating card:", error)  
      Alert.alert("Error", "No se pudo crear la tarjeta")  
    }  
  }  
  
  // Renderizar tarjeta  
  const renderCard = (card: KanbanCard) => {  
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
        key={card.id}  
        style={styles.kanbanCard}  
        onPress={() => {  
          setSelectedCard(card)  
          setShowCardModal(true)  
        }}  
        onLongPress={() => {  
          setSelectedCard(card)  
          setShowMoveModal(true)  
        }}  
      >  
        <View style={styles.cardHeader}>  
          <Text style={styles.cardTitle} numberOfLines={1}>  
            {card.title}  
          </Text>  
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(card.priority) }]}>  
            <Text style={styles.priorityText}>{card.priority}</Text>  
          </View>  
        </View>  
        <Text style={styles.cardDescription} numberOfLines={2}>  
          {card.description}  
        </Text>  
        <View style={styles.cardFooter}>  
          <Text style={styles.cardTime}>  
            {new Date(card.created_at).toLocaleDateString("es-ES")}  
          </Text>  
        </View>  
      </TouchableOpacity>  
    )  
  }  
  
  // Renderizar columna  
  const renderColumn = (column: KanbanColumn) => (  
    <View key={column.id} style={styles.kanbanColumn}>  
      <View style={[styles.columnHeader, { borderBottomColor: column.color }]}>  
        <Text style={styles.columnTitle}>{column.title}</Text>  
        <View style={[styles.columnBadge, { backgroundColor: column.color }]}>  
          <Text style={styles.columnCount}>{column.cards?.length || 0}</Text>  
        </View>  
      </View>  
  
      <ScrollView style={styles.columnScroll}>  
        {column.cards?.map(renderCard)}  
      </ScrollView>  
  
      <TouchableOpacity  
        style={styles.addCardButton}  
        onPress={() => createNewCard(column.id)}  
      >  
        <Feather name="plus" size={16} color="#1a73e8" />  
        <Text style={styles.addCardText}>Agregar Tarjeta</Text>  
      </TouchableOpacity>  
    </View>  
  )  
  
  if (loading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#1a73e8" />  
        <Text style={styles.loadingText}>Cargando tablero Kanban...</Text>  
      </View>  
    )  
  }  
  
  if (error) {  
    return (  
      <View style={styles.errorContainer}>  
        <Feather name="alert-circle" size={64} color="#f44336" />  
        <Text style={styles.errorText}>{error}</Text>  
        <TouchableOpacity style={styles.retryButton} onPress={loadKanbanData}>  
          <Text style={styles.retryButtonText}>Reintentar</Text>  
        </TouchableOpacity>  
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
        <View style={styles.placeholder} />  
      </View>  
  
      <ScrollView  
        horizontal  
        showsHorizontalScrollIndicator={false}  
        contentContainerStyle={styles.kanbanContainer}  
        refreshControl={  
          <RefreshControl refreshing={refreshing} onRefresh={loadKanbanData} colors={["#1a73e8"]} />  
        }  
      >  
        {columns.map(renderColumn)}  
      </ScrollView>  
  
      {/* Modal de detalles de tarjeta */}  
      <Modal  
        visible={showCardModal}  
        animationType="slide"  
        presentationStyle="pageSheet"  
      >  
        <SafeAreaView style={styles.modalContainer}>  
          <View style={styles.modalHeader}>  
            <TouchableOpacity onPress={() => setShowCardModal(false)}>  
              <Feather name="x" size={24} color="#666" />  
            </TouchableOpacity>  
            <Text style={styles.modalTitle}>Detalles de la Tarjeta</Text>  
            <View style={styles.placeholder} />  
          </View>  
  
          {selectedCard && (  
            <ScrollView style={styles.modalContent}>  
              <Text style={styles.modalCardTitle}>{selectedCard.title}</Text>  
              <Text style={styles.modalCardDescription}>{selectedCard.description}</Text>  
                
              <View style={styles.modalDetailSection}>  
                <Text style={styles.modalDetailLabel}>Prioridad:</Text>  
                <Text style={styles.modalDetailValue}>{selectedCard.priority}</Text>  
              </View>  
  
              <View style={styles.modalDetailSection}>  
                <Text style={styles.modalDetailLabel}>Fecha de creación:</Text>  
                <Text style={styles.modalDetailValue}>  
                  {new Date(selectedCard.created_at).toLocaleDateString("es-ES")}  
                </Text>  
              </View>  
  
              {selectedCard.vehicle && (  
                <View style={styles.modalDetailSection}>  
                  <Text style={styles.modalDetailLabel}>Vehículo:</Text>  
                  <Text style={styles.modalDetailValue}>  
                    {selectedCard.vehicle.marca} {selectedCard.vehicle.modelo} - {selectedCard.vehicle.placa}  
                  </Text>  
                </View>  
              )}  
            </ScrollView>  
          )}  
        </SafeAreaView>  
      </Modal>  
  
       {/* Modal para mover tarjeta */}  
      <Modal  
        visible={showMoveModal}  
        animationType="slide"  
        transparent={true}  
      >  
        <View style={styles.modalOverlay}>  
          <View style={styles.moveModalContainer}>  
            <Text style={styles.moveModalTitle}>Mover Tarjeta</Text>  
            <Text style={styles.moveModalSubtitle}>  
              Selecciona la nueva columna para la tarjeta  
            </Text>  
              
            {columns.map((column) => (  
              <TouchableOpacity  
                key={column.id}  
                style={[styles.moveOption, { borderLeftColor: column.color }]}  
                onPress={() => moveCard(selectedCard?.id || '', column.id)}  
              >  
                <View style={[styles.moveOptionDot, { backgroundColor: column.color }]} />  
                <View style={styles.moveOptionContent}>  
                  <Text style={styles.moveOptionTitle}>{column.title}</Text>  
                  <Text style={styles.moveOptionDescription}>  
                    {column.cards?.length || 0} tarjetas  
                  </Text>  
                </View>  
              </TouchableOpacity>  
            ))}  
              
            <TouchableOpacity  
              style={styles.cancelMoveButton}  
              onPress={() => setShowMoveModal(false)}  
            >  
              <Text style={styles.cancelMoveText}>Cancelar</Text>  
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
    justifyContent: "space-between",  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    backgroundColor: "#fff",  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  backButton: {  
    padding: 8,  
  },  
  headerTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  placeholder: {  
    width: 40,  
  },  
  kanbanContainer: {  
    flexDirection: "row",  
    paddingHorizontal: 16,  
    paddingVertical: 8,  
  },  
  kanbanColumn: {  
    width: 280,  
    backgroundColor: "#fff",  
    borderRadius: 8,  
    marginRight: 12,  
    padding: 12,  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 2 },  
    shadowOpacity: 0.1,  
    shadowRadius: 4,  
    elevation: 3,  
  },  
  columnHeader: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    paddingBottom: 8,  
    borderBottomWidth: 2,  
    marginBottom: 8,  
  },  
  columnTitle: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  columnBadge: {  
    paddingHorizontal: 8,  
    paddingVertical: 4,  
    borderRadius: 12,  
    minWidth: 24,  
    alignItems: "center",  
  },  
  columnCount: {  
    fontSize: 12,  
    color: "#fff",  
    fontWeight: "bold",  
  },  
  columnScroll: {  
    maxHeight: 400,  
    marginBottom: 12,  
  },  
  kanbanCard: {  
    backgroundColor: "#f8f9fa",  
    borderRadius: 8,  
    padding: 12,  
    marginBottom: 8,  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  cardHeader: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "flex-start",  
    marginBottom: 8,  
  },  
  cardTitle: {  
    fontSize: 14,  
    fontWeight: "bold",  
    color: "#333",  
    flex: 1,  
    marginRight: 8,  
  },  
  priorityBadge: {  
    paddingHorizontal: 6,  
    paddingVertical: 2,  
    borderRadius: 8,  
  },  
  priorityText: {  
    fontSize: 10,  
    color: "#fff",  
    fontWeight: "bold",  
  },  
  cardDescription: {  
    fontSize: 12,  
    color: "#333",  
    marginBottom: 8,  
    lineHeight: 16,  
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
  addCardButton: {  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "center",  
    paddingVertical: 8,  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
    borderRadius: 6,  
    borderStyle: "dashed",  
  },  
  addCardText: {  
    fontSize: 12,  
    color: "#1a73e8",  
    marginLeft: 4,  
    fontWeight: "500",  
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
  modalContent: {  
    flex: 1,  
    padding: 16,  
  },  
  modalCardTitle: {  
    fontSize: 20,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 8,  
  },  
  modalCardDescription: {  
    fontSize: 16,  
    color: "#666",  
    marginBottom: 20,  
    lineHeight: 22,  
  },  
  modalDetailSection: {  
    marginBottom: 16,  
  },  
  modalDetailLabel: {  
    fontSize: 14,  
    color: "#666",  
    marginBottom: 4,  
    fontWeight: "500",  
  },  
  modalDetailValue: {  
    fontSize: 16,  
    color: "#333",  
    lineHeight: 22,  
  },  
  modalOverlay: {  
    flex: 1,  
    backgroundColor: "rgba(0, 0, 0, 0.5)",  
    justifyContent: "center",  
    alignItems: "center",  
  },  
  moveModalContainer: {  
    backgroundColor: "#fff",  
    borderRadius: 12,  
    margin: 20,  
    padding: 20,  
    maxHeight: "80%",  
    width: "90%",  
  },  
  moveModalTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
    textAlign: "center",  
    marginBottom: 8,  
  },  
  moveModalSubtitle: {  
    fontSize: 14,  
    color: "#666",  
    textAlign: "center",  
    marginBottom: 20,  
  },  
  moveOption: {  
    flexDirection: "row",  
    alignItems: "center",  
    paddingVertical: 12,  
    paddingHorizontal: 16,  
    backgroundColor: "#f8f9fa",  
    borderRadius: 8,  
    marginBottom: 8,  
    borderLeftWidth: 4,  
  },  
  moveOptionDot: {  
    width: 12,  
    height: 12,  
    borderRadius: 6,  
    marginRight: 12,  
  },  
  moveOptionContent: {  
    flex: 1,  
  },  
  moveOptionTitle: {  
    fontSize: 16,  
    fontWeight: "600",  
    color: "#333",  
    marginBottom: 2,  
  },  
  moveOptionDescription: {  
    fontSize: 12,  
    color: "#666",  
    lineHeight: 16,  
  },  
  cancelMoveButton: {  
    paddingVertical: 12,  
    alignItems: "center",  
    marginTop: 12,  
  },  
  cancelMoveText: {  
    fontSize: 16,  
    color: "#666",  
    fontWeight: "500",  
  },  
})