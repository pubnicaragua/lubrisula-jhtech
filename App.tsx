"use client"

import { useEffect, useState } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { StatusBar } from "expo-status-bar"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { View, Text, ActivityIndicator } from "react-native"
import AppNavigator from "./navigation/app-navigator"
import { AuthProvider } from "./context/auth-context"
import * as clientService from "./services/client-service"
import * as vehicleService from "./services/vehicle-service"
import * as orderService from "./services/order-service"
import * as inventoryService from "./services/inventory-service"
import * as currencyService from "./services/currency-service"
import * as companyService from "./services/company-service"
import * as imageService from "./services/image-service"

export default function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Inicializar datos al montar la aplicación
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true)

        // Inicializar todos los servicios
        await Promise.all([
          clientService.initializeClients(),
          vehicleService.initializeVehicles(),
          orderService.initializeOrders(),
          inventoryService.initializeInventory(),
          currencyService.initializeCurrencies(),
          companyService.initializeCompanySettings(),
          imageService.initializeImages(),
        ])

        console.log("Datos inicializados correctamente")
      } catch (error) {
        console.error("Error al inicializar datos:", error)
        setError("Error al inicializar la aplicación. Por favor, reinicie.")
      } finally {
        setIsLoading(false)
      }
    }

    initializeData()
  }, [])

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={{ marginTop: 16, fontSize: 16 }}>Inicializando datos...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ fontSize: 18, color: "red", textAlign: "center", marginBottom: 20 }}>{error}</Text>
        <Text style={{ fontSize: 16, textAlign: "center" }}>
          Verifique su conexión e intente nuevamente reiniciando la aplicación.
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
