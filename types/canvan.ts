export interface KanbanOrderType {  
  id: string  
  numero_orden: string  
  descripcion: string  
  estado: string  
  prioridad: string  
  client_id: string  
  vehiculo_id: string  
  tecnico_id?: string  
  costo?: number  
  fecha_creacion: string  
  observacion?: string  
  client_info?: {  
    name: string  
  }  
  vehiculo_info?: {  
    marca: string  
    modelo: string  
    placa: string  
  }  
  tecnico_info?: {  
    nombre: string  
  }  
}  

export interface KanbanCardProps {  
  card: KanbanOrderType  
  onPress: () => void  
  onLongPress: () => void  
}  
  
export interface KanbanColumnProps {  
  column: {  
    id: string  
    title: string  
    color: string  
    description: string  
    cards: KanbanOrderType[]  
  }  
  onCardPress: (card: KanbanOrderType, column: any) => void  
  onCardLongPress: (card: KanbanOrderType, column: any) => void  
  onDrop: (cardId: string) => void  
  isDropArea: boolean  
  onAddCard: (column: any) => void  
}  
  
export interface KanbanScreenProps {  
  navigation: any  
}  
  
export interface TechnicianType {  
  id: string  
  nombre: string  
}  