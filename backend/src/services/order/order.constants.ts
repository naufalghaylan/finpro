import { OrderStatus } from '../../generated/prisma/client'
import type { OrderStatusGroup } from './order.types'

export const PAYMENT_DEADLINE_IN_MS = 60 * 60 * 1000
export const SHIPPED_AUTO_CONFIRM_IN_MS = 2 * 24 * 60 * 60 * 1000

export const orderStatusGroups: Record<OrderStatusGroup, OrderStatus[]> = {
  ongoing: [
    OrderStatus.PENDING_PAYMENT,
    OrderStatus.WAITING_CONFIRMATION,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
  ],
  completed: [OrderStatus.CONFIRMED],
  cancelled: [OrderStatus.CANCELLED],
}
