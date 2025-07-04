import AsyncStorage from "@react-native-async-storage/async-storage"
import type { AppImage } from "../types"

// Definir tipos
export type Client = {
  id: string
  name: string
  email: string
  phone: string
  address?: string
  city?: string
  country?: string
  taxId?: string
  notes?: string
  profileImage?: AppImage
  createdAt: string
  updatedAt?: string
  userId?: string
  insuranceInfo?: {
    company?: string
    policyNumber?: string
    expirationDate?: string
    contactPerson?: string
    contactPhone?: string
  }
}

// Clave para almacenamiento
const CLIENTS_STORAGE_KEY = "clients"

// Datos iniciales de clientes
const initialClients: Client[] = [
  {
    id: "1",
    name: "Carlos Rodríguez",
    email: "cliente1@gmail.com",
    phone: "555-123-4567",
    address: "Av. Principal 123, Ciudad",
    city: "San José",
    country: "Costa Rica",
    taxId: "123456789",
    notes: "Cliente frecuente. Prefiere ser contactado por WhatsApp.",
    createdAt: "2025-03-15T10:30:00Z",
    updatedAt: "2025-04-10T14:20:00Z",
    userId: "1",
    insuranceInfo: {
      company: "Seguros Bolívar",
      policyNumber: "POL-2025-CR-78945",
      expirationDate: "2026-03-15",
      contactPerson: "María Jiménez",
      contactPhone: "555-987-6543",
    },
  },
  {
    id: "2",
    name: "María González",
    email: "maria@example.com",
    phone: "555-987-6543",
    address: "Calle Secundaria 456, Ciudad",
    city: "Guatemala",
    country: "Guatemala",
    createdAt: "2025-03-20T14:45:00Z",
    updatedAt: "2025-04-05T09:30:00Z",
    insuranceInfo: {
      company: "Aseguradora General",
      policyNumber: "POL-2025-GT-12345",
      expirationDate: "2025-12-31",
    },
  },
  {
    id: "3",
    name: "José Martínez",
    email: "jose@example.com",
    phone: "555-567-8901",
    address: "Plaza Central 789, Ciudad",
    city: "Tegucigalpa",
    country: "Honduras",
    taxId: "HN-987654321",
    notes: "Tiene varios vehículos registrados para su negocio.",
    createdAt: "2025-04-05T09:15:00Z",
    insuranceInfo: {
      company: "Seguros Atlántida",
      policyNumber: "POL-2025-HN-56789",
      expirationDate: "2026-01-15",
      contactPerson: "Roberto Flores",
      contactPhone: "555-111-2222",
    },
  },
  {
    id: "4",
    name: "Ana López",
    email: "ana@example.com",
    phone: "555-234-5678",
    address: "Avenida Norte 321, Ciudad",
    city: "Managua",
    country: "Nicaragua",
    createdAt: "2025-04-12T16:20:00Z",
    updatedAt: "2025-04-30T11:45:00Z",
  },
  {
    id: "5",
    name: "Roberto Sánchez",
    email: "roberto@example.com",
    phone: "555-876-5432",
    address: "Calle Sur 654, Ciudad",
    city: "San Salvador",
    country: "El Salvador",
    taxId: "SV-123456",
    notes: "Cliente corporativo. Requiere factura con NIT.",
    createdAt: "2025-05-01T11:10:00Z",
    insuranceInfo: {
      company: "ASESUISA",
      policyNumber: "POL-2025-SV-34567",
      expirationDate: "2025-11-30",
    },
  },
  {
    id: "6",
    name: "Laura Mendoza",
    email: "laura@example.com",
    phone: "555-345-6789",
    address: "Boulevard Los Próceres 123",
    city: "Ciudad de Panamá",
    country: "Panamá",
    createdAt: "2025-03-25T13:40:00Z",
    updatedAt: "2025-04-15T10:20:00Z",
    insuranceInfo: {
      company: "ASSA Seguros",
      policyNumber: "POL-2025-PA-67890",
      expirationDate: "2026-02-28",
    },
  },
  {
    id: "7",
    name: "Miguel Herrera",
    email: "miguel@example.com",
    phone: "555-456-7890",
    address: "Zona 10, Calle Principal 456",
    city: "Belmopán",
    country: "Belice",
    taxId: "BZ-789012",
    notes: "Habla principalmente inglés.",
    createdAt: "2025-04-08T09:50:00Z",
    insuranceInfo: {
      company: "RF&G Insurance",
      policyNumber: "POL-2025-BZ-45678",
      expirationDate: "2025-10-15",
    },
  },
  {
    id: "8",
    name: "Patricia Vargas",
    email: "patricia@example.com",
    phone: "555-567-8901",
    address: "Barrio Escalante, Calle 35",
    city: "San José",
    country: "Costa Rica",
    createdAt: "2025-04-20T15:30:00Z",
    updatedAt: "2025-05-05T14:10:00Z",
  },
  {
    id: "9",
    name: "Fernando Gutiérrez",
    email: "fernando@example.com",
    phone: "555-678-9012",
    address: "Zona Viva, Edificio Torre Norte",
    city: "Guatemala",
    country: "Guatemala",
    taxId: "GT-345678",
    notes: "Empresario con flota de vehículos comerciales.",
    createdAt: "2025-03-10T11:25:00Z",
    insuranceInfo: {
      company: "Seguros G&T",
      policyNumber: "POL-2025-GT-23456",
      expirationDate: "2025-09-30",
      contactPerson: "Claudia Morales",
      contactPhone: "555-333-4444",
    },
  },
  {
    id: "10",
    name: "Carmen Díaz",
    email: "carmen@example.com",
    phone: "555-789-0123",
    address: "Colonia Palmira, Calle Principal",
    city: "Tegucigalpa",
    country: "Honduras",
    createdAt: "2025-05-03T10:15:00Z",
    updatedAt: "2025-05-10T09:40:00Z",
  },
]

// Inicializar datos
export const initializeClients = async (): Promise<Client[]> => {
  try {
    const storedClients = await AsyncStorage.getItem(CLIENTS_STORAGE_KEY)
    if (storedClients === null) {
      await AsyncStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(initialClients))
      return initialClients
    }
    return JSON.parse(storedClients)
  } catch (error) {
    console.error("Error al inicializar clientes:", error)
    return initialClients
  }
}

// Obtener todos los clientes
export const getAllClients = async (): Promise<Client[]> => {
  try {
    const storedClients = await AsyncStorage.getItem(CLIENTS_STORAGE_KEY)
    return storedClients ? JSON.parse(storedClients) : []
  } catch (error) {
    console.error("Error al obtener clientes:", error)
    return []
  }
}

// Obtener cliente por ID
export const getClientById = async (id: string): Promise<Client | null> => {
  try {
    const clients = await getAllClients()
    return clients.find((client) => client.id === id) || null
  } catch (error) {
    console.error("Error al obtener cliente por ID:", error)
    return null
  }
}

// Obtener cliente por ID de usuario
export const getClientByUserId = async (userId: string): Promise<Client | null> => {
  try {
    const clients = await getAllClients()
    return clients.find((client) => client.userId === userId) || null
  } catch (error) {
    console.error("Error al obtener cliente por ID de usuario:", error)
    return null
  }
}

// Crear nuevo cliente
export const createClient = async (client: Omit<Client, "id" | "createdAt">): Promise<Client> => {
  try {
    const clients = await getAllClients()
    const newClient: Client = {
      ...client,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }

    await AsyncStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify([...clients, newClient]))
    return newClient
  } catch (error) {
    console.error("Error al crear cliente:", error)
    throw error
  }
}

// Actualizar cliente
export const updateClient = async (id: string, updates: Partial<Client>): Promise<Client | null> => {
  try {
    const clients = await getAllClients()
    const index = clients.findIndex((client) => client.id === id)

    if (index === -1) return null

    const updatedClient = {
      ...clients[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    clients[index] = updatedClient

    await AsyncStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients))
    return updatedClient
  } catch (error) {
    console.error("Error al actualizar cliente:", error)
    return null
  }
}

// Eliminar cliente
export const deleteClient = async (id: string): Promise<boolean> => {
  try {
    const clients = await getAllClients()
    const filteredClients = clients.filter((client) => client.id !== id)

    if (filteredClients.length === clients.length) return false

    await AsyncStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(filteredClients))
    return true
  } catch (error) {
    console.error("Error al eliminar cliente:", error)
    return false
  }
}

// Buscar clientes
export const searchClients = async (query: string): Promise<Client[]> => {
  try {
    const clients = await getAllClients()
    const lowerQuery = query.toLowerCase()

    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(lowerQuery) ||
        client.email.toLowerCase().includes(lowerQuery) ||
        client.phone.includes(query) ||
        (client.address && client.address.toLowerCase().includes(lowerQuery)) ||
        (client.city && client.city.toLowerCase().includes(lowerQuery)) ||
        (client.country && client.country.toLowerCase().includes(lowerQuery)),
    )
  } catch (error) {
    console.error("Error al buscar clientes:", error)
    return []
  }
}
