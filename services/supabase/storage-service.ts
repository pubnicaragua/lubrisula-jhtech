// services/supabase/storage-service.ts  
import AsyncStorage from '@react-native-async-storage/async-storage'  
  
class StorageService {  
  async setItem(key: string, value: any): Promise<boolean> {  
    try {  
      await AsyncStorage.setItem(key, JSON.stringify(value))  
      return true  
    } catch (error) {  
      console.error('Error storing item:', error)  
      return false  
    }  
  }  
  
  async getItem(key: string): Promise<any> {  
    try {  
      const value = await AsyncStorage.getItem(key)  
      return value ? JSON.parse(value) : null  
    } catch (error) {  
      console.error('Error getting item:', error)  
      return null  
    }  
  }  
  
  async removeItem(key: string): Promise<boolean> {  
    try {  
      await AsyncStorage.removeItem(key)  
      return true  
    } catch (error) {  
      console.error('Error removing item:', error)  
      return false  
    }  
  }  
}  
  
export default new StorageService()