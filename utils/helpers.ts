import { format } from "date-fns"
import { es } from "date-fns/locale"

// Formatear fecha
export const formatDate = (dateString: string, formatStr = "dd/MM/yyyy"): string => {
  try {
    const date = new Date(dateString)
    return format(date, formatStr, { locale: es })
  } catch (error) {
    console.error("Error al formatear fecha:", error)
    return dateString
  }
}

// Formatear moneda
export const formatCurrency = (amount: number, currency = "USD"): string => {
  try {
    const formatter = new Intl.NumberFormat("es-HN", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    })
    return formatter.format(amount)
  } catch (error) {
    console.error("Error al formatear moneda:", error)
    return `${currency} ${amount.toFixed(2)}`
  }
}

// Generar ID único
export const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

// Truncar texto
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + "..."
}

// Validar correo electrónico
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validar número de teléfono
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[0-9]{8,15}$/
  return phoneRegex.test(phone)
}

// Calcular tiempo transcurrido
export const timeAgo = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  let interval = Math.floor(seconds / 31536000)
  if (interval >= 1) {
    return interval === 1 ? "hace 1 año" : `hace ${interval} años`
  }

  interval = Math.floor(seconds / 2592000)
  if (interval >= 1) {
    return interval === 1 ? "hace 1 mes" : `hace ${interval} meses`
  }

  interval = Math.floor(seconds / 86400)
  if (interval >= 1) {
    return interval === 1 ? "hace 1 día" : `hace ${interval} días`
  }

  interval = Math.floor(seconds / 3600)
  if (interval >= 1) {
    return interval === 1 ? "hace 1 hora" : `hace ${interval} horas`
  }

  interval = Math.floor(seconds / 60)
  if (interval >= 1) {
    return interval === 1 ? "hace 1 minuto" : `hace ${interval} minutos`
  }

  return seconds < 10 ? "ahora mismo" : `hace ${Math.floor(seconds)} segundos`
}