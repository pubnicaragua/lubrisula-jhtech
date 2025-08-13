"use client"  
  
import { useState, useCallback, useEffect } from "react"  
import {  
  View,  
  Text,  
  ScrollView,  
  TouchableOpacity,  
  StyleSheet,  
  ActivityIndicator,  
  Alert,  
  Dimensions,  
  Modal,  
} from "react-native"  
import { Feather, MaterialIcons } from "@expo/vector-icons"  
import { LineChart, BarChart, PieChart } from "react-native-chart-kit"  
import { useFocusEffect } from "@react-navigation/native"  
import { useNavigation } from '@react-navigation/native'  
import type { StackNavigationProp } from '@react-navigation/stack'  
import { useAuth } from "../context/auth-context"  
import { orderService } from "../services/supabase/order-service"  
import { clientService } from "../services/supabase/client-service"  
import { inventoryService } from "../services/supabase/inventory-service"  
import ACCESOS_SERVICES from "../services/supabase/access-service"  
import USER_SERVICE from "../services/supabase/user-service"  
// ✅ CORREGIDO: Importar tipos centralizados  
import { Order } from '../types/order'  
import { Client } from '../types/entities'  
import { InventoryItem } from '../types/inventory'  
  
interface AnalyticsData {  
  revenue: {  
    total: number  
    monthly: number[]  
    growth: number  
  }  
  orders: {  
    total: number  
    completed: number  
    pending: number  
    cancelled: number  
    averageValue: number  
  }  
  clients: {  
    total: number  
    active: number  
    new: number  
    retention: number  
  }  
  inventory: {  
    totalValue: number  
    lowStock: number  
    topSelling: Array<{ name: string; quantity: number }>  
  }  
  performance: {  
    averageCompletionTime: number  
    customerSatisfaction: number  
    efficiency: number  
  }  
}  
  
export default function AnalyticsScreen() {  
  const { user } = useAuth()  
  const navigation = useNavigation<StackNavigationProp<any>>()  
  const [loading, setLoading] = useState(true)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)  
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "quarter" | "year">("month")  
  const [chartModalVisible, setChartModalVisible] = useState(false)  
  const [selectedChart, setSelectedChart] = useState<string | null>(null)  
  
  const screenWidth = Dimensions.get("window").width - 32  
  
  const loadAnalyticsData = useCallback(async () => {  
    try {  
      setLoading(true)  
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
        
      // ✅ CORREGIDO: Usar 'role' en lugar de 'rol'  
      setUserRole(userPermissions?.role || 'client')  
  
      // Solo staff puede ver analíticas  
      if (userPermissions?.role === 'client') {  
        setError("No tienes permisos para ver las analíticas")  
        return  
      }  
  
      // Cargar datos desde Supabase  
      const [orders, clients, inventory] = await Promise.all([  
        orderService.getAllOrders(),  
        clientService.getAllClients(),  
        inventoryService.getAllInventory()  
      ])  
  
      // Procesar datos para analíticas  
      const analytics = processAnalyticsData(orders, clients, inventory, selectedPeriod)  
      setAnalyticsData(analytics)  
  
    } catch (error) {  
      console.error("Error loading analytics data:", error)  
      setError("No se pudieron cargar los datos de analíticas")  
    } finally {  
      setLoading(false)  
    }  
  }, [user, selectedPeriod])  
  
  useFocusEffect(  
    useCallback(() => {  
      loadAnalyticsData()  
    }, [loadAnalyticsData])  
  )  
  
  const processAnalyticsData = (orders: Order[], clients: Client[], inventory: InventoryItem[], period: string): AnalyticsData => {  
    const now = new Date()  
    const periodStart = getPeriodStart(now, period)  
  
    // Filtrar órdenes por período  
    const periodOrders = orders.filter(order => new Date(order.created_at) >= periodStart)  
    const completedOrders = periodOrders.filter(order => order.status === "completed" || order.status === "delivered")  
  
    // Calcular ingresos  
    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.total || 0), 0)  
    const monthlyRevenue = calculateMonthlyRevenue(orders)  
    const previousPeriodRevenue = calculatePreviousPeriodRevenue(orders, period)  
    const revenueGrowth = previousPeriodRevenue > 0 ? ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 : 0  
  
    // Calcular métricas de órdenes  
    const pendingOrders = periodOrders.filter(order =>  
      !["completed", "delivered", "cancelled"].includes(order.status)  
    ).length  
    const cancelledOrders = periodOrders.filter(order => order.status === "cancelled").length  
    const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0  
  
    // Calcular métricas de clientes  
    const activeClients = getActiveClients(clients, orders, periodStart)  
    const newClients = clients.filter(client => new Date(client.created_at) >= periodStart).length  
    const clientRetention = calculateClientRetention(clients, orders)  
  
    // Calcular métricas de inventario  
    const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.cantidad * (item.precio_unitario || 0)), 0)  
    const lowStockItems = inventory.filter(item => item.cantidad <= (item.minStock || 5)).length  
    const topSellingItems = getTopSellingItems(orders, inventory)  
  
    // Calcular métricas de rendimiento  
    const averageCompletionTime = calculateAverageCompletionTime(completedOrders)  
    const customerSatisfaction = 4.2 // Placeholder - esto vendría de encuestas  
    const efficiency = calculateEfficiency(orders, period)  
  
    return {  
      revenue: {  
        total: totalRevenue,  
        monthly: monthlyRevenue,  
        growth: revenueGrowth  
      },  
      orders: {  
        total: periodOrders.length,  
        completed: completedOrders.length,  
        pending: pendingOrders,  
        cancelled: cancelledOrders,  
        averageValue: averageOrderValue  
      },  
      clients: {  
        total: clients.length,  
        active: activeClients,  
        new: newClients,  
        retention: clientRetention  
      },  
      inventory: {  
        totalValue: totalInventoryValue,  
        lowStock: lowStockItems,  
        topSelling: topSellingItems  
      },  
      performance: {  
        averageCompletionTime,  
        customerSatisfaction,  
        efficiency  
      }  
    }  
  }  
  
  const getPeriodStart = (now: Date, period: string): Date => {  
    const start = new Date(now)  
    switch (period) {  
      case "week":  
        start.setDate(now.getDate() - 7)  
        break  
      case "month":  
        start.setMonth(now.getMonth() - 1)  
        break  
      case "quarter":  
        start.setMonth(now.getMonth() - 3)  
        break  
      case "year":  
        start.setFullYear(now.getFullYear() - 1)  
        break  
    }  
    return start  
  }  
  
  const calculateMonthlyRevenue = (orders: Order[]): number[] => {  
    const months = Array(12).fill(0)  
    const currentYear = new Date().getFullYear()  
  
    orders.forEach(order => {  
      if (order.status === "completed" || order.status === "delivered") {  
        const orderDate = new Date(order.created_at)  
        if (orderDate.getFullYear() === currentYear) {  
          months[orderDate.getMonth()] += order.total || 0  
        }  
      }  
    })  
  
    return months  
  }  
  
  const calculatePreviousPeriodRevenue = (orders: Order[], period: string): number => {  
    const now = new Date()  
    const periodStart = getPeriodStart(now, period)  
    const previousPeriodStart = getPeriodStart(periodStart, period)  
  
    return orders.filter(order => {  
      const orderDate = new Date(order.created_at)  
      return orderDate >= previousPeriodStart && orderDate < periodStart &&  
        (order.status === "completed" || order.status === "delivered")  
    }).reduce((sum, order) => sum + (order.total || 0), 0)  
  }  
  
  const getActiveClients = (clients: Client[], orders: Order[], periodStart: Date): number => {  
    const activeClientIds = new Set(  
      orders.filter(order => new Date(order.created_at) >= periodStart)  
        .map(order => order.clientId)  
    )  
    return activeClientIds.size  
  }  
  
  const calculateClientRetention = (clients: Client[], orders: Order[]): number => {  
    const threeMonthsAgo = new Date()  
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)  
  
    const oldClients = clients.filter(client => new Date(client.created_at) < threeMonthsAgo)  
    const activeOldClients = oldClients.filter(client =>  
      orders.some(order =>  
        order.clientId === client.id &&  
        new Date(order.created_at) >= threeMonthsAgo  
      )  
    )  
  
    return oldClients.length > 0 ? (activeOldClients.length / oldClients.length) * 100 : 0  
  }  
  
  const getTopSellingItems = (orders: Order[], inventory: InventoryItem[]) => {  
    // Placeholder - esto requeriría datos de order_parts  
    return inventory  
      .sort((a, b) => (b.cantidad || 0) - (a.cantidad || 0))  
      .slice(0, 5)  
      .map(item => ({  
        name: item.producto,  
        quantity: item.cantidad || 0  
      }))  
  }  
  
  const calculateAverageCompletionTime = (completedOrders: Order[]): number => {  
    if (completedOrders.length === 0) return 0  
  
    const totalDays = completedOrders.reduce((sum, order) => {  
      const created = new Date(order.created_at)  
      const completed = new Date(order.completionDate || order.updated_at)  
      const days = Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))  
      return sum + days  
    }, 0)  
  
    return totalDays / completedOrders.length  
  }  
  
  const calculateEfficiency = (orders: Order[], period: string): number => {  
    const periodStart = getPeriodStart(new Date(), period)  
    const periodOrders = orders.filter(order => new Date(order.created_at) >= periodStart)  
  
    const completedOnTime = periodOrders.filter(order => {  
      if (!order.estimatedCompletionDate) return true  
      const estimated = new Date(order.estimatedCompletionDate)  
      const actual = new Date(order.completionDate || order.updated_at)  
      return actual <= estimated  
    })  
  
    return periodOrders.length > 0 ? (completedOnTime.length / periodOrders.length) * 100 : 0  
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
    return `${value.toFixed(1)}%`  
  }  
  
  const chartConfig = {  
    backgroundColor: "#ffffff",  
    backgroundGradientFrom: "#ffffff",  
    backgroundGradientTo: "#ffffff",  
    decimalPlaces: 0,  
    color: (opacity = 1) => `rgba(26, 115, 232, ${opacity})`,  
    labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,  
    style: {  
      borderRadius: 16  
    },  
    propsForDots: {  
      r: "6",  
      strokeWidth: "2",  
      stroke: "#1a73e8"  
    }  
  }  
  
  const renderMetricCard = (title: string, value: string, change?: number, icon: string, color: string) => (  
    <View style={[styles.metricCard, { borderLeftColor: color }]}>  
      <View style={styles.metricHeader}>  
        <View style={[styles.metricIcon, { backgroundColor: `${color}20` }]}>  
          <Feather name={icon as any} size={20} color={color} />  
        </View>  
        <Text style={styles.metricTitle}>{title}</Text>  
      </View>  
      <Text style={styles.metricValue}>{value}</Text>  
      {change !== undefined && (  
        <View style={styles.metricChange}>  
          <Feather  
            name={change >= 0 ? "trending-up" : "trending-down"}  
            size={16}  
            color={change >= 0 ? "#4caf50" : "#f44336"}  
          />  
          <Text style={[styles.metricChangeText, { color: change >= 0 ? "#4caf50" : "#f44336" }]}>  
            {Math.abs(change).toFixed(1)}%  
          </Text>  
        </View>  
      )}  
    </View>  
  )  
  
  const renderChartModal = () => (  
    <Modal  
      visible={chartModalVisible}  
      animationType="slide"  
      presentationStyle="pageSheet"  
    >  
      <View style={styles.modalContainer}>  
        <View style={styles.modalHeader}>  
          <Text style={styles.modalTitle}>Gráfico Detallado</Text>  
          <TouchableOpacity  
            onPress={() => setChartModalVisible(false)}  
            style={styles.closeButton}  
          >  
            <Feather name="x" size={24} color="#666" />  
          </TouchableOpacity>  
        </View>  
        <ScrollView style={styles.modalContent}>  
          {selectedChart === "revenue" && analyticsData && (  
            <View style={styles.chartContainer}>  
              <Text style={styles.chartTitle}>Ingresos Mensuales</Text>  
              <LineChart  
                data={{  
                  labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],  
                  datasets: [{  
                    data: analyticsData.revenue.monthly  
                  }]  
                }}  
                width={screenWidth}  
                height={220}  
                chartConfig={chartConfig}  
                bezier  
                style={styles.chart}  
              />  
            </View>  
          )}  
          {selectedChart === "orders" && analyticsData && (  
            <View style={styles.chartContainer}>  
              <Text style={styles.chartTitle}>Distribución de Órdenes</Text>  
              <PieChart  
                data={[  
                  { name: "Completadas", population: analyticsData.orders.completed, color: "#4caf50", legendFontColor: "#333", legendFontSize: 15 },  
                  { name: "Pendientes", population: analyticsData.orders.pending, color: "#ff9800", legendFontColor: "#333", legendFontSize: 15 },  
                  { name: "Canceladas", population: analyticsData.orders.cancelled, color: "#f44336", legendFontColor: "#333", legendFontSize: 15 }  
                ]}  
                width={screenWidth}  
                height={220}  
                chartConfig={chartConfig}  
                accessor="population"  
                backgroundColor="transparent"  
                paddingLeft="15"  
                absolute  
              />  
            </View>  
          )}  
        </ScrollView>  
      </View>  
    </Modal>  
  )  
  
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
  
  if (!analyticsData) return null  
  
  return (  
    <ScrollView style={styles.container}>  
      <View style={styles.header}>  
        <Text style={styles.headerTitle}>Analíticas del Taller</Text>  
        <View style={styles.periodSelector}>  
          {["week", "month", "quarter", "year"].map((period) => (  
            <TouchableOpacity  
              key={period}  
              style={[  
                styles.periodButton,  
                selectedPeriod === period && styles.periodButtonSelected  
              ]}  
              onPress={() => setSelectedPeriod(period as any)}  
            >  
              <Text style={[  
                styles.periodButtonText,  
                selectedPeriod === period && styles.periodButtonTextSelected  
              ]}>  
                {period === "week" ? "Semana" :  
                 period === "month" ? "Mes" :  
                 period === "quarter" ? "Trimestre" : "Año"}  
              </Text>  
            </TouchableOpacity>  
          ))}  
        </View>  
      </View>  
  
      {/* Métricas principales */}  
      <View style={styles.metricsContainer}>  
        {renderMetricCard(  
          "Ingresos Totales",  
          formatCurrency(analyticsData.revenue.total),  
          analyticsData.revenue.growth,  
          "dollar-sign",  
          "#4caf50"  
        )}  
        {renderMetricCard(  
          "Órdenes Completadas",  
          analyticsData.orders.completed.toString(),  
          undefined,  
          "check-circle",  
          "#1a73e8"  
        )}  
        {renderMetricCard(  
          "Clientes Activos",  
          analyticsData.clients.active.toString(),  
          undefined,  
          "users",  
          "#9c27b0"  
        )}  
        {renderMetricCard(  
          "Eficiencia",  
          formatPercentage(analyticsData.performance.efficiency),  
          undefined,  
          "trending-up",  
          "#ff9800"  
        )}  
      </View>  
  
      {/* Gráfico de ingresos */}  
      <View style={styles.chartSection}>  
        <View style={styles.chartHeader}>  
          <Text style={styles.chartSectionTitle}>Ingresos Mensuales</Text>  
          <TouchableOpacity  
            onPress={() => {  
              setSelectedChart("revenue")  
              setChartModalVisible(true)  
            }}  
          >  
            <Feather name="maximize-2" size={20} color="#1a73e8" />  
          </TouchableOpacity>  
        </View>  
        <LineChart  
          data={{  
            labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],  
            datasets: [{  
              data: analyticsData.revenue.monthly.slice(0, 6)  
            }]  
          }}  
          width={screenWidth}  
          height={200}  
          chartConfig={chartConfig}  
          bezier  
          style={styles.chart}  
        />  
      </View>  
  
      {/* Distribución de órdenes */}  
      <View style={styles.chartSection}>  
        <View style={styles.chartHeader}>  
          <Text style={styles.chartSectionTitle}>Estado de Órdenes</Text>  
          <TouchableOpacity  
            onPress={() => {  
              setSelectedChart("orders")  
              setChartModalVisible(true)  
            }}  
          >  
            <Feather name="maximize-2" size={20} color="#1a73e8" />  
          </TouchableOpacity>  
        </View>  
        <View style={styles.orderStatsGrid}>  
          <View style={styles.orderStatCard}>  
            <Text style={styles.orderStatValue}>{analyticsData.orders.total}</Text>  
            <Text style={styles.orderStatLabel}>Total</Text>  
          </View>  
          <View style={styles.orderStatCard}>  
            <Text style={[styles.orderStatValue, { color: "#4caf50" }]}>  
              {analyticsData.orders.completed}  
            </Text>  
            <Text style={styles.orderStatLabel}>Completadas</Text>  
          </View>  
          <View style={styles.orderStatCard}>  
            <Text style={[styles.orderStatValue, { color: "#ff9800" }]}>  
              {analyticsData.orders.pending}  
            </Text>  
            <Text style={styles.orderStatLabel}>Pendientes</Text>  
          </View>  
          <View style={styles.orderStatCard}>  
            <Text style={[styles.orderStatValue, { color: "#f44336" }]}>  
              {analyticsData.orders.cancelled}  
            </Text>  
            <Text style={styles.orderStatLabel}>Canceladas</Text>  
          </View>  
        </View>  
      </View>  
  
      {/* Métricas de rendimiento */}  
      <View style={styles.performanceSection}>  
        <Text style={styles.sectionTitle}>Métricas de Rendimiento</Text>  
        <View style={styles.performanceGrid}>  
          <View style={styles.performanceCard}>  
            <Feather name="clock" size={24} color="#1a73e8" />  
            <Text style={styles.performanceValue}>  
              {analyticsData.performance.averageCompletionTime.toFixed(1)} días  
            </Text>  
            <Text style={styles.performanceLabel}>Tiempo Promedio</Text>  
          </View>  
          <View style={styles.performanceCard}>  
            <Feather name="star" size={24} color="#ff9800" />  
            <Text style={styles.performanceValue}>  
              {analyticsData.performance.customerSatisfaction.toFixed(1)}/5  
            </Text>  
            <Text style={styles.performanceLabel}>Satisfacción</Text>  
          </View>  
          <View style={styles.performanceCard}>  
            <Feather name="percent" size={24} color="#4caf50" />  
            <Text style={styles.performanceValue}>  
              {formatPercentage(analyticsData.clients.retention)}  
            </Text>  
            <Text style={styles.performanceLabel}>Retención</Text>  
          </View>  
        </View>  
      </View>  
  
      {/* Top productos */}  
      <View style={styles.topProductsSection}>  
        <Text style={styles.sectionTitle}>Productos Más Vendidos</Text>  
        {analyticsData.inventory.topSelling.map((item, index) => (  
          <View key={index} style={styles.topProductItem}>  
            <View style={styles.topProductRank}>  
              <Text style={styles.topProductRankText}>{index + 1}</Text>  
            </View>  
            <View style={styles.topProductInfo}>  
              <Text style={styles.topProductName}>{item.name}</Text>  
              <Text style={styles.topProductQuantity}>{item.quantity} unidades</Text>  
            </View>  
          </View>  
        ))}  
      </View>  
  
      {renderChartModal()}  
    </ScrollView>  
  )  
}  
  
// Los estilos permanecen igual que en el archivo original...  
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
    padding: 16,  
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
  periodButtonSelected: {  
    backgroundColor: "#1a73e8",  
  },  
  periodButtonText: {  
    fontSize: 14,  
    color: "#666",  
    fontWeight: "500",  
  },  
  periodButtonTextSelected: {  
    color: "#fff",  
    fontWeight: "600",  
  },  
  metricsContainer: {  
    flexDirection: "row",  
    flexWrap: "wrap",  
    padding: 16,  
    gap: 12,  
  },  
  metricCard: {  
    backgroundColor: "#fff",  
    borderRadius: 8,  
    padding: 16,  
    width: "48%",  
    borderLeftWidth: 4,  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 1 },  
    shadowOpacity: 0.1,  
    shadowRadius: 2,  
    elevation: 2,  
  },  
  metricHeader: {  
    flexDirection: "row",  
    alignItems: "center",  
    marginBottom: 8,  
  },  
  metricIcon: {  
    width: 32,  
    height: 32,  
    borderRadius: 16,  
    justifyContent: "center",  
    alignItems: "center",  
    marginRight: 8,  
  },  
  metricTitle: {  
    fontSize: 14,  
    color: "#666",  
    fontWeight: "500",  
  },  
  metricValue: {  
    fontSize: 20,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 4,  
  },  
  metricChange: {  
    flexDirection: "row",  
    alignItems: "center",  
  },  
  metricChangeText: {  
    fontSize: 12,  
    fontWeight: "600",  
    marginLeft: 4,  
  },  
  chartSection: {  
    backgroundColor: "#fff",  
    margin: 16,  
    borderRadius: 8,  
    padding: 16,  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 1 },  
    shadowOpacity: 0.1,  
    shadowRadius: 2,  
    elevation: 2,  
  },  
  chartHeader: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    marginBottom: 16,  
  },  
  chartSectionTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  chart: {  
    borderRadius: 8,  
  },  
  orderStatsGrid: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
  },  
  orderStatCard: {  
    alignItems: "center",  
    flex: 1,  
  },  
  orderStatValue: {  
    fontSize: 24,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  orderStatLabel: {  
    fontSize: 12,  
    color: "#666",  
    marginTop: 4,  
  },  
  performanceSection: {  
    backgroundColor: "#fff",  
    margin: 16,  
    borderRadius: 8,  
    padding: 16,  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 1 },  
    shadowOpacity: 0.1,  
    shadowRadius: 2,  
    elevation: 2,  
  },  
  sectionTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 16,  
  },  
  performanceGrid: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
  },  
  performanceCard: {  
    alignItems: "center",  
    flex: 1,  
    padding: 12,  
  },  
  performanceValue: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
    marginTop: 8,  
  },  
  performanceLabel: {  
    fontSize: 12,  
    color: "#666",  
    marginTop: 4,  
    textAlign: "center",  
  },  
  topProductsSection: {  
    backgroundColor: "#fff",  
    margin: 16,  
    borderRadius: 8,  
    padding: 16,  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 1 },  
    shadowOpacity: 0.1,  
    shadowRadius: 2,  
    elevation: 2,  
  },  
  topProductItem: {  
    flexDirection: "row",  
    alignItems: "center",  
    paddingVertical: 12,  
    borderBottomWidth: 1,  
    borderBottomColor: "#f0f0f0",  
  },  
  topProductRank: {  
    width: 32,  
    height: 32,  
    borderRadius: 16,  
    backgroundColor: "#1a73e8",  
    justifyContent: "center",  
    alignItems: "center",  
    marginRight: 12,  
  },  
  topProductRankText: {  
    fontSize: 14,  
    fontWeight: "bold",  
    color: "#fff",  
  },  
  topProductInfo: {  
    flex: 1,  
  },  
  topProductName: {  
    fontSize: 16,  
    fontWeight: "600",  
    color: "#333",  
    marginBottom: 2,  
  },  
  topProductQuantity: {  
    fontSize: 14,  
    color: "#666",  
  },  
  modalContainer: {  
    flex: 1,  
    backgroundColor: "#fff",  
  },  
  modalHeader: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    padding: 16,  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  modalTitle: {  
    fontSize: 20,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  closeButton: {  
    padding: 8,  
  },  
  modalContent: {  
    flex: 1,  
    padding: 16,  
  },  
  chartContainer: {  
    alignItems: "center",  
    marginBottom: 20,  
  },  
  chartTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 16,  
  },  
})