import { useState, useEffect } from "react"  
import { useAuth } from "../context/auth-context"  
import HOJA_INGRESO_SERVICE from "../services/supabase/hoja-ingreso-service"  
import { supabase } from "../lib/supabase"  
  
export interface PendingInspection {  
  vehicleId: string  
  visible: boolean  
  vehicleData?: {  
    marca: string  
    modelo: string  
    placa: string  
    client_id: string  
  }  
}  
  
// ✅ CORREGIDO: Tipo para datos de vehículo desde Supabase  
interface VehicleAssignmentData {  
  vehicle_id: string  
  vehicles: {  
    marca: string  
    modelo: string  
    placa: string  
    client_id: string  
  } | null  
}  
  
export const useVehicleInspection = () => {  
  const { user } = useAuth()  
  const [pendingInspection, setPendingInspection] = useState<PendingInspection | null>(null)  
  const [loading, setLoading] = useState(false)  
  
  useEffect(() => {  
    if (!user?.id) return  
  
    // Función para verificar inspecciones pendientes al iniciar  
    const checkPendingInspections = async () => {  
      try {  
        setLoading(true)  
          
        // Buscar vehículos asignados al cliente sin inspección  
        const { data: assignments, error: assignmentsError } = await supabase  
          .from('vehicle_assignments')  
          .select(`  
            vehicle_id,  
            vehicles:vehicle_id (  
              marca,  
              modelo,  
              placa,  
              client_id  
            )  
          `)  
          .eq('client_id', user.id)  
          .eq('status', 'active')  
  
        if (assignmentsError) throw assignmentsError  
  
        // ✅ CORREGIDO: Verificar cuáles no tienen inspección con tipado correcto  
        for (const assignment of (assignments as VehicleAssignmentData[]) || []) {  
          const existingInspection = await HOJA_INGRESO_SERVICE.ObtenerInspeccion(assignment.vehicle_id)  
            
          if (!existingInspection && assignment.vehicles) {  
            // Mostrar modal obligatorio para el primer vehículo sin inspección  
            setPendingInspection({  
              vehicleId: assignment.vehicle_id,  
              visible: true,  
              vehicleData: {  
                marca: assignment.vehicles.marca,  
                modelo: assignment.vehicles.modelo,  
                placa: assignment.vehicles.placa,  
                client_id: assignment.vehicles.client_id  
              }  
            })  
            break // Solo mostrar uno a la vez  
          }  
        }  
      } catch (error) {  
        console.error('Error checking pending inspections:', error)  
      } finally {  
        setLoading(false)  
      }  
    }  
  
    // Verificar inspecciones pendientes al cargar  
    checkPendingInspections()  
  
    // Escuchar nuevas asignaciones de vehículos en tiempo real  
    const subscription = supabase  
      .channel('vehicle-assignments-realtime')  
      .on('postgres_changes', {  
        event: 'INSERT',  
        schema: 'public',  
        table: 'vehicle_assignments',  
        filter: `client_id=eq.${user.id}`  
      }, async (payload) => {  
        const vehicleId = payload.new.vehicle_id  
          
        // Verificar si ya existe una inspección para este vehículo  
        const existingInspection = await HOJA_INGRESO_SERVICE.ObtenerInspeccion(vehicleId)  
          
        if (!existingInspection) {  
          // Obtener datos del vehículo  
          const { data: vehicleData } = await supabase  
            .from('vehicles')  
            .select('marca, modelo, placa, client_id')  
            .eq('id', vehicleId)  
            .single()  
  
          // ✅ CORREGIDO: Verificar que vehicleData existe antes de usarlo  
          if (vehicleData) {  
            setPendingInspection({  
              vehicleId,  
              visible: true,  
              vehicleData: {  
                marca: vehicleData.marca,  
                modelo: vehicleData.modelo,  
                placa: vehicleData.placa,  
                client_id: vehicleData.client_id  
              }  
            })  
          }  
        }  
      })  
      .on('postgres_changes', {  
        event: 'UPDATE',  
        schema: 'public',  
        table: 'vehicle_assignments',  
        filter: `client_id=eq.${user.id}`  
      }, async (payload) => {  
        // Si se activa una asignación, verificar inspección  
        if (payload.new.status === 'active' && payload.old.status !== 'active') {  
          const vehicleId = payload.new.vehicle_id  
          const existingInspection = await HOJA_INGRESO_SERVICE.ObtenerInspeccion(vehicleId)  
            
          if (!existingInspection) {  
            const { data: vehicleData } = await supabase  
              .from('vehicles')  
              .select('marca, modelo, placa, client_id')  
              .eq('id', vehicleId)  
              .single()  
  
            // ✅ CORREGIDO: Verificar que vehicleData existe  
            if (vehicleData) {  
              setPendingInspection({  
                vehicleId,  
                visible: true,  
                vehicleData: {  
                  marca: vehicleData.marca,  
                  modelo: vehicleData.modelo,  
                  placa: vehicleData.placa,  
                  client_id: vehicleData.client_id  
                }  
              })  
            }  
          }  
        }  
      })  
      .subscribe()  
  
    return () => {  
      subscription.unsubscribe()  
    }  
  }, [user?.id])  
  
  const completeInspection = () => {  
    setPendingInspection(null)  
  }  
  
  const dismissInspection = () => {  
    // Solo para casos excepcionales - normalmente no se permite  
    setPendingInspection(null)  
  }  
  
  return {  
    pendingInspection,  
    completeInspection,  
    dismissInspection,  
    loading  
  }  
}  
  
export default useVehicleInspection