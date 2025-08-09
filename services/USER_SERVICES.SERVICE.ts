import { supabase } from '../lib/supabase'  
  
class UserService {  
  async GET_TALLER_ID(userId: string): Promise<string | null> {  
    try {  
      const { data, error } = await supabase  
        .from('usuarios')  
        .select('taller_id')  
        .eq('id', userId)  
        .single()  
  
      if (error) {  
        console.error('Error getting taller ID:', error)  
        return null  
      }  
  
      return data?.taller_id || null  
    } catch (error) {  
      console.error('Error in GET_TALLER_ID:', error)  
      return null  
    }  
  }  
  
  // Método adicional que podría ser necesario para login  
  async VERIFY_USER_CREDENTIALS(email: string, password: string) {  
    try {  
      const { data, error } = await supabase.auth.signInWithPassword({  
        email,  
        password  
      })  
  
      if (error) {  
        console.error('Error verifying credentials:', error)  
        return null  
      }  
  
      return data.user  
    } catch (error) {  
      console.error('Error in VERIFY_USER_CREDENTIALS:', error)  
      return null  
    }  
  }  
}  
  
const USER_SERVICE = new UserService()  
export default USER_SERVICE