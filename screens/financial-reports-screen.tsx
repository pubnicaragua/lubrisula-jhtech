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
  Modal,  
  TextInput,  
  Dimensions,  
} from "react-native"  
import { Feather, MaterialIcons } from "@expo/vector-icons"  
import { LineChart, BarChart } from "react-native-chart-kit"  
import { useFocusEffect } from "@react-navigation/native"  
import { useAuth } from "../context/auth-context"  
import { orderService } from "../services/supabase/order-service"  
import { clientService } from "../services/supabase/client-service"  
import ACCESOS_SERVICES from "../services/supabase/access-service"  
import USER_SERVICE from "../services/supabase/user-service"  
import { Order } from '../types/order'  
  
interface FinancialData {  
  revenue: {  
    total: number  
    monthly: number[]  
    quarterly: number[]  
    yearly: number[]  
  }  
  expenses: {  
    total: number  
    categories: Array<{ name: string; amount: number }>  
  }  
  profit: {  
    total: number  
    margin: number  
    monthly: number[]  
  }  
  cashFlow: {  
    incoming: number  
    outgoing: number  
    balance: number  
  }  
  taxes: {  
    owed: number  
    paid: number  
    pending: number  
  }  
}  
  
export default function FinancialReportsScreen() {  
  const { user } = useAuth()  
  const [loading, setLoading] = useState(true)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
  const [financialData, setFinancialData] = useState<FinancialData | null>(null)  
  const [selectedPeriod, setSelectedPeriod] = useState<"month" | "quarter" | "year">("month")  
  const [reportModalVisible, setReportModalVisible] = useState(false)  
  const [selectedReport, setSelectedReport] = useState<string | null>(null)  
  
  const screenWidth = Dimensions.get("window").width - 32  
  
  const loadFinancialData = useCallback(async () => {  
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
  setUserRole(userPermissions?.role || 'client')  
  
      // Solo staff puede ver reportes financieros  
  if (userPermissions?.role === 'client') {  
        setError("No tienes permisos para ver los reportes financieros")  
        return  
      }  
  
      // Cargar datos financieros  
      const orders = await orderService.getAllOrders()  
      const clients = await clientService.getAllClients()  
  
      // Procesar datos financieros  
      const financial = processFinancialData(orders, selectedPeriod)  
      setFinancialData(financial)  
  
    } catch (error) {  
      console.error("Error loading financial data:", error)  
      setError("No se pudieron cargar los datos financieros")  
    } finally {  
      setLoading(false)  
    }  
  }, [user, selectedPeriod])  
  
  useFocusEffect(  
    useCallback(() => {  
      loadFinancialData()  
    }, [loadFinancialData])  
  )  
  
  const processFinancialData = (orders: Order[], period: string): FinancialData => {  
    const completedOrders = orders.filter(order =>   
      order.status === "completed" || order.status === "delivered"  
    )  
  
    // Calcular ingresos  
    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.total || 0), 0)  
    const monthlyRevenue = calculateMonthlyRevenue(completedOrders)  
    const quarterlyRevenue = calculateQuarterlyRevenue(completedOrders)  
    const yearlyRevenue = calculateYearlyRevenue(completedOrders)  
  
    // Calcular gastos (placeholder - esto vendría de una tabla de gastos)  
    const totalExpenses = totalRevenue * 0.6 // 60% de gastos estimados  
    const expenseCategories = [  
      { name: "Repuestos", amount: totalExpenses * 0.4 },  
      { name: "Mano de obra", amount: totalExpenses * 0.3 },  
      { name: "Servicios", amount: totalExpenses * 0.15 },  
      { name: "Alquiler", amount: totalExpenses * 0.1 },  
      { name: "Otros", amount: totalExpenses * 0.05 }  
    ]  
  
    // Calcular ganancias  
    const totalProfit = totalRevenue - totalExpenses  
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0  
    const monthlyProfit = monthlyRevenue.map((revenue, index) =>   
      revenue - (revenue * 0.6)  
    )  
  
    // Calcular flujo de caja  
    const cashFlow = {  
      incoming: totalRevenue,  
      outgoing: totalExpenses,  
      balance: totalRevenue - totalExpenses  
    }  
  
    // Calcular impuestos (placeholder)  
    const taxRate = 0.15 // 15% de impuestos  
    const taxesOwed = totalProfit * taxRate  
    const taxesPaid = taxesOwed * 0.8 // 80% pagado  
    const taxesPending = taxesOwed - taxesPaid  
  
    return {  
      revenue: {  
        total: totalRevenue,  
        monthly: monthlyRevenue,  
        quarterly: quarterlyRevenue,  
        yearly: yearlyRevenue  
      },  
      expenses: {  
        total: totalExpenses,  
        categories: expenseCategories  
      },  
      profit: {  
        total: totalProfit,  
        margin: profitMargin,  
        monthly: monthlyProfit  
      },  
      cashFlow,  
      taxes: {  
        owed: taxesOwed,  
        paid: taxesPaid,  
        pending: taxesPending  
      }  
    }  
  }  
  
  const calculateMonthlyRevenue = (orders: Order[]): number[] => {  
    const months = Array(12).fill(0)  
    const currentYear = new Date().getFullYear()  
      
    orders.forEach(order => {  
      const orderDate = new Date(order.createdAt)  
      if (orderDate.getFullYear() === currentYear) {  
        months[orderDate.getMonth()] += order.total || 0  
      }  
    })  
      
    return months  
  }  
  
  const calculateQuarterlyRevenue = (orders: Order[]): number[] => {  
    const quarters = Array(4).fill(0)  
    const currentYear = new Date().getFullYear()  
      
    orders.forEach(order => {  
      const orderDate = new Date(order.createdAt)  
      if (orderDate.getFullYear() === currentYear) {  
        const quarter = Math.floor(orderDate.getMonth() / 3)  
        quarters[quarter] += order.total || 0  
      }  
    })  
      
    return quarters  
  }  
  
  const calculateYearlyRevenue = (orders: Order[]): number[] => {  
    const years = Array(5).fill(0)  
    const currentYear = new Date().getFullYear()  
      
    orders.forEach(order => {  
      const orderDate = new Date(order.createdAt)  
      const yearIndex = currentYear - orderDate.getFullYear()  
      if (yearIndex >= 0 && yearIndex < 5) {  
        years[4 - yearIndex] += order.total || 0  
      }  
    })  
      
    return years  
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
    }  
  }  
  
  const renderFinancialCard = (title: string, value: string, icon: string, color: string, subtitle?: string, trend?: number) => (
    <View style={[styles.financialCard, { borderLeftColor: color }]}>  
      <View style={styles.cardHeader}>  
        <View style={[styles.cardIcon, { backgroundColor: `${color}20` }]}>  
          <Feather name={icon as any} size={20} color={color} />  
        </View>  
        <Text style={styles.cardTitle}>{title}</Text>  
      </View>  
      <Text style={styles.cardValue}>{value}</Text>  
      {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}  
      {trend !== undefined && (  
        <View style={styles.cardTrend}>  
          <Feather   
            name={trend >= 0 ? "trending-up" : "trending-down"}   
            size={16}   
            color={trend >= 0 ? "#4caf50" : "#f44336"}   
          />  
          <Text style={[styles.cardTrendText, { color: trend >= 0 ? "#4caf50" : "#f44336" }]}>  
            {Math.abs(trend).toFixed(1)}%  
          </Text>  
        </View>  
      )}  
    </View>  
  )  
  
  const generateReport = (type: string) => {  
    Alert.alert(  
      "Generar Reporte",  
      `¿Deseas generar el reporte de ${type}?`,  
      [  
        { text: "Cancelar", style: "cancel" },  
        {  
          text: "Generar",  
          onPress: () => {  
            Alert.alert("Éxito", `Reporte de ${type} generado correctamente`)  
          }  
        }  
      ]  
    )  
  }  
  
  if (loading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#1a73e8" />  
        <Text style={styles.loadingText}>Cargando reportes financieros...</Text>  
      </View>  
    )  
  }  
  
  if (error) {  
    return (  
      <View style={styles.errorContainer}>  
        <MaterialIcons name="error" size={64} color="#f44336" />  
        <Text style={styles.errorText}>{error}</Text>  
        <TouchableOpacity style={styles.retryButton} onPress={loadFinancialData}>  
          <Text style={styles.retryButtonText}>Reintentar</Text>  
        </TouchableOpacity>  
      </View>  
    )  
  }  
  
  if (!financialData) return null  
  
  return (  
    <ScrollView style={styles.container}>  
      <View style={styles.header}>  
        <Text style={styles.headerTitle}>Reportes Financieros</Text>  
        <View style={styles.periodSelector}>  
          {["month", "quarter", "year"].map((period) => (  
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
                {period === "month" ? "Mes" :   
                 period === "quarter" ? "Trimestre" : "Año"}  
              </Text>  
            </TouchableOpacity>  
          ))}  
        </View>  
      </View>  
  
      {/* Resumen financiero */}  
      <View style={styles.summaryContainer}>  
        {renderFinancialCard(  
          "Ingresos Totales",  
          formatCurrency(financialData.revenue.total),  
          "",
          "dollar-sign",  
          "#4caf50"  
        )}  
          
        {renderFinancialCard(  
          "Gastos Totales",  
          formatCurrency(financialData.expenses.total),  
          "",
          "trending-down",  
          "#f44336"  
        )}  
          
        {renderFinancialCard(  
          "Ganancia Neta",  
          formatCurrency(financialData.profit.total),  
          `Margen: ${formatPercentage(financialData.profit.margin)}`,  
          "trending-up",  
          "#1a73e8"  
        )}  
          
        {renderFinancialCard(  
          "Flujo de Caja",  
          formatCurrency(financialData.cashFlow.balance),  
          "",
          "activity",  
          "#9c27b0"          )}  
          </View>  
      
          {/* Gráfico de ingresos vs gastos */}  
          <View style={styles.chartSection}>  
            <View style={styles.chartHeader}>  
              <Text style={styles.chartSectionTitle}>Ingresos vs Gastos</Text>  
              <TouchableOpacity  
                onPress={() => generateReport("Ingresos vs Gastos")}  
              >  
                <Feather name="download" size={20} color="#1a73e8" />  
              </TouchableOpacity>  
            </View>  
            <LineChart  
              data={{  
                labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],  
                datasets: [  
                  {  
                    data: financialData.revenue.monthly.slice(0, 6),  
                    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,  
                    strokeWidth: 2  
                  },  
                  {  
                    data: financialData.revenue.monthly.slice(0, 6).map(rev => rev * 0.6),  
                    color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,  
                    strokeWidth: 2  
                  }  
                ],  
                legend: ["Ingresos", "Gastos"]  
              }}  
              width={screenWidth}  
              height={220}  
              chartConfig={chartConfig}  
              bezier  
              style={styles.chart}  
            />  
          </View>  
      
          {/* Distribución de gastos */}  
          <View style={styles.expensesSection}>  
            <Text style={styles.sectionTitle}>Distribución de Gastos</Text>  
            {financialData.expenses.categories.map((category, index) => (  
              <View key={index} style={styles.expenseItem}>  
                <View style={styles.expenseInfo}>  
                  <Text style={styles.expenseName}>{category.name}</Text>  
                  <Text style={styles.expenseAmount}>{formatCurrency(category.amount)}</Text>  
                </View>  
                <View style={styles.expenseBar}>  
                  <View   
                    style={[  
                      styles.expenseBarFill,   
                      {   
                        width: `${(category.amount / financialData.expenses.total) * 100}%`,  
                        backgroundColor: getExpenseColor(index)  
                      }  
                    ]}   
                  />  
                </View>  
              </View>  
            ))}  
          </View>  
      
          {/* Flujo de caja */}  
          <View style={styles.cashFlowSection}>  
            <Text style={styles.sectionTitle}>Flujo de Caja</Text>  
            <View style={styles.cashFlowGrid}>  
              <View style={styles.cashFlowCard}>  
                <Feather name="arrow-down-circle" size={32} color="#4caf50" />  
                <Text style={styles.cashFlowValue}>{formatCurrency(financialData.cashFlow.incoming)}</Text>  
                <Text style={styles.cashFlowLabel}>Entradas</Text>  
              </View>  
              <View style={styles.cashFlowCard}>  
                <Feather name="arrow-up-circle" size={32} color="#f44336" />  
                <Text style={styles.cashFlowValue}>{formatCurrency(financialData.cashFlow.outgoing)}</Text>  
                <Text style={styles.cashFlowLabel}>Salidas</Text>  
              </View>  
              <View style={styles.cashFlowCard}>  
                <Feather name="dollar-sign" size={32} color="#1a73e8" />  
                <Text style={[  
                  styles.cashFlowValue,   
                  { color: financialData.cashFlow.balance >= 0 ? "#4caf50" : "#f44336" }  
                ]}>  
                  {formatCurrency(financialData.cashFlow.balance)}  
                </Text>  
                <Text style={styles.cashFlowLabel}>Balance</Text>  
              </View>  
            </View>  
          </View>  
      
          {/* Impuestos */}  
          <View style={styles.taxSection}>  
            <Text style={styles.sectionTitle}>Resumen de Impuestos</Text>  
            <View style={styles.taxGrid}>  
              <View style={styles.taxCard}>  
                <Text style={styles.taxLabel}>Impuestos Adeudados</Text>  
                <Text style={styles.taxValue}>{formatCurrency(financialData.taxes.owed)}</Text>  
              </View>  
              <View style={styles.taxCard}>  
                <Text style={styles.taxLabel}>Impuestos Pagados</Text>  
                <Text style={[styles.taxValue, { color: "#4caf50" }]}>{formatCurrency(financialData.taxes.paid)}</Text>  
              </View>  
              <View style={styles.taxCard}>  
                <Text style={styles.taxLabel}>Pendientes de Pago</Text>  
                <Text style={[styles.taxValue, { color: "#f44336" }]}>{formatCurrency(financialData.taxes.pending)}</Text>  
              </View>  
            </View>  
          </View>  
      
          {/* Acciones de reportes */}  
          <View style={styles.actionsSection}>  
            <Text style={styles.sectionTitle}>Generar Reportes</Text>  
            <TouchableOpacity   
              style={styles.reportButton}  
              onPress={() => generateReport("Estado de Resultados")}  
            >  
              <Feather name="file-text" size={20} color="#1a73e8" />  
              <Text style={styles.reportButtonText}>Estado de Resultados</Text>  
              <Feather name="download" size={16} color="#666" />  
            </TouchableOpacity>  
      
            <TouchableOpacity   
              style={styles.reportButton}  
              onPress={() => generateReport("Balance General")}  
            >  
              <Feather name="bar-chart-2" size={20} color="#1a73e8" />  
              <Text style={styles.reportButtonText}>Balance General</Text>  
              <Feather name="download" size={16} color="#666" />  
            </TouchableOpacity>  
      
            <TouchableOpacity   
              style={styles.reportButton}  
              onPress={() => generateReport("Flujo de Caja")}  
            >  
              <Feather name="trending-up" size={20} color="#1a73e8" />  
              <Text style={styles.reportButtonText}>Flujo de Caja</Text>  
              <Feather name="download" size={16} color="#666" />  
            </TouchableOpacity>  
      
            <TouchableOpacity   
              style={styles.reportButton}  
              onPress={() => generateReport("Declaración de Impuestos")}  
            >  
              <Feather name="file-minus" size={20} color="#1a73e8" />  
              <Text style={styles.reportButtonText}>Declaración de Impuestos</Text>  
              <Feather name="download" size={16} color="#666" />  
            </TouchableOpacity>  
          </View>  
        </ScrollView>  
      )  
      
      const getExpenseColor = (index: number) => {  
        const colors = ["#1a73e8", "#4caf50", "#ff9800", "#9c27b0", "#f44336"]  
        return colors[index % colors.length]  
      }  
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
      summaryContainer: {  
        flexDirection: "row",  
        flexWrap: "wrap",  
        padding: 16,  
        gap: 12,  
      },  
      financialCard: {  
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
      cardHeader: {  
        flexDirection: "row",  
        alignItems: "center",  
        marginBottom: 8,  
      },  
      cardIcon: {  
        width: 32,  
        height: 32,  
        borderRadius: 16,  
        justifyContent: "center",  
        alignItems: "center",  
        marginRight: 8,  
      },  
      cardTitle: {  
        fontSize: 14,  
        color: "#666",  
        fontWeight: "500",  
      },  
      cardValue: {  
        fontSize: 18,  
        fontWeight: "bold",  
        color: "#333",  
        marginBottom: 4,  
      },  
      cardSubtitle: {  
        fontSize: 12,  
        color: "#999",  
      },  
      cardTrend: {  
        flexDirection: "row",  
        alignItems: "center",  
        marginTop: 4,  
      },  
      cardTrendText: {  
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
      expensesSection: {  
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
      expenseItem: {  
        marginBottom: 16,  
      },  
      expenseInfo: {  
        flexDirection: "row",  
        justifyContent: "space-between",  
        alignItems: "center",  
        marginBottom: 8,  
      },  
      expenseName: {  
        fontSize: 16,  
        color: "#333",  
        fontWeight: "500",  
      },  
      expenseAmount: {  
        fontSize: 16,  
        color: "#666",  
        fontWeight: "600",  
      },  
      expenseBar: {  
        height: 8,  
        backgroundColor: "#f0f0f0",  
        borderRadius: 4,  
        overflow: "hidden",  
      },  
      expenseBarFill: {  
        height: "100%",  
        borderRadius: 4,  
      },  
      cashFlowSection: {  
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
      cashFlowGrid: {  
        flexDirection: "row",  
        justifyContent: "space-between",  
      },  
      cashFlowCard: {  
        alignItems: "center",  
        flex: 1,  
        padding: 12,  
      },  
      cashFlowValue: {  
        fontSize: 16,  
        fontWeight: "bold",  
        color: "#333",  
        marginTop: 8,  
        textAlign: "center",  
      },  
      cashFlowLabel: {  
        fontSize: 12,  
        color: "#666",  
        marginTop: 4,  
        textAlign: "center",  
      },  
      taxSection: {  
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
      taxGrid: {  
        gap: 12,  
      },  
      taxCard: {  
        flexDirection: "row",  
        justifyContent: "space-between",  
        alignItems: "center",  
        paddingVertical: 12,  
        paddingHorizontal: 16,  
        backgroundColor: "#f8f9fa",  
        borderRadius: 8,  
      },  
      taxLabel: {  
        fontSize: 14,  
        color: "#666",  
        fontWeight: "500",  
      },  
      taxValue: {  
        fontSize: 16,  
        color: "#333",  
        fontWeight: "bold",  
      },  
      actionsSection: {  
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
      reportButton: {  
        flexDirection: "row",  
        alignItems: "center",  
        paddingVertical: 16,  
        paddingHorizontal: 16,  
        backgroundColor: "#f8f9fa",  
        borderRadius: 8,  
        marginBottom: 12,  
        borderWidth: 1,  
        borderColor: "#e1e4e8",  
      },  
      reportButtonText: {  
        flex: 1,  
        fontSize: 16,  
        fontWeight: "500",  
        color: "#333",  
        marginLeft: 12,  
      },  
    })