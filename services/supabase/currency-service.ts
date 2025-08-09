// services/supabase/currency-service.ts  
import { supabase } from '../supabase'  
  
export interface CurrencyType {  
  id?: string  
  codigo: string  
  nombre: string  
  simbolo: string  
  tasa_cambio: number  
  es_principal: boolean  
}  
  
class CurrencyService {  
  async formatCurrency(amount: number, currency: string = "USD"): Promise<string> {  
    return amount.toLocaleString("es-ES", {  
      style: "currency",  
      currency: currency,  
      minimumFractionDigits: 2,  
    })  
  }  
  
  async initializeCurrencies(): Promise<void> {  
    // Inicialización de monedas por defecto  
    const defaultCurrencies = [  
      { codigo: "USD", nombre: "Dólar", simbolo: "$", tasa_cambio: 1, es_principal: true },  
      { codigo: "NIO", nombre: "Córdoba", simbolo: "C$", tasa_cambio: 36.5, es_principal: false }  
    ]  
  
    for (const currency of defaultCurrencies) {  
      await supabase.from('monedas').upsert(currency, { onConflict: 'codigo' })  
    }  
  }  
}  
  
export default new CurrencyService()