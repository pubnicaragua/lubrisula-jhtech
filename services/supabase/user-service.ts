import { supabase } from '../../lib/supabase'
import type { User, UserRole, UserProfile } from '../../types/user'

// Mapeo de roles
export const USER_ROLES = {
  admin: 'admin',
  manager: 'manager',
  technician: 'technician',
  advisor: 'advisor',
  client: 'client'
} as const

export const userService = {
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
        .from('profiles')
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
        phone: user.phone || '',
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        fullName: profile.full_name || '',
        avatarUrl: profile.avatar_url || '',
        role: profile.role || 'client',
        isActive: profile.is_active !== false, // Por defecto true si no está definido
        lastLogin: profile.last_login_at ? new Date(profile.last_login_at) : null,
        createdAt: profile.created_at ? new Date(profile.created_at) : new Date(),
        updatedAt: profile.updated_at ? new Date(profile.updated_at) : new Date()
      }
    } catch (error) {
      console.error('Error in getCurrentUserProfile:', error)
      return null
    }
  },

  // Iniciar sesión
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
        .from('profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.user.id)

      // Obtener el perfil completo del usuario
      const userProfile = await this.getCurrentUserProfile()

      return {
        user: userProfile ? {
          id: userProfile.id,
          email: userProfile.email,
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          fullName: userProfile.fullName,
          role: userProfile.role,
          avatarUrl: userProfile.avatarUrl,
          isActive: userProfile.isActive
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

  // Registrar nuevo usuario
  async signUp(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: UserRole;
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
        .from('profiles')
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

      return {
        user: {
          id: authData.user.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          fullName: `${userData.firstName} ${userData.lastName}`.trim(),
          role: userData.role || 'client',
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
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', userId)
          .single()
        
        const firstName = updates.firstName || currentProfile?.first_name || ''
        const lastName = updates.lastName || currentProfile?.last_name || ''
        updateData.full_name = `${firstName} ${lastName}`.trim()
      }

      const { data, error } = await supabase
        .from('profiles')
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

  // Cambiar contraseña
  async updatePassword(
    currentPassword: string, 
    newPassword: string
  ): Promise<{ error: Error | null }> {
    try {
      // Primero necesitamos el email del usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user?.email) {
        return { error: new Error('No se pudo verificar el usuario actual') }
      }

      // Verificar la contraseña actual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (signInError) {
        return { error: new Error('La contraseña actual es incorrecta') }
      }

      // Actualizar la contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        return { error: new Error('Error al actualizar la contraseña') }
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
  async hasRole(userId: string, requiredRole: UserRole): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
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

      // Verificar si el rol del usuario coincide con el requerido
      return data.role === requiredRole
    } catch (error) {
      console.error('Error in hasRole:', error)
      return false
    }
  },

  // Verificar si el usuario tiene al menos uno de los roles requeridos
  async hasAnyRole(userId: string, requiredRoles: UserRole[]): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
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
        .from('profiles')
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
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        fullName: profile.full_name || '',
        avatarUrl: profile.avatar_url || '',
        role: profile.role || 'client',
        isActive: profile.is_active !== false,
        lastLogin: profile.last_login_at ? new Date(profile.last_login_at) : null,
        createdAt: profile.created_at ? new Date(profile.created_at) : new Date(),
        updatedAt: profile.updated_at ? new Date(profile.updated_at) : new Date()
      }))
    } catch (error) {
      console.error('Error in getAllUsers:', error)
      return []
    }
  },

  // Actualizar rol de usuario (solo para administradores)
  async updateUserRole(userId: string, role: UserRole): Promise<{ success: boolean; error?: Error }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)

      if (error) {
        console.error('Error updating user role:', error)
        return { success: false, error: new Error('Error al actualizar el rol del usuario') }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in updateUserRole:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Error al actualizar el rol del usuario') 
      }
    }
  },

  // Desactivar/activar usuario (solo para administradores)
  async toggleUserStatus(userId: string, isActive: boolean): Promise<{ success: boolean; error?: Error }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', userId)

      if (error) {
        console.error('Error toggling user status:', error)
        return { success: false, error: new Error('Error al actualizar el estado del usuario') }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in toggleUserStatus:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Error al actualizar el estado del usuario') 
      }
    }
  },

  // Restablecer contraseña (iniciar flujo de recuperación)
  async resetPassword(email: string): Promise<{ success: boolean; error?: Error }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })

      if (error) {
        console.error('Error sending password reset email:', error)
        return { 
          success: false, 
          error: new Error('Error al enviar el correo de restablecimiento de contraseña') 
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in resetPassword:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Error al restablecer la contraseña') 
      }
    }
  },

  // Verificar sesión actual
  async checkAuthStatus(): Promise<{ user: User | null; error: Error | null }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) {
        return { user: null, error: error ? new Error(error.message) : new Error('No hay sesión activa') }
      }

      // Obtener el perfil del usuario
      const userProfile = await this.getCurrentUserProfile()
      
      if (!userProfile) {
        return { user: null, error: new Error('No se pudo cargar el perfil del usuario') }
      }

      return {
        user: {
          id: userProfile.id,
          email: userProfile.email,
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          fullName: userProfile.fullName,
          role: userProfile.role,
          avatarUrl: userProfile.avatarUrl,
          isActive: userProfile.isActive
        },
        error: null
      }
    } catch (error) {
      console.error('Error in checkAuthStatus:', error)
      return { 
        user: null, 
        error: error instanceof Error ? error : new Error('Error al verificar la sesión') 
      }
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
  }
}

export default userService
