import { supabase } from '../../lib/supabase'
import type { UserRole } from '../../types/user'

// Tipos para permisos
type Permission = {
  id: string
  name: string
  description: string
  category: string
}

type RolePermission = {
  role: UserRole
  permission_id: string
  can_view: boolean
  can_edit: boolean
  can_delete: boolean
}

type WorkshopConfig = {
  id: string
  name: string
  address: string
  phone: string
  email: string
  logo_url: string
  business_hours: Record<string, { open: string; close: string }>
  default_currency: string
  tax_rate: number
  created_at: string
  updated_at: string
}

export const accessService = {
  // Obtener todos los permisos disponibles
  async getAllPermissions(): Promise<Permission[]> {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('category')
        .order('name')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching permissions:', error)
      return []
    }
  },

  // Obtener permisos para un rol específico
  async getRolePermissions(role: UserRole): Promise<RolePermission[]> {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*, permission:permissions(*)')
        .eq('role', role)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error(`Error fetching permissions for role ${role}:`, error)
      return []
    }
  },

  // Verificar si un rol tiene un permiso específico
  async hasPermission(
    role: UserRole, 
    permissionName: string, 
    action: 'view' | 'edit' | 'delete' = 'view'
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('check_permission', {
          p_role: role,
          p_permission_name: permissionName,
          p_action: action
        })

      if (error) throw error
      return data || false
    } catch (error) {
      console.error('Error checking permission:', error)
      return false
    }
  },

  // Actualizar permisos para un rol
  async updateRolePermissions(
    role: UserRole, 
    permissions: Array<{
      permission_id: string
      can_view: boolean
      can_edit: boolean
      can_delete: boolean
    }>
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      // Eliminar permisos existentes para el rol
      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role', role)

      if (deleteError) throw deleteError

      // Si no hay permisos para asignar, retornar éxito
      if (permissions.length === 0) {
        return { success: true }
      }

      // Insertar los nuevos permisos
      const rolePermissions = permissions.map(p => ({
        role,
        permission_id: p.permission_id,
        can_view: p.can_view,
        can_edit: p.can_edit,
        can_delete: p.can_delete
      }))

      const { error: insertError } = await supabase
        .from('role_permissions')
        .insert(rolePermissions)

      if (insertError) throw insertError

      return { success: true }
    } catch (error) {
      console.error('Error updating role permissions:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Error al actualizar los permisos') 
      }
    }
  },

  // Obtener configuración del taller
  async getWorkshopConfig(): Promise<WorkshopConfig | null> {
    try {
      const { data, error } = await supabase
        .from('workshop_config')
        .select('*')
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching workshop config:', error)
      return null
    }
  },

  // Actualizar configuración del taller
  async updateWorkshopConfig(
    updates: Partial<Omit<WorkshopConfig, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<{ success: boolean; data?: WorkshopConfig; error?: Error }> {
    try {
      // Obtener la configuración actual para verificar si existe
      const currentConfig = await this.getWorkshopConfig()
      
      let result
      
      if (currentConfig) {
        // Actualizar configuración existente
        const { data, error } = await supabase
          .from('workshop_config')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentConfig.id)
          .select()
          .single()
          
        if (error) throw error
        result = data
      } else {
        // Crear nueva configuración
        const { data, error } = await supabase
          .from('workshop_config')
          .insert([{
            ...updates,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single()
          
        if (error) throw error
        result = data
      }

      return { success: true, data: result as WorkshopConfig }
    } catch (error) {
      console.error('Error updating workshop config:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Error al actualizar la configuración del taller') 
      }
    }
  },

  // Obtener menú de navegación según el rol del usuario
  async getNavigationMenu(role: UserRole): Promise<Array<{
    id: string
    title: string
    icon: string
    path: string
    requiredPermission?: string
    children?: Array<{
      id: string
      title: string
      path: string
      requiredPermission?: string
    }>
  }>> {
    try {
      // Obtener la configuración del menú desde la base de datos
      const { data, error } = await supabase
        .from('navigation_menus')
        .select('*')
        .eq('role', role)
        .order('order', { ascending: true })

      if (error) throw error

      if (!data || data.length === 0) {
        // Si no hay configuración específica para el rol, devolver menú por defecto
        return this.getDefaultNavigationMenu(role)
      }

      // Procesar la estructura jerárquica del menú
      const menuMap = new Map()
      const rootItems: any[] = []

      // Primero, mapear todos los elementos
      data.forEach(item => {
        const menuItem = {
          id: item.id,
          title: item.title,
          icon: item.icon,
          path: item.path,
          requiredPermission: item.required_permission || undefined,
          children: []
        }
        menuMap.set(item.id, menuItem)

        if (!item.parent_id) {
          rootItems.push(menuItem)
        }
      })

      // Luego, establecer las relaciones padre-hijo
      data.forEach(item => {
        if (item.parent_id) {
          const parent = menuMap.get(item.parent_id)
          if (parent) {
            parent.children.push(menuMap.get(item.id))
          }
        }
      })

      return rootItems
    } catch (error) {
      console.error('Error fetching navigation menu:', error)
      // En caso de error, devolver menú por defecto
      return this.getDefaultNavigationMenu(role)
    }
  },

  // Menú de navegación por defecto (en caso de que falle la carga desde la base de datos)
  private getDefaultNavigationMenu(role: UserRole) {
    const commonMenu = [
      {
        id: 'dashboard',
        title: 'Dashboard',
        icon: 'home',
        path: '/dashboard'
      },
      {
        id: 'profile',
        title: 'Mi Perfil',
        icon: 'user',
        path: '/profile'
      }
    ]

    const adminMenu = [
      ...commonMenu,
      {
        id: 'users',
        title: 'Usuarios',
        icon: 'users',
        path: '/admin/users',
        requiredPermission: 'manage_users'
      },
      {
        id: 'settings',
        title: 'Configuración',
        icon: 'settings',
        path: '/admin/settings',
        requiredPermission: 'manage_settings',
        children: [
          {
            id: 'workshop-settings',
            title: 'Taller',
            path: '/admin/settings/workshop',
            requiredPermission: 'manage_workshop_settings'
          },
          {
            id: 'roles-permissions',
            title: 'Roles y Permisos',
            path: '/admin/settings/roles',
            requiredPermission: 'manage_roles'
          }
        ]
      }
    ]

    const technicianMenu = [
      ...commonMenu,
      {
        id: 'orders',
        title: 'Órdenes',
        icon: 'file-text',
        path: '/orders',
        children: [
          {
            id: 'active-orders',
            title: 'Activas',
            path: '/orders/active'
          },
          {
            id: 'completed-orders',
            title: 'Completadas',
            path: '/orders/completed'
          }
        ]
      },
      {
        id: 'inventory',
        title: 'Inventario',
        icon: 'package',
        path: '/inventory',
        requiredPermission: 'view_inventory'
      },
      {
        id: 'clients',
        title: 'Clientes',
        icon: 'users',
        path: '/clients',
        requiredPermission: 'view_clients'
      }
    ]

    const clientMenu = [
      ...commonMenu,
      {
        id: 'my-vehicles',
        title: 'Mis Vehículos',
        icon: 'truck',
        path: '/my-vehicles'
      },
      {
        id: 'my-orders',
        title: 'Mis Órdenes',
        icon: 'file-text',
        path: '/my-orders'
      },
      {
        id: 'appointments',
        title: 'Citas',
        icon: 'calendar',
        path: '/appointments'
      }
    ]

    switch (role) {
      case 'admin':
        return adminMenu
      case 'technician':
      case 'advisor':
        return technicianMenu
      case 'client':
      default:
        return clientMenu
    }
  },

  // Verificar si una ruta es accesible para un rol específico
  async isRouteAccessible(role: UserRole, path: string): Promise<boolean> {
    try {
      // Obtener el menú de navegación para el rol
      const menu = await this.getNavigationMenu(role)
      
      // Función recursiva para buscar la ruta en el menú
      const findRoute = (items: any[], targetPath: string): any => {
        for (const item of items) {
          if (item.path === targetPath) return item
          if (item.children) {
            const found = findRoute(item.children, targetPath)
            if (found) return found
          }
        }
        return null
      }
      
      const routeItem = findRoute(menu, path)
      
      // Si la ruta no está en el menú, denegar por defecto (seguridad por defecto)
      if (!routeItem) return false
      
      // Si la ruta no requiere permiso, permitir acceso
      if (!routeItem.requiredPermission) return true
      
      // Verificar si el rol tiene el permiso requerido
      return this.hasPermission(role, routeItem.requiredPermission, 'view')
    } catch (error) {
      console.error('Error checking route access:', error)
      return false // En caso de error, denegar acceso
    }
  }
}

export default accessService
