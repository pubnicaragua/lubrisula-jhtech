export const USER_ROLES = {
  admin: 'admin',
  manager: 'manager',
  technician: 'technician',
  advisor: 'advisor',
  client: 'client'
} 

export type USER_ROLES_TYPE = keyof typeof USER_ROLES

export interface User {  
  id: string;  
  email: string;  
  firstName: string;  
  lastName: string;  
  fullName: string;  
  role: USER_ROLES_TYPE;  
  avatarUrl?: string;  
  isActive: boolean;  
}  
  
// Interfaz para el perfil completo del usuario  
export interface UserProfile {  
  id: string;  
  email: string;  
  phone: string;  
  firstName: string;  
  lastName: string;  
  fullName: string;  
  avatarUrl: string;  
  role: USER_ROLES_TYPE;  
  isActive: boolean;  
  lastLogin: Date | null;  
  createdAt: Date;  
  updatedAt: Date;  
}

export interface UserPermissions {  
  rol: string  
  permisos: string[]  
  taller_id: string  
}