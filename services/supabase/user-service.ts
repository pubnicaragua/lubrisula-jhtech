import { supabase } from '../../lib/supabase'  
  
export interface UserProfile {  
  id: string  
  user_id: string  
  // ✅ CORREGIDO: Usar campos reales del schema  
  first_name: string  
  last_name: string  
  email: string  
  phone?: string  
  avatar_url?: string  
  role: 'admin' | 'technician' | 'client'  
  created_at: string  
  updated_at: string  
  // Campos adicionales  
  address?: string  
  date_of_birth?: string  
  emergency_contact?: string  
  emergency_phone?: string  
  preferences?: Record<string, any>  
}  
  
export interface UserTaller {  
  id: string  
  user_id: string  
  taller_id: string  
  role: string  
  acceso: boolean  
  created_at: string  
  updated_at: string  
}  
  
const USER_SERVICE = {  
  // ✅ CORREGIDO: Usar first_name y last_name en lugar de firstName/lastName  
  async GET_USER_PROFILE(userId: string): Promise<UserProfile | null> {  
    try {  
      const { data, error } = await supabase  
        .from('perfil_usuario')  
        .select('*')  
        .eq('user_id', userId)  
        .single()  
  
      if (error) {  
        console.error('Error getting user profile:', error)  
        return null  
      }  
  
      return data  
    } catch (error) {  
      console.error('Error in GET_USER_PROFILE:', error)  
      return null  
    }  
  },  
  
  // ✅ CORREGIDO: Mapear campos correctamente  
  async CREATE_USER_PROFILE(profileData: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<UserProfile | null> {  
    try {  
      const newProfile = {  
        ...profileData,  
        created_at: new Date().toISOString(),  
        updated_at: new Date().toISOString(),  
      }  
  
      const { data, error } = await supabase  
        .from('perfil_usuario')  
        .insert([newProfile])  
        .select()  
        .single()  
  
      if (error) {  
        console.error('Error creating user profile:', error)  
        return null  
      }  
  
      return data  
    } catch (error) {  
      console.error('Error in CREATE_USER_PROFILE:', error)  
      return null  
    }  
  },  
  
  // ✅ CORREGIDO: Actualizar campos reales  
  async UPDATE_USER_PROFILE(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {  
    try {  
      const updateData = {  
        ...updates,  
        updated_at: new Date().toISOString(),  
      }  
  
      const { data, error } = await supabase  
        .from('perfil_usuario')  
        .update(updateData)  
        .eq('user_id', userId)  
        .select()  
        .single()  
  
      if (error) {  
        console.error('Error updating user profile:', error)  
        return null  
      }  
  
      return data  
    } catch (error) {  
      console.error('Error in UPDATE_USER_PROFILE:', error)  
      return null  
    }  
  },  
  
  async GET_TALLER_ID(userId: string): Promise<string | null> {  
    try {  
      const { data, error } = await supabase  
        .from('usuarios_taller')  
        .select('taller_id')  
        .eq('user_id', userId)  
        .eq('acceso', true)  
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
  },  
  
  async GET_USER_TALLER_RELATION(userId: string, tallerId: string): Promise<UserTaller | null> {  
    try {  
      const { data, error } = await supabase  
        .from('usuarios_taller')  
        .select('*')  
        .eq('user_id', userId)  
        .eq('taller_id', tallerId)  
        .single()  
  
      if (error) {  
        console.error('Error getting user taller relation:', error)  
        return null  
      }  
  
      return data  
    } catch (error) {  
      console.error('Error in GET_USER_TALLER_RELATION:', error)  
      return null  
    }  
  },  
  
  // ✅ CORREGIDO: Usar campos reales para búsqueda  
  async SEARCH_USERS(searchTerm: string, tallerId?: string): Promise<UserProfile[]> {  
    try {  
      let query = supabase  
        .from('perfil_usuario')  
        .select('*')  
  
      if (searchTerm) {  
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)  
      }  
  
      if (tallerId) {  
        const { data: userTallerData } = await supabase  
          .from('usuarios_taller')  
          .select('user_id')  
          .eq('taller_id', tallerId)  
          .eq('acceso', true)  
  
        if (userTallerData && userTallerData.length > 0) {  
          const userIds = userTallerData.map(ut => ut.user_id)  
          query = query.in('user_id', userIds)  
        }  
      }  
  
      const { data, error } = await query.order('first_name').order('last_name')  
  
      if (error) {  
        console.error('Error searching users:', error)  
        return []  
      }  
  
      return data || []  
    } catch (error) {  
      console.error('Error in SEARCH_USERS:', error)  
      return []  
    }  
  },  
  
  async GET_USERS_BY_ROLE(role: string, tallerId?: string): Promise<UserProfile[]> {  
    try {  
      let query = supabase  
        .from('perfil_usuario')  
        .select('*')  
        .eq('role', role)  
  
      if (tallerId) {  
        const { data: userTallerData } = await supabase  
          .from('usuarios_taller')  
          .select('user_id')  
          .eq('taller_id', tallerId)  
          .eq('acceso', true)  
  
        if (userTallerData && userTallerData.length > 0) {  
          const userIds = userTallerData.map(ut => ut.user_id)  
          query = query.in('user_id', userIds)  
        }  
      }  
  
      const { data, error } = await query.order('first_name').order('last_name')  
  
      if (error) {  
        console.error('Error getting users by role:', error)  
        return []  
      }  
  
      return data || []  
    } catch (error) {  
      console.error('Error in GET_USERS_BY_ROLE:', error)  
      return []  
    }  
  },  
  
  // ✅ CORREGIDO: Mapear nombre completo correctamente  
  async GET_USER_DISPLAY_NAME(userId: string): Promise<string> {  
    try {  
      const profile = await this.GET_USER_PROFILE(userId)  
      if (profile) {  
        return `${profile.first_name} ${profile.last_name}`.trim() || profile.email  
      }  
      return 'Usuario desconocido'  
    } catch (error) {  
      console.error('Error getting user display name:', error)  
      return 'Usuario desconocido'  
    }  
  },  
  
  async UPDATE_USER_AVATAR(userId: string, avatarUrl: string): Promise<boolean> {  
    try {  
      const { error } = await supabase  
        .from('perfil_usuario')  
        .update({   
          avatar_url: avatarUrl,  
          updated_at: new Date().toISOString()  
        })  
        .eq('user_id', userId)  
  
      if (error) {  
        console.error('Error updating user avatar:', error)  
        return false  
      }  
  
      return true  
    } catch (error) {  
      console.error('Error in UPDATE_USER_AVATAR:', error)  
      return false  
    }  
  },  
  
  async UPDATE_USER_PREFERENCES(userId: string, preferences: Record<string, any>): Promise<boolean> {  
    try {  
      const { error } = await supabase  
        .from('perfil_usuario')  
        .update({   
          preferences,  
          updated_at: new Date().toISOString()  
        })  
        .eq('user_id', userId)  
  
      if (error) {  
        console.error('Error updating user preferences:', error)  
        return false  
      }  
  
      return true  
    } catch (error) {  
      console.error('Error in UPDATE_USER_PREFERENCES:', error)  
      return false  
    }  
  },  
  
  async DELETE_USER_PROFILE(userId: string): Promise<boolean> {  
    try {  
      const { error } = await supabase  
        .from('perfil_usuario')  
        .delete()  
        .eq('user_id', userId)  
  
      if (error) {  
        console.error('Error deleting user profile:', error)  
        return false  
      }  
  
      return true  
    } catch (error) {  
      console.error('Error in DELETE_USER_PROFILE:', error)  
      return false  
    }  
  },  
  
  async ASSIGN_USER_TO_TALLER(userId: string, tallerId: string, role: string = 'client'): Promise<boolean> {  
    try {  
      const { error } = await supabase  
        .from('usuarios_taller')  
        .insert([{  
          user_id: userId,  
          taller_id: tallerId,  
          role,  
          acceso: true,  
          created_at: new Date().toISOString(),  
          updated_at: new Date().toISOString()  
        }])  
  
      if (error) {  
        console.error('Error assigning user to taller:', error)  
        return false  
      }  
  
      return true  
    } catch (error) {  
      console.error('Error in ASSIGN_USER_TO_TALLER:', error)  
      return false  
    }  
  },  
  
  async REMOVE_USER_FROM_TALLER(userId: string, tallerId: string): Promise<boolean> {  
    try {  
      const { error } = await supabase  
        .from('usuarios_taller')  
        .delete()  
        .eq('user_id', userId)  
        .eq('taller_id', tallerId)  
  
      if (error) {  
        console.error('Error removing user from taller:', error)  
        return false  
      }  
  
      return true  
    } catch (error) {  
      console.error('Error in REMOVE_USER_FROM_TALLER:', error)  
      return false  
    }  
  }  
}  
  
export default USER_SERVICE