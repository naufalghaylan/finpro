import { OrderStatus } from '../../generated/prisma/client'
import prisma from '../../lib/prisma'
import { ORDER_ERRORS, OrderServiceError } from '../order.errors'
import { fulfillmentStateSelect } from './order-fulfillment-state.select'
import { DatabaseClient, OrderStockFulfillment } from './order-fulfillment-state.types'
import { overallStatus } from './order-fulfillment-status.service'
import { deriveRequirements } from './order-fulfillment-requirements.service'

export const getOrderStockFulfillment = async (
  orderId: number,
  db: DatabaseClient = prisma,
): Promise<OrderStockFulfillment> => {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: fulfillmentStateSelect,
  })

  if (!order) {
    throw new OrderServiceError(ORDER_ERRORS.ORDER_NOT_FOUND, 'Pesanan tidak ditemukan', 404)
  }

  if (order.status === OrderStatus.CANCELLED) {
    return {
      status: 'NOT_REQUIRED',
      required: false,
      canShip: false,
      requirements: [],
    }
  }

  const requirements = await deriveRequirements(order, db)
  const status = overallStatus(requirements)

  return {
    status,
    required: requirements.length > 0,
    canShip: status === 'NOT_REQUIRED' || status === 'COMPLETED',
    requirements,
  }
}

export const getOrdersStockFulfillment = async (
  orderIds: number[],
): Promise<Map<number, OrderStockFulfillment>> => {
  const entries = await Promise.all(orderIds.map(async (orderId) => (
    [orderId, await getOrderStockFulfillment(orderId)] as const
  )))

  return new Map(entries)
}

export { getReservedQuantityForSource } from './order-fulfillment-reserved.service'
