// services/supabase/complete-signup-service.ts  
import { supabase } from '../../lib/supabase'  
import type { USER_ROLES_TYPE } from '../../types/user'  
  
export interface CreateUserData {  
  nombre: string  
  apellido: string  
  correo: string  
  telefono?: string  
  role?: string  
  taller_id?: string  
}  
  
export interface CreateUserResponse {  
  success: boolean  
  data: any | null  
  error: string | null  
  userId?: string  
}  
  
export const completeSignupService = {  
  /**  
   * Crea un usuario completo con contraseña predeterminada 123456  
   * Maneja todo el flujo: auth.users -> perfil_usuario -> clients (si es cliente)  
   */  
  createUserWithDefaultPassword: async (userData: CreateUserData): Promise<CreateUserResponse> => {  
    const password = '123456'  
      
    try {  
      // 1. Verificar si el usuario ya existe (sin usar admin.listUsers)  
      const { data: existingAuth, error: checkError } = await supabase.auth.signInWithPassword({  
        email: userData.correo,  
        password: 'test-password-that-wont-work'  
      })  
        
      // Si no hay error de credenciales inválidas, el usuario existe  
      if (!checkError || !checkError.message.includes('Invalid login credentials')) {  
        await supabase.auth.signOut() // Limpiar sesión de prueba  
        return {   
          success: false,   
          data: null,   
          error: 'El usuario ya existe. Por favor inicia sesión o recupera tu contraseña.'   
        }  
      }  
  
      // 2. Crear usuario en auth.users  
      const { data: authData, error: authError } = await supabase.auth.signUp({  
        email: userData.correo,  
        password,  
        options: {  
          data: {  
            first_name: userData.nombre,  
            last_name: userData.apellido,  
            role: userData.role || 'client'  
          }  
        }  
      })  
  
      if (authError) {  
        if (authError.message.includes('User already registered')) {  
          return {   
            success: false,   
            data: null,   
            error: 'El usuario ya existe. Por favor inicia sesión o recupera tu contraseña.'   
          }  
        }  
        return { success: false, data: null, error: authError.message }  
      }  
  
      if (!authData.user) {  
        return { success: false, data: null, error: 'No se pudo crear usuario en auth' }  
      }  
  
      const userId = authData.user.id  
  
      // 3. Crear perfil en perfil_usuario usando campos reales del schema  
      const { data: profileData, error: profileError } = await supabase  
        .from('perfil_usuario')  
        .insert({  
          auth_id: userId,  
          correo: userData.correo,  
          nombre: userData.nombre,  
          apellido: userData.apellido,  
          telefono: userData.telefono || '',  
          role: userData.role || 'client',  
          estado: true,  
          taller_id: userData.taller_id || null,  
          created_at: new Date().toISOString(),  
          actualizado: new Date().toISOString()  
        })  
        .select()  
        .single()  
  
      if (profileError) {  
        // Limpiar usuario de auth si falla el perfil  
        try {  
          await supabase.auth.admin.deleteUser(userId)  
        } catch (cleanupError) {  
          console.error('Error limpiando usuario de auth:', cleanupError)  
        }  
        return {   
          success: false,   
          data: null,   
          error: `Error creando perfil: ${profileError.message}`   
        }  
      }  
  
      // 4. Crear registro en clients si el rol es cliente  
      const role = (userData.role || 'client').toLowerCase()  
      if (role === 'cliente' || role === 'client') {  
        const { error: clientError } = await supabase  
          .from('clients')  
          .insert({  
            user_id: userId, // Usar el ID de auth.users  
            name: `${userData.nombre} ${userData.apellido}`.trim(),  
            email: userData.correo,  
            phone: userData.telefono || '',  
            company: '',  
            client_type: 'Individual',  
            taller_id: userData.taller_id || null,  
            created_at: new Date().toISOString(),  
            updated_at: new Date().toISOString()  
          })  
  
        if (clientError) {  
          console.error('Error creando cliente:', clientError)  
          // No fallar completamente, solo advertir  
          console.warn(`Usuario creado pero sin registro en clients: ${clientError.message}`)  
        }  
      }  
  
      // 5. Cerrar la sesión automática creada por signUp  
      await supabase.auth.signOut()  
  
      return {   
        success: true,   
        data: profileData,   
        error: null,  
        userId   
      }  
  
    } catch (error: any) {  
      console.error('Error en createUserWithDefaultPassword:', error)  
      return {   
        success: false,   
        data: null,   
        error: error.message || 'Error inesperado al crear usuario'   
      }  
    }  
  },  
  
  /**  
   * Valida que un usuario tenga todos los registros necesarios  
   */  
  validateUserIntegrity: async (email: string): Promise<{  
    isValid: boolean  
    missingTables: string[]  
    userDetails: any  
  }> => {  
    const result = {  
      isValid: true,  
      missingTables: [] as string[],  
      userDetails: {} as any  
    }  
  
    try {  
      // Verificar auth.users  
      const { data: authUser } = await supabase.auth.admin.getUserByEmail(email)  
      if (!authUser?.user) {  
        result.missingTables.push('auth.users')  
        result.isValid = false  
      } else {  
        result.userDetails.auth = authUser.user  
      }  
  
      // Verificar perfil_usuario  
      const { data: profile } = await supabase  
        .from('perfil_usuario')  
        .select('*')  
        .eq('correo', email)  
        .single()  
  
      if (!profile) {  
        result.missingTables.push('perfil_usuario')  
        result.isValid = false  
      } else {  
        result.userDetails.profile = profile  
      }  
  
      // Verificar clients (solo si es cliente)  
      if (profile?.role === 'client' || profile?.role === 'cliente') {  
        const { data: client } = await supabase  
          .from('clients')  
          .select('*')  
          .eq('user_id', profile.auth_id)  
          .single()  
  
        if (!client) {  
          result.missingTables.push('clients')  
          result.isValid = false  
        } else {  
          result.userDetails.client = client  
        }  
      }  
  
      return result  
  
    } catch (error) {  
      console.error('Error validando integridad:', error)  
      return {  
        isValid: false,  
        missingTables: ['validation_error'],  
        userDetails: {}  
      }  
    }  
  },  
  
  /**  
   * Repara un usuario que tenga registros faltantes  
   */  
  repairUserData: async (email: string): Promise<CreateUserResponse> => {  
    try {  
      const validation = await this.validateUserIntegrity(email)  
        
      if (validation.isValid) {  
        return { success: true, data: validation.userDetails, error: null }  
      }  
  
      const authUser = validation.userDetails.auth  
      const profile = validation.userDetails.profile  
  
      if (!authUser) {  
        return { success: false, data: null, error: 'Usuario no existe en auth.users' }  
      }  
  
      // Crear perfil si falta  
      if (validation.missingTables.includes('perfil_usuario')) {  
        const { error: profileError } = await supabase  
          .from('perfil_usuario')  
          .insert({  
            auth_id: authUser.id,  
            correo: authUser.email,  
            nombre: authUser.user_metadata?.first_name || authUser.email.split('@')[0],  
            apellido: authUser.user_metadata?.last_name || '',  
            telefono: authUser.user_metadata?.phone || '',  
            role: authUser.user_metadata?.role || 'client',  
            estado: true,  
            created_at: new Date().toISOString(),  
            actualizado: new Date().toISOString()  
          })  
  
        if (profileError) {  
          return { success: false, data: null, error: `Error creando perfil: ${profileError.message}` }  
        }  
      }  
  
      // Crear cliente si falta y es necesario  
      if (validation.missingTables.includes('clients') &&   
          (profile?.role === 'client' || profile?.role === 'cliente')) {  
        const { error: clientError } = await supabase  
          .from('clients')  
          .insert({  
            user_id: authUser.id,  
            name: `${profile?.nombre || ''} ${profile?.apellido || ''}`.trim() || authUser.email,  
            email: authUser.email,  
            phone: profile?.telefono || '',  
            company: '',  
            client_type: 'Individual',  
            created_at: new Date().toISOString(),  
            updated_at: new Date().toISOString()  
          })  
  
        if (clientError) {  
          return { success: false, data: null, error: `Error creando cliente: ${clientError.message}` }  
        }  
      }  
  
      return { success: true, data: null, error: null }  
  
    } catch (error: any) {  
      return { success: false, data: null, error: error.message }  
    }  
  }  
}  
  
export default completeSignupService