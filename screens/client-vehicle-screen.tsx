"use client"  
  
import { useState, useCallback, useEffect } from "react"  
import {  
  View,  
  Text,  
  FlatList,  
  TouchableOpacity,  
  StyleSheet,  
  ActivityIndicator,  
  RefreshControl,  
  Alert,  
} from "react-native"  
import { Feather, MaterialIcons } from "@expo/vector-icons"  
import { useFocusEffect } from "@react-navigation/native"  
import { useAuth } from "../context/auth-context"  
import { vehicleService } from "../services/supabase/vehicle-service"  
import { clientService } from "../services/supabase/client-service"  
import { supabase } from '../lib/supabase'
  
interface ClientVehicleScreenProps {  
  route: any  
  navigation: any  
}  
  
export default function ClientVehicleScreen({ route, navigation }: ClientVehicleScreenProps) {  
  const { user } = useAuth()  
  const [client, setClient] = useState<any>(null)  
  const [vehicles, setVehicles] = useState<any[]>([])  
  const [loading, setLoading] = useState(true)  
  const [refreshing, setRefreshing] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  
  // Cliente por user_id
  const loadClientVehicles = useCallback(async () => {  
    try {  
      setLoading(true)  
      setError(null)  
  
      if (!user?.id) {  
        setError("Usuario no autenticado")  
        return  
      }  
  
      // Intentar obtener cliente, si no existe, crearlo automáticamente  
      let clientData = await clientService.getClientByUserId(user.id)  
      if (!clientData) {  
        // Obtener datos del perfil para crear el cliente automáticamente  
        const { data: profile } = await supabase  
          .from('perfil_usuario')  
          .select('*')  
          .eq('auth_id', user.id)  
          .single()  
        if (profile && (profile.role === 'client' || profile.role === 'cliente')) {  
          // Crear cliente automáticamente  
          const { data: newClient, error: clientError } = await supabase  
            .from('clients')  
            .insert({  
              user_id: user.id,  
              name: `${profile.nombre} ${profile.apellido}`.trim(),  
              email: profile.correo,  
              phone: profile.telefono || '',  
              company: '',  
              client_type: 'Individual',  
              taller_id: profile.taller_id,  
              activo: true,  
              created_at: new Date().toISOString(),  
              updated_at: new Date().toISOString()  
            })  
            .select()  
            .single()  
          if (clientError) {  
            setError(`Error creando cliente: ${clientError.message}`)  
            return  
          }  
          clientData = newClient  
        } else {  
          setError("Perfil de usuario no encontrado o rol incorrecto")  
          return  
        }  
      }  
      if (clientData) {
        setClient(clientData)
        // Obtener vehículos del cliente  
        const clientVehicles = await vehicleService.getVehiclesByClientId(clientData.id)
        setVehicles(clientVehicles)
      }
  
    } catch (error) {  
      console.error("Error loading client vehicles:", error)  
      setError("No se pudieron cargar los vehículos del cliente")  
    } finally {  
      setLoading(false)  
      setRefreshing(false)  
    }  
  }, [user])  
  
  useFocusEffect(  
    useCallback(() => {  
      loadClientVehicles()  
    }, [loadClientVehicles])  
  )  
  
  const renderVehicleItem = ({ item }: { item: any }) => (  
    <TouchableOpacity  
      style={styles.vehicleCard}  
      onPress={() => navigation.navigate("VehicleDetail", { vehicleId: item.id })}  
    >  
      <View style={styles.vehicleImageContainer}>  
        <View style={styles.noImageContainer}>  
          <Feather name="truck" size={32} color="#ccc" />  
        </View>  
      </View>  
      <View style={styles.vehicleInfo}>  
        <Text style={styles.vehicleName}>  
          {item.marca} {item.modelo}  
        </Text>  
        <Text style={styles.vehicleDetails}>  
          {item.ano} • {item.placa}  
        </Text>  
        <Text style={styles.vehicleKm}>  
          {item.kilometraje?.toLocaleString() || '0'} km  
        </Text>  
        <View style={styles.vehicleStatus}>  
          <View style={[styles.statusIndicator, { backgroundColor: "#4caf50" }]} />  
          <Text style={styles.statusText}>Activo</Text>  
        </View>  
      </View>  
      <View style={styles.vehicleActions}>  
        <Feather name="chevron-right" size={20} color="#ccc" />  
      </View>  
    </TouchableOpacity>  
  )  
  
  if (loading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#1a73e8" />  
        <Text style={styles.loadingText}>Cargando vehículos...</Text>  
      </View>  
    )  
  }  
  
  return (  
    <View style={styles.container}>  
      <View style={styles.header}>  
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>  
          <Feather name="arrow-left" size={24} color="#333" />  
        </TouchableOpacity>  
        <Text style={styles.headerTitle}>Vehículos de {client?.name}</Text>  
      </View>  
  
      {error ? (  
        <View style={styles.errorContainer}>  
          <MaterialIcons name="error" size={64} color="#f44336" />  
          <Text style={styles.errorText}>{error}</Text>  
          <TouchableOpacity style={styles.retryButton} onPress={loadClientVehicles}>  
            <Text style={styles.retryButtonText}>Reintentar</Text>  
          </TouchableOpacity>  
        </View>  
      ) : (  
        <>  
          {vehicles.length === 0 ? (  
            <View style={styles.emptyContainer}>  
              <Feather name="truck" size={64} color="#ccc" />  
              <Text style={styles.emptyText}>No hay vehículos registrados</Text>  
              <Text style={styles.emptySubtext}>Este cliente no tiene vehículos asociados</Text>  
            </View>  
          ) : (  
            <FlatList  
              data={vehicles}  
              keyExtractor={(item) => item.id!}  
              renderItem={renderVehicleItem}  
              refreshControl={  
                <RefreshControl refreshing={refreshing} onRefresh={loadClientVehicles} colors={["#1a73e8"]} />  
              }  
              contentContainerStyle={styles.listContainer}  
              showsVerticalScrollIndicator={false}  
            />  
          )}  
        </>  
      )}  
    </View>  
  )  
}  
  
const styles = StyleSheet.create({  
  container: {  
    flex: 1,  
    backgroundColor: "#f8f9fa",  
  },  
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
  header: {  
    flexDirection: "row",  
    alignItems: "center",  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    backgroundColor: "#fff",  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  backButton: {  
    padding: 8,  
    marginRight: 8,  
  },  
  headerTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
    flex: 1,  
  },  
  errorContainer: {  
    flex: 1,  
    justifyContent: "center",  
    alignItems: "center",  
    padding: 20,  
  },  
  errorText: {  
    fontSize: 16,  
    color: "#f44336",  
    textAlign: "center",  
    marginTop: 16,  
    marginBottom: 20,  
  },  
  retryButton: {  
    backgroundColor: "#1a73e8",  
    paddingHorizontal: 20,  
    paddingVertical: 10,  
    borderRadius: 8,  
  },  
  retryButtonText: {  
    color: "#fff",  
    fontWeight: "bold",  
  },  
  emptyContainer: {  
    flex: 1,  
    justifyContent: "center",  
    alignItems: "center",  
    padding: 40,  
  },  
  emptyText: {  
    fontSize: 18,  
    color: "#999",  
    marginTop: 16,  
    marginBottom: 8,  
    textAlign: "center",  
  },  
  emptySubtext: {  
    fontSize: 14,  
    color: "#ccc",  
    textAlign: "center",  
    marginBottom: 20,  
  },  
  listContainer: {  
    padding: 16,  
  },  
  vehicleCard: {  
    backgroundColor: "#fff",  
    borderRadius: 12,  
    padding: 16,  
    marginBottom: 12,  
    flexDirection: "row",  
    alignItems: "center",  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 2 },  
    shadowOpacity: 0.1,  
    shadowRadius: 4,  
    elevation: 3,  
  },  
  vehicleImageContainer: {  
    width: 60,  
    height: 60,  
    borderRadius: 8,  
    marginRight: 16,  
    overflow: "hidden",  
  },  
  noImageContainer: {  
    width: "100%",  
    height: "100%",  
    backgroundColor: "#f5f5f5",  
    justifyContent: "center",  
    alignItems: "center",  
  },  
  vehicleInfo: {  
    flex: 1,  
  },  
  vehicleName: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 4,  
  },  
  vehicleDetails: {  
    fontSize: 14,  
    color: "#666",  
    marginBottom: 4,  
  },  
  vehicleKm: {  
    fontSize: 14,  
    color: "#999",  
    marginBottom: 8,  
  },  
  vehicleStatus: {  
    flexDirection: "row",  
    alignItems: "center",  
  },  
  statusIndicator: {  
    width: 8,  
    height: 8,  
    borderRadius: 4,  
    marginRight: 6,  
  },  
  statusText: {  
    fontSize: 12,  
    color: "#666",  
  },  
  vehicleActions: {  
    paddingLeft: 16,  
  },  
})