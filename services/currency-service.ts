import AsyncStorage from "@react-native-async-storage/async-storage"

// Definir tipos
export type Currency = "USD" | "HNL"

export interface CurrencyInfo {
  code: Currency
  name: string
  symbol: string
}

// Clave para almacenamiento
const EXCHANGE_RATE_KEY = "exchangeRate"
const PREFERRED_CURRENCY_KEY = "preferredCurrency"

// Tasa de cambio predeterminada (USD a HNL)
const DEFAULT_EXCHANGE_RATE = 24.5

// Monedas disponibles
const CURRENCIES: CurrencyInfo[] = [
  { code: "USD", name: "Dólar estadounidense", symbol: "$" },
  { code: "HNL", name: "Lempira hondureño", symbol: "L" },
]

// Inicializar datos
export const initializeCurrencies = async (): Promise<void> => {
  try {
    const storedRate = await AsyncStorage.getItem(EXCHANGE_RATE_KEY)
    if (storedRate === null) {
      await AsyncStorage.setItem(EXCHANGE_RATE_KEY, DEFAULT_EXCHANGE_RATE.toString())
    }

    const storedCurrency = await AsyncStorage.getItem(PREFERRED_CURRENCY_KEY)
    if (storedCurrency === null) {
      await AsyncStorage.setItem(PREFERRED_CURRENCY_KEY, "USD")
    }
  } catch (error) {
    console.error("Error al inicializar monedas:", error)
  }
}

// Obtener tasa de cambio
export const getExchangeRate = async (): Promise<number> => {
  try {
    const storedRate = await AsyncStorage.getItem(EXCHANGE_RATE_KEY)
    return storedRate ? Number.parseFloat(storedRate) : DEFAULT_EXCHANGE_RATE
  } catch (error) {
    console.error("Error al obtener tasa de cambio:", error)
    return DEFAULT_EXCHANGE_RATE
  }
}

// Establecer tasa de cambio
export const setExchangeRate = async (rate: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(EXCHANGE_RATE_KEY, rate.toString())
  } catch (error) {
    console.error("Error al establecer tasa de cambio:", error)
  }
}

// Obtener moneda preferida
export const getPreferredCurrency = async (): Promise<Currency> => {
  try {
    const storedCurrency = await AsyncStorage.getItem(PREFERRED_CURRENCY_KEY)
    return (storedCurrency as Currency) || "USD"
  } catch (error) {
    console.error("Error al obtener moneda preferida:", error)
    return "USD"
  }
}

// Establecer moneda preferida
export const setPreferredCurrency = async (currency: Currency): Promise<void> => {
  try {
    await AsyncStorage.setItem(PREFERRED_CURRENCY_KEY, currency)
  } catch (error) {
    console.error("Error al establecer moneda preferida:", error)
  }
}

// Obtener todas las monedas
export const getAllCurrencies = (): CurrencyInfo[] => {
  return CURRENCIES
}

// Obtener información de moneda por código
export const getCurrencyByCode = (code: Currency): CurrencyInfo | undefined => {
  return CURRENCIES.find((currency) => currency.code === code)
}

// Convertir USD a HNL
export const convertUSDtoHNL = async (amount: number): Promise<number> => {
  const rate = await getExchangeRate()
  return amount * rate
}

// Convertir HNL a USD
export const convertHNLtoUSD = async (amount: number): Promise<number> => {
  const rate = await getExchangeRate()
  return amount / rate
}

// Convertir entre monedas
export const convertAmount = async (amount: number, fromCurrency: Currency, toCurrency: Currency): Promise<number> => {
  if (fromCurrency === toCurrency) {
    return amount
  }

  if (fromCurrency === "USD" && toCurrency === "HNL") {
    return await convertUSDtoHNL(amount)
  } else if (fromCurrency === "HNL" && toCurrency === "USD") {
    return await convertHNLtoUSD(amount)
  }

  return amount
}

// Formatear moneda
export const formatCurrency = (amount: number, currency: Currency): string => {
  const currencyInfo = getCurrencyByCode(currency)

  return new Intl.NumberFormat("es-HN", {
    style: "currency",
    currency: currency,
    currencyDisplay: "symbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
