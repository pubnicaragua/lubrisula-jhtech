"use client"  
  
import { useEffect, useState } from "react"  
import { NavigationContainer } from "@react-navigation/native"  
import { StatusBar } from "expo-status-bar"  
import { SafeAreaProvider } from "react-native-safe-area-context"  
import { View, Text, ActivityIndicator, StyleSheet } from "react-native"  
import AppNavigator from "./navigation/app-navigator"  
import { AuthProvider } from "./context/auth-context"  
// ✅ CORREGIDO: Importaciones actualizadas para usar servicios de Supabase  
import { clientService } from "./services/supabase/client-service"  
import { vehicleService } from "./services/supabase/vehicle-service"  
import { orderService } from "./services/supabase/order-service"  
import { inventoryService } from "./services/supabase/inventory-service"  
import * as currencyService from "./services/supabase/currency-service"  
import * as companyService from "./services/supabase/company-service"  
import * as imageService from "./services/supabase/image-service"  
import * as notificationService from "./services/supabase/notification-service"  
import * as storageService from "./services/supabase/storage-service"  
// ✅ CORREGIDO: Import correcto de userService  
import userService from "./services/supabase/user-service"  
  
export default function App() {  
  const [isLoading, setIsLoading] = useState(true)  
  const [error, setError] = useState<string | null>(null)  
  
  // Inicializar datos al montar la aplicación  
  useEffect(() => {  
    const initializeData = async () => {  
      try {  
        setIsLoading(true)  
  
        // ✅ CORREGIDO: Inicializar servicios con método correcto  
        await Promise.all([  
          userService.initializeUsers(),  
          clientService.initializeClients(),  
          vehicleService.initializeVehicles(),  
          orderService.initializeOrders(),  
          // inventoryService.initializeInventory(),  
          // currencyService.initializeCurrencies(),  
          // companyService.initializeCompanySettings(),  
          // imageService.initializeImages(),  
          // notificationService.initializeNotifications(),  
          // storageService.initializeStorage(),  
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
    marginTop: 16,  
    fontSize: 18,  
    fontWeight: "600",  
    color: "#333",  
  },  
  loadingSubtext: {  
    marginTop: 8,  
    fontSize: 14,  
    color: "#666",  
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
    marginBottom: 16,  
    fontWeight: "600",  
  },  
  errorSubtext: {  
    fontSize: 14,  
    color: "#666",  
    textAlign: "center",  
    lineHeight: 20,  
  },  
})