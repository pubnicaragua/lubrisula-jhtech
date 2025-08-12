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

// Interfaz para permisos de usuario
export interface UserPermissions {
  rol: string
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