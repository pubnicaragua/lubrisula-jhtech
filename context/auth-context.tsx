"use client"  
  
import type React from "react"  
import { createContext, useContext, useState, useEffect } from "react"  
import AsyncStorage from "@react-native-async-storage/async-storage"  
import { Alert } from "react-native"  
import { supabase } from "../lib/supabase"  
import type { User, USER_ROLES_TYPE, AuthContextType, UserPermissions } from "../types/user"  
import { getPermissionsByRole, UserRole } from "../types/user"  
  
// Crear contexto  
const AuthContext = createContext<AuthContextType | undefined>(undefined)  
  
// Mapeo de roles a permisos (mantenemos para compatibilidad)  
const ROLE_PERMISSIONS: Record<USER_ROLES_TYPE, string[]> = {  
  admin: ["*"], // Admin tiene todos los permisos  
  manager: [  
    "view_orders",  
    "create_orders",  
    "update_orders",  
    "delete_orders",  
    "view_inventory",  
    "manage_inventory",  
    "view_clients",  
    "manage_clients",  
    "view_reports"  
  ],  
  technician: [  
    "view_orders",  
    "update_orders",  
    "view_inventory",  
    "view_clients"  
  ],  
  advisor: [  
    "view_orders",  
    "create_orders",  
    "view_clients",  
    "view_reports"  
  ],  
  client: [  
    "view_own_orders",  
    "create_orders"  
  ]  
}  
  
// ✅ CORREGIDO: Interfaz User actualizada para AuthContext  
interface AuthUser extends User {  
  permissions: string[]  
}  
  
// Proveedor de autenticación  
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {  
  const [user, setUser] = useState<AuthUser | null>(null)  
  const [isLoading, setIsLoading] = useState(true)  
  
  // ✅ CORREGIDO: Función helper para crear usuario con permisos  
  const createUserWithPermissions = (profile: any, session: any): AuthUser => {  
    const role = (profile?.role as USER_ROLES_TYPE) || 'client'  
      
    return {  
      id: session.user.id,  
      email: session.user.email || '',  
      // ✅ CORREGIDO: Usar campos del schema real  
      first_name: profile?.first_name || session.user.email?.split('@')[0] || 'Usuario',  
      last_name: profile?.last_name || '',  
      phone: profile?.phone || '',  
      avatar_url: profile?.avatar_url || '',  
      role,  
      created_at: profile?.created_at || new Date().toISOString(),  
      updated_at: profile?.updated_at || new Date().toISOString(),  
      address: profile?.address,  
      date_of_birth: profile?.date_of_birth,  
      emergency_contact: profile?.emergency_contact,  
      emergency_phone: profile?.emergency_phone,  
      preferences: profile?.preferences,  
      // Campos computados  
      get fullName() {  
        return `${this.first_name} ${this.last_name}`.trim()  
      },  
      get displayName() {  
        return this.fullName || this.email  
      },  
      // Permisos para compatibilidad  
      permissions: ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.client  
    }  
  }  
  
  // Cargar sesión al iniciar  
  useEffect(() => {  
    // Verificar sesión activa  
    const checkSession = async () => {  
      try {  
        const { data: { session } } = await supabase.auth.getSession()  
  
        if (session?.user) {  
          // Obtener perfil del usuario desde la tabla perfil_usuario  
          const { data: profile, error } = await supabase  
            .from('perfil_usuario')  
            .select('*')  
            .eq('user_id', session.user.id)  
            .single()  
  
          if (error) {  
            console.error("Error al obtener perfil:", error)  
            // Si no existe el perfil, crear uno básico  
            const userData = createUserWithPermissions(null, session)  
            setUser(userData)  
            await AsyncStorage.setItem("user", JSON.stringify(userData))  
          } else {  
            // Crear objeto de usuario con permisos  
            const userData = createUserWithPermissions(profile, session)  
            setUser(userData)  
            await AsyncStorage.setItem("user", JSON.stringify(userData))  
          }  
        }  
      } catch (error) {  
        console.error("Error al verificar sesión:", error)  
        await supabase.auth.signOut()  
        await AsyncStorage.removeItem("user")  
        setUser(null)  
      } finally {  
        setIsLoading(false)  
      }  
    }  
  
    checkSession()  
  
    // Escuchar cambios en la autenticación  
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {  
      if (event === 'SIGNED_IN' && session?.user) {  
        try {  
          // Obtener perfil del usuario desde la tabla perfil_usuario  
          const { data: profile, error } = await supabase  
            .from('perfil_usuario')  
            .select('*')  
            .eq('user_id', session.user.id)  
            .single()  
  
          if (error) {  
            console.error("Error al cargar perfil:", error)  
            // Si no existe el perfil, crear uno básico  
            const userData = createUserWithPermissions(null, session)  
            setUser(userData)  
            await AsyncStorage.setItem("user", JSON.stringify(userData))  
          } else {  
            // Crear objeto de usuario con permisos  
            const userData = createUserWithPermissions(profile, session)  
            setUser(userData)  
            await AsyncStorage.setItem("user", JSON.stringify(userData))  
          }  
        } catch (error) {  
          console.error("Error al procesar inicio de sesión:", error)  
          // Crear usuario básico en caso de error  
          const userData = createUserWithPermissions(null, session)  
          setUser(userData)  
          await AsyncStorage.setItem("user", JSON.stringify(userData))  
        }  
      } else if (event === 'SIGNED_OUT') {  
        await AsyncStorage.removeItem("user")  
        setUser(null)  
      }  
    })  
  
    return () => {  
      subscription?.unsubscribe()  
    }  
  }, [])  
  
  // Función para verificar permisos  
  const hasPermission = (permission: string): boolean => {  
    if (!user) return false  
  
    // Admin tiene todos los permisos  
    if (user.permissions.includes("*")) return true  
  
    // Verificar si el usuario tiene el permiso específico  
    return user.permissions.includes(permission)  
  }  
  
  // Función de inicio de sesión  
  const login = async (email: string, password: string): Promise<boolean> => {  
    try {  
      const { data, error } = await supabase.auth.signInWithPassword({  
        email,  
        password,  
      })  
  
      if (error) {  
        throw error  
      }  
  
      if (data?.user) {  
        // El resto de la lógica se manejará en el listener de onAuthStateChange  
        return true  
      }  
  
      return false  
    } catch (error: any) {  
      console.error("Error al iniciar sesión:", error)  
      Alert.alert("Error", error.message || "No se pudo iniciar sesión")  
      return false  
    }  
  }  
  
  // Función de cierre de sesión  
  const logout = async (): Promise<void> => {  
    try {  
      const { error } = await supabase.auth.signOut()  
      if (error) throw error  
  
      await AsyncStorage.removeItem("user")  
      setUser(null)  
    } catch (error) {  
      console.error("Error al cerrar sesión:", error)  
      throw error  
    }  
  }  
  
  // ✅ CORREGIDO: Valor del contexto con tipos actualizados  
  const value: AuthContextType = {  
    user,  
    isLoading,  
    login,  
    logout,  
    isAuthenticated: !!user,  
    hasPermission,  
  }  
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>  
}  
  
// Hook personalizado para usar el contexto  
export const useAuth = (): AuthContextType => {  
  const context = useContext(AuthContext)  
  if (context === undefined) {  
    throw new Error("useAuth debe usarse dentro de un AuthProvider")  
  }  
  return context  
}