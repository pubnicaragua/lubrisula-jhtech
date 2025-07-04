"use client"


import { useState } from "react"
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView, Dimensions, Modal } from "react-native"
import { Feather } from "@expo/vector-icons"
import { LineChart, BarChart, PieChart } from "react-native-chart-kit"

// Componente para tarjeta de reporte
const ReportCard = ({ title, icon, onPress }) => (
  <TouchableOpacity style={styles.reportCard} onPress={onPress}>
    <View style={styles.reportIconContainer}>
      <Feather name={icon} size={24} color="#1a73e8" />
    </View>
    <Text style={styles.reportTitle}>{title}</Text>
    <Feather name="chevron-right" size={20} color="#ccc" />
  </TouchableOpacity>
)

// Componente para tarjeta de estadística
const StatCard = ({ title, value, icon, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={styles.statIconContainer}>
      <Feather name={icon} size={24} color={color} />
    </View>
    <View style={styles.statContent}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  </View>
)

export default function ReportsScreen({ navigation }) {
  const [showReportModal, setShowReportModal] = useState(false)
  const [currentReport, setCurrentReport] = useState(null)

  // Ancho de la pantalla para los gráficos
  const screenWidth = Dimensions.get("window").width - 40

  // Datos de ejemplo para estadísticas
  const stats = [
    { title: "Órdenes Completadas", value: "145", icon: "check-circle", color: "#4caf50" },
    { title: "Ingresos Totales", value: "L. 258,450", icon: "dollar-sign", color: "#1a73e8" },
    { title: "Clientes Nuevos", value: "28", icon: "users", color: "#f5a623" },
    { title: "Repuestos Vendidos", value: "432", icon: "package", color: "#9c27b0" },
  ]

  // Datos de ejemplo para gráficos
  const monthlyData = {
    labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
    datasets: [
      {
        data: [25, 45, 28, 80, 99, 43],
        color: (opacity = 1) => `rgba(26, 115, 232, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ["Órdenes"],
  }

  const serviceData = {
    labels: ["Cambio Aceite", "Frenos", "Alineación", "Diagnóstico", "Eléctrico"],
    datasets: [
      {
        data: [20, 45, 28, 15, 30],
        color: (opacity = 1) => `rgba(26, 115, 232, ${opacity})`,
      },
    ],
  }

  const revenueData = [
    {
      name: "Servicios",
      population: 65,
      color: "#1a73e8",
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    },
    {
      name: "Repuestos",
      population: 35,
      color: "#f5a623",
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    },
  ]

  // Configuración de los gráficos
  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(26, 115, 232, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#1a73e8",
    },
  }

  // Función para mostrar un reporte específico
  const showReport = (report) => {
    setCurrentReport(report)
    setShowReportModal(true)
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reportes</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Feather name="calendar" size={20} color="#1a73e8" />
          <Text style={styles.filterButtonText}>Este Mes</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <StatCard key={index} title={stat.title} value={stat.value} icon={stat.icon} color={stat.color} />
          ))}
        </View>

        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Órdenes Mensuales</Text>
          <LineChart
            data={monthlyData}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={styles.reportsSection}>
          <Text style={styles.sectionTitle}>Reportes Disponibles</Text>

          <ReportCard title="Rendimiento de Servicios" icon="tool" onPress={() => showReport("services")} />

          <ReportCard title="Ventas de Repuestos" icon="package" onPress={() => showReport("parts")} />

          <ReportCard title="Clientes Frecuentes" icon="users" onPress={() => showReport("clients")} />

          <ReportCard title="Rendimiento de Técnicos" icon="user" onPress={() => showReport("technicians")} />

          <ReportCard title="Ingresos y Gastos" icon="dollar-sign" onPress={() => showReport("revenue")} />
        </View>
      </ScrollView>

      {/* Modal para mostrar reportes */}
      <Modal
        visible={showReportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {currentReport === "services" && "Rendimiento de Servicios"}
                {currentReport === "parts" && "Ventas de Repuestos"}
                {currentReport === "clients" && "Clientes Frecuentes"}
                {currentReport === "technicians" && "Rendimiento de Técnicos"}
                {currentReport === "revenue" && "Ingresos y Gastos"}
              </Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowReportModal(false)}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {currentReport === "services" && (
                <View>
                  <Text style={styles.reportDescription}>
                    Este reporte mu estra el rendimiento de los diferentes servicios ofrecidos en el taller.
                  </Text>
                  <BarChart
                    data={serviceData}
                    width={screenWidth}
                    height={220}
                    chartConfig={chartConfig}
                    style={styles.chart}
                    verticalLabelRotation={30}
                  />
                  <View style={styles.reportDetails}>
                    <View style={styles.reportDetailItem}>
                      <Text style={styles.reportDetailLabel}>Servicio más solicitado:</Text>
                      <Text style={styles.reportDetailValue}>Frenos (45)</Text>
                    </View>
                    <View style={styles.reportDetailItem}>
                      <Text style={styles.reportDetailLabel}>Servicio menos solicitado:</Text>
                      <Text style={styles.reportDetailValue}>Diagnóstico (15)</Text>
                    </View>
                    <View style={styles.reportDetailItem}>
                      <Text style={styles.reportDetailLabel}>Promedio de servicios por orden:</Text>
                      <Text style={styles.reportDetailValue}>2.3</Text>
                    </View>
                  </View>
                </View>
              )}

              {currentReport === "revenue" && (
                <View>
                  <Text style={styles.reportDescription}>
                    Este reporte muestra la distribución de ingresos por servicios y repuestos.
                  </Text>
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
                  <View style={styles.reportDetails}>
                    <View style={styles.reportDetailItem}>
                      <Text style={styles.reportDetailLabel}>Ingresos totales:</Text>
                      <Text style={styles.reportDetailValue}>L. 258,450.00</Text>
                    </View>
                    <View style={styles.reportDetailItem}>
                      <Text style={styles.reportDetailLabel}>Ingresos por servicios:</Text>
                      <Text style={styles.reportDetailValue}>L. 167,992.50 (65%)</Text>
                    </View>
                    <View style={styles.reportDetailItem}>
                      <Text style={styles.reportDetailLabel}>Ingresos por repuestos:</Text>
                      <Text style={styles.reportDetailValue}>L. 90,457.50 (35%)</Text>
                    </View>
                    <View style={styles.reportDetailItem}>
                      <Text style={styles.reportDetailLabel}>Gastos operativos:</Text>
                      <Text style={styles.reportDetailValue}>L. 125,000.00</Text>
                    </View>
                    <View style={styles.reportDetailItem}>
                      <Text style={styles.reportDetailLabel}>Utilidad neta:</Text>
                      <Text style={styles.reportDetailValue}>L. 133,450.00</Text>
                    </View>
                  </View>
                </View>
              )}

              {(currentReport === "parts" || currentReport === "clients" || currentReport === "technicians") && (
                <View style={styles.comingSoonContainer}>
                  <Feather name="clock" size={50} color="#ccc" />
                  <Text style={styles.comingSoonText}>Reporte en desarrollo</Text>
                  <Text style={styles.comingSoonDescription}>
                    Este reporte estará disponible próximamente. Estamos trabajando para brindarte la mejor experiencia.
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.exportButton}
                onPress={() => {
                  Alert.alert("Éxito", "Reporte exportado correctamente")
                  setShowReportModal(false)
                }}
              >
                <Feather name="download" size={20} color="#fff" />
                <Text style={styles.exportButtonText}>Exportar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6f0ff",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterButtonText: {
    color: "#1a73e8",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
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
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  chartSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  chart: {
    borderRadius: 12,
    marginVertical: 8,
  },
  reportsSection: {
    marginBottom: 20,
  },
  reportCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reportIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e6f0ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  reportTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
    maxHeight: 500,
  },
  reportDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    lineHeight: 20,
  },
  reportDetails: {
    marginTop: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 16,
  },
  reportDetailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  reportDetailLabel: {
    fontSize: 14,
    color: "#666",
  },
  reportDetailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  comingSoonContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a73e8",
    borderRadius: 8,
    paddingVertical: 12,
  },
  exportButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
})

