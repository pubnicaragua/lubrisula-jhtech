import AsyncStorage from "@react-native-async-storage/async-storage"
import type { Currency } from "../types/inventory"

// Definir tipos
export type InventoryItem = {
  id: string
  name: string
  sku: string
  category: string
  subcategory?: string
  description?: string
  stock: number
  minStock?: number
  maxStock?: number
  priceUSD: number
  priceHNL: number
  cost?: number
  supplier?: string
  location?: string
  unit?: string
  images?: string[]
  createdAt: string
  updatedAt: string
}

export type Service = {
  id: string
  name: string
  sku: string
  category: string
  description?: string
  duration?: number
  priceUSD: number
  priceHNL: number
  createdAt: string
  updatedAt: string
}

export type InventoryFilter = {
  searchTerm?: string
  category?: string
  supplier?: string
  inStock?: boolean
  lowStock?: boolean
  sortBy?: "name" | "sku" | "stock" | "price"
  sortOrder?: "asc" | "desc"
}

export type ServiceFilter = {
  searchTerm?: string
  category?: string
  sortBy?: "name" | "sku" | "price"
  sortOrder?: "asc" | "desc"
}

// Claves para almacenamiento
const INVENTORY_STORAGE_KEY = "inventoryItems"
const SERVICES_STORAGE_KEY = "services"

// Datos iniciales de inventario
const initialInventoryItems: InventoryItem[] = [
  {
    id: "1",
    name: "Aceite de Motor Sintético 5W-30",
    sku: "OIL-5W30-1L",
    category: "Lubricantes",
    subcategory: "Aceites de Motor",
    description: "Aceite sintético de alta calidad para motores modernos",
    stock: 25,
    minStock: 10,
    maxStock: 50,
    priceUSD: 12.99,
    priceHNL: 318.26,
    cost: 8.5,
    supplier: "AutoParts Inc.",
    location: "Estante A1",
    unit: "litros",
    createdAt: "2025-01-15T10:30:00Z",
    updatedAt: "2025-04-10T14:20:00Z",
  },
  {
    id: "2",
    name: "Filtro de Aceite Premium",
    sku: "FIL-OIL-P01",
    category: "Filtros",
    subcategory: "Filtros de Aceite",
    description: "Filtro de aceite de alta eficiencia para vehículos de pasajeros",
    stock: 42,
    minStock: 15,
    priceUSD: 8.99,
    priceHNL: 220.26,
    supplier: "FilterTech",
    location: "Estante B3",
    unit: "unidades",
    createdAt: "2025-01-20T11:45:00Z",
    updatedAt: "2025-04-05T09:30:00Z",
  },
  {
    id: "3",
    name: "Pastillas de Freno Delanteras",
    sku: "BRK-PAD-F01",
    category: "Frenos",
    subcategory: "Pastillas",
    description: "Pastillas de freno cerámicas para mayor durabilidad y menor ruido",
    stock: 8,
    minStock: 10,
    maxStock: 30,
    priceUSD: 45.99,
    priceHNL: 1126.76,
    cost: 32.5,
    supplier: "BrakeMasters",
    location: "Estante C2",
    unit: "juegos",
    createdAt: "2025-02-05T09:15:00Z",
    updatedAt: "2025-04-12T16:20:00Z",
  },
  {
    id: "4",
    name: "Batería 12V 60Ah",
    sku: "BAT-12V-60A",
    category: "Eléctrico",
    subcategory: "Baterías",
    description: "Batería de alto rendimiento con garantía de 3 años",
    stock: 15,
    minStock: 5,
    priceUSD: 89.99,
    priceHNL: 2204.76,
    supplier: "PowerCell",
    location: "Área D1",
    unit: "unidades",
    createdAt: "2025-02-10T14:30:00Z",
    updatedAt: "2025-04-15T10:45:00Z",
  },
  {
    id: "5",
    name: "Líquido de Frenos DOT 4",
    sku: "BRK-FLD-D4",
    category: "Líquidos",
    subcategory: "Líquidos de Freno",
    description: "Líquido de frenos de alto punto de ebullición para condiciones exigentes",
    stock: 30,
    minStock: 12,
    priceUSD: 9.99,
    priceHNL: 244.76,
    supplier: "ChemTech",
    location: "Estante A4",
    unit: "litros",
    createdAt: "2025-02-15T13:20:00Z",
    updatedAt: "2025-04-20T11:10:00Z",
  },
  {
    id: "6",
    name: "Filtro de Aire",
    sku: "FIL-AIR-01",
    category: "Filtros",
    subcategory: "Filtros de Aire",
    description: "Filtro de aire de alta eficiencia para mejor rendimiento del motor",
    stock: 28,
    minStock: 10,
    priceUSD: 14.99,
    priceHNL: 367.26,
    supplier: "FilterTech",
    location: "Estante B2",
    unit: "unidades",
    createdAt: "2025-02-20T10:15:00Z",
    updatedAt: "2025-04-25T14:30:00Z",
  },
  {
    id: "7",
    name: "Bujías de Iridio",
    sku: "SPK-IR-01",
    category: "Encendido",
    subcategory: "Bujías",
    description: "Bujías de iridio para mejor eficiencia de combustible y rendimiento",
    stock: 40,
    minStock: 16,
    priceUSD: 12.99,
    priceHNL: 318.26,
    supplier: "SparkTech",
    location: "Estante E1",
    unit: "unidades",
    createdAt: "2025-03-01T09:45:00Z",
    updatedAt: "2025-04-30T15:20:00Z",
  },
  {
    id: "8",
    name: "Refrigerante Concentrado",
    sku: "CLT-CON-01",
    category: "Líquidos",
    subcategory: "Refrigerantes",
    description: "Refrigerante concentrado para protección contra congelamiento y sobrecalentamiento",
    stock: 18,
    minStock: 8,
    priceUSD: 11.99,
    priceHNL: 293.76,
    supplier: "ChemTech",
    location: "Estante A3",
    unit: "litros",
    createdAt: "2025-03-05T11:30:00Z",
    updatedAt: "2025-05-05T10:15:00Z",
  },
  {
    id: "9",
    name: "Amortiguadores Delanteros",
    sku: "SUS-SHK-F01",
    category: "Suspensión",
    subcategory: "Amortiguadores",
    description: "Amortiguadores de gas para mayor confort y estabilidad",
    stock: 6,
    minStock: 4,
    priceUSD: 79.99,
    priceHNL: 1959.76,
    supplier: "SuspensionPro",
    location: "Área F2",
    unit: "pares",
    createdAt: "2025-03-10T14:15:00Z",
    updatedAt: "2025-05-10T09:30:00Z",
  },
  {
    id: "10",
    name: "Kit de Embrague",
    sku: "CLT-KIT-01",
    category: "Transmisión",
    subcategory: "Embragues",
    description: "Kit completo de embrague con disco, plato y rodamiento",
    stock: 5,
    minStock: 3,
    priceUSD: 149.99,
    priceHNL: 3674.76,
    supplier: "TransTech",
    location: "Área G1",
    unit: "kits",
    createdAt: "2025-03-15T10:45:00Z",
    updatedAt: "2025-05-15T13:20:00Z",
  },
]

// Datos iniciales de servicios
const initialServices: Service[] = [
  {
    id: "1",
    name: "Cambio de Aceite y Filtro",
    sku: "SRV-OIL-01",
    category: "Mantenimiento Preventivo",
    description: "Cambio de aceite y filtro con revisión de niveles",
    duration: 30,
    priceUSD: 35.99,
    priceHNL: 881.76,
    createdAt: "2025-01-10T09:30:00Z",
    updatedAt: "2025-04-05T11:20:00Z",
  },
  {
    id: "2",
    name: "Alineación y Balanceo",
    sku: "SRV-ALN-01",
    category: "Alineación y Suspensión",
    description: "Alineación computarizada de 4 ruedas y balanceo",
    duration: 60,
    priceUSD: 49.99,
    priceHNL: 1224.76,
    createdAt: "2025-01-15T10:45:00Z",
    updatedAt: "2025-04-10T14:30:00Z",
  },
  {
    id: "3",
    name: "Diagnóstico Computarizado",
    sku: "SRV-DIAG-01",
    category: "Diagnóstico",
    description: "Diagnóstico completo con escáner de última generación",
    duration: 45,
    priceUSD: 39.99,
    priceHNL: 979.76,
    createdAt: "2025-01-20T11:15:00Z",
    updatedAt: "2025-04-15T09:45:00Z",
  },
  {
    id: "4",
    name: "Cambio de Pastillas de Freno",
    sku: "SRV-BRK-01",
    category: "Frenos",
    description: "Cambio de pastillas de freno delanteras o traseras",
    duration: 60,
    priceUSD: 65.99,
    priceHNL: 1616.76,
    createdAt: "2025-01-25T14:30:00Z",
    updatedAt: "2025-04-20T13:20:00Z",
  },
  {
    id: "5",
    name: "Cambio de Batería",
    sku: "SRV-BAT-01",
    category: "Eléctrico",
    description: "Cambio de batería con prueba del sistema de carga",
    duration: 30,
    priceUSD: 25.99,
    priceHNL: 636.76,
    createdAt: "2025-02-01T09:45:00Z",
    updatedAt: "2025-04-25T10:30:00Z",
  },
  {
    id: "6",
    name: "Cambio de Bujías",
    sku: "SRV-SPK-01",
    category: "Encendido",
    description: "Cambio de bujías con ajuste de tiempo",
    duration: 45,
    priceUSD: 45.99,
    priceHNL: 1126.76,
    createdAt: "2025-02-05T11:30:00Z",
    updatedAt: "2025-04-30T15:45:00Z",
  },
  {
    id: "7",
    name: "Servicio de Aire Acondicionado",
    sku: "SRV-AC-01",
    category: "Climatización",
    description: "Recarga de gas y diagnóstico del sistema de A/C",
    duration: 90,
    priceUSD: 89.99,
    priceHNL: 2204.76,
    createdAt: "2025-02-10T13:15:00Z",
    updatedAt: "2025-05-05T11:20:00Z",
  },
  {
    id: "8",
    name: "Cambio de Amortiguadores",
    sku: "SRV-SUS-01",
    category: "Suspensión",
    description: "Cambio de amortiguadores delanteros o traseros",
    duration: 120,
    priceUSD: 129.99,
    priceHNL: 3184.76,
    createdAt: "2025-02-15T10:30:00Z",
    updatedAt: "2025-05-10T14:15:00Z",
  },
  {
    id: "9",
    name: "Cambio de Correa de Distribución",
    sku: "SRV-TIM-01",
    category: "Motor",
    description: "Cambio de kit de distribución completo",
    duration: 180,
    priceUSD: 249.99,
    priceHNL: 6124.76,
    createdAt: "2025-02-20T09:45:00Z",
    updatedAt: "2025-05-15T13:30:00Z",
  },
  {
    id: "10",
    name: "Limpieza de Inyectores",
    sku: "SRV-INJ-01",
    category: "Motor",
    description: "Limpieza de inyectores por ultrasonido",
    duration: 60,
    priceUSD: 69.99,
    priceHNL: 1714.76,
    createdAt: "2025-02-25T11:15:00Z",
    updatedAt: "2025-05-20T10:45:00Z",
  },
]

// Inicializar datos
export const initializeInventory = async (): Promise<void> => {
  try {
    const storedItems = await AsyncStorage.getItem(INVENTORY_STORAGE_KEY)
    if (storedItems === null) {
      await AsyncStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(initialInventoryItems))
    }

    const storedServices = await AsyncStorage.getItem(SERVICES_STORAGE_KEY)
    if (storedServices === null) {
      await AsyncStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(initialServices))
    }
  } catch (error) {
    console.error("Error al inicializar inventario:", error)
  }
}

// Obtener todos los artículos de inventario
export const getInventoryItems = async (filter?: InventoryFilter): Promise<InventoryItem[]> => {
  try {
    const storedItems = await AsyncStorage.getItem(INVENTORY_STORAGE_KEY)
    let items: InventoryItem[] = storedItems ? JSON.parse(storedItems) : []

    if (!filter) return items

    // Aplicar filtros
    if (filter.searchTerm) {
      const searchTerm = filter.searchTerm.toLowerCase()
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm) ||
          item.sku.toLowerCase().includes(searchTerm) ||
          (item.description && item.description.toLowerCase().includes(searchTerm)),
      )
    }

    if (filter.category) {
      items = items.filter((item) => item.category === filter.category)
    }

    if (filter.supplier) {
      items = items.filter((item) => item.supplier === filter.supplier)
    }

    if (filter.inStock) {
      items = items.filter((item) => item.stock > 0)
    }

    if (filter.lowStock) {
      items = items.filter((item) => item.minStock !== undefined && item.stock <= item.minStock)
    }

    // Aplicar ordenamiento
    if (filter.sortBy) {
      items.sort((a, b) => {
        let valueA, valueB

        switch (filter.sortBy) {
          case "name":
            valueA = a.name
            valueB = b.name
            break
          case "sku":
            valueA = a.sku
            valueB = b.sku
            break
          case "stock":
            valueA = a.stock
            valueB = b.stock
            break
          case "price":
            valueA = a.priceUSD
            valueB = b.priceUSD
            break
          default:
            return 0
        }

        if (valueA < valueB) return filter.sortOrder === "asc" ? -1 : 1
        if (valueA > valueB) return filter.sortOrder === "asc" ? 1 : -1
        return 0
      })
    }

    return items
  } catch (error) {
    console.error("Error al obtener artículos de inventario:", error)
    return []
  }
}

// Obtener artículos con stock bajo
export const getLowStockItems = async (): Promise<InventoryItem[]> => {
  try {
    const items = await getInventoryItems()
    return items.filter((item) => item.minStock !== undefined && item.stock <= item.minStock)
  } catch (error) {
    console.error("Error al obtener artículos con stock bajo:", error)
    return []
  }
}

// Obtener artículo por ID
export const getInventoryItemById = async (id: string): Promise<InventoryItem | null> => {
  try {
    const items = await getInventoryItems()
    return items.find((item) => item.id === id) || null
  } catch (error) {
    console.error("Error al obtener artículo por ID:", error)
    return null
  }
}

// Crear nuevo artículo
export const createInventoryItem = async (
  item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">,
): Promise<InventoryItem> => {
  try {
    const items = await getInventoryItems()
    const now = new Date().toISOString()
    const newItem: InventoryItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now,
    }

    await AsyncStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify([...items, newItem]))
    return newItem
  } catch (error) {
    console.error("Error al crear artículo:", error)
    throw error
  }
}

// Actualizar artículo
export const updateInventoryItem = async (
  id: string,
  updates: Partial<InventoryItem>,
): Promise<InventoryItem | null> => {
  try {
    const items = await getInventoryItems()
    const index = items.findIndex((item) => item.id === id)

    if (index === -1) return null

    const updatedItem = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    items[index] = updatedItem

    await AsyncStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(items))
    return updatedItem
  } catch (error) {
    console.error("Error al actualizar artículo:", error)
    return null
  }
}

// Eliminar artículo
export const deleteInventoryItem = async (id: string): Promise<boolean> => {
  try {
    const items = await getInventoryItems()
    const filteredItems = items.filter((item) => item.id !== id)

    if (filteredItems.length === items.length) return false

    await AsyncStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(filteredItems))
    return true
  } catch (error) {
    console.error("Error al eliminar artículo:", error)
    return false
  }
}

// Obtener todos los servicios
export const getServices = async (filter?: ServiceFilter): Promise<Service[]> => {
  try {
    const storedServices = await AsyncStorage.getItem(SERVICES_STORAGE_KEY)
    let services: Service[] = storedServices ? JSON.parse(storedServices) : []

    if (!filter) return services

    // Aplicar filtros
    if (filter.searchTerm) {
      const searchTerm = filter.searchTerm.toLowerCase()
      services = services.filter(
        (service) =>
          service.name.toLowerCase().includes(searchTerm) ||
          service.sku.toLowerCase().includes(searchTerm) ||
          (service.description && service.description.toLowerCase().includes(searchTerm)),
      )
    }

    if (filter.category) {
      services = services.filter((service) => service.category === filter.category)
    }

    // Aplicar ordenamiento
    if (filter.sortBy) {
      services.sort((a, b) => {
        let valueA, valueB

        switch (filter.sortBy) {
          case "name":
            valueA = a.name
            valueB = b.name
            break
          case "sku":
            valueA = a.sku
            valueB = b.sku
            break
          case "price":
            valueA = a.priceUSD
            valueB = b.priceUSD
            break
          default:
            return 0
        }

        if (valueA < valueB) return filter.sortOrder === "asc" ? -1 : 1
        if (valueA > valueB) return filter.sortOrder === "asc" ? 1 : -1
        return 0
      })
    }

    return services
  } catch (error) {
    console.error("Error al obtener servicios:", error)
    return []
  }
}

// Obtener servicio por ID
export const getServiceById = async (id: string): Promise<Service | null> => {
  try {
    const services = await getServices()
    return services.find((service) => service.id === id) || null
  } catch (error) {
    console.error("Error al obtener servicio por ID:", error)
    return null
  }
}

// Crear nuevo servicio
export const createService = async (service: Omit<Service, "id" | "createdAt" | "updatedAt">): Promise<Service> => {
  try {
    const services = await getServices()
    const now = new Date().toISOString()
    const newService: Service = {
      ...service,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now,
    }

    await AsyncStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify([...services, newService]))
    return newService
  } catch (error) {
    console.error("Error al crear servicio:", error)
    throw error
  }
}

// Actualizar servicio
export const updateService = async (id: string, updates: Partial<Service>): Promise<Service | null> => {
  try {
    const services = await getServices()
    const index = services.findIndex((service) => service.id === id)

    if (index === -1) return null

    const updatedService = {
      ...services[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    services[index] = updatedService

    await AsyncStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(services))
    return updatedService
  } catch (error) {
    console.error("Error al actualizar servicio:", error)
    return null
  }
}

// Eliminar servicio
export const deleteService = async (id: string): Promise<boolean> => {
  try {
    const services = await getServices()
    const filteredServices = services.filter((service) => service.id !== id)

    if (filteredServices.length === services.length) return false

    await AsyncStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(filteredServices))
    return true
  } catch (error) {
    console.error("Error al eliminar servicio:", error)
    return false
  }
}

// Obtener categorías únicas
export const getUniqueCategories = async (): Promise<string[]> => {
  try {
    const items = await getInventoryItems()
    const categories = new Set(items.map((item) => item.category))
    return Array.from(categories)
  } catch (error) {
    console.error("Error al obtener categorías únicas:", error)
    return []
  }
}

// Obtener proveedores únicos
export const getUniqueSuppliers = async (): Promise<string[]> => {
  try {
    const items = await getInventoryItems()
    const suppliers = new Set(items.filter((item) => item.supplier).map((item) => item.supplier as string))
    return Array.from(suppliers)
  } catch (error) {
    console.error("Error al obtener proveedores únicos:", error)
    return []
  }
}

// Obtener categorías de servicios únicas
export const getUniqueServiceCategories = async (): Promise<string[]> => {
  try {
    const services = await getServices()
    const categories = new Set(services.map((service) => service.category))
    return Array.from(categories)
  } catch (error) {
    console.error("Error al obtener categorías de servicios únicas:", error)
    return []
  }
}

// Obtener precio de artículo
export const getItemPrice = async (itemId: string, currency: Currency): Promise<number | null> => {
  try {
    const item = await getInventoryItemById(itemId)
    if (!item) return null

    return currency === "USD" ? item.priceUSD : item.priceHNL
  } catch (error) {
    console.error("Error al obtener precio de artículo:", error)
    return null
  }
}

// Obtener precio de servicio
export const getServicePrice = async (serviceId: string, currency: Currency): Promise<number | null> => {
  try {
    const service = await getServiceById(serviceId)
    if (!service) return null

    return currency === "USD" ? service.priceUSD : service.priceHNL
  } catch (error) {
    console.error("Error al obtener precio de servicio:", error)
    return null
  }
}
