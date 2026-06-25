import { FulfillmentRequirement, StockFulfillmentStatus } from './order-fulfillment-state.types'

export const statusForRequirement = ({
  requiredQuantity,
  completedQuantity,
  pendingQuantity,
  inTransitQuantity,
  hasRejectedMutation,
}: {
  requiredQuantity: number
  completedQuantity: number
  pendingQuantity: number
  inTransitQuantity: number
  hasRejectedMutation: boolean
}): StockFulfillmentStatus => {
  if (completedQuantity >= requiredQuantity) return 'COMPLETED'

  const uncoveredQuantity = requiredQuantity - completedQuantity - pendingQuantity - inTransitQuantity
  if (uncoveredQuantity > 0) return hasRejectedMutation ? 'REJECTED' : 'REQUIRED'
  if (pendingQuantity > 0) return 'PENDING'
  if (inTransitQuantity > 0) return 'IN_TRANSIT'

  return 'REQUIRED'
}

export const overallStatus = (requirements: FulfillmentRequirement[]): StockFulfillmentStatus => {
  if (requirements.length === 0) return 'NOT_REQUIRED'
  if (requirements.every((requirement) => requirement.status === 'COMPLETED')) return 'COMPLETED'
  if (requirements.some((requirement) => requirement.status === 'REJECTED')) return 'REJECTED'
  if (requirements.some((requirement) => requirement.status === 'REQUIRED')) return 'REQUIRED'
  if (requirements.some((requirement) => requirement.status === 'PENDING')) return 'PENDING'
  if (requirements.some((requirement) => requirement.status === 'IN_TRANSIT')) return 'IN_TRANSIT'

  return 'REQUIRED'
}
