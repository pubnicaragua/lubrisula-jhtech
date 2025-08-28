"use client"  
  
import { useState, useCallback } from "react"  
import {  
  View,  
  Text,  
  ScrollView,  
  TouchableOpacity,  
  StyleSheet,  
  ActivityIndicator,  
  Alert,  
  Switch,  
  TextInput,  
  Modal,  
} from "react-native"  
import { Feather, MaterialIcons } from "@expo/vector-icons"  
import { useFocusEffect } from "@react-navigation/native"  
import { StackNavigationProp } from '@react-navigation/stack'  
import { RouteProp } from '@react-navigation/native'  
import { useAuth } from "../context/auth-context"  
import ACCESOS_SERVICES from "../services/supabase/access-service"  
import USER_SERVICE from "../services/supabase/user-service"  
import { RootStackParamList } from '../types/navigation'  
  
type SettingsNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>  
type SettingsRouteProp = RouteProp<RootStackParamList, 'Settings'>  
  
interface Props {  
  navigation: SettingsNavigationProp  
  route: SettingsRouteProp  
}  
  
interface UserSettings {  
  notifications: boolean  
  darkMode: boolean  
  language: string  
  autoBackup: boolean  
  biometricAuth: boolean  
}  
  
interface CompanySettings {  
  name: string  
  address: string  
  phone: string  
  email: string  
  taxId: string  
  currency: string  
}  
  
export default function SettingsScreen({ navigation, route }: Props) {  
  const { user, signOut } = useAuth()  
  const [loading, setLoading] = useState(true)  
  const [saving, setSaving] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
    
  const [userSettings, setUserSettings] = useState<UserSettings>({  
    notifications: true,  
    darkMode: false,  
    language: 'es',  
    autoBackup: true,  
    biometricAuth: false,  
  })  
    
  const [companySettings, setCompanySettings] = useState<CompanySettings>({  
    name: '',  
    address: '',  
    phone: '',  
    email: '',  
    taxId: '',  
    currency: 'USD',  
  })  
    
  const [showCompanyModal, setShowCompanyModal] = useState(false)  
  const [showLanguageModal, setShowLanguageModal] = useState(false)  
  
  const loadSettings = useCallback(async () => {  
    try {  
      setLoading(true)  
      setError(null)  
  
      if (!user?.id) return  
  
      // Validar permisos del usuario  
      const userId = user.id as string  
      const userTallerId = await USER_SERVICE.GET_TALLER_ID(userId)  
        
      if (!userTallerId) {  
        setError("No se pudo obtener la información del taller")  
        return  
      }  
        
      const userPermissions = await ACCESOS_SERVICES.GET_PERMISOS_USUARIO(userId, userTallerId)  
  setUserRole(userPermissions?.role || 'client')  
  
      // Cargar configuraciones del usuario (simulado por ahora)  
      // En una implementación real, estas vendrían de la base de datos  
      setUserSettings({  
        notifications: true,  
        darkMode: false,  
        language: 'es',  
        autoBackup: true,  
        biometricAuth: false,  
      })  
  
      // Solo admin puede ver configuraciones de empresa  
  if (userPermissions?.role === 'admin') {  
        setCompanySettings({  
          name: 'AutoFlowX Taller',  
          address: 'Dirección del taller',  
          phone: '+504 1234-5678',  
          email: 'info@autoflowx.com',  
          taxId: 'J0310000000000',  
          currency: 'USD',  
        })  
      }  
  
    } catch (error) {  
      console.error("Error loading settings:", error)  
      setError("No se pudieron cargar las configuraciones")  
    } finally {  
      setLoading(false)  
    }  
  }, [user])  
  
  useFocusEffect(  
    useCallback(() => {  
      loadSettings()  
    }, [loadSettings])  
  )  
  
  const handleUserSettingChange = (key: keyof UserSettings, value: boolean | string) => {  
    setUserSettings(prev => ({  
      ...prev,  
      [key]: value  
    }))  
  }  
  
  const handleCompanySettingChange = (key: keyof CompanySettings, value: string) => {  
    setCompanySettings(prev => ({  
      ...prev,  
      [key]: value  
    }))  
  }  
  
  const saveUserSettings = async () => {  
    try {  
      setSaving(true)  
      // En una implementación real, aquí se guardarían las configuraciones en la base de datos  
      Alert.alert("Éxito", "Configuraciones guardadas correctamente")  
    } catch (error) {  
      console.error("Error saving user settings:", error)  
      Alert.alert("Error", "No se pudieron guardar las configuraciones")  
    } finally {  
      setSaving(false)  
    }  
  }  
  
  const saveCompanySettings = async () => {  
    try {  
      setSaving(true)  
      // En una implementación real, aquí se guardarían las configuraciones de empresa  
      setShowCompanyModal(false)  
      Alert.alert("Éxito", "Configuraciones de empresa guardadas correctamente")  
    } catch (error) {  
      console.error("Error saving company settings:", error)  
      Alert.alert("Error", "No se pudieron guardar las configuraciones de empresa")  
    } finally {  
      setSaving(false)  
    }  
  }  
  
  const handleSignOut = () => {  
    Alert.alert(  
      "Cerrar Sesión",  
      "¿Estás seguro de que quieres cerrar sesión?",  
      [  
        { text: "Cancelar", style: "cancel" },  
        {  
          text: "Cerrar Sesión",  
          style: "destructive",  
          onPress: () => signOut()  
        }  
      ]  
    )  
  }  
  
  // ✅ CORREGIDO: Usar keyof para indexación segura  
  const getLanguageName = (code: string): string => {  
    const languages: Record<string, string> = {  
      'es': 'Español',  
      'en': 'English',  
      'fr': 'Français'  
    }  
    return languages[code] || 'Español'  
  }  
  
  const renderSettingItem = (  
    title: string,  
    subtitle: string,  
    value: boolean,  
    onValueChange: (value: boolean) => void,  
    icon: string  
  ) => (  
    <View style={styles.settingItem}>  
      <View style={styles.settingIcon}>  
        <Feather name={icon as any} size={20} color="#1a73e8" />  
      </View>  
      <View style={styles.settingContent}>  
        <Text style={styles.settingTitle}>{title}</Text>  
        <Text style={styles.settingSubtitle}>{subtitle}</Text>  
      </View>  
      <Switch  
        value={value}  
        onValueChange={onValueChange}  
        trackColor={{ false: "#e1e4e8", true: "#1a73e8" }}  
        thumbColor={value ? "#fff" : "#f4f3f4"}  
      />  
    </View>  
  )  
  
  const renderActionItem = (  
    title: string,  
    subtitle: string,  
    onPress: () => void,  
    icon: string,  
    rightText?: string,  
    danger?: boolean  
  ) => (  
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>  
      <View style={[styles.settingIcon, danger && { backgroundColor: '#ffebee' }]}>  
        <Feather name={icon as any} size={20} color={danger ? "#f44336" : "#1a73e8"} />  
      </View>  
      <View style={styles.settingContent}>  
        <Text style={[styles.settingTitle, danger && { color: '#f44336' }]}>{title}</Text>  
        <Text style={styles.settingSubtitle}>{subtitle}</Text>  
      </View>  
      {rightText && (  
        <Text style={styles.rightText}>{rightText}</Text>  
      )}  
      <Feather name="chevron-right" size={20} color="#ccc" />  
    </TouchableOpacity>  
  )  
  
  if (loading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#1a73e8" />  
        <Text style={styles.loadingText}>Cargando configuraciones...</Text>  
      </View>  
    )  
  }  
  
  if (error) {  
    return (  
      <View style={styles.errorContainer}>  
        <MaterialIcons name="error" size={64} color="#f44336" />  
        <Text style={styles.errorText}>{error}</Text>  
        <TouchableOpacity style={styles.retryButton} onPress={loadSettings}>  
          <Text style={styles.retryButtonText}>Reintentar</Text>  
        </TouchableOpacity>  
      </View>  
    )  
  }  
  
  return (  
    <ScrollView style={styles.container}>  
      {/* Información del usuario */}  
      <View style={styles.section}>  
        <Text style={styles.sectionTitle}>Información del Usuario</Text>  
        <View style={styles.userInfo}>  
          <View style={styles.userAvatar}>  
            <Feather name="user" size={32} color="#1a73e8" />  
          </View>  
          <View style={styles.userDetails}>  
            <Text style={styles.userName}>{user?.email || 'Usuario'}</Text>  
            <Text style={styles.userRole}>Rol: {userRole || 'Cliente'}</Text>  
          </View>  
        </View>  
      </View>  
  
      {/* Configuraciones de usuario */}  
      <View style={styles.section}>  
        <Text style={styles.sectionTitle}>Preferencias</Text>  
          
        {renderSettingItem(  
          "Notificaciones",  
          "Recibir notificaciones push",  
          userSettings.notifications,  
          (value) => handleUserSettingChange('notifications', value),  
          "bell"  
        )}  
  
        {renderSettingItem(  
          "Modo Oscuro",  
          "Usar tema oscuro en la aplicación",  
          userSettings.darkMode,  
          (value) => handleUserSettingChange('darkMode', value),  
          "moon"  
        )}  
  
        {renderSettingItem(  
          "Respaldo Automático",  
          "Sincronizar datos automáticamente",  
          userSettings.autoBackup,  
          (value) => handleUserSettingChange('autoBackup', value),  
          "cloud"  
        )}  
  
        {renderSettingItem(  
          "Autenticación Biométrica",  
          "Usar huella dactilar o Face ID",  
          userSettings.biometricAuth,  
          (value) => handleUserSettingChange('biometricAuth', value),  
          "shield"  
        )}  
  
        {renderActionItem(  
          "Idioma",  
          "Cambiar idioma de la aplicación",  
          () => setShowLanguageModal(true),  
          "globe",  
          getLanguageName(userSettings.language)  
        )}  
      </View>  
  
      {/* Configuraciones de empresa (solo admin) */}  
      {userRole === 'admin' && (  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>Configuración de Empresa</Text>  
            
          {renderActionItem(  
            "Información de la Empresa",  
            "Editar datos de la empresa",  
            () => setShowCompanyModal(true),  
            "building"  
          )}  
        </View>  
      )}  
  
      {/* Acciones */}  
      <View style={styles.section}>  
        <Text style={styles.sectionTitle}>Acciones</Text>  
          
        {renderActionItem(  
          "Guardar Configuraciones",  
          "Aplicar cambios realizados",  
          saveUserSettings,  
          "save"  
        )}  
  
        {renderActionItem(  
          "Cerrar Sesión",  
          "Salir de la aplicación",  
          handleSignOut,  
          "log-out",  
          undefined,  
          true  
        )}  
      </View>  
  
      {/* Modal de configuración de empresa */}  
      <Modal  
        visible={showCompanyModal}  
        animationType="slide"  
        presentationStyle="pageSheet"  
      >  
        <View style={styles.modalContainer}>  
          <View style={styles.modalHeader}>  
            <Text style={styles.modalTitle}>Configuración de Empresa</Text>  
            <TouchableOpacity onPress={() => setShowCompanyModal(false)}>  
              <Feather name="x" size={24} color="#666" />  
            </TouchableOpacity>  
          </View>  
  
          <ScrollView style={styles.modalContent}>  
            <View style={styles.formGroup}>  
              <Text style={styles.formLabel}>Nombre de la Empresa</Text>  
              <TextInput  
                style={styles.formInput}  
                value={companySettings.name}  
                onChangeText={(value) => handleCompanySettingChange('name', value)}  
                placeholder="Nombre de la empresa"  
              />  
            </View>  
  
            <View style={styles.formGroup}>  
              <Text style={styles.formLabel}>Dirección</Text>  
              <TextInput  
                style={styles.formInput}  
                value={companySettings.address}  
                onChangeText={(value) => handleCompanySettingChange('address', value)}  
                placeholder="Dirección completa"  
                multiline  
              />  
            </View>  
  
            <View style={styles.formGroup}>  
              <Text style={styles.formLabel}>Teléfono</Text>  
              <TextInput  
                style={styles.formInput}  
                value={companySettings.phone}  
                onChangeText={(value) => handleCompanySettingChange('phone', value)}  
                placeholder="+504 1234-5678"  
                keyboardType="phone-pad"  
              />  
            </View>  
  
            <View style={styles.formGroup}>  
              <Text style={styles.formLabel}>Email</Text>  
              <TextInput  
                style={styles.formInput}  
                value={companySettings.email}  
                onChangeText={(value) => handleCompanySettingChange('email', value)}  
                placeholder="info@empresa.com"  
                keyboardType="email-address"  
              />  
            </View>  
  
            <View style={styles.formGroup}>  
              <Text style={styles.formLabel}>RUC/Tax ID</Text>  
              <TextInput  
                style={styles.formInput}  
                value={companySettings.taxId}  
                onChangeText={(value) => handleCompanySettingChange('taxId', value)}  
                placeholder="J0310000000000"  
              />  
            </View>  
          </ScrollView>  
  
          <View style={styles.modalFooter}>  
            <TouchableOpacity  
              style={styles.cancelButton}  
              onPress={() => setShowCompanyModal(false)}  
            >  
              <Text style={styles.cancelButtonText}>Cancelar</Text>  
            </TouchableOpacity>  
            <TouchableOpacity  
              style={styles.saveButton}  
              onPress={saveCompanySettings}  
              disabled={saving}  
            >  
              {saving ? (  
                <ActivityIndicator size="small" color="#fff" />  
              ) : (  
                <Text style={styles.saveButtonText}>Guardar</Text>  
              )}  
            </TouchableOpacity>  
          </View>  
        </View>  
      </Modal>  
  
      {/* Modal de selección de idioma */}  
      <Modal  
        visible={showLanguageModal}  
        animationType="slide"  
        transparent={true}  
      >  
        <View style={styles.modalOverlay}>  
          <View style={styles.languageModal}>  
            <Text style={styles.modalTitle}>Seleccionar Idioma</Text>  
              
            {[  
              { code: 'es', name: 'Español' },  
              { code: 'en', name: 'English' },  
              { code: 'fr', name: 'Français' }  
            ].map((language) => (  
              <TouchableOpacity  
                key={language.code}  
                style={[  
                  styles.languageOption,  
                  userSettings.language === language.code && styles.languageOptionSelected  
                ]}  
                onPress={() => {  
                  handleUserSettingChange('language', language.code)  
                  setShowLanguageModal(false)  
                }}  
              >  
                <Text style={[  
                  styles.languageOptionText,  
                  userSettings.language === language.code && styles.languageOptionTextSelected  
                ]}>  
                  {language.name}  
                </Text>  
                {userSettings.language === language.code && (  
                  <Feather name="check" size={20} color="#1a73e8" />  
                )}  
              </TouchableOpacity>  
            ))}  
  
            <TouchableOpacity  
              style={styles.closeLanguageModal}  
              onPress={() => setShowLanguageModal(false)}  
            >  
              <Text style={styles.closeLanguageModalText}>Cerrar</Text>  
            </TouchableOpacity>  
          </View>  
        </View>  
      </Modal>  
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
  section: {  
    backgroundColor: "#fff",  
    marginBottom: 16,  
    paddingVertical: 16,  
  },  
  sectionTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
    paddingHorizontal: 16,  
    marginBottom: 16,  
  },  
  userInfo: {  
    flexDirection: "row",  
    alignItems: "center",  
    paddingHorizontal: 16,  
  },  
  userAvatar: {  
    width: 64,  
    height: 64,  
    borderRadius: 32,  
    backgroundColor: "#e8f0fe",  
    justifyContent: "center",  
    alignItems: "center",  
    marginRight: 16,  
  },  
  userDetails: {  
    flex: 1,  
  },  
  userName: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 4,  
  },  
  userRole: {  
    fontSize: 14,  
    color: "#666",  
  },  
  settingItem: {  
    flexDirection: "row",  
    alignItems: "center",  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    borderBottomWidth: 1,  
    borderBottomColor: "#f0f0f0",  
  },  
  settingIcon: {  
    width: 40,  
    height: 40,  
    borderRadius: 20,  
    backgroundColor: "#e8f0fe",  
    justifyContent: "center",  
    alignItems: "center",  
    marginRight: 12,  
  },  
  settingContent: {  
    flex: 1,  
  },  
  settingTitle: {  
    fontSize: 16,  
    fontWeight: "500",  
    color: "#333",  
    marginBottom: 2,  
  },  
  settingSubtitle: {  
    fontSize: 14,  
    color: "#666",  
  },  
  rightText: {  
    fontSize: 14,  
    color: "#1a73e8",  
    marginRight: 8,  
  },  
  modalContainer: {  
    flex: 1,  
    backgroundColor: "#fff",  
  },  
  modalHeader: {  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "space-between",  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
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
    padding: 16,  
  },  
  formGroup: {  
    marginBottom: 16,  
  },  
  formLabel: {  
    fontSize: 14,  
    fontWeight: "600",  
    color: "#333",  
    marginBottom: 8,  
  },  
  formInput: {  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
    borderRadius: 8,  
    paddingHorizontal: 12,  
    paddingVertical: 10,  
    fontSize: 16,  
    color: "#333",  
    backgroundColor: "#fff",  
  },  
  modalFooter: {  
    flexDirection: "row",  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    borderTopWidth: 1,  
    borderTopColor: "#e1e4e8",  
    gap: 12,  
  },  
  cancelButton: {  
    flex: 1,  
    paddingVertical: 12,  
    borderRadius: 8,  
    backgroundColor: "#f5f5f5",  
    alignItems: "center",  
  },  
  cancelButtonText: {  
    fontSize: 16,  
    color: "#666",  
    fontWeight: "500",  
  },  
  saveButton: {  
    flex: 1,  
    paddingVertical: 12,  
    borderRadius: 8,  
    backgroundColor: "#1a73e8",  
    alignItems: "center",  
  },  
  saveButtonText: {  
    fontSize: 16,  
    color: "#fff",  
    fontWeight: "bold",  
  },  
  modalOverlay: {  
    flex: 1,  
    backgroundColor: "rgba(0, 0, 0, 0.5)",  
    justifyContent: "center",  
    alignItems: "center",  
  },  
  languageModal: {  
    backgroundColor: "#fff",  
    borderRadius: 12,  
    padding: 20,  
    margin: 20,  
    minWidth: 280,  
  },  
  languageOption: {  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "space-between",  
    paddingVertical: 12,  
    paddingHorizontal: 16,  
    borderRadius: 8,  
    marginVertical: 4,  
  },  
  languageOptionSelected: {  
    backgroundColor: "#e8f0fe",  
  },  
  languageOptionText: {  
    fontSize: 16,  
    color: "#333",  
  },  
  languageOptionTextSelected: {  
    color: "#1a73e8",  
    fontWeight: "600",  
  },  
  closeLanguageModal: {  
    marginTop: 16,  
    paddingVertical: 12,  
    alignItems: "center",  
  },  
  closeLanguageModalText: {  
    fontSize: 16,  
    color: "#1a73e8",  
    fontWeight: "500",  
  },  
})