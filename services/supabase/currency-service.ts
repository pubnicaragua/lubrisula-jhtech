// services/supabase/currency-service.ts  
import { supabase } from '../../lib/supabase'  
  
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
  
  async getAllCurrencies(): Promise<CurrencyType[]> {
    try {
      const { data, error } = await supabase.from('monedas').select('*')
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching currencies:', error)
      throw error
    }    
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

  // Convert USD to HNL (Honduran Lempira)
  async convertUSDtoHNL(amount: number): Promise<number> {
    // Using approximate exchange rate (1 USD = 24.5 HNL)
    return amount * 24.5
  }

  // Convert HNL to USD
  async convertHNLtoUSD(amount: number): Promise<number> {
    // Using approximate exchange rate (1 HNL = 0.041 USD)
    return amount * 0.041
  }
}  
  
export default new CurrencyService()