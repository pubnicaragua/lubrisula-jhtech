export interface InventoryItem {
  id: string
  name: string
  sku: string
  category: string
  subcategory?: string
  description?: string
  supplier?: string
  location?: string
  priceUSD: number
  priceHNL: number
  cost?: number
  stock: number
  minStock?: number
  maxStock?: number
  unit?: string
  images?: string[]
  createdAt: string
  updatedAt: string
  isActive: boolean
  // Additional properties for database mapping
  barcode?: string
  type?: string
  status?: string
  notes?: string
  supplierId?: string
  price?: number
}

// Form data type for creating/updating inventory items
export interface InventoryItemFormData {
  name: string
  description?: string
  sku: string
  barcode?: string
  category: string
  type?: string
  stock: number
  minStock?: number
  cost?: number
  price?: number
  supplierId?: string
  location?: string
  notes?: string
  images?: string[]
}

export interface Service {
  id: string
  name: string
  sku: string
  category: string
  description?: string
  priceUSD: number
  priceHNL: number
  estimatedTime?: number // in minutes
  requiredParts?: string[] // array of part IDs
  notes?: string
  createdAt: string
  updatedAt: string
  isActive: boolean
}

export enum InventoryCategory {
  ENGINE = "Motor",
  TRANSMISSION = "Transmisión",
  BRAKES = "Frenos",
  SUSPENSION = "Suspensión",
  ELECTRICAL = "Eléctrico",
  BODY = "Carrocería",
  FLUIDS = "Fluidos",
  FILTERS = "Filtros",
  TIRES = "Neumáticos",
  ACCESSORIES = "Accesorios",
  OTHER = "Otros",
}

export enum ServiceCategory {
  MAINTENANCE = "Mantenimiento",
  REPAIR = "Reparación",
  DIAGNOSTIC = "Diagnóstico",
  INSTALLATION = "Instalación",
  INSPECTION = "Inspección",
  OTHER = "Otros",
}

export enum Currency {
  USD = "USD",
  HNL = "HNL",
}

export interface InventoryFilter {
  searchTerm?: string
  category?: string
  supplier?: string
  inStock?: boolean
  lowStock?: boolean
  sortBy?: "name" | "sku" | "stock" | "price"
  sortOrder?: "asc" | "desc"
}

export interface ServiceFilter {
  searchTerm?: string
  category?: string
  sortBy?: "name" | "sku" | "price"
  sortOrder?: "asc" | "desc"
}
