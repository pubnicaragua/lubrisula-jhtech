"use client"  
  
import { useState } from "react"  
import {  
  View,  
  Text,  
  TextInput,  
  TouchableOpacity,  
  StyleSheet,  
  ScrollView,  
  Alert,  
  ActivityIndicator,  
} from "react-native"  
import { Feather } from "@expo/vector-icons"  
import { useAuth } from "../context/auth-context"  
import CLIENTS_SERVICES from "../services/supabase/client-service"  
  
interface ClienteType {  
  id: string  
  name: string  
  email?: string  
  phone?: string
  company?: string  
  client_type: "individual" | "empresa"
  status: "Activo" | "Inactivo"  
}  

export default function NewClientScreen({ navigation }) {  
  const { user } = useAuth()  
  const [loading, setLoading] = useState(false)  
  const [formData, setFormData] = useState<Partial<ClienteType>>({  
    name: "",  
    email: "",  
    phone: "",  
    company: "",  
    client_type: "individual",  
    status: "Activo",  
  })  
  
  const [errors, setErrors] = useState<Record<string, string>>({})  
  
  const validateForm = () => {  
    const newErrors: Record<string, string> = {}  
  
    if (!formData.name?.trim()) {  
      newErrors.name = "El nombre es requerido"  
    }  
  
    if (!formData.email?.trim()) {  
      newErrors.email = "El email es requerido"  
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {  
      newErrors.email = "El email no es válido"  
    }  
  
    if (!formData.phone?.trim()) {  
      newErrors.phone = "El teléfono es requerido"  
    }  
  
    setErrors(newErrors)  
    return Object.keys(newErrors).length === 0  
  }  
  
  const handleSave = async () => {  
    if (!validateForm()) return  
  
    try {  
      setLoading(true)  
        
      const newClient = await CLIENTS_SERVICES.createClient(formData as ClienteType)  
        
      Alert.alert(  
        "Éxito",  
        "Cliente creado correctamente",  
        [  
          {  
            text: "OK",  
            onPress: () => navigation.goBack()  
          }  
        ]  
      )  
    } catch (error) {  
      console.error("Error creating client:", error)  
      Alert.alert("Error", "No se pudo crear el cliente")  
    } finally {  
      setLoading(false)  
    }  
  }  
  
  const updateFormData = (field: keyof ClienteType, value: string) => {  
    setFormData(prev => ({ ...prev, [field]: value }))  
    if (errors[field]) {  
      setErrors(prev => ({ ...prev, [field]: "" }))  
    }  
  }  
  
  return (  
    <ScrollView style={styles.container}>  
      <View style={styles.header}>  
        <Text style={styles.title}>Nuevo Cliente</Text>  
        <Text style={styles.subtitle}>Ingresa la información del cliente</Text>  
      </View>  
  
      <View style={styles.form}>  
        <View style={styles.inputGroup}>  
          <Text style={styles.label}>Nombre *</Text>  
          <TextInput  
            style={[styles.input, errors.name && styles.inputError]}  
            value={formData.name}  
            onChangeText={(value) => updateFormData('name', value)}  
            placeholder="Nombre completo del cliente"  
            autoCapitalize="words"  
          />  
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}  
        </View>  
  
        <View style={styles.inputGroup}>  
          <Text style={styles.label}>Email *</Text>  
          <TextInput  
            style={[styles.input, errors.email && styles.inputError]}  
            value={formData.email}  
            onChangeText={(value) => updateFormData('email', value)}  
            placeholder="correo@ejemplo.com"  
            keyboardType="email-address"  
            autoCapitalize="none"  
          />  
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}  
        </View>  
  
        <View style={styles.inputGroup}>  
          <Text style={styles.label}>Teléfono *</Text>  
          <TextInput  
            style={[styles.input, errors.phone && styles.inputError]}  
            value={formData.phone}  
            onChangeText={(value) => updateFormData('phone', value)}  
            placeholder="+505 8888-8888"  
            keyboardType="phone-pad"  
          />  
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}  
        </View>  
  
        <View style={styles.inputGroup}>  
          <Text style={styles.label}>Empresa (Opcional)</Text> 
          <TextInput  
            style={styles.input}  
            value={formData.company}  
            onChangeText={(value) => updateFormData('company', value)}  
            placeholder="Nombre de la empresa"  
            autoCapitalize="words"  
          />  
        </View>  
  
        <View style={styles.inputGroup}>  
          <Text style={styles.label}>Tipo de Cliente</Text>  
          <View style={styles.radioGroup}>  
            <TouchableOpacity  
              style={[  
                styles.radioOption,  
                formData.client_type === "individual" && styles.radioOptionSelected  
              ]}  
              onPress={() => updateFormData('client_type', 'individual')}  
            >  
              <View style={[  
                styles.radioCircle,  
                formData.client_type === "individual" && styles.radioCircleSelected  
              ]} />  
              <Text style={styles.radioText}>Individual</Text>  
            </TouchableOpacity>  
  
            <TouchableOpacity  
              style={[  
                styles.radioOption,  
                formData.client_type === "empresa" && styles.radioOptionSelected  
              ]}  
              onPress={() => updateFormData('client_type', 'empresa')}  
            >  
              <View style={[  
                styles.radioCircle,  
                formData.client_type === "empresa" && styles.radioCircleSelected  
              ]} />  
              <Text style={styles.radioText}>Empresa</Text>  
            </TouchableOpacity>  
          </View>  
        </View>  
      </View>  
  
      <View style={styles.footer}>  
        <TouchableOpacity  
          style={[styles.button, styles.cancelButton]}  
          onPress={() => navigation.goBack()}  
          disabled={loading}  
        >  
          <Text style={styles.cancelButtonText}>Cancelar</Text>  
        </TouchableOpacity>  
  
        <TouchableOpacity  
          style={[styles.button, styles.saveButton]}  
          onPress={handleSave}  
          disabled={loading}  
        >  
          {loading ? (  
            <ActivityIndicator size="small" color="#fff" />  
          ) : (  
            <>  
              <Feather name="save" size={20} color="#fff" />  
              <Text style={styles.saveButtonText}>Guardar Cliente</Text>  
            </>  
          )}  
        </TouchableOpacity>  
      </View>  
    </ScrollView>  
  )  
}  
  
const styles = StyleSheet.create({  
  container: {  
    flex: 1,  
    backgroundColor: "#f8f9fa",  
  },  
  header: {  
    backgroundColor: "#fff",  
    padding: 20,  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  title: {  
    fontSize: 24,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 4,  
  },  
  subtitle: {  
    fontSize: 16,  
    color: "#666",  
  },  
  form: {  
    padding: 16,  
  },  
  inputGroup: {  
    marginBottom: 20,  
  },  
  label: {  
    fontSize: 16,  
    fontWeight: "500",  
    color: "#333",  
    marginBottom: 8,  
  },  
  input: {  
    backgroundColor: "#fff",  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
    borderRadius: 8,  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    fontSize: 16,  
    color: "#333",  
  },  
  inputError: {  
    borderColor: "#e53935",  
  },  
  errorText: {  
    fontSize: 14,  
    color: "#e53935",  
    marginTop: 4,  
  },  
  radioGroup: {  
    flexDirection: "row",  
    gap: 16,  
  },  
  radioOption: {  
    flexDirection: "row",  
    alignItems: "center",  
    paddingVertical: 8,  
  },  
  radioOptionSelected: {  
    // No additional styling needed  
  },  
  radioCircle: {  
    width: 20,  
    height: 20,  
    borderRadius: 10,  
    borderWidth: 2,  
    borderColor: "#e1e4e8",  
    marginRight: 8,  
  },  
  radioCircleSelected: {  
    borderColor: "#1a73e8",  
    backgroundColor: "#1a73e8",  
  },  
  radioText: {  
    fontSize: 16,  
    color: "#333",  
  },  
  footer: {  
    flexDirection: "row",  
    padding: 16,  
    gap: 12,  
    backgroundColor: "#fff",  
    borderTopWidth: 1,  
    borderTopColor: "#e1e4e8",  
  },  
  button: {  
    flex: 1,  
    flexDirection: "row",  
    justifyContent: "center",  
    alignItems: "center",  
    paddingVertical: 12,  
    borderRadius: 8,  
    gap: 8,  
  },  
  cancelButton: {  
    backgroundColor: "transparent",  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  cancelButtonText: {  
    fontSize: 16,  
    fontWeight: "500",  
    color: "#666",  
  },  
  saveButton: {  
    backgroundColor: "#1a73e8",  
  },  
  saveButtonText: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#fff",  
  },  
})