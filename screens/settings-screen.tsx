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
  Switch,  
  Modal,  
  TextInput,  
} from "react-native"  
import { Feather, MaterialIcons } from "@expo/vector-icons"  
import { useAuth } from "../context/auth-context"  
import { userService } from "../services/supabase/user-service"  
import ACCESOS_SERVICES from "../services/supabase/access-service"  
import USER_SERVICE from "../services/supabase/user-service"  
import AsyncStorage from '@react-native-async-storage/async-storage'  
  
export default function SettingsScreen() {  
  const { user } = useAuth()  
  const [loading, setLoading] = useState(true)  
  const [saving, setSaving] = useState(false)  
  const [userRole, setUserRole] = useState<string | null>(null)  
  const [error, setError] = useState<string | null>(null)  
  
  // Estados de configuración  
  const [settings, setSettings] = useState({  
    notifications: {  
      push: true,  
      email: true,  
      orderUpdates: true,  
      inventoryAlerts: true,  
      clientMessages: true,  
    },  
    display: {  
      darkMode: false,  
      language: "es",  
      currency: "USD",  
      dateFormat: "DD/MM/YYYY",  
    },  
    privacy: {  
      shareAnalytics: false,  
      autoBackup: true,  
      dataRetention: "1year",  
    },  
    business: {  
      autoOrderNumbers: true,  
      requireApproval: false,  
      defaultTax: "15",  
      workingHours: "8:00-17:00",  
    }  
  })  
  
  // Estados para modales  
  const [languageModalVisible, setLanguageModalVisible] = useState(false)  
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false)  
  const [taxModalVisible, setTaxModalVisible] = useState(false)  
  const [hoursModalVisible, setHoursModalVisible] = useState(false)  
  
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
      setUserRole(userPermissions?.rol || 'client')  
  
      // Cargar configuraciones guardadas  
      const savedSettings = await AsyncStorage.getItem('userSettings')  
      if (savedSettings) {  
        setSettings(JSON.parse(savedSettings))  
      }  
  
    } catch (error) {  
      console.error("Error loading settings:", error)  
      setError("No se pudieron cargar las configuraciones")  
    } finally {  
      setLoading(false)  
    }  
  }, [user])  
  
  useEffect(() => {  
    loadSettings()  
  }, [loadSettings])  
  
  const saveSettings = async () => {  
    try {  
      setSaving(true)  
      await AsyncStorage.setItem('userSettings', JSON.stringify(settings))  
      Alert.alert("Éxito", "Configuraciones guardadas correctamente")  
    } catch (error) {  
      console.error("Error saving settings:", error)  
      Alert.alert("Error", "No se pudieron guardar las configuraciones")  
    } finally {  
      setSaving(false)  
    }  
  }  
  
  const updateSetting = (category: string, key: string, value: any) => {  
    setSettings(prev => ({  
      ...prev,  
      [category]: {  
        ...prev[category],  
        [key]: value  
      }  
    }))  
  }  
  
  const resetSettings = () => {  
    Alert.alert(  
      "Restablecer Configuraciones",  
      "¿Estás seguro de que quieres restablecer todas las configuraciones a sus valores predeterminados?",  
      [  
        { text: "Cancelar", style: "cancel" },  
        {  
          text: "Restablecer",  
          style: "destructive",  
          onPress: () => {  
            setSettings({  
              notifications: {  
                push: true,  
                email: true,  
                orderUpdates: true,  
                inventoryAlerts: true,  
                clientMessages: true,  
              },  
              display: {  
                darkMode: false,  
                language: "es",  
                currency: "USD",  
                dateFormat: "DD/MM/YYYY",  
              },  
              privacy: {  
                shareAnalytics: false,  
                autoBackup: true,  
                dataRetention: "1year",  
              },  
              business: {  
                autoOrderNumbers: true,  
                requireApproval: false,  
                defaultTax: "15",  
                workingHours: "8:00-17:00",  
              }  
            })  
            Alert.alert("Éxito", "Configuraciones restablecidas")  
          }  
        }  
      ]  
    )  
  }  
  
  const renderLanguageModal = () => (  
    <Modal  
      visible={languageModalVisible}  
      animationType="slide"  
      presentationStyle="pageSheet"  
    >  
      <View style={styles.modalContainer}>  
        <View style={styles.modalHeader}>  
          <Text style={styles.modalTitle}>Seleccionar Idioma</Text>  
          <TouchableOpacity  
            onPress={() => setLanguageModalVisible(false)}  
            style={styles.closeButton}  
          >  
            <Feather name="x" size={24} color="#666" />  
          </TouchableOpacity>  
        </View>  
  
        <View style={styles.modalContent}>  
          {[  
            { code: "es", name: "Español" },  
            { code: "en", name: "English" },  
            { code: "pt", name: "Português" }  
          ].map((language) => (  
            <TouchableOpacity  
              key={language.code}  
              style={[  
                styles.optionItem,  
                settings.display.language === language.code && styles.optionItemSelected  
              ]}  
              onPress={() => {  
                updateSetting('display', 'language', language.code)  
                setLanguageModalVisible(false)  
              }}  
            >  
              <Text style={[  
                styles.optionText,  
                settings.display.language === language.code && styles.optionTextSelected  
              ]}>  
                {language.name}  
              </Text>  
              {settings.display.language === language.code && (  
                <Feather name="check" size={20} color="#1a73e8" />  
              )}  
            </TouchableOpacity>  
          ))}  
        </View>  
      </View>  
    </Modal>  
  )  
  
  const renderCurrencyModal = () => (  
    <Modal  
      visible={currencyModalVisible}  
      animationType="slide"  
      presentationStyle="pageSheet"  
    >  
      <View style={styles.modalContainer}>  
        <View style={styles.modalHeader}>  
          <Text style={styles.modalTitle}>Seleccionar Moneda</Text>  
          <TouchableOpacity  
            onPress={() => setCurrencyModalVisible(false)}  
            style={styles.closeButton}  
          >  
            <Feather name="x" size={24} color="#666" />  
          </TouchableOpacity>  
        </View>  
  
        <View style={styles.modalContent}>  
          {[  
            { code: "USD", name: "Dólar Estadounidense (USD)" },  
            { code: "EUR", name: "Euro (EUR)" },  
            { code: "NIO", name: "Córdoba Nicaragüense (NIO)" }  
          ].map((currency) => (  
            <TouchableOpacity  
              key={currency.code}  
              style={[  
                styles.optionItem,  
                settings.display.currency === currency.code && styles.optionItemSelected  
              ]}  
              onPress={() => {  
                updateSetting('display', 'currency', currency.code)  
                setCurrencyModalVisible(false)  
              }}  
            >  
              <Text style={[  
                styles.optionText,  
                settings.display.currency === currency.code && styles.optionTextSelected  
              ]}>  
                {currency.name}  
              </Text>  
              {settings.display.currency === currency.code && (  
                <Feather name="check" size={20} color="#1a73e8" />  
              )}  
            </TouchableOpacity>  
          ))}  
        </View>  
      </View>  
    </Modal>  
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
      <View style={styles.header}>  
        <Text style={styles.headerTitle}>Configuraciones</Text>  
        <TouchableOpacity style={styles.saveButton} onPress={saveSettings} disabled={saving}>  
          {saving ? (  
            <ActivityIndicator size="small" color="#1a73e8" />  
          ) : (  
            <Feather name="save" size={20} color="#1a73e8" />  
          )}  
        </TouchableOpacity>  
      </View>  
  
      {/* Notificaciones */}  
      <View style={styles.section}>  
        <Text style={styles.sectionTitle}>Notificaciones</Text>  
          
        <View style={styles.settingItem}>  
          <View style={styles.settingInfo}>  
            <Text style={styles.settingLabel}>Notificaciones Push</Text>  
            <Text style={styles.settingDescription}>Recibir notificaciones en el dispositivo</Text>  
          </View>  
          <Switch  
            value={settings.notifications.push}  
            onValueChange={(value) => updateSetting('notifications', 'push', value)}  
            trackColor={{ false: "#e1e4e8", true: "#1a73e8" }}  
            thumbColor={settings.notifications.push ? "#fff" : "#f4f3f4"}  
          />  
        </View>  
  
        <View style={styles.settingItem}>  
          <View style={styles.settingInfo}>  
            <Text style={styles.settingLabel}>Notificaciones por Email</Text>  
            <Text style={styles.settingDescription}>Recibir notificaciones por correo electrónico</Text>  
          </View>  
          <Switch  
            value={settings.notifications.email}  
            onValueChange={(value) => updateSetting('notifications', 'email', value)}  
            trackColor={{ false: "#e1e4e8", true: "#1a73e8" }}  
            thumbColor={settings.notifications.email ? "#fff" : "#f4f3f4"}  
          />  
        </View>  
  
        <View style={styles.settingItem}>  
          <View style={styles.settingInfo}>  
            <Text style={styles.settingLabel}>Actualizaciones de Órdenes</Text>  
            <Text style={styles.settingDescription}>Notificar cambios en el estado de órdenes</Text>  
          </View>  
          <Switch  
            value={settings.notifications.orderUpdates}  
            onValueChange={(value) => updateSetting('notifications', 'orderUpdates', value)}  
            trackColor={{ false: "#e1e4e8", true: "#1a73e8" }}  
            thumbColor={settings.notifications.orderUpdates ? "#fff" : "#f4f3f4"}  
          />  
        </View>  
  
        {userRole !== 'client' && (  
          <>  
            <View style={styles.settingItem}>  
              <View style={styles.settingInfo}>  
                <Text style={styles.settingLabel}>Alertas de Inventario</Text>  
                <Text style={styles.settingDescription}>Notificar cuando el stock esté bajo</Text>  
              </View>  
              <Switch  
                value={settings.notifications.inventoryAlerts}  
                onValueChange={(value) => updateSetting('notifications', 'inventoryAlerts', value)}  
                trackColor={{ false: "#e1e4e8", true: "#1a73e8" }}  
                thumbColor={settings.notifications.inventoryAlerts ? "#fff" : "#f4f3f4"}  
              />  
            </View>  
  
            <View style={styles.settingItem}>  
              <View style={styles.settingInfo}>  
                <Text style={styles.settingLabel}>Mensajes de Clientes</Text>  
                <Text style={styles.settingDescription}>Notificar nuevos mensajes de clientes</Text>  
              </View>  
              <Switch  
                value={settings.notifications.clientMessages}  
                onValueChange={(value) => updateSetting('notifications', 'clientMessages', value)}  
                trackColor={{ false: "#e1e4e8", true: "#1a73e8" }}  
                thumbColor={settings.notifications.clientMessages ? "#fff" : "#f4f3f4"}  
              />  
            </View>  
          </>  
        )}  
      </View>  
  
      {/* Pantalla y Apariencia */}  
      <View style={styles.section}>  
        <Text style={styles.sectionTitle}>Pantalla y Apariencia</Text>  
          
        <View style={styles.settingItem}>  
          <View style={styles.settingInfo}>  
            <Text style={styles.settingLabel}>Modo Oscuro</Text>  
            <Text style={styles.settingDescription}>Usar tema oscuro en la aplicación</Text>  
          </View>  
          <Switch  
            value={settings.display.darkMode}  
            onValueChange={(value) => updateSetting('display', 'darkMode', value)}  
            trackColor={{ false: "#e1e4e8", true: "#1a73e8" }}  
            thumbColor={settings.display.darkMode ? "#fff" : "#f4f3f4"}  
          />  
        </View>  
  
        <TouchableOpacity  
          style={styles.settingItem}  
          onPress={() => setLanguageModalVisible(true)}  
        >  
          <View style={styles.settingInfo}>  
            <Text style={styles.settingLabel}>Idioma</Text>  
            <Text style={styles.settingDescription}>  
              {settings.display.language === 'es' ? 'Español' :   
               settings.display.language === 'en' ? 'English' : 'Português'}  
            </Text>  
          </View>  
          <Feather name="chevron-right" size={20} color="#666" />  
        </TouchableOpacity>  
  
        <TouchableOpacity  
          style={styles.settingItem}  
          onPress={() => setCurrencyModalVisible(true)}  
        >  
          <View style={styles.settingInfo}>  
            <Text style={styles.settingLabel}>Moneda</Text>  
            <Text style={styles.settingDescription}>{settings.display.currency}</Text>  
          </View>  
          <Feather name="chevron-right" size={20} color="#666" />  
        </TouchableOpacity>  
      </View>  
  
      {/* Privacidad y Seguridad */}  
      <View style={styles.section}>  
        <Text style={styles.sectionTitle}>Privacidad y Seguridad</Text>  
          
        <View style={styles.settingItem}>  
          <View style={styles.settingInfo}>  
            <Text style={styles.settingLabel}>Compartir Analíticas</Text>  
            <Text style={styles.settingDescription}>Ayudar a mejorar la aplicación compartiendo datos de uso</Text>  
          </View>  
          <Switch  
            value={settings.privacy.shareAnalytics}  
            onValueChange={(value) => updateSetting('privacy', 'shareAnalytics', value)}  
            trackColor={{ false: "#e1e4e8", true: "#1a73e8" }}  
            thumbColor={settings.privacy.shareAnalytics ? "#fff" : "#f4f3f4"}  
          />  
        </View>  
  
        <View style={styles.settingItem}>  
          <View style={styles.settingInfo}>  
            <Text style={styles.settingLabel}>Respaldo Automático</Text>  
            <Text style={styles.settingDescription}>Respaldar datos automáticamente en la nube</Text>  
          </View>  
          <Switch  
            value={settings.privacy.autoBackup}  
            onValueChange={(value) => updateSetting('privacy', 'autoBackup', value)}  
            trackColor={{ false: "#e1e4e8", true: "#1a73e8" }}  
            thumbColor={settings.privacy.autoBackup ? "#fff" : "#f4f3f4"}  
          />  
        </View>  
      </View>  
  
      {/* Configuraciones de Negocio (solo para staff) */}  
      {userRole !== 'client' && (  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>Configuraciones de Negocio</Text>  
            
          <View style={styles.settingItem}>  
            <View style={styles.settingInfo}>  
              <Text style={styles.settingLabel}>Numeración Automática de Órdenes</Text>  
              <Text style={styles.settingDescription}>Generar números de orden automáticamente</Text>  
            </View>  
            <Switch  
              value={settings.business.autoOrderNumbers}  
              onValueChange={(value) => updateSetting('business', 'autoOrderNumbers', value)}  
              trackColor={{ false: "#e1e4e8", true: "#1a73e8" }}  
              thumbColor={settings.business.autoOrderNumbers ? "#fff" : "#f4f3f4"}  
            />  
          </View>  
  
          <View style={styles.settingItem}>  
            <View style={styles.settingInfo}>  
              <Text style={styles.settingLabel}>Requerir Aprobación</Text>  
              <Text style={styles.settingDescription}>Requerir aprobación para órdenes grandes</Text>  
            </View>  
            <Switch  
              value={settings.business.requireApproval}  
              onValueChange={(value) => updateSetting('business', 'requireApproval', value)}  
              trackColor={{ false: "#e1e4e8", true: "#1a73e8" }}  
              thumbColor={settings.business.requireApproval ? "#fff" : "#f4f3f4"}  
            />  
          </View>  
  
          <TouchableOpacity  
            style={styles.settingItem}  
            onPress={() => setTaxModalVisible(true)}  
          >  
            <View style={styles.settingInfo}>  
              <Text style={styles.settingLabel}>Impuesto por Defecto</Text>  
              <Text style={styles.settingDescription}>{settings.business.defaultTax}%</Text>  
            </View>  
            <Feather name="chevron-right" size={20} color="#666" />  
          </TouchableOpacity>  
  
          <TouchableOpacity  
            style={styles.settingItem}  
            onPress={() => setHoursModalVisible(true)}  
          >  
            <View style={styles.settingInfo}>  
              <Text style={styles.settingLabel}>Horario de Trabajo</Text>  
              <Text style={styles.settingDescription}>{settings.business.workingHours}</Text>  
            </View>  
            <Feather name="chevron-right" size={20} color="#666" />  
          </TouchableOpacity>  
        </View>  
      )}  
  
      {/* Acciones */}  
      <View style={styles.section}>  
        <TouchableOpacity style={styles.resetButton} onPress={resetSettings}>  
          <Feather name="refresh-cw" size={20} color="#f44336" />  
          <Text style={styles.resetButtonText}>Restablecer Configuraciones</Text>  
        </TouchableOpacity>  
      </View>  
  
      {renderLanguageModal()}  
      {renderCurrencyModal()}  
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
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "space-between",  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    backgroundColor: "#fff",  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  headerTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  saveButton: {  
    padding: 8,  
  },  
  section: {  
    backgroundColor: "#fff",  
    marginTop: 16,  
    paddingVertical: 8,  
  },  
  sectionTitle: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#333",  
    paddingHorizontal: 16,  
    paddingBottom: 8,  
  },  
  settingItem: {  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "space-between",  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    borderBottomWidth: 1,  
    borderBottomColor: "#f0f0f0",  
  },  
  settingInfo: {  
    flex: 1,  
    marginRight: 16,  
  },  
  settingLabel: {  
    fontSize: 16,  
    fontWeight: "500",  
    color: "#333",  
    marginBottom: 2,  
  },  
  settingDescription: {  
    fontSize: 14,  
    color: "#666",  
  },  
  resetButton: {  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "center",  
    paddingVertical: 12,  
    paddingHorizontal: 16,  
    marginHorizontal: 16,  
    borderRadius: 8,  
    backgroundColor: "#fff",  
    borderWidth: 1,  
    borderColor: "#f44336",  
  },  
  resetButtonText: {  
    fontSize: 16,  
    color: "#f44336",  
    fontWeight: "500",  
    marginLeft: 8,  
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
  optionItem: {  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "space-between",  
    paddingVertical: 16,  
    paddingHorizontal: 16,  
    borderRadius: 8,  
    marginBottom: 8,  
    backgroundColor: "#f8f9fa",  
  },  
  optionItemSelected: {  
    backgroundColor: "#e8f0fe",  
    borderWidth: 1,  
    borderColor: "#1a73e8",  
  },  
  optionText: {  
    fontSize: 16,  
    color: "#333",  
  },  
  optionTextSelected: {  
    color: "#1a73e8",  
    fontWeight: "600",  
  },  
})