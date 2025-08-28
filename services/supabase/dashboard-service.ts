import { orderService } from "../supabase/order-service"  
// ✅ CORREGIDO: Importar tipos centralizados  
import { Order } from "../../types/order"  
import { Client } from "../supabase/client-service"  
import { Vehicle } from "../supabase/vehicle-service"  
import { clientService } from "../supabase/client-service"  
import { inventoryService } from "../supabase/inventory-service"  
import { vehicleService } from "../supabase/vehicle-service"  
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
  // ✅ CORREGIDO: Usar campos reales del schema  
  async getDashboardStats(userId: string, userRole: string): Promise<DashboardStats> {  
    try {  
      if (userRole === 'client') {  
        const [orders, vehicles, appointments] = await Promise.all([  
          orderService.getAllOrders(),  
          vehicleService.getVehiclesByClientId(userId),  
          CITAS_SERVICES.GET_ALL_CITAS_PROGRAMADAS_RECIENTES()  
        ])  
  
        const clientOrders = orders.filter(order => order.clientId === userId)  
        const clientAppointments = appointments.filter(apt => apt.client_id === userId)  
  
        const pendingOrders = clientOrders.filter(order =>  
          order.status !== "completed" && order.status !== "delivered")  
        const completedOrders = clientOrders.filter(order =>  
          order.status === "completed" || order.status === "delivered")  
  
        return {  
          totalOrders: clientOrders.length,  
          pendingOrders: pendingOrders.length,  
          completedOrders: completedOrders.length,  
          totalRevenue: clientOrders.reduce((sum, order) => sum + (order.total || 0), 0),  
          totalClients: 1,  
          lowStockItems: 0,  
          upcomingAppointments: clientAppointments.length  
        }  
      } else {  
        const [orders, clients, inventory, appointments] = await Promise.all([  
          orderService.getAllOrders(),  
          clientService.getAllClients(),  
          inventoryService.getAllInventory(),  
          CITAS_SERVICES.GET_ALL_CITAS_PROGRAMADAS_RECIENTES()  
        ])  
  
        const pendingOrders = orders.filter(order =>  
          order.status !== "completed" && order.status !== "delivered")  
        const completedOrders = orders.filter(order =>  
          order.status === "completed" || order.status === "delivered")  
  
        // ✅ CORREGIDO: Usar cantidad en lugar de stock  
        const lowStockItems = inventory.filter(item =>  
          (item.cantidad || 0) <= (item.minStock || 5))  
  
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
  
  async getRecentOrders(userId: string, userRole: string, limit: number = 5): Promise<Order[]> {  
    try {  
      const orders = await orderService.getAllOrders()  
      if (userRole === 'client') {  
        return orders.filter(order => order.clientId === userId).slice(0, limit)  
      }  
      return orders.slice(0, limit)  
    } catch (error) {  
      console.error('Error getting recent orders:', error)  
      throw error  
    }  
  },  
  
  async getRecentClients(limit: number = 5): Promise<Client[]> {  
    try {  
      const clients = await clientService.getAllClients()  
      return clients  
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())  
        .slice(0, limit)  
    } catch (error) {  
      console.error('Error getting recent clients:', error)  
      throw error  
    }  
  },  
  
  // ✅ CORREGIDO: Usar campos reales del inventario  
  async getInventoryStats(): Promise<InventoryStats> {  
    try {  
      const inventory = await inventoryService.getAllInventory()  
      const lowStockItems = inventory.filter(item =>  
        (item.cantidad || 0) <= (item.minStock || 5)).length  
      const outOfStockItems = inventory.filter(item =>  
        (item.cantidad || 0) === 0).length  
      const totalValue = inventory.reduce((sum, item) =>  
        sum + ((item.cantidad || 0) * (item.precio_unitario || 0)), 0)  
  
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
  
  // ✅ CORREGIDO: Usar campos reales de clientes  
  async getClientStats(): Promise<ClientStats> {  
    try {  
      const clients = await clientService.getAllClients()  
      const now = new Date()  
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)  
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)  
  
      const newThisMonth = clients.filter(client =>  
        new Date(client.created_at) >= thisMonth).length  
  
      const newLastMonth = clients.filter(client => {  
        const createdDate = new Date(client.created_at)  
        return createdDate >= lastMonth && createdDate < thisMonth  
      }).length  
  
      const percentageChange = newLastMonth > 0  
        ? ((newThisMonth - newLastMonth) / newLastMonth) * 100  
        : 0  
  
      // Clientes activos (con órdenes en los últimos 3 meses)  
      const threeMonthsAgo = new Date()  
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)  
      const orders = await orderService.getAllOrders()  
      const activeClientIds = new Set(  
        orders.filter(order => new Date(order.createdAt) >= threeMonthsAgo)  
              .map(order => order.clientId)  
      )  
  
      return {  
        totalClients: clients.length,  
        newThisMonth,  
        activeClients: activeClientIds.size,  
        percentageChange  
      }  
    } catch (error) {  
      console.error('Error getting client stats:', error)  
      throw error  
    }  
  },  
  
  async getRevenueStats(): Promise<RevenueStats> {  
    try {  
      const orders = await orderService.getAllOrders()  
      const completedOrders = orders.filter(order =>  
        order.status === "completed" || order.status === "delivered")  
  
      const now = new Date()  
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)  
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)  
  
      // ✅ CORREGIDO: Usar createdAt en lugar de created_at  
      const thisMonthRevenue = completedOrders  
        .filter(order => new Date(order.createdAt) >= thisMonth)  
        .reduce((sum, order) => sum + (order.total || 0), 0)  
  
      const lastMonthRevenue = completedOrders.filter(order => {  
        const orderDate = new Date(order.createdAt)  
        return orderDate >= lastMonth && orderDate < thisMonth  
      }).reduce((sum, order) => sum + (order.total || 0), 0)  
  
      const percentageChange = lastMonthRevenue > 0  
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100  
        : 0  
  
      // Generar datos diarios para los últimos 30 días  
      const dailyRevenue = []  
      for (let i = 29; i >= 0; i--) {  
        const date = new Date()  
        date.setDate(date.getDate() - i)  
        const dateStr = date.toISOString().split('T')[0]  
        const dayRevenue = completedOrders  
          .filter(order => order.createdAt.startsWith(dateStr))  
          .reduce((sum, order) => sum + (order.total || 0), 0)  
        dailyRevenue.push({ date: dateStr, amount: dayRevenue })  
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
  
  async getOrdersByStatus(): Promise<OrdersByStatus> {  
    try {  
      const orders = await orderService.getAllOrders()  
      return {  
        pendiente: orders.filter(o => o.status === 'reception').length,  
        enProceso: orders.filter(o => o.status === 'in_progress').length,  
        completada: orders.filter(o => o.status === 'completed').length,  
        entregada: orders.filter(o => o.status === 'delivered').length,  
        cancelada: orders.filter(o => o.status === 'cancelled').length,  
      }  
    } catch (error) {  
      console.error('Error getting orders by status:', error)  
      throw error  
    }  
  },  
  
  // ✅ CORREGIDO: Usar campos reales para actividades recientes  
  async getRecentActivity(userId: string, userRole: string, limit: number = 10): Promise<RecentActivity[]> {  
    try {  
      const activities: RecentActivity[] = []  
      const [orders, clients] = await Promise.all([  
        orderService.getAllOrders(),  
        userRole !== 'client' ? clientService.getAllClients() : Promise.resolve([])  
      ])  
  
      // Agregar órdenes recientes  
      const recentOrders = userRole === 'client'  
        ? orders.filter(order => order.clientId === userId).slice(0, 5)  
        : orders.slice(0, 5)  
  
      recentOrders.forEach(order => {  
        activities.push({  
          id: order.id,  
          type: 'order',  
          // ✅ CORREGIDO: Usar number en lugar de orderNumber  
          title: `Orden #${order.number ?? order.id?.slice(0, 8)}`,
          description: order.description || 'Sin descripción',  
          // ✅ CORREGIDO: Usar createdAt en lugar de created_at  
          timestamp: order.createdAt,  
          status: order.status  
        })  
      })  
  
      // Agregar clientes recientes (solo para staff)  
      if (userRole !== 'client') {  
        const recentClients = clients.slice(0, 3)  
        recentClients.forEach(client => {  
          activities.push({  
            id: client.id,  
            type: 'client',  
            title: `Cliente: ${client.name}`,  
            description: `Nuevo cliente registrado`,  
            timestamp: client.created_at  
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
  
  // ✅ CORREGIDO: Usar cantidad en lugar de stock  
  async getLowStockItems(limit: number = 10): Promise<any[]> {  
    try {  
      const inventory = await inventoryService.getAllInventory()  
      return inventory  
        .filter(item => (item.cantidad || 0) <= (item.minStock || 5))  
        .sort((a, b) => (a.cantidad || 0) - (b.cantidad || 0))  
        .slice(0, limit)  
    } catch (error) {  
      console.error('Error getting low stock items:', error)  
      throw error  
    }  
  },  
  
  async validateUserPermissions(userId: string, tallerId: string) {  
    try {  
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
  
      const { data: userProfile, error: profileError } = await supabase  
        .from('perfil_usuario')  
        .select('*')  
        .eq('user_id', userId)  
        .single()  
  
      let role = 'client'  
      if (userProfile) {  
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
  
  async getClientUpcomingAppointments(clientId: string, limit: number = 5): Promise<any[]> {  
    try {  
      const appointments = await CITAS_SERVICES.GET_ALL_CITAS_PROGRAMADAS_RECIENTES()  
      return appointments.filter(appointment => appointment.client_id === clientId).slice(0, limit)  
    } catch (error) {  
      console.error('Error getting client upcoming appointments:', error)  
      throw error  
    }  
  },  
  
  async getClientVehiclesWithStats(clientId: string): Promise<Vehicle[]> {  
    try {  
      const vehicles = await vehicleService.getVehiclesByClientId(clientId)  
      const orders = await orderService.getAllOrders()  
        
      return vehicles.map(vehicle => {  
        const vehicleOrders = orders.filter(order => order.vehicleId === vehicle.id)  
        const lastOrder = vehicleOrders  
          .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())[0]  
            
        return {  
          ...vehicle,  
          totalOrders: vehicleOrders.length,  
          // ✅ CORREGIDO: Usar createdAt en lugar de created_at  
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
  
  async getFinancialSummary(startDate?: string, endDate?: string) {  
    try {  
      const orders = await orderService.getAllOrders()  
      let filteredOrders = orders.filter(order => order.status === "completed")  
  
      if (startDate && endDate) {  
        filteredOrders = filteredOrders.filter(order => {  
          // ✅ CORREGIDO: Usar createdAt en lugar de created_at  
          const orderDate = new Date(order.createdAt || '')  
          return orderDate >= new Date(startDate) && orderDate <= new Date(endDate)  
        })  
      }  
  
      const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0)  
      const averageOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0  
  
      const monthlyRevenue = filteredOrders.reduce((acc, order) => {  
        // ✅ CORREGIDO: Usar createdAt en lugar de created_at  
        const month = new Date(order.createdAt || '').toISOString().slice(0, 7)  
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
  
  async getSystemAlerts(userId: string, userRole: string) {  
    try {  
      const alerts = []  
  
      if (userRole !== 'client') {  
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