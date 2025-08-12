"use client"  
  
import { useState, useCallback, useEffect } from "react"  
import {  
  View,  
  Text,  
  FlatList,  
  TouchableOpacity,  
  StyleSheet,  
  ActivityIndicator,  
  RefreshControl,  
  Alert,  
  Switch,  
  Modal,  
} from "react-native"  
import { Feather, MaterialIcons } from "@expo/vector-icons"  
import { useFocusEffect } from "@react-navigation/native"  
import { useNavigation } from '@react-navigation/native'  
import type { StackNavigationProp } from '@react-navigation/stack'  
import { useAuth } from "../context/auth-context"  
import ACCESOS_SERVICES from "../services/supabase/access-service"  
import USER_SERVICE from "../services/supabase/user-service"  
import AsyncStorage from '@react-native-async-storage/async-storage'  
  
interface Notification {  
  id: string  
  title: string  
  message: string  
  type: "info" | "warning" | "error" | "success"  
  read: boolean  
  createdAt: string  
  actionUrl?: string  
  metadata?: any  
}  
  
export default function NotificationsScreen() {  
  const { user } = useAuth()  
  const navigation = useNavigation<StackNavigationProp<any>>()  
  const [notifications, setNotifications] = useState<Notification[]>([])  
  const [loading, setLoading] = useState(true)  
  const [refreshing, setRefreshing] = useState(false)  
  const [error, setError] = useState<string | null>(null)  
  const [userRole, setUserRole] = useState<string | null>(null)  
  const [settingsModalVisible, setSettingsModalVisible] = useState(false)  
  const [notificationSettings, setNotificationSettings] = useState({  
    pushEnabled: true,  
    emailEnabled: true,  
    orderUpdates: true,  
    inventoryAlerts: true,  
    systemAlerts: true,  
    marketingEmails: false,  
  })  
  
  const loadNotifications = useCallback(async () => {  
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
      const savedSettings = await AsyncStorage.getItem('notificationSettings')  
      if (savedSettings) {  
        setNotificationSettings(JSON.parse(savedSettings))  
      }  
  
      // Generar notificaciones de ejemplo (en producción vendrían de Supabase)  
      const mockNotifications: Notification[] = [  
        {  
          id: "1",  
          title: "Orden Completada",  
          message: "Su orden #ORD-001 ha sido completada y está lista para recoger",  
          type: "success",  
          read: false,  
          createdAt: new Date().toISOString(),  
          actionUrl: "OrderDetail",  
          metadata: { orderId: "1" }  
        },  
        {  
          id: "2",   
          title: "Recordatorio de Cita",  
          message: "Tiene una cita programada para mañana a las 10:00 AM",  
          type: "info",  
          read: false,  
          createdAt: new Date(Date.now() - 3600000).toISOString(),  
        },  
        {  
          id: "3",  
          title: "Stock Bajo",  
          message: "El inventario de filtros de aceite está por agotarse",  
          type: "warning",   
          read: true,  
          createdAt: new Date(Date.now() - 7200000).toISOString(),  
        },  
        {  
          id: "4",  
          title: "Nueva Actualización",  
          message: "AutoFlowX v1.1.0 está disponible con nuevas funcionalidades",  
          type: "info",  
          read: true,  
          createdAt: new Date(Date.now() - 86400000).toISOString(),  
        }  
      ]  
  
      // Filtrar notificaciones según el rol  
      let filteredNotifications = mockNotifications  
      if (userPermissions?.rol === 'client') {  
        filteredNotifications = mockNotifications.filter(notif =>   
          notif.type !== "warning" || !notif.message.includes("inventario")  
        )  
      }  
  
      setNotifications(filteredNotifications)  
  
    } catch (error) {  
      console.error("Error loading notifications:", error)  
      setError("No se pudieron cargar las notificaciones")  
    } finally {  
      setLoading(false)  
      setRefreshing(false)  
    }  
  }, [user])  
  
  useFocusEffect(  
    useCallback(() => {  
      loadNotifications()  
    }, [loadNotifications])  
  )  
  
  const markAsRead = async (notificationId: string) => {  
    try {  
      setNotifications(prev =>   
        prev.map(notif =>   
          notif.id === notificationId ? { ...notif, read: true } : notif  
        )  
      )  
      // En producción, actualizar en Supabase  
    } catch (error) {  
      console.error("Error marking notification as read:", error)  
    }  
  }  
  
  const markAllAsRead = async () => {  
    try {  
      setNotifications(prev =>   
        prev.map(notif => ({ ...notif, read: true }))  
      )  
      // En producción, actualizar en Supabase  
    } catch (error) {  
      console.error("Error marking all notifications as read:", error)  
    }  
  }  
  
  const deleteNotification = async (notificationId: string) => {  
    Alert.alert(  
      "Eliminar Notificación",  
      "¿Estás seguro de que quieres eliminar esta notificación?",  
      [  
        { text: "Cancelar", style: "cancel" },  
        {  
          text: "Eliminar",  
          style: "destructive",  
          onPress: () => {  
            setNotifications(prev =>   
              prev.filter(notif => notif.id !== notificationId)  
            )  
          }  
        }  
      ]  
    )  
  }  
  
  const handleNotificationPress = (notification: Notification) => {  
    markAsRead(notification.id)  
      
    if (notification.actionUrl && notification.metadata) {  
      navigation.navigate(notification.actionUrl, notification.metadata)  
    }  
  }  
  
  const saveNotificationSettings = async () => {  
    try {  
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(notificationSettings))  
      setSettingsModalVisible(false)  
      Alert.alert("Éxito", "Configuraciones guardadas correctamente")  
    } catch (error) {  
      console.error("Error saving notification settings:", error)  
      Alert.alert("Error", "No se pudieron guardar las configuraciones")  
    }  
  }  
  
  const getNotificationIcon = (type: string) => {  
    switch (type) {  
      case "success": return "check-circle"  
      case "warning": return "alert-triangle"  
      case "error": return "x-circle"  
      case "info":   
      default: return "info"  
    }  
  }  
  
  const getNotificationColor = (type: string) => {  
    switch (type) {  
      case "success": return "#4caf50"  
      case "warning": return "#ff9800"  
      case "error": return "#f44336"  
      case "info":  
      default: return "#1a73e8"  
    }  
  }  
  
  const formatTimeAgo = (dateString: string) => {  
    const now = new Date()  
    const date = new Date(dateString)  
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))  
      
    if (diffInMinutes < 1) return "Ahora"  
    if (diffInMinutes < 60) return `Hace ${diffInMinutes}m`  
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)}h`  
    return `Hace ${Math.floor(diffInMinutes / 1440)}d`  
  }  
  
  const renderNotificationItem = ({ item }: { item: Notification }) => (  
    <TouchableOpacity  
      style={[styles.notificationCard, !item.read && styles.unreadCard]}  
      onPress={() => handleNotificationPress(item)}  
    >  
      <View style={styles.notificationContent}>  
        <View style={styles.notificationHeader}>  
          <View style={[styles.notificationIcon, { backgroundColor: `${getNotificationColor(item.type)}20` }]}>  
            <Feather name={getNotificationIcon(item.type) as any} size={20} color={getNotificationColor(item.type)} />  
          </View>  
          <View style={styles.notificationInfo}>  
            <Text style={[styles.notificationTitle, !item.read && styles.unreadTitle]}>  
              {item.title}  
            </Text>  
            <Text style={styles.notificationTime}>{formatTimeAgo(item.createdAt)}</Text>  
          </View>  
          <TouchableOpacity  
            style={styles.deleteButton}  
            onPress={() => deleteNotification(item.id)}  
          >  
            <Feather name="x" size={16} color="#999" />  
          </TouchableOpacity>  
        </View>  
        <Text style={styles.notificationMessage}>{item.message}</Text>  
        {!item.read && <View style={styles.unreadIndicator} />}  
      </View>  
    </TouchableOpacity>  
  )  
  
  const renderSettingsModal = () => (  
    <Modal  
      visible={settingsModalVisible}  
      animationType="slide"  
      presentationStyle="pageSheet"  
    >  
      <View style={styles.modalContainer}>  
        <View style={styles.modalHeader}>  
          <Text style={styles.modalTitle}>Configuración de Notificaciones</Text>  
          <TouchableOpacity  
            onPress={() => setSettingsModalVisible(false)}  
            style={styles.closeButton}  
          >  
            <Feather name="x" size={24} color="#666" />  
          </TouchableOpacity>  
        </View>  
  
        <View style={styles.modalContent}>  
          <View style={styles.settingSection}>  
            <Text style={styles.settingSectionTitle}>Canales de Notificación</Text>  
              
            <View style={styles.settingItem}>  
              <View style={styles.settingInfo}>  
                <Text style={styles.settingLabel}>Notificaciones Push</Text>  
                <Text style={styles.settingDescription}>Recibir notificaciones en el dispositivo</Text>  
              </View>  
              <Switch  
                value={notificationSettings.pushEnabled}  
                onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, pushEnabled: value }))}  
                trackColor={{ false: "#e1e4e8", true: "#1a73e8" }}  
                thumbColor={notificationSettings.pushEnabled ? "#fff" : "#f4f3f4"}  
              />  
            </View>  
  
            <View style={styles.settingItem}>  
              <View style={styles.settingInfo}>  
                <Text style={styles.settingLabel}>Notificaciones por Email</Text>  
                <Text style={styles.settingDescription}>Recibir notificaciones por correo electrónico</Text>  
              </View>  
              <Switch  
                value={notificationSettings.emailEnabled}  
                onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, emailEnabled: value }))}  
                trackColor={{ false: "#e1e4e8", true: "#1a73e8" }}  
                thumbColor={notificationSettings.emailEnabled ? "#fff" : "#f4f3f4"}  
              />  
            </View>  
          </View>  
  
          <View style={styles.settingSection}>  
            <Text style={styles.settingSectionTitle}>Tipos de Notificación</Text>  
              
            <View style={styles.settingItem}>  
              <View style={styles.settingInfo}>  
                <Text style={styles.settingLabel}>Actualizaciones de Órdenes</Text>  
                <Text style={styles.settingDescription}>Cambios en el estado de las órdenes</Text>  
              </View>  
              <Switch  
                value={notificationSettings.orderUpdates}  
                onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, orderUpdates: value }))}  
                trackColor={{ false: "#e1e4e8", true: "#1a73e8" }}  
                thumbColor={notificationSettings.orderUpdates ? "#fff" : "#f4f3f4"}  
              />  
            </View>  
  
            {userRole !== 'client' && (  
              <View style={styles.settingItem}>  
                <View style={styles.settingInfo}>  
                  <Text style={styles.settingLabel}>Alertas de Inventario</Text>  
                  <Text style={styles.settingDescription}>Stock bajo y reposición de inventario</Text>  
                </View>  
                <Switch  
                  value={notificationSettings.inventoryAlerts}  
                  onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, inventoryAlerts: value }))}  
                  trackColor={{ false: "#e1e4e8", true: "#1a73e8" }}  
                  thumbColor={notificationSettings.inventoryAlerts ? "#fff" : "#f4f3f4"}  
                />  
              </View>  
            )}  
  
            <View style={styles.settingItem}>  
              <View style={styles.settingInfo}>  
                <Text style={styles.settingLabel}>Alertas del Sistema</Text>  
                <Text style={styles.settingDescription}>Mantenimiento y actualizaciones</Text>  
              </View>  
              <Switch  
                value={notificationSettings.systemAlerts}  
                onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, systemAlerts: value }))}  
                trackColor={{ false: "#e1e4e8", true: "#1a73e8" }}  
                thumbColor={notificationSettings.systemAlerts ? "#fff" : "#f4f3f4"}  
              />  
            </View>  
  
            <View style={styles.settingItem}>  
              <View style={styles.settingInfo}>  
                <Text style={styles.settingLabel}>Emails de Marketing</Text>  
                <Text style={styles.settingDescription}>Promociones y ofertas especiales</Text>  
              </View>  
              <Switch  
                value={notificationSettings.marketingEmails}  
                onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, marketingEmails: value }))}  
                trackColor={{ false: "#e1e4e8", true: "#1a73e8" }}  
                thumbColor={notificationSettings.marketingEmails ? "#fff" : "#f4f3f4"}  
              />  
            </View>  
          </View>  
        </View>  
  
        <View style={styles.modalFooter}>  
          <TouchableOpacity  
            style={styles.saveButton}  
            onPress={saveNotificationSettings}  
          >  
                        <Text style={styles.saveButtonText}>Guardar Configuraciones</Text>  
          </TouchableOpacity>  
        </View>  
      </View>  
    </Modal>  
  )  
  
  if (loading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="large" color="#1a73e8" />  
        <Text style={styles.loadingText}>Cargando notificaciones...</Text>  
      </View>  
    )  
  }  
  
  if (error) {  
    return (  
      <View style={styles.errorContainer}>  
        <MaterialIcons name="error" size={64} color="#f44336" />  
        <Text style={styles.errorText}>{error}</Text>  
        <TouchableOpacity style={styles.retryButton} onPress={loadNotifications}>  
          <Text style={styles.retryButtonText}>Reintentar</Text>  
        </TouchableOpacity>  
      </View>  
    )  
  }  
  
  const unreadCount = notifications.filter(notif => !notif.read).length  
  
  return (  
    <View style={styles.container}>  
      <View style={styles.header}>  
        <Text style={styles.headerTitle}>Notificaciones</Text>  
        <View style={styles.headerActions}>  
          {unreadCount > 0 && (  
            <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>  
              <Text style={styles.markAllText}>Marcar todas como leídas</Text>  
            </TouchableOpacity>  
          )}  
          <TouchableOpacity  
            style={styles.settingsButton}  
            onPress={() => setSettingsModalVisible(true)}  
          >  
            <Feather name="settings" size={20} color="#1a73e8" />  
          </TouchableOpacity>  
        </View>  
      </View>  
  
      {unreadCount > 0 && (  
        <View style={styles.unreadBanner}>  
          <Text style={styles.unreadBannerText}>  
            Tienes {unreadCount} notificación{unreadCount > 1 ? 'es' : ''} sin leer  
          </Text>  
        </View>  
      )}  
  
      <FlatList  
        data={notifications}  
        renderItem={renderNotificationItem}  
        keyExtractor={(item) => item.id}  
        contentContainerStyle={styles.listContainer}  
        refreshControl={  
          <RefreshControl refreshing={refreshing} onRefresh={loadNotifications} />  
        }  
        ListEmptyComponent={  
          <View style={styles.emptyContainer}>  
            <Feather name="bell" size={64} color="#ccc" />  
            <Text style={styles.emptyText}>No hay notificaciones</Text>  
          </View>  
        }  
      />  
  
      {renderSettingsModal()}  
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
  headerTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  headerActions: {  
    flexDirection: "row",  
    alignItems: "center",  
    gap: 12,  
  },  
  markAllButton: {  
    paddingHorizontal: 12,  
    paddingVertical: 6,  
    backgroundColor: "#e8f0fe",  
    borderRadius: 6,  
  },  
  markAllText: {  
    fontSize: 12,  
    color: "#1a73e8",  
    fontWeight: "500",  
  },  
  settingsButton: {  
    padding: 8,  
  },  
  unreadBanner: {  
    backgroundColor: "#fff3cd",  
    paddingHorizontal: 16,  
    paddingVertical: 8,  
    borderBottomWidth: 1,  
    borderBottomColor: "#ffeaa7",  
  },  
  unreadBannerText: {  
    fontSize: 14,  
    color: "#856404",  
    textAlign: "center",  
  },  
  listContainer: {  
    padding: 16,  
  },  
  notificationCard: {  
    backgroundColor: "#fff",  
    borderRadius: 8,  
    padding: 16,  
    marginBottom: 12,  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 1 },  
    shadowOpacity: 0.1,  
    shadowRadius: 2,  
    elevation: 2,  
  },  
  unreadCard: {  
    borderLeftWidth: 4,  
    borderLeftColor: "#1a73e8",  
  },  
  notificationContent: {  
    position: "relative",  
  },  
  notificationHeader: {  
    flexDirection: "row",  
    alignItems: "flex-start",  
    marginBottom: 8,  
  },  
  notificationIcon: {  
    width: 40,  
    height: 40,  
    borderRadius: 20,  
    justifyContent: "center",  
    alignItems: "center",  
    marginRight: 12,  
  },  
  notificationInfo: {  
    flex: 1,  
  },  
  notificationTitle: {  
    fontSize: 16,  
    fontWeight: "500",  
    color: "#333",  
    marginBottom: 2,  
  },  
  unreadTitle: {  
    fontWeight: "bold",  
  },  
  notificationTime: {  
    fontSize: 12,  
    color: "#999",  
  },  
  deleteButton: {  
    padding: 4,  
  },  
  notificationMessage: {  
    fontSize: 14,  
    color: "#666",  
    lineHeight: 20,  
  },  
  unreadIndicator: {  
    position: "absolute",  
    top: 0,  
    right: 0,  
    width: 8,  
    height: 8,  
    borderRadius: 4,  
    backgroundColor: "#1a73e8",  
  },  
  emptyContainer: {  
    flex: 1,  
    justifyContent: "center",  
    alignItems: "center",  
    padding: 40,  
  },  
  emptyText: {  
    fontSize: 18,  
    color: "#999",  
    marginTop: 16,  
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
  settingSection: {  
    marginBottom: 24,  
  },  
  settingSectionTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 16,  
  },  
  settingItem: {  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "space-between",  
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
  modalFooter: {  
    padding: 16,  
    borderTopWidth: 1,  
    borderTopColor: "#e1e4e8",  
  },  
  saveButton: {  
    backgroundColor: "#1a73e8",  
    paddingVertical: 12,  
    borderRadius: 8,  
    alignItems: "center",  
  },  
  saveButtonText: {  
    color: "#fff",  
    fontSize: 16,  
    fontWeight: "bold",  
  },  
})