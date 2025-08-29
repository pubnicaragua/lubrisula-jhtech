import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/auth-context'

export const useCitasDetection = () => {
  const { user } = useAuth()
  const [citas, setCitas] = useState<any[]>([])

  useEffect(() => {
    if (!user?.id) return

    const loadCitas = async () => {
      try {
        // Obtener cliente
        const { data: client } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', user.id)
          .single()
        if (client) {
          // Obtener citas del cliente
          const { data: citasData } = await supabase
            .from('citas')
            .select(`*, vehicles:vehiculo_id (marca, modelo, placa)`)
            .eq('client_id', client.id)
            .order('fecha', { ascending: true })
          setCitas(citasData || [])
        }
      } catch (error) {
        console.error('Error cargando citas:', error)
      }
    }

    // Suscripción en tiempo real a citas
    const subscription = supabase
      .channel('citas_realtime')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'citas'
        },
        () => {
          loadCitas() // Recargar citas cuando hay cambios
        }
      )
      .subscribe()

    loadCitas()

    return () => {
      subscription.unsubscribe()
    }
  }, [user?.id])

  return { citas }
}
