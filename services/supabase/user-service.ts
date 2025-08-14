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
  // ✅ CORREGIDO: Función de inicialización que sí existe  
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
  
  // Obtener perfil de usuario actual  
  async getCurrentUserProfile(): Promise<UserProfile | null> {  
    try {  
      const { data: { user }, error: authError } = await supabase.auth.getUser()  
        
      if (authError || !user) {  
        console.error('Error getting current user:', authError)  
        return null  
      }  
  
      // Obtener el perfil extendido del usuario  
      const { data: profile, error: profileError } = await supabase  
        .from('perfil_usuario')  
        .select('*')  
        .eq('id', user.id)  
        .single()  
  
      if (profileError) {  
        console.error('Error fetching user profile:', profileError)  
        return null  
      }  
  
      return {  
        id: user.id,  
        email: user.email || '',  
        phone: profile.phone || '',  
        first_name: profile.first_name || '',  
        last_name: profile.last_name || '',  
        full_name: profile.full_name || '',  
        avatar_url: profile.avatar_url || '',  
        role: profile.role || 'client',  
        is_active: profile.is_active !== false,  
        last_login_at: profile.last_login_at || undefined,  
        created_at: profile.created_at || new Date().toISOString(),  
        updated_at: profile.updated_at || new Date().toISOString()  
      }  
    } catch (error) {  
      console.error('Error in getCurrentUserProfile:', error)  
      return null  
    }  
  },  
  
  // ✅ CORREGIDO: Iniciar sesión con mapeo correcto de User  
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
  
      // Actualizar último inicio de sesión  
      await supabase  
        .from('perfil_usuario')  
        .update({ last_login_at: new Date().toISOString() })  
        .eq('id', data.user.id)  
  
      // Obtener el perfil completo del usuario  
      const userProfile = await this.getCurrentUserProfile()  
  
      // ✅ CORREGIDO: Mapear correctamente a tipo User  
      return {  
        user: userProfile ? {  
          id: userProfile.id,  
          email: userProfile.email,  
          name: userProfile.full_name || userProfile.first_name || userProfile.email, // ✅ Usar 'name' no 'firstName'  
          role: userProfile.role,  
          permissions: this.getRolePermissions(userProfile.role), // ✅ Obtener permisos del rol  
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
  
  // ✅ AGREGADO: Función helper para obtener permisos por rol  
  getRolePermissions(role: USER_ROLES_TYPE): string[] {  
    const rolePermissions: Record<USER_ROLES_TYPE, string[]> = {  
      admin: ['*'], // Admin tiene todos los permisos  
      manager: ['view_orders', 'create_orders', 'update_orders', 'view_clients', 'manage_clients', 'view_inventory', 'manage_inventory', 'view_reports'],  
      technician: ['view_orders', 'update_orders', 'view_clients', 'view_inventory'],  
      advisor: ['view_orders', 'create_orders', 'view_clients', 'manage_clients'],  
      client: ['view_own_orders', 'create_orders']  
    }  
    return rolePermissions[role] || rolePermissions['client']  
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
  
  // ✅ CORREGIDO: Registrar nuevo usuario con mapeo correcto  
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
  
      // Crear perfil en la base de datos  
      const { error: profileError } = await supabase  
        .from('perfil_usuario')  
        .insert([{  
          id: authData.user.id,  
          email: userData.email,  
          first_name: userData.firstName,  
          last_name: userData.lastName,  
          full_name: `${userData.firstName} ${userData.lastName}`.trim(),  
          phone: userData.phone || '',  
          role: userData.role || 'client',  
          is_active: true  
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
  
      // ✅ CORREGIDO: Mapear correctamente a tipo User  
      return {  
        user: {  
          id: authData.user.id,  
          email: userData.email,  
          name: `${userData.firstName} ${userData.lastName}`.trim(), // ✅ Usar 'name' no 'firstName'  
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
  
  // Actualizar perfil de usuario  
  async updateProfile(  
    userId: string,   
    updates: Partial<{  
      firstName: string;  
      lastName: string;  
      phone: string;  
      avatarUrl: string;  
    }>  
  ): Promise<{ user: UserProfile | null; error: Error | null }> {  
    try {  
      const updateData: any = {}  
        
      if (updates.firstName) updateData.first_name = updates.firstName  
      if (updates.lastName) updateData.last_name = updates.lastName  
      if (updates.phone) updateData.phone = updates.phone  
      if (updates.avatarUrl) updateData.avatar_url = updates.avatarUrl  
        
      // Si se actualiza el nombre o apellido, actualizar también el full_name  
      if (updates.firstName || updates.lastName) {  
        const { data: currentProfile } = await supabase  
          .from('perfil_usuario')  
          .select('first_name, last_name')  
          .eq('id', userId)  
          .single()  
          
        const firstName = updates.firstName || currentProfile?.first_name || ''  
        const lastName = updates.lastName || currentProfile?.last_name || ''  
        updateData.full_name = `${firstName} ${lastName}`.trim()  
      }  
  
      const { data, error } = await supabase  
        .from('perfil_usuario')  
        .update(updateData)  
        .eq('id', userId)  
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
  
  // Verificar si el usuario tiene un rol específico  
  async hasRole(userId: string, requiredRole: USER_ROLES_TYPE): Promise<boolean> {  
    try {  
      const { data, error } = await supabase  
        .from('perfil_usuario')  
        .select('role')  
        .eq('id', userId)  
        .single()  
  
      if (error || !data) {  
        console.error('Error checking user role:', error)  
        return false  
      }  
  
      // Si el usuario es admin, tiene acceso a todo  
      if (data.role === 'admin') {  
        return true  
      }  
  
      return data.role === requiredRole  
    } catch (error) {  
      console.error('Error in hasRole:', error)  
      return false  
    }  
  },  
  
  // Verificar si el usuario tiene alguno de los roles especificados  
  async hasAnyRole(userId: string, requiredRoles: USER_ROLES_TYPE[]): Promise<boolean> {  
    try {  
      const { data, error } = await supabase  
        .from('perfil_usuario')  
        .select('role')  
        .eq('id', userId)  
        .single()  
  
      if (error || !data) {  
        console.error('Error checking user roles:', error)  
        return false  
      }  
  
      // Si el usuario es admin, tiene acceso a todo  
      if (data.role === 'admin') {  
        return true  
      }  
  
      // Verificar si el rol del usuario está en la lista de roles requeridos  
      return requiredRoles.includes(data.role)  
    } catch (error) {  
      console.error('Error in hasAnyRole:', error)  
      return false  
    }  
  },  
  
  // Obtener todos los usuarios (solo para administradores)  
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
        id: profile.id,  
        email: profile.email || '',  
        phone: profile.phone || '',  
        first_name: profile.first_name || '',  
        last_name: profile.last_name || '',  
        full_name: profile.full_name || '',  
        avatar_url: profile.avatar_url || '',  
        role: profile.role || 'client',  
        is_active: profile.is_active !== false,  
        last_login_at: profile.last_login_at || undefined,  
        created_at: profile.created_at || new Date().toISOString(),  
        updated_at: profile.updated_at || new Date().toISOString()  
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
  
  // ✅ CORREGIDO: Función GET_TALLER_ID  
  async GET_TALLER_ID(userId: string): Promise<string | null> {    
    try {    
      // Por ahora, asumimos que todos los usuarios pertenecen al mismo taller  
      // En el futuro, esto se puede expandir para incluir múltiples talleres  
      return 'default-taller-id'  
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
  
  // ✅ CORREGIDO: Función GET_PERMISOS_USUARIO con 'permisos' en lugar de 'permissions'  
  async GET_PERMISOS_USUARIO(userId: string, tallerId: string): Promise<UserPermissions | null> {    
    try {    
      const { data, error } = await supabase    
        .from('perfil_usuario')    
        .select('role')    
        .eq('id', userId)    
        .single()    
  
      if (error || !data) {    
        console.error('Error getting user permissions:', error)    
        return null    
      }    
  
      // Mapear roles a permisos  
      const rolePermissions: Record<string, string[]> = {  
        admin: ['*'], // Admin tiene todos los permisos  
        manager: ['view_orders', 'create_orders', 'update_orders', 'view_clients', 'manage_clients', 'view_inventory', 'manage_inventory', 'view_reports'],  
        technician: ['view_orders', 'update_orders', 'view_clients', 'view_inventory'],  
        advisor: ['view_orders', 'create_orders', 'view_clients', 'manage_clients'],  
        client: ['view_own_orders', 'create_orders']  
      }  
  
      return {    
        role: data.role || 'client',    
        permisos: rolePermissions[data.role] || rolePermissions['client'], // ✅ Usar 'permisos' no 'permissions'  
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
        
      // Si tiene permiso de admin (*), puede hacer todo  
      if (userPermissions.permisos.includes('*')) return true // ✅ Usar 'permisos'  
        
      return userPermissions.permisos.includes(permiso) // ✅ Usar 'permisos'  
    } catch (error) {    
      console.error('Error verifying permission:', error)    
      return false    
    }    
  },  
  
  // Método adicional para verificar roles usando la función RPC de Supabase    
  async USER_HAS_ROLE(roleName: string): Promise<boolean> {    
    try {    
      const { data, error } = await supabase.rpc('user_has_role', {    
        role_name: roleName    
      })    
  
      if (error) {    
        console.error('Error checking user role:', error)    
        return false    
      }    
  
      return data || false    
    } catch (error) {    
      console.error('Error in USER_HAS_ROLE:', error)    
      return false    
    }    
  },  
  
  // ✅ CORREGIDO: Obtener usuario por ID con mapeo correcto a tipo User  
  async GetUserById(userId: string): Promise<User | null> {    
    try {    
      const { data, error } = await supabase  
        .from('perfil_usuario')  
        .select('*')  
        .eq('id', userId)  
        .single()  
  
      if (error) {  
        console.error('Error fetching user by ID:', error)  
        return null  
      }  
  
      return {  
        id: data.id,  
        email: data.email || '',  
        name: data.full_name || data.first_name || data.email, // ✅ Usar 'name' no 'firstName'  
        role: data.role || 'client',  
        permissions: this.getRolePermissions(data.role || 'client'),  
        profilePic: data.avatar_url,  
        phone: data.phone,  
        isActive: data.is_active !== false  
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
        .eq('is_active', true)  
        .order('full_name', { ascending: true })  
  
      if (error) {  
        console.error('Error fetching technicians:', error)  
        return []  
      }  
  
      return (data || []).map(profile => ({  
        id: profile.id,  
        email: profile.email || '',  
        phone: profile.phone || '',  
        first_name: profile.first_name || '',  
        last_name: profile.last_name || '',  
        full_name: profile.full_name || '',  
        avatar_url: profile.avatar_url || '',  
        role: profile.role || 'technician',  
        is_active: profile.is_active !== false,  
        last_login_at: profile.last_login_at || undefined,  
        created_at: profile.created_at || new Date().toISOString(),  
        updated_at: profile.updated_at || new Date().toISOString()  
      }))  
    } catch (error) {  
      console.error('Error in getAllTechnicians:', error)  
      return []  
    }  
  }  
}  
  
// ✅ CORREGIDO: Exportación por defecto del userService  
export default userService