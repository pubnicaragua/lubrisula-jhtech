// Tipos para servicios y inventario
export interface Service {
  id: string
  name: string
  description?: string
  price: number
  category: string
  estimatedTime?: number
  status: 'Active' | 'Inactive'
}

// Tipo legacy para compatibilidad (ServicioType)
export interface ServicioType {
  id: string
  nombre: string
  descripcion?: string
  precio: number
  categoria: string
  tiempo_estimado?: number
  duracion_estimada?: number
  requiere_cita?: boolean
  notas?: string
  estado: 'Activo' | 'Inactivo'
}

// Tipos para inventario
export interface InventoryItem {
  id: string
  sku: string
  name: string
  description?: string
  categoryId: string
  supplierId?: string
  purchasePrice: number
  salePrice: number
  stock: number
  minStock: number
  maxStock?: number
  location: string
  status: 'Active' | 'Inactive'
  entryDate: string
  category?: {
    name: string
  }
  supplier?: {
    name: string
  }
}

// Tipo legacy para compatibilidad (InventarioType)
export interface InventarioType {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  categoria_id: string
  proveedor_id?: string
  precio_compra: number
  precio_venta: number
  stock_actual: number
  stock_minimo: number
  stock_maximo?: number
  ubicacion_almacen: string
  estado: 'Activo' | 'Inactivo'
  fecha_ingreso: string
  categorias_materiales?: {
    nombre: string
  }
  suppliers?: {
    name: string
  }
}

// Tipos para categorías de materiales
export interface MaterialCategory {
  id: string
  name: string
  description?: string
}

// Tipo legacy para compatibilidad (CategoriaMaterialType)
export interface CategoriaMaterialType {
  id: string
  nombre: string
  descripcion?: string
}

// Tipos para proveedores
export interface Supplier {
  id: string
  name: string
  contactName?: string
  phone?: string
  email?: string
  address?: string
}

// Tipo legacy para compatibilidad (ProveedorType)
export interface ProveedorType {
  id: string
  name: string
  contact_name?: string
  phone?: string
}

// Tipos para permisos de usuario
export interface UserPermissions {
  role: string
  permissions: string[]
  workshopId: string
}

// Tipos para servicios de inventario
export interface InventoryService {
  getAllInventory(): Promise<InventoryItem[]>
  getInventoryCategories(): Promise<MaterialCategory[]>
  getSuppliers(): Promise<Supplier[]>
  createInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem | null>
  updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | null>
}

// Tipos para servicios de servicios
export interface ServicesService {
  getAllServices(): Promise<Service[]>
  getServiceById(id: string): Promise<Service | null>
  createService(service: Omit<Service, 'id'>): Promise<Service | null>
  updateService(id: string, updates: Partial<Service>): Promise<Service | null>
  deleteService(id: string): Promise<boolean>
}

// Tipos para servicios de acceso
export interface AccessService {
  GET_PERMISOS_USUARIO(userId: string, tallerId: string): Promise<UserPermissions | null>
  hasPermission(role: string, permissionName: string, action?: 'view' | 'edit' | 'delete'): Promise<boolean>
  getUserPermissions(userId: string, tallerId: string): Promise<UserPermissions | null>
}

// Tipos para servicios de usuario
export interface UserService {
  GET_TALLER_ID(userId: string): Promise<string | null>
  getCurrentUserProfile(): Promise<any | null>
  signIn(email: string, password: string): Promise<{ user: any | null; error: Error | null }>
  signOut(): Promise<{ error: Error | null }>
  updatePassword(currentPassword: string, newPassword: string): Promise<{ error: Error | null }>
}


