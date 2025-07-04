"use client"

import { useState } from "react"
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native"
import { Feather } from "@expo/vector-icons"

// Componente para campo de formulario
const FormField = ({
  label,
  icon,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  secureTextEntry = false,
}) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.inputContainer}>
      <Feather name={icon} size={20} color="#666" style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
      />
    </View>
  </View>
)

export default function NewClientScreen({ navigation }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [notes, setNotes] = useState("")

  // Función para validar el formulario
  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Por favor ingresa el nombre del cliente")
      return false
    }
    if (!phone.trim()) {
      Alert.alert("Error", "Por favor ingresa el teléfono del cliente")
      return false
    }
    return true
  }

  // Función para guardar el cliente
  const saveClient = () => {
    if (validateForm()) {
      const saveClientAsync = async () => {
        try {
          // Importar servicio de cliente
          const clientService = await import("../services/client-service");
          
          // Crear nuevo cliente
          const newClient = await clientService.createClient({
            name,
            email,
            phone,
            address,
            city,
            notes,
          });
          
          if (newClient) {
            Alert.alert("Éxito", "Cliente guardado correctamente", [
              {
                text: "OK",
                onPress: () => navigation.goBack(),
              },
            ]);
          } else {
            Alert.alert("Error", "No se pudo guardar el cliente");
          }
        } catch (error) {
          console.error("Error al guardar cliente:", error);
          Alert.alert("Error", "No se pudo guardar el cliente");
        }
      };
      
      saveClientAsync();
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nuevo Cliente</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Información Personal</Text>

            <FormField
              label="Nombre Completo"
              icon="user"
              placeholder="Nombre del cliente"
              value={name}
              onChangeText={setName}
            />

            <FormField
              label="Correo Electrónico"
              icon="mail"
              placeholder="correo@ejemplo.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />

            <FormField
              label="Teléfono"
              icon="phone"
              placeholder="+504 9876-5432"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Dirección</Text>

            <FormField
              label="Dirección"
              icon="map-pin"
              placeholder="Calle, número, colonia"
              value={address}
              onChangeText={setAddress}
            />

            <FormField label="Ciudad" icon="home" placeholder="Ciudad" value={city} onChangeText={setCity} />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Notas Adicionales</Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Notas</Text>
              <View style={styles.textAreaContainer}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Información adicional sobre el cliente"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={saveClient}>
            <Text style={styles.saveButtonText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  keyboardAvoidingContainer: {
    flex: 1,
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  formSection: {
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
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  inputIcon: {
    padding: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  textAreaContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  textArea: {
    height: 100,
    fontSize: 16,
    padding: 12,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#1a73e8",
    borderRadius: 8,
    paddingVertical: 12,
    marginRight: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#1a73e8",
    fontSize: 16,
    fontWeight: "500",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#1a73e8",
    borderRadius: 8,
    paddingVertical: 12,
    marginLeft: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
})

