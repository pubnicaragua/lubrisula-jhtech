import { supabase } from '../../lib/supabase'  
import type { User, USER_ROLES_TYPE, UserProfile } from '../../types/user'  
import { UserPermissions } from '../../types/user'  
  
// Mapeo de roles  
export const USER_ROLES = {  
  admin: 'admin',  
  manager: 'manager',  
  technician: 'technician',  
  advisor: 'advisor',  
  client: 'client'  
} as const  
  
export const userService = {  
  // Función de inicialización  
  initializeUsers: async (): Promise<void> => {  
    try {  
      const { data, error } = await supabase.auth.getSession()  
      if (error) {  
        console.error('Error initializing users session:', error)  
        return  
      }  
      console.log('Users initialized successfully:', data?.session ? 'Session found' : 'No session')  
    } catch (error) {  
      console.error('Error initializing users:', error)  
    }  
  },  
  
  // ✅ CORREGIDO: Obtener perfil usando campos reales del schema  
  async getCurrentUserProfile(): Promise<UserProfile | null> {  
    try {  
      const { data: { user }, error: authError } = await supabase.auth.getUser()  
      if (authError || !user) {  
        console.error('Error getting current user:', authError)  
        return null  
      }  
  
      // ✅ USAR CAMPOS REALES: nombre, apellido, correo, telefono  
      const { data: profile, error: profileError } = await supabase  
        .from('perfil_usuario')  
        .select('*')  
        .eq('auth_id', user.id)  
        .single()  
  
      if (profileError) {  
        console.error('Error fetching user profile:', profileError)  
        return null  
      }  
  
      return {  
        id: user.id,  
        email: profile.correo || user.email || '',  
        phone: profile.telefono || '',  
        first_name: profile.nombre || '',  
        last_name: profile.apellido || '',  
        full_name: `${profile.nombre || ''} ${profile.apellido || ''}`.trim(),  
        avatar_url: '', // No existe en el schema actual  
        role: profile.role || 'client',  
        is_active: profile.estado !== false,  
        last_login_at: undefined, // No existe en el schema actual  
        created_at: profile.created_at || new Date().toISOString(),  
        updated_at: profile.actualizado || new Date().toISOString()  
      }  
    } catch (error) {  
      console.error('Error in getCurrentUserProfile:', error)  
      return null  
    }  
  },  
  
  // ✅ CORREGIDO: Función helper para obtener permisos por rol  
  getRolePermissions(role: USER_ROLES_TYPE): string[] {  
    const rolePermissions: Record<USER_ROLES_TYPE, string[]> = {  
      admin: ['*'],  
      manager: ['view_orders', 'create_orders', 'update_orders', 'view_clients', 'manage_clients', 'view_inventory', 'manage_inventory', 'view_reports'],  
      technician: ['view_orders', 'update_orders', 'view_clients', 'view_inventory'],  
      advisor: ['view_orders', 'create_orders', 'view_clients', 'manage_clients'],  
      client: ['view_own_orders', 'create_orders']  
    }  
    return rolePermissions[role] || rolePermissions['client']  
  },  
  
  // ✅ CORREGIDO: Iniciar sesión con mapeo correcto  
  async signIn(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {  
    try {  
      const { data, error } = await supabase.auth.signInWithPassword({  
        email,  
        password,  
      })  
  
      if (error) {  
        return { user: null, error: new Error(error.message) }
      }  
  
      if (!data.user) {  
        return { user: null, error: new Error('No se pudo iniciar sesión') }  
      }  
  
      // ✅ CORREGIDO: Actualizar último inicio de sesión usando campos reales  
      await supabase  
        .from('perfil_usuario')  
        .update({ actualizado: new Date().toISOString() })  
        .eq('auth_id', data.user.id)  
  
      // Obtener el perfil completo del usuario  
      const userProfile = await this.getCurrentUserProfile()  
  
      // ✅ CORREGIDO: Mapear correctamente a tipo User  
      return {  
        user: userProfile ? {  
          id: userProfile.id,  
          email: userProfile.email,  
          name: userProfile.full_name || userProfile.first_name || userProfile.email,  
          role: userProfile.role,  
          permissions: this.getRolePermissions(userProfile.role),  
          profilePic: userProfile.avatar_url,  
          phone: userProfile.phone,  
          isActive: userProfile.is_active  
        } : null,  
        error: null  
      }  
    } catch (error) {  
      console.error('Error in signIn:', error)  
      return {  
        user: null,  
        error: error instanceof Error ? error : new Error('Error al iniciar sesión')  
      }  
    }  
  },  
  
  // Cerrar sesión  
  async signOut(): Promise<{ error: Error | null }> {  
    try {  
      const { error } = await supabase.auth.signOut()  
      return { error: error ? new Error(error.message) : null }  
    } catch (error) {  
      console.error('Error in signOut:', error)  
      return { error: error instanceof Error ? error : new Error('Error al cerrar sesión') }  
    }  
  },  
  
  // ✅ CORREGIDO: Registrar nuevo usuario usando campos reales del schema  
  async signUp(userData: {  
    email: string;  
    password: string;  
    firstName: string;  
    lastName: string;  
    phone?: string;  
    role?: USER_ROLES_TYPE;  
  }): Promise<{ user: User | null; error: Error | null }> {  
    try {  
      // Crear usuario en Auth  
      const { data: authData, error: signUpError } = await supabase.auth.signUp({  
        email: userData.email,  
        password: userData.password,  
        options: {  
          data: {  
            first_name: userData.firstName,  
            last_name: userData.lastName,  
            phone: userData.phone || '',  
          },  
        },  
      })  
  
      if (signUpError || !authData.user) {  
        return {  
          user: null,  
          error: new Error(signUpError?.message || 'Error al crear el usuario')  
        }  
      }  
  
      // ✅ CORREGIDO: Usar campos reales del schema  
      const { error: profileError } = await supabase  
        .from('perfil_usuario')  
        .insert([{  
          auth_id: authData.user.id,  
          correo: userData.email,  
          nombre: userData.firstName,  
          apellido: userData.lastName,  
          telefono: userData.phone || '',  
          role: userData.role || 'client',  
          estado: true,  
          created_at: new Date().toISOString(),  
          actualizado: new Date().toISOString()  
        }])  
  
      if (profileError) {  
        console.error('Error creating user profile:', profileError)  
        // Intentar eliminar el usuario de Auth si falla la creación del perfil  
        await supabase.auth.admin.deleteUser(authData.user.id)  
        return {  
          user: null,  
          error: new Error('Error al crear el perfil del usuario')  
        }  
      }  
  
      return {  
        user: {  
          id: authData.user.id,  
          email: userData.email,  
          name: `${userData.firstName} ${userData.lastName}`.trim(),  
          role: userData.role || 'client',  
          permissions: this.getRolePermissions(userData.role || 'client'),  
          phone: userData.phone,  
          isActive: true  
        },  
        error: null  
      }  
    } catch (error) {  
      console.error('Error in signUp:', error)  
      return {  
        user: null,  
        error: error instanceof Error ? error : new Error('Error al registrar el usuario')  
      }  
    }  
  },  
  
  // ✅ CORREGIDO: Actualizar perfil usando campos reales  
  async updateProfile(  
    userId: string,  
    updates: Partial<{  
      firstName: string;  
      lastName: string;  
      phone: string;  
      email: string;  
    }>  
  ): Promise<{ user: UserProfile | null; error: Error | null }> {  
    try {  
      const updateData: any = {}  
  
      if (updates.firstName) updateData.nombre = updates.firstName  
      if (updates.lastName) updateData.apellido = updates.lastName  
      if (updates.phone) updateData.telefono = updates.phone  
      if (updates.email) updateData.correo = updates.email  
  
      updateData.actualizado = new Date().toISOString()  
  
      const { data, error } = await supabase  
        .from('perfil_usuario')  
        .update(updateData)  
        .eq('auth_id', userId)  
        .select()  
        .single()  
  
      if (error) {  
        console.error('Error updating profile:', error)  
        return { user: null, error: new Error('Error al actualizar el perfil') }  
      }  
  
      // Obtener el perfil actualizado  
      const userProfile = await this.getCurrentUserProfile()  
  
      return {  
        user: userProfile,  
        error: null  
      }  
    } catch (error) {  
      console.error('Error in updateProfile:', error)  
      return {  
        user: null,  
        error: error instanceof Error ? error : new Error('Error al actualizar el perfil')  
      }  
    }  
  },  
  
  // Actualizar contraseña  
  async updatePassword(currentPassword: string, newPassword: string): Promise<{ error: Error | null }> {  
    try {  
      const { error } = await supabase.auth.updateUser({  
        password: newPassword  
      })  
  
      if (error) {  
        return { error: new Error(error.message) }  
      }  
  
      return { error: null }  
    } catch (error) {  
      console.error('Error in updatePassword:', error)  
      return {  
        error: error instanceof Error ? error : new Error('Error al actualizar la contraseña')  
      }  
    }  
  },  
  
  // ✅ CORREGIDO: Verificar rol usando campos reales  
  async hasRole(userId: string, requiredRole: USER_ROLES_TYPE): Promise<boolean> {  
    try {  
      const { data, error } = await supabase  
        .from('perfil_usuario')  
        .select('role')  
        .eq('auth_id', userId)  
        .single()  
  
      if (error || !data) {  
        console.error('Error checking user role:', error)  
        return false  
      }  
  
      if (data.role === 'admin') {  
        return true  
      }  
  
      return data.role === requiredRole  
    } catch (error) {  
      console.error('Error in hasRole:', error)  
      return false  
    }  
  },  
  
  // ✅ CORREGIDO: Verificar múltiples roles  
  async hasAnyRole(userId: string, requiredRoles: USER_ROLES_TYPE[]): Promise<boolean> {  
    try {  
      const { data, error } = await supabase  
        .from('perfil_usuario')  
        .select('role')  
        .eq('auth_id', userId)  
        .single()  
  
      if (error || !data) {  
        console.error('Error checking user roles:', error)  
        return false  
      }  
  
      if (data.role === 'admin') {  
        return true  
      }  
  
      return requiredRoles.includes(data.role)  
    } catch (error) {  
      console.error('Error in hasAnyRole:', error)  
      return false  
    }  
  },  
  
  // ✅ CORREGIDO: Obtener todos los usuarios usando campos reales  
  async getAllUsers(): Promise<UserProfile[]> {  
    try {  
      const { data, error } = await supabase  
        .from('perfil_usuario')  
        .select('*')  
        .order('created_at', { ascending: false })  
  
      if (error) {  
        console.error('Error fetching users:', error)  
        return []  
      }  
  
      return data.map((profile: any) => ({  
  id: profile.auth_id,  
        email: profile.correo || '',  
        phone: profile.telefono || '',  
        first_name: profile.nombre || '',  
        last_name: profile.apellido || '',  
        full_name: `${profile.nombre || ''} ${profile.apellido || ''}`.trim(),  
        avatar_url: '',  
        role: profile.role || 'client',  
        is_active: profile.estado !== false,  
        last_login_at: undefined,  
        created_at: profile.created_at || new Date().toISOString(),  
        updated_at: profile.actualizado || new Date().toISOString()  
      }))  
    } catch (error) {  
      console.error('Error in getAllUsers:', error)  
      return []  
    }  
  },  
  
  // Escuchar cambios de autenticación  
  onAuthStateChange(callback: (event: 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED', session: any) => void) {  
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {  
      callback(event as 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED', session)  
    })  
  
    return () => {  
      subscription.unsubscribe()  
    }  
  },  
  
  // Función GET_TALLER_ID  
  async GET_TALLER_ID(userId: string): Promise<string | null> {  
  try {  
    const { data, error } = await supabase  
      .from('perfil_usuario')  
      .select('taller_id')  
      .eq('auth_id', userId)  
      .single()  
      
    if (error) {  
      console.error('Error getting taller_id:', error)  
      return null  
    }  
      
    return data?.taller_id || null  
  } catch (error) {  
    console.error('Error in GET_TALLER_ID:', error)  
    return null  
  }  
},  
  
  // Verificar credenciales de usuario  
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
  },  
  
  // ✅ CORREGIDO: GET_PERMISOS_USUARIO usando tabla correcta  
  async GET_PERMISOS_USUARIO(userId: string, tallerId: string): Promise<UserPermissions | null> {  
    try {  
      const { data, error } = await supabase  
        .from('perfil_usuario')  
        .select('role')  
        .eq('auth_id', userId)  
        .single()  
  
      if (error || !data) {  
        console.error('Error getting user permissions:', error)  
        return null  
      }  
  
      const rolePermissions: Record<string, string[]> = {  
        admin: ['*'],  
        manager: ['view_orders', 'create_orders', 'update_orders', 'view_clients', 'manage_clients', 'view_inventory', 'manage_inventory', 'view_reports'],  
        technician: ['view_orders', 'update_orders', 'view_clients', 'view_inventory'],  
        advisor: ['view_orders', 'create_orders', 'view_clients', 'manage_clients'],  
        client: ['view_own_orders', 'create_orders']  
      }  
  
      return {  
        role: data.role || 'client',  
        permisos: rolePermissions[data.role] || rolePermissions['client'],  
        taller_id: tallerId  
      }  
    } catch (error) {  
      console.error('Error in GET_PERMISOS_USUARIO:', error)  
      return null  
    }  
  },  
  
  // Verificar permiso específico  
  async VERIFICAR_PERMISO(userId: string, tallerId: string, permiso: string): Promise<boolean> {  
    try {  
      const userPermissions = await this.GET_PERMISOS_USUARIO(userId, tallerId)  
      if (!userPermissions) return false  
  
      if (userPermissions.permisos.includes('*')) return true  
      return userPermissions.permisos.includes(permiso)  
    } catch (error) {  
      console.error('Error verifying permission:', error)  
      return false  
    }  
  },  
  
  // ✅ CORREGIDO: GetUserById usando campos reales  
  async GetUserById(userId: string): Promise<User | null> {  
    try {  
      const { data, error } = await supabase  
        .from('perfil_usuario')  
        .select('*')  
        .eq('auth_id', userId)  
        .single()  
  
      if (error) {  
        console.error('Error fetching user by ID:', error)  
        return null  
      }  
  
      return {  
  id: data.auth_id,  
        email: data.correo || '',  
        name: `${data.nombre || ''} ${data.apellido || ''}`.trim() || data.correo,  
        role: data.role || 'client',  
        permissions: this.getRolePermissions(data.role || 'client'),  
        profilePic: '',  
        phone: data.telefono,  
        isActive: data.estado !== false  
      }  
    } catch (error) {  
      console.error('Error in GetUserById:', error)  
      return null  
    }  
  },  
  
  // Obtener todos los técnicos  
  async getAllTechnicians(): Promise<UserProfile[]> {  
    try {  
      const { data, error } = await supabase  
        .from('perfil_usuario')  
        .select('*')  
        .eq('role', 'technician')  
        .eq('estado', true)  
        .order('nombre', { ascending: true })  
  
      if (error) {  
        console.error('Error fetching technicians:', error)  
        return []  
      }  
  
      return (data || []).map(profile => ({  
  id: profile.auth_id,  
        email: profile.correo || '',  
        phone: profile.telefono || '',  
        first_name: profile.nombre || '',  
        last_name: profile.apellido || '',  
        full_name: `${profile.nombre || ''} ${profile.apellido || ''}`.trim(),  
        avatar_url: '',  
        role: profile.role || 'technician',  
        is_active: profile.estado !== false,  
        last_login_at: undefined,  
        created_at: profile.created_at || new Date().toISOString(),  
        updated_at: profile.actualizado || new Date().toISOString()  
      }))  
    } catch (error) {  
      console.error('Error in getAllTechnicians:', error)  
      return []  
    }  
  },  
  
  // Get user taller (alias for GET_TALLER_ID)  
  async getUserTaller(userId: string): Promise<string | null> {  
    return this.GET_TALLER_ID(userId)  
  },

  // NUEVO: Método para validar integridad del perfil
  async validateUserProfile(userId: string): Promise<{
    isValid: boolean
    missingFields: string[]
    profile?: any
  }> {
    try {
      const { data: profile, error } = await supabase
        .from('perfil_usuario')
        .select('*')
        .eq('auth_id', userId)
        .single()

      if (error) {
        return {
          isValid: false,
          missingFields: ['profile_not_found'],
          profile: null
        }
      }

  const requiredFields = ['auth_id', 'role', 'taller_id']
      const missingFields = requiredFields.filter(field => !profile[field])

      return {
        isValid: missingFields.length === 0,
        missingFields,
        profile
      }
    } catch (error) {
      console.error('Error validating user profile:', error)
      return {
        isValid: false,
        missingFields: ['validation_error'],
        profile: null
      }
    }
  }
}  
  
// Exportación por defecto del userService  
export default userService