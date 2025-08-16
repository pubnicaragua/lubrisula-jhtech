import React, { useState, useEffect } from 'react'  
import {  
  View,  
  Text,  
  StyleSheet,  
  ScrollView,  
  TouchableOpacity,  
  RefreshControl,  
  ActivityIndicator,  
  Alert,  
  Dimensions  
} from 'react-native'  
import { useAuth } from '../context/auth-context'  
import dashboardService from '../services/supabase/dashboard-service'  
import { MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons'  
import { useNavigation } from '@react-navigation/native'  
import type { StackNavigationProp } from '@react-navigation/stack'  
  
const { width } = Dimensions.get('window')  
  
interface DashboardStats {  
  totalOrders: number  
  pendingOrders: number  
  completedOrders: number  
  totalRevenue: number  
  totalClients: number  
  lowStockItems: number  
  upcomingAppointments: number  
}  
  
interface RecentActivity {  
  id: string  
  type: 'order' | 'client' | 'appointment' | 'inventory'  
  title: string  
  description: string  
  timestamp: string  
  status?: string  
}  
  
// ✅ CORREGIDO: Tipos de navegación para tabs anidados  
type RootStackParamList = {  
  OrdersTab: { screen: string; params?: any }  
  ClientsTab: { screen: string; params?: any }  
  InventoryTab: { screen: string; params?: any }  
  ReportsTab: { screen: string; params?: any }  
}  
  
const DashboardScreen: React.FC = () => {  
  const { user } = useAuth()  
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()  
  const [stats, setStats] = useState<DashboardStats | null>(null)  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])  
  const [loading, setLoading] = useState(true)  
  const [refreshing, setRefreshing] = useState(false)  
    
  const userRole = user?.role  
  
  useEffect(() => {  
    loadDashboardData()  
  }, [user, user?.role])  
  
  const loadDashboardData = async () => {  
    if (!user) return  
      
    try {  
      setLoading(true)  
      const [dashboardStats, activity] = await Promise.all([  
        dashboardService.getDashboardStats(user.id, userRole || 'client'),  
        dashboardService.getRecentActivity(user.id, userRole || 'client', 10)  
      ])  
        
      setStats(dashboardStats)  
      setRecentActivity(activity)  
    } catch (error) {  
      console.error('Error loading dashboard data:', error)  
      Alert.alert('Error', 'No se pudo cargar la información del dashboard')  
    } finally {  
      setLoading(false)  
    }  
  }  
  
  const onRefresh = async () => {  
    setRefreshing(true)  
    await loadDashboardData()  
    setRefreshing(false)  
  }  
  
  const formatCurrency = (amount: number) => {  
    return new Intl.NumberFormat('es-HN', {  
      style: 'currency',  
      currency: 'HNL'  
    }).format(amount)  
  }  
  
  const formatDate = (dateString: string) => {  
    const date = new Date(dateString)  
    return date.toLocaleDateString('es-HN', {  
      day: '2-digit',  
      month: '2-digit',  
      year: 'numeric'  
    })  
  }  
  
  const getStatusColor = (status: string) => {  
    switch (status) {  
      case 'completed':  
      case 'delivered':  
        return '#4CAF50'  
      case 'in_progress':  
        return '#2196F3'  
      case 'reception':  
        return '#FF9800'  
      case 'cancelled':  
        return '#F44336'  
      default:  
        return '#757575'  
    }  
  }  
  
  const getStatusText = (status: string) => {  
    switch (status) {  
      case 'completed':  
        return 'Completada'  
      case 'delivered':  
        return 'Entregada'  
      case 'in_progress':  
        return 'En Proceso'  
      case 'reception':  
        return 'Recepción'  
      case 'cancelled':  
        return 'Cancelada'  
      default:  
        return status  
    }  
  }  
  
  // ✅ CORREGIDO: Navegación anidada correcta  
  const handleQuickAction = (action: string) => {  
    switch (action) {  
      case 'newOrder':  
        navigation.navigate('OrdersTab', { screen: 'NewOrder' })  
        break  
      case 'newClient':  
        navigation.navigate('ClientsTab', { screen: 'NewClient' })  
        break  
      case 'inventory':  
        navigation.navigate('InventoryTab', { screen: 'Inventory' })  
        break  
      case 'appointments':  
        Alert.alert('Próximamente', 'Funcionalidad de citas en desarrollo')  
        break  
      default:  
        break  
    }  
  }  
  
  // ✅ CORREGIDO: Navegación de actividad reciente  
  const handleActivityNavigation = (activity: RecentActivity) => {  
    switch (activity.type) {  
      case 'order':  
        navigation.navigate('OrdersTab', {   
          screen: 'OrderDetail',   
          params: { orderId: activity.id }   
        })  
        break  
      case 'client':  
        navigation.navigate('ClientsTab', {   
          screen: 'ClientDetail',   
          params: { clientId: activity.id }   
        })  
        break  
      case 'appointment':  
        Alert.alert('Próximamente', 'Funcionalidad de citas en desarrollo')  
        break  
      default:  
        break  
    }  
  }  
  
  if (loading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#2196F3" />  
        <Text style={styles.loadingText}>Cargando dashboard...</Text>  
      </View>  
    )  
  }  
  
  return (  
    <ScrollView  
      style={styles.container}  
      refreshControl={  
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />  
      }  
    >  
      {/* Header */}  
      <View style={styles.header}>  
        <Text style={styles.headerTitle}>Dashboard</Text>  
        <Text style={styles.headerSubtitle}>  
          Bienvenido, {user?.name || user?.email || 'Usuario'}  
        </Text>  
      </View>  
  
      {/* Quick Actions */}  
      {userRole !== 'client' && (  
        <View style={styles.quickActionsContainer}>  
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>  
          <View style={styles.quickActionsGrid}>  
            <TouchableOpacity  
              style={styles.quickActionButton}  
              onPress={() => handleQuickAction('newOrder')}  
            >  
              <MaterialIcons name="add-circle" size={24} color="#2196F3" />  
              <Text style={styles.quickActionText}>Nueva Orden</Text>  
            </TouchableOpacity>  
              
            <TouchableOpacity  
              style={styles.quickActionButton}  
              onPress={() => handleQuickAction('newClient')}  
            >  
              <MaterialIcons name="person-add" size={24} color="#4CAF50" />  
              <Text style={styles.quickActionText}>Nuevo Cliente</Text>  
            </TouchableOpacity>  
              
            <TouchableOpacity  
              style={styles.quickActionButton}  
              onPress={() => handleQuickAction('inventory')}  
            >  
              <MaterialIcons name="inventory" size={24} color="#FF9800" />  
              <Text style={styles.quickActionText}>Inventario</Text>  
            </TouchableOpacity>  
              
            <TouchableOpacity  
              style={styles.quickActionButton}  
              onPress={() => handleQuickAction('appointments')}  
            >  
              <MaterialIcons name="event" size={24} color="#9C27B0" />  
              <Text style={styles.quickActionText}>Citas</Text>  
            </TouchableOpacity>  
          </View>  
        </View>  
      )}  
  
      {/* Stats Cards */}  
      {stats && (  
        <View style={styles.statsContainer}>  
          <Text style={styles.sectionTitle}>Estadísticas Generales</Text>  
          <View style={styles.statsGrid}>  
            <View style={styles.statCard}>  
              <View style={styles.statIconContainer}>  
                <MaterialIcons name="assignment" size={24} color="#2196F3" />  
              </View>  
              <View style={styles.statContent}>  
                <Text style={styles.statValue}>{stats.totalOrders}</Text>  
                <Text style={styles.statLabel}>Total Órdenes</Text>  
              </View>  
            </View>  
  
            <View style={styles.statCard}>  
              <View style={styles.statIconContainer}>  
                <MaterialIcons name="pending" size={24} color="#FF9800" />  
              </View>  
              <View style={styles.statContent}>  
                <Text style={styles.statValue}>{stats.pendingOrders}</Text>  
                <Text style={styles.statLabel}>Pendientes</Text>  
              </View>  
            </View>  
  
            <View style={styles.statCard}>  
              <View style={styles.statIconContainer}>  
                <MaterialIcons name="check-circle" size={24} color="#4CAF50" />  
              </View>  
              <View style={styles.statContent}>  
                <Text style={styles.statValue}>{stats.completedOrders}</Text>  
                <Text style={styles.statLabel}>Completadas</Text>  
              </View>  
            </View>  
  
            <View style={styles.statCard}>  
              <View style={styles.statIconContainer}>  
                <MaterialIcons name="attach-money" size={24} color="#4CAF50" />  
              </View>  
              <View style={styles.statContent}>  
                <Text style={styles.statValue}>  
                  {formatCurrency(stats.totalRevenue)}  
                </Text>  
                <Text style={styles.statLabel}>Ingresos</Text>  
              </View>  
            </View>  
  
            {userRole !== 'client' && (  
              <>  
                <View style={styles.statCard}>  
                  <View style={styles.statIconContainer}>  
                    <MaterialIcons name="people" size={24} color="#9C27B0" />  
                  </View>  
                  <View style={styles.statContent}>  
                    <Text style={styles.statValue}>{stats.totalClients}</Text>  
                    <Text style={styles.statLabel}>Clientes</Text>  
                  </View>  
                </View>  
  
                <View style={styles.statCard}>  
                  <View style={styles.statIconContainer}>  
                    <MaterialIcons name="warning" size={24} color="#F44336" />  
                  </View>  
                  <View style={styles.statContent}>  
                    <Text style={styles.statValue}>{stats.lowStockItems}</Text>  
                    <Text style={styles.statLabel}>Stock Bajo</Text>  
                  </View>  
                </View>  
              </>  
            )}  
  
            <View style={styles.statCard}>  
              <View style={styles.statIconContainer}>  
                <MaterialIcons name="event" size={24} color="#9C27B0" />  
              </View>  
              <View style={styles.statContent}>  
                <Text style={styles.statValue}>{stats.upcomingAppointments}</Text>  
                <Text style={styles.statLabel}>Próximas Citas</Text>  
              </View>  
            </View>  
          </View>  
        </View>  
      )}  
  
      {/* Recent Activity */}  
      <View style={styles.activityContainer}>  
        <Text style={styles.sectionTitle}>Actividad Reciente</Text>  
        {recentActivity.length > 0 ? (  
          recentActivity.map((activity, index) => (  
            <TouchableOpacity  
              key={`${activity.id}-${index}`}  
              style={styles.activityItem}  
              onPress={() => handleActivityNavigation(activity)}  
            >  
              <View style={styles.activityIconContainer}>  
                {activity.type === 'order' && (  
                  <MaterialIcons name="assignment" size={20} color="#2196F3" />  
                )}  
                {activity.type === 'client' && (  
                  <MaterialIcons name="person" size={20} color="#4CAF50" />  
                )}  
                {activity.type === 'appointment' && (  
                  <MaterialIcons name="event" size={20} color="#9C27B0" />  
                )}  
                {activity.type === 'inventory' && (  
                  <MaterialIcons name="inventory" size={20} color="#FF9800" />  
                )}  
              </View>  
                
              <View style={styles.activityContent}>  
                <Text style={styles.activityTitle}>{activity.title}</Text>  
                <Text style={styles.activityDescription}>{activity.description}</Text>  
                <Text style={styles.activityTimestamp}>  
                  {formatDate(activity.timestamp)}  
                </Text>  
              </View>  
                
              {activity.status && (  
                <View style={styles.activityStatus}>  
                  <View  
                    style={[  
                      styles.statusDot,  
                      { backgroundColor: getStatusColor(activity.status) }  
                    ]}  
                  />  
                  <Text style={styles.statusText}>  
                    {getStatusText(activity.status)}  
                  </Text>  
                </View>  
              )}  
            </TouchableOpacity>  
          ))  
        ) : (  
          <View style={styles.emptyState}>  
            <MaterialIcons name="info" size={48} color="#757575" />  
            <Text style={styles.emptyStateText}>No hay actividad reciente</Text>  
          </View>  
        )}  
      </View>  
  
      {/* Bottom Spacing */}  
      <View style={styles.bottomSpacing} />  
    </ScrollView>  
  )  
}  
  
const styles = StyleSheet.create({  
  container: {  
    flex: 1,  
    backgroundColor: '#f5f5f5'  
  },  
  loadingContainer: {  
    flex: 1,  
    justifyContent: 'center',  
    alignItems: 'center',  
    backgroundColor: '#f5f5f5'  
  },  
  loadingText: {  
    marginTop: 16,  
    fontSize: 16,  
    color: '#757575'  
  },  
  header: {  
    backgroundColor: '#2196F3',  
    padding: 20,  
    paddingTop: 40  
  },  
  headerTitle: {  
    fontSize: 24,  
    fontWeight: 'bold',  
    color: 'white',  
    marginBottom: 4  
  },  
  headerSubtitle: {  
    fontSize: 16,  
    color: 'rgba(255, 255, 255, 0.8)'  
  },  
  quickActionsContainer: {  
    padding: 20,  
    backgroundColor: 'white',  
    margin: 16,  
    borderRadius: 12,  
    elevation: 2,  
    shadowColor: '#000',  
    shadowOffset: { width: 0, height: 2 },  
shadowOpacity: 0.1,  
shadowRadius: 4  
},  
sectionTitle: {  
fontSize: 18,  
fontWeight: 'bold',  
color: '#333',  
marginBottom: 16  
},  
quickActionsGrid: {  
flexDirection: 'row',  
flexWrap: 'wrap',  
justifyContent: 'space-between'  
},  
quickActionButton: {  
width: (width - 80) / 2,  
alignItems: 'center',  
padding: 16,  
backgroundColor: '#f8f9fa',  
borderRadius: 8,  
marginBottom: 12  
},  
quickActionText: {  
marginTop: 8,  
fontSize: 14,  
color: '#333',  
textAlign: 'center'  
},  
statsContainer: {  
padding: 20,  
backgroundColor: 'white',  
margin: 16,  
borderRadius: 12,  
elevation: 2,  
shadowColor: '#000',  
shadowOffset: { width: 0, height: 2 },  
shadowOpacity: 0.1,  
shadowRadius: 4  
},  
statsGrid: {  
flexDirection: 'row',  
flexWrap: 'wrap',  
justifyContent: 'space-between'  
},  
statCard: {  
width: (width - 80) / 2,  
flexDirection: 'row',  
alignItems: 'center',  
padding: 16,  
backgroundColor: '#f8f9fa',  
borderRadius: 8,  
marginBottom: 12  
},  
statIconContainer: {  
width: 40,  
height: 40,  
borderRadius: 20,  
backgroundColor: 'rgba(33, 150, 243, 0.1)',  
justifyContent: 'center',  
alignItems: 'center',  
marginRight: 12  
},  
statContent: {  
flex: 1  
},  
statValue: {  
fontSize: 18,  
fontWeight: 'bold',  
color: '#333',  
marginBottom: 2  
},  
statLabel: {  
fontSize: 12,  
color: '#757575'  
},  
activityContainer: {  
padding: 20,  
backgroundColor: 'white',  
margin: 16,  
borderRadius: 12,  
elevation: 2,  
shadowColor: '#000',  
shadowOffset: { width: 0, height: 2 },  
shadowOpacity: 0.1,  
shadowRadius: 4  
},  
activityItem: {  
flexDirection: 'row',  
alignItems: 'center',  
padding: 16,  
borderBottomWidth: 1,  
borderBottomColor: '#f0f0f0'  
},  
activityIconContainer: {  
width: 40,  
height: 40,  
borderRadius: 20,  
backgroundColor: '#f8f9fa',  
justifyContent: 'center',  
alignItems: 'center',  
marginRight: 12  
},  
activityContent: {  
flex: 1  
},  
activityTitle: {  
fontSize: 16,  
fontWeight: '600',  
color: '#333',  
marginBottom: 4  
},  
activityDescription: {  
fontSize: 14,  
color: '#757575',  
marginBottom: 4  
},  
activityTimestamp: {  
fontSize: 12,  
color: '#999'  
},  
activityStatus: {  
flexDirection: 'row',  
alignItems: 'center'  
},  
statusDot: {  
width: 8,  
height: 8,  
borderRadius: 4,  
marginRight: 6  
},  
statusText: {  
fontSize: 12,  
color: '#757575'  
},  
emptyState: {  
alignItems: 'center',  
padding: 40  
},  
emptyStateText: {  
marginTop: 16,  
fontSize: 16,  
color: '#757575',  
textAlign: 'center'  
},  
bottomSpacing: {  
height: 20  
}  
})  

export default DashboardScreen