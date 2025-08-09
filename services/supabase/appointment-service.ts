import { supabase } from '../../lib/supabase'  
  
export interface AppointmentType {  
  id: string  
  client_id: string  
  vehiculo_id: string  
  fecha: string  
  hora: string  
  tipo_servicio: string  
  estado: string  
  notas?: string  
}  
  
export async function getAppointmentsByClientId(clientId: string): Promise<AppointmentType[]> {  
  try {  
    const { data, error } = await supabase  
      .from('citas')  
      .select('*')  
      .eq('client_id', clientId)  
      .order('fecha', { ascending: false })  
  
    if (error) {  
      console.error('Error getting appointments by client ID:', error)  
      return []  
    }  
  
    return data || []  
  } catch (error) {  
    console.error('Error in getAppointmentsByClientId:', error)  
    return []  
  }  
}  
  
export async function getAppointmentsByVehicleId(vehicleId: string): Promise<AppointmentType[]> {  
  try {  
    const { data, error } = await supabase  
      .from('citas')  
      .select('*')  
      .eq('vehiculo_id', vehicleId)  
      .order('fecha', { ascending: false })  
  
    if (error) {  
      console.error('Error getting appointments by vehicle ID:', error)  
      return []  
    }  
  
    return data || []  
  } catch (error) {  
    console.error('Error in getAppointmentsByVehicleId:', error)  
    return []  
  }  
}