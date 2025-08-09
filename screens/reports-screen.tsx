"use client"  
  
import { useState, useCallback, useEffect } from "react"  
import {   
  StyleSheet,   
  View,   
  Text,   
  TouchableOpacity,   
  ScrollView,   
  SafeAreaView,   
  Dimensions,   
  Modal,  
  ActivityIndicator,  
  Alert  
} from "react-native"  
import { Feather, MaterialIcons } from "@expo/vector-icons"  
import { LineChart, BarChart, PieChart } from "react-native-chart-kit"  
import { useFocusEffect } from "@react-navigation/native"  
import { useAuth } from "../context/auth-context"  
// Importaciones corregidas para usar servicios de Supabase  
import * as orderService from "../services/supabase/order-service"  
import * as clientService from "../services/supabase/client-service"  
import * as inventoryService from "../services/supabase/inventory-service"  
import * as dashboardService from "../services/supabase/dashboard-service"  
import * as accessService from "../services/supabase/access-service"  
import * as userService from "../services/supabase/user-service"  
  
// Tipos TypeScript para resolver errores  
interface ReportsScreenProps {  
  navigation: any  
}  
  
interface OrderType {  
  id: string  
  numero_orden: string  
  descripcion: string  
  estado: string  
  prioridad: string  
  client_id: string  
  vehiculo_id: string  
  tecnico_id?: string  
  costo?: number  
  fecha_creacion: string  
  observacion?: string  
}  
  
interface ClientType {  
  id: string  
  nombre: string  
  email?: string  
  telefono?: string  
}  
  
interface InventoryType {  
  id: string  
  nombre: string  
  codigo: string  
  stock_actual: number  
  precio_venta?: number  
}  
  
interface ChartDataType {  
  labels: string[]  
  datasets: {  
    data: number[]  
    color?: (opacity: number) => string  
    strokeWidth?: number  
  }[]  
  legend?: string[]  
}  
  
interface PieChartDataType {  
  name: string  
  population: number  
  color: string  
  legendFontColor: string  
  legendFontSize: number  
}  
  
interface StatType {  
  title: string  
  value: string  
  icon: string  
  color: string  
}  
  
// Componente para tarjeta de reporte  
const ReportCard = ({ title, icon, onPress }: { title: string; icon: string; onPress: () => void }) => (  
  <TouchableOpacity style={styles.reportCard} onPress={onPress}>  
    <View style={styles.reportIconContainer}>  
      <Feather name={icon as any} size={24} color="#1a73e8" />  
    </View>  
    <Text style={styles.reportTitle}>{title}</Text>  
    <Feather name="chevron-right" size={20} color="#ccc" />  
  </TouchableOpacity>  
)  
  
// Componente para tarjeta de estadística  
const StatCard = ({ title, value, icon, color }: StatType) => (  
  <View style={[styles.statCard, { borderLeftColor: color }]}>  
    <View style={styles.statIconContainer}>  
      <Feather name={icon as any} size={24} color={color} />  
    </View>  
    <View style={styles.statContent}>  
      <Text style={styles.statTitle}>{title}</Text>  
      <Text style={styles.statValue}>{value}</Text>  
    </View>  
  </View>  
)  
  
export default function ReportsScreen({ navigation }: ReportsScreenProps) {  
  const { user } = useAuth()  
  const [showReportModal, setShowReportModal] = useState(false)  
  const [currentReport, setCurrentReport] = useState<string | null>(null)  
  const [loading, setLoading] = useState(true)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
    
  // Estados para datos de reportes  
  const [orders, setOrders] = useState<OrderType[]>([])  
  const [clients, setClients] = useState<ClientType[]>([])  
  const [inventory, setInventory] = useState<InventoryType[]>([])  
  const [stats, setStats] = useState<StatType[]>([])  
  const [monthlyData, setMonthlyData] = useState<ChartDataType>({  
    labels: [],  
    datasets: [{ data: [] }]  
  })  
  const [serviceData, setServiceData] = useState<ChartDataType>({  
    labels: [],  
    datasets: [{ data: [] }]  
  })  
  const [revenueData, setRevenueData] = useState<PieChartDataType[]>([])  
  
  // Ancho de la pantalla para los gráficos  
  const screenWidth = Dimensions.get("window").width - 40  
  
  // Cargar datos de reportes  
  const loadReportsData = useCallback(async () => {  
    try {  
      setLoading(true)  
      setError(null)  
  
      if (!user?.id) return  
  
      // Validar permisos del usuario  
      const userTallerId = await userService.getTallerId(user.id)  
      const userPermissions = await accessService.getUserPermissions(user.id, userTallerId)  
      setUserRole(userPermissions?.rol || 'client')  
  
      if (userPermissions?.rol === 'client') {  
        setError("No tienes permisos para ver los reportes")  
        return  
      }  
  
      // Cargar datos desde Supabase  
      const [allOrders, allClients, allInventory] = await Promise.all([  
        orderService.getAllOrders(),  
        clientService.getAllClients(),  
        inventoryService.getAllInventory()  
      ])  
  
      setOrders(allOrders)  
      setClients(allClients)  
      setInventory(allInventory)  
  
      // Generar estadísticas  
      generateStats(allOrders, allClients, allInventory)  
      generateChartData(allOrders)  
  
    } catch (error) {  
      console.error("Error loading reports data:", error)  
      setError("No se pudieron cargar los datos de reportes")  
    } finally {  
      setLoading(false)  
    }  
  }, [user])  
  
  useFocusEffect(  
    useCallback(() => {  
      loadReportsData()  
    }, [loadReportsData])  
  )  
  
  // Generar estadísticas basadas en datos reales  
  const generateStats = (orders: OrderType[], clients: ClientType[], inventory: InventoryType[]) => {  
    const completedOrders = orders.filter((order: OrderType) => order.estado === "Completada")  
    const totalRevenue = completedOrders.reduce((sum: number, order: OrderType) => sum + (order.costo || 0), 0)  
    const newClientsThisMonth = getNewClientsThisMonth(clients)  
    const totalInventoryValue = inventory.reduce((sum: number, item: InventoryType) =>   
      sum + (item.stock_actual * (item.precio_venta || 0)), 0  
    )  
  
    const statsData: StatType[] = [  
      {   
        title: "Órdenes Completadas",   
        value: completedOrders.length.toString(),   
        icon: "check-circle",   
        color: "#4caf50"   
      },  
      {   
        title: "Ingresos Totales",   
        value: `$${totalRevenue.toFixed(2)}`,   
        icon: "dollar-sign",   
        color: "#1a73e8"   
      },  
      {   
        title: "Clientes Nuevos",   
        value: newClientsThisMonth.toString(),   
        icon: "users",   
        color: "#f5a623"   
      },  
      {   
        title: "Valor Inventario",   
        value: `$${totalInventoryValue.toFixed(2)}`,   
        icon: "package",   
        color: "#9c27b0"   
      },  
    ]  
  
    setStats(statsData)  
  }  
  
  // Filtrar órdenes por período  
  const filterOrdersByPeriod = (orders: OrderType[], period: string) => {  
    const now = new Date()  
    return orders.filter((order: OrderType) => {  
      const orderDate = new Date(order.fecha_creacion)  
        
      switch (period) {  
        case "week":  
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)  
          return orderDate >= weekAgo  
        case "month":  
          return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()  
        case "year":  
          return orderDate.getFullYear() === now.getFullYear()  
        default:  
          return true  
      }  
    })  
  }  
  
  // Obtener ingresos por mes  
  const getMonthlyRevenue = (orders: OrderType[]) => {  
    const monthlyRevenue = orders  
      .filter((order: OrderType) => order.estado === "Completada")  
      .reduce((sum: number, order: OrderType) => sum + (order.costo || 0), 0)  
      
    return monthlyRevenue  
  }  
  
  // Obtener órdenes por mes  
  const getMonthlyOrders = (orders: OrderType[]) => {  
    const monthlyOrders = orders  
      .filter((order: OrderType) => {  
        const orderDate = new Date(order.fecha_creacion)  
        const now = new Date()  
        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()  
      })  
      .reduce((sum: number, order: OrderType) => sum + 1, 0)  
      
    return monthlyOrders  
  }  
  
  // Obtener clientes nuevos este mes  
    // Obtener clientes nuevos este mes  
    const getNewClientsThisMonth = (clients: ClientType[]) => {  
      // Asumiendo que los clientes tienen fecha de creación  
      const now = new Date()  
      return clients.filter((client: ClientType) => {  
        // Si no hay fecha de creación, asumir que es cliente antiguo  
        if (!client.created_at) return false  
        const clientDate = new Date(client.created_at)  
        return clientDate.getMonth() === now.getMonth() && clientDate.getFullYear() === now.getFullYear()  
      }).length  
    }  
    
    // Generar datos para gráficos  
    const generateChartData = (orders: OrderType[]) => {  
      // Datos mensuales de órdenes  
      const monthlyOrdersData = generateMonthlyOrdersData(orders)  
      setMonthlyData(monthlyOrdersData)  
    
      // Datos de servicios más solicitados  
      const servicesData = generateServicesData(orders)  
      setServiceData(servicesData)  
    
      // Datos de ingresos por estado  
      const revenueByStatusData = generateRevenueByStatusData(orders)  
      setRevenueData(revenueByStatusData)  
    }  
    
    // Generar datos mensuales de órdenes  
    const generateMonthlyOrdersData = (orders: OrderType[]) => {  
      const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]  
      const currentYear = new Date().getFullYear()  
        
      const monthlyData = months.map((month, index) => {  
        const monthOrders = orders.filter((order: OrderType) => {  
          const orderDate = new Date(order.fecha_creacion)  
          return orderDate.getMonth() === index && orderDate.getFullYear() === currentYear  
        })  
        return monthOrders.length  
      })  
    
      return {  
        labels: months,  
        datasets: [{ data: monthlyData }]  
      }  
    }  
    
    // Generar datos de servicios  
    const generateServicesData = (orders: OrderType[]) => {  
      const serviceCount = orders.reduce((acc: Record<string, number>, order: OrderType) => {  
        const service = order.descripcion || "Servicio General"  
        acc[service] = (acc[service] || 0) + 1  
        return acc  
      }, {})  
    
      const sortedServices = Object.entries(serviceCount)  
        .sort(([,a], [,b]) => (b as number) - (a as number))  
        .slice(0, 5)  
    
      return {  
        labels: sortedServices.map(([service]) => service),  
        datasets: [{ data: sortedServices.map(([,count]) => count as number) }]  
      }  
    }  
    
    // Generar datos de ingresos por estado  
    const generateRevenueByStatusData = (orders: OrderType[]) => {  
      const statusColors: Record<string, string> = {  
        "Pendiente": "#1a73e8",  
        "En Proceso": "#ff9800",   
        "Completada": "#4caf50",  
        "Entregada": "#607d8b",  
        "Cancelada": "#e53935"  
      }  
    
      const revenueByStatus = orders.reduce((acc: Record<string, number>, order: OrderType) => {  
        const status = order.estado  
        acc[status] = (acc[status] || 0) + (order.costo || 0)  
        return acc  
      }, {})  
    
      return Object.entries(revenueByStatus).map(([status, revenue]) => ({  
        name: status,  
        population: revenue as number,  
        color: statusColors[status] || "#666",  
        legendFontColor: "#333",  
        legendFontSize: 12  
      }))  
    }  
    
    // Configuración de gráficos  
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
    
    // Manejar selección de reporte  
    const handleReportPress = (reportType: string) => {  
      setCurrentReport(reportType)  
      setShowReportModal(true)  
    }  
    
    // Renderizar contenido del modal de reporte  
    const renderReportContent = () => {  
      switch (currentReport) {  
        case "monthly":  
          return (  
            <View style={styles.chartContainer}>  
              <Text style={styles.chartTitle}>Órdenes por Mes</Text>  
              <LineChart  
                data={monthlyData}  
                width={screenWidth}  
                height={220}  
                chartConfig={chartConfig}  
                bezier  
                style={styles.chart}  
              />  
            </View>  
          )  
        case "services":  
          return (  
            <View style={styles.chartContainer}>  
              <Text style={styles.chartTitle}>Servicios Más Solicitados</Text>  
              <BarChart  
                data={serviceData}  
                width={screenWidth}  
                height={220}  
                chartConfig={chartConfig}  
                style={styles.chart}  
                yAxisLabel=""  
                yAxisSuffix=""  
              />  
            </View>  
          )  
        case "revenue":  
          return (  
            <View style={styles.chartContainer}>  
              <Text style={styles.chartTitle}>Ingresos por Estado</Text>  
              <PieChart  
                data={revenueData}  
                width={screenWidth}  
                height={220}  
                chartConfig={chartConfig}  
                accessor="population"  
                backgroundColor="transparent"  
                paddingLeft="15"  
                style={styles.chart}  
              />  
            </View>  
          )  
        default:  
          return null  
      }  
    }  
    
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
          <TouchableOpacity style={styles.retryButton} onPress={loadReportsData}>  
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
          <Text style={styles.headerTitle}>Reportes</Text>  
        </View>  
    
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>  
          {/* Estadísticas principales */}  
          <View style={styles.statsSection}>  
            <Text style={styles.sectionTitle}>Estadísticas Generales</Text>  
            <View style={styles.statsGrid}>  
              {stats.map((stat, index) => (  
                <StatCard key={index} {...stat} />  
              ))}  
            </View>  
          </View>  
    
          {/* Reportes disponibles */}  
          <View style={styles.reportsSection}>  
            <Text style={styles.sectionTitle}>Reportes Disponibles</Text>  
              
            <ReportCard  
              title="Órdenes Mensuales"  
              icon="trending-up"  
              onPress={() => handleReportPress("monthly")}  
            />  
              
            <ReportCard  
              title="Servicios Populares"  
              icon="bar-chart-2"  
              onPress={() => handleReportPress("services")}  
            />  
              
            <ReportCard  
              title="Ingresos por Estado"  
              icon="pie-chart"  
              onPress={() => handleReportPress("revenue")}  
            />  
              
            <ReportCard  
              title="Inventario Crítico"  
              icon="alert-triangle"  
              onPress={() => navigation.navigate("Inventory", { filter: "low-stock" })}  
            />  
              
            <ReportCard  
              title="Clientes Activos"  
              icon="users"  
              onPress={() => navigation.navigate("Clients", { filter: "active" })}  
            />  
          </View>  
        </ScrollView>  
    
        {/* Modal para mostrar gráficos */}  
        <Modal  
          visible={showReportModal}  
          animationType="slide"  
          presentationStyle="pageSheet"  
        >  
          <SafeAreaView style={styles.modalContainer}>  
            <View style={styles.modalHeader}>  
              <TouchableOpacity   
                style={styles.modalBackButton}   
                onPress={() => setShowReportModal(false)}  
              >  
                <Feather name="arrow-left" size={24} color="#333" />  
              </TouchableOpacity>  
              <Text style={styles.modalTitle}>Reporte Detallado</Text>  
            </View>  
              
            <ScrollView style={styles.modalContent}>  
              {renderReportContent()}  
            </ScrollView>  
          </SafeAreaView>  
        </Modal>  
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
    },  
    content: {  
      flex: 1,  
      padding: 16,  
    },  
    statsSection: {  
      marginBottom: 24,  
    },  
    sectionTitle: {  
      fontSize: 18,  
      fontWeight: "bold",  
      color: "#333",  
      marginBottom: 16,  
    },  
    statsGrid: {  
      flexDirection: "row",  
      flexWrap: "wrap",  
      gap: 12,  
    },  
    statCard: {  
      flex: 1,  
      minWidth: "45%",  
      backgroundColor: "#fff",  
      borderRadius: 12,  
      padding: 16,  
      flexDirection: "row",  
      alignItems: "center",  
      borderLeftWidth: 4,  
      shadowColor: "#000",  
      shadowOffset: { width: 0, height: 1 },  
      shadowOpacity: 0.1,  
      shadowRadius: 2,  
      elevation: 2,  
    },  
    statIconContainer: {  
      marginRight: 12,  
    },  
    statContent: {  
      flex: 1,  
    },  
    statTitle: {  
      fontSize: 12,  
      color: "#666",  
      marginBottom: 4,  
    },  
    statValue: {  
      fontSize: 18,  
      fontWeight: "bold",  
      color: "#333",  
    },  
    reportsSection: {  
      marginBottom: 24,  
    },  
    reportCard: {  
      backgroundColor: "#fff",  
      borderRadius: 12,  
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
    reportIconContainer: {  
      width: 48,  
      height: 48,  
      borderRadius: 24,  
      backgroundColor: "#e6f0ff",  
      justifyContent: "center",  
      alignItems: "center",  
      marginRight: 16,  
    },  
    reportTitle: {  
      flex: 1,  
      fontSize: 16,  
      fontWeight: "500",  
      color: "#333",  
    },  
    modalContainer: {  
      flex: 1,  
      backgroundColor: "#fff",  
    },  
    modalHeader: {  
      flexDirection: "row",  
      alignItems: "center",  
      paddingHorizontal: 16,  
      paddingVertical: 12,  
      backgroundColor: "#fff",  
      borderBottomWidth: 1,  
      borderBottomColor: "#e1e4e8",  
    },  
    modalBackButton: {  
      padding: 8,  
      marginRight: 8,  
    },  
    modalTitle: {  
      fontSize: 18,  
      fontWeight: "bold",  
      color: "#333",  
    },  
    modalContent: {  
      flex: 1,  
      padding: 16,  
    },  
    chartContainer: {  
      backgroundColor: "#fff",  
      borderRadius: 12,  
      padding: 16,  
      marginBottom: 16,  
      shadowColor: "#000",  
      shadowOffset: { width: 0, height: 1 },  
      shadowOpacity: 0.1,  
      shadowRadius: 2,  
      elevation: 2,  
    },  
    chartTitle: {  
      fontSize: 16,  
      fontWeight: "bold",  
      color: "#333",  
      marginBottom: 16,  
      textAlign: "center",  
    },  
    chart: {  
      marginVertical: 8,  
      borderRadius: 16,  
    },  
  })