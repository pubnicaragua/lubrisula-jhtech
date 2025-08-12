"use client"  
  
import { useState, useCallback } from "react"  
import {  
  View,  
  Text,  
  ScrollView,  
  TouchableOpacity,  
  StyleSheet,  
  ActivityIndicator,  
  Alert,  
  RefreshControl,  
  Dimensions,  
} from "react-native"  
import { Feather, MaterialIcons } from "@expo/vector-icons"  
import { useFocusEffect } from "@react-navigation/native"  
import { StackNavigationProp } from '@react-navigation/stack'  
import { RouteProp } from '@react-navigation/native'  
import { useAuth } from "../context/auth-context"  
import { orderService } from "../services/supabase/order-service"  
import { clientService } from "../services/supabase/client-service"  
import { inventoryService } from "../services/supabase/inventory-service"  
import ACCESOS_SERVICES from "../services/supabase/access-service"  
import USER_SERVICE from "../services/supabase/user-service"  
import { RootStackParamList } from '../types/navigation'  
import { Order } from '../types/order'  
import { Client } from '../types/client'  
import { InventoryItem } from '../types/inventory'  
  
type ReportsNavigationProp = StackNavigationProp<RootStackParamList, 'Reports'>  
type ReportsRouteProp = RouteProp<RootStackParamList, 'Reports'>  
  
interface Props {  
  navigation: ReportsNavigationProp  
  route: ReportsRouteProp  
}  
  
interface ReportData {  
  orders: Order[]  
  clients: Client[]  
  inventory: InventoryItem[]  
  stats: {  
    totalOrders: number  
    completedOrders: number  
    pendingOrders: number  
    totalRevenue: number  
    averageOrderValue: number  
    totalClients: number  
    activeClients: number  
    lowStockItems: number  
    totalInventoryValue: number  
  }  
  monthlyData: {  
    month: string  
    orders: number  
    revenue: number  
  }[]  
}  
  
export default function ReportsScreen({ navigation, route }: Props) {  
  const { user } = useAuth()  
  const [loading, setLoading] = useState(true)  
  const [refreshing, setRefreshing] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
  const [reportData, setReportData] = useState<ReportData | null>(null)  
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')  
  
  const loadReportData = useCallback(async () => {  
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
      setUserRole(userPermissions?.rol || 'client')  
  
      // Solo staff puede ver reportes  
      if (userPermissions?.rol === 'client') {  
        setError("No tienes permisos para ver los reportes")  
        return  
      }  
  
      // Cargar datos para reportes  
      const [orders, clients, inventory] = await Promise.all([  
        orderService.getAllOrders(),  
        clientService.getAllClients(),  
        inventoryService.getAllInventory()  
      ])  
  
      // ✅ CORREGIDO: Usar campos reales en lugar de campos inexistentes  
      // Calcular estadísticas  
      const completedOrders = orders.filter(order =>   
        order.status === 'completed' || order.status === 'delivered'  
      )  
        
      const pendingOrders = orders.filter(order =>   
        order.status !== 'completed' &&   
        order.status !== 'delivered' &&   
        order.status !== 'cancelled'  
      )  
  
      // ✅ CORREGIDO: Usar order.total en lugar de order.totalAmount  
      const totalRevenue = completedOrders.reduce((sum, order) =>   
        sum + (order.total || 0), 0  
      )  
  
      const averageOrderValue = completedOrders.length > 0   
        ? totalRevenue / completedOrders.length   
        : 0  
  
      // Clientes activos (con órdenes en los últimos 6 meses)  
      const sixMonthsAgo = new Date()  
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)  
        
      const activeClientIds = new Set(  
        orders  
          .filter(order => new Date(order.created_at) >= sixMonthsAgo)  
          .map(order => order.clientId)  
      )  
  
       // ✅ CORREGIDO: Usar item.cantidad en lugar de item.stock  
       const lowStockItems = inventory.filter(  
        item => (item.cantidad || 0) <= 5 // Usar cantidad del schema real  
      )  
  
      const totalInventoryValue = inventory.reduce((sum, item) =>   
        sum + ((item.precio_unitario || 0) * (item.cantidad || 0)), 0  
      )  
  
      // Datos mensuales para gráficos  
      const monthlyData = generateMonthlyData(orders, selectedPeriod)  
  
      const stats = {  
        totalOrders: orders.length,  
        completedOrders: completedOrders.length,  
        pendingOrders: pendingOrders.length,  
        totalRevenue,  
        averageOrderValue,  
        totalClients: clients.length,  
        activeClients: activeClientIds.size,  
        lowStockItems: lowStockItems.length,  
        totalInventoryValue,  
      }  
  
      setReportData({  
        orders,  
        clients,  
        inventory,  
        stats,  
        monthlyData,  
      })  
  
    } catch (error) {  
      console.error("Error loading report data:", error)  
      setError("No se pudieron cargar los datos del reporte")  
    } finally {  
      setLoading(false)  
      setRefreshing(false)  
    }  
  }, [user, selectedPeriod])  
  
  const generateMonthlyData = (orders: Order[], period: string) => {  
    const now = new Date()  
    const months = []  
    const monthCount = period === 'year' ? 12 : period === 'quarter' ? 3 : 1  
  
    for (let i = monthCount - 1; i >= 0; i--) {  
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)  
      const monthName = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })  
        
      const monthOrders = orders.filter(order => {  
        const orderDate = new Date(order.created_at)  
        return orderDate.getMonth() === date.getMonth() &&   
               orderDate.getFullYear() === date.getFullYear()  
      })  
  
      months.push({  
        month: monthName,  
        orders: monthOrders.length,  
        revenue: monthOrders.reduce((sum, order) => sum + (order.total || 0), 0)  
      })  
    }  
  
    return months  
  }  
  
  useFocusEffect(  
    useCallback(() => {  
      loadReportData()  
    }, [loadReportData])  
  )  
  
  const onRefresh = () => {  
    setRefreshing(true)  
    loadReportData()  
  }  
  
  const formatCurrency = (amount: number) => {  
    return amount.toLocaleString("es-ES", {  
      style: "currency",  
      currency: "USD",  
      minimumFractionDigits: 0,  
      maximumFractionDigits: 0,  
    })  
  }  
  
  const formatPercentage = (value: number, total: number) => {  
    if (total === 0) return "0%"  
    return `${((value / total) * 100).toFixed(1)}%`  
  }  
  
  const renderStatCard = (title: string, value: string | number, icon: string, color: string, subtitle?: string) => (  
    <View style={[styles.statCard, { borderLeftColor: color }]}>  
      <View style={styles.statHeader}>  
        <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>  
          <Feather name={icon as any} size={20} color={color} />  
        </View>  
        <Text style={styles.statTitle}>{title}</Text>  
      </View>  
      <Text style={styles.statValue}>{value}</Text>  
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}  
    </View>  
  )  
  
  if (loading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#1a73e8" />  
        <Text style={styles.loadingText}>Cargando reportes...</Text>  
      </View>  
    )  
  }  
  
  if (error) {  
    return (  
      <View style={styles.errorContainer}>  
        <MaterialIcons name="error" size={64} color="#f44336" />  
        <Text style={styles.errorText}>{error}</Text>  
        <TouchableOpacity style={styles.retryButton} onPress={loadReportData}>  
          <Text style={styles.retryButtonText}>Reintentar</Text>  
        </TouchableOpacity>  
      </View>  
    )  
  }  
  
  if (!reportData) return null  
  
  const { stats, monthlyData } = reportData  
  
  return (  
    <ScrollView   
      style={styles.container}  
      refreshControl={  
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />  
      }  
    >  
      {/* Header con filtros de período */}  
      <View style={styles.header}>  
        <Text style={styles.headerTitle}>Reportes del Taller</Text>  
        <View style={styles.periodFilters}>  
          {[  
            { key: 'week', label: 'Semana' },  
            { key: 'month', label: 'Mes' },  
            { key: 'quarter', label: 'Trimestre' },  
            { key: 'year', label: 'Año' },  
          ].map((period) => (  
            <TouchableOpacity  
              key={period.key}  
              style={[  
                styles.periodButton,  
                selectedPeriod === period.key && styles.periodButtonSelected  
              ]}  
              onPress={() => setSelectedPeriod(period.key as any)}  
            >  
              <Text style={[  
                styles.periodButtonText,  
                selectedPeriod === period.key && styles.periodButtonTextSelected  
              ]}>  
                {period.label}  
              </Text>  
            </TouchableOpacity>  
          ))}  
        </View>  
      </View>  
  
      {/* Estadísticas principales */}  
      <View style={styles.statsContainer}>  
        {renderStatCard(  
          "Total Órdenes",  
          stats.totalOrders,  
          "clipboard",  
          "#1a73e8",  
          `${stats.completedOrders} completadas`  
        )}  
          
        {renderStatCard(  
          "Ingresos Totales",  
          formatCurrency(stats.totalRevenue),  
          "dollar-sign",  
          "#4caf50",  
          `Promedio: ${formatCurrency(stats.averageOrderValue)}`  
        )}  
          
        {renderStatCard(  
          "Clientes",  
          stats.totalClients,  
          "users",  
          "#ff9800",  
          `${stats.activeClients} activos`  
        )}  
          
        {renderStatCard(  
          "Stock Bajo",  
          stats.lowStockItems,  
          "alert-triangle",  
          "#f44336",  
          "Requieren atención"  
        )}  
      </View>  
  
      {/* Gráfico de órdenes por mes */}  
      <View style={styles.section}>  
        <Text style={styles.sectionTitle}>Órdenes por Período</Text>  
        <View style={styles.chartContainer}>  
          {monthlyData.map((data, index) => {  
            const maxOrders = Math.max(...monthlyData.map(d => d.orders))  
            const height = maxOrders > 0 ? (data.orders / maxOrders) * 100 : 0  
              
            return (  
              <View key={index} style={styles.chartBar}>  
                <View style={styles.chartBarContainer}>  
                  <View   
                    style={[  
                      styles.chartBarFill,   
                      { height: `${height}%`, backgroundColor: '#1a73e8' }  
                    ]}   
                  />  
                </View>  
                <Text style={styles.chartBarValue}>{data.orders}</Text>  
                <Text style={styles.chartBarLabel}>{data.month}</Text>  
              </View>  
            )  
          })}  
        </View>  
      </View>  
  
      {/* Distribución de estados de órdenes */}  
      <View style={styles.section}>  
        <Text style={styles.sectionTitle}>Estado de las Órdenes</Text>  
        <View style={styles.statusDistribution}>  
          {[  
            { status: 'completed', label: 'Completadas', color: '#4caf50' },  
            { status: 'in_progress', label: 'En Proceso', color: '#ff9800' },  
            { status: 'waiting_parts', label: 'Esperando Repuestos', color: '#9c27b0' },  
            { status: 'reception', label: 'En Recepción', color: '#2196f3' },  
          ].map((item) => {  
            const count = reportData.orders.filter(order => order.status === item.status).length  
            const percentage = formatPercentage(count, stats.totalOrders)  
              
            return (  
              <View key={item.status} style={styles.statusItem}>  
                <View style={styles.statusItemHeader}>  
                  <View style={[styles.statusDot, { backgroundColor: item.color }]} />  
                  <Text style={styles.statusLabel}>{item.label}</Text>  
                </View>  
                <View style={styles.statusValues}>  
                  <Text style={styles.statusCount}>{count}</Text>  
                  <Text style={styles.statusPercentage}>{percentage}</Text>  
                </View>  
              </View>  
            )  
          })}  
        </View>  
      </View>  
  
      {/* Top clientes */}  
      <View style={styles.section}>  
        <Text style={styles.sectionTitle}>Clientes Principales</Text>  
        {reportData.clients  
          .map(client => ({  
            ...client,  
            orderCount: reportData.orders.filter(order => order.clientId === client.id).length,  
            totalSpent: reportData.orders  
              .filter(order => order.clientId === client.id)  
              .reduce((sum, order) => sum + (order.total || 0), 0)  
          }))  
          .sort((a, b) => b.totalSpent - a.totalSpent)  
          .slice(0, 5)  
          .map((client, index) => (  
            <View key={client.id} style={styles.clientItem}>  
              <View style={styles.clientRank}>  
                <Text style={styles.clientRankText}>{index + 1}</Text>  
              </View>  
              <View style={styles.clientInfo}>  
                <Text style={styles.clientName}>{client.name}</Text>  
                <Text style={styles.clientStats}>  
                  {client.orderCount} órdenes • {formatCurrency(client.totalSpent)}  
                </Text>  
              </View>  
            </View>  
          ))}  
      </View>  
  
      {/* Resumen de inventario */}  
      <View style={styles.section}>  
        <Text style={styles.sectionTitle}>Resumen de Inventario</Text>  
        <View style={styles.inventorySummary}>  
          <View style={styles.inventoryItem}>  
            <Text style={styles.inventoryLabel}>Total de Artículos:</Text>  
            <Text style={styles.inventoryValue}>{reportData.inventory.length}</Text>  
          </View>  
          <View style={styles.inventoryItem}>  
            <Text style={styles.inventoryLabel}>Valor Total:</Text>  
            <Text style={styles.inventoryValue}>{formatCurrency(stats.totalInventoryValue)}</Text>  
          </View>  
          <View style={styles.inventoryItem}>  
            <Text style={styles.inventoryLabel}>Stock Bajo:</Text>  
            <Text style={[styles.inventoryValue, { color: '#f44336' }]}>  
              {stats.lowStockItems} artículos  
            </Text>  
          </View>  
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
  periodFilters: {  
    flexDirection: "row",  
    gap: 8,  
  },  
  periodButton: {  
    paddingHorizontal: 16,  
    paddingVertical: 8,  
    backgroundColor: "#f5f5f5",  
    borderRadius: 20,  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  periodButtonSelected: {  
    backgroundColor: "#1a73e8",  
    borderColor: "#1a73e8",  
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
  statsContainer: {  
    flexDirection: "row",  
    flexWrap: "wrap",  
    padding: 16,  
    gap: 12,  
  },  
  statCard: {  
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
  statHeader: {  
    flexDirection: "row",  
    alignItems: "center",  
    marginBottom: 8,  
  },  
  statIcon: {  
    width: 32,  
    height: 32,  
    borderRadius: 16,  
    justifyContent: "center",  
    alignItems: "center",  
    marginRight: 8,  
  },  
  statTitle: {  
    fontSize: 14,  
    color: "#666",  
    fontWeight: "500",  
  },  
  statValue: {  
    fontSize: 24,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 4,  
  },  
  statSubtitle: {  
    fontSize: 12,  
    color: "#999",  
  },  
  section: {  
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
  chartContainer: {  
    flexDirection: "row",  
    alignItems: "flex-end",  
    justifyContent: "space-between",  
    height: 150,  
    paddingHorizontal: 8,  
  },  
  chartBar: {  
    flex: 1,  
    alignItems: "center",  
    marginHorizontal: 2,  
  },  
  chartBarContainer: {  
    height: 100,  
    width: "80%",  
    justifyContent: "flex-end",  
    backgroundColor: "#f0f0f0",  
    borderRadius: 4,  
  },  
  chartBarFill: {  
    width: "100%",  
    borderRadius: 4,  
    minHeight: 4,  
  },  
  chartBarValue: {  
    fontSize: 12,  
    fontWeight: "bold",  
    color: "#333",  
    marginTop: 4,  
  },  
  chartBarLabel: {  
    fontSize: 10,  
    color: "#666",  
    marginTop: 2,  
    textAlign: "center",  
  },  
  statusDistribution: {  
    gap: 12,  
  },  
  statusItem: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    paddingVertical: 8,  
  },  
  statusItemHeader: {  
    flexDirection: "row",  
    alignItems: "center",  
    flex: 1,  
  },  
  statusDot: {  
    width: 12,  
    height: 12,  
    borderRadius: 6,  
    marginRight: 8,  
  },  
  statusLabel: {  
    fontSize: 14,  
    color: "#333",  
    fontWeight: "500",  
  },  
  statusValues: {  
    alignItems: "flex-end",  
  },  
  statusCount: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  statusPercentage: {  
    fontSize: 12,  
    color: "#666",  
  },  
  clientItem: {  
    flexDirection: "row",  
    alignItems: "center",  
    paddingVertical: 12,  
    borderBottomWidth: 1,  
    borderBottomColor: "#f0f0f0",  
  },  
  clientRank: {  
    width: 32,  
    height: 32,  
    borderRadius: 16,  
    backgroundColor: "#1a73e8",  
    justifyContent: "center",  
    alignItems: "center",  
    marginRight: 12,  
  },  
  clientRankText: {  
    fontSize: 14,  
    fontWeight: "bold",  
    color: "#fff",  
  },  
  clientInfo: {  
    flex: 1,  
  },  
  clientName: {  
    fontSize: 16,  
    fontWeight: "600",  
    color: "#333",  
    marginBottom: 2,  
  },  
  clientStats: {  
    fontSize: 14,  
    color: "#666",  
  },  
  inventorySummary: {  
    gap: 12,  
  },  
  inventoryItem: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    paddingVertical: 8,  
  },  
  inventoryLabel: {  
    fontSize: 14,  
    color: "#666",  
    fontWeight: "500",  
  },  
  inventoryValue: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#333",  
  },  
})