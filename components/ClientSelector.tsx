"use client"  
import { useState } from "react"  
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from "react-native"  
import { Feather } from "@expo/vector-icons"  
  
interface Client {  
  id: string  
  name: string  
  email: string  
}  
  
interface ClientSelectorProps {  
  clients: Client[]  
  selectedClient: Client | null  
  onClientSelect: (client: Client) => void  
  disabled?: boolean  
}  
  
export default function ClientSelector({ clients, selectedClient, onClientSelect, disabled }: ClientSelectorProps) {  
  const [modalVisible, setModalVisible] = useState(false)  
  
  console.log("👥 ClientSelector - Renderizando con", clients.length, "clientes")  
  
  return (  
    <>  
      <TouchableOpacity  
        style={[styles.selector, disabled && styles.selectorDisabled]}  
        onPress={() => {  
          console.log("👥 ClientSelector - Abriendo modal de selección")  
          setModalVisible(true)  
        }}  
        disabled={disabled}  
      >  
        <Text style={[styles.selectorText, !selectedClient && styles.placeholderText]}>  
          {selectedClient ? selectedClient.name : "Seleccionar cliente"}  
        </Text>  
        <Feather name="chevron-down" size={20} color="#666" />  
      </TouchableOpacity>  
  
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">  
        <View style={styles.modalContainer}>  
          <View style={styles.modalHeader}>  
            <Text style={styles.modalTitle}>Seleccionar Cliente</Text>  
            <TouchableOpacity onPress={() => setModalVisible(false)}>  
              <Feather name="x" size={24} color="#666" />  
            </TouchableOpacity>  
          </View>  
            
          <ScrollView style={styles.modalContent}>  
            {clients.map((client) => (  
              <TouchableOpacity  
                key={client.id}  
                style={styles.modalItem}  
                onPress={() => {  
                  console.log("👥 ClientSelector - Cliente seleccionado:", client.name)  
                  onClientSelect(client)  
                  setModalVisible(false)  
                }}  
              >  
                <Text style={styles.modalItemText}>{client.name}</Text>  
                <Text style={styles.modalItemSubtext}>{client.email}</Text>  
              </TouchableOpacity>  
            ))}  
          </ScrollView>  
        </View>  
      </Modal>  
    </>  
  )  
}  
  
const styles = StyleSheet.create({  
  selector: {  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "space-between",  
    paddingVertical: 12,  
    paddingHorizontal: 16,  
    backgroundColor: "#f5f5f5",  
    borderRadius: 8,  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  selectorDisabled: {  
    backgroundColor: "#f0f0f0",  
    opacity: 0.6,  
  },  
  selectorText: {  
    fontSize: 16,  
    color: "#333",  
    flex: 1,  
  },  
  placeholderText: {  
    color: "#999",  
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
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  modalContent: {  
    flex: 1,  
  },  
  modalItem: {  
    padding: 16,  
    borderBottomWidth: 1,  
    borderBottomColor: "#f0f0f0",  
  },  
  modalItemText: {  
    fontSize: 16,  
    color: "#333",  
    marginBottom: 4,  
  },  
  modalItemSubtext: {  
    fontSize: 14,  
    color: "#666",  
  },  
})