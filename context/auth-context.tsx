"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Alert } from "react-native"

// Definir tipos
type UserRole = "client" | "technician" | "manager" | "admin"

type User = {
  id: string
  email: string
  name: string
  role: UserRole
  permissions: string[]
  profilePic?: any
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

// Usuarios de prueba
const MOCK_USERS = [
  {
    id: "1",
    email: "cliente1@gmail.com",
    password: "123456",
    name: "Carlos Rodríguez",
    role: "client",
    permissions: ["view_own_orders", "view_own_vehicles", "create_comments"],
    profilePic: require("../assets/profile-pic.png"),
  },
  {
    id: "2",
    email: "tecnico1@gmail.com",
    password: "123456",
    name: "Juan Pérez",
    role: "technician",
    permissions: ["view_orders", "update_order_details", "view_inventory", "upload_images", "create_comments"],
    profilePic: require("../assets/profile-pic.png"),
  },
  {
    id: "3",
    email: "jefe@gmail.com",
    password: "123456",
    name: "Ana Martínez",
    role: "manager",
    permissions: [
      "view_orders",
      "update_order_details",
      "update_order_status",
      "view_inventory",
      "update_inventory",
      "create_orders",
      "view_reports",
      "manage_users",
      "create_comments",
    ],
    profilePic: require("../assets/profile-pic.png"),
  },
  {
    id: "4",
    email: "admin@autoflowx.com",
    password: "123456",
    name: "Admin Sistema",
    role: "admin",
    permissions: ["*"], // Todos los permisos
    profilePic: require("../assets/profile-pic.png"),
  },
]

// Proveedor de autenticación
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Verificar si hay un usuario guardado al iniciar
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user")
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }
      } catch (error) {
        console.error("Error al cargar usuario:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
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
      // Simular verificación con usuarios de prueba
      const foundUser = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password)

      if (foundUser) {
        // Omitir la contraseña del objeto de usuario
        const { password, ...userWithoutPassword } = foundUser

        // Guardar usuario en estado y AsyncStorage
        setUser(userWithoutPassword as User)
        await AsyncStorage.setItem("user", JSON.stringify(userWithoutPassword))
        return true
      } else {
        Alert.alert("Error", "Credenciales incorrectas")
        return false
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      Alert.alert("Error", "No se pudo iniciar sesión")
      return false
    }
  }

  // Función de cierre de sesión
  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem("user")
      setUser(null)
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}
