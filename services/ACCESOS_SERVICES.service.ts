import { supabase } from '../lib/supabase'  
  
interface UserPermissions {  
  rol: string  
  permisos: string[]  
  taller_id: string  
}  
  
class AccesosService {  
  async GET_PERMISOS_USUARIO(userId: string, tallerId: string): Promise<UserPermissions | null> {  
    try {  
      const { data, error } = await supabase  
        .from('usuarios_talleres')  
        .select(`  
          rol,  
          permisos,  
          taller_id,  
          talleres (  
            id,  
            nombre  
          )  
        `)  
        .eq('usuario_id', userId)  
        .eq('taller_id', tallerId)  
        .single()  
  
      if (error) {  
        console.error('Error getting user permissions:', error)  
        return null  
      }  
  
      return {  
        rol: data?.rol || 'client',  
        permisos: data?.permisos || [],  
        taller_id: data?.taller_id || tallerId  
      }  
    } catch (error) {  
      console.error('Error in GET_PERMISOS_USUARIO:', error)  
      return null  
    }  
  }  
  
  // Método adicional para verificar permisos específicos  
  async VERIFICAR_PERMISO(userId: string, tallerId: string, permiso: string): Promise<boolean> {  
    try {  
      const userPermissions = await this.GET_PERMISOS_USUARIO(userId, tallerId)  
      return userPermissions?.permisos?.includes(permiso) || false  
    } catch (error) {  
      console.error('Error verifying permission:', error)  
      return false  
    }  
  }  
}  
  
const ACCESOS_SERVICES = new AccesosService()  
export default ACCESOS_SERVICES