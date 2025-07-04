"use client"

import { useState } from "react"
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
  Animated,
  ActivityIndicator,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"

// Datos de ejemplo para el tablero Kanban - en una app real, esto vendría de una API
const INITIAL_COLUMNS = [
  {
    id: "reception",
    title: "Recepción",
    color: "#1a73e8",
    description: "Vehículos recién llegados pendientes de diagnóstico inicial",
    allowedTransitions: ["diagnosis"],
    cards: [
      {
        id: "1",
        title: "Toyota Corolla",
        client: "Juan Pérez",
        time: "2h",
        priority: "normal",
        plate: "ABC-1234",
        description: "Revisión de rutina y cambio de aceite",
        assignedTo: "Miguel Técnico",
        createdAt: "2023-03-10T10:00:00Z",
        comments: [
          {
            id: "c1",
            author: "Miguel Técnico",
            text: "Cliente llamado para confirmar cita",
            createdAt: "2023-03-10T11:00:00Z",
          },
        ],
        attachments: [],
        checklist: [
          { id: "cl1", text: "Verificar documentación", completed: true },
          { id: "cl2", text: "Inspección visual inicial", completed: false },
        ],
      },
      {
        id: "2",
        title: "Honda Civic",
        client: "María García",
        time: "1h",
        priority: "high",
        plate: "XYZ-5678",
        description: "Cliente reporta ruido en frenos delanteros",
        assignedTo: "Laura Mecánica",
        createdAt: "2023-03-10T09:00:00Z",
        comments: [],
        attachments: [],
        checklist: [{ id: "cl3", text: "Verificar documentación", completed: true }],
      },
      {
        id: "3",
        title: "Nissan Sentra",
        client: "Carlos Rodríguez",
        time: "3h",
        priority: "low",
        plate: "DEF-9012",
        description: "Mantenimiento de 10,000km",
        assignedTo: "",
        createdAt: "2023-03-10T08:00:00Z",
        comments: [],
        attachments: [],
        checklist: [],
      },
    ],
  },
  {
    id: "diagnosis",
    title: "Diagnóstico",
    color: "#f5a623",
    description: "Vehículos en proceso de diagnóstico técnico",
    allowedTransitions: ["reception", "waiting_parts", "repair"],
    cards: [
      {
        id: "4",
        title: "Ford Focus",
        client: "Ana Martínez",
        time: "4h",
        priority: "high",
        plate: "GHI-3456",
        description: "Falla en sistema eléctrico, luces intermitentes",
        assignedTo: "Roberto Especialista",
        createdAt: "2023-03-09T14:00:00Z",
        comments: [
          {
            id: "c2",
            author: "Roberto Especialista",
            text: "Se identificó problema en el alternador",
            createdAt: "2023-03-09T16:00:00Z",
          },
        ],
        attachments: [],
        checklist: [
          { id: "cl4", text: "Revisar batería", completed: true },
          { id: "cl5", text: "Verificar alternador", completed: true },
          { id: "cl6", text: "Revisar sistema de luces", completed: false },
        ],
      },
      {
        id: "5",
        title: "Chevrolet Spark",
        client: "Pedro Sánchez",
        time: "2h",
        priority: "normal",
        plate: "JKL-7890",
        description: "No enciende, posible problema de batería",
        assignedTo: "Miguel Técnico",
        createdAt: "2023-03-09T10:00:00Z",
        comments: [],
        attachments: [],
        checklist: [],
      },
    ],
  },
  {
    id: "waiting_parts",
    title: "Esperando Repuestos",
    color: "#9c27b0",
    description: "Vehículos en espera de repuestos para continuar reparación",
    allowedTransitions: ["diagnosis", "repair"],
    cards: [
      {
        id: "6",
        title: "Mazda 3",
        client: "Laura González",
        time: "8h",
        priority: "normal",
        plate: "MNO-1234",
        description: "Esperando kit de embrague",
        assignedTo: "Roberto Especialista",
        createdAt: "2023-03-08T11:00:00Z",
        comments: [
          {
            id: "c3",
            author: "Almacén",
            text: "Repuesto solicitado, tiempo estimado de llegada: 2 días",
            createdAt: "2023-03-08T14:00:00Z",
          },
        ],
        attachments: [],
        checklist: [
          { id: "cl7", text: "Solicitar repuesto", completed: true },
          { id: "cl8", text: "Confirmar pedido", completed: true },
          { id: "cl9", text: "Recibir repuesto", completed: false },
        ],
      },
    ],
  },
  {
    id: "repair",
    title: "Reparación",
    color: "#4caf50",
    description: "Vehículos en proceso de reparación",
    allowedTransitions: ["waiting_parts", "quality_check"],
    cards: [
      {
        id: "7",
        title: "Kia Rio",
        client: "Roberto Díaz",
        time: "6h",
        priority: "high",
        plate: "PQR-5678",
        description: "Cambio de sistema de frenos completo",
        assignedTo: "Laura Mecánica",
        createdAt: "2023-03-07T09:00:00Z",
        comments: [],
        attachments: [],
        checklist: [
          { id: "cl10", text: "Desmontar sistema actual", completed: true },
          { id: "cl11", text: "Instalar nuevas pastillas", completed: false },
          { id: "cl12", text: "Verificar funcionamiento", completed: false },
        ],
      },
    ],
  },
  {
    id: "quality_check",
    title: "Control de Calidad",
    color: "#03a9f4",
    description: "Verificando calidad de las reparaciones realizadas",
    allowedTransitions: ["repair", "completed"],
    cards: [
      {
        id: "8",
        title: "Hyundai Accent",
        client: "Sofía López",
        time: "1h",
        priority: "normal",
        plate: "STU-9012",
        description: "Verificación post cambio de correa de distribución",
        assignedTo: "Miguel Técnico",
        createdAt: "2023-03-06T16:00:00Z",
        comments: [],
        attachments: [],
        checklist: [
          { id: "cl13", text: "Verificar tensión", completed: true },
          { id: "cl14", text: "Prueba de carretera", completed: false },
        ],
      },
    ],
  },
  {
    id: "completed",
    title: "Completado",
    color: "#607d8b",
    description: "Vehículos listos para entregar o ya entregados al cliente",
    allowedTransitions: ["quality_check"],
    cards: [
      {
        id: "9",
        title: "Volkswagen Jetta",
        client: "Miguel Torres",
        time: "30m",
        priority: "high",
        plate: "VWX-3456",
        description: "Alineación y balanceo completo",
        assignedTo: "Roberto Especialista",
        createdAt: "2023-03-05T10:00:00Z",
        completedAt: "2023-03-05T15:00:00Z",
        comments: [
          {
            id: "c4",
            author: "Miguel Torres",
            text: "Cliente satisfecho con el servicio",
            createdAt: "2023-03-05T16:00:00Z",
          },
        ],
        attachments: [],
        checklist: [
          { id: "cl15", text: "Alineación", completed: true },
          { id: "cl16", text: "Balanceo", completed: true },
          { id: "cl17", text: "Prueba de carretera", completed: true },
        ],
      },
    ],
  },
]

// Validador de cambios de estado
const validateStateTransition = (fromColumnId, toColumnId, columns) => {
  const fromColumn = columns.find((col) => col.id === fromColumnId)
  if (!fromColumn) return false

  return fromColumn.allowedTransitions.includes(toColumnId)
}

// Componente para tarjeta Kanban
const KanbanCard = ({ card, onPress, onLongPress, isDragging }) => {
  const priorityColors = {
    high: "#f44336",
    normal: "#4caf50",
    low: "#607d8b",
  }

  return (
    <Animated.View style={[styles.kanbanCard, isDragging && styles.cardDragging]}>
      <TouchableOpacity style={styles.cardTouchable} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.9}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {card.title}
          </Text>
          <View style={[styles.priorityIndicator, { backgroundColor: priorityColors[card.priority] }]} />
        </View>
        <Text style={styles.cardClient} numberOfLines={1}>
          {card.client}
        </Text>
        <Text style={styles.cardPlate} numberOfLines={1}>
          Placa: {card.plate}
        </Text>

        {card.description && (
          <Text style={styles.cardDescription} numberOfLines={2}>
            {card.description}
          </Text>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.timeContainer}>
            <Feather name="clock" size={12} color="#666" />
            <Text style={styles.timeText}>{card.time}</Text>
          </View>

          {card.assignedTo && (
            <View style={styles.assigneeContainer}>
              <Feather name="user" size={12} color="#666" />
              <Text style={styles.assigneeText} numberOfLines={1}>
                {card.assignedTo}
              </Text>
            </View>
          )}

          {card.comments && card.comments.length > 0 && (
            <View style={styles.commentsContainer}>
              <Feather name="message-circle" size={12} color="#666" />
              <Text style={styles.commentsText}>{card.comments.length}</Text>
            </View>
          )}

          {card.checklist && card.checklist.length > 0 && (
            <View style={styles.checklistContainer}>
              <Feather name="check-square" size={12} color="#666" />
              <Text style={styles.checklistText}>
                {card.checklist.filter((item) => item.completed).length}/{card.checklist.length}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

// Componente para columna Kanban
const KanbanColumn = ({ column, onCardPress, onCardLongPress, onDrop, isDropArea, onAddCard }) => {
  return (
    <View style={[styles.kanbanColumn, isDropArea && styles.dropArea]}>
      <View style={[styles.columnHeader, { borderBottomColor: column.color }]}>
        <Text style={styles.columnTitle}>{column.title}</Text>
        <View style={[styles.columnBadge, { backgroundColor: column.color }]}>
          <Text style={styles.columnCount}>{column.cards.length}</Text>
        </View>
      </View>

      <Text style={styles.columnDescription}>{column.description}</Text>

      <ScrollView style={styles.columnScroll}>
        {column.cards.map((card) => (
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
        <Text style={styles.addCardText}>Agregar Tarjeta</Text>
      </TouchableOpacity>
    </View>
  )
}

// Componente para agregar/editar checklist item
const ChecklistItemEditor = ({ checklistItem = { id: "", text: "", completed: false }, onSave, onCancel }) => {
  const [text, setText] = useState(checklistItem.text || "")

  return (
    <View style={styles.checklistItemEditor}>
      <TextInput
        style={styles.checklistItemInput}
        value={text}
        onChangeText={setText}
        placeholder="Tarea a realizar"
        autoFocus
      />
      <View style={styles.checklistItemButtons}>
        <TouchableOpacity style={[styles.checklistItemButton, styles.checklistItemCancelButton]} onPress={onCancel}>
          <Text style={styles.checklistItemButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.checklistItemButton, styles.checklistItemSaveButton]}
          onPress={() => onSave({ ...checklistItem, text })}
          disabled={!text.trim()}
        >
          <Text style={styles.checklistItemSaveButtonText}>Guardar</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default function KanbanScreen({ navigation }) {
  const [columns, setColumns] = useState(INITIAL_COLUMNS)
  const [selectedCard, setSelectedCard] = useState(null)
  const [selectedColumn, setSelectedColumn] = useState(null)
  const [showCardModal, setShowCardModal] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [dropArea, setDropArea] = useState(null)
  const [draggingCard, setDraggingCard] = useState(null)
  const [draggingColumn, setDraggingColumn] = useState(null)
  const [newComment, setNewComment] = useState("")
  const [addingChecklist, setAddingChecklist] = useState(false)
  const [editingChecklistItem, setEditingChecklistItem] = useState(null)
  const [showFilter, setShowFilter] = useState(false)
  const [filterPriority, setFilterPriority] = useState("all")
  const [filterAssignee, setFilterAssignee] = useState("all")
  const [loading, setLoading] = useState(false)

  // Función para manejar el clic en una tarjeta - abre el modal detallado
  const handleCardPress = (card, column) => {
    setSelectedCard(card)
    setSelectedColumn(column)
    setShowCardModal(true)
  }

  // Función para manejar el clic largo en una tarjeta - prepara para arrastrar
  const handleCardLongPress = (card, column) => {
    setDraggingCard(card)
    setDraggingColumn(column)
    // Vibración para feedback táctil sería ideal aquí
  }

  // Función para mover una tarjeta a otra columna
  const moveCard = (targetColumnId) => {
    if (!selectedCard || !selectedColumn || targetColumnId === selectedColumn.id) {
      setShowMoveModal(false)
      return
    }

    // Validar si es posible mover la tarjeta a la columna destino
    if (!validateStateTransition(selectedColumn.id, targetColumnId, columns)) {
      Alert.alert(
        "Movimiento no permitido",
        `No es posible mover una tarjeta de "${selectedColumn.title}" a esta columna según el flujo de trabajo.`,
        [{ text: "Entendido" }],
      )
      setShowMoveModal(false)
      return
    }

    setLoading(true)

    // Simular una operación asíncrona (en producción, esta sería una llamada a la API)
    setTimeout(() => {
      const updatedColumns = columns.map((column) => {
        // Remover la tarjeta de la columna original
        if (column.id === selectedColumn.id) {
          return {
            ...column,
            cards: column.cards.filter((card) => card.id !== selectedCard.id),
          }
        }
        // Agregar la tarjeta a la nueva columna
        if (column.id === targetColumnId) {
          return {
            ...column,
            cards: [
              ...column.cards,
              {
                ...selectedCard,
                // Agregar timestamp para columnas específicas
                ...(column.id === "completed" && { completedAt: new Date().toISOString() }),
              },
            ],
          }
        }
        return column
      })

      setColumns(updatedColumns)
      setShowMoveModal(false)
      setLoading(false)
    }, 800)
  }

  // Función para agregar una nueva tarjeta
  const handleAddCard = (column) => {
    const newCardId = `new-${Date.now()}`
    const newCard = {
      id: newCardId,
      title: "",
      client: "",
      plate: "",
      time: "0h",
      priority: "normal",
      description: "",
      assignedTo: "",
      createdAt: new Date().toISOString(),
      comments: [],
      attachments: [],
      checklist: [],
    }

    // Abrir modal de edición con la nueva tarjeta
    setSelectedCard(newCard)
    setSelectedColumn(column)
    setShowCardModal(true)
  }

  // Función para guardar los cambios en una tarjeta
  const saveCardChanges = (updatedCard) => {
    if (!selectedColumn) return

    setLoading(true)

    // Simular una operación asíncrona
    setTimeout(() => {
      const updatedColumns = columns.map((column) => {
        if (column.id === selectedColumn.id) {
          // Si la tarjeta ya existe, actualizarla
          if (column.cards.some((card) => card.id === updatedCard.id)) {
            return {
              ...column,
              cards: column.cards.map((card) => (card.id === updatedCard.id ? updatedCard : card)),
            }
          }
          // Si es una tarjeta nueva, agregarla
          else {
            return {
              ...column,
              cards: [...column.cards, updatedCard],
            }
          }
        }
        return column
      })

      setColumns(updatedColumns)
      setShowCardModal(false)
      setLoading(false)
    }, 800)
  }

  // Función para eliminar una tarjeta
  const deleteCard = () => {
    if (!selectedCard || !selectedColumn) return

    Alert.alert(
      "Eliminar Tarjeta",
      "¿Estás seguro que deseas eliminar esta tarjeta? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            setLoading(true)

            // Simular una operación asíncrona
            setTimeout(() => {
              const updatedColumns = columns.map((column) => {
                if (column.id === selectedColumn.id) {
                  return {
                    ...column,
                    cards: column.cards.filter((card) => card.id !== selectedCard.id),
                  }
                }
                return column
              })

              setColumns(updatedColumns)
              setShowCardModal(false)
              setLoading(false)
            }, 800)
          },
        },
      ],
    )
  }

  // Función para agregar un comentario
  const addComment = () => {
    if (!newComment.trim() || !selectedCard) return

    const comment = {
      id: `comment-${Date.now()}`,
      author: "Usuario Actual", // En producción, obtener del contexto de autenticación
      text: newComment.trim(),
      createdAt: new Date().toISOString(),
    }

    const updatedCard = {
      ...selectedCard,
      comments: [...(selectedCard.comments || []), comment],
    }

    setSelectedCard(updatedCard)
    setNewComment("")
  }

  // Función para agregar una imagen a la tarjeta
  const addImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (!permissionResult.granted) {
        Alert.alert("Permiso denegado", "Se necesita permiso para acceder a la galería de imágenes")
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const attachment = {
          id: `img-${Date.now()}`,
          type: "image",
          uri: result.assets[0].uri,
          createdAt: new Date().toISOString(),
        }

        setSelectedCard({
          ...selectedCard,
          attachments: [...(selectedCard.attachments || []), attachment],
        })
      }
    } catch (error) {
      console.error("Error al seleccionar imagen:", error)
      Alert.alert("Error", "No se pudo cargar la imagen")
    }
  }

  // Función para tomar una foto y agregarla a la tarjeta
  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync()

      if (!permissionResult.granted) {
        Alert.alert("Permiso denegado", "Se necesita permiso para acceder a la cámara")
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const attachment = {
          id: `cam-${Date.now()}`,
          type: "image",
          uri: result.assets[0].uri,
          createdAt: new Date().toISOString(),
        }

        setSelectedCard({
          ...selectedCard,
          attachments: [...(selectedCard.attachments || []), attachment],
        })
      }
    } catch (error) {
      console.error("Error al tomar foto:", error)
      Alert.alert("Error", "No se pudo capturar la imagen")
    }
  }

  // Función para guardar un nuevo elemento de checklist
  const saveChecklistItem = (item) => {
    const isEditing = Boolean(item.id)
    let updatedChecklist

    if (isEditing) {
      // Actualizar elemento existente
      updatedChecklist = (selectedCard.checklist || []).map((checkItem) =>
        checkItem.id === item.id ? item : checkItem,
      )
    } else {
      // Agregar nuevo elemento
      const newItem = {
        ...item,
        id: `cl-${Date.now()}`,
        completed: false,
      }
      updatedChecklist = [...(selectedCard.checklist || []), newItem]
    }

    setSelectedCard({
      ...selectedCard,
      checklist: updatedChecklist,
    })

    setEditingChecklistItem(null)
    setAddingChecklist(false)
  }

  // Función para alternar el estado completado de un elemento de checklist
  const toggleChecklistItem = (itemId) => {
    const updatedChecklist = (selectedCard.checklist || []).map((item) => {
      if (item.id === itemId) {
        return { ...item, completed: !item.completed }
      }
      return item
    })

    setSelectedCard({
      ...selectedCard,
      checklist: updatedChecklist,
    })
  }

  // Función para eliminar un elemento de checklist
  const deleteChecklistItem = (itemId) => {
    const updatedChecklist = (selectedCard.checklist || []).filter((item) => item.id !== itemId)

    setSelectedCard({
      ...selectedCard,
      checklist: updatedChecklist,
    })
  }

  // Aplicar filtros a las columnas
  const getFilteredColumns = () => {
    if (filterPriority === "all" && filterAssignee === "all") {
      return columns
    }

    return columns.map((column) => {
      const filteredCards = column.cards.filter((card) => {
        const priorityMatch = filterPriority === "all" || card.priority === filterPriority
        const assigneeMatch =
          filterAssignee === "all" ||
          (filterAssignee === "unassigned" && !card.assignedTo) ||
          (card.assignedTo && card.assignedTo.includes(filterAssignee))

        return priorityMatch && assigneeMatch
      })

      return {
        ...column,
        cards: filteredCards,
      }
    })
  }

  // Obtener el listado de técnicos para filtrar
  const getTechnicians = () => {
    const technicians = new Set()

    columns.forEach((column) => {
      column.cards.forEach((card) => {
        if (card.assignedTo) {
          technicians.add(card.assignedTo)
        }
      })
    })

    return Array.from(technicians)
  }

  const filteredColumns = getFilteredColumns()
  const technicians = getTechnicians()

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
                style={[
                  styles.filterChip,
                  filterPriority === "high" && styles.filterChipActive,
                  { borderColor: "#f44336" },
                ]}
                onPress={() => setFilterPriority("high")}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filterPriority === "high" && styles.filterChipTextActive,
                    { color: "#f44336" },
                  ]}
                >
                  Alta
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  filterPriority === "normal" && styles.filterChipActive,
                  { borderColor: "#4caf50" },
                ]}
                onPress={() => setFilterPriority("normal")}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filterPriority === "normal" && styles.filterChipTextActive,
                    { color: "#4caf50" },
                  ]}
                >
                  Normal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  filterPriority === "low" && styles.filterChipActive,
                  { borderColor: "#607d8b" },
                ]}
                onPress={() => setFilterPriority("low")}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filterPriority === "low" && styles.filterChipTextActive,
                    { color: "#607d8b" },
                  ]}
                >
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
                  key={tech}
                  style={[styles.filterChip, filterAssignee === tech && styles.filterChipActive]}
                  onPress={() => setFilterAssignee(tech)}
                >
                  <Text style={[styles.filterChipText, filterAssignee === tech && styles.filterChipTextActive]}>
                    {tech}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kanbanContainer}>
        {filteredColumns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            onCardPress={handleCardPress}
            onCardLongPress={handleCardLongPress}
            onDrop={(cardId) => moveCard(column.id, cardId)}
            isDropArea={dropArea === column.id}
            onAddCard={handleAddCard}
          />
        ))}
      </ScrollView>

      {/* Modal para ver/editar detalles de tarjeta */}
      <Modal
        visible={showCardModal}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowCardModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1a73e8" />
              <Text style={styles.loadingText}>Guardando cambios...</Text>
            </View>
          ) : (
            <>
              <View style={styles.modalHeader}>
                <TouchableOpacity style={styles.modalBackButton} onPress={() => setShowCardModal(false)}>
                  <Feather name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Detalles de la Tarjeta</Text>
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
                      <Text style={styles.cardDetailLabel}>Título</Text>
                      <TextInput
                        style={styles.cardDetailInput}
                        value={selectedCard.title}
                        onChangeText={(text) => setSelectedCard({ ...selectedCard, title: text })}
                        placeholder="Título de la tarjeta"
                      />
                    </View>

                    <View style={styles.cardDetailSection}>
                      <Text style={styles.cardDetailLabel}>Cliente</Text>
                      <TextInput
                        style={styles.cardDetailInput}
                        value={selectedCard.client}
                        onChangeText={(text) => setSelectedCard({ ...selectedCard, client: text })}
                        placeholder="Nombre del cliente"
                      />
                    </View>

                    <View style={styles.cardDetailSection}>
                      <Text style={styles.cardDetailLabel}>Placa</Text>
                      <TextInput
                        style={styles.cardDetailInput}
                        value={selectedCard.plate}
                        onChangeText={(text) => setSelectedCard({ ...selectedCard, plate: text })}
                        placeholder="Número de placa"
                      />
                    </View>

                    <View style={styles.cardDetailSection}>
                      <Text style={styles.cardDetailLabel}>Descripción</Text>
                      <TextInput
                        style={[styles.cardDetailInput, styles.cardDetailTextarea]}
                        value={selectedCard.description}
                        onChangeText={(text) => setSelectedCard({ ...selectedCard, description: text })}
                        placeholder="Descripción detallada del trabajo"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                      />
                    </View>

                    <View style={styles.cardDetailSection}>
                      <Text style={styles.cardDetailLabel}>Prioridad</Text>
                      <View style={styles.prioritySelector}>
                        <TouchableOpacity
                          style={[
                            styles.priorityOption,
                            selectedCard.priority === "high" && styles.priorityOptionSelected,
                            { borderColor: "#f44336" },
                          ]}
                          onPress={() => setSelectedCard({ ...selectedCard, priority: "high" })}
                        >
                          <Text
                            style={[
                              styles.priorityOptionText,
                              selectedCard.priority === "high" && styles.priorityOptionTextSelected,
                              { color: "#f44336" },
                            ]}
                          >
                            Alta
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.priorityOption,
                            selectedCard.priority === "normal" && styles.priorityOptionSelected,
                            { borderColor: "#4caf50" },
                          ]}
                          onPress={() => setSelectedCard({ ...selectedCard, priority: "normal" })}
                        >
                          <Text
                            style={[
                              styles.priorityOptionText,
                              selectedCard.priority === "normal" && styles.priorityOptionTextSelected,
                              { color: "#4caf50" },
                            ]}
                          >
                            Normal
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.priorityOption,
                            selectedCard.priority === "low" && styles.priorityOptionSelected,
                            { borderColor: "#607d8b" },
                          ]}
                          onPress={() => setSelectedCard({ ...selectedCard, priority: "low" })}
                        >
                          <Text
                            style={[
                              styles.priorityOptionText,
                              selectedCard.priority === "low" && styles.priorityOptionTextSelected,
                              { color: "#607d8b" },
                            ]}
                          >
                            Baja
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.cardDetailSection}>
                      <Text style={styles.cardDetailLabel}>Tiempo estimado</Text>
                      <TextInput
                        style={styles.cardDetailInput}
                        value={selectedCard.time}
                        onChangeText={(text) => setSelectedCard({ ...selectedCard, time: text })}
                        placeholder="Ej: 2h, 30m"
                      />
                    </View>

                    <View style={styles.cardDetailSection}>
                      <Text style={styles.cardDetailLabel}>Asignado a</Text>
                      <TextInput
                        style={styles.cardDetailInput}
                        value={selectedCard.assignedTo}
                        onChangeText={(text) => setSelectedCard({ ...selectedCard, assignedTo: text })}
                        placeholder="Nombre del técnico asignado"
                      />
                    </View>

                    {/* Checklist */}
                    <View style={styles.cardDetailSection}>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.cardDetailLabel}>Lista de tareas</Text>
                        {!addingChecklist && (
                          <TouchableOpacity style={styles.sectionAddButton} onPress={() => setAddingChecklist(true)}>
                            <Feather name="plus" size={18} color="#1a73e8" />
                          </TouchableOpacity>
                        )}
                      </View>

                      {addingChecklist && (
                        <ChecklistItemEditor onSave={saveChecklistItem} onCancel={() => setAddingChecklist(false)} />
                      )}

                      {editingChecklistItem && (
                        <ChecklistItemEditor
                          checklistItem={editingChecklistItem}
                          onSave={saveChecklistItem}
                          onCancel={() => setEditingChecklistItem(null)}
                        />
                      )}

                      {selectedCard.checklist && selectedCard.checklist.length > 0 ? (
                        <View style={styles.checklistContainer}>
                          {selectedCard.checklist.map((item) => (
                            <View key={item.id} style={styles.checklistItem}>
                              <TouchableOpacity
                                style={styles.checklistCheckbox}
                                onPress={() => toggleChecklistItem(item.id)}
                              >
                                <Feather
                                  name={item.completed ? "check-square" : "square"}
                                  size={20}
                                  color={item.completed ? "#4caf50" : "#666"}
                                />
                              </TouchableOpacity>
                              <Text style={[styles.checklistText, item.completed && styles.checklistTextCompleted]}>
                                {item.text}
                              </Text>
                              <View style={styles.checklistActions}>
                                <TouchableOpacity
                                  style={styles.checklistAction}
                                  onPress={() => setEditingChecklistItem(item)}
                                >
                                  <Feather name="edit-2" size={16} color="#666" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.checklistAction}
                                  onPress={() => deleteChecklistItem(item.id)}
                                >
                                  <Feather name="trash-2" size={16} color="#f44336" />
                                </TouchableOpacity>
                              </View>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.emptyListText}>No hay tareas asignadas. Agrega una tarea.</Text>
                      )}
                    </View>

                    {/* Galería de imágenes */}
                    <View style={styles.cardDetailSection}>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.cardDetailLabel}>Imágenes adjuntas</Text>
                        <View style={styles.mediaButtons}>
                          <TouchableOpacity style={styles.mediaButton} onPress={takePhoto}>
                            <Feather name="camera" size={18} color="#1a73e8" />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.mediaButton} onPress={addImage}>
                            <Feather name="image" size={18} color="#1a73e8" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {selectedCard.attachments && selectedCard.attachments.length > 0 ? (
                        <ScrollView
                          horizontal
                          style={styles.attachmentsContainer}
                          showsHorizontalScrollIndicator={false}
                        >
                          {selectedCard.attachments.map((attachment) => (
                            <View key={attachment.id} style={styles.attachmentItem}>
                              <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
                              <TouchableOpacity
                                style={styles.removeAttachmentButton}
                                onPress={() => {
                                  setSelectedCard({
                                    ...selectedCard,
                                    attachments: selectedCard.attachments.filter((a) => a.id !== attachment.id),
                                  })
                                }}
                              >
                                <Feather name="x" size={16} color="#fff" />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </ScrollView>
                      ) : (
                        <Text style={styles.emptyListText}>No hay imágenes adjuntas. Agrega una imagen.</Text>
                      )}
                    </View>

                    {/* Comentarios */}
                    <View style={styles.cardDetailSection}>
                      <Text style={styles.cardDetailLabel}>Comentarios</Text>

                      <View style={styles.commentInputContainer}>
                        <TextInput
                          style={styles.commentInput}
                          value={newComment}
                          onChangeText={setNewComment}
                          placeholder="Escribe un comentario..."
                          multiline
                        />
                        <TouchableOpacity
                          style={[styles.commentSendButton, !newComment.trim() && styles.commentSendButtonDisabled]}
                          onPress={addComment}
                          disabled={!newComment.trim()}
                        >
                          <Feather name="send" size={18} color={newComment.trim() ? "#fff" : "#999"} />
                        </TouchableOpacity>
                      </View>

                      {selectedCard.comments && selectedCard.comments.length > 0 ? (
                        <View style={styles.commentsContainer}>
                          {selectedCard.comments.map((comment) => (
                            <View key={comment.id} style={styles.commentItem}>
                              <View style={styles.commentHeader}>
                                <Text style={styles.commentAuthor}>{comment.author}</Text>
                                <Text style={styles.commentDate}>{new Date(comment.createdAt).toLocaleString()}</Text>
                              </View>
                              <Text style={styles.commentText}>{comment.text}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.emptyListText}>No hay comentarios. Sé el primero en comentar.</Text>
                      )}
                    </View>
                  </>
                )}
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setShowCardModal(false)}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={() => saveCardChanges(selectedCard)}
                  disabled={!selectedCard || !selectedCard.title}
                >
                  <Text style={styles.saveButtonText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </SafeAreaView>
      </Modal>

      {/* Modal para mover tarjeta */}
      <Modal
        visible={showMoveModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMoveModal(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowMoveModal(false)}>
          <View style={styles.moveModalContainer}>
            <View style={styles.moveModalContent}>
              <Text style={styles.moveModalTitle}>Mover Tarjeta</Text>
              <Text style={styles.moveModalSubtitle}>{selectedCard ? selectedCard.title : ""}</Text>

              <Text style={styles.moveModalLabel}>Seleccionar columna destino:</Text>

              {loading ? (
                <ActivityIndicator size="small" color="#1a73e8" style={{ margin: 20 }} />
              ) : (
                columns.map((column) => (
                  <TouchableOpacity
                    key={column.id}
                    style={[
                      styles.columnOption,
                      selectedColumn && column.id === selectedColumn.id && styles.disabledOption,
                      !validateStateTransition(selectedColumn?.id, column.id, columns) && styles.invalidOption,
                    ]}
                    onPress={() => moveCard(column.id)}
                    disabled={
                      selectedColumn &&
                      (column.id === selectedColumn.id ||
                        !validateStateTransition(selectedColumn.id, column.id, columns))
                    }
                  >
                    <View style={[styles.columnColor, { backgroundColor: column.color }]} />
                    <Text style={styles.columnOptionText}>{column.title}</Text>
                    {selectedColumn && column.id === selectedColumn.id && (
                      <Text style={styles.currentColumnText}>(Actual)</Text>
                    )}
                  </TouchableOpacity>
                ))
              )}

              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowMoveModal(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
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
    height: "100%",
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
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
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
  },
  columnScroll: {
    flex: 1,
    maxHeight: 500,
    marginBottom: 8,
  },
  kanbanCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardDragging: {
    opacity: 0.7,
    transform: [{ scale: 1.05 }],
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  cardTouchable: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  cardClient: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  cardPlate: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  assigneeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  assigneeText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  commentsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  commentsText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  checklistContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checklistText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  addCardButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1a73e8",
    borderStyle: "dashed",
  },
  addCardText: {
    fontSize: 14,
    color: "#1a73e8",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  moveModalContainer: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  moveModalContent: {
    padding: 20,
  },
  moveModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  moveModalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  moveModalLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 12,
  },
  columnOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  disabledOption: {
    opacity: 0.5,
  },
  invalidOption: {
    opacity: 0.3,
  },
  columnColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  columnOptionText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  currentColumnText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  cancelButton: {
    marginTop: 16,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  cardDetailSection: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardDetailLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  cardDetailInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: "#333",
  },
  cardDetailTextarea: {
    minHeight: 80,
  },
  prioritySelector: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  priorityOption: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 4,
  },
  priorityOptionSelected: {
    backgroundColor: "#f8f8f8",
    borderWidth: 2,
  },
  priorityOptionText: {
    fontSize: 14,
  },
  priorityOptionTextSelected: {
    fontWeight: "bold",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionAddButton: {
    padding: 4,
  },
  checklistItemEditor: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  checklistItemInput: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 8,
    marginBottom: 8,
  },
  checklistItemButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  checklistItemButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  checklistItemCancelButton: {
    backgroundColor: "#f0f0f0",
  },
  checklistItemSaveButton: {
    backgroundColor: "#1a73e8",
  },
  checklistItemButtonText: {
    fontSize: 12,
    color: "#333",
  },
  checklistItemSaveButtonText: {
    fontSize: 12,
    color: "#fff",
  },
  checklistContainer: {
    marginTop: 8,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  checklistCheckbox: {
    marginRight: 8,
  },
  checklistText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  checklistTextCompleted: {
    textDecorationLine: "line-through",
    color: "#999",
  },
  checklistActions: {
    flexDirection: "row",
  },
  checklistAction: {
    padding: 4,
    marginLeft: 4,
  },
  mediaButtons: {
    flexDirection: "row",
  },
  mediaButton: {
    padding: 4,
    marginLeft: 8,
  },
  attachmentsContainer: {
    flexDirection: "row",
    marginTop: 8,
  },
  attachmentItem: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
    position: "relative",
  },
  attachmentImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  removeAttachmentButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  commentInputContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 12,
  },
  commentInput: {
    flex: 1,
    padding: 10,
    fontSize: 14,
    color: "#333",
    maxHeight: 80,
  },
  commentSendButton: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a73e8",
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  commentSendButtonDisabled: {
    backgroundColor: "#ddd",
  },
  commentsContainer: {
    marginTop: 8,
  },
  commentItem: {
    padding: 8,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  commentDate: {
    fontSize: 10,
    color: "#999",
  },
  commentText: {
    fontSize: 14,
    color: "#333",
  },
  emptyListText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 12,
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
})

