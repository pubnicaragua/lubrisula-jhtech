"use client"  
  
import { useState, useCallback, useEffect } from "react"  
import {  
  StyleSheet,  
  View,  
  Text,  
  TouchableOpacity,  
  ScrollView,  
  ActivityIndicator,  
  Alert,  
  TextInput,  
  Modal,  
  FlatList,  
  SafeAreaView,  
  RefreshControl,  
} from "react-native"  
import { Feather } from "@expo/vector-icons"  
import { useFocusEffect } from "@react-navigation/native"  
import { useAuth } from "../context/auth-context"  
// Importaciones corregidas para usar servicios de Supabase  
import * as clientService from "../services/supabase/client-service"  
import * as orderService from "../services/supabase/order-service"  
import * as vehicleService from "../services/supabase/vehicle-service"  
import * as accessService from "../services/supabase/access-service"  
import * as userService from "../services/supabase/user-service"  
  
// Tipos TypeScript para resolver errores  
interface ClientsScreenProps {  
  navigation: any  
}  
  
interface ClientType {  
  id: string  
  nombre: string  
  email?: string  
  telefono?: string  
  direccion?: string  
  fecha_registro?: string  
  activo?: boolean  
}  
  
interface OrderType {  
  id: string  
  numero_orden: string  
  descripcion: string  
  estado: string  
  client_id: string  
  costo?: number  
  fecha_creacion: string  
}  
  
interface VehicleType {  
  id: string  
  marca: string  
  modelo: string  
  año: number  
  placa: string  
  client_id: string  
}  
  
interface ClientStatsType {  
  totalOrders: number  
  totalSpent: number  
  lastOrderDate?: string  
  vehicleCount: number  
}  
  
export default function ClientsScreen({ navigation }: ClientsScreenProps) {  
  const { user } = useAuth()  
    
  const [clients, setClients] = useState<ClientType[]>([])  
  const [filteredClients, setFilteredClients] = useState<ClientType[]>([])  
  const [clientStats, setClientStats] = useState<Record<string, ClientStatsType>>({})  
  const [loading, setLoading] = useState(true)  
  const [refreshing, setRefreshing] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
    
  // Estados de búsqueda y filtros  
  const [searchQuery, setSearchQuery] = useState("")  
  const [showFilters, setShowFilters] = useState(false)  
  const [sortBy, setSortBy] = useState<"name" | "date" | "orders">("name")  
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")  
  
  // Cargar datos de clientes  
  const loadClientsData = useCallback(async () => {  
    try {  
      setLoading(true)  
      setRefreshing(true)  
      setError(null)  
  
      if (!user?.id) return  
  
      // Validar permisos del usuario  
      const userTallerId = await userService.getTallerId(user.id)  
      const userPermissions = await accessService.getUserPermissions(user.id, userTallerId)  
      setUserRole(userPermissions?.rol || 'client')  
  
      if (userPermissions?.rol === 'client') {  
        setError("No tienes permisos para ver la lista de clientes")  
        return  
      }  
  
      // Cargar clientes  
      const allClients = await clientService.getAllClients()  
      setClients(allClients)  
  
      // Cargar estadísticas para cada cliente  
      const stats: Record<string, ClientStatsType> = {}  
        
      for (const client of allClients) {  
        const [clientOrders, clientVehicles] = await Promise.all([  
          orderService.getOrdersByClientId(client.id),  
          vehicleService.getVehiclesByClientId(client.id)  
        ])  
  
        const totalSpent = clientOrders.reduce((sum: number, order: OrderType) => sum + (order.costo || 0), 0)  
        const lastOrder = clientOrders  
          .sort((a: OrderType, b: OrderType) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime())[0]  
  
        stats[client.id] = {  
          totalOrders: clientOrders.length,  
          totalSpent,  
          lastOrderDate: lastOrder?.fecha_creacion,  
          vehicleCount: clientVehicles.length  
        }  
      }  
  
      setClientStats(stats)  
      applyFiltersAndSort(allClients, searchQuery, sortBy, sortOrder)  
  
    } catch (error) {  
      console.error("Error loading clients data:", error)  
      setError("No se pudieron cargar los datos de clientes")  
    } finally {  
      setLoading(false)  
      setRefreshing(false)  
    }  
  }, [user, searchQuery, sortBy, sortOrder])  
  
  useFocusEffect(  
    useCallback(() => {  
      loadClientsData()  
    }, [loadClientsData])  
  )  
  
  // Aplicar filtros y ordenamiento  
  const applyFiltersAndSort = (clientsList: ClientType[], query: string, sortField: string, order: string) => {  
    let filtered = clientsList.filter((client: ClientType) =>  
      client.nombre.toLowerCase().includes(query.toLowerCase()) ||  
      (client.email && client.email.toLowerCase().includes(query.toLowerCase())) ||  
      (client.telefono && client.telefono.includes(query))  
    )  
  
    // Ordenar  
    filtered.sort((a: ClientType, b: ClientType) => {  
      let comparison = 0  
        
      switch (sortField) {  
        case "name":  
          comparison = a.nombre.localeCompare(b.nombre)  
          break  
        case "date":  
          const dateA = new Date(a.fecha_registro || 0).getTime()  
          const dateB = new Date(b.fecha_registro || 0).getTime()  
          comparison = dateA - dateB  
          break  
        case "orders":  
          const ordersA = clientStats[a.id]?.totalOrders || 0  
          const ordersB = clientStats[b.id]?.totalOrders || 0  
          comparison = ordersA - ordersB  
          break  
      }  
  
      return order === "desc" ? -comparison : comparison  
    })  
  
    setFilteredClients(filtered)  
  }  
  
  // Manejar búsqueda  
  const handleSearch = (query: string) => {  
    setSearchQuery(query)  
    applyFiltersAndSort(clients, query, sortBy, sortOrder)  
  }  
  
  // Manejar ordenamiento  
  const handleSort = (field: "name" | "date" | "orders") => {  
    const newOrder = sortBy === field && sortOrder === "asc" ? "desc" : "asc"  
    setSortBy(field)  
    setSortOrder(newOrder)  
    applyFiltersAndSort(clients, searchQuery, field, newOrder)  
  }  
  
  // Renderizar item de cliente  
  const renderClientItem = ({ item }: { item: ClientType }) => {  
    const stats = clientStats[item.id] || { totalOrders: 0, totalSpent: 0, vehicleCount: 0 }  
      
    return (  
      <TouchableOpacity  
        style={styles.clientCard}  
        onPress={() => navigation.navigate("ClientDetail", { clientId: item.id })}  
      >  
        <View style={styles.clientHeader}>  
          <View style={styles.clientAvatar}>  
          <Feather name="user" size={24} color="#1a73e8" />  
          </View>  
          <View style={styles.clientInfo}>  
            <Text style={styles.clientName}>{item.nombre}</Text>  
            <Text style={styles.clientEmail}>{item.email}</Text>  
            <Text style={styles.clientPhone}>{item.telefono}</Text>  
          </View>  
        </View>  
  
        <View style={styles.clientStats}>  
          <View style={styles.statItem}>  
            <Text style={styles.statValue}>{stats.totalOrders}</Text>  
            <Text style={styles.statLabel}>Órdenes</Text>  
          </View>  
          <View style={styles.statDivider} />  
          <View style={styles.statItem}>  
            <Text style={styles.statValue}>{stats.vehicleCount}</Text>  
            <Text style={styles.statLabel}>Vehículos</Text>  
          </View>  
          <View style={styles.statDivider} />  
          <View style={styles.statItem}>  
            <Text style={styles.statValue}>${stats.totalSpent.toFixed(0)}</Text>  
            <Text style={styles.statLabel}>Gastado</Text>  
          </View>  
        </View>  
  
        <Feather name="chevron-right" size={20} color="#999" />  
      </TouchableOpacity>  
    )  
  }  
  
  if (loading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#1a73e8" />  
        <Text style={styles.loadingText}>Cargando clientes...</Text>  
      </View>  
    )  
  }  
  
  if (error) {  
    return (  
      <View style={styles.errorContainer}>  
        <Feather name="alert-circle" size={64} color="#f44336" />  
        <Text style={styles.errorText}>{error}</Text>  
        <TouchableOpacity style={styles.retryButton} onPress={loadClientsData}>  
          <Text style={styles.retryButtonText}>Reintentar</Text>  
        </TouchableOpacity>  
      </View>  
    )  
  }  
  
  return (  
    <SafeAreaView style={styles.container}>  
      <View style={styles.header}>  
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>  
          <Feather name="arrow-left" size={24} color="#333" />  
        </TouchableOpacity>  
        <Text style={styles.headerTitle}>Clientes</Text>  
        <TouchableOpacity   
          style={styles.addButton}   
          onPress={() => navigation.navigate("NewClient")}  
        >  
          <Feather name="plus" size={24} color="#1a73e8" />  
        </TouchableOpacity>  
      </View>  
  
      <View style={styles.searchContainer}>  
        <View style={styles.searchInputContainer}>  
          <Feather name="search" size={20} color="#666" />  
          <TextInput  
            style={styles.searchInput}  
            placeholder="Buscar cliente..."  
            value={searchQuery}  
            onChangeText={handleSearch}  
          />  
          {searchQuery.length > 0 && (  
            <TouchableOpacity onPress={() => handleSearch("")}>  
              <Feather name="x" size={20} color="#666" />  
            </TouchableOpacity>  
          )}  
        </View>  
        <TouchableOpacity   
          style={styles.filterButton}   
          onPress={() => setShowFilters(true)}  
        >  
          <Feather name="filter" size={20} color="#1a73e8" />  
        </TouchableOpacity>  
      </View>  
  
      <View style={styles.sortContainer}>  
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>  
          <TouchableOpacity  
            style={[styles.sortButton, sortBy === "name" && styles.sortButtonActive]}  
            onPress={() => handleSort("name")}  
          >  
            <Text style={[styles.sortButtonText, sortBy === "name" && styles.sortButtonTextActive]}>  
              Nombre {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}  
            </Text>  
          </TouchableOpacity>  
            
          <TouchableOpacity  
            style={[styles.sortButton, sortBy === "date" && styles.sortButtonActive]}  
            onPress={() => handleSort("date")}  
          >  
            <Text style={[styles.sortButtonText, sortBy === "date" && styles.sortButtonTextActive]}>  
              Fecha {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}  
            </Text>  
          </TouchableOpacity>  
            
          <TouchableOpacity  
            style={[styles.sortButton, sortBy === "orders" && styles.sortButtonActive]}  
            onPress={() => handleSort("orders")}  
          >  
            <Text style={[styles.sortButtonText, sortBy === "orders" && styles.sortButtonTextActive]}>  
              Órdenes {sortBy === "orders" && (sortOrder === "asc" ? "↑" : "↓")}  
            </Text>  
          </TouchableOpacity>  
        </ScrollView>  
      </View>  
  
      <FlatList  
        data={filteredClients}  
        keyExtractor={(item) => item.id}  
        renderItem={renderClientItem}  
        refreshControl={  
          <RefreshControl refreshing={refreshing} onRefresh={loadClientsData} />  
        }  
        ListEmptyComponent={  
          <View style={styles.emptyContainer}>  
            <Feather name="users" size={48} color="#ccc" />  
            <Text style={styles.emptyText}>No se encontraron clientes</Text>  
          </View>  
        }  
        contentContainerStyle={styles.listContent}  
      />  
    </SafeAreaView>  
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
  header: {  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "space-between",  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    backgroundColor: "#fff",  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  backButton: {  
    padding: 8,  
  },  
  headerTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  addButton: {  
    padding: 8,  
  },  
  searchContainer: {  
    flexDirection: "row",  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    backgroundColor: "#fff",  
    gap: 12,  
  },  
  searchInputContainer: {  
    flex: 1,  
    flexDirection: "row",  
    alignItems: "center",  
    backgroundColor: "#f8f9fa",  
    borderRadius: 8,  
    paddingHorizontal: 12,  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  searchInput: {  
    flex: 1,  
    paddingVertical: 12,  
    fontSize: 16,  
    color: "#333",  
    marginLeft: 8,  
  },  
  filterButton: {  
    width: 44,  
    height: 44,  
    borderRadius: 8,  
    backgroundColor: "#f8f9fa",  
    justifyContent: "center",  
    alignItems: "center",  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  sortContainer: {  
    backgroundColor: "#fff",  
    paddingVertical: 8,  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  sortButton: {  
    paddingHorizontal: 16,  
    paddingVertical: 8,  
    borderRadius: 16,  
    marginHorizontal: 4,  
    backgroundColor: "#f8f9fa",  
  },  
  sortButtonActive: {  
    backgroundColor: "#e6f0ff",  
  },  
  sortButtonText: {  
    fontSize: 14,  
    color: "#666",  
  },  
  sortButtonTextActive: {  
    color: "#1a73e8",  
    fontWeight: "500",  
  },  
  listContent: {  
    padding: 16,  
  },  
  clientCard: {  
    backgroundColor: "#fff",  
    borderRadius: 8,  
    padding: 16,  
    marginBottom: 12,  
    flexDirection: "row",  
    alignItems: "center",  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 1 },  
    shadowOpacity: 0.1,  
    shadowRadius: 2,  
    elevation: 2,  
  },  
  clientHeader: {  
    flexDirection: "row",  
    alignItems: "center",  
    flex: 1,  
  },  
  clientAvatar: {  
    width: 48,  
    height: 48,  
    borderRadius: 24,  
    backgroundColor: "#f5f5f5",  
    justifyContent: "center",  
    alignItems: "center",  
    marginRight: 12,  
  },  
  clientInfo: {  
    flex: 1,  
  },  
  clientName: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 2,  
  },  
  clientEmail: {  
    fontSize: 12,  
    color: "#666",  
    marginBottom: 2,  
  },  
  clientPhone: {  
    fontSize: 12,  
    color: "#666",  
  },  
  clientStats: {  
    flexDirection: "row",  
    alignItems: "center",  
    marginRight: 12,  
  },  
  statItem: {  
    alignItems: "center",  
    paddingHorizontal: 8,  
  },  
  statValue: {  
    fontSize: 14,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  statLabel: {  
    fontSize: 10,  
    color: "#666",  
  },  
  statDivider: {  
    width: 1,  
    height: 24,  
    backgroundColor: "#e1e4e8",  
  },  
  emptyContainer: {  
    alignItems: "center",  
    justifyContent: "center",  
    paddingVertical: 40,  
  },  
  emptyText: {  
    fontSize: 16,  
    color: "#999",  
    marginTop: 12,  
  },  
})