import { supabase } from '../../lib/supabase'

export interface CreateCompleteUserData {
  nombre: string
  apellido: string
  correo: string
  telefono?: string
  role?: string
  taller_id?: string
}

export const completeUserService = {
  createUserWithDefaultPassword: async (userData: CreateCompleteUserData) => {
    const password = '123456'
    try {
      // 1. Crear usuario en auth.users
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
      if (authError || !authData.user) {
        return { success: false, error: authError?.message || 'Error creando usuario' }
      }
      const userId = authData.user.id
      // 2. Crear perfil en perfil_usuario
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
          taller_id: userData.taller_id,
          created_at: new Date().toISOString(),
          actualizado: new Date().toISOString()
        })
        .select()
        .single()
      if (profileError) {
        await supabase.auth.admin.deleteUser(userId)
        return { success: false, error: `Error creando perfil: ${profileError.message}` }
      }
      // 3. Crear registro en clients si es cliente
      const role = (userData.role || 'client').toLowerCase()
      if (role === 'cliente' || role === 'client') {
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .insert({
            user_id: userId,
            name: `${userData.nombre} ${userData.apellido}`.trim(),
            email: userData.correo,
            phone: userData.telefono || '',
            company: '',
            client_type: 'Individual',
            taller_id: userData.taller_id,
            activo: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()
        if (clientError) {
          console.error('Error creando cliente:', clientError)
          return { success: false, error: `Error creando cliente: ${clientError.message}` }
        }
      }
      await supabase.auth.signOut()
      return { success: true, data: profileData, userId }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}
