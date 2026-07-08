import { OrderStatus } from '../../../generated/prisma/client'
import prisma from '../../../lib/prisma'
import { assertAdminCanAccessStore } from '../../order-admin-access.service'
import { ORDER_ERRORS, OrderServiceError } from '../../order.errors'
import { SHIPPED_AUTO_CONFIRM_IN_MS } from '../core/order.constants'
import { adminOrderSelect, orderSelect } from '../core/order.select'
import { getOrderStockFulfillment } from '../fulfillment/order-fulfillment-state.service'
import type { OrderPaymentParams } from '../core/order.types'
import { notifyOrderStatusChange } from '../order-notification.service'

export const shipOrder = async ({ userId, orderId }: OrderPaymentParams) => {
  const shippedOrder = await prisma.$transaction(async (tx) => {
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

  await notifyOrderStatusChange(shippedOrder.id, 'ORDER_SHIPPED')

  return shippedOrder
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

  const confirmedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: OrderStatus.CONFIRMED,
      confirmedAt: new Date(),
    },
    select: orderSelect,
  })

  await notifyOrderStatusChange(confirmedOrder.id, 'ORDER_CONFIRMED')

  return confirmedOrder
}

export const autoConfirmShippedOrders = async () => {
  const now = new Date()
  const autoConfirmBefore = new Date(now.getTime() - SHIPPED_AUTO_CONFIRM_IN_MS)

  const shippedOrders = await prisma.order.findMany({
    where: {
      status: OrderStatus.SHIPPED,
      shippedAt: {
        lte: autoConfirmBefore,
      },
    },
    select: { id: true },
  })

  let confirmedCount = 0

  for (const order of shippedOrders) {
    const result = await prisma.order.updateMany({
      where: {
        id: order.id,
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

    if (result.count === 1) {
      confirmedCount += 1
      await notifyOrderStatusChange(order.id, 'ORDER_CONFIRMED')
    }
  }

  return {
    confirmedCount,
  }
}
