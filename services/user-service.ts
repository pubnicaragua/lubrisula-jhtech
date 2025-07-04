import AsyncStorage from "@react-native-async-storage/async-storage"
import { generateUniqueId } from "../utils/helpers"

// Definir tipos
export type UserRole = "client" | "technician" | "manager" | "admin"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  phone?: string
  profilePic?: string
  permissions: string[]
  createdAt: string
  lastLogin?: string
}

// Usuarios de prueba
const MOCK_USERS = [
  {
    id: "1",
    email: "cliente1@gmail.com",
    name: "Carlos Rodríguez",
    role: "client" as UserRole,
    phone: "+504 9876-5432",
    permissions: ["view_own_orders", "view_own_vehicles", "create_comments"],
    createdAt: new Date(2023, 1, 15).toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    id: "2",
    email: "tecnico1@gmail.com",
    name: "Juan Pérez",
    role: "technician" as UserRole,
    phone: "+504 8765-4321",
    permissions: ["view_orders", "update_order_details", "view_inventory", "upload_images"],
    createdAt: new Date(2023, 0, 10).toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    id: "3",
    email: "jefe@gmail.com",
    name: "Ana Martínez",
    role: "manager" as UserRole,
    phone: "+504 9988-7766",
    permissions: [
      "view_orders",
      "update_order_details",
      "update_order_status",
      "view_inventory",
      "update_inventory",
      "create_orders",
      "view_reports",
      "manage_users",
    ],
    createdAt: new Date(2022, 11, 5).toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    id: "4",
    email: "admin@autoflowx.com",
    name: "Admin Sistema",
    role: "admin" as UserRole,
    phone: "+504 9999-8888",
    permissions: ["*"], // Todos los permisos
    createdAt: new Date(2022, 0, 1).toISOString(),
    lastLogin: new Date().toISOString(),
  },
]

// Guardar usuarios iniciales en AsyncStorage
const initializeUsers = async () => {
  try {
    const existingUsers = await AsyncStorage.getItem("users")
    if (!existingUsers) {
      await AsyncStorage.setItem("users", JSON.stringify(MOCK_USERS))
    }
  } catch (error) {
    console.error("Error initializing users:", error)
  }
}

// Inicializar usuarios
initializeUsers()

// Obtener todos los usuarios
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersJson = await AsyncStorage.getItem("users")
    return usersJson ? JSON.parse(usersJson) : []
  } catch (error) {
    console.error("Error getting all users:", error)
    return []
  }
}

// Obtener usuario por ID
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const users = await getAllUsers()
    return users.find((user) => user.id === userId) || null
  } catch (error) {
    console.error(`Error getting user with ID ${userId}:`, error)
    return null
  }
}

// Obtener usuario por email
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const users = await getAllUsers()
    return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null
  } catch (error) {
    console.error(`Error getting user with email ${email}:`, error)
    return null
  }
}

// Crear nuevo usuario
export const createUser = async (userData: Omit<User, "id" | "createdAt">): Promise<User | null> => {
  try {
    // Verificar si ya existe un usuario con ese email
    const existingUser = await getUserByEmail(userData.email)
    if (existingUser) {
      throw new Error("Ya existe un usuario con ese email")
    }

    const users = await getAllUsers()
    const newUser: User = {
      ...userData,
      id: generateUniqueId(),
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    await AsyncStorage.setItem("users", JSON.stringify(users))
    return newUser
  } catch (error) {
    console.error("Error creating user:", error)
    return null
  }
}

// Actualizar usuario
export const updateUser = async (userId: string, userData: Partial<User>): Promise<User | null> => {
  try {
    const users = await getAllUsers()
    const userIndex = users.findIndex((user) => user.id === userId)

    if (userIndex === -1) {
      throw new Error(`No se encontró usuario con ID ${userId}`)
    }

    // Si se está actualizando el email, verificar que no exista otro usuario con ese email
    if (userData.email && userData.email !== users[userIndex].email) {
      const existingUser = await getUserByEmail(userData.email)
      if (existingUser && existingUser.id !== userId) {
        throw new Error("Ya existe un usuario con ese email")
      }
    }

    const updatedUser = {
      ...users[userIndex],
      ...userData,
    }

    users[userIndex] = updatedUser
    await AsyncStorage.setItem("users", JSON.stringify(users))
    return updatedUser
  } catch (error) {
    console.error(`Error updating user with ID ${userId}:`, error)
    return null
  }
}

// Eliminar usuario
export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const users = await getAllUsers()
    const filteredUsers = users.filter((user) => user.id !== userId)

    if (filteredUsers.length === users.length) {
      throw new Error(`No se encontró usuario con ID ${userId}`)
    }

    await AsyncStorage.setItem("users", JSON.stringify(filteredUsers))
    return true
  } catch (error) {
    console.error(`Error deleting user with ID ${userId}:`, error)
    return false
  }
}

// Actualizar último login
export const updateLastLogin = async (userId: string): Promise<boolean> => {
  try {
    const user = await getUserById(userId)
    if (!user) {
      throw new Error(`No se encontró usuario con ID ${userId}`)
    }

    await updateUser(userId, { lastLogin: new Date().toISOString() })
    return true
  } catch (error) {
    console.error(`Error updating last login for user with ID ${userId}:`, error)
    return false
  }
}

// Obtener usuarios por rol
export const getUsersByRole = async (role: UserRole): Promise<User[]> => {
  try {
    const users = await getAllUsers()
    return users.filter((user) => user.role === role)
  } catch (error) {
    console.error(`Error getting users with role ${role}:`, error)
    return []
  }
}

// Verificar credenciales (para login)
export const verifyCredentials = async (email: string, password: string): Promise<User | null> => {
  try {
    // En una aplicación real, aquí se verificaría la contraseña con hash
    // Para esta demo, asumimos que los usuarios de MOCK_USERS tienen contraseña "123456"
    const user = await getUserByEmail(email)

    if (user && password === "123456") {
      await updateLastLogin(user.id)
      return user
    }

    return null
  } catch (error) {
    console.error(`Error verifying credentials for ${email}:`, error)
    return null
  }
}

export default {
  getAllUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
  updateLastLogin,
  getUsersByRole,
  verifyCredentials,
}
