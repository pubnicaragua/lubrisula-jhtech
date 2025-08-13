// types/api.ts - Tipos para respuestas de API y comunicación  
export interface ApiResponse<T> {  
    data: T  
    success: boolean  
    message?: string  
    error?: string  
    timestamp?: string  
  }  
    
  export interface PaginatedResponse<T> {  
    data: T[]  
    total: number  
    page: number  
    limit: number  
    hasMore: boolean  
    totalPages: number  
  }  
    
  export interface ErrorResponse {  
    error: string  
    code?: string  
    details?: Record<string, any>  
    timestamp: string  
  }  
    
  export interface SuccessResponse<T = any> {  
    data: T  
    message: string  
    timestamp: string  
  }  
    
  // Tipos para filtros genéricos  
  export interface BaseFilters {  
    page?: number  
    limit?: number  
    sortBy?: string  
    sortOrder?: 'asc' | 'desc'  
    searchTerm?: string  
  }  
    
  // Tipos para operaciones batch  
  export interface BatchOperation<T> {  
    operation: 'create' | 'update' | 'delete'  
    data: T  
    id?: string  
  }  
    
  export interface BatchResponse<T> {  
    successful: T[]  
    failed: Array<{  
      data: T  
      error: string  
    }>  
    totalProcessed: number  
  }