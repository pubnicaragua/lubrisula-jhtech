import { supabase } from '../../lib/supabase'  
import { CitasDetalleType } from '../../types'  
  
class CitasService {  
  // Obtener todas las citas
  async GET_ALL_CITAS(): Promise<CitasDetalleType[]> {  
    try {  
      const { data, error } = await supabase  
        .from('citas')  
        .select(`
          *,
          clients:client_id(name),
          vehicles:vehiculo_id(marca, modelo, placa),
          tecnicos:tecnico_id(nombre, apellido)
        `)
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

  // Obtener citas programadas recientes
  async GET_ALL_CITAS_PROGRAMADAS_RECIENTES(): Promise<CitasDetalleType[]> {  
    try {  
      const { data, error } = await supabase  
        .from('citas')  
        .select(`
          *,
          clients:client_id(name),
          vehicles:vehiculo_id(marca, modelo, placa),
          tecnicos:tecnico_id(nombre, apellido)
        `)
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

  // Obtener citas por ID de cliente
  async GET_CITAS_BY_CLIENT_ID(clientId: string): Promise<CitasDetalleType[]> {
    try {
      const { data, error } = await supabase
        .from('citas')
        .select(`
          *,
          clients:client_id(name),
          vehicles:vehiculo_id(marca, modelo, placa),
          tecnicos:tecnico_id(nombre, apellido)
        `)
        .eq('client_id', clientId)
        .order('fecha', { ascending: false })

      if (error) {
        console.error('Error getting appointments by client ID:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in GET_CITAS_BY_CLIENT_ID:', error)
      return []
    }
  }

  // Obtener citas por ID de vehículo
  async GET_CITAS_BY_VEHICLE_ID(vehicleId: string): Promise<CitasDetalleType[]> {
    try {
      const { data, error } = await supabase
        .from('citas')
        .select(`
          *,
          clients:client_id(name),
          vehicles:vehiculo_id(marca, modelo, placa),
          tecnico_id(nombre, apellido)
        `)
        .eq('vehiculo_id', vehicleId)
        .order('fecha', { ascending: false })

      if (error) {
        console.error('Error getting appointments by vehicle ID:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in GET_CITAS_BY_VEHICLE_ID:', error)
      return []
    }
  }

  // Crear nueva cita
  async CREATE_CITA(citaData: Omit<CitasDetalleType, 'id' | 'fecha_creacion'>): Promise<CitasDetalleType | null> {
    try {
      const { data, error } = await supabase
        .from('citas')
        .insert([{
          ...citaData,
          fecha_creacion: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating appointment:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in CREATE_CITA:', error)
      return null
    }
  }

  // Actualizar estado de cita
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

  // Actualizar cita completa
  async UPDATE_CITA(citaId: string, updates: Partial<CitasDetalleType>): Promise<CitasDetalleType | null> {
    try {
      const { data, error } = await supabase
        .from('citas')
        .update(updates)
        .eq('id', citaId)
        .select()
        .single()

      if (error) {
        console.error('Error updating appointment:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in UPDATE_CITA:', error)
      return null
    }
  }

  // Eliminar cita
  async DELETE_CITA(citaId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('citas')
        .delete()
        .eq('id', citaId)

      if (error) {
        console.error('Error deleting appointment:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in DELETE_CITA:', error)
      return false
    }
  }

  // Buscar citas por término
  async SEARCH_CITAS(searchTerm: string): Promise<CitasDetalleType[]> {
    try {
      const { data, error } = await supabase
        .rpc('search_citas', { search_term: searchTerm })

      if (error) {
        console.error('Error searching appointments:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in SEARCH_CITAS:', error)
      return []
    }
  }
}  
  
const CITAS_SERVICES = new CitasService()  
export { CITAS_SERVICES }