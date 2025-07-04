// Enumera los estados posibles del flujo de trabajo
export enum WorkflowState {
  RECEPTION = "reception",
  DIAGNOSIS = "diagnosis",
  WAITING_PARTS = "waiting_parts",
  REPAIR = "repair",
  QUALITY_CHECK = "quality_check",
  COMPLETED = "completed",
}

// Define las transiciones permitidas entre estados
const WORKFLOW_TRANSITIONS = {
  [WorkflowState.RECEPTION]: [WorkflowState.DIAGNOSIS],
  [WorkflowState.DIAGNOSIS]: [WorkflowState.RECEPTION, WorkflowState.WAITING_PARTS, WorkflowState.REPAIR],
  [WorkflowState.WAITING_PARTS]: [WorkflowState.DIAGNOSIS, WorkflowState.REPAIR],
  [WorkflowState.REPAIR]: [WorkflowState.WAITING_PARTS, WorkflowState.QUALITY_CHECK],
  [WorkflowState.QUALITY_CHECK]: [WorkflowState.REPAIR, WorkflowState.COMPLETED],
  [WorkflowState.COMPLETED]: [WorkflowState.QUALITY_CHECK],
}

/**
 * Valida si una transición de estado es permitida
 * @param fromState Estado actual de la tarjeta
 * @param toState Estado al que se desea mover la tarjeta
 * @returns boolean indicando si la transición es válida
 */
export const validateStateTransition = (fromState: string, toState: string): boolean => {
  // Si los estados no están en el flujo de trabajo, rechazar
  if (
    !Object.values(WorkflowState).includes(fromState as WorkflowState) ||
    !Object.values(WorkflowState).includes(toState as WorkflowState)
  ) {
    return false
  }

  // Verificar si la transición está permitida
  const allowedTransitions = WORKFLOW_TRANSITIONS[fromState as WorkflowState]
  return allowedTransitions.includes(toState as WorkflowState)
}

/**
 * Verifica los requisitos para pasar a un determinado estado
 * @param toState Estado al que se desea mover la tarjeta
 * @param card Datos de la tarjeta
 * @returns Un objeto indicando si pasa la validación y un mensaje
 */
export const validateStateRequirements = (toState: string, card: any): { valid: boolean; message?: string } => {
  // Validaciones específicas por estado
  switch (toState) {
    case WorkflowState.DIAGNOSIS:
      // Para diagnóstico, debe tener un técnico asignado
      if (!card.assignedTo) {
        return { valid: false, message: "Se requiere asignar un técnico antes de mover a Diagnóstico" }
      }
      break

    case WorkflowState.REPAIR:
      // Para reparación, debe tener una descripción detallada
      if (!card.description || card.description.length < 10) {
        return { valid: false, message: "Se requiere una descripción detallada antes de mover a Reparación" }
      }
      break

    case WorkflowState.QUALITY_CHECK:
      // Para control de calidad, debe tener al menos un elemento en la checklist completado
      if (!card.checklist || !card.checklist.some((item: any) => item.completed)) {
        return { valid: false, message: "Se debe completar al menos una tarea antes de mover a Control de Calidad" }
      }
      break

    case WorkflowState.COMPLETED:
      // Para completar, todas las tareas deben estar hechas
      if (card.checklist && card.checklist.length > 0 && !card.checklist.every((item: any) => item.completed)) {
        return { valid: false, message: "Todas las tareas deben estar completadas antes de finalizar" }
      }
      break
  }

  // Si no hubo problemas, la validación pasa
  return { valid: true }
}

/**
 * Obtiene una descripción textual de cada estado
 * @param state Estado del flujo de trabajo
 * @returns Descripción del estado
 */
export const getStateDescription = (state: string): string => {
  switch (state) {
    case WorkflowState.RECEPTION:
      return "Vehículos recién ingresados pendientes de asignación"
    case WorkflowState.DIAGNOSIS:
      return "Vehículos en proceso de diagnóstico técnico"
    case WorkflowState.WAITING_PARTS:
      return "Vehículos en espera de repuestos para continuar"
    case WorkflowState.REPAIR:
      return "Vehículos en proceso de reparación activa"
    case WorkflowState.QUALITY_CHECK:
      return "Verificación final de las reparaciones realizadas"
    case WorkflowState.COMPLETED:
      return "Vehículos listos para entrega al cliente"
    default:
      return "Estado desconocido"
  }
}

