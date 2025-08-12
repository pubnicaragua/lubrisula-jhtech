import { orderService } from "../supabase/order-service"
import { clientService, Client } from "../supabase/client-service"
import { inventoryService } from "../supabase/inventory-service"
import { vehicleService, Vehicle } from "../supabase/vehicle-service"
import { CITAS_SERVICES } from "../supabase/citas-services"
import { supabase } from "../../lib/supabase"

export interface DashboardStats {
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  totalRevenue: number
  totalClients: number
  lowStockItems: number
  upcomingAppointments: number
}

export interface RevenueStats {
  thisMonth: number
  lastMonth: number
  percentageChange: number
  dailyRevenue: Array<{ date: string; amount: number }>
}

export interface OrdersByStatus {
  pendiente: number
  enProceso: number
  completada: number
  entregada: number
  cancelada: number
}

export interface ClientStats {
  totalClients: number
  newThisMonth: number
  activeClients: number
  percentageChange: number
}

export interface InventoryStats {
  totalItems: number
  lowStockItems: number
  outOfStockItems: number
  totalValue: number
}

export interface RecentActivity {
  id: string
  type: 'order' | 'client' | 'appointment' | 'inventory'
  title: string
  description: string
  timestamp: string
  status?: string
}

const dashboardService = {
  // Obtener estadísticas generales del dashboard
  async getDashboardStats(userId: string, userRole: string): Promise<DashboardStats> {
    try {
      if (userRole === 'client') {
        // Estadísticas específicas del cliente
        const [orders, vehicles, appointments] = await Promise.all([
          orderService.getAllOrders(),
          vehicleService.getVehiclesByClientId(userId),
          CITAS_SERVICES.GET_ALL_CITAS_PROGRAMADAS_RECIENTES()
        ])

        const clientOrders = orders.filter(order => order.clientId === userId)
        const clientAppointments = appointments.filter(apt => apt.client_id === userId)
          
        const pendingOrders = clientOrders.filter(order => 
          order.status !== "completed" && order.status !== "delivered"
        )
        const completedOrders = clientOrders.filter(order => 
          order.status === "completed" || order.status === "delivered"
        )

        return {
          totalOrders: clientOrders.length,
          pendingOrders: pendingOrders.length,
          completedOrders: completedOrders.length,
          totalRevenue: clientOrders.reduce((sum, order) => sum + (order.total || 0), 0),
          totalClients: 1, // El cliente mismo
          lowStockItems: 0, // Los clientes no ven inventario
          upcomingAppointments: clientAppointments.length
        }
      } else {
        // Estadísticas completas para admin/técnico
        const [orders, clients, inventory, appointments] = await Promise.all([
          orderService.getAllOrders(),
          clientService.getAllClients(),
          inventoryService.getAllInventory(),
          CITAS_SERVICES.GET_ALL_CITAS_PROGRAMADAS_RECIENTES()
        ])

        const pendingOrders = orders.filter(order => 
          order.status !== "completed" && order.status !== "delivered"
        )
        const completedOrders = orders.filter(order => 
          order.status === "completed" || order.status === "delivered"
        )
        
        // Usar la tabla inventario que tiene stock y minStock
        const lowStockItems = inventory.filter(item => 
          (item.stock || 0) <= (item.minStock || 0)
        )

        return {
          totalOrders: orders.length,
          pendingOrders: pendingOrders.length,
          completedOrders: completedOrders.length,
          totalRevenue: orders.reduce((sum, order) => sum + (order.total || 0), 0),
          totalClients: clients.length,
          lowStockItems: lowStockItems.length,
          upcomingAppointments: appointments.length
        }
      }
    } catch (error) {
      console.error('Error getting dashboard stats:', error)
      throw error
    }
  },

  // Obtener órdenes recientes
  async getRecentOrders(userId: string, userRole: string, limit: number = 5): Promise<any[]> {
    try {
      const orders = await orderService.getAllOrders()
        
      if (userRole === 'client') {
        return orders
          .filter(order => order.clientId === userId)
          .slice(0, limit)
      }
        
      return orders.slice(0, limit)
    } catch (error) {
      console.error('Error getting recent orders:', error)
      throw error
    }
  },

  // Obtener clientes recientes (solo para admin/técnico)
  async getRecentClients(limit: number = 5): Promise<Client[]> {
    try {
      const clients = await clientService.getAllClients()
      return clients
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit)
    } catch (error) {
      console.error('Error getting recent clients:', error)
      throw error
    }
  },

  // Obtener items con stock bajo
  async getLowStockItems(limit: number = 5): Promise<any[]> {
    try {
      const inventory = await inventoryService.getAllInventory()
      return inventory
        .filter(item => (item.stock || 0) <= (item.minStock || 0))
        .sort((a, b) => ((a.stock || 0) / (a.minStock || 1)) - ((b.stock || 0) / (b.minStock || 1)))
        .slice(0, limit)
    } catch (error) {
      console.error('Error getting low stock items:', error)
      throw error
    }
  },

  // Obtener órdenes por estado
  async getOrdersByStatus(): Promise<OrdersByStatus> {
    try {
      const orders = await orderService.getAllOrders()
        
      return {
        pendiente: orders.filter(order => order.status === "reception").length,
        enProceso: orders.filter(order => order.status === "in_progress").length,
        completada: orders.filter(order => order.status === "completed").length,
        entregada: orders.filter(order => order.status === "delivered").length,
        cancelada: orders.filter(order => order.status === "cancelled").length
      }
    } catch (error) {
      console.error('Error getting orders by status:', error)
      throw error
    }
  },

  // Obtener estadísticas de ingresos
  async getRevenueStats(): Promise<RevenueStats> {
    try {
      const orders = await orderService.getAllOrders()
      const now = new Date()
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

      const thisMonthOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt || '')
        return orderDate >= thisMonth && order.status === "completed"
      })

      const lastMonthOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt || '')
        return orderDate >= lastMonth && orderDate <= lastMonthEnd && order.status === "completed"
      })

      const thisMonthRevenue = thisMonthOrders.reduce((sum, order) => sum + (order.total || 0), 0)
      const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + (order.total || 0), 0)
        
      const percentageChange = lastMonthRevenue > 0 
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0

      // Generar ingresos diarios de los últimos 7 días
      const dailyRevenue = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dayOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt || '')
          return orderDate.toDateString() === date.toDateString() && order.status === "completed"
        })
        dailyRevenue.push({
          date: date.toISOString().split('T')[0],
          amount: dayOrders.reduce((sum, order) => sum + (order.total || 0), 0)
        })
      }

      return {
        thisMonth: thisMonthRevenue,
        lastMonth: lastMonthRevenue,
        percentageChange,
        dailyRevenue
      }
    } catch (error) {
      console.error('Error getting revenue stats:', error)
      throw error
    }
  },

  // Obtener estadísticas de clientes
  async getClientStats(): Promise<ClientStats> {
    try {
      const clients = await clientService.getAllClients()
      const orders = await orderService.getAllOrders()
        
      const now = new Date()
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

      const newThisMonth = clients.filter(client => {
        const clientDate = new Date(client.createdAt)
        return clientDate >= thisMonth
      }).length

      const newLastMonth = clients.filter(client => {
        const clientDate = new Date(client.createdAt)
        return clientDate >= lastMonth && clientDate <= lastMonthEnd
      }).length

      const activeClients = clients.filter(client => {
        return orders.some(order => order.clientId === client.id)
      }).length

      const percentageChange = newLastMonth > 0 
        ? ((newThisMonth - newLastMonth) / newLastMonth) * 100 
        : 0

      return {
        totalClients: clients.length,
        newThisMonth,
        activeClients,
        percentageChange
      }
    } catch (error) {
      console.error('Error getting client stats:', error)
      throw error
    }
  },

  // Obtener estadísticas de inventario
  async getInventoryStats(): Promise<InventoryStats> {
    try {
      const inventory = await inventoryService.getAllInventory()
        
      const lowStockItems = inventory.filter(item => 
        (item.stock || 0) <= (item.minStock || 0)
      ).length

      const outOfStockItems = inventory.filter(item => 
        (item.stock || 0) === 0
      ).length

      const totalValue = inventory.reduce((sum, item) => 
        sum + ((item.stock || 0) * (item.priceUSD || 0)), 0
      )

      return {
        totalItems: inventory.length,
        lowStockItems,
        outOfStockItems,
        totalValue
      }
    } catch (error) {
      console.error('Error getting inventory stats:', error)
      throw error
    }
  },

  // Obtener actividad reciente
  async getRecentActivity(userId: string, userRole: string, limit: number = 10): Promise<RecentActivity[]> {
    try {
      const activities: RecentActivity[] = []

      // Obtener órdenes recientes
      const recentOrders = await this.getRecentOrders(userId, userRole, 5)
      recentOrders.forEach(order => {
        activities.push({
          id: order.id || '',
          type: 'order',
          title: `Orden #${order.orderNumber || order.id}`,
          description: order.description || '',
          timestamp: order.createdAt || '',
          status: order.status
        })
      })

      // Para admin/técnico, agregar más actividades
      if (userRole !== 'client') {
        // Clientes recientes
        const recentClients = await this.getRecentClients(3)
        recentClients.forEach(client => {
          activities.push({
            id: client.id || '',
            type: 'client',
            title: `Nuevo cliente: ${client.name || ''}`,
            description: client.email || '',
            timestamp: client.createdAt
          })
        })

        // Citas próximas
        const appointments = await CITAS_SERVICES.GET_ALL_CITAS_PROGRAMADAS_RECIENTES()
        appointments.slice(0, 3).forEach(appointment => {
          activities.push({
            id: appointment.id || '',
            type: 'appointment',
            title: `Cita programada`,
            description: `${appointment.vehicles?.marca || ''} ${appointment.vehicles?.modelo || ''}`,
            timestamp: appointment.fecha || '',
            status: appointment.estado
          })
        })
      }

      // Ordenar por timestamp y limitar
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit)
    } catch (error) {
      console.error('Error getting recent activity:', error)
      throw error
    }
  },

  // Validar permisos de usuario usando la tabla usuarios_taller
  async validateUserPermissions(userId: string, tallerId: string) {
    try {
      // Buscar en usuarios_taller para verificar acceso
      const { data: userTaller, error } = await supabase
        .from('usuarios_taller')
        .select('*')
        .eq('user_id', userId)
        .eq('taller_id', tallerId)
        .eq('acceso', true)
        .single()

      if (error || !userTaller) {
        return {
          hasAccess: false,
          role: 'client',
          permissions: {}
        }
      }

      // Obtener rol del usuario desde perfil_usuario
      const { data: userProfile, error: profileError } = await supabase
        .from('perfil_usuario')
        .select('*')
        .eq('user_id', userId)
        .single()

      // Determinar rol basado en el perfil o asignar por defecto
      let role = 'client'
      if (userProfile) {
        // Aquí puedes implementar lógica para determinar el rol
        // Por ahora asignamos un rol por defecto
        role = 'technician'
      }

      return {
        hasAccess: true,
        role,
        permissions: {}
      }
    } catch (error) {
      console.error('Error validating user permissions:', error)
      throw error
    }
  },

  // Obtener configuración del taller
  async getTallerConfig(tallerId: string) {
    try {
      const { data: config, error } = await supabase
        .from('taller_configuracion')
        .select('*')
        .eq('taller_id', tallerId)
        .single()

      if (error) {
        console.error('Error getting taller config:', error)
        return null
      }

      return config
    } catch (error) {
      console.error('Error getting taller config:', error)
      throw error
    }
  },

  // Obtener citas próximas para un cliente específico
  async getClientUpcomingAppointments(clientId: string, limit: number = 5): Promise<any[]> {
    try {
      const appointments = await CITAS_SERVICES.GET_ALL_CITAS_PROGRAMADAS_RECIENTES()
      return appointments
        .filter(appointment => appointment.client_id === clientId)
        .slice(0, limit)
    } catch (error) {
      console.error('Error getting client upcoming appointments:', error)
      throw error
    }
  },

  // Obtener vehículos de un cliente con información adicional
  async getClientVehiclesWithStats(clientId: string): Promise<Vehicle[]> {
    try {
      const vehicles = await vehicleService.getVehiclesByClientId(clientId)
      const orders = await orderService.getAllOrders()
        
      // Agregar estadísticas a cada vehículo
      return vehicles.map(vehicle => {
        const vehicleOrders = orders.filter(order => order.vehicleId === vehicle.id)
        const lastOrder = vehicleOrders
          .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())[0]
          
        return {
          ...vehicle,
          totalOrders: vehicleOrders.length,
                      lastServiceDate: lastOrder?.createdAt || undefined,
          pendingOrders: vehicleOrders.filter(order => 
            order.status !== "completed" && order.status !== "delivered"
          ).length
        }
      })
    } catch (error) {
      console.error('Error getting client vehicles with stats:', error)
      throw error
    }
  },

  // Obtener resumen financiero
  async getFinancialSummary(startDate?: string, endDate?: string) {
    try {
      const orders = await orderService.getAllOrders()
        
              let filteredOrders = orders.filter(order => order.status === "completed")
        
      if (startDate && endDate) {
        filteredOrders = filteredOrders.filter(order => {
          const orderDate = new Date(order.createdAt || '')
          return orderDate >= new Date(startDate) && orderDate <= new Date(endDate)
        })
      }

      const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0)
      const averageOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0
        
      // Agrupar por mes
      const monthlyRevenue = filteredOrders.reduce((acc, order) => {
        const month = new Date(order.createdAt || '').toISOString().slice(0, 7) // YYYY-MM
        acc[month] = (acc[month] || 0) + (order.total || 0)
        return acc
      }, {} as Record<string, number>)

      return {
        totalRevenue,
        totalOrders: filteredOrders.length,
        averageOrderValue,
        monthlyRevenue: Object.entries(monthlyRevenue).map(([month, revenue]) => ({
          month,
          revenue
        }))
      }
    } catch (error) {
      console.error('Error getting financial summary:', error)
      throw error
    }
  },

  // Obtener alertas del sistema
  async getSystemAlerts(userId: string, userRole: string) {
    try {
      const alerts = []

      if (userRole !== 'client') {
        // Alertas de inventario bajo
        const lowStockItems = await this.getLowStockItems(10)
        if (lowStockItems.length > 0) {
          alerts.push({
            type: 'inventory',
            severity: 'warning',
            title: 'Inventario Bajo',
            message: `${lowStockItems.length} artículos con stock bajo`,
            count: lowStockItems.length
          })
        }

        // Alertas de órdenes pendientes
        const orders = await orderService.getAllOrders()
        const overdueOrders = orders.filter(order => {
          if (order.status === "completed" || order.status === "delivered") return false
          const dueDate = new Date(order.estimatedCompletionDate || '')
          return dueDate < new Date()
        })

        if (overdueOrders.length > 0) {
          alerts.push({
            type: 'orders',
            severity: 'error',
            title: 'Órdenes Vencidas',
            message: `${overdueOrders.length} órdenes han pasado su fecha de entrega`,
            count: overdueOrders.length
          })
        }
      }

      return alerts
    } catch (error) {
      console.error('Error getting system alerts:', error)
      throw error
    }
  }
}

export default dashboardService