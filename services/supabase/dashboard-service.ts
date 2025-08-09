import ORDENES_TRABAJO_SERVICES, { OrdenTrabajoType } from "../ORDENES.SERVICE"  
import CLIENTS_SERVICES, { ClienteType } from "../CLIENTES_SERVICES.SERVICE"  
import INVENTARIO_SERVICES, { InventarioType } from "../INVENTARIO.SERVICE"  
import DASHBOARD_TALLER_SERVICES, { CabeceraDashboardType, EstadoOrdenType, RendimientoOrdenesSemanalesType } from "../DASHBOARD.TALLER.SERVICE"  
import VEHICULO_SERVICES, { VehiculoType } from "../VEHICULOS.SERVICE"  
import CITAS_SERVICES, { CitasDetalleType } from "../CITAS.SERVICE"  
import USER_SERVICE from "../USER_SERVICES.SERVICE"  
import ACCESOS_SERVICES from "../ACCESOS_SERVICES.service"  
  
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
          ORDENES_TRABAJO_SERVICES.GET_ALL_ORDENES(),  
          VEHICULO_SERVICES.GET_ALL_VEHICULOS_BY_CLIENT(userId),  
          CITAS_SERVICES.GET_ALL_CITAS_PROGRAMADAS_RECIENTES()  
        ])  
  
        const clientOrders = orders.filter(order => order.client_id === userId)  
        const clientAppointments = appointments.filter(apt => apt.client_id === userId)  
          
        const pendingOrders = clientOrders.filter(order =>   
          order.estado !== "Completada" && order.estado !== "Entregada"  
        )  
        const completedOrders = clientOrders.filter(order =>   
          order.estado === "Completada" || order.estado === "Entregada"  
        )  
  
        return {  
          totalOrders: clientOrders.length,  
          pendingOrders: pendingOrders.length,  
          completedOrders: completedOrders.length,  
          totalRevenue: clientOrders.reduce((sum, order) => sum + order.costo, 0),  
          totalClients: 1, // El cliente mismo  
          lowStockItems: 0, // Los clientes no ven inventario  
          upcomingAppointments: clientAppointments.length  
        }  
      } else {  
        // Estadísticas completas para admin/técnico  
        const [orders, clients, inventory, appointments, cabecera] = await Promise.all([  
          ORDENES_TRABAJO_SERVICES.GET_ALL_ORDENES(),  
          CLIENTS_SERVICES.GET_ALL_CLIENTS(),  
          INVENTARIO_SERVICES.GET_INVENTARIO(),  
          CITAS_SERVICES.GET_ALL_CITAS_PROGRAMADAS_RECIENTES(),  
          DASHBOARD_TALLER_SERVICES.GET_CABECERA()  
        ])  
  
        const pendingOrders = orders.filter(order =>   
          order.estado !== "Completada" && order.estado !== "Entregada"  
        )  
        const completedOrders = orders.filter(order =>   
          order.estado === "Completada" || order.estado === "Entregada"  
        )  
        const lowStockItems = inventory.filter(item =>   
          item.stock_actual <= item.stock_minimo  
        )  
  
        return {  
          totalOrders: orders.length,  
          pendingOrders: pendingOrders.length,  
          completedOrders: completedOrders.length,  
          totalRevenue: orders.reduce((sum, order) => sum + order.costo, 0),  
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
  async getRecentOrders(userId: string, userRole: string, limit: number = 5): Promise<OrdenTrabajoType[]> {  
    try {  
      const orders = await ORDENES_TRABAJO_SERVICES.GET_ORDENES_RECIENTES()  
        
      if (userRole === 'client') {  
        return orders  
          .filter(order => order.client_id === userId)  
          .slice(0, limit)  
      }  
        
      return orders.slice(0, limit)  
    } catch (error) {  
      console.error('Error getting recent orders:', error)  
      throw error  
    }  
  },  
  
  // Obtener clientes recientes (solo para admin/técnico)  
  async getRecentClients(limit: number = 5): Promise<ClienteType[]> {  
    try {  
      const clients = await CLIENTS_SERVICES.GET_ALL_CLIENTS()  
      return clients  
        .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())  
        .slice(0, limit)  
    } catch (error) {  
      console.error('Error getting recent clients:', error)  
      throw error  
    }  
  },  
  
  // Obtener items con stock bajo  
  async getLowStockItems(limit: number = 5): Promise<InventarioType[]> {  
    try {  
      const inventory = await INVENTARIO_SERVICES.GET_INVENTARIO()  
      return inventory  
        .filter(item => item.stock_actual <= item.stock_minimo)  
        .sort((a, b) => (a.stock_actual / a.stock_minimo) - (b.stock_actual / b.stock_minimo))  
        .slice(0, limit)  
    } catch (error) {  
      console.error('Error getting low stock items:', error)  
      throw error  
    }  
  },  
  
  // Obtener órdenes por estado  
  async getOrdersByStatus(): Promise<OrdersByStatus> {  
    try {  
      const orders = await ORDENES_TRABAJO_SERVICES.GET_ALL_ORDENES()  
        
      return {  
        pendiente: orders.filter(order => order.estado === "Pendiente").length,  
        enProceso: orders.filter(order => order.estado === "En Proceso").length,  
        completada: orders.filter(order => order.estado === "Completada").length,  
        entregada: orders.filter(order => order.estado === "Entregada").length,  
        cancelada: orders.filter(order => order.estado === "Cancelada").length  
      }  
    } catch (error) {  
      console.error('Error getting orders by status:', error)  
      throw error  
    }  
  },  
  
  // Obtener estadísticas de ingresos  
  async getRevenueStats(): Promise<RevenueStats> {  
    try {  
      const orders = await ORDENES_TRABAJO_SERVICES.GET_ALL_ORDENES()  
      const now = new Date()  
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)  
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)  
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)  
  
      const thisMonthOrders = orders.filter(order => {  
        const orderDate = new Date(order.fecha_creacion)  
        return orderDate >= thisMonth && order.estado === "Completada"  
      })  
  
      const lastMonthOrders = orders.filter(order => {  
        const orderDate = new Date(order.fecha_creacion)  
        return orderDate >= lastMonth && orderDate <= lastMonthEnd && order.estado === "Completada"  
      })  
  
      const thisMonthRevenue = thisMonthOrders.reduce((sum, order) => sum + order.costo, 0)  
      const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + order.costo, 0)  
        
      const percentageChange = lastMonthRevenue > 0   
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100   
        : 0  
  
      // Generar ingresos diarios de los últimos 7 días  
      const dailyRevenue = []  
      for (let i = 6; i >= 0; i--) {  
        const date = new Date()  
        date.setDate(date.getDate() - i)  
        const dayOrders = orders.filter(order => {  
          const orderDate = new Date(order.fecha_creacion)  
          return orderDate.toDateString() === date.toDateString() && order.estado === "Completada"  
        })  
        dailyRevenue.push({  
          date: date.toISOString().split('T')[0],  
          amount: dayOrders.reduce((sum, order) => sum + order.costo, 0)  
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
      const clients = await CLIENTS_SERVICES.GET_ALL_CLIENTS()  
      const orders = await ORDENES_TRABAJO_SERVICES.GET_ALL_ORDENES()  
        
      const now = new Date()  
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)  
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)  
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)  
  
      const newThisMonth = clients.filter(client => {  
        const clientDate = new Date(client.created_at || '')  
        return clientDate >= thisMonth  
      }).length  
  
      const newLastMonth = clients.filter(client => {  
        const clientDate = new Date(client.created_at || '')  
        return clientDate >= lastMonth && clientDate <= lastMonthEnd  
      }).length  
  
      const activeClients = clients.filter(client => {  
        return orders.some(order => order.client_id === client.id)  
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
      const inventory = await INVENTARIO_SERVICES.GET_INVENTARIO()  
        
      const lowStockItems = inventory.filter(item =>   
        item.stock_actual <= item.stock_minimo  
      ).length  
  
      const outOfStockItems = inventory.filter(item =>   
        item.stock_actual === 0  
      ).length  
  
      const totalValue = inventory.reduce((sum, item) =>   
        sum + (item.stock_actual * item.precio_venta), 0  
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
          title: `Orden #${order.numero_orden}`,  
          description: order.descripcion || '',  
          timestamp: order.fecha_creacion || '',  
          status: order.estado  
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
            title: `Nuevo cliente: ${client.name}`,  
            description: client.email || '',  
            timestamp: client.created_at || ''  
          })  
        })  
  
        // Citas próximas  
        const appointments = await CITAS_SERVICES.GET_ALL_CITAS_PROGRAMADAS_RECIENTES()  
        appointments.slice(0, 3).forEach(appointment => {  
          activities.push({  
            id: appointment.id || '',  
            type: 'appointment',  
            title: `Cita programada`,  
            description: `${appointment.vehicles?.marca} ${appointment.vehicles?.modelo}`,  
            timestamp: appointment.created_at || '',  
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
  
  // Obtener datos específicos del taller (para admin/técnico)  
  async getTallerDashboardData() {  
    try {  
      const [cabecera, rendimiento, estados] = await Promise.all([  
        DASHBOARD_TALLER_SERVICES.GET_CABECERA(),  
        DASHBOARD_TALLER_SERVICES.GET_RENDIMIENTO_ORDENES_SEMANALES(),  
        DASHBOARD_TALLER_SERVICES.GET_ESTADO_ORDENES()  
      ])  
  
      return {  
        cabecera,  
        rendimiento,  
        estados,  
        tiposOrdenes: await DASHBOARD_TALLER_SERVICES.GET_PORCENTAJE_ORDENES_POR_TIPO(),  
        especialidades: await DASHBOARD_TALLER_SERVICES.GET_DISTRIBUCION_DE_ESPECIALIDADES(),  
        rendimientoTecnicos: await DASHBOARD_TALLER_SERVICES.GET_RENDIMIENTO_DE_TECNICOS()  
      }  
    } catch (error) {  
      console.error('Error getting taller dashboard data:', error)  
      throw error  
    }  
  },  
  
  // Validar permisos de usuario  
  async validateUserPermissions(userId: string, tallerId: string) {  
    try {  
      const permissions = await ACCESOS_SERVICES.GET_PERMISOS_USUARIO(userId, tallerId)  
      return {  
        hasAccess: permissions?.activo || false,  
        role: permissions?.rol || 'client',  
        permissions: permissions?.permisos || {}  
      }  
    } catch (error) {  
      console.error('Error validating user permissions:', error)  
      throw error  
    }  
  },  
  
  // Obtener configuración del taller  
  async getTallerConfig(tallerId: string) {  
    try {  
      const config = await DASHBOARD_TALLER_SERVICES.GET_CABECERA()  
      return config  
    } catch (error) {  
      console.error('Error getting taller config:', error)  
      throw error  
    }  
  },  
  
  // Obtener citas próximas para un cliente específico  
  async getClientUpcomingAppointments(clientId: string, limit: number = 5): Promise<CitasDetalleType[]> {  
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
  async getClientVehiclesWithStats(clientId: string): Promise<VehiculoType[]> {  
    try {  
      const vehicles = await VEHICULO_SERVICES.GET_ALL_VEHICULOS_BY_CLIENT(clientId)  
      const orders = await ORDENES_TRABAJO_SERVICES.GET_ALL_ORDENES()  
        
      // Agregar estadísticas a cada vehículo  
      return vehicles.map(vehicle => {  
        const vehicleOrders = orders.filter(order => order.vehiculo_id === vehicle.id)  
        const lastOrder = vehicleOrders  
          .sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime())[0]  
          
        return {  
          ...vehicle,  
          totalOrders: vehicleOrders.length,  
          lastServiceDate: lastOrder?.fecha_creacion || null,  
          pendingOrders: vehicleOrders.filter(order =>   
            order.estado !== "Completada" && order.estado !== "Entregada"  
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
      const orders = await ORDENES_TRABAJO_SERVICES.GET_ALL_ORDENES()  
        
      let filteredOrders = orders.filter(order => order.estado === "Completada")  
        
      if (startDate && endDate) {  
        filteredOrders = filteredOrders.filter(order => {  
          const orderDate = new Date(order.fecha_creacion)  
          return orderDate >= new Date(startDate) && orderDate <= new Date(endDate)  
        })  
      }  
  
      const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.costo, 0)  
      const averageOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0  
        
      // Agrupar por mes  
      const monthlyRevenue = filteredOrders.reduce((acc, order) => {  
        const month = new Date(order.fecha_creacion).toISOString().slice(0, 7) // YYYY-MM  
        acc[month] = (acc[month] || 0) + order.costo  
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
        const orders = await ORDENES_TRABAJO_SERVICES.GET_ALL_ORDENES()  
        const overdueOrders = orders.filter(order => {  
          if (order.estado === "Completada" || order.estado === "Entregada") return false  
          const dueDate = new Date(order.fecha_entrega)  
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