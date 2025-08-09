import { supabase } from '../../lib/supabase'  
  
export interface CitasDetalleType {  
  id: string  
  client_id: string  
  vehiculo_id: string  
  fecha: string  
  hora: string  
  tipo_servicio: string  
  estado: string  
  notas?: string  
  tecnico_id?: string  
  costo?: number  
  fecha_creacion: string  
}  
  
class CitasService {  
  async GET_ALL_CITAS(): Promise<CitasDetalleType[]> {  
    try {  
      const { data, error } = await supabase  
        .from('citas')  
        .select('*')  
        .order('fecha', { ascending: false })  
  
      if (error) {  
        console.error('Error getting all appointments:', error)  
        return []  
      }  
  
      return data || []  
    } catch (error) {  
      console.error('Error in GET_ALL_CITAS:', error)  
      return []  
    }  
  }  
  
  async GET_ALL_CITAS_PROGRAMADAS_RECIENTES(): Promise<CitasDetalleType[]> {  
    try {  
      const { data, error } = await supabase  
        .from('citas')  
        .select('*')  
        .in('estado', ['programada', 'confirmada'])  
        .gte('fecha', new Date().toISOString().split('T')[0])  
        .order('fecha', { ascending: true })  
        .limit(10)  
  
      if (error) {  
        console.error('Error getting recent scheduled appointments:', error)  
        return []  
      }  
  
      return data || []  
    } catch (error) {  
      console.error('Error in GET_ALL_CITAS_PROGRAMADAS_RECIENTES:', error)  
      return []  
    }  
  }  
  
  async UPDATE_CITA_STATUS(citaId: string, newStatus: string): Promise<boolean> {  
    try {  
      const { error } = await supabase  
        .from('citas')  
        .update({ estado: newStatus })  
        .eq('id', citaId)  
  
      if (error) {  
        console.error('Error updating appointment status:', error)  
        return false  
      }  
  
      return true  
    } catch (error) {  
      console.error('Error in UPDATE_CITA_STATUS:', error)  
      return false  
    }  
  }  
}  
  
const CITAS_SERVICES = new CitasService()  
export { CITAS_SERVICES }