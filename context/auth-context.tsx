"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Alert } from "react-native"
import { supabase } from "../lib/supabase"

// Definir tipos
type UserRole = "client" | "technician" | "manager" | "admin"

type User = {
  id: string
  email: string
  name: string
  role: UserRole
  permissions: string[]
  profilePic?: string
  phone?: string
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  isAuthenticated: boolean
  hasPermission: (permission: string) => boolean
}

// Crear contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mapeo de roles a permisos
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
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
  client: [
    "view_own_orders",
    "create_orders"
  ]
}

// Proveedor de autenticación
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
            .eq('id', session.user)
            .single()
          
          if (error) {
            console.error("Error al obtener perfil:", error)
            // Si no existe el perfil, crear uno básico
            const userData: User = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.email?.split('@')[0] || 'Usuario',
              role: 'client',
              permissions: ROLE_PERMISSIONS.client,
              phone: '',
              profilePic: ''
            }
            setUser(userData)
            await AsyncStorage.setItem("user", JSON.stringify(userData))
          } else {
            // Crear objeto de usuario con permisos
            const userData: User = {
              id: session.user.id,
              email: session.user.email || '',
              name: profile.full_name || profile.first_name || session.user.email?.split('@')[0] || 'Usuario',
              role: (profile.role as UserRole) || 'client',
              permissions: ROLE_PERMISSIONS[profile.role as UserRole] || ROLE_PERMISSIONS.client,
              phone: profile.phone || '',
              profilePic: profile.avatar_url || ''
            }
            
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
            .eq('id', session.user.id)
            .single()
          
          if (error) {
            console.error("Error al cargar perfil:", error)
            // Si no existe el perfil, crear uno básico
            const userData: User = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.email?.split('@')[0] || 'Usuario',
              role: 'client',
              permissions: ROLE_PERMISSIONS.client,
              phone: '',
              profilePic: ''
            }
            setUser(userData)
            await AsyncStorage.setItem("user", JSON.stringify(userData))
          } else {
            // Crear objeto de usuario con permisos
            const userData: User = {
              id: session.user.id,
              email: session.user.email || '',
              name: profile.full_name || profile.first_name || session.user.email?.split('@')[0] || 'Usuario',
              role: (profile.role as UserRole) || 'client',
              permissions: ROLE_PERMISSIONS[profile.role as UserRole] || ROLE_PERMISSIONS.client,
              phone: profile.phone || '',
              profilePic: profile.avatar_url || ''
            }
            
            setUser(userData)
            await AsyncStorage.setItem("user", JSON.stringify(userData))
          }
        } catch (error) {
          console.error("Error al procesar inicio de sesión:", error)
          // Crear usuario básico en caso de error
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.email?.split('@')[0] || 'Usuario',
            role: 'client',
            permissions: ROLE_PERMISSIONS.client,
            phone: '',
            profilePic: ''
          }
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

  // Valor del contexto
  const value = {
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
