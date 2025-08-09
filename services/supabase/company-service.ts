// services/supabase/company-service.ts  
import { supabase } from '../supabase'  
  
export interface CompanyType {  
  id?: string  
  nombre: string  
  direccion?: string  
  telefono?: string  
  email?: string  
  ruc?: string  
  logo_url?: string  
  created_at?: string  
  updated_at?: string  
}  
  
class CompanyService {  
  async GET_COMPANY_INFO(): Promise<CompanyType | null> {  
    try {  
      const { data, error } = await supabase  
        .from('talleres')  
        .select('*')  
        .single()  
  
      if (error) throw error  
      return data  
    } catch (error) {  
      console.error('Error getting company info:', error)  
      return null  
    }  
  }  
  
  async UPDATE_COMPANY_INFO(companyData: Partial<CompanyType>): Promise<boolean> {  
    try {  
      const { error } = await supabase  
        .from('talleres')  
        .update({  
          ...companyData,  
          updated_at: new Date().toISOString()  
        })  
        .eq('id', companyData.id)  
  
      if (error) throw error  
      return true  
    } catch (error) {  
      console.error('Error updating company info:', error)  
      return false  
    }  
  }  
}  
  
export default new CompanyService()