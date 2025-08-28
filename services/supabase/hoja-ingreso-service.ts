// services/supabase/hoja-ingreso-service.ts  
import { supabase } from "../../lib/supabase"  
  
export type HojaIngresoType = {  
  vehiculo_id: string  
  fecha: string // ISO string  
  interiores: {  
    documentos: { cantidad: string; si: boolean; no: boolean }  
    radio: { cantidad: string; si: boolean; no: boolean }  
    portafusil: { cantidad: string; si: boolean; no: boolean }  
    encendedor: { cantidad: string; si: boolean; no: boolean }  
    tapetes_tela: { cantidad: string; si: boolean; no: boolean }  
    tapetes_plastico: { cantidad: string; si: boolean; no: boolean }  
    medidor_gasolina: { cantidad: string; si: boolean; no: boolean }  
    kilometraje: { cantidad: string; si: boolean; no: boolean }  
  }  
  exteriores: {  
    antena: { cantidad: string; si: boolean; no: boolean }  
    falanges: { cantidad: string; si: boolean; no: boolean }  
    centro_rin: { cantidad: string; si: boolean; no: boolean }  
    placas: { cantidad: string; si: boolean; no: boolean }  
  }  
  coqueta: {  
    herramienta: { cantidad: string; si: boolean; no: boolean }  
    reflejantes: { cantidad: string; si: boolean; no: boolean }  
    cables_corriente: { cantidad: string; si: boolean; no: boolean }  
    llanta_refaccion: { cantidad: string; si: boolean; no: boolean }  
    llave_cruceta: { cantidad: string; si: boolean; no: boolean }  
    gato: { cantidad: string; si: boolean; no: boolean }  
    latero: { cantidad: string; si: boolean; no: boolean }  
    otro: { cantidad: string; si: boolean; no: boolean }  
  }  
  motor: {  
    bateria: { cantidad: string; si: boolean; no: boolean }  
    computadora: { cantidad: string; si: boolean; no: boolean }  
    tapones_deposito: { cantidad: string; si: boolean; no: boolean }  
  }  
  nivel_gasolina: string  
  comentarios: string  
  imagen_carroceria: string | null  
  puntos: {  
    x: number  
    y: number  
    id: string  
    descripcion: string  
  }[]  
  firmas: {  
    firmaCliente: string | null  
    firmaEncargado: string | null  
  }  
}  
  
export type HojaIngresoDBType = Omit<HojaIngresoType, "firmas"> & {  
  firma_cliente: string | null  
  firma_encargado: string | null  
}  
  
const HOJA_INGRESO_SERVICE = {  
  ObtenerInspeccion: async (vehiculoId: string): Promise<HojaIngresoDBType | null> => {  
    const { data, error } = await supabase  
      .from('hoja_ingreso')  
      .select('*')  
      .eq('vehiculo_id', vehiculoId)  
      .single()  
  
    if (error) {  
      console.error("Error obteniendo inspección:", error)  
      return null  
    }  
  
    return data  
  },  
  
  guardarInspeccion: async (vehiculoId: string, inspeccionData: HojaIngresoType) => {  
    const firma_cliente = inspeccionData.firmas.firmaCliente || null  
    const firma_encargado = inspeccionData.firmas.firmaEncargado || null  
  
    // Preparar datos sin firmas  
    const { firmas, ...dataWithoutFirmas } = inspeccionData  
    const finalData = {  
      ...dataWithoutFirmas,  
      firma_cliente,  
      firma_encargado  
    }  
  
    // Verificar si ya existe una inspección  
    const existingInspection = await HOJA_INGRESO_SERVICE.ObtenerInspeccion(vehiculoId)  
  
    if (existingInspection) {  
      // Actualizar existente  
      const { data, error } = await supabase  
        .from('hoja_ingreso')  
        .update(finalData)  
        .eq('vehiculo_id', vehiculoId)  
        .select()  
  
      if (error) throw error  
      return data  
    } else {  
      // Crear nueva  
      const { data, error } = await supabase  
        .from('hoja_ingreso')  
        .insert(finalData)  
        .select()  
  
      if (error) throw error  
      return data  
    }  
  }  
}  
  
export default HOJA_INGRESO_SERVICE