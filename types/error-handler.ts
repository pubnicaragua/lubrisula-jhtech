// utils/error-handler.ts - Manejo centralizado de errores  
import { Alert } from 'react-native'  
  
// ✅ Tipos para manejo de errores  
export interface ErrorInfo {  
  code?: string  
  message: string  
  details?: Record<string, any>  
  timestamp: string  
  context?: string  
}  
  
export interface DatabaseError {  
  code: string  
  message: string  
  details?: string  
  hint?: string  
}  
  
// ✅ Manejo de errores de base de datos  
export const handleDatabaseError = (error: any): string => {  
  console.error('Database error:', error)  
    
  // Errores específicos de PostgreSQL/Supabase  
  if (error.code === '23505') {  
    return 'El elemento ya existe en la base de datos'  
  }  
    
  if (error.code === '23503') {  
    return 'Referencia inválida - el elemento relacionado no existe'  
  }  
    
  if (error.code === '42703') {  
    return 'Campo no existe en la tabla'  
  }  
    
  if (error.code === '23502') {  
    return 'Campo requerido faltante'  
  }  
    
  if (error.code === '42P01') {  
    return 'Tabla no encontrada'  
  }  
    
  if (error.code === 'PGRST116') {  
    return 'Elemento no encontrado'  
  }  
    
  // Errores de autenticación de Supabase  
  if (error.message?.includes('JWT')) {  
    return 'Sesión expirada. Por favor, inicia sesión nuevamente'  
  }  
    
  if (error.message?.includes('Invalid login credentials')) {  
    return 'Credenciales de acceso incorrectas'  
  }  
    
  if (error.message?.includes('Email not confirmed')) {  
    return 'Email no confirmado. Revisa tu bandeja de entrada'  
  }  
    
  // Errores de red  
  if (error.message?.includes('Network')) {  
    return 'Error de conexión. Verifica tu conexión a internet'  
  }  
    
  if (error.message?.includes('timeout')) {  
    return 'Tiempo de espera agotado. Intenta nuevamente'  
  }  
    
  // Error genérico  
  return error.message || 'Error desconocido en la base de datos'  
}  
  
// ✅ Manejo de errores de validación  
export const handleValidationErrors = (errors: string[]): void => {  
  if (errors.length === 0) return  
    
  const errorMessage = errors.length === 1   
    ? errors[0]  
    : `Se encontraron ${errors.length} errores:\n\n${errors.map((error, index) => `${index + 1}. ${error}`).join('\n')}`  
    
  Alert.alert('Errores de Validación', errorMessage)  
}  
  
// ✅ Manejo de errores de servicios  
export const handleServiceError = (error: any, context: string = 'Operación'): void => {  
  console.error(`Service error in ${context}:`, error)  
    
  const errorMessage = handleDatabaseError(error)  
  Alert.alert('Error', `${context}: ${errorMessage}`)  
}  
  
// ✅ Logger de errores para debugging  
export const logError = (error: any, context: string, additionalInfo?: Record<string, any>): void => {  
  const errorInfo: ErrorInfo = {  
    code: error.code,  
    message: error.message || 'Unknown error',  
    details: error.details || additionalInfo,  
    timestamp: new Date().toISOString(),  
    context  
  }  
    
  console.error('Error logged:', errorInfo)  
    
  // En producción, aquí enviarías el error a un servicio de logging  
  // como Sentry, LogRocket, etc.  
}  
  
// ✅ Wrapper para operaciones async con manejo de errores  
export const withErrorHandling = async <T>(  
  operation: () => Promise<T>,  
  context: string,  
  showAlert: boolean = true  
): Promise<T | null> => {  
  try {  
    return await operation()  
  } catch (error) {  
    logError(error, context)  
      
    if (showAlert) {  
      handleServiceError(error, context)  
    }  
      
    return null  
  }  
}  
  
// ✅ Validador de respuestas de API  
export const validateApiResponse = <T>(response: any, expectedFields: string[]): T | null => {  
  if (!response || typeof response !== 'object') {  
    throw new Error('Respuesta de API inválida')  
  }  
    
  const missingFields = expectedFields.filter(field => !(field in response))  
    
  if (missingFields.length > 0) {  
    throw new Error(`Campos faltantes en respuesta: ${missingFields.join(', ')}`)  
  }  
    
  return response as T  
}  
  
// ✅ Manejo específico de errores de permisos  
export const handlePermissionError = (userRole: string, requiredPermission: string): void => {  
  const message = userRole === 'client'   
    ? 'No tienes permisos para realizar esta acción'  
    : `Se requiere permiso de ${requiredPermission} para esta operación`  
    
  Alert.alert('Acceso Denegado', message)  
}  
  
// ✅ Retry automático para operaciones fallidas  
export const retryOperation = async <T>(  
  operation: () => Promise<T>,  
  maxRetries: number = 3,  
  delay: number = 1000  
): Promise<T> => {  
  let lastError: any  
    
  for (let attempt = 1; attempt <= maxRetries; attempt++) {  
    try {  
      return await operation()  
    } catch (error) {  
      lastError = error  
        
      if (attempt === maxRetries) {  
        throw error  
      }  
        
      // Esperar antes del siguiente intento  
      await new Promise(resolve => setTimeout(resolve, delay * attempt))  
    }  
  }  
    
  throw lastError  
}