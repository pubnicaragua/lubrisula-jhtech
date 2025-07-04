"use client"

import { useState } from "react"
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  SafeAreaView,
  Modal,
  ScrollView, // Import ScrollView
} from "react-native"
import { Feather } from "@expo/vector-icons"

// Datos de ejemplo
const CLIENTS_DATA = [
  {
    id: "1",
    name: "Juan Pérez",
    email: "juan.perez@ejemplo.com",
    phone: "+504 9876-5432",
    vehicles: 2,
    lastVisit: "10 Mar 2023",
  },
  {
    id: "2",
    name: "María García",
    email: "maria.garcia@ejemplo.com",
    phone: "+504 8765-4321",
    vehicles: 1,
    lastVisit: "05 Mar 2023",
  },
  {
    id: "3",
    name: "Carlos Rodríguez",
    email: "carlos.rodriguez@ejemplo.com",
    phone: "+504 7654-3210",
    vehicles: 3,
    lastVisit: "28 Feb 2023",
  },
  {
    id: "4",
    name: "Ana Martínez",
    email: "ana.martinez@ejemplo.com",
    phone: "+504 6543-2109",
    vehicles: 1,
    lastVisit: "25 Feb 2023",
  },
  {
    id: "5",
    name: "Pedro Sánchez",
    email: "pedro.sanchez@ejemplo.com",
    phone: "+504 5432-1098",
    vehicles: 2,
    lastVisit: "20 Feb 2023",
  },
]

// Componente para cada cliente en la lista
const ClientItem = ({ client, onPress }) => (
  <TouchableOpacity style={styles.clientItem} onPress={onPress}>
    <View style={styles.clientInfo}>
      <Text style={styles.clientName}>{client.name}</Text>
      <View style={styles.clientContact}>
        <Feather name="mail" size={14} color="#666" style={styles.contactIcon} />
        <Text style={styles.contactText}>{client.email}</Text>
      </View>
      <View style={styles.clientContact}>
        <Feather name="phone" size={14} color="#666" style={styles.contactIcon} />
        <Text style={styles.contactText}>{client.phone}</Text>
      </View>
    </View>
    <View style={styles.clientStats}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{client.vehicles}</Text>
        <Text style={styles.statLabel}>Vehículos</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{client.lastVisit}</Text>
        <Text style={styles.statLabel}>Última Visita</Text>
      </View>
    </View>
    <Feather name="chevron-right" size={20} color="#ccc" />
  </TouchableOpacity>
)

// Componente para filtros
const FilterButton = ({ label, active, onPress }) => (
  <TouchableOpacity style={[styles.filterButton, active && styles.filterButtonActive]} onPress={onPress}>
    <Text style={[styles.filterButtonText, active && styles.filterButtonTextActive]}>{label}</Text>
  </TouchableOpacity>
)

export default function ClientsScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("Todos")
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [clients, setClients] = useState(CLIENTS_DATA)

  // Filtros disponibles
  const filters = ["Todos", "Recientes", "Frecuentes", "Inactivos"]

  // Función para filtrar clientes
  const filterClients = (filter) => {
    setActiveFilter(filter)
    // Aquí iría la lógica real de filtrado
    setClients(CLIENTS_DATA)
  }

  // Función para buscar clientes
  const searchClients = (text) => {
    setSearchQuery(text)
    if (text.trim() === "") {
      setClients(CLIENTS_DATA)
      return
    }

    const filtered = CLIENTS_DATA.filter(
      (client) =>
        client.name.toLowerCase().includes(text.toLowerCase()) ||
        client.email.toLowerCase().includes(text.toLowerCase()) ||
        client.phone.includes(text),
    )
    setClients(filtered)
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clientes</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("NewClient")}>
          <Feather name="plus" size={24} color="#1a73e8" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Feather name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar cliente..."
            value={searchQuery}
            onChangeText={searchClients}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={() => searchClients("")}>
              <Feather name="x" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterIconButton} onPress={() => setShowFilterModal(true)}>
          <Feather name="filter" size={20} color="#1a73e8" />
        </TouchableOpacity>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScrollContent}
        >
          {filters.map((filter) => (
            <FilterButton
              key={filter}
              label={filter}
              active={filter === activeFilter}
              onPress={() => filterClients(filter)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={clients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ClientItem client={item} onPress={() => navigation.navigate("ClientDetail", { client: item })} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="users" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No se encontraron clientes</Text>
          </View>
        }
      />

      {/* Modal de Filtros */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowFilterModal(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Filtrar Clientes</Text>

              <TouchableOpacity style={styles.modalOption}>
                <Text style={styles.modalOptionText}>Todos los clientes</Text>
                {activeFilter === "Todos" && <Feather name="check" size={20} color="#1a73e8" />}
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalOption}>
                <Text style={styles.modalOptionText}>Clientes recientes</Text>
                {activeFilter === "Recientes" && <Feather name="check" size={20} color="#1a73e8" />}
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalOption}>
                <Text style={styles.modalOptionText}>Clientes frecuentes</Text>
                {activeFilter === "Frecuentes" && <Feather name="check" size={20} color="#1a73e8" />}
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalOption}>
                <Text style={styles.modalOptionText}>Clientes inactivos</Text>
                {activeFilter === "Inactivos" && <Feather name="check" size={20} color="#1a73e8" />}
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowFilterModal(false)}>
                <Text style={styles.modalCloseButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
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
  addButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
  },
  filterIconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  filtersContainer: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  filtersScrollContent: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: "#f0f0f0",
  },
  filterButtonActive: {
    backgroundColor: "#e6f0ff",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#666",
  },
  filterButtonTextActive: {
    color: "#1a73e8",
    fontWeight: "500",
  },
  listContent: {
    padding: 16,
  },
  clientItem: {
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
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  clientContact: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  contactIcon: {
    marginRight: 6,
  },
  contactText: {
    fontSize: 14,
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
    fontSize: 12,
    color: "#666",
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#eee",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#333",
  },
  modalCloseButton: {
    marginTop: 16,
    backgroundColor: "#1a73e8",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
})

