"use client"  
  
import { useState, useCallback, useEffect } from "react"  
import {  
  View,  
  Text,  
  ScrollView,  
  StyleSheet,  
  ActivityIndicator,  
  RefreshControl,  
  Dimensions,  
  TouchableOpacity,  
} from "react-native"  
import { Feather, MaterialIcons } from "@expo/vector-icons"  
import { useFocusEffect } from "@react-navigation/native"  
import { LineChart, BarChart, PieChart } from "react-native-chart-kit"  
import { useAuth } from "../context/auth-context"  
import dashboardService from "../services/supabase/dashboard-service"
import { orderService } from "../services/supabase/order-service"  
import { clientService } from "../services/supabase/client-service"  
import { vehicleService } from "../services/supabase/vehicle-service"  
import { inventoryService } from "../services/supabase/inventory-service"  
import ACCESOS_SERVICES from "../services/supabase/access-service"  
import USER_SERVICE from "../services/supabase/user-service"  
import { Order } from '../types/order'  
import { Client } from '../types'  
import { Vehicle } from '../types/entities'  
  
const { width: screenWidth } = Dimensions.get("window")  
  
interface AnalyticsData {  
  revenueStats: {  
    thisMonth: number  
    lastMonth: number  
    percentageChange: number  
    dailyRevenue: Array<{ date: string; amount: number }>  
  }  
  clientStats: {  
    totalClients: number  
    newThisMonth: number  
    activeClients: number  
    percentageChange: number  
  }  
  orderStats: {  
    totalOrders: number  
    completedOrders: number  
    pendingOrders: number  
    averageOrderValue: number  
    statusDistribution: Array<{ status: string; count: number; color: string }>  
  }  
  inventoryStats: {  
    totalItems: number  
    lowStockItems: number  
    outOfStockItems: number  
    totalValue: number  
  }  
  vehicleStats: {  
    totalVehicles: number  
    activeVehicles: number  
    vehiclesByBrand: Array<{ brand: string; count: number }>  
  }  
}  
  
interface AnalyticsScreenProps {  
  navigation: any  
}  
  
export default function AnalyticsScreen({ navigation }: AnalyticsScreenProps) {  
  const { user } = useAuth()  
  const [loading, setLoading] = useState(true)  
  const [refreshing, setRefreshing] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)  
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month')  
  
  const loadAnalyticsData = useCallback(async () => {  
    try {  
      setLoading(true)  
      setRefreshing(true)  
      setError(null)  
  
      if (!user?.id) return  
  
      // Validar permisos del usuario  
      const userId = user.id as string  
      const userTallerId = await USER_SERVICE.GET_TALLER_ID(userId)  
      if (!userTallerId) {  
        setError("No se pudo obtener la información del taller")  
        return  
      }  
  
      const userPermissions = await ACCESOS_SERVICES.GET_PERMISOS_USUARIO(userId, userTallerId)  
      setUserRole(userPermissions?.role || 'client')  
  
      // Solo permitir acceso a admin y técnicos  
      if (userPermissions?.role === 'client') {  
        setError("No tienes permisos para ver las analíticas del sistema")  
        return  
      }  
  
      // Cargar datos base  
      const [orders, clients, vehicles, inventory] = await Promise.all([  
        orderService.getAllOrders(),  
        clientService.getAllClients(),  
        vehicleService.getAllVehicles(),  
        inventoryService.getAllInventory()  
      ])  
  
      // Calcular estadísticas de ingresos  
      const revenueStats = await calculateRevenueStats(orders)  
        
      // Calcular estadísticas de clientes  
      const clientStats = calculateClientStats(clients, orders)  
        
      // Calcular estadísticas de órdenes  
      const orderStats = calculateOrderStats(orders)  
        
      // Calcular estadísticas de inventario  
      const inventoryStats = calculateInventoryStats(inventory)  
        
      // Calcular estadísticas de vehículos  
      const vehicleStats = calculateVehicleStats(vehicles, orders)  
  
      setAnalyticsData({  
        revenueStats,  
        clientStats,  
        orderStats,  
        inventoryStats,  
        vehicleStats  
      })  
  
    } catch (error) {  
      console.error("Error loading analytics data:", error)  
      setError("No se pudieron cargar los datos de analíticas")  
    } finally {  
      setLoading(false)  
      setRefreshing(false)  
    }  
  }, [user, selectedPeriod])  
  
  useFocusEffect(  
    useCallback(() => {  
      loadAnalyticsData()  
    }, [loadAnalyticsData])  
  )  
  
  const calculateRevenueStats = async (orders: Order[]) => {  
    const now = new Date()  
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)  
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)  
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)  
  
    const thisMonthOrders = orders.filter(order => {  
      // ✅ CORREGIDO: Manejar undefined en constructor Date  
      const orderDate = new Date(order.createdAt || '')  
      return orderDate >= thisMonth && order.status === "completed"  
    })  
  
    const lastMonthOrders = orders.filter(order => {  
      // ✅ CORREGIDO: Manejar undefined en constructor Date  
      const orderDate = new Date(order.createdAt || '')  
      return orderDate >= lastMonth && orderDate <= lastMonthEnd && order.status === "completed"  
    })  
  
    const thisMonthRevenue = thisMonthOrders.reduce((sum, order) => sum + (order.total || 0), 0)  
    const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + (order.total || 0), 0)  
        
    const percentageChange = lastMonthRevenue > 0   
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100   
      : 0  
  
    // Generar ingresos diarios de los últimos 7 días  
    const dailyRevenue = []  
    for (let i = 6; i >= 0; i--) {  
      const date = new Date()  
      date.setDate(date.getDate() - i)  
      const dayOrders = orders.filter(order => {  
        // ✅ CORREGIDO: Manejar undefined en constructor Date  
        const orderDate = new Date(order.createdAt || '')  
        return orderDate.toDateString() === date.toDateString() && order.status === "completed"  
      })  
      dailyRevenue.push({  
        date: date.toISOString().split('T')[0],  
        amount: dayOrders.reduce((sum, order) => sum + (order.total || 0), 0)  
      })  
    }  
  
    return {  
      thisMonth: thisMonthRevenue,  
      lastMonth: lastMonthRevenue,  
      percentageChange,  
      dailyRevenue  
    }  
  }  
  
  const calculateClientStats = (clients: Client[], orders: Order[]) => {  
    const now = new Date()  
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)  
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)  
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)  
  
    const newThisMonth = clients.filter(client => {  
      // ✅ CORREGIDO: Usar created_at en lugar de createdAt  
      const clientDate = new Date(client.created_at)  
      return clientDate >= thisMonth  
    }).length  
  
    const newLastMonth = clients.filter(client => {  
      // ✅ CORREGIDO: Usar created_at en lugar de createdAt  
      const clientDate = new Date(client.created_at)  
      return clientDate >= lastMonth && clientDate <= lastMonthEnd  
    }).length  
  
    const activeClients = clients.filter(client => {  
      return orders.some(order => order.clientId === client.id)  
    }).length  
  
    const percentageChange = newLastMonth > 0   
      ? ((newThisMonth - newLastMonth) / newLastMonth) * 100   
      : 0  
  
    return {  
      totalClients: clients.length,  
      newThisMonth,  
      activeClients,  
      percentageChange  
    }  
  }  
  
  const calculateOrderStats = (orders: Order[]) => {  
    const completedOrders = orders.filter(order =>   
      order.status === "completed" || order.status === "delivered"  
    )  
    const pendingOrders = orders.filter(order =>   
      order.status !== "completed" && order.status !== "delivered" && order.status !== "cancelled"  
    )  
  
    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.total || 0), 0)  
    const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0  
  
    // Distribución por estado  
    const statusCounts = orders.reduce((acc, order) => {  
      acc[order.status] = (acc[order.status] || 0) + 1  
      return acc  
    }, {} as Record<string, number>)  
  
    const statusColors = {  
      'reception': '#ff9800',  
      'diagnosis': '#2196f3',  
      'waiting_parts': '#9c27b0',  
      'in_progress': '#ff5722',  
      'quality_check': '#607d8b',  
      'completed': '#4caf50',  
      'delivered': '#8bc34a',  
      'cancelled': '#f44336'  
    }  
  
    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({  
      status,  
      count,  
      color: statusColors[status as keyof typeof statusColors] || '#666'  
    }))  
  
    return {  
      totalOrders: orders.length,  
      completedOrders: completedOrders.length,  
      pendingOrders: pendingOrders.length,  
      averageOrderValue,  
      statusDistribution  
    }  
  }  
  
  const calculateInventoryStats = (inventory: any[]) => {  
    const lowStockItems = inventory.filter(item => (item.cantidad || item.stock || 0) <= 5)  
    const outOfStockItems = inventory.filter(item => (item.cantidad || item.stock || 0) === 0)  
    const totalValue = inventory.reduce((sum, item) => {  
      const stock = item.cantidad || item.stock || 0  
      const price = item.precio_unitario || item.priceUSD || 0  
      return sum + (stock * price)  
    }, 0)  
  
    return {  
      totalItems: inventory.length,  
      lowStockItems: lowStockItems.length,  
      outOfStockItems: outOfStockItems.length,  
      totalValue  
    }  
  }  
  
  const calculateVehicleStats = (vehicles: Vehicle[], orders: Order[]) => {  
    const activeVehicles = vehicles.filter(vehicle => {  
      return orders.some(order => order.vehicleId === vehicle.id)  
    })  
  
    // Agrupar por marca  
    const brandCounts = vehicles.reduce((acc, vehicle) => {  
      const brand = vehicle.marca || 'Sin marca'  
      acc[brand] = (acc[brand] || 0) + 1  
      return acc  
    }, {} as Record<string, number>)  
  
    const vehiclesByBrand = Object.entries(brandCounts)  
      .map(([brand, count]) => ({ brand, count }))  
      .sort((a, b) => b.count - a.count)  
      .slice(0, 5) // Top 5 marcas  
  
    return {  
      totalVehicles: vehicles.length,  
      activeVehicles: activeVehicles.length,  
      vehiclesByBrand  
    }  
  }  
  
  const formatCurrency = (amount: number) => {  
    return amount.toLocaleString("es-ES", {  
      style: "currency",  
      currency: "USD",  
      minimumFractionDigits: 0,  
      maximumFractionDigits: 0,  
    })  
  }  
  
  const formatPercentage = (value: number) => {  
    const sign = value >= 0 ? '+' : ''  
    return `${sign}${value.toFixed(1)}%`  
  }  
  
  const onRefresh = () => {  
    setRefreshing(true)  
    loadAnalyticsData()  
  }  
  
  if (loading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#1a73e8" />  
        <Text style={styles.loadingText}>Cargando analíticas...</Text>  
      </View>  
    )  
  }  
  
  if (error) {  
    return (  
      <View style={styles.errorContainer}>  
        <MaterialIcons name="error" size={64} color="#f44336" />  
        <Text style={styles.errorText}>{error}</Text>  
        <TouchableOpacity style={styles.retryButton} onPress={loadAnalyticsData}>  
          <Text style={styles.retryButtonText}>Reintentar</Text>  
        </TouchableOpacity>  
      </View>  
    )  
  }  
  
  if (!analyticsData) {  
    return (  
      <View style={styles.errorContainer}>  
        <Text style={styles.errorText}>No hay datos disponibles</Text>  
      </View>  
    )  
  }  
  
  const chartConfig = {  
    backgroundColor: "#ffffff",  
    backgroundGradientFrom: "#ffffff",  
    backgroundGradientTo: "#ffffff",  
    decimalPlaces: 0,  
    color: (opacity = 1) => `rgba(26, 115, 232, ${opacity})`,  
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,  
    style: {  
      borderRadius: 16  
    },  
    propsForDots: {  
      r: "6",  
      strokeWidth: "2",  
      stroke: "#1a73e8"  
    }  
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
        <Text style={styles.headerTitle}>Analíticas del Taller</Text>  
        <View style={styles.periodSelector}>  
          {(['week', 'month', 'quarter'] as const).map((period) => (  
            <TouchableOpacity  
            key={period}  
            style={[  
              styles.periodButton,  
              selectedPeriod === period && styles.periodButtonActive  
            ]}  
            onPress={() => setSelectedPeriod(period)}  
          >  
            <Text style={[  
              styles.periodButtonText,  
              selectedPeriod === period && styles.periodButtonTextActive  
            ]}>  
              {period === 'week' ? 'Semana' : period === 'month' ? 'Mes' : 'Trimestre'}  
            </Text>  
          </TouchableOpacity>  
        ))}  
      </View>  
    </View>  

    {/* Estadísticas de Ingresos */}  
    <View style={styles.section}>  
      <Text style={styles.sectionTitle}>Ingresos</Text>  
      <View style={styles.statsRow}>  
        <View style={styles.statCard}>  
          <Text style={styles.statLabel}>Este Mes</Text>  
          <Text style={styles.statValue}>{formatCurrency(analyticsData.revenueStats.thisMonth)}</Text>  
          <Text style={[  
            styles.statChange,  
            { color: analyticsData.revenueStats.percentageChange >= 0 ? '#4caf50' : '#f44336' }  
          ]}>  
            {formatPercentage(analyticsData.revenueStats.percentageChange)}  
          </Text>  
        </View>  
        <View style={styles.statCard}>  
          <Text style={styles.statLabel}>Mes Anterior</Text>  
          <Text style={styles.statValue}>{formatCurrency(analyticsData.revenueStats.lastMonth)}</Text>  
        </View>  
      </View>  

      {/* Gráfico de Ingresos Diarios */}  
      <View style={styles.chartContainer}>  
        <Text style={styles.chartTitle}>Ingresos Últimos 7 Días</Text>  
        <LineChart  
          data={{  
            labels: analyticsData.revenueStats.dailyRevenue.map(item =>   
              new Date(item.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })  
            ),  
            datasets: [{  
              data: analyticsData.revenueStats.dailyRevenue.map(item => item.amount)  
            }]  
          }}  
          width={screenWidth - 32}  
          height={220}  
          chartConfig={chartConfig}  
          bezier  
          style={styles.chart}  
        />  
      </View>  
    </View>  

    {/* Estadísticas de Clientes */}  
    <View style={styles.section}>  
      <Text style={styles.sectionTitle}>Clientes</Text>  
      <View style={styles.statsRow}>  
        <View style={styles.statCard}>  
          <Text style={styles.statLabel}>Total</Text>  
          <Text style={styles.statValue}>{analyticsData.clientStats.totalClients}</Text>  
        </View>  
        <View style={styles.statCard}>  
          <Text style={styles.statLabel}>Nuevos Este Mes</Text>  
          <Text style={styles.statValue}>{analyticsData.clientStats.newThisMonth}</Text>  
          <Text style={[  
            styles.statChange,  
            { color: analyticsData.clientStats.percentageChange >= 0 ? '#4caf50' : '#f44336' }  
          ]}>  
            {formatPercentage(analyticsData.clientStats.percentageChange)}  
          </Text>  
        </View>  
        <View style={styles.statCard}>  
          <Text style={styles.statLabel}>Activos</Text>  
          <Text style={styles.statValue}>{analyticsData.clientStats.activeClients}</Text>  
        </View>  
      </View>  
    </View>  

    {/* Estadísticas de Órdenes */}  
    <View style={styles.section}>  
      <Text style={styles.sectionTitle}>Órdenes de Trabajo</Text>  
      <View style={styles.statsRow}>  
        <View style={styles.statCard}>  
          <Text style={styles.statLabel}>Total</Text>  
          <Text style={styles.statValue}>{analyticsData.orderStats.totalOrders}</Text>  
        </View>  
        <View style={styles.statCard}>  
          <Text style={styles.statLabel}>Completadas</Text>  
          <Text style={styles.statValue}>{analyticsData.orderStats.completedOrders}</Text>  
        </View>  
        <View style={styles.statCard}>  
          <Text style={styles.statLabel}>Pendientes</Text>  
          <Text style={styles.statValue}>{analyticsData.orderStats.pendingOrders}</Text>  
        </View>  
        <View style={styles.statCard}>  
          <Text style={styles.statLabel}>Valor Promedio</Text>  
          <Text style={styles.statValue}>{formatCurrency(analyticsData.orderStats.averageOrderValue)}</Text>  
        </View>  
      </View>  

      {/* Gráfico de Distribución de Estados */}  
      <View style={styles.chartContainer}>  
        <Text style={styles.chartTitle}>Distribución por Estado</Text>  
        <BarChart  
  data={{  
    labels: analyticsData.orderStats.statusDistribution.map(item =>   
      item.status.substring(0, 8)  
    ),  
    datasets: [{  
      data: analyticsData.orderStats.statusDistribution.map(item => item.count)  
    }]  
  }}  
  width={screenWidth - 32}  
  height={220}  
  chartConfig={chartConfig}  
  style={styles.chart}  
  verticalLabelRotation={30}  
  // ✅ AGREGAR estas propiedades requeridas  
  yAxisLabel=""  
  yAxisSuffix=""  
/>
      </View>  
    </View>  

    {/* Estadísticas de Inventario */}  
    <View style={styles.section}>  
      <Text style={styles.sectionTitle}>Inventario</Text>  
      <View style={styles.statsRow}>  
        <View style={styles.statCard}>  
          <Text style={styles.statLabel}>Total Items</Text>  
          <Text style={styles.statValue}>{analyticsData.inventoryStats.totalItems}</Text>  
        </View>  
        <View style={styles.statCard}>  
          <Text style={styles.statLabel}>Stock Bajo</Text>  
          <Text style={[styles.statValue, { color: '#ff9800' }]}>  
            {analyticsData.inventoryStats.lowStockItems}  
          </Text>  
        </View>  
        <View style={styles.statCard}>  
          <Text style={styles.statLabel}>Sin Stock</Text>  
          <Text style={[styles.statValue, { color: '#f44336' }]}>  
            {analyticsData.inventoryStats.outOfStockItems}  
          </Text>  
        </View>  
        <View style={styles.statCard}>  
          <Text style={styles.statLabel}>Valor Total</Text>  
          <Text style={styles.statValue}>{formatCurrency(analyticsData.inventoryStats.totalValue)}</Text>  
        </View>  
      </View>  
    </View>  

    {/* Estadísticas de Vehículos */}  
    <View style={styles.section}>  
      <Text style={styles.sectionTitle}>Vehículos</Text>  
      <View style={styles.statsRow}>  
        <View style={styles.statCard}>  
          <Text style={styles.statLabel}>Total</Text>  
          <Text style={styles.statValue}>{analyticsData.vehicleStats.totalVehicles}</Text>  
        </View>  
        <View style={styles.statCard}>  
          <Text style={styles.statLabel}>Activos</Text>  
          <Text style={styles.statValue}>{analyticsData.vehicleStats.activeVehicles}</Text>  
        </View>  
      </View>  

      {/* Gráfico de Vehículos por Marca */}  
      <View style={styles.chartContainer}>  
        <Text style={styles.chartTitle}>Top 5 Marcas</Text>  
        {analyticsData.vehicleStats.vehiclesByBrand.length > 0 && (  
          <PieChart  
            data={analyticsData.vehicleStats.vehiclesByBrand.map((item, index) => ({  
              name: item.brand,  
              population: item.count,  
              color: `hsl(${index * 60}, 70%, 50%)`,  
              legendFontColor: "#333",  
              legendFontSize: 12  
            }))}  
            width={screenWidth - 32}  
            height={220}  
            chartConfig={chartConfig}  
            accessor="population"  
            backgroundColor="transparent"  
            paddingLeft="15"  
            style={styles.chart}  
          />  
        )}  
      </View>  
    </View>  
  </ScrollView>  
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
  backgroundColor: "#fff",  
  padding: 20,  
  borderBottomWidth: 1,  
  borderBottomColor: "#e1e4e8",  
},  
headerTitle: {  
  fontSize: 24,  
  fontWeight: "bold",  
  color: "#333",  
  marginBottom: 16,  
},  
periodSelector: {  
  flexDirection: "row",  
  backgroundColor: "#f5f5f5",  
  borderRadius: 8,  
  padding: 4,  
},  
periodButton: {  
  flex: 1,  
  paddingVertical: 8,  
  paddingHorizontal: 12,  
  borderRadius: 6,  
  alignItems: "center",  
},  
periodButtonActive: {  
  backgroundColor: "#1a73e8",  
},  
periodButtonText: {  
  fontSize: 14,  
  color: "#666",  
  fontWeight: "500",  
},  
periodButtonTextActive: {  
  color: "#fff",  
  fontWeight: "600",  
},  
section: {  
  backgroundColor: "#fff",  
  margin: 16,  
  borderRadius: 12,  
  padding: 20,  
  shadowColor: "#000",  
  shadowOffset: { width: 0, height: 2 },  
  shadowOpacity: 0.1,  
  shadowRadius: 4,  
  elevation: 3,  
},  
sectionTitle: {  
  fontSize: 18,  
  fontWeight: "bold",  
  color: "#333",  
  marginBottom: 16,  
},  
statsRow: {  
  flexDirection: "row",  
  flexWrap: "wrap",  
  gap: 12,  
},  
statCard: {  
  backgroundColor: "#f8f9fa",  
  borderRadius: 8,  
  padding: 16,  
  flex: 1,  
  minWidth: "45%",  
  alignItems: "center",  
},  
statLabel: {  
  fontSize: 12,  
  color: "#666",  
  marginBottom: 8,  
  textAlign: "center",  
},  
statValue: {  
  fontSize: 20,  
  fontWeight: "bold",  
  color: "#333",  
  marginBottom: 4,  
  textAlign: "center",  
},  
statChange: {  
  fontSize: 12,  
  fontWeight: "600",  
},  
chartContainer: {  
  marginTop: 20,  
},  
chartTitle: {  
  fontSize: 16,  
  fontWeight: "600",  
  color: "#333",  
  marginBottom: 12,  
  textAlign: "center",  
},  
chart: {  
  borderRadius: 16,  
},  
})