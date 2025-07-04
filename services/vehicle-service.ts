import AsyncStorage from "@react-native-async-storage/async-storage"
import type { AppImage } from "../types"

// Definir tipos
export type Vehicle = {
  id: string
  clientId: string
  make: string
  model: string
  year: string
  vin?: string
  licensePlate: string
  color?: string
  mileage?: number
  fuelType?: "gasoline" | "diesel" | "electric" | "hybrid" | "other"
  transmission?: "manual" | "automatic" | "cvt" | "other"
  engineSize?: string
  images: AppImage[]
  notes?: string
  createdAt: string
  updatedAt?: string
  lastServiceDate?: string
  nextServiceDate?: string
  serviceHistory?: {
    date: string
    mileage: number
    description: string
    cost: number
  }[]
}

// Clave para almacenamiento
const VEHICLES_STORAGE_KEY = "vehicles"

// Datos iniciales de vehículos con imágenes de ejemplo
const initialVehicles: Vehicle[] = [
  {
    id: "1",
    clientId: "1",
    make: "Toyota",
    model: "Corolla",
    year: "2023",
    vin: "1HGCM82633A123456",
    licensePlate: "ABC-123",
    color: "Blanco",
    mileage: 15000,
    fuelType: "gasoline",
    transmission: "automatic",
    engineSize: "1.8L",
    images: [
      {
        id: "v1-img1",
        uri: "https://example.com/vehicle1-1.jpg", // Estas URLs serán reemplazadas por imágenes locales
        type: "vehicle",
        description: "Vista frontal",
        createdAt: "2025-03-18T09:35:00Z",
      },
      {
        id: "v1-img2",
        uri: "https://example.com/vehicle1-2.jpg",
        type: "vehicle",
        description: "Vista lateral",
        createdAt: "2025-03-18T09:36:00Z",
      },
    ],
    notes: "Vehículo en excelentes condiciones. Mantenimiento al día.",
    createdAt: "2025-03-18T09:30:00Z",
    updatedAt: "2025-04-10T14:30:00Z",
    lastServiceDate: "2025-03-20T10:15:00Z",
    nextServiceDate: "2025-06-20T00:00:00Z",
    serviceHistory: [
      {
        date: "2025-03-20T10:15:00Z",
        mileage: 15000,
        description: "Cambio de aceite y filtros",
        cost: 153.12,
      },
    ],
  },
  {
    id: "2",
    clientId: "1",
    make: "Honda",
    model: "Civic",
    year: "2022",
    vin: "2HGFG12567H789012",
    licensePlate: "XYZ-789",
    color: "Azul",
    mileage: 22000,
    fuelType: "gasoline",
    transmission: "cvt",
    engineSize: "2.0L",
    images: [
      {
        id: "v2-img1",
        uri: "https://example.com/vehicle2-1.jpg",
        type: "vehicle",
        description: "Vista frontal",
        createdAt: "2025-04-02T14:20:00Z",
      },
      {
        id: "v2-img2",
        uri: "https://example.com/vehicle2-2.jpg",
        type: "damage",
        description: "Rayón en puerta delantera derecha",
        createdAt: "2025-04-02T14:22:00Z",
      },
    ],
    createdAt: "2025-04-02T14:15:00Z",
    lastServiceDate: "2025-04-05T09:30:00Z",
    serviceHistory: [
      {
        date: "2025-04-05T09:30:00Z",
        mileage: 22000,
        description: "Revisión de frenos y suspensión",
        cost: 146.84,
      },
    ],
  },
  {
    id: "3",
    clientId: "2",
    make: "Ford",
    model: "Escape",
    year: "2024",
    vin: "1FMCU0F70EUA12345",
    licensePlate: "DEF-456",
    color: "Rojo",
    mileage: 8000,
    fuelType: "hybrid",
    transmission: "automatic",
    engineSize: "2.5L",
    images: [],
    notes: "SUV híbrido. Cliente reporta ruido en suspensión delantera.",
    createdAt: "2025-03-25T11:45:00Z",
    updatedAt: "2025-04-10T09:20:00Z",
  },
  {
    id: "4",
    clientId: "3",
    make: "Chevrolet",
    model: "Equinox",
    year: "2023",
    vin: "3GNFK16377G123456",
    licensePlate: "GHI-789",
    color: "Negro",
    mileage: 18500,
    fuelType: "gasoline",
    transmission: "automatic",
    engineSize: "1.5L Turbo",
    images: [],
    createdAt: "2025-04-10T10:20:00Z",
    lastServiceDate: "2025-04-15T11:20:00Z",
    serviceHistory: [
      {
        date: "2025-04-15T11:20:00Z",
        mileage: 18500,
        description: "Reparación de sistema de aire acondicionado",
        cost: 442.75,
      },
    ],
  },
  {
    id: "5",
    clientId: "4",
    make: "Nissan",
    model: "Sentra",
    year: "2022",
    vin: "3N1AB7AP7JL123456",
    licensePlate: "JKL-012",
    color: "Gris",
    mileage: 25000,
    fuelType: "gasoline",
    transmission: "cvt",
    engineSize: "1.8L",
    images: [],
    createdAt: "2025-05-05T13:30:00Z",
    lastServiceDate: "2025-05-10T10:00:00Z",
  },
  {
    id: "6",
    clientId: "5",
    make: "Hyundai",
    model: "Tucson",
    year: "2023",
    vin: "KM8J3CA46PU123456",
    licensePlate: "MNO-345",
    color: "Verde",
    mileage: 12000,
    fuelType: "gasoline",
    transmission: "automatic",
    engineSize: "2.0L",
    images: [],
    notes: "SUV familiar. Cliente reporta consumo excesivo de combustible.",
    createdAt: "2025-03-30T09:45:00Z",
    updatedAt: "2025-04-25T14:10:00Z",
  },
  {
    id: "7",
    clientId: "6",
    make: "Kia",
    model: "Sportage",
    year: "2024",
    vin: "KNDPM3AC8P7123456",
    licensePlate: "PQR-678",
    color: "Plata",
    mileage: 5000,
    fuelType: "hybrid",
    transmission: "automatic",
    engineSize: "1.6L Turbo",
    images: [],
    createdAt: "2025-04-15T11:30:00Z",
  },
  {
    id: "8",
    clientId: "7",
    make: "Mazda",
    model: "CX-5",
    year: "2023",
    vin: "JM3KE4DY0D0123456",
    licensePlate: "STU-901",
    color: "Rojo",
    mileage: 15000,
    fuelType: "gasoline",
    transmission: "automatic",
    engineSize: "2.5L",
    images: [],
    notes: "SUV en excelentes condiciones. Cliente muy exigente con la limpieza.",
    createdAt: "2025-04-05T10:15:00Z",
    updatedAt: "2025-05-01T09:30:00Z",
  },
  {
    id: "9",
    clientId: "8",
    make: "Volkswagen",
    model: "Tiguan",
    year: "2022",
    vin: "WVGBV7AX5M1234567",
    licensePlate: "VWX-234",
    color: "Azul",
    mileage: 28000,
    fuelType: "gasoline",
    transmission: "automatic",
    engineSize: "2.0L Turbo",
    images: [],
    createdAt: "2025-03-22T13:40:00Z",
    lastServiceDate: "2025-04-10T11:15:00Z",
    serviceHistory: [
      {
        date: "2025-04-10T11:15:00Z",
        mileage: 28000,
        description: "Cambio de aceite y revisión general",
        cost: 175.5,
      },
    ],
  },
  {
    id: "10",
    clientId: "9",
    make: "Mitsubishi",
    model: "Outlander",
    year: "2023",
    vin: "JA4AZ3A30PZ123456",
    licensePlate: "YZA-567",
    color: "Negro",
    mileage: 10000,
    fuelType: "hybrid",
    transmission: "cvt",
    engineSize: "2.4L",
    images: [],
    notes: "SUV híbrido para uso comercial. Parte de flota empresarial.",
    createdAt: "2025-04-18T09:20:00Z",
    updatedAt: "2025-05-05T14:30:00Z",
  },
]

// Inicializar datos
export const initializeVehicles = async (): Promise<Vehicle[]> => {
  try {
    const storedVehicles = await AsyncStorage.getItem(VEHICLES_STORAGE_KEY)
    if (storedVehicles === null) {
      await AsyncStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(initialVehicles))
      return initialVehicles
    }
    return JSON.parse(storedVehicles)
  } catch (error) {
    console.error("Error al inicializar vehículos:", error)
    return initialVehicles
  }
}

// Obtener todos los vehículos
export const getAllVehicles = async (): Promise<Vehicle[]> => {
  try {
    const storedVehicles = await AsyncStorage.getItem(VEHICLES_STORAGE_KEY)
    return storedVehicles ? JSON.parse(storedVehicles) : []
  } catch (error) {
    console.error("Error al obtener vehículos:", error)
    return []
  }
}

// Obtener vehículo por ID
export const getVehicleById = async (id: string): Promise<Vehicle | null> => {
  try {
    const vehicles = await getAllVehicles()
    return vehicles.find((vehicle) => vehicle.id === id) || null
  } catch (error) {
    console.error("Error al obtener vehículo por ID:", error)
    return null
  }
}

// Obtener vehículos por ID de cliente
export const getVehiclesByClientId = async (clientId: string): Promise<Vehicle[]> => {
  try {
    const vehicles = await getAllVehicles()
    return vehicles.filter((vehicle) => vehicle.clientId === clientId)
  } catch (error) {
    console.error("Error al obtener vehículos por ID de cliente:", error)
    return []
  }
}

// Crear nuevo vehículo
export const createVehicle = async (vehicle: Omit<Vehicle, "id" | "createdAt" | "images">): Promise<Vehicle> => {
  try {
    const vehicles = await getAllVehicles()
    const newVehicle: Vehicle = {
      ...vehicle,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      images: [],
    }

    await AsyncStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify([...vehicles, newVehicle]))
    return newVehicle
  } catch (error) {
    console.error("Error al crear vehículo:", error)
    throw error
  }
}

// Actualizar vehículo
export const updateVehicle = async (id: string, updates: Partial<Vehicle>): Promise<Vehicle | null> => {
  try {
    const vehicles = await getAllVehicles()
    const index = vehicles.findIndex((vehicle) => vehicle.id === id)

    if (index === -1) return null

    const updatedVehicle = {
      ...vehicles[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    vehicles[index] = updatedVehicle

    await AsyncStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(vehicles))
    return updatedVehicle
  } catch (error) {
    console.error("Error al actualizar vehículo:", error)
    return null
  }
}

// Añadir imagen a vehículo
export const addVehicleImage = async (vehicleId: string, image: AppImage): Promise<Vehicle | null> => {
  try {
    const vehicles = await getAllVehicles()
    const index = vehicles.findIndex((vehicle) => vehicle.id === vehicleId)

    if (index === -1) return null

    const updatedVehicle = {
      ...vehicles[index],
      images: [...vehicles[index].images, image],
      updatedAt: new Date().toISOString(),
    }
    vehicles[index] = updatedVehicle

    await AsyncStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(vehicles))
    return updatedVehicle
  } catch (error) {
    console.error("Error al añadir imagen a vehículo:", error)
    return null
  }
}

// Eliminar imagen de vehículo
export const removeVehicleImage = async (vehicleId: string, imageId: string): Promise<Vehicle | null> => {
  try {
    const vehicles = await getAllVehicles()
    const index = vehicles.findIndex((vehicle) => vehicle.id === vehicleId)

    if (index === -1) return null

    const updatedVehicle = {
      ...vehicles[index],
      images: vehicles[index].images.filter((img) => img.id !== imageId),
      updatedAt: new Date().toISOString(),
    }
    vehicles[index] = updatedVehicle

    await AsyncStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(vehicles))
    return updatedVehicle
  } catch (error) {
    console.error("Error al eliminar imagen de vehículo:", error)
    return null
  }
}

// Añadir registro de servicio a vehículo
export const addServiceRecord = async (
  vehicleId: string,
  serviceRecord: { date: string; mileage: number; description: string; cost: number },
): Promise<Vehicle | null> => {
  try {
    const vehicles = await getAllVehicles()
    const index = vehicles.findIndex((vehicle) => vehicle.id === vehicleId)

    if (index === -1) return null

    const serviceHistory = vehicles[index].serviceHistory || []

    const updatedVehicle = {
      ...vehicles[index],
      serviceHistory: [...serviceHistory, serviceRecord],
      lastServiceDate: serviceRecord.date,
      mileage: serviceRecord.mileage, // Actualizar kilometraje actual
      updatedAt: new Date().toISOString(),
    }
    vehicles[index] = updatedVehicle

    await AsyncStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(vehicles))
    return updatedVehicle
  } catch (error) {
    console.error("Error al añadir registro de servicio:", error)
    return null
  }
}

// Eliminar vehículo
export const deleteVehicle = async (id: string): Promise<boolean> => {
  try {
    const vehicles = await getAllVehicles()
    const filteredVehicles = vehicles.filter((vehicle) => vehicle.id !== id)

    if (filteredVehicles.length === vehicles.length) return false

    await AsyncStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(filteredVehicles))
    return true
  } catch (error) {
    console.error("Error al eliminar vehículo:", error)
    return false
  }
}

// Buscar vehículos
export const searchVehicles = async (query: string): Promise<Vehicle[]> => {
  try {
    const vehicles = await getAllVehicles()
    const lowerQuery = query.toLowerCase()

    return vehicles.filter(
      (vehicle) =>
        vehicle.make.toLowerCase().includes(lowerQuery) ||
        vehicle.model.toLowerCase().includes(lowerQuery) ||
        vehicle.year.includes(query) ||
        vehicle.licensePlate.toLowerCase().includes(lowerQuery) ||
        (vehicle.vin && vehicle.vin.toLowerCase().includes(lowerQuery)),
    )
  } catch (error) {
    console.error("Error al buscar vehículos:", error)
    return []
  }
}
