import type { CompanySettings } from "../types"
import { getData, storeData, initializeData } from "./storage-service"

// Clave para almacenamiento
const COMPANY_SETTINGS_KEY = "company_settings"

// Datos iniciales de la empresa
const initialCompanySettings: CompanySettings = {
  name: "AutoFlowX Taller",
  logo: require("../assets/autoflowx-logo.png"),
  address: "Calle Principal #123, Ciudad",
  phone: "+1 (555) 123-4567",
  email: "info@autoflowx.com",
  website: "www.autoflowx.com",
  taxId: "12345-6",
  defaultCurrency: "USD",
  showPricesWithTax: true,
  taxRate: 0.13, // 13% de impuesto
  termsAndConditions:
    "1. Todos los repuestos tienen garantía de 30 días.\n2. La mano de obra tiene garantía de 90 días.\n3. Los pagos deben realizarse antes de la entrega del vehículo.",
  invoiceFooter: "¡Gracias por confiar en AutoFlowX Taller!",
  invoiceNotes: "Los precios pueden variar según disponibilidad de repuestos.",
}

// Inicializar datos
export const initializeCompanySettings = async (): Promise<CompanySettings> => {
  return await initializeData<CompanySettings>(COMPANY_SETTINGS_KEY, initialCompanySettings)
}

// Obtener configuración de la empresa
export const getCompanySettings = async (): Promise<CompanySettings> => {
  const settings = await getData<CompanySettings>(COMPANY_SETTINGS_KEY)
  return settings || initialCompanySettings
}

// Actualizar configuración de la empresa
export const updateCompanySettings = async (updates: Partial<CompanySettings>): Promise<CompanySettings> => {
  const currentSettings = await getCompanySettings()
  const updatedSettings = { ...currentSettings, ...updates }

  await storeData(COMPANY_SETTINGS_KEY, updatedSettings)
  return updatedSettings
}

// Actualizar logo de la empresa
export const updateCompanyLogo = async (logoUri: string): Promise<CompanySettings> => {
  const currentSettings = await getCompanySettings()
  const updatedSettings = { ...currentSettings, logo: logoUri }

  await storeData(COMPANY_SETTINGS_KEY, updatedSettings)
  return updatedSettings
}
