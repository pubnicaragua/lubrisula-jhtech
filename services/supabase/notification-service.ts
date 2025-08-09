// services/supabase/notification-service.ts  
import { supabase } from '../../lib/supabase'  
import * as Notifications from 'expo-notifications'  
  
export interface NotificationType {  
  id?: string  
  titulo: string  
  mensaje: string  
  usuario_id: string  
  leida: boolean  
  tipo: 'info' | 'warning' | 'success' | 'error'  
  created_at?: string  
}  
  
class NotificationService {  
  async sendNotification(notification: Omit<NotificationType, 'id' | 'created_at'>): Promise<boolean> {  
    try {  
      const { error } = await supabase  
        .from('notificaciones')  
        .insert(notification)  
  
      if (error) throw error  
  
      // Enviar notificación push  
      await Notifications.scheduleNotificationAsync({  
        content: {  
          title: notification.titulo,  
          body: notification.mensaje,  
        },  
        trigger: null,  
      })  
  
      return true  
    } catch (error) {  
      console.error('Error sending notification:', error)  
      return false  
    }  
  }  
  
  async getNotifications(userId: string): Promise<NotificationType[]> {  
    try {  
      const { data, error } = await supabase  
        .from('notificaciones')  
        .select('*')  
        .eq('usuario_id', userId)  
        .order('created_at', { ascending: false })  
  
      if (error) throw error  
      return data || []  
    } catch (error) {  
      console.error('Error getting notifications:', error)  
      return []  
    }  
  }  
}  
  
export default new NotificationService()