import { OrderStatus } from '../../generated/prisma/client'
import prisma from '../../lib/prisma'
import { assertAdminCanAccessStore } from '../order-admin-access.service'
import { ORDER_ERRORS, OrderServiceError } from '../order.errors'
import { SHIPPED_AUTO_CONFIRM_IN_MS } from './order.constants'
import { adminOrderSelect, orderSelect } from './order.select'
import { getOrderStockFulfillment } from './order-fulfillment-state.service'
import type { OrderPaymentParams } from './order.types'

export const shipOrder = async ({ userId, orderId }: OrderPaymentParams) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        storeId: true,
        status: true,
      },
    })

    if (!order) {
      throw new OrderServiceError(ORDER_ERRORS.ORDER_NOT_FOUND, 'Order not found', 404)
    }

    await assertAdminCanAccessStore(userId, order.storeId, tx)

    if (order.status !== OrderStatus.PROCESSING) {
      throw new OrderServiceError(
        ORDER_ERRORS.ORDER_NOT_SHIPPABLE,
        'Only processing orders can be sent',
        400,
      )
    }

    const stockFulfillment = await getOrderStockFulfillment(order.id, tx)
    if (!stockFulfillment.canShip) {
      throw new OrderServiceError(
        ORDER_ERRORS.ORDER_NOT_SHIPPABLE,
        'Selesaikan seluruh kebutuhan mutasi stok sebelum mengirim pesanan',
        400,
      )
    }

    return tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.SHIPPED,
        shippedAt: new Date(),
      },
      select: adminOrderSelect,
    })
  })
}

export const confirmOrderReceived = async ({ userId, orderId }: OrderPaymentParams) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    select: {
      id: true,
      status: true,
    },
  })

  if (!order) {
    throw new OrderServiceError(ORDER_ERRORS.ORDER_NOT_FOUND, 'Order not found', 404)
  }

  if (order.status !== OrderStatus.SHIPPED) {
    throw new OrderServiceError(
      ORDER_ERRORS.ORDER_NOT_CONFIRMABLE,
      'Only shipped orders can be confirmed',
      400,
    )
  }

  return prisma.order.update({
    where: { id: order.id },
    data: {
      status: OrderStatus.CONFIRMED,
      confirmedAt: new Date(),
    },
    select: orderSelect,
  })
}

export const autoConfirmShippedOrders = async () => {
  const now = new Date()
  const autoConfirmBefore = new Date(now.getTime() - SHIPPED_AUTO_CONFIRM_IN_MS)

  const result = await prisma.order.updateMany({
    where: {
      status: OrderStatus.SHIPPED,
      shippedAt: {
        lte: autoConfirmBefore,
      },
    },
    data: {
      status: OrderStatus.CONFIRMED,
      confirmedAt: now,
    },
  })

  return {
    confirmedCount: result.count,
  }
}
