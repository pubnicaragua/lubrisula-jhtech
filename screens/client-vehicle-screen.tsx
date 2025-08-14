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
  Image,  
} from "react-native"  
import { Feather, MaterialIcons } from "@expo/vector-icons"  
import { useFocusEffect } from "@react-navigation/native"  
import { useAuth } from "../context/auth-context"  
// ✅ CORREGIDO: Importar servicios y tipos centralizados  
import { vehicleService, Vehicle } from "../services/supabase/vehicle-service"  
import { clientService, Client } from "../services/supabase/client-service"  
import accessService from "../services/supabase/access-service"  
import userService from "../services/supabase/user-service"  
import { ClientVehiclesScreenProps } from "../types"  
  
export default function ClientVehicleScreen({ route, navigation }: ClientVehiclesScreenProps) {  
  const { user } = useAuth()  
  const [clientId, setClientId] = useState<string | null>(null)  
  const [client, setClient] = useState<Client | null>(null)  
  const [vehicles, setVehicles] = useState<Vehicle[]>([])  
  const [loading, setLoading] = useState(true)  
  const [refreshing, setRefreshing] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
  
  useEffect(() => {  
    const getClientId = async () => {  
      if (user?.id) {  
        try {  
          const client = await clientService.getClientById(user.id)  
          setClientId(client?.id || null)  
        } catch (error) {  
          console.error('Error getting client:', error)  
          setClientId(null)  
        }  
      }  
    }  
      
    getClientId()  
  }, [user?.id])  
  
  const loadClientVehicles = useCallback(async () => {  
    try {  
      setLoading(true)  
      setError(null)  
  
      if (!user?.id || !clientId) {  
        setError("Usuario no autenticado o ID de cliente no disponible")  
        return  
      }  
  
      // Validar permisos del usuario  
      const userTallerId = await userService.GET_TALLER_ID(user.id)  
      if (!userTallerId) {  
        setError("No se pudo obtener la información del taller")  
        return  
      }  
  
      const userPermissions = await accessService.GET_PERMISOS_USUARIO(user.id, userTallerId)  
      // ✅ CORREGIDO: Usar 'role' en lugar de 'rol'  
      setUserRole(userPermissions?.role || 'client')  
  
      // Verificar permisos de acceso  
      if (userPermissions?.role === 'client' && clientId !== user.id) {  
        setError("No tienes permisos para ver los vehículos de este cliente")  
        return  
      }  
  
      // Obtener datos del cliente y sus vehículos  
      const [clientData, clientVehicles] = await Promise.all([  
        clientService.getClientById(clientId as string),  
        vehicleService.getVehiclesByClientId(clientId as string)  
      ])  
  
      if (!clientData) {  
        setError("Cliente no encontrado")  
        return  
      }  
  
      setClient(clientData)  
      setVehicles(clientVehicles)  
  
    } catch (error) {  
      console.error("Error loading client vehicles:", error)  
      setError("No se pudieron cargar los vehículos del cliente")  
    } finally {  
      setLoading(false)  
      setRefreshing(false)  
    }  
  }, [clientId, user])  
  
  useFocusEffect(  
    useCallback(() => {  
      loadClientVehicles()  
    }, [loadClientVehicles])  
  )  
  
  const renderVehicleItem = ({ item }: { item: Vehicle }) => (  
    <TouchableOpacity  
      style={styles.vehicleCard}  
      onPress={() => navigation.navigate("VehicleDetail", { vehicleId: item.id })}  
    >  
      <View style={styles.vehicleImageContainer}>  
        {/* ✅ CORREGIDO: Eliminar referencia a images que no existe en el schema */}  
        <View style={styles.noImageContainer}>  
          <Feather name="truck" size={32} color="#ccc" />  
        </View>  
      </View>  
  
      <View style={styles.vehicleInfo}>  
        <Text style={styles.vehicleName}>  
          {/* ✅ CORREGIDO: Usar campos reales del schema de vehículos */}  
          {item.marca} {item.modelo}  
        </Text>  
        <Text style={styles.vehicleDetails}>  
          {item.ano} • {item.placa}  
        </Text>  
        <Text style={styles.vehicleKm}>  
          {/* ✅ CORREGIDO: Manejar kilometraje opcional */}  
          {item.kilometraje?.toLocaleString() || '0'} km  
        </Text>  
          
        <View style={styles.vehicleStatus}>  
          <View style={[  
            styles.statusIndicator,  
            // ✅ CORREGIDO: Eliminar referencia a next_service_date que no existe  
            { backgroundColor: "#4caf50" }  
          ]} />  
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
        {userRole !== 'client' && (  
          <TouchableOpacity   
            style={styles.addButton}  
            onPress={() => navigation.navigate("NewVehicle", { clientId: clientId || "" })}  
          >  
            <Feather name="plus" size={24} color="#1a73e8" />  
          </TouchableOpacity>  
        )}  
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
              <Text style={styles.emptySubtext}>  
                Este cliente no tiene vehículos asociados  
              </Text>  
              {userRole !== 'client' && (  
                <TouchableOpacity   
                  style={styles.emptyActionButton}  
                  onPress={() => navigation.navigate("NewVehicle", { clientId: clientId || "" })}  
                >  
                  <Text style={styles.emptyActionButtonText}>Agregar Vehículo</Text>  
                </TouchableOpacity>  
              )}  
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
  
// Estilos completos del Client Vehicle Screen  
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
  addButton: {  
    padding: 8,  
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
  emptyActionButton: {  
    backgroundColor: "#1a73e8",  
    paddingHorizontal: 20,  
    paddingVertical: 12,  
    borderRadius: 8,  
  },  
  emptyActionButtonText: {  
    color: "#fff",  
    fontWeight: "bold",  
    fontSize: 16,  
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
  vehicleImage: {  
    width: "100%",  
    height: "100%",  
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