import * as Notifications from "expo-notifications"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Platform } from "react-native"

// Configurar notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

class NotificationService {
  private static instance: NotificationService
  private isInitialized = false
  private notificationsEnabled = true
  private pushToken: string | null = null

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Cargar configuración
      const enabled = await AsyncStorage.getItem("notificationsEnabled")
      if (enabled !== null) {
        this.notificationsEnabled = enabled === "true"
      }

      // Solicitar permisos
      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }

      if (finalStatus !== "granted") {
        this.notificationsEnabled = false
        await AsyncStorage.setItem("notificationsEnabled", "false")
        return
      }

      // Obtener token para notificaciones push
      if (Platform.OS !== "web") {
        const token = (await Notifications.getExpoPushTokenAsync()).data
        this.pushToken = token
        await AsyncStorage.setItem("pushToken", token)
      }

      this.isInitialized = true
    } catch (error) {
      console.error("Error initializing notification service:", error)
    }
  }

  public async enableNotifications(enable: boolean): Promise<void> {
    this.notificationsEnabled = enable
    await AsyncStorage.setItem("notificationsEnabled", enable.toString())
  }

  public isNotificationsEnabled(): boolean {
    return this.notificationsEnabled
  }

  public getPushToken(): string | null {
    return this.pushToken
  }

  public async scheduleLocalNotification(
    title: string,
    body: string,
    data: any = {},
    seconds = 1,
  ): Promise<string | null> {
    if (!this.notificationsEnabled) return null

    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: {
          seconds,
        },
      })
      return identifier
    } catch (error) {
      console.error("Error scheduling notification:", error)
      return null
    }
  }

  public async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier)
    } catch (error) {
      console.error("Error canceling notification:", error)
    }
  }

  public async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync()
    } catch (error) {
      console.error("Error canceling all notifications:", error)
    }
  }

  // Notificaciones específicas de la aplicación
  public async notifyOrderStatusChange(orderNumber: string, newStatus: string): Promise<void> {
    const statusText = this.getStatusText(newStatus)
    await this.scheduleLocalNotification(
      "Estado de orden actualizado",
      `La orden #${orderNumber} ha cambiado a estado: ${statusText}`,
      { type: "order_status", orderNumber, status: newStatus },
    )
  }

  public async notifyLowInventory(itemName: string, currentStock: number): Promise<void> {
    await this.scheduleLocalNotification(
      "Alerta de inventario bajo",
      `El artículo "${itemName}" tiene un stock bajo (${currentStock} unidades)`,
      { type: "low_inventory", itemName, stock: currentStock },
    )
  }

  public async notifyNewComment(orderNumber: string, author: string): Promise<void> {
    await this.scheduleLocalNotification(
      "Nuevo comentario",
      `${author} ha añadido un comentario a la orden #${orderNumber}`,
      { type: "new_comment", orderNumber, author },
    )
  }

  public async notifyServiceCompleted(orderNumber: string, vehicleInfo: string): Promise<void> {
    await this.scheduleLocalNotification(
      "Servicio completado",
      `El servicio para ${vehicleInfo} (Orden #${orderNumber}) ha sido completado`,
      { type: "service_completed", orderNumber, vehicleInfo },
    )
  }

  private getStatusText(status: string): string {
    switch (status) {
      case "reception":
        return "Recepción"
      case "diagnosis":
        return "Diagnóstico"
      case "waiting_parts":
        return "Esperando Repuestos"
      case "in_progress":
        return "En Proceso"
      case "quality_check":
        return "Control de Calidad"
      case "completed":
        return "Completada"
      case "delivered":
        return "Entregada"
      case "cancelled":
        return "Cancelada"
      default:
        return "Desconocido"
    }
  }
}

export default NotificationService.getInstance()
