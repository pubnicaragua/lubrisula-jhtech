import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/auth-context'

export const useHojaIngresoDetection = () => {
  const { user } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [currentHoja, setCurrentHoja] = useState<any>(null)

  useEffect(() => {
    if (!user?.id) return

    // Suscripción en tiempo real a hoja_ingreso
    const subscription = supabase
      .channel('hoja_ingreso_realtime')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'hoja_ingreso'
        },
        async (payload) => {
          // Verificar si es para un vehículo del cliente actual
          const { data: vehicle } = await supabase
            .from('vehicles')
            .select(`id, marca, modelo, placa, clients:client_id (user_id, name)`)
            .eq('id', payload.new.vehiculo_id)
            .single()
            if (vehicle && Array.isArray(vehicle.clients)) {
              setCurrentHoja(payload.new)
              setShowModal(true)
            }
        }
      )
      .subscribe()

    // Verificar hojas pendientes al cargar
    const checkPendingHojas = async () => {
      try {
        const { data: client } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', user.id)
          .single()
        if (client) {
          const { data: hojasPendientes } = await supabase
            .from('hoja_ingreso')
            .select(`*, vehicles:vehiculo_id (id, marca, modelo, client_id)`)
            .is('firma_cliente', null)
            .eq('vehicles.client_id', client.id)
          if (hojasPendientes && hojasPendientes.length > 0) {
            setCurrentHoja(hojasPendientes[0])
            setShowModal(true)
          }
        }
      } catch (error) {
        console.error('Error verificando hojas pendientes:', error)
      }
    }
    checkPendingHojas()
    return () => {
      subscription.unsubscribe()
    }
  }, [user?.id])

  return { showModal, currentHoja, setShowModal }
}
