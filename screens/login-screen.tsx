"use client"

import { useState } from "react"
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native"
import { useAuth } from "../context/auth-context"
import { isValidEmail } from "../utils/helpers"
import { userService } from "../services/supabase/user-service"
import { accessService } from "../services/supabase/access-service"
import orderService from "../services/supabase/order-service"

export default function LoginScreen() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")

  // Validar formulario  
  const validateForm = () => {
    let isValid = true

    // Validar email  
    if (!email.trim()) {
      setEmailError("El correo electrónico es obligatorio")
      isValid = false
    } else if (!isValidEmail(email)) {
      setEmailError("Ingrese un correo electrónico válido")
      isValid = false
    } else {
      setEmailError("")
    }

    // Validar contraseña  
    if (!password.trim()) {
      setPasswordError("La contraseña es obligatoria")
      isValid = false
    } else if (password.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres")
      isValid = false
    } else {
      setPasswordError("")
    }

    return isValid
  }

  // Manejar inicio de sesión con Supabase  
  const handleLogin = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      // Verificar credenciales usando servicios de Supabase  
      const { user, error } = await userService.signIn(email, password)
      if (error) {
        Alert.alert("Error de inicio de sesión", "No se pudo completar el inicio de sesión.")
        return
      }
      if (user) {
        // Obtener permisos del usuario  
        const userTallerId = await userService.GET_TALLER_ID(user.id)
        if (!userTallerId) {
          Alert.alert("Error", "No se pudo obtener el taller del usuario")
          return
        }
        const userPermissions = await accessService.GET_PERMISOS_USUARIO(user.id, userTallerId)
        if (user) {
          const success = await login(user.email, password)
          if (!success) {
            Alert.alert("Error de inicio de sesión", "No se pudo completar el inicio de sesión.")
          }
        }
        // Crear objeto de usuario completo  
        const authenticatedUser = {
          ...user,
          permissions: userPermissions?.permisos || [],
          role: userPermissions?.rol || 'client',
          tallerId: userTallerId
        }

        if (!authenticatedUser.email) {
          Alert.alert("Error", "No se pudo obtener el email del usuario")
          return
        }

        const success = await userService.signIn(authenticatedUser.email, password)
        if (!success) {
          Alert.alert("Error de inicio de sesión", "No se pudo completar el inicio de sesión.")
        }
      } else {
        Alert.alert("Error de inicio de sesión", "Credenciales incorrectas. Por favor, inténtelo de nuevo.")
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      Alert.alert("Error", "No se pudo iniciar sesión. Por favor, inténtelo de nuevo más tarde.")
    } finally {
      setIsLoading(false)
    }
  }

  // Mostrar credenciales de demostración  
  const showDemoCredentials = async () => {
    const orders = await orderService.getAllOrders()
    console.log(orders)
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <Image source={require("../assets/autoflowx-logo.png")} style={styles.logo} resizeMode="contain" />
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Iniciar Sesión</Text>
          <Text style={styles.subtitle}>Ingrese sus credenciales para acceder al sistema</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Correo Electrónico</Text>
            <TextInput
              style={[styles.input, emailError ? styles.inputError : null]}
              placeholder="correo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={[styles.input, passwordError ? styles.inputError : null]}
              placeholder="Contraseña"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.demoButton} onPress={showDemoCredentials}>
            <Text style={styles.demoButtonText}>Ver credenciales de demostración</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>AutoFlowX © {new Date().getFullYear()} - Todos los derechos reservados</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// Estilos permanecen iguales...  
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 200,
    height: 100,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a73e8",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: "#e53935",
  },
  errorText: {
    color: "#e53935",
    fontSize: 12,
    marginTop: 4,
  },
  loginButton: {
    backgroundColor: "#1a73e8",
    borderRadius: 6,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  demoButton: {
    marginTop: 16,
    padding: 8,
    alignItems: "center",
  },
  demoButtonText: {
    color: "#1a73e8",
    fontSize: 14,
  },
  footer: {
    marginTop: 40,
    alignItems: "center",
  },
  footerText: {
    color: "#666",
    fontSize: 12,
  },
})