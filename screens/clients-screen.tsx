"use client"  
  
import { useState, useCallback, useEffect, useRef } from "react"  
import {  
  View,  
  Text,  
  FlatList,  
  TouchableOpacity,  
  StyleSheet,  
  TextInput,  
  ActivityIndicator,  
  Alert,  
  RefreshControl,  
} from "react-native"  
import { Feather } from "@expo/vector-icons"  
import { useFocusEffect } from "@react-navigation/native"  
import { useAuth } from "../context/auth-context"  
  
// ✅ CORREGIDO: Importar tipos centralizados  
import { Client } from "../services/supabase/client-service"  
import { clientService } from "../services/supabase/client-service"  
import { vehicleService } from "../services/supabase/vehicle-service"  
import { orderService } from "../services/supabase/order-service"  
import accessService from "../services/supabase/access-service"  
import userService from "../services/supabase/user-service"  
import { Order } from '../types/order'  
import { Vehicle } from '../services/supabase/vehicle-service'  
  
interface ClientsScreenProps {  
  navigation: any  
}  
  
interface ClientStatsType {  
  totalOrders: number  
  totalSpent: number  
  vehicleCount: number  
  lastOrderDate?: string  
}  
  
export default function ClientsScreen({ navigation }: ClientsScreenProps) {  
  const { user } = useAuth()  
  
  // ✅ CORREGIDO: Usar tipos centralizados  
  const [clients, setClients] = useState<Client[]>([])  
  const [filteredClients, setFilteredClients] = useState<Client[]>([])  
  const [clientStats, setClientStats] = useState<Record<string, ClientStatsType>>({})  
  const [loading, setLoading] = useState(true)  
  const [refreshing, setRefreshing] = useState(false)  
  const [searchQuery, setSearchQuery] = useState("")  
  const [sortBy, setSortBy] = useState<"name" | "date" | "orders">("name")  
  const [userRole, setUserRole] = useState<string | null>(null)  
  // Paginación
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingMoreRef = useRef(false);
  
  const loadClients = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setPage(1);
        setHasMore(true);
        setClients([]);
      }
      setLoading(true);
      if (!user?.id) return;

      const userTallerId = await userService.GET_TALLER_ID(user.id);
      if (!userTallerId) {
        Alert.alert("Error", "No se pudo cargar la información de permisos");
        return;
      }

      const userPermissions = await accessService.GET_PERMISOS_USUARIO(user.id, userTallerId);
      setUserRole(userPermissions?.role || 'client');

      if (userPermissions?.role === 'client') {
        const clientData = await clientService.getClientByUserId(user.id);
        if (clientData) {
          setClients([clientData]);
          setFilteredClients([clientData]);
        }
        setHasMore(false);
        return;
      }

      // Paginación para staff
      let from = (reset ? 0 : (page - 1) * PAGE_SIZE);
      let to = from + PAGE_SIZE - 1;
  // Cargar clientes primero
  const allClients = await clientService.getAllClients();
  setClients(allClients);
  setFilteredClients(allClients);
  setHasMore(false);

  // Luego cargar datos relacionados
  const [allOrders, allVehicles] = await Promise.all([
    orderService.getAllOrders(),
    vehicleService.getAllVehicles()
      ]);
      const stats: Record<string, ClientStatsType> = {};
  allClients.forEach((client: Client) => {
        const clientOrders = allOrders.filter((order: Order) => order.clientId === client.id);
        const clientVehicles = allVehicles.filter((vehicle: Vehicle) => vehicle.client_id === client.id);
        const totalSpent = clientOrders.reduce((sum: number, order: Order) => sum + (order.total || 0), 0);
        const lastOrder = clientOrders.sort((a: Order, b: Order) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        stats[client.id] = {
          totalOrders: clientOrders.length,
          totalSpent,
          vehicleCount: clientVehicles.length,
          lastOrderDate: lastOrder?.createdAt
        };
      });
      setClientStats(stats);
    } catch (error) {
      console.error('Error loading clients:', error);
      Alert.alert('Error', 'No se pudieron cargar los clientes');
    } finally {
      setLoading(false);
      loadingMoreRef.current = false;
    }
  }, [user?.id, page]);
  
  useFocusEffect(
    useCallback(() => {
      loadClients(true);
    }, [user?.id])
  );

  // Lazy loading: cargar más clientes al llegar al final
  const handleLoadMore = () => {
    if (!loading && hasMore && !loadingMoreRef.current) {
      loadingMoreRef.current = true;
      setPage(prev => prev + 1);
      loadClients();
    }
  };
  
  // Filtrar y ordenar clientes  
  useEffect(() => {  
    let filtered = clients.filter((client: Client) =>  
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||  
      client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||  
      client.phone?.toLowerCase().includes(searchQuery.toLowerCase())  
    )  
  
    // Ordenar según criterio seleccionado  
    filtered.sort((a: Client, b: Client) => {  
      switch (sortBy) {  
        case "name":  
          return a.name.localeCompare(b.name)  
        case "date":  
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()  
        case "orders":  
          const aOrders = clientStats[a.id]?.totalOrders || 0  
          const bOrders = clientStats[b.id]?.totalOrders || 0  
          return bOrders - aOrders  
        default:  
          return 0  
      }  
    })  
  
    setFilteredClients(filtered)  
  }, [clients, searchQuery, sortBy, clientStats])  
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadClients(true);
    setRefreshing(false);
  };
  
  const formatCurrency = (amount: number) => {  
    return amount.toLocaleString("es-ES", {  
      style: "currency",  
      currency: "USD",  
      minimumFractionDigits: 2,  
    })  
  }  
  
  const renderClientCard = ({ item: client }: { item: Client }) => {  
    const stats = clientStats[client.id] || {  
      totalOrders: 0,  
      totalSpent: 0,  
      vehicleCount: 0  
    }  
  
    return (
      <TouchableOpacity
        style={styles.clientCard}
        onPress={() => navigation.navigate("ClientDetail", { clientId: client.id })}
      >
        <View style={styles.clientHeader}>
          <View style={styles.clientAvatar}>
            <Text style={styles.clientInitials}>
              {client.name?.split(" ").map((n: string) => n[0]).join("") || "?"}
            </Text>
          </View>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{client.name}</Text>  
            <View style={styles.clientContact}>  
              <Feather name="phone" size={12} color="#666" />  
              <Text style={styles.contactText}>{client.phone || "Sin teléfono"}</Text>  
            </View>  
            <View style={styles.clientContact}>  
              <Feather name="mail" size={12} color="#666" />  
              <Text style={styles.contactText}>{client.email || "Sin email"}</Text>  
            </View>  
          </View>  
          <View style={styles.clientStats}>  
            <View style={styles.statItem}>  
              <Text style={styles.statValue}>{stats.vehicleCount}</Text>  
              <Text style={styles.statLabel}>Vehículos</Text>  
            </View>  
            <View style={styles.statItem}>  
              <Text style={styles.statValue}>{stats.totalOrders}</Text>  
              <Text style={styles.statLabel}>Órdenes</Text>  
            </View>  
          </View>  
        </View>  
  
        <View style={styles.clientFooter}>  
          <View style={styles.clientMeta}>  
            <Text style={styles.clientType}>{client.client_type || "Individual"}</Text>  
            <Text style={styles.clientDate}>  
              Cliente desde: {new Date(client.created_at).toLocaleDateString("es-ES")}  
            </Text>  
          </View>  
          <View style={styles.clientAmount}>  
            <Text style={styles.totalSpent}>{formatCurrency(stats.totalSpent)}</Text>  
            <Text style={styles.amountLabel}>Total gastado</Text>  
          </View>  
        </View>  
  
        {stats.lastOrderDate && (  
          <View style={styles.lastOrderInfo}>  
            <Feather name="clock" size={12} color="#999" />  
            <Text style={styles.lastOrderText}>  
              Última orden: {new Date(stats.lastOrderDate).toLocaleDateString("es-ES")}  
            </Text>  
          </View>  
        )}  
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
  
  return (  
    <View style={styles.container}>  
      <View style={styles.header}>  
        <Text style={styles.headerTitle}>Clientes</Text>  
        {userRole !== 'client' && (  
          <TouchableOpacity  
            style={styles.addButton}  
            onPress={() => navigation.navigate("NewClient")}  
          >  
            <Feather name="plus" size={24} color="#fff" />  
          </TouchableOpacity>  
        )}  
      </View>  
  
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Feather name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar clientes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
        <View style={styles.sortContainer}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === "date" && styles.sortButtonActive]}
            onPress={() => setSortBy("date")}
          >
            <Text style={[styles.sortButtonText, sortBy === "date" && styles.sortButtonTextActive]}>Fecha</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === "orders" && styles.sortButtonActive]}
            onPress={() => setSortBy("orders")}
          >
            <Text style={[styles.sortButtonText, sortBy === "orders" && styles.sortButtonTextActive]}>Órdenes</Text>
          </TouchableOpacity>
        </View>
      </View>
  
      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item.id}
        renderItem={renderClientCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.loadingText}>Cargando clientes...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No se encontraron clientes</Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={hasMore && !loading ? (
          <View style={{ padding: 16 }}>
            <ActivityIndicator size="small" color="#007bff" />
          </View>
        ) : null}
      />
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
  },
  listContent: {
    paddingBottom: 16,
  },
  header: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    backgroundColor: "#fff",  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  headerTitle: {  
    fontSize: 20,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  addButton: {  
    width: 40,  
    height: 40,  
    borderRadius: 20,  
    backgroundColor: "#1a73e8",  
    justifyContent: "center",  
    alignItems: "center",  
  },  
  searchContainer: {  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    backgroundColor: "#fff",  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  searchInputContainer: {  
    flexDirection: "row",  
    alignItems: "center",  
    backgroundColor: "#f8f9fa",  
    borderRadius: 8,  
    paddingHorizontal: 12,  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  searchIcon: {  
    marginRight: 8,  
  },  
  searchInput: {  
    flex: 1,  
    paddingVertical: 12,  
    fontSize: 16,  
    color: "#333",  
  },  
  sortContainer: {  
    paddingHorizontal: 16,  
    paddingVertical: 8,  
    backgroundColor: "#fff",  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  sortLabel: {  
    fontSize: 14,  
    color: "#666",  
    marginBottom: 8,  
  },  
  sortButtons: {  
    flexDirection: "row",  
    gap: 8,  
  },  
  sortButton: {  
    paddingHorizontal: 12,  
    paddingVertical: 6,  
    borderRadius: 16,  
    backgroundColor: "#f8f9fa",  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  sortButtonActive: {  
    backgroundColor: "#1a73e8",  
    borderColor: "#1a73e8",  
  },  
  sortButtonText: {  
    fontSize: 14,  
    color: "#666",  
  },  
  sortButtonTextActive: {  
    color: "#fff",  
    fontWeight: "500",  
  },  
  listContainer: {  
    padding: 16,  
  },  
  clientCard: {  
    backgroundColor: "#fff",  
    borderRadius: 12,  
    padding: 16,  
    marginBottom: 12,  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 2 },  
    shadowOpacity: 0.1,  
    shadowRadius: 4,  
    elevation: 3,  
  },  
  clientHeader: {  
    flexDirection: "row",  
    alignItems: "center",  
    marginBottom: 12,  
  },  
  clientAvatar: {  
    width: 50,  
    height: 50,  
    borderRadius: 25,  
    backgroundColor: "#1a73e8",  
    justifyContent: "center",  
    alignItems: "center",  
    marginRight: 12,  
  },  
  clientInitials: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#fff",  
  },  
  clientInfo: {  
    flex: 1,  
  },  
  clientName: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 4,  
  },  
  clientContact: {  
    flexDirection: "row",  
    alignItems: "center",  
    marginBottom: 2,  
  },  
  contactText: {  
    fontSize: 12,  
    color: "#666",  
    marginLeft: 4,  
  },  
  clientStats: {  
    flexDirection: "row",  
    gap: 16,  
  },  
  statItem: {  
    alignItems: "center",  
  },  
  statValue: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  statLabel: {  
    fontSize: 10,  
    color: "#666",  
  },  
  clientFooter: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "flex-end",  
    borderTopWidth: 1,  
    borderTopColor: "#f0f0f0",  
    paddingTop: 12,  
  },  
  clientMeta: {  
    flex: 1,  
  },  
  clientType: {  
    fontSize: 12,  
    color: "#1a73e8",  
    fontWeight: "500",  
    marginBottom: 2,  
  },  
  clientDate: {  
    fontSize: 11,  
    color: "#999",  
  },  
  clientAmount: {  
    alignItems: "flex-end",  
  },  
  totalSpent: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#4caf50",  
  },  
  amountLabel: {  
    fontSize: 10,  
    color: "#666",  
  },  
  lastOrderInfo: {  
    flexDirection: "row",  
    alignItems: "center",  
    marginTop: 8,  
    paddingTop: 8,  
    borderTopWidth: 1,  
    borderTopColor: "#f0f0f0",  
  },  
  lastOrderText: {  
    fontSize: 11,  
    color: "#999",  
    marginLeft: 4,  
  },  
  emptyContainer: {  
    alignItems: "center",  
    justifyContent: "center",  
    paddingVertical: 60,  
  },  
  emptyText: {  
    fontSize: 16,  
    color: "#999",  
    marginTop: 16,  
    marginBottom: 20,  
    textAlign: "center",  
  },  
  emptyButton: {  
    backgroundColor: "#1a73e8",  
    paddingHorizontal: 20,  
    paddingVertical: 12,  
    borderRadius: 8,  
  },  
  emptyButtonText: {  
    color: "#fff",  
    fontSize: 14,  
    fontWeight: "bold",  
  },  
})