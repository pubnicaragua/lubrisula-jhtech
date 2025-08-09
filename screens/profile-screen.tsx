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
  TextInput,  
  Modal,  
} from "react-native"  
import { Feather, MaterialIcons } from "@expo/vector-icons"  
import { useAuth } from "../context/auth-context"  
import USER_SERVICE from "../services/USER_SERVICES.SERVICE" 
import CLIENTS_SERVICES, { ClienteType } from "../services/CLIENTES_SERVICES.SERVICE"  
import ACCESOS_SERVICES from "../services/ACCESOS_SERVICES.service"  
  
export default function ProfileScreen({ navigation }) {  
  const { user, logout } = useAuth()  
  const [loading, setLoading] = useState(true)  
  const [updating, setUpdating] = useState(false)  
  const [userProfile, setUserProfile] = useState<ClienteType | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
  const [editModalVisible, setEditModalVisible] = useState(false)  
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  
  const [editFormData, setEditFormData] = useState({  
    name: "",  
    email: "",  
    phone: "",  
    company: "",  
  })  
  
  const [passwordFormData, setPasswordFormData] = useState({  
    currentPassword: "",  
    newPassword: "",  
    confirmPassword: "",  
  })  
  
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})  
  
  const loadUserProfile = useCallback(async () => {  
    try {  
      setLoading(true)  
      setError(null)  
  
      if (!user?.id) return  
  
      // Obtener perfil del usuario  
      const profile = await CLIENTS_SERVICES.GET_CLIENTS_BY_ID(user.id)  
      setUserProfile(profile)  
  
      // Obtener rol del usuario  
      const userTallerId = await USER_SERVICE.GET_TALLER_ID(user.id)  
      const userPermissions = await ACCESOS_SERVICES.GET_PERMISOS_USUARIO(user.id, userTallerId)  
      setUserRole(userPermissions?.rol || 'client')  
  
      // Inicializar datos del formulario de edición  
      setEditFormData({  
        name: profile.name || "",  
        email: profile.email || "",  
        phone: profile.phone || "",  
        company: profile.company || "",  
      })  
  
    } catch (error) {  
      console.error("Error loading user profile:", error)  
      setError("No se pudo cargar el perfil del usuario")  
    } finally {  
      setLoading(false)  
    }  
  }, [user])  
  
  useEffect(() => {  
    loadUserProfile()  
  }, [loadUserProfile])  
  
  const handleUpdateProfile = async () => {  
    try {  
      setUpdating(true)  
  
      const updatedProfile = {  
        ...userProfile,  
        ...editFormData,  
        updated_at: new Date().toISOString()  
      }  
  
      await CLIENTS_SERVICES.UPDATE_CLIENTE(user.id, updatedProfile)  
      setUserProfile(updatedProfile)  
      setEditModalVisible(false)  
  
      Alert.alert("Éxito", "Perfil actualizado correctamente")  
    } catch (error) {  
      console.error("Error updating profile:", error)  
      Alert.alert("Error", "No se pudo actualizar el perfil")  
    } finally {  
      setUpdating(false)  
    }  
  }  
  
  const validatePasswordForm = () => {  
    const errors: Record<string, string> = {}  
  
    if (!passwordFormData.currentPassword) {  
      errors.currentPassword = "La contraseña actual es requerida"  
    }  
  
    if (!passwordFormData.newPassword) {  
      errors.newPassword = "La nueva contraseña es requerida"  
    } else if (passwordFormData.newPassword.length < 6) {  
      errors.newPassword = "La contraseña debe tener al menos 6 caracteres"  
    }  
  
    if (!passwordFormData.confirmPassword) {  
      errors.confirmPassword = "Confirma la nueva contraseña"  
    } else if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {  
      errors.confirmPassword = "Las contraseñas no coinciden"  
    }  
  
    setPasswordErrors(errors)  
    return Object.keys(errors).length === 0  
  }  
  
  const handleChangePassword = async () => {  
    if (!validatePasswordForm()) return  
  
    try {  
      setUpdating(true)  
  
      // En un escenario real, aquí validarías la contraseña actual  
      // y actualizarías la contraseña en el sistema de autenticación  
      await USER_SERVICE.CHANGE_PASSWORD(user.id, passwordFormData.currentPassword, passwordFormData.newPassword)  
  
      setChangePasswordModalVisible(false)  
      setPasswordFormData({  
        currentPassword: "",  
        newPassword: "",  
        confirmPassword: "",  
      })  
  
      Alert.alert("Éxito", "Contraseña cambiada correctamente")  
    } catch (error) {  
      console.error("Error changing password:", error)  
      Alert.alert("Error", "No se pudo cambiar la contraseña")  
    } finally {  
      setUpdating(false)  
    }  
  }  
  
  const handleLogout = () => {  
    Alert.alert(  
      "Cerrar Sesión",  
      "¿Estás seguro de que quieres cerrar sesión?",  
      [  
        { text: "Cancelar", style: "cancel" },  
        {  
          text: "Cerrar Sesión",  
          style: "destructive",  
          onPress: logout  
        }  
      ]  
    )  
  }  
  
  const renderEditModal = () => (  
    <Modal  
      visible={editModalVisible}  
      animationType="slide"  
      presentationStyle="pageSheet"  
    >  
      <View style={styles.modalContainer}>  
        <View style={styles.modalHeader}>  
          <Text style={styles.modalTitle}>Editar Perfil</Text>  
          <TouchableOpacity  
            onPress={() => setEditModalVisible(false)}  
            style={styles.closeButton}  
          >  
            <Feather name="x" size={24} color="#666" />  
          </TouchableOpacity>  
        </View>  
  
        <ScrollView style={styles.modalContent}>  
          <View style={styles.inputGroup}>  
            <Text style={styles.inputLabel}>Nombre</Text>  
            <TextInput  
              style={styles.input}  
              value={editFormData.name}  
              onChangeText={(value) =>
                setEditFormData(prev => ({ ...prev, name: value }))  
              }  
              placeholder="Nombre completo"  
              autoCapitalize="words"  
            />  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.inputLabel}>Email</Text>  
            <TextInput  
              style={styles.input}  
              value={editFormData.email}  
              onChangeText={(value) =>  
                setEditFormData(prev => ({ ...prev, email: value }))  
              }  
              placeholder="correo@ejemplo.com"  
              keyboardType="email-address"  
              autoCapitalize="none"  
            />  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.inputLabel}>Teléfono</Text>  
            <TextInput  
              style={styles.input}  
              value={editFormData.phone}  
              onChangeText={(value) =>  
                setEditFormData(prev => ({ ...prev, phone: value }))  
              }  
              placeholder="+505 8888-8888"  
              keyboardType="phone-pad"  
            />  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.inputLabel}>Empresa</Text>  
            <TextInput  
              style={styles.input}  
              value={editFormData.company}  
              onChangeText={(value) =>  
                setEditFormData(prev => ({ ...prev, company: value }))  
              }  
              placeholder="Nombre de la empresa"  
              autoCapitalize="words"  
            />  
          </View>  
        </ScrollView>  
  
        <View style={styles.modalFooter}>  
          <TouchableOpacity  
            style={[styles.modalButton, styles.cancelButton]}  
            onPress={() => setEditModalVisible(false)}  
            disabled={updating}  
          >  
            <Text style={styles.cancelButtonText}>Cancelar</Text>  
          </TouchableOpacity>  
  
          <TouchableOpacity  
            style={[styles.modalButton, styles.saveButton]}  
            onPress={handleUpdateProfile}  
            disabled={updating}  
          >  
            {updating ? (  
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
    </Modal>  
  )  
  
  const renderChangePasswordModal = () => (  
    <Modal  
      visible={changePasswordModalVisible}  
      animationType="slide"  
      presentationStyle="pageSheet"  
    >  
      <View style={styles.modalContainer}>  
        <View style={styles.modalHeader}>  
          <Text style={styles.modalTitle}>Cambiar Contraseña</Text>  
          <TouchableOpacity  
            onPress={() => setChangePasswordModalVisible(false)}  
            style={styles.closeButton}  
          >  
            <Feather name="x" size={24} color="#666" />  
          </TouchableOpacity>  
        </View>  
  
        <ScrollView style={styles.modalContent}>  
          <View style={styles.inputGroup}>  
            <Text style={styles.inputLabel}>Contraseña Actual</Text>  
            <TextInput  
              style={[styles.input, passwordErrors.currentPassword && styles.inputError]}  
              value={passwordFormData.currentPassword}  
              onChangeText={(value) =>  
                setPasswordFormData(prev => ({ ...prev, currentPassword: value }))  
              }  
              placeholder="Ingresa tu contraseña actual"  
              secureTextEntry  
            />  
            {passwordErrors.currentPassword && (  
              <Text style={styles.errorText}>{passwordErrors.currentPassword}</Text>  
            )}  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.inputLabel}>Nueva Contraseña</Text>  
            <TextInput  
              style={[styles.input, passwordErrors.newPassword && styles.inputError]}  
              value={passwordFormData.newPassword}  
              onChangeText={(value) =>  
                setPasswordFormData(prev => ({ ...prev, newPassword: value }))  
              }  
              placeholder="Mínimo 6 caracteres"  
              secureTextEntry  
            />  
            {passwordErrors.newPassword && (  
              <Text style={styles.errorText}>{passwordErrors.newPassword}</Text>  
            )}  
          </View>  
  
          <View style={styles.inputGroup}>  
            <Text style={styles.inputLabel}>Confirmar Nueva Contraseña</Text>  
            <TextInput  
              style={[styles.input, passwordErrors.confirmPassword && styles.inputError]}  
              value={passwordFormData.confirmPassword}  
              onChangeText={(value) =>  
                setPasswordFormData(prev => ({ ...prev, confirmPassword: value }))  
              }  
              placeholder="Repite la nueva contraseña"  
              secureTextEntry  
            />  
            {passwordErrors.confirmPassword && (  
              <Text style={styles.errorText}>{passwordErrors.confirmPassword}</Text>  
            )}  
          </View>  
        </ScrollView>  
  
        <View style={styles.modalFooter}>  
          <TouchableOpacity  
            style={[styles.modalButton, styles.cancelButton]}  
            onPress={() => setChangePasswordModalVisible(false)}  
            disabled={updating}  
          >  
            <Text style={styles.cancelButtonText}>Cancelar</Text>  
          </TouchableOpacity>  
  
          <TouchableOpacity  
            style={[styles.modalButton, styles.saveButton]}  
            onPress={handleChangePassword}  
            disabled={updating}  
          >  
            {updating ? (  
              <ActivityIndicator size="small" color="#fff" />  
            ) : (  
              <>  
                <Feather name="lock" size={20} color="#fff" />  
                <Text style={styles.saveButtonText}>Cambiar</Text>  
              </>  
            )}  
          </TouchableOpacity>  
        </View>  
      </View>  
    </Modal>  
  )  
  
  if (loading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#1a73e8" />  
        <Text style={styles.loadingText}>Cargando perfil...</Text>  
      </View>  
    )  
  }  
  
  if (error) {  
    return (  
      <View style={styles.errorContainer}>  
        <MaterialIcons name="error" size={64} color="#f44336" />  
        <Text style={styles.errorText}>{error}</Text>  
        <TouchableOpacity style={styles.retryButton} onPress={loadUserProfile}>  
          <Text style={styles.retryButtonText}>Reintentar</Text>  
        </TouchableOpacity>  
      </View>  
    )  
  }  
  
  return (  
    <ScrollView style={styles.container}>  
      <View style={styles.header}>  
        <View style={styles.profileImageContainer}>  
          <Feather name="user" size={48} color="#1a73e8" />  
        </View>  
        <Text style={styles.name}>{userProfile?.name || "Usuario"}</Text>  
        <View style={styles.roleBadge}>  
          <Text style={styles.roleText}>  
            {userRole === 'client' ? 'Cliente' : userRole === 'admin' ? 'Administrador' : 'Técnico'}  
          </Text>  
        </View>  
        <Text style={styles.email}>{userProfile?.email || "usuario@ejemplo.com"}</Text>  
      </View>  
  
      <View style={styles.section}>  
        <Text style={styles.sectionTitle}>Configuración de la Cuenta</Text>  
  
        <TouchableOpacity   
          style={styles.menuItem}  
          onPress={() => setEditModalVisible(true)}  
        >  
          <View style={styles.menuItemLeft}>  
            <Feather name="user" size={20} color="#1a73e8" />  
            <Text style={styles.menuItemText}>Editar Perfil</Text>  
          </View>  
          <Feather name="chevron-right" size={20} color="#999" />  
        </TouchableOpacity>  
  
        <TouchableOpacity   
          style={styles.menuItem}  
          onPress={() => setChangePasswordModalVisible(true)}  
        >  
          <View style={styles.menuItemLeft}>  
            <Feather name="lock" size={20} color="#1a73e8" />  
            <Text style={styles.menuItemText}>Cambiar Contraseña</Text>  
          </View>  
          <Feather name="chevron-right" size={20} color="#999" />  
        </TouchableOpacity>  
  
        <TouchableOpacity style={styles.menuItem}>  
          <View style={styles.menuItemLeft}>  
            <Feather name="bell" size={20} color="#1a73e8" />  
            <Text style={styles.menuItemText}>Configurar Notificaciones</Text>  
          </View>  
          <Feather name="chevron-right" size={20} color="#999" />  
        </TouchableOpacity>  
      </View>  
  
      <View style={styles.section}>  
        <Text style={styles.sectionTitle}>Soporte</Text>  
  
        <TouchableOpacity style={styles.menuItem}>  
          <View style={styles.menuItemLeft}>  
            <Feather name="help-circle" size={20} color="#1a73e8" />  
            <Text style={styles.menuItemText}>Centro de Ayuda</Text>  
          </View>  
          <Feather name="chevron-right" size={20} color="#999" />  
        </TouchableOpacity>  
  
        <TouchableOpacity style={styles.menuItem}>  
          <View style={styles.menuItemLeft}>  
            <Feather name="message-circle" size={20} color="#1a73e8" />  
            <Text style={styles.menuItemText}>Contactar Soporte</Text>  
          </View>  
          <Feather name="chevron-right" size={20} color="#999" />  
        </TouchableOpacity>  
  
        <TouchableOpacity style={styles.menuItem}>  
          <View style={styles.menuItemLeft}>  
            <Feather name="info" size={20} color="#1a73e8" />  
            <Text style={styles.menuItemText}>Acerca de AutoFlowX</Text>  
          </View>  
          <Feather name="chevron-right" size={20} color="#999" />  
        </TouchableOpacity>  
      </View>  
  
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>  
        <Feather name="log-out" size={20} color="#fff" />  
        <Text style={styles.logoutText}>Cerrar Sesión</Text>  
      </TouchableOpacity>  
  
      <View style={styles.footer}>  
        <Text style={styles.versionText}>Versión 1.0.0</Text>  
        <Text style={styles.copyrightText}>© {new Date().getFullYear()} AutoFlowX. Todos los derechos reservados.</Text>  
      </View>  
  
      {renderEditModal()}  
      {renderChangePasswordModal()}  
    </ScrollView>  
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
    backgroundColor: "#fff",  
    padding: 24,  
    alignItems: "center",  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  profileImageContainer: {  
    width: 100,  
    height: 100,  
    borderRadius: 50,  
    backgroundColor: "#f0f0f0",  
    justifyContent: "center",  
    alignItems: "center",  
    marginBottom: 16,  
  },  
  name: {  
    fontSize: 20,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 4,  
  },  
  roleBadge: {  
    backgroundColor: "#e8f0fe",  
    paddingHorizontal: 12,  
    paddingVertical: 4,  
    borderRadius: 16,  
    marginBottom: 8,  
  },  
  roleText: {  
    fontSize: 12,  
    color: "#1a73e8",  
    fontWeight: "500",  
  },  
  email: {  
    fontSize: 14,  
    color: "#666",  
  },  
  section: {  
    backgroundColor: "#fff",  
    borderRadius: 8,  
    margin: 16,  
    padding: 16,  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 1 },  
    shadowOpacity: 0.1,  
    shadowRadius: 2,  
    elevation: 2,  
  },  
  sectionTitle: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 16,  
  },  
  menuItem: {  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "space-between",  
    paddingVertical: 12,  
    borderBottomWidth: 1,  
    borderBottomColor: "#f0f0f0",  
  },  
  menuItemLeft: {  
    flexDirection: "row",  
    alignItems: "center",  
  },  
  menuItemText: {  
    fontSize: 14,  
    color: "#333",  
    marginLeft: 12,  
  },  
  logoutButton: {  
    backgroundColor: "#e53935",  
    borderRadius: 8,  
    margin: 16,  
    padding: 16,  
    flexDirection: "row",  
    justifyContent: "center",  
    alignItems: "center",  
  },  
  logoutText: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#fff",  
    marginLeft: 8,  
  },  
  footer: {  
    alignItems: "center",  
    padding: 24,  
    marginBottom: 16,  
  },  
  versionText: {  
    fontSize: 12,  
    color: "#666",  
    marginBottom: 4,  
  },  
  copyrightText: {  
    fontSize: 12,  
    color: "#999",  
    textAlign: "center",  
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
    fontSize: 20,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  closeButton: {  
    padding: 8,  
  },  
  modalContent: {  
    flex: 1,  
    padding: 16,  
  },  
  inputGroup: {  
    marginBottom: 16,  
  },  
  inputLabel: {  
    fontSize: 16,  
    fontWeight: "500",  
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
  inputError: {  
    borderColor: "#e53935",  
  },  
  errorText: {  
    fontSize: 14,  
    color: "#e53935",  
    marginTop: 4,  
  },  
  modalFooter: {  
    flexDirection: "row",  
    padding: 16,  
    borderTopWidth: 1,  
    borderTopColor: "#e1e4e8",  
  },  
  modalButton: {  
    flex: 1,  
    flexDirection: "row",  
    justifyContent: "center",  
    alignItems: "center",  
    paddingVertical: 12,  
    borderRadius: 8,  
    marginHorizontal: 8,  
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