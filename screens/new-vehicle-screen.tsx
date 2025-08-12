"use client"  
  
import { useState, useCallback } from "react"  
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
import { CreateVehicleData } from "../types/vehicle"  
  
interface NewVehicleScreenProps {  
  navigation: any  
  route: any  
}  
  
export default function NewVehicleScreen({ navigation, route }: NewVehicleScreenProps) {  
  const { user } = useAuth()  
  const [loading, setLoading] = useState(false)  
  const [formData, setFormData] = useState<Partial<CreateVehicleData>>({  
    make: "",  
    model: "",  
    year: "",  
    license_plate: "",  
    vin: "",  
    color: "",  
    mileage: 0,  
    fuel_type: "gasoline",  
    transmission: "manual",  
    notes: "",  
  })  
  
  const handleSave = async () => {  
    try {  
      setLoading(true)  
        
      if (!user?.id) {  
        Alert.alert("Error", "Usuario no autenticado")  
        return  
      }  
  
      // Validar campos requeridos  
      if (!formData.make || !formData.model || !formData.year || !formData.license_plate) {  
        Alert.alert("Error", "Por favor completa todos los campos requeridos")  
        return  
      }  
  
      const vehicleData: CreateVehicleData = {  
        client_id: user.id,  
        make: formData.make,  
        model: formData.model,  
        year: formData.year,  
        license_plate: formData.license_plate,  
        vin: formData.vin,  
        color: formData.color,  
        mileage: formData.mileage || 0,  
        fuel_type: formData.fuel_type || "gasoline",  
        transmission: formData.transmission || "manual",  
        notes: formData.notes,  
      }  
  
      await vehicleService.createVehicle(vehicleData)  
        
      Alert.alert("Éxito", "Vehículo creado correctamente", [  
        { text: "OK", onPress: () => navigation.goBack() }  
      ])  
  
    } catch (error) {  
      console.error("Error creating vehicle:", error)  
      Alert.alert("Error", "No se pudo crear el vehículo")  
    } finally {  
      setLoading(false)  
    }  
  }  
  
  return (  
    <ScrollView style={styles.container}>  
      <View style={styles.header}>  
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>  
          <Feather name="arrow-left" size={24} color="#333" />  
        </TouchableOpacity>  
        <Text style={styles.headerTitle}>Nuevo Vehículo</Text>  
      </View>  
  
      <View style={styles.form}>  
        <View style={styles.formGroup}>  
          <Text style={styles.label}>Marca *</Text>  
          <TextInput  
            style={styles.input}  
            value={formData.make}  
            onChangeText={(text) => setFormData(prev => ({ ...prev, make: text }))}  
            placeholder="Ej: Toyota"  
          />  
        </View>  
  
        <View style={styles.formGroup}>  
          <Text style={styles.label}>Modelo *</Text>  
          <TextInput  
            style={styles.input}  
            value={formData.model}  
            onChangeText={(text) => setFormData(prev => ({ ...prev, model: text }))}  
            placeholder="Ej: Corolla"  
          />  
        </View>  
  
        <View style={styles.formGroup}>  
          <Text style={styles.label}>Año *</Text>  
          <TextInput  
            style={styles.input}  
            value={formData.year}  
            onChangeText={(text) => setFormData(prev => ({ ...prev, year: text }))}  
            placeholder="Ej: 2020"  
            keyboardType="numeric"  
          />  
        </View>  
  
        <View style={styles.formGroup}>  
          <Text style={styles.label}>Placa *</Text>  
          <TextInput  
            style={styles.input}  
            value={formData.license_plate}  
            onChangeText={(text) => setFormData(prev => ({ ...prev, license_plate: text }))}  
            placeholder="Ej: ABC-123"  
          />  
        </View>  
  
        <View style={styles.formGroup}>  
          <Text style={styles.label}>VIN</Text>  
          <TextInput  
            style={styles.input}  
            value={formData.vin}  
            onChangeText={(text) => setFormData(prev => ({ ...prev, vin: text }))}  
            placeholder="Número de identificación del vehículo"  
          />  
        </View>  
  
        <View style={styles.formGroup}>  
          <Text style={styles.label}>Color</Text>  
          <TextInput  
            style={styles.input}  
            value={formData.color}  
            onChangeText={(text) => setFormData(prev => ({ ...prev, color: text }))}  
            placeholder="Ej: Blanco"  
          />  
        </View>  
  
        <View style={styles.formGroup}>  
          <Text style={styles.label}>Kilometraje</Text>  
          <TextInput  
            style={styles.input}  
            value={formData.mileage?.toString()}  
            onChangeText={(text) => setFormData(prev => ({ ...prev, mileage: parseInt(text) || 0 }))}  
            placeholder="0"  
            keyboardType="numeric"  
          />  
        </View>  
  
        <View style={styles.formGroup}>  
          <Text style={styles.label}>Notas</Text>  
          <TextInput  
            style={[styles.input, styles.textArea]}  
            value={formData.notes}  
            onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}  
            placeholder="Notas adicionales..."  
            multiline  
            numberOfLines={3}  
          />  
        </View>  
  
        <TouchableOpacity   
          style={styles.saveButton}   
          onPress={handleSave}  
          disabled={loading}  
        >  
          {loading ? (  
            <ActivityIndicator size="small" color="#fff" />  
          ) : (  
            <Text style={styles.saveButtonText}>Guardar Vehículo</Text>  
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
  form: {  
    padding: 16,  
  },  
  formGroup: {  
    marginBottom: 16,  
  },  
  label: {  
    fontSize: 14,  
    fontWeight: "600",  
    color: "#333",  
    marginBottom: 8,  
  },  
  input: {  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
    borderRadius: 8,  
    paddingHorizontal: 12,  
    paddingVertical: 10,  
    fontSize: 16,  
    color: "#333",  
    backgroundColor: "#fff",  
  },  
  textArea: {  
    minHeight: 80,  
    textAlignVertical: "top",  
  },  
  saveButton: {  
    backgroundColor: "#1a73e8",  
    paddingVertical: 12,  
    borderRadius: 8,  
    alignItems: "center",  
    marginTop: 20,  
  },  
  saveButtonText: {  
    color: "#fff",  
    fontSize: 16,  
    fontWeight: "bold",  
  },  
})