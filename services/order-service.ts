import AsyncStorage from "@react-native-async-storage/async-storage"
import type { AppImage, Comment } from "../types"

// Definir tipos
export type OrderStatus =
  | "reception"
  | "diagnosis"
  | "waiting_parts"
  | "in_progress"
  | "quality_check"
  | "completed"
  | "delivered"
  | "cancelled"

export type PaymentStatus = "pending" | "partial" | "paid" | "refunded"

export type OrderItem = {
  id: string
  name: string
  quantity: number
  unitPrice: number
  total: number
  partNumber?: string
  supplier?: string
  status: "pending" | "ordered" | "received" | "installed"
}

export type OrderImage = AppImage

export type OrderComment = Comment

export type RepairProcess = {
  id: string
  name: string
  description: string
  startDate: string
  endDate?: string
  status: "pending" | "in_progress" | "completed" | "cancelled"
  technicianId: string
  technicianName: string
  notes?: string
  images: AppImage[]
}

export type Order = {
  id: string
  number: string
  clientId: string
  vehicleId: string
  technicianId: string
  status: OrderStatus
  description: string
  diagnosis?: string
  notes?: string
  items: OrderItem[]
  laborCost: number
  totalParts: number
  tax: number
  discount?: {
    amount: number
    reason?: string
  }
  total: number
  currency: string
  dates: {
    created: string
    updated: string
    promised?: string
    completed?: string
    delivered?: string
  }
  images: OrderImage[]
  comments: OrderComment[]
  repairProcesses: RepairProcess[]
  paymentStatus: PaymentStatus
  paymentMethod?: string
  paymentNotes?: string
  warranty?: {
    parts: number
    labor: number
    notes?: string
  }
  customerSignature?: string
  technicianSignature?: string
  insuranceResponse?: {
    approved: boolean
    amount?: number
    comments?: string
    date: string
  }
}

// Clave para almacenamiento
const ORDERS_STORAGE_KEY = "orders"

// Datos iniciales de órdenes
const initialOrders: Order[] = [
  {
    id: "1",
    number: "ORD-2025-001",
    clientId: "1",
    vehicleId: "1",
    technicianId: "2",
    status: "in_progress",
    description: "Cambio de aceite y filtros",
    diagnosis: "Mantenimiento preventivo regular",
    items: [
      {
        id: "1",
        name: "Aceite sintético 5W-30",
        quantity: 5,
        unitPrice: 12.99,
        total: 64.95,
        partNumber: "OIL-5W30-1L",
        supplier: "AutoParts Inc.",
        status: "received",
      },
      {
        id: "2",
        name: "Filtro de aceite",
        quantity: 1,
        unitPrice: 8.5,
        total: 8.5,
        partNumber: "FIL-OIL-TOY1",
        supplier: "Toyota Genuine Parts",
        status: "installed",
      },
      {
        id: "3",
        name: "Filtro de aire",
        quantity: 1,
        unitPrice: 15.75,
        total: 15.75,
        partNumber: "FIL-AIR-TOY1",
        supplier: "Toyota Genuine Parts",
        status: "installed",
      },
    ],
    laborCost: 50.0,
    totalParts: 89.2,
    tax: 13.92,
    total: 153.12,
    currency: "USD",
    dates: {
      created: "2025-03-20T10:15:00Z",
      updated: "2025-03-20T14:30:00Z",
      promised: "2025-03-21T17:00:00Z",
    },
    images: [
      {
        id: "o1-img1",
        uri: "https://example.com/order1-1.jpg",
        type: "vehicle",
        description: "Estado inicial del vehículo",
        createdAt: "2025-03-20T10:20:00Z",
      },
      {
        id: "o1-img2",
        uri: "https://example.com/order1-2.jpg",
        type: "repair",
        description: "Cambio de aceite en proceso",
        createdAt: "2025-03-20T13:15:00Z",
      },
    ],
    comments: [
      {
        id: "1",
        userId: "2",
        userName: "Juan Pérez",
        text: "Vehículo recibido. Se procederá con el mantenimiento preventivo solicitado.",
        createdAt: "2025-03-20T10:20:00Z",
        type: "technician",
      },
      {
        id: "2",
        userId: "1",
        userName: "Carlos Rodríguez",
        text: "¿Podrían revisar también las luces delanteras? La derecha parece estar fallando.",
        createdAt: "2025-03-20T11:30:00Z",
        type: "client",
      },
      {
        id: "3",
        userId: "2",
        userName: "Juan Pérez",
        text: "Revisaremos las luces sin costo adicional y le informaremos si requieren reparación.",
        createdAt: "2025-03-20T11:45:00Z",
        type: "technician",
      },
      {
        id: "4",
        userId: "2",
        userName: "Juan Pérez",
        text: "Hemos detectado que la bombilla del faro derecho está quemada. El reemplazo tendría un costo adicional de $15.",
        createdAt: "2025-03-20T14:00:00Z",
        type: "technician",
      },
      {
        id: "5",
        userId: "1",
        userName: "Carlos Rodríguez",
        text: "Autorizo el cambio de la bombilla. Gracias por la revisión.",
        createdAt: "2025-03-20T14:15:00Z",
        type: "client",
      },
    ],
    repairProcesses: [
      {
        id: "1",
        name: "Cambio de aceite",
        description: "Drenaje de aceite usado y reemplazo con aceite sintético 5W-30",
        startDate: "2025-03-20T13:00:00Z",
        endDate: "2025-03-20T13:30:00Z",
        status: "completed",
        technicianId: "2",
        technicianName: "Juan Pérez",
        notes: "Aceite drenado correctamente. Se reemplazó con 5 litros de aceite sintético.",
        images: [
          {
            id: "p1-img1",
            uri: "https://example.com/process1-1.jpg",
            type: "repair",
            description: "Drenaje de aceite",
            createdAt: "2025-03-20T13:10:00Z",
          },
        ],
      },
      {
        id: "2",
        name: "Cambio de filtros",
        description: "Reemplazo de filtro de aceite y filtro de aire",
        startDate: "2025-03-20T13:30:00Z",
        endDate: "2025-03-20T14:00:00Z",
        status: "completed",
        technicianId: "2",
        technicianName: "Juan Pérez",
        images: [
          {
            id: "p2-img1",
            uri: "https://example.com/process2-1.jpg",
            type: "repair",
            description: "Filtros reemplazados",
            createdAt: "2025-03-20T13:50:00Z",
          },
        ],
      },
      {
        id: "3",
        name: "Revisión de luces",
        description: "Inspección y diagnóstico de faro delantero derecho",
        startDate: "2025-03-20T14:00:00Z",
        status: "in_progress",
        technicianId: "2",
        technicianName: "Juan Pérez",
        images: [
          {
            id: "p3-img1",
            uri: "https://example.com/process3-1.jpg",
            type: "damage",
            description: "Faro derecho con bombilla quemada",
            createdAt: "2025-03-20T14:05:00Z",
          },
        ],
      },
    ],
    paymentStatus: "pending",
    warranty: {
      parts: 3, // 3 meses
      labor: 1, // 1 mes
    },
  },
  {
    id: "2",
    number: "ORD-2025-002",
    clientId: "1",
    vehicleId: "2",
    technicianId: "2",
    status: "completed",
    description: "Revisión de frenos y suspensión",
    diagnosis: "Pastillas de freno delanteras desgastadas, amortiguadores en buen estado",
    items: [
      {
        id: "1",
        name: "Pastillas de freno delanteras",
        quantity: 1,
        unitPrice: 45.99,
        total: 45.99,
        partNumber: "BRK-PAD-FRT1",
        supplier: "BrakeMaster Co.",
        status: "installed",
      },
      {
        id: "2",
        name: "Líquido de frenos",
        quantity: 1,
        unitPrice: 12.5,
        total: 12.5,
        partNumber: "FLD-BRK-DOT4",
        supplier: "AutoChem Ltd.",
        status: "installed",
      },
    ],
    laborCost: 75.0,
    totalParts: 58.49,
    tax: 13.35,
    total: 146.84,
    currency: "USD",
    dates: {
      created: "2025-04-05T09:30:00Z",
      updated: "2025-04-06T15:20:00Z",
      promised: "2025-04-06T18:00:00Z",
      completed: "2025-04-06T15:20:00Z",
    },
    images: [
      {
        id: "o2-img1",
        uri: "https://example.com/order2-1.jpg",
        type: "vehicle",
        description: "Estado inicial del vehículo",
        createdAt: "2025-04-05T09:35:00Z",
      },
      {
        id: "o2-img2",
        uri: "https://example.com/order2-2.jpg",
        type: "damage",
        description: "Pastillas de freno desgastadas",
        createdAt: "2025-04-05T10:15:00Z",
      },
      {
        id: "o2-img3",
        uri: "https://example.com/order2-3.jpg",
        type: "repair",
        description: "Pastillas nuevas instaladas",
        createdAt: "2025-04-06T14:30:00Z",
      },
    ],
    comments: [
      {
        id: "1",
        userId: "2",
        userName: "Juan Pérez",
        text: "Diagnóstico inicial: pastillas de freno delanteras con desgaste significativo. Recomiendo reemplazo.",
        createdAt: "2025-04-05T10:30:00Z",
        type: "technician",
      },
      {
        id: "2",
        userId: "1",
        userName: "Carlos Rodríguez",
        text: "Autorizo el cambio de pastillas. ¿Cómo están los amortiguadores?",
        createdAt: "2025-04-05T11:15:00Z",
        type: "client",
      },
      {
        id: "3",
        userId: "2",
        userName: "Juan Pérez",
        text: "Amortiguadores en buen estado, no requieren reemplazo en este momento.",
        createdAt: "2025-04-05T11:30:00Z",
        type: "technician",
      },
      {
        id: "4",
        userId: "2",
        userName: "Juan Pérez",
        text: "Trabajo completado. Se reemplazaron pastillas delanteras y se rellenó líquido de frenos.",
        createdAt: "2025-04-06T15:10:00Z",
        type: "technician",
      },
      {
        id: "5",
        userId: "1",
        userName: "Carlos Rodríguez",
        text: "Gracias por el servicio rápido. ¿Cuándo debería programar la próxima revisión?",
        createdAt: "2025-04-06T16:00:00Z",
        type: "client",
      },
      {
        id: "6",
        userId: "2",
        userName: "Juan Pérez",
        text: "Recomendamos una revisión en 6 meses o 10,000 km, lo que ocurra primero.",
        createdAt: "2025-04-06T16:15:00Z",
        type: "technician",
      },
    ],
    repairProcesses: [
      {
        id: "1",
        name: "Diagnóstico de frenos",
        description: "Inspección de sistema de frenos completo",
        startDate: "2025-04-05T10:00:00Z",
        endDate: "2025-04-05T10:30:00Z",
        status: "completed",
        technicianId: "2",
        technicianName: "Juan Pérez",
        notes: "Pastillas delanteras con desgaste del 90%. Discos en buen estado.",
        images: [
          {
            id: "p4-img1",
            uri: "https://example.com/process4-1.jpg",
            type: "damage",
            description: "Desgaste de pastillas",
            createdAt: "2025-04-05T10:10:00Z",
          },
        ],
      },
      {
        id: "2",
        name: "Revisión de suspensión",
        description: "Inspección de amortiguadores y componentes de suspensión",
        startDate: "2025-04-05T10:30:00Z",
        endDate: "2025-04-05T11:00:00Z",
        status: "completed",
        technicianId: "2",
        technicianName: "Juan Pérez",
        notes: "Amortiguadores y suspensión en buen estado general.",
        images: [
          {
            id: "p5-img1",
            uri: "https://example.com/process5-1.jpg",
            type: "vehicle",
            description: "Inspección de amortiguadores",
            createdAt: "2025-04-05T10:45:00Z",
          },
        ],
      },
      {
        id: "3",
        name: "Reemplazo de pastillas",
        description: "Cambio de pastillas de freno delanteras",
        startDate: "2025-04-06T13:00:00Z",
        endDate: "2025-04-06T14:30:00Z",
        status: "completed",
        technicianId: "2",
        technicianName: "Juan Pérez",
        images: [
          {
            id: "p6-img1",
            uri: "https://example.com/process6-1.jpg",
            type: "repair",
            description: "Instalación de pastillas nuevas",
            createdAt: "2025-04-06T14:00:00Z",
          },
        ],
      },
      {
        id: "4",
        name: "Rellenado de líquido",
        description: "Rellenado y purga de líquido de frenos",
        startDate: "2025-04-06T14:30:00Z",
        endDate: "2025-04-06T15:00:00Z",
        status: "completed",
        technicianId: "2",
        technicianName: "Juan Pérez",
        images: [
          {
            id: "p7-img1",
            uri: "https://example.com/process7-1.jpg",
            type: "repair",
            description: "Purga del sistema de frenos",
            createdAt: "2025-04-06T14:45:00Z",
          },
        ],
      },
    ],
    paymentStatus: "completed",
    paymentMethod: "credit_card",
    paymentNotes: "Pagado con tarjeta Visa terminación 4567",
    warranty: {
      parts: 6, // 6 meses
      labor: 3, // 3 meses
    },
    customerSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAE...",
    technicianSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAE...",
  },
  {
    id: "3",
    number: "ORD-2025-003",
    clientId: "1",
    vehicleId: "1",
    technicianId: "2",
    status: "waiting_parts",
    description: "Ruido en suspensión delantera",
    diagnosis: "Amortiguador delantero izquierdo con fuga de aceite. Se requiere reemplazo.",
    items: [
      {
        id: "1",
        name: "Amortiguador delantero",
        quantity: 1,
        unitPrice: 120.5,
        total: 120.5,
        partNumber: "SUS-SHOCK-TOY1",
        supplier: "Toyota Genuine Parts",
        status: "ordered",
      },
      {
        id: "2",
        name: "Kit de instalación",
        quantity: 1,
        unitPrice: 25.75,
        total: 25.75,
        partNumber: "SUS-KIT-TOY1",
        supplier: "Toyota Genuine Parts",
        status: "ordered",
      },
    ],
    laborCost: 85.0,
    totalParts: 146.25,
    tax: 30.06,
    total: 261.31,
    currency: "USD",
    dates: {
      created: "2025-05-10T11:30:00Z",
      updated: "2025-05-10T14:45:00Z",
      promised: "2025-05-15T17:00:00Z",
    },
    images: [
      {
        id: "o3-img1",
        uri: "https://example.com/order3-1.jpg",
        type: "vehicle",
        description: "Estado inicial del vehículo",
        createdAt: "2025-05-10T11:35:00Z",
      },
      {
        id: "o3-img2",
        uri: "https://example.com/order3-2.jpg",
        type: "damage",
        description: "Amortiguador con fuga",
        createdAt: "2025-05-10T12:20:00Z",
      },
    ],
    comments: [
      {
        id: "1",
        userId: "2",
        userName: "Juan Pérez",
        text: "Diagnóstico: Amortiguador delantero izquierdo con fuga de aceite. Requiere reemplazo.",
        createdAt: "2025-05-10T12:30:00Z",
        type: "technician",
      },
      {
        id: "2",
        userId: "1",
        userName: "Carlos Rodríguez",
        text: "Autorizo el reemplazo del amortiguador.",
        createdAt: "2025-05-10T13:15:00Z",
        type: "client",
      },
      {
        id: "3",
        userId: "2",
        userName: "Juan Pérez",
        text: "Repuestos ordenados. Tiempo estimado de llegada: 3 días hábiles.",
        createdAt: "2025-05-10T14:30:00Z",
        type: "technician",
      },
    ],
    repairProcesses: [
      {
        id: "1",
        name: "Diagnóstico de suspensión",
        description: "Inspección de sistema de suspensión",
        startDate: "2025-05-10T12:00:00Z",
        endDate: "2025-05-10T12:30:00Z",
        status: "completed",
        technicianId: "2",
        technicianName: "Juan Pérez",
        notes: "Amortiguador delantero izquierdo con fuga de aceite.",
        images: [
          {
            id: "p8-img1",
            uri: "https://example.com/process8-1.jpg",
            type: "damage",
            description: "Fuga en amortiguador",
            createdAt: "2025-05-10T12:15:00Z",
          },
        ],
      },
    ],
    paymentStatus: "pending",
    warranty: {
      parts: 12, // 12 meses
      labor: 3, // 3 meses
    },
  },
]

// Inicializar datos
export const initializeOrders = async (): Promise<Order[]> => {
  try {
    const storedOrders = await AsyncStorage.getItem(ORDERS_STORAGE_KEY)
    if (storedOrders === null) {
      await AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(initialOrders))
      return initialOrders
    }
    return JSON.parse(storedOrders)
  } catch (error) {
    console.error("Error al inicializar órdenes:", error)
    return initialOrders
  }
}

// Obtener todas las órdenes
export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const storedOrders = await AsyncStorage.getItem(ORDERS_STORAGE_KEY)
    return storedOrders ? JSON.parse(storedOrders) : []
  } catch (error) {
    console.error("Error al obtener órdenes:", error)
    return []
  }
}

// Obtener orden por ID
export const getOrderById = async (id: string): Promise<Order | null> => {
  try {
    const orders = await getAllOrders()
    return orders.find((order) => order.id === id) || null
  } catch (error) {
    console.error("Error al obtener orden por ID:", error)
    return null
  }
}

// Obtener órdenes por ID de cliente
export const getOrdersByClientId = async (clientId: string): Promise<Order[]> => {
  try {
    const orders = await getAllOrders()
    return orders.filter((order) => order.clientId === clientId)
  } catch (error) {
    console.error("Error al obtener órdenes por ID de cliente:", error)
    return []
  }
}

// Obtener órdenes por ID de vehículo
export const getOrdersByVehicleId = async (vehicleId: string): Promise<Order[]> => {
  try {
    const orders = await getAllOrders()
    return orders.filter((order) => order.vehicleId === vehicleId)
  } catch (error) {
    console.error("Error al obtener órdenes por ID de vehículo:", error)
    return []
  }
}

// Obtener órdenes por ID de técnico
export const getOrdersByTechnicianId = async (technicianId: string): Promise<Order[]> => {
  try {
    const orders = await getAllOrders()
    return orders.filter((order) => order.technicianId === technicianId)
  } catch (error) {
    console.error("Error al obtener órdenes por ID de técnico:", error)
    return []
  }
}

// Obtener órdenes por estado
export const getOrdersByStatus = async (status: OrderStatus): Promise<Order[]> => {
  try {
    const orders = await getAllOrders()
    return orders.filter((order) => order.status === status)
  } catch (error) {
    console.error("Error al obtener órdenes por estado:", error)
    return []
  }
}

// Crear nueva orden
export const createOrder = async (
  orderData: Omit<Order, "id" | "number" | "images" | "comments" | "repairProcesses" | "dates">,
): Promise<Order> => {
  try {
    const orders = await getAllOrders()

    // Generar número de orden
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, "0")}`

    const newOrder: Order = {
      id: Date.now().toString(),
      number: orderNumber,
      ...orderData,
      images: [],
      comments: [],
      repairProcesses: [],
      dates: {
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        promised: orderData.dates?.promised,
      },
    }

    await AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify([...orders, newOrder]))
    return newOrder
  } catch (error) {
    console.error("Error al crear orden:", error)
    throw error
  }
}

// Actualizar orden
export const updateOrder = async (id: string, updates: Partial<Order>): Promise<Order | null> => {
  try {
    const orders = await getAllOrders()
    const index = orders.findIndex((order) => order.id === id)

    if (index === -1) return null

    // Verificar si se está actualizando el estado
    const statusChanged = updates.status && updates.status !== orders[index].status

    const updatedOrder = {
      ...orders[index],
      ...updates,
      dates: {
        ...orders[index].dates,
        updated: new Date().toISOString(),
        // Actualizar fechas específicas según el estado
        ...(statusChanged && updates.status === "completed" ? { completed: new Date().toISOString() } : {}),
        ...(statusChanged && updates.status === "delivered" ? { delivered: new Date().toISOString() } : {}),
      },
    }

    orders[index] = updatedOrder
    await AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders))
    return updatedOrder
  } catch (error) {
    console.error("Error al actualizar orden:", error)
    return null
  }
}

// Añadir imagen a orden
export const addOrderImage = async (orderId: string, image: OrderImage): Promise<Order | null> => {
  try {
    const orders = await getAllOrders()
    const index = orders.findIndex((order) => order.id === orderId)

    if (index === -1) return null

    const updatedOrder = {
      ...orders[index],
      images: [...orders[index].images, image],
      dates: {
        ...orders[index].dates,
        updated: new Date().toISOString(),
      },
    }

    orders[index] = updatedOrder
    await AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders))
    return updatedOrder
  } catch (error) {
    console.error("Error al añadir imagen a orden:", error)
    return null
  }
}

// Obtener comentarios de una orden
export const getOrderComments = async (orderId: string): Promise<OrderComment[]> => {
  try {
    const order = await getOrderById(orderId)
    return order ? order.comments : []
  } catch (error) {
    console.error("Error al obtener comentarios de orden:", error)
    return []
  }
}

// Añadir comentario a orden
export const addOrderComment = async (
  orderId: string,
  comment: Omit<OrderComment, "id" | "createdAt">,
): Promise<Order | null> => {
  try {
    const orders = await getAllOrders()
    const index = orders.findIndex((order) => order.id === orderId)

    if (index === -1) return null

    const newComment: OrderComment = {
      ...comment,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }

    const updatedOrder = {
      ...orders[index],
      comments: [...orders[index].comments, newComment],
      dates: {
        ...orders[index].dates,
        updated: new Date().toISOString(),
      },
    }

    orders[index] = updatedOrder
    await AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders))
    return updatedOrder
  } catch (error) {
    console.error("Error al añadir comentario a orden:", error)
    return null
  }
}

// Añadir proceso de reparación a orden
export const addRepairProcess = async (orderId: string, process: Omit<RepairProcess, "id">): Promise<Order | null> => {
  try {
    const orders = await getAllOrders()
    const index = orders.findIndex((order) => order.id === orderId)

    if (index === -1) return null

    const newProcess: RepairProcess = {
      ...process,
      id: Date.now().toString(),
    }

    const updatedOrder = {
      ...orders[index],
      repairProcesses: [...orders[index].repairProcesses, newProcess],
      dates: {
        ...orders[index].dates,
        updated: new Date().toISOString(),
      },
    }

    orders[index] = updatedOrder
    await AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders))
    return updatedOrder
  } catch (error) {
    console.error("Error al añadir proceso de reparación a orden:", error)
    return null
  }
}

// Actualizar proceso de reparación
export const updateRepairProcess = async (
  orderId: string,
  processId: string,
  updates: Partial<RepairProcess>,
): Promise<Order | null> => {
  try {
    const orders = await getAllOrders()
    const orderIndex = orders.findIndex((order) => order.id === orderId)

    if (orderIndex === -1) return null

    const processIndex = orders[orderIndex].repairProcesses.findIndex((process) => process.id === processId)

    if (processIndex === -1) return null

    const updatedProcesses = [...orders[orderIndex].repairProcesses]
    updatedProcesses[processIndex] = {
      ...updatedProcesses[processIndex],
      ...updates,
    }

    const updatedOrder = {
      ...orders[orderIndex],
      repairProcesses: updatedProcesses,
      dates: {
        ...orders[orderIndex].dates,
        updated: new Date().toISOString(),
      },
    }

    orders[orderIndex] = updatedOrder
    await AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders))
    return updatedOrder
  } catch (error) {
    console.error("Error al actualizar proceso de reparación:", error)
    return null
  }
}

// Actualizar estado de pago
export const updatePaymentStatus = async (
  orderId: string,
  paymentStatus: PaymentStatus,
  paymentMethod?: string,
  paymentNotes?: string,
): Promise<Order | null> => {
  try {
    const orders = await getAllOrders()
    const index = orders.findIndex((order) => order.id === orderId)

    if (index === -1) return null

    const updatedOrder = {
      ...orders[index],
      paymentStatus,
      ...(paymentMethod ? { paymentMethod } : {}),
      ...(paymentNotes ? { paymentNotes } : {}),
      dates: {
        ...orders[index].dates,
        updated: new Date().toISOString(),
      },
    }

    orders[index] = updatedOrder
    await AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders))
    return updatedOrder
  } catch (error) {
    console.error("Error al actualizar estado de pago:", error)
    return null
  }
}

// Eliminar orden
export const deleteOrder = async (id: string): Promise<boolean> => {
  try {
    const orders = await getAllOrders()
    const filteredOrders = orders.filter((order) => order.id !== id)

    if (filteredOrders.length === orders.length) return false

    await AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(filteredOrders))
    return true
  } catch (error) {
    console.error("Error al eliminar orden:", error)
    return false
  }
}

// Buscar órdenes
export const searchOrders = async (query: string): Promise<Order[]> => {
  try {
    const orders = await getAllOrders()
    const lowerQuery = query.toLowerCase()

    return orders.filter(
      (order) =>
        order.number.toLowerCase().includes(lowerQuery) ||
        order.description.toLowerCase().includes(lowerQuery) ||
        (order.diagnosis && order.diagnosis.toLowerCase().includes(lowerQuery)),
    )
  } catch (error) {
    console.error("Error al buscar órdenes:", error)
    return []
  }
}
