"use client"

import { useState } from "react"
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView, Image, FlatList } from "react-native"
import { Feather } from "@expo/vector-icons"

// Componente para sección de información
const InfoSection = ({ title, children }) => (
  <View style={styles.infoSection}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
)

// Componente para elemento de información
const InfoItem = ({ icon, label, value, color }) => (
  <View style={styles.infoItem}>
    <View style={[styles.infoIconContainer, { backgroundColor: color + "20" }]}>
      <Feather name={icon} size={16} color={color} />
    </View>
    <View style={styles.infoTextContainer}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
)

// Componente para vehículo
const VehicleItem = ({ vehicle, onPress }) => (
  <TouchableOpacity style={styles.vehicleItem} onPress={onPress}>
    <View style={styles.vehicleImageContainer}>
      <Image
        source={vehicle.image ? vehicle.image : require("../assets/car-placeholder.jpg")}
        style={styles.vehicleImage}
      />
    </View>
    <View style={styles.vehicleInfo}>
      <Text style={styles.vehicleName}>
        {vehicle.make} {vehicle.model}
      </Text>
      <Text style={styles.vehicleYear}>{vehicle.year}</Text>
      <View style={styles.vehicleDetails}>
        <View style={styles.vehicleDetail}>
          <Feather name="hash" size={12} color="#666" />
          <Text style={styles.vehicleDetailText}>{vehicle.plate}</Text>
        </View>
        <View style={styles.vehicleDetail}>
          <Feather name="droplet" size={12} color="#666" />
          <Text style={styles.vehicleDetailText}>{vehicle.color}</Text>
        </View>
      </View>
    </View>
    <Feather name="chevron-right" size={20} color="#ccc" />
  </TouchableOpacity>
)

// Componente para orden
const OrderItem = ({ order, onPress }) => (
  <TouchableOpacity style={styles.orderItem} onPress={onPress}>
    <View style={styles.orderHeader}>
      <Text style={styles.orderNumber}>Orden #{order.number}</Text>
      <View style={[styles.statusBadge, { backgroundColor: order.statusColor }]}>
        <Text style={styles.statusText}>{order.status}</Text>
      </View>
    </View>
    <View style={styles.orderDetails}>
      <Text style={styles.orderVehicle}>{order.vehicle}</Text>
      <Text style={styles.orderService}>{order.service}</Text>
    </View>
    <View style={styles.orderFooter}>
      <Text style={styles.orderDate}>{order.date}</Text>
      <Text style={styles.orderAmount}>L. {order.amount}</Text>
    </View>
  </TouchableOpacity>
)

export default function ClientDetailScreen({ route, navigation }) {
  // Obtener cliente de los parámetros de navegación
  const { client } = route.params || {
    id: "1",
    name: "Juan Pérez",
    email: "juan.perez@ejemplo.com",
    phone: "+504 9876-5432",
    address: "Col. Palmira, Calle Principal, Casa #123",
    city: "Tegucigalpa",
    since: "10 Ene 2020",
    vehicles: 2,
    lastVisit: "10 Mar 2023",
  }

  // Datos de ejemplo para vehículos
  const vehicles = [
    {
      id: "1",
      make: "Toyota",
      model: "Corolla",
      year: "2020",
      plate: "ABC-1234",
      color: "Blanco",
      vin: "1HGBH41JXMN109186",
      image: require("../assets/car-photo-1.jpg"),
    },
    {
      id: "2",
      make: "Honda",
      model: "Civic",
      year: "2019",
      plate: "XYZ-5678",
      color: "Azul",
      vin: "2FMDK3JC7CBA12345",
      image: require("../assets/car-photo-2.jpg"),
    },
  ]

  // Datos de ejemplo para órdenes
  const orders = [
    {
      id: "1",
      number: "1234",
      status: "Completada",
      statusColor: "#4caf50",
      vehicle: "Toyota Corolla 2020",
      service: "Cambio de aceite y filtro",
      date: "10 Mar 2023",
      amount: "1,250.00",
    },
    {
      id: "2",
      number: "1156",
      status: "En Proceso",
      statusColor: "#f5a623",
      vehicle: "Honda Civic 2019",
      service: "Revisión de frenos",
      date: "15 Feb 2023",
      amount: "2,500.00",
    },
    {
      id: "3",
      number: "1098",
      status: "Completada",
      statusColor: "#4caf50",
      vehicle: "Toyota Corolla 2020",
      service: "Alineación y balanceo",
      date: "05 Ene 2023",
      amount: "850.00",
    },
  ]

  const [activeTab, setActiveTab] = useState("info")

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle de Cliente</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Feather name="more-vertical" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.clientHeader}>
        <View style={styles.clientAvatar}>
          <Text style={styles.clientInitials}>
            {client.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </Text>
        </View>
        <View style={styles.clientHeaderInfo}>
          <Text style={styles.clientName}>{client.name}</Text>
          <View style={styles.clientContact}>
            <Feather name="phone" size={14} color="#666" style={styles.contactIcon} />
            <Text style={styles.contactText}>{client.phone}</Text>
          </View>
          <View style={styles.clientContact}>
            <Feather name="mail" size={14} color="#666" style={styles.contactIcon} />
            <Text style={styles.contactText}>{client.email}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate("EditClient", { client })}>
          <Feather name="edit-2" size={16} color="#1a73e8" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "info" && styles.activeTabButton]}
          onPress={() => setActiveTab("info")}
        >
          <Text style={[styles.tabButtonText, activeTab === "info" && styles.activeTabButtonText]}>Información</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "vehicles" && styles.activeTabButton]}
          onPress={() => setActiveTab("vehicles")}
        >
          <Text style={[styles.tabButtonText, activeTab === "vehicles" && styles.activeTabButtonText]}>Vehículos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "orders" && styles.activeTabButton]}
          onPress={() => setActiveTab("orders")}
        >
          <Text style={[styles.tabButtonText, activeTab === "orders" && styles.activeTabButtonText]}>Órdenes</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "info" && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <InfoSection title="Información Personal">
            <InfoItem icon="map-pin" label="Dirección" value={client.address} color="#1a73e8" />
            <InfoItem icon="home" label="Ciudad" value={client.city} color="#1a73e8" />
            <InfoItem icon="calendar" label="Cliente desde" value={client.since} color="#1a73e8" />
          </InfoSection>

          <InfoSection title="Estadísticas">
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{vehicles.length}</Text>
                <Text style={styles.statLabel}>Vehículos</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{orders.length}</Text>
                <Text style={styles.statLabel}>Órdenes</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{client.lastVisit}</Text>
                <Text style={styles.statLabel}>Última Visita</Text>
              </View>
            </View>
          </InfoSection>

          <InfoSection title="Notas">
            <Text style={styles.notesText}>
              Cliente frecuente. Prefiere ser contactado por teléfono. Generalmente trae sus vehículos para
              mantenimiento preventivo.
            </Text>
          </InfoSection>
        </ScrollView>
      )}

      {activeTab === "vehicles" && (
        <View style={styles.content}>
          <FlatList
            data={vehicles}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <VehicleItem vehicle={item} onPress={() => navigation.navigate("VehicleDetail", { vehicle: item })} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="truck" size={50} color="#ccc" />
                <Text style={styles.emptyText}>No se encontraron vehículos</Text>
              </View>
            }
          />
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => navigation.navigate("NewVehicle", { clientId: client.id })}
          >
            <Feather name="plus" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {activeTab === "orders" && (
        <View style={styles.content}>
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <OrderItem order={item} onPress={() => navigation.navigate("OrderDetail", { orderId: item.id })} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="file-text" size={50} color="#ccc" />
                <Text style={styles.emptyText}>No se encontraron órdenes</Text>
              </View>
            }
          />
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => navigation.navigate("NewOrder", { clientId: client.id })}
          >
            <Feather name="plus" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  moreButton: {
    padding: 8,
  },
  clientHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  clientAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#1a73e8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  clientInitials: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  clientHeaderInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  clientContact: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  contactIcon: {
    marginRight: 6,
  },
  contactText: {
    fontSize: 14,
    color: "#666",
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: "#1a73e8",
  },
  tabButtonText: {
    fontSize: 14,
    color: "#666",
  },
  activeTabButtonText: {
    color: "#1a73e8",
    fontWeight: "500",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  sectionContent: {},
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#eee",
  },
  notesText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  listContent: {
    paddingBottom: 80, // Extra padding for floating button
  },
  vehicleItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  vehicleImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 12,
  },
  vehicleImage: {
    width: "100%",
    height: "100%",
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
  vehicleYear: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  vehicleDetails: {
    flexDirection: "row",
  },
  vehicleDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  vehicleDetailText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  orderItem: {
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
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  orderDetails: {
    marginBottom: 8,
  },
  orderVehicle: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  orderService: {
    fontSize: 14,
    color: "#666",
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 8,
  },
  orderDate: {
    fontSize: 12,
    color: "#666",
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
  },
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1a73e8",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
})

