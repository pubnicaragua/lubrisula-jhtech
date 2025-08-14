export const USER_ROLES = {  
  admin: 'admin',  
  manager: 'manager',  
  technician: 'technician',  
  advisor: 'advisor',  
  client: 'client'  
} as const  
  
export type USER_ROLES_TYPE = keyof typeof USER_ROLES  
  
// Tipo base para el usuario autenticado de Supabase  
export interface SupabaseUser {  
  id: string  
  email: string  
  created_at: string  
  updated_at: string  
  last_sign_in_at?: string  
}  
  
// Tipo para el perfil de usuario en la tabla perfil_usuario  
export interface UserProfile {  
  id: string  
  email: string  
  first_name: string  
  last_name: string  
  full_name: string  
  phone: string  
  role: USER_ROLES_TYPE  
  avatar_url?: string  
  is_active: boolean  
  last_login_at?: string  
  taller_id?: string  
  created_at: string  
  updated_at: string  
}  
  
// Tipo combinado para el contexto de autenticación  
export interface User {  
  id: string  
  email: string  
  name: string  
  role: USER_ROLES_TYPE  
  permissions: string[]  
  profilePic?: string  
  phone?: string  
  taller_id?: string  
  isActive?: boolean  
}  
  
// ✅ CORREGIDO: Interfaz para permisos de usuario con campo 'role'  
export interface UserPermissions {  
  role: string  // ✅ CORREGIDO: Cambiar 'rol' por 'role'  
  permisos: string[]  
  taller_id: string  
}  
  
// Tipo para el contexto de autenticación  
export interface AuthContextType {  
  user: User | null  
  isLoading: boolean  
  login: (email: string, password: string) => Promise<boolean>  
  logout: () => Promise<void>  
  isAuthenticated: boolean  
  hasPermission: (permission: string) => boolean  
}  
  
// ✅ AGREGADO: Interfaces adicionales para operaciones CRUD  
export interface CreateUserData {  
  email: string  
  first_name: string  
  last_name: string  
  phone?: string  
  role?: USER_ROLES_TYPE  
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
  
// ✅ AGREGADO: Tipos para autenticación  
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
  
// ✅ AGREGADO: Tipos para relaciones de taller  
export interface UserTaller {  
  id: string  
  user_id: string  
  taller_id: string  
  role: string  
  acceso: boolean  
  created_at: string  
  updated_at: string  
}  
  
// ✅ AGREGADO: Tipos para búsqueda y filtrado  
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
  
// ✅ AGREGADO: Enums para roles y estados  
export enum UserRole {  
  ADMIN = 'admin',  
  MANAGER = 'manager',  
  TECHNICIAN = 'technician',  
  ADVISOR = 'advisor',  
  CLIENT = 'client'  
}  
  
export enum UserStatus {  
  ACTIVE = 'active',  
  INACTIVE = 'inactive',  
  SUSPENDED = 'suspended'  
}  
  
// ✅ AGREGADO: Tipos para validación  
export interface UserValidationErrors {  
  email?: string  
  first_name?: string  
  last_name?: string  
  phone?: string  
  password?: string  
}  
  
// ✅ AGREGADO: Función de validación  
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
  
// ✅ AGREGADO: Función helper para obtener permisos por rol  
export const getPermissionsByRole = (role: UserRole): string[] => {  
  switch (role) {  
    case UserRole.ADMIN:  
      return ['*'] // Acceso completo  
    case UserRole.MANAGER:  
      return [  
        'view_orders', 'create_orders', 'update_orders', 'delete_orders',  
        'view_inventory', 'manage_inventory',  
        'view_clients', 'manage_clients',  
        'view_reports'  
      ]  
    case UserRole.TECHNICIAN:  
      return [  
        'view_orders', 'create_orders', 'update_orders',  
        'view_inventory', 'manage_inventory',  
        'view_clients', 'manage_clients'  
      ]  
    case UserRole.ADVISOR:  
      return [  
        'view_orders', 'create_orders',  
        'view_clients', 'manage_clients',  
        'view_reports'  
      ]  
    case UserRole.CLIENT:  
      return ['view_own_orders', 'create_orders']  
    default:  
      return []  
  }  
}