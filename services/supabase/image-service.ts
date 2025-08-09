// services/supabase/image-service.ts  
import { supabase } from '../supabase'  
import * as FileSystem from 'expo-file-system'  
  
class ImageService {  
  async uploadImage(uri: string, bucket: string, fileName: string): Promise<string | null> {  
    try {  
      const response = await fetch(uri)  
      const blob = await response.blob()  
        
      const { data, error } = await supabase.storage  
        .from(bucket)  
        .upload(fileName, blob)  
  
      if (error) throw error  
        
      const { data: { publicUrl } } = supabase.storage  
        .from(bucket)  
        .getPublicUrl(fileName)  
  
      return publicUrl  
    } catch (error) {  
      console.error('Error uploading image:', error)  
      return null  
    }  
  }  
  
  async initializeImages(): Promise<void> {  
    // Crear buckets si no existen  
    const buckets = ['vehicles', 'clients', 'orders']  
    for (const bucket of buckets) {  
      await supabase.storage.createBucket(bucket, { public: true })  
    }  
  }  
}  
  
export default new ImageService()