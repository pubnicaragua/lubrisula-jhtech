"use client"  
import { useEffect, useState } from "react"  
import { HojaIngresoSignatureModal } from './components/HojaIngresoSignatureModal'  
import { useHojaIngresoDetection } from './hooks/useHojaIngresoDetection'  
import { NavigationContainer } from "@react-navigation/native"  
import { StatusBar } from "expo-status-bar"  
import { SafeAreaProvider } from "react-native-safe-area-context"  
import { View, Text, ActivityIndicator, StyleSheet } from "react-native"  
import AppNavigator from "./navigation/app-navigator"  
import { AuthProvider } from "./context/auth-context"  
  
// ✅ CORREGIDO: Importaciones de servicios de Supabase  
import { clientService } from "./services/supabase/client-service"  
import { vehicleService } from "./services/supabase/vehicle-service"  
import { orderService } from "./services/supabase/order-service"  
import { inventoryService } from "./services/supabase/inventory-service"  
import userService from "./services/supabase/user-service"  
  

// Wrapper to use hoja ingreso detection inside AuthProvider
function HojaIngresoDetectionWrapper() {
  const { showModal, currentHoja, setShowModal } = useHojaIngresoDetection()
  return (
    <HojaIngresoSignatureModal
      visible={showModal}
      hoja={currentHoja}
      onClose={() => setShowModal(false)}
      onSigned={() => {}}
    />
  )
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true)
        await Promise.all([
          userService.initializeUsers(),
          clientService.initializeClients(),
          vehicleService.initializeVehicles(),
          orderService.initializeOrders(),
          inventoryService.getAllInventory().then(() => console.log("Inventory initialized")),
        ])
        console.log("Datos inicializados correctamente con Supabase")
      } catch (error) {
        console.error("Error al inicializar datos:", error)
        setError("Error al inicializar la aplicación. Por favor, verifique su conexión a internet y reinicie.")
      } finally {
        setIsLoading(false)
      }
    }
    initializeData()
  }, [])

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
        <Text style={styles.loadingSubtext}>Conectando con Supabase...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorSubtext}>
          Verifique su conexión a internet e intente nuevamente reiniciando la aplicación.
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <AppNavigator />
          <HojaIngresoDetectionWrapper />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
  
const styles = StyleSheet.create({  
  loadingContainer: {  
    flex: 1,  
    justifyContent: "center",  
    alignItems: "center",  
    backgroundColor: "#f8f9fa",  
  },  
  loadingText: {  
    marginTop: 10,  
    fontSize: 16,  
    color: "#666",  
  },  
  loadingSubtext: {  
    marginTop: 5,  
    fontSize: 14,  
    color: "#999",  
  },  
  errorContainer: {  
    flex: 1,  
    justifyContent: "center",  
    alignItems: "center",  
    padding: 20,  
    backgroundColor: "#f8f9fa",  
  },  
  errorText: {  
    fontSize: 16,  
    color: "#f44336",  
    textAlign: "center",  
    marginBottom: 10,  
  },  
  errorSubtext: {  
    fontSize: 14,  
    color: "#666",  
    textAlign: "center",  
  },  
})