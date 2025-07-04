"use client"

import { useState } from "react"
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, Alert, Switch } from "react-native"
import { Feather } from "@expo/vector-icons"
import { useAuth } from "../context/auth-context"
import { useNavigation } from "@react-navigation/native"

export default function ProfileScreen() {
  const { user, logout } = useAuth()
  const navigation = useNavigation()
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)

  // Manejar cierre de sesión
  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Está seguro que desea cerrar sesión?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Cerrar Sesión",
        onPress: async () => {
          try {
            await logout()
            // No es necesario navegar manualmente, el AppNavigator detectará el cambio de estado de autenticación
          } catch (error) {
            console.error("Error al cerrar sesión:", error)
            Alert.alert("Error", "No se pudo cerrar sesión. Intente nuevamente.")
          }
        },
        style: "destructive",
      },
    ])
  }

  // Obtener texto según rol
  const getRoleText = (role) => {
    switch (role) {
      case "client":
        return "Cliente"
      case "technician":
        return "Técnico"
      default:
        return "Usuario"
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image source={user?.profilePic || require("../assets/autoflowx-logo.png")} style={styles.profileImage} />
        <Text style={styles.name}>{user?.name || "Usuario"}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{getRoleText(user?.role)}</Text>
        </View>
        <Text style={styles.email}>{user?.email || "usuario@ejemplo.com"}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuración de la Cuenta</Text>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Feather name="user" size={20} color="#1a73e8" />
            <Text style={styles.menuItemText}>Editar Perfil</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Feather name="lock" size={20} color="#1a73e8" />
            <Text style={styles.menuItemText}>Cambiar Contraseña</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#999" />
        </TouchableOpacity>

        <View style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Feather name="moon" size={20} color="#1a73e8" />
            <Text style={styles.menuItemText}>Modo Oscuro</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: "#e1e4e8", true: "#1a73e8" }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Feather name="bell" size={20} color="#1a73e8" />
            <Text style={styles.menuItemText}>Notificaciones</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: "#e1e4e8", true: "#1a73e8" }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Soporte</Text>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Feather name="help-circle" size={20} color="#1a73e8" />
            <Text style={styles.menuItemText}>Centro de Ayuda</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Feather name="message-circle" size={20} color="#1a73e8" />
            <Text style={styles.menuItemText}>Contactar Soporte</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Feather name="info" size={20} color="#1a73e8" />
            <Text style={styles.menuItemText}>Acerca de AutoFlowX</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Feather name="log-out" size={20} color="#fff" />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Image source={require("../assets/autoflowx-logo.png")} style={styles.footerLogo} resizeMode="contain" />
        <Text style={styles.versionText}>Versión 1.0.0</Text>
        <Text style={styles.copyrightText}>© {new Date().getFullYear()} AutoFlowX. Todos los derechos reservados.</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#fff",
    padding: 24,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e4e8",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  roleBadge: {
    backgroundColor: "#e8f0fe",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 8,
  },
  roleText: {
    fontSize: 12,
    color: "#1a73e8",
    fontWeight: "500",
  },
  email: {
    fontSize: 14,
    color: "#666",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 8,
    margin: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 12,
  },
  logoutButton: {
    backgroundColor: "#e53935",
    borderRadius: 8,
    margin: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 8,
  },
  footer: {
    alignItems: "center",
    padding: 24,
    marginBottom: 16,
  },
  footerLogo: {
    width: 120,
    height: 40,
    marginBottom: 8,
  },
  versionText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
})
