import { supabase } from '../../lib/supabase'  
  
export interface ReportData {  
  id: string  
  tipo_reporte: string  
  parametros: any  
  datos_generados: any  
  generado_por: string  
  fecha_generacion: string  
  created_at: string  
  updated_at: string  
}  
  
export interface ReportStats {  
  totalOrders: number  
  completedOrders: number  
  pendingOrders: number  
  totalRevenue: number  
  averageOrderValue: number  
  totalClients: number  
  activeClients: number  
  lowStockItems: number  
  totalInventoryValue: number  
}  
  
export interface MonthlyData {  
  month: string  
  orders: number  
  revenue: number  
}  
  
export class ReportsService {  
  // Generar reporte personalizado  
  async generateReport(  
    tipoReporte: string,   
    parametros: any,   
    userId: string  
  ): Promise<ReportData | null> {  
    try {  
      const reportData = {  
        tipo_reporte: tipoReporte,  
        parametros,  
        datos_generados: await this.generateReportData(tipoReporte, parametros),  
        generado_por: userId,  
        fecha_generacion: new Date().toISOString(),  
      }  
  
      const { data, error } = await supabase  
        .from('reportes')  
        .insert([reportData])  
        .select()  
        .single()  
  
      if (error) {  
        console.error('Error generating report:', error)  
        return null  
      }  
  
      return data  
    } catch (error) {  
      console.error('Error in generateReport:', error)  
      return null  
    }  
  }  
  
  // Obtener todos los reportes  
  async getAllReports(): Promise<ReportData[]> {  
    try {  
      const { data, error } = await supabase  
        .from('reportes')  
        .select('*')  
        .order('created_at', { ascending: false })  
  
      if (error) {  
        console.error('Error fetching reports:', error)  
        return []  
      }  
  
      return data || []  
    } catch (error) {  
      console.error('Error in getAllReports:', error)  
      return []  
    }  
  }  
  
  // Obtener reportes por usuario  
  async getReportsByUser(userId: string): Promise<ReportData[]> {  
    try {  
      const { data, error } = await supabase  
        .from('reportes')  
        .select('*')  
        .eq('generado_por', userId)  
        .order('created_at', { ascending: false })  
  
      if (error) {  
        console.error('Error fetching user reports:', error)  
        return []  
      }  
  
      return data || []  
    } catch (error) {  
      console.error('Error in getReportsByUser:', error)  
      return []  
    }  
  }  
  
  // Obtener estadísticas del dashboard  
  async getDashboardStats(): Promise<ReportStats | null> {  
    try {  
      // Obtener órdenes  
      const { data: orders, error: ordersError } = await supabase  
        .from('ordenes_trabajo')  
        .select('*')  
  
      if (ordersError) {  
        console.error('Error fetching orders:', ordersError)  
        return null  
      }  
  
      // Obtener clientes  
      const { data: clients, error: clientsError } = await supabase  
        .from('clients')  
        .select('*')  
  
      if (clientsError) {  
        console.error('Error fetching clients:', clientsError)  
        return null  
      }  
  
      // Obtener inventario  
      const { data: inventory, error: inventoryError } = await supabase  
        .from('inventario')  
        .select('*')  
  
      if (inventoryError) {  
        console.error('Error fetching inventory:', inventoryError)  
        return null  
      }  
  
      // Calcular estadísticas  
      const completedOrders = orders?.filter(order =>   
        order.estado === 'completada' || order.estado === 'entregada'  
      ) || []  
  
      const pendingOrders = orders?.filter(order =>   
        order.estado !== 'completada' &&   
        order.estado !== 'entregada' &&   
        order.estado !== 'cancelada'  
      ) || []  
  
      const totalRevenue = completedOrders.reduce((sum, order) =>   
        sum + (order.costo || 0), 0  
      )  
  
      const averageOrderValue = completedOrders.length > 0   
        ? totalRevenue / completedOrders.length   
        : 0  
  
      // Clientes activos (con órdenes en los últimos 6 meses)  
      const sixMonthsAgo = new Date()  
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)  
        
      const activeClientIds = new Set(  
        orders?.filter(order =>   
          new Date(order.fecha_creacion) >= sixMonthsAgo  
        ).map(order => order.client_id) || []  
      )  
  
      const lowStockItems = inventory?.filter(item =>   
        (item.cantidad || 0) <= 5  
      ) || []  
  
      const totalInventoryValue = inventory?.reduce((sum, item) =>   
        sum + ((item.precio_unitario || 0) * (item.cantidad || 0)), 0  
      ) || 0  
  
      return {  
        totalOrders: orders?.length || 0,  
        completedOrders: completedOrders.length,  
        pendingOrders: pendingOrders.length,  
        totalRevenue,  
        averageOrderValue,  
        totalClients: clients?.length || 0,  
        activeClients: activeClientIds.size,  
        lowStockItems: lowStockItems.length,  
        totalInventoryValue,  
      }  
    } catch (error) {  
      console.error('Error in getDashboardStats:', error)  
      return null  
    }  
  }  
  
  // Generar datos mensuales  
  async getMonthlyData(period: 'week' | 'month' | 'quarter' | 'year'): Promise<MonthlyData[]> {  
    try {  
      const { data: orders, error } = await supabase  
        .from('ordenes_trabajo')  
        .select('*')  
        .order('fecha_creacion', { ascending: true })  
  
      if (error) {  
        console.error('Error fetching orders for monthly data:', error)  
        return []  
      }  
  
      const now = new Date()  
      const months: MonthlyData[] = []  
      const monthCount = period === 'year' ? 12 : period === 'quarter' ? 3 : 1  
  
      for (let i = monthCount - 1; i >= 0; i--) {  
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)  
        const monthName = date.toLocaleDateString('es-ES', {   
          month: 'short',   
          year: 'numeric'   
        })  
  
        const monthOrders = orders?.filter(order => {  
          const orderDate = new Date(order.fecha_creacion)  
          return orderDate.getMonth() === date.getMonth() &&  
                 orderDate.getFullYear() === date.getFullYear()  
        }) || []  
  
        months.push({  
          month: monthName,  
          orders: monthOrders.length,  
          revenue: monthOrders.reduce((sum, order) => sum + (order.costo || 0), 0)  
        })  
      }  
  
      return months  
    } catch (error) {  
      console.error('Error in getMonthlyData:', error)  
      return []  
    }  
  }  
  
  // Generar datos específicos según tipo de reporte  
  private async generateReportData(tipoReporte: string, parametros: any): Promise<any> {  
    switch (tipoReporte) {  
      case 'ventas_mensuales':  
        return await this.getMonthlyData(parametros.period || 'month')  
        
      case 'estadisticas_generales':  
        return await this.getDashboardStats()  
        
      case 'inventario_bajo_stock':  
        const { data: lowStock } = await supabase  
          .from('inventario')  
          .select('*')  
          .lte('cantidad', 5)  
        return lowStock || []  
        
      case 'clientes_activos':  
        const sixMonthsAgo = new Date()  
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)  
          
        const { data: activeOrders } = await supabase  
          .from('ordenes_trabajo')  
          .select('client_id, clients(*)')            .gte('fecha_creacion', sixMonthsAgo.toISOString())  
          
          const activeClients = activeOrders?.reduce((acc: any[], order: any) => {  
            if (order.clients && !acc.find(c => c.id === order.clients.id)) {  
              acc.push(order.clients)  
            }  
            return acc  
          }, []) || []  
            
          return activeClients  
          
        case 'ordenes_por_estado':  
          const { data: allOrders } = await supabase  
            .from('ordenes_trabajo')  
            .select('*')  
            
          const ordersByStatus = allOrders?.reduce((acc: any, order: any) => {  
            acc[order.estado] = (acc[order.estado] || 0) + 1  
            return acc  
          }, {}) || {}  
            
          return ordersByStatus  
          
        default:  
          return null  
      }  
    }  
    
    // Eliminar reporte  
    async deleteReport(reportId: string): Promise<boolean> {  
      try {  
        const { error } = await supabase  
          .from('reportes')  
          .delete()  
          .eq('id', reportId)  
    
        if (error) {  
          console.error('Error deleting report:', error)  
          return false  
        }  
    
        return true  
      } catch (error) {  
        console.error('Error in deleteReport:', error)  
        return false  
      }  
    }  
    
    // Obtener reporte por ID  
    async getReportById(reportId: string): Promise<ReportData | null> {  
      try {  
        const { data, error } = await supabase  
          .from('reportes')  
          .select('*')  
          .eq('id', reportId)  
          .single()  
    
        if (error) {  
          console.error('Error fetching report by ID:', error)  
          return null  
        }  
    
        return data  
      } catch (error) {  
        console.error('Error in getReportById:', error)  
        return null  
      }  
    }  
  }  
    
  // Exportar instancia del servicio  
  export const reportsService = new ReportsService()