// utils/validators.ts - Validadores para entidades principales  
import { CreateClientData, UpdateClientData, CreateVehicleData, UpdateVehicleData } from '../types'  
  
// ✅ Validadores para Client  
export const validateClientData = (data: Partial<CreateClientData>): string[] => {  
  const errors: string[] = []  
    
  if (!data.name?.trim()) {  
    errors.push('Nombre es requerido')  
  } else if (data.name.trim().length < 2) {  
    errors.push('Nombre debe tener al menos 2 caracteres')  
  }  
    
  if (!data.email?.trim()) {  
    errors.push('Email es requerido')  
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {  
    errors.push('Email no tiene un formato válido')  
  }  
    
  if (!data.phone?.trim()) {  
    errors.push('Teléfono es requerido')  
  } else if (!/^[\+]?[0-9\s\-\(\)]{8,15}$/.test(data.phone.replace(/\s/g, ''))) {  
    errors.push('Teléfono no tiene un formato válido')  
  }  
    
  if (!data.user_id?.trim()) {  
    errors.push('Usuario es requerido')  
  }  
    
  if (!data.taller_id?.trim()) {  
    errors.push('Taller es requerido')  
  }  
    
  if (data.client_type && !['Individual', 'Empresa'].includes(data.client_type)) {  
    errors.push('Tipo de cliente debe ser Individual o Empresa')  
  }  
    
  return errors  
}  
  
export const validateUpdateClientData = (data: UpdateClientData): string[] => {  
  const errors: string[] = []  
    
  if (data.name !== undefined && !data.name?.trim()) {  
    errors.push('Nombre no puede estar vacío')  
  }  
    
  if (data.email !== undefined && data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {  
    errors.push('Email no tiene un formato válido')  
  }  
    
  if (data.phone !== undefined && data.phone && !/^[\+]?[0-9\s\-\(\)]{8,15}$/.test(data.phone.replace(/\s/g, ''))) {  
    errors.push('Teléfono no tiene un formato válido')  
  }  
    
  if (data.client_type && !['Individual', 'Empresa'].includes(data.client_type)) {  
    errors.push('Tipo de cliente debe ser Individual o Empresa')  
  }  
    
  return errors  
}  
  
// ✅ Validadores para Vehicle  
export const validateVehicleData = (data: Partial<CreateVehicleData>): string[] => {  
  const errors: string[] = []  
    
  if (!data.client_id?.trim()) {  
    errors.push('Cliente es requerido')  
  }  
    
  if (!data.marca?.trim()) {  
    errors.push('Marca es requerida')  
  } else if (data.marca.trim().length < 2) {  
    errors.push('Marca debe tener al menos 2 caracteres')  
  }  
    
  if (!data.modelo?.trim()) {  
    errors.push('Modelo es requerido')  
  } else if (data.modelo.trim().length < 2) {  
    errors.push('Modelo debe tener al menos 2 caracteres')  
  }  
    
  if (!data.ano) {  
    errors.push('Año es requerido')  
  } else if (data.ano < 1900 || data.ano > new Date().getFullYear() + 1) {  
    errors.push(`Año debe estar entre 1900 y ${new Date().getFullYear() + 1}`)  
  }  
    
  if (!data.placa?.trim()) {  
    errors.push('Placa es requerida')  
  } else if (data.placa.trim().length < 3) {  
    errors.push('Placa debe tener al menos 3 caracteres')  
  }  
    
  if (data.vin && data.vin.length !== 17) {  
    errors.push('VIN debe tener exactamente 17 caracteres')  
  }  
    
  if (data.kilometraje !== undefined && data.kilometraje < 0) {  
    errors.push('Kilometraje no puede ser negativo')  
  }  
    
  return errors  
}  
  
export const validateUpdateVehicleData = (data: UpdateVehicleData): string[] => {  
  const errors: string[] = []  
    
  if (data.marca !== undefined && !data.marca?.trim()) {  
    errors.push('Marca no puede estar vacía')  
  }  
    
  if (data.modelo !== undefined && !data.modelo?.trim()) {  
    errors.push('Modelo no puede estar vacío')  
  }  
    
  if (data.ano !== undefined && (data.ano < 1900 || data.ano > new Date().getFullYear() + 1)) {  
    errors.push(`Año debe estar entre 1900 y ${new Date().getFullYear() + 1}`)  
  }  
    
  if (data.placa !== undefined && !data.placa?.trim()) {  
    errors.push('Placa no puede estar vacía')  
  }  
    
  if (data.vin !== undefined && data.vin && data.vin.length !== 17) {  
    errors.push('VIN debe tener exactamente 17 caracteres')  
  }  
    
  if (data.kilometraje !== undefined && data.kilometraje < 0) {  
    errors.push('Kilometraje no puede ser negativo')  
  }  
    
  return errors  
}  
  
// ✅ Validadores genéricos  
export const isValidEmail = (email: string): boolean => {  
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)  
}  
  
export const isValidPhone = (phone: string): boolean => {  
  return /^[\+]?[0-9\s\-\(\)]{8,15}$/.test(phone.replace(/\s/g, ''))  
}  
  
export const isValidYear = (year: number): boolean => {  
  return year >= 1900 && year <= new Date().getFullYear() + 1  
}  
  
export const isValidVIN = (vin: string): boolean => {  
  return vin.length === 17 && /^[A-HJ-NPR-Z0-9]{17}$/.test(vin.toUpperCase())  
}  
  
// ✅ Validador de datos de inventario (basado en schema real)  
export const validateInventoryItem = (data: any): boolean => {  
  return (  
    typeof data.producto === 'string' &&  
    data.producto.length > 0 &&  
    typeof data.precio_unitario === 'number' &&  
    data.precio_unitario >= 0 &&  
    typeof data.cantidad === 'number' &&  
    data.cantidad >= 0  
  )  
}