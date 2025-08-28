"use client"  
  
import type React from "react"  
import { createContext, useContext, useState, useEffect } from "react"  
import AsyncStorage from "@react-native-async-storage/async-storage"  
import { Alert } from "react-native"  
import { supabase } from "../lib/supabase"  
import type { User, USER_ROLES_TYPE, AuthContextType } from "../types/user"  
  
const AuthContext = createContext<AuthContextType | undefined>(undefined)  
  
const ROLE_PERMISSIONS: Record<USER_ROLES_TYPE, string[]> = {  
  admin: ["*"],  
  manager: [  
    "view_orders", "create_orders", "update_orders", "delete_orders",  
    "view_inventory", "manage_inventory", "view_clients", "manage_clients", "view_reports"  
  ],  
  technician: ["view_orders", "update_orders", "view_inventory", "view_clients"],  
  advisor: ["view_orders", "create_orders", "view_clients", "view_reports"],  
  client: ["view_own_orders", "create_orders"]  
}  
  
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {  
  const [user, setUser] = useState<User | null>(null)  
  const [isLoading, setIsLoading] = useState(true)  
  
  const createBasicUserProfile = async (session: any): Promise<User> => {  
    const basicUser: User = {  
      id: session.user.id,  
      email: session.user.email || '',  
      name: session.user.email?.split('@')[0] || 'Usuario',  
      role: 'client',  
      permissions: ROLE_PERMISSIONS.client,  
      phone: '',  
      profilePic: ''  
    }  

    try {  
      const { error } = await supabase  
        .from('perfil_usuario')  
        .insert({  
          auth_id: session.user.id,  
          correo: session.user.email,  
          nombre: session.user.email?.split('@')[0] || 'Usuario',  
          apellido: '',  
          role: 'client',  
          estado: true,  
          created_at: new Date().toISOString(),  
          actualizado: new Date().toISOString()  
        })  

      if (error) {  
        console.warn("No se pudo crear perfil en BD:", error)  
      }  
    } catch (error) {  
      console.warn("Error al crear perfil:", error)  
    }  

    return basicUser  
  }  
  
  useEffect(() => {  
    const checkSession = async () => {  
      try {  
        const { data: { session } } = await supabase.auth.getSession()  
          
        if (session?.user) {  
          const { data: profile, error } = await supabase  
            .from('perfil_usuario')  
            .select('*')  
            .eq('auth_id', session.user.id)  
            .single()  
  
          let userData: User  
  
          if (error && error.code === 'PGRST116') {
            console.log("Perfil no encontrado, creando perfil básico")
            userData = await createBasicUserProfile(session)
          } else if (error) {
            console.error("Error al obtener perfil:", error)
            userData = await createBasicUserProfile(session)
          } else {
            // Mapear 'cliente' a 'client' para navegación y permisos correctos
            let mappedRole = profile.role?.toLowerCase();
            if (mappedRole === 'cliente' || mappedRole === 'client') mappedRole = 'client';
            userData = {
              id: session.user.id,
              email: session.user.email || '',
              name: `${profile.nombre || ''} ${profile.apellido || ''}`.trim() ||
                    profile.nombre ||
                    session.user.email?.split('@')[0] || 'Usuario',
              role: (mappedRole as USER_ROLES_TYPE) || 'client',
              permissions: ROLE_PERMISSIONS[mappedRole as USER_ROLES_TYPE] || ROLE_PERMISSIONS.client,
              phone: profile.telefono || '',
              profilePic: '',
              taller_id: profile.taller_id,
              isActive: profile.estado
            }
          }
  
          setUser(userData)  
          await AsyncStorage.setItem("user", JSON.stringify(userData))  
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
  
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {  
      if (event === 'SIGNED_IN' && session?.user) {  
        try {  
          const { data: profile, error } = await supabase  
            .from('perfil_usuario')  
            .select('*')  
            .eq('auth_id', session.user.id)  
            .single()  
  
          let userData: User  
  
          if (error && error.code === 'PGRST116') {
            userData = await createBasicUserProfile(session)
          } else if (error) {
            console.error("Error al cargar perfil:", error)
            userData = await createBasicUserProfile(session)
          } else {
            // Mapear 'cliente' a 'client' para navegación y permisos correctos
            let mappedRole = profile.role?.toLowerCase();
            if (mappedRole === 'cliente' || mappedRole === 'client') mappedRole = 'client';
            userData = {
              id: session.user.id,
              email: session.user.email || '',
              name: `${profile.nombre || ''} ${profile.apellido || ''}`.trim() ||
                    profile.nombre ||
                    session.user.email?.split('@')[0] || 'Usuario',
              role: (mappedRole as USER_ROLES_TYPE) || 'client',
              permissions: ROLE_PERMISSIONS[mappedRole as USER_ROLES_TYPE] || ROLE_PERMISSIONS.client,
              phone: profile.telefono || '',
              profilePic: '',
              taller_id: profile.taller_id,
              isActive: profile.estado
            }
          }
  
          setUser(userData)  
          await AsyncStorage.setItem("user", JSON.stringify(userData))  
        } catch (error) {  
          console.error("Error al procesar inicio de sesión:", error)  
          const userData = await createBasicUserProfile(session)  
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
  
  const hasPermission = (permission: string): boolean => {  
    if (!user) return false  
    if (user.permissions.includes("*")) return true  
    return user.permissions.includes(permission)  
  }  
  
  const login = async (email: string, password: string): Promise<boolean> => {  
    try {  
      const { data, error } = await supabase.auth.signInWithPassword({  
        email,  
        password,  
      })  
  
      if (error) throw error  
      if (data?.user) return true  
      return false  
    } catch (error: any) {  
      console.error("Error al iniciar sesión:", error)  
      Alert.alert("Error", error.message || "No se pudo iniciar sesión")  
      return false  
    }  
  }  
  
  const logout = async (): Promise<void> => {  
    try {  
      const { error } = await supabase.auth.signOut()  
      if (error) throw error  
      await AsyncStorage.clear()  
      setUser(null)  
    } catch (error) {  
      console.error('Error al cerrar sesión:', error)  
    }  
  }  
  
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
  
export const useAuth = (): AuthContextType => {  
  const context = useContext(AuthContext)  
  if (context === undefined) {  
    throw new Error("useAuth debe usarse dentro de un AuthProvider")  
  }  
  return context  
}