// ✅ CORREGIDO: Sincronizar campos de usuario con schema real  
export interface User {  
  id: string  
  email: string  
  // ✅ CORREGIDO: Usar campos del schema real  
  first_name: string  
  last_name: string  
  phone?: string  
  avatar_url?: string  
  role: 'admin' | 'technician' | 'client'  
  created_at: string  
  updated_at: string  
    
  // Campos adicionales del perfil  
  address?: string  
  date_of_birth?: string  
  emergency_contact?: string  
  emergency_phone?: string  
  preferences?: Record<string, any>  
    
  // ✅ CORREGIDO: Campos computados para compatibilidad  
  readonly fullName: string  
  readonly displayName: string  
}  
  
// ✅ CORREGIDO: Implementación de campos computados  
export class UserImpl implements User {  
  constructor(  
    public id: string,  
    public email: string,  
    public first_name: string,  
    public last_name: string,  
    public phone: string = '',  
    public avatar_url: string = '',  
    public role: 'admin' | 'technician' | 'client' = 'client',  
    public created_at: string = new Date().toISOString(),  
    public updated_at: string = new Date().toISOString(),  
    public address?: string,  
    public date_of_birth?: string,  
    public emergency_contact?: string,  
    public emergency_phone?: string,  
    public preferences?: Record<string, any>  
  ) {}  
  
  get fullName(): string {  
    return `${this.first_name} ${this.last_name}`.trim()  
  }  
  
  get displayName(): string {  
    return this.fullName || this.email  
  }  
}  
  
// ✅ CORREGIDO: Función helper para mapear campos legacy  
export const mapLegacyUserFields = (userData: any): User => {  
  return {  
    id: userData.id,  
    email: userData.email,  
    // Mapear firstName/lastName a first_name/last_name  
    first_name: userData.first_name || userData.firstName || '',  
    last_name: userData.last_name || userData.lastName || '',  
    phone: userData.phone,  
    avatar_url: userData.avatar_url || userData.avatarUrl,  
    role: userData.role || 'client',  
    created_at: userData.created_at || userData.createdAt || new Date().toISOString(),  
    updated_at: userData.updated_at || userData.updatedAt || new Date().toISOString(),  
    address: userData.address,  
    date_of_birth: userData.date_of_birth || userData.dateOfBirth,  
    emergency_contact: userData.emergency_contact || userData.emergencyContact,  
    emergency_phone: userData.emergency_phone || userData.emergencyPhone,  
    preferences: userData.preferences,  
    get fullName() {  
      return `${this.first_name} ${this.last_name}`.trim()  
    },  
    get displayName() {  
      return this.fullName || this.email  
    }  
  }  
}  
  
// Interfaces para permisos y sesiones  
export interface UserPermissions {  
  canCreateOrders: boolean  
  canEditOrders: boolean  
  canDeleteOrders: boolean  
  canViewReports: boolean  
  canManageInventory: boolean  
  canManageClients: boolean  
  canManageUsers: boolean  
  canManageSettings: boolean  
}  
  
export interface UserSession {  
  user: User  
  permissions: UserPermissions  
  tallerId: string  
  expiresAt: string  
}  
  
// Tipos para operaciones CRUD  
export interface CreateUserData {  
  email: string  
  first_name: string  
  last_name: string  
  phone?: string  
  role?: 'admin' | 'technician' | 'client'  
  address?: string  
  date_of_birth?: string  
  emergency_contact?: string  
  emergency_phone?: string  
}  
  
export interface UpdateUserData {  
  first_name?: string  
  last_name?: string  
  phone?: string  
  avatar_url?: string  
  address?: string  
  date_of_birth?: string  
  emergency_contact?: string  
  emergency_phone?: string  
  preferences?: Record<string, any>  
}  
  
// Tipos para autenticación  
export interface AuthUser {  
  id: string  
  email: string  
  role: string  
  tallerId?: string  
  permissions?: UserPermissions  
}  
  
export interface LoginCredentials {  
  email: string  
  password: string  
}  
  
export interface RegisterData extends CreateUserData {  
  password: string  
  confirmPassword: string  
}  
  
// Tipos para relaciones de taller  
export interface UserTaller {  
  id: string  
  user_id: string  
  taller_id: string  
  role: string  
  acceso: boolean  
  created_at: string  
  updated_at: string  
}  
  
// Tipos para búsqueda y filtrado  
export interface UserSearchFilters {  
  searchTerm?: string  
  role?: string  
  tallerId?: string  
  isActive?: boolean  
}  
  
export interface UserListResponse {  
  users: User[]  
  total: number  
  page: number  
  limit: number  
}  
  
// Enums para roles y estados  
export enum UserRole {  
  ADMIN = 'admin',  
  TECHNICIAN = 'technician',  
  CLIENT = 'client'  
}  
  
export enum UserStatus {  
  ACTIVE = 'active',  
  INACTIVE = 'inactive',  
  SUSPENDED = 'suspended'  
}  
  
// Tipos para validación  
export interface UserValidationErrors {  
  email?: string  
  first_name?: string  
  last_name?: string  
  phone?: string  
  password?: string  
}  
  
// Función de validación  
export const validateUserData = (userData: Partial<CreateUserData>): UserValidationErrors => {  
  const errors: UserValidationErrors = {}  
  
  if (!userData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {  
    errors.email = 'Email válido es requerido'  
  }  
  
  if (!userData.first_name || userData.first_name.trim().length < 2) {  
    errors.first_name = 'Nombre debe tener al menos 2 caracteres'  
  }  
  
  if (!userData.last_name || userData.last_name.trim().length < 2) {  
    errors.last_name = 'Apellido debe tener al menos 2 caracteres'  
  }  
  
  if (userData.phone && !/^\+?[\d\s\-\(\)]+$/.test(userData.phone)) {  
    errors.phone = 'Formato de teléfono inválido'  
  }  
  
  return errors  
}  
  
// Función helper para obtener permisos por rol  
export const getPermissionsByRole = (role: UserRole): UserPermissions => {  
  switch (role) {  
    case UserRole.ADMIN:  
      return {  
        canCreateOrders: true,  
        canEditOrders: true,  
        canDeleteOrders: true,  
        canViewReports: true,  
        canManageInventory: true,  
        canManageClients: true,  
        canManageUsers: true,  
        canManageSettings: true,  
      }  
    case UserRole.TECHNICIAN:  
      return {  
        canCreateOrders: true,  
        canEditOrders: true,  
        canDeleteOrders: false,  
        canViewReports: true,  
        canManageInventory: true,  
        canManageClients: true,  
        canManageUsers: false,  
        canManageSettings: false,  
      }  
    case UserRole.CLIENT:  
      return {  
        canCreateOrders: false,  
        canEditOrders: false,  
        canDeleteOrders: false,  
        canViewReports: false,  
        canManageInventory: false,  
        canManageClients: false,  
        canManageUsers: false,  
        canManageSettings: false,  
      }  
    default:  
      return {  
        canCreateOrders: false,  
        canEditOrders: false,  
        canDeleteOrders: false,  
        canViewReports: false,  
        canManageInventory: false,  
        canManageClients: false,  
        canManageUsers: false,  
        canManageSettings: false,  
      }  
  }  
}  
  
export default {  
  UserImpl,  
  mapLegacyUserFields,  
  validateUserData,  
  getPermissionsByRole,  
  UserRole,  
  UserStatus  
}