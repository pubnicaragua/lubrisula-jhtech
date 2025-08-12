"use client"  
  
import { useState } from "react"  
import {  
  View,  
  Text,  
  ScrollView,  
  TouchableOpacity,  
  StyleSheet,  
  ActivityIndicator,  
  Alert,  
  TextInput,  
} from "react-native"  
import { Feather, MaterialIcons } from "@expo/vector-icons"  
import { useNavigation } from '@react-navigation/native'  
import type { StackNavigationProp } from '@react-navigation/stack'  
import { useAuth } from "../context/auth-context"  
import { userService } from "../services/supabase/user-service"  
  
export default function ChangePasswordScreen() {  
  const { user } = useAuth()  
  const navigation = useNavigation<StackNavigationProp<any>>()  
  const [updating, setUpdating] = useState(false)  
  
  const [formData, setFormData] = useState({  
    currentPassword: "",  
    newPassword: "",  
    confirmPassword: "",  
  })  
  
  const [errors, setErrors] = useState<Record<string, string>>({})  
  const [showPasswords, setShowPasswords] = useState({  
    current: false,  
    new: false,  
    confirm: false,  
  })  
  
  const validateForm = () => {  
    const newErrors: Record<string, string> = {}  
  
    if (!formData.currentPassword) {  
      newErrors.currentPassword = "La contraseña actual es requerida"  
    }  
  
    if (!formData.newPassword) {  
      newErrors.newPassword = "La nueva contraseña es requerida"  
    } else if (formData.newPassword.length < 6) {  
      newErrors.newPassword = "La contraseña debe tener al menos 6 caracteres"  
    }  
  
    if (!formData.confirmPassword) {  
      newErrors.confirmPassword = "Confirma la nueva contraseña"  
    } else if (formData.newPassword !== formData.confirmPassword) {  
      newErrors.confirmPassword = "Las contraseñas no coinciden"  
    }  
  
    if (formData.currentPassword === formData.newPassword) {  
      newErrors.newPassword = "La nueva contraseña debe ser diferente a la actual"  
    }  
  
    setErrors(newErrors)  
    return Object.keys(newErrors).length === 0  
  }  
  
  const handleChangePassword = async () => {  
    if (!validateForm()) return  
  
    try {  
      setUpdating(true)  
  
      const { error } = await userService.updatePassword(  
        formData.currentPassword,  
        formData.newPassword  
      )  
  
      if (error) {  
        Alert.alert("Error", error.message)  
        return  
      }  
  
      Alert.alert(  
        "Éxito",  
        "Contraseña cambiada correctamente",  
        [  
          {  
            text: "OK",  
            onPress: () => {  
              setFormData({  
                currentPassword: "",  
                newPassword: "",  
                confirmPassword: "",  
              })  
              navigation.goBack()  
            }  
          }  
        ]  
      )  
  
    } catch (error) {  
      console.error("Error changing password:", error)  
      Alert.alert("Error", "No se pudo cambiar la contraseña")  
    } finally {  
      setUpdating(false)  
    }  
  }  
  
  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {  
    setShowPasswords(prev => ({  
      ...prev,  
      [field]: !prev[field]  
    }))  
  }  
  
  return (  
    <View style={styles.container}>  
      <View style={styles.header}>  
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>  
          <Feather name="arrow-left" size={24} color="#333" />  
        </TouchableOpacity>  
        <Text style={styles.headerTitle}>Cambiar Contraseña</Text>  
        <View style={styles.placeholder} />  
      </View>  
  
      <ScrollView style={styles.content}>  
        <View style={styles.infoSection}>  
          <MaterialIcons name="security" size={48} color="#1a73e8" />  
          <Text style={styles.infoTitle}>Seguridad de tu cuenta</Text>  
          <Text style={styles.infoDescription}>  
            Asegúrate de usar una contraseña segura que contenga al menos 6 caracteres.  
          </Text>  
        </View>  
  
        <View style={styles.formSection}>  
          <View style={styles.inputGroup}>  
            <Text style={styles.inputLabel}>Contraseña Actual *</Text>  
            <View style={styles.passwordInputContainer}>  
              <TextInput  
                style={[styles.passwordInput, errors.currentPassword && styles.inputError]}  
                value={formData.currentPassword}  
                onChangeText={(value) => {  
                  setFormData(prev => ({ ...prev, currentPassword: value }))  
                  if (errors.currentPassword) {  
                    setErrors(prev => ({ ...prev, currentPassword: "" }))  
                  }  
                }}  
                placeholder="Ingresa tu contraseña actual"  
                secureTextEntry={!showPasswords.current}  
                autoCapitalize="none"  
              />  
              <TouchableOpacity  
                style={styles.eyeButton}  
                onPress={() => togglePasswordVisibility('current')}  
              >  
                <Feather  
                  name={showPasswords.current ? "eye-off" : "eye"}  
                  size={20}  
                  color="#666"  
                />  
              </TouchableOpacity>  
            </View>  
            {errors.currentPassword && (  
              <Text style={styles.errorText}>{errors.currentPassword}</Text>  
            )}  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.inputLabel}>Nueva Contraseña *</Text>  
            <View style={styles.passwordInputContainer}>  
              <TextInput  
                style={[styles.passwordInput, errors.newPassword && styles.inputError]}  
                value={formData.newPassword}  
                onChangeText={(value) => {  
                  setFormData(prev => ({ ...prev, newPassword: value }))  
                  if (errors.newPassword) {  
                    setErrors(prev => ({ ...prev, newPassword: "" }))  
                  }  
                }}  
                placeholder="Mínimo 6 caracteres"  
                secureTextEntry={!showPasswords.new}  
                autoCapitalize="none"  
              />  
              <TouchableOpacity  
                style={styles.eyeButton}  
                onPress={() => togglePasswordVisibility('new')}  
              >  
                <Feather  
                  name={showPasswords.new ? "eye-off" : "eye"}  
                  size={20}  
                  color="#666"  
                />  
              </TouchableOpacity>  
            </View>  
            {errors.newPassword && (  
              <Text style={styles.errorText}>{errors.newPassword}</Text>  
            )}  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.inputLabel}>Confirmar Nueva Contraseña *</Text>  
            <View style={styles.passwordInputContainer}>  
              <TextInput  
                style={[styles.passwordInput, errors.confirmPassword && styles.inputError]}  
                value={formData.confirmPassword}  
                onChangeText={(value) => {  
                  setFormData(prev => ({ ...prev, confirmPassword: value }))  
                  if (errors.confirmPassword) {  
                    setErrors(prev => ({ ...prev, confirmPassword: "" }))  
                  }  
                }}  
                placeholder="Repite la nueva contraseña"  
                secureTextEntry={!showPasswords.confirm}  
                autoCapitalize="none"  
              />  
              <TouchableOpacity  
                style={styles.eyeButton}  
                onPress={() => togglePasswordVisibility('confirm')}  
              >  
                <Feather  
                  name={showPasswords.confirm ? "eye-off" : "eye"}  
                  size={20}  
                  color="#666"  
                />  
              </TouchableOpacity>  
            </View>  
            {errors.confirmPassword && (  
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>  
            )}  
          </View>  
  
          <View style={styles.securityTips}>  
            <Text style={styles.tipsTitle}>Consejos de seguridad:</Text>  
            <Text style={styles.tipItem}>• Usa al menos 6 caracteres</Text>  
            <Text style={styles.tipItem}>• Combina letras, números y símbolos</Text>  
            <Text style={styles.tipItem}>• No uses información personal</Text>  
            <Text style={styles.tipItem}>• No reutilices contraseñas de otras cuentas</Text>  
          </View>  
        </View>  
      </ScrollView>  
  
      <View style={styles.footer}>  
        <TouchableOpacity  
          style={[styles.changeButton, updating && styles.changeButtonDisabled]}  
          onPress={handleChangePassword}  
          disabled={updating}  
        >  
          {updating ? (  
            <ActivityIndicator size="small" color="#fff" />  
          ) : (  
            <>  
              <Feather name="lock" size={20} color="#fff" />  
              <Text style={styles.changeButtonText}>Cambiar Contraseña</Text>  
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
  infoSection: {  
    alignItems: "center",  
    backgroundColor: "#fff",  
    borderRadius: 8,  
    padding: 24,  
    marginBottom: 16,  
  },  
  infoTitle: {  
    fontSize: 20,  
    fontWeight: "bold",  
    color: "#333",  
    marginTop: 16,  
    marginBottom: 8,  
  },  
  infoDescription: {  
    fontSize: 14,  
    color: "#666",  
    textAlign: "center",  
    lineHeight: 20,  
  },  
  formSection: {  
    backgroundColor: "#fff",  
    borderRadius: 8,  
    padding: 16,  
  },  
  inputGroup: {  
    marginBottom: 20,  
  },  
  inputLabel: {  
    fontSize: 16,  
    fontWeight: "500",  
    color: "#333",  
    marginBottom: 8,  
  },  
  passwordInputContainer: {  
    flexDirection: "row",  
    alignItems: "center",  
    backgroundColor: "#f8f9fa",  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
    borderRadius: 8,  
  },  
  passwordInput: {  
    flex: 1,  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    fontSize: 16,  
    color: "#333",  
  },  
  eyeButton: {  
    padding: 12,  
  },  
  inputError: {  
    borderColor: "#f44336",  
  },  
  errorText: {  
    fontSize: 14,  
    color: "#f44336",  
    marginTop: 4,  
  },  
  securityTips: {  
    marginTop: 16,  
    padding: 16,  
    backgroundColor: "#f8f9fa",  
    borderRadius: 8,  
  },  
  tipsTitle: {  
    fontSize: 16,  
    fontWeight: "600",  
    color: "#333",  
    marginBottom: 8,  
  },  
  tipItem: {  
    fontSize: 14,  
    color: "#666",  
    marginBottom: 4,  
  },  
  footer: {  
    padding: 16,  
    backgroundColor: "#fff",  
    borderTopWidth: 1,  
    borderTopColor: "#e1e4e8",  
  },  
  changeButton: {  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "center",  
    backgroundColor: "#1a73e8",  
    paddingVertical: 12,  
    borderRadius: 8,  
    gap: 8,  
  },  
  changeButtonDisabled: {  
    backgroundColor: "#ccc",  
  },  
  changeButtonText: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#fff",  
  },  
})