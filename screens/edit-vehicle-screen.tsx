"use client"  
import { useState, useCallback, useEffect } from "react"  
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
import { vehicleService } from "../services/supabase/vehicle-service"  
import ACCESOS_SERVICES from "../services/supabase/access-service"  
import USER_SERVICE from "../services/supabase/user-service"  
  
interface EditVehicleScreenProps {  
  route: { params: { vehicleId: string } }  
  navigation: any  
}  
  
export default function EditVehicleScreen({ route, navigation }: EditVehicleScreenProps) {  
  console.log("🚗 EditVehicleScreen - Iniciando con vehicleId:", route.params.vehicleId)  
    
  const { vehicleId } = route.params  
  const { user } = useAuth()  
    
  const [loading, setLoading] = useState(true)  
  const [saving, setSaving] = useState(false)  
  const [vehicle, setVehicle] = useState<any>(null)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
    
  const [formData, setFormData] = useState({  
    make: "",  
    model: "",  
    year: "",  
    license_plate: "",  
    color: "",  
    vin: "",  
  })  
  
  const loadVehicleData = useCallback(async () => {  
    try {  
      console.log("🔄 EditVehicleScreen - Cargando datos del vehículo:", vehicleId)  
      setLoading(true)  
      setError(null)  
  
      if (!user?.id) {  
        console.error("❌ EditVehicleScreen - Usuario no autenticado")  
        return  
      }  
  
      // Validar permisos  
      const userTallerId = await USER_SERVICE.GET_TALLER_ID(user.id)  
      console.log("🏢 EditVehicleScreen - Taller ID:", userTallerId)  
        
      if (!userTallerId) {  
        setError("No se pudo obtener la información del taller")  
        return  
      }  
  
      const userPermissions = await ACCESOS_SERVICES.GET_PERMISOS_USUARIO(user.id, userTallerId)  
      console.log("🔐 EditVehicleScreen - Permisos usuario:", userPermissions)  
      setUserRole(userPermissions?.rol || 'client')  
  
      // Cargar datos del vehículo  
      const vehicleData = await vehicleService.getVehicleById(vehicleId)  
      console.log("🚗 EditVehicleScreen - Datos del vehículo:", vehicleData)  
        
      if (!vehicleData) {  
        setError("Vehículo no encontrado")  
        return  
      }  
  
      // Verificar permisos de acceso  
      if (userPermissions?.rol === 'client' && vehicleData.client_id !== user.id) {  
        console.error("❌ EditVehicleScreen - Sin permisos para editar este vehículo")  
        setError("No tienes permisos para editar este vehículo")  
        return  
      }  
  
      setVehicle(vehicleData)  
      setFormData({  
        make: vehicleData.make || "",  
        model: vehicleData.model || "",  
        year: vehicleData.year?.toString() || "",  
        license_plate: vehicleData.license_plate || "",  
        color: vehicleData.color || "",  
        vin: vehicleData.vin || "",  
      })  
  
    } catch (error) {  
      console.error("❌ EditVehicleScreen - Error cargando datos:", error)  
      setError("No se pudo cargar la información del vehículo")  
    } finally {  
      setLoading(false)  
    }  
  }, [vehicleId, user])  
  
  useEffect(() => {  
    loadVehicleData()  
  }, [loadVehicleData])  
  
  const handleSave = async () => {  
    try {  
      console.log("💾 EditVehicleScreen - Guardando cambios:", formData)  
      setSaving(true)  
  
      const updateData = {  
        ...formData,  
        year: parseInt(formData.year) || null,  
      }  
  
      await vehicleService.updateVehicle(vehicleId, updateData)  
      console.log("✅ EditVehicleScreen - Vehículo actualizado exitosamente")  
        
      Alert.alert("Éxito", "Vehículo actualizado correctamente", [  
        { text: "OK", onPress: () => navigation.goBack() }  
      ])  
  
    } catch (error) {  
      console.error("❌ EditVehicleScreen - Error guardando:", error)  
      Alert.alert("Error", "No se pudo actualizar el vehículo")  
    } finally {  
      setSaving(false)  
    }  
  }  
  
  if (loading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#1a73e8" />  
        <Text style={styles.loadingText}>Cargando vehículo...</Text>  
      </View>  
    )  
  }  
  
  if (error) {  
    return (  
      <View style={styles.errorContainer}>  
        <Feather name="alert-circle" size={64} color="#f44336" />  
        <Text style={styles.errorText}>{error}</Text>  
        <TouchableOpacity style={styles.retryButton} onPress={loadVehicleData}>  
          <Text style={styles.retryButtonText}>Reintentar</Text>  
        </TouchableOpacity>  
      </View>  
    )  
  }  
  
  return (  
    <View style={styles.container}>  
      <View style={styles.header}>  
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>  
          <Feather name="arrow-left" size={24} color="#333" />  
        </TouchableOpacity>  
        <Text style={styles.headerTitle}>Editar Vehículo</Text>  
        <View style={styles.placeholder} />  
      </View>  
  
      <ScrollView style={styles.content}>  
        <View style={styles.form}>  
          <View style={styles.inputGroup}>  
            <Text style={styles.inputLabel}>Marca *</Text>  
            <TextInput  
              style={styles.input}  
              value={formData.make}  
              onChangeText={(value) => setFormData(prev => ({ ...prev, make: value }))}  
              placeholder="Ej: Toyota"  
            />  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.inputLabel}>Modelo *</Text>  
            <TextInput  
              style={styles.input}  
              value={formData.model}  
              onChangeText={(value) => setFormData(prev => ({ ...prev, model: value }))}  
              placeholder="Ej: Corolla"  
            />  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.inputLabel}>Año *</Text>  
            <TextInput  
              style={styles.input}  
              value={formData.year}  
              onChangeText={(value) => setFormData(prev => ({ ...prev, year: value }))}  
              placeholder="Ej: 2020"  
              keyboardType="numeric"  
            />  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.inputLabel}>Placa *</Text>  
            <TextInput  
              style={styles.input}  
              value={formData.license_plate}  
              onChangeText={(value) => setFormData(prev => ({ ...prev, license_plate: value }))}  
              placeholder="Ej: ABC-123"  
              autoCapitalize="characters"  
            />  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.inputLabel}>Color</Text>  
            <TextInput  
              style={styles.input}  
              value={formData.color}  
              onChangeText={(value) => setFormData(prev => ({ ...prev, color: value }))}  
              placeholder="Ej: Blanco"  
            />  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.inputLabel}>VIN</Text>  
            <TextInput  
              style={styles.input}  
              value={formData.vin}  
              onChangeText={(value) => setFormData(prev => ({ ...prev, vin: value }))}  
              placeholder="Número de identificación del vehículo"  
              autoCapitalize="characters"  
            />  
          </View>  
        </View>  
      </ScrollView>  
  
      <View style={styles.footer}>  
        <TouchableOpacity  
          style={[styles.button, styles.cancelButton]}  
          onPress={() => navigation.goBack()}  
          disabled={saving}  
        >  
          <Text style={styles.cancelButtonText}>Cancelar</Text>  
        </TouchableOpacity>  
          
        <TouchableOpacity  
          style={[styles.button, styles.saveButton]}  
          onPress={handleSave}  
          disabled={saving}  
        >  
          {saving ? (  
            <ActivityIndicator size="small" color="#fff" />  
          ) : (  
            <>  
              <Feather name="save" size={20} color="#fff" />  
              <Text style={styles.saveButtonText}>Guardar</Text>  
            </>  
          )}  
        </TouchableOpacity>  
      </View>  
    </View>  
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
    justifyContent: "space-between",  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    backgroundColor: "#fff",  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
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
    padding: 16,  
  },  
  form: {  
    backgroundColor: "#fff",  
    borderRadius: 12,  
    padding: 16,  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 2 },  
    shadowOpacity: 0.1,  
    shadowRadius: 4,  
    elevation: 3,  
  },  
  inputGroup: {  
    marginBottom: 16,  
  },  
  inputLabel: {  
    fontSize: 16,fontWeight: "500",  
    color: "#333",  
    marginBottom: 8,  
  },  
  input: {  
    backgroundColor: "#f8f9fa",  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
    borderRadius: 8,  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    fontSize: 16,  
    color: "#333",  
  },  
  footer: {  
    flexDirection: "row",  
    padding: 16,  
    backgroundColor: "#fff",  
    borderTopWidth: 1,  
    borderTopColor: "#e1e4e8",  
    gap: 12,  
  },  
  button: {  
    flex: 1,  
    paddingVertical: 12,  
    borderRadius: 8,  
    alignItems: "center",  
    justifyContent: "center",  
    flexDirection: "row",  
    gap: 8,  
  },  
  cancelButton: {  
    backgroundColor: "#f8f9fa",  
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