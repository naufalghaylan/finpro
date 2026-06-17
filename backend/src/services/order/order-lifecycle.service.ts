import { MutationStatus, OrderStatus, PaymentMethod, StockJournalType } from '../../generated/prisma/client'
import prisma from '../../lib/prisma'
import { assertAdminCanAccessStore } from '../order-admin-access.service'
import { ORDER_ERRORS, OrderServiceError } from '../order.errors'
import { restoreReservedOrderStock } from '../order-stock.service'
import { SHIPPED_AUTO_CONFIRM_IN_MS } from './order.constants'
import { adminOrderSelect, orderSelect } from './order.select'
import type { CancelOrderParams, OrderPaymentParams } from './order.types'

export const cancelOrder = async ({
  userId,
  orderId,
  reason,
  isAdmin = false,
}: CancelOrderParams) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        storeId: true,
        status: true,
        orderNumber: true,
        paymentProof: true,
        stockJournals: {
          where: {
            type: StockJournalType.ORDER,
            quantityChange: { lt: 0 },
          },
          select: {
            id: true,
            stockId: true,
            quantityChange: true,
          },
        },
      },
    })

    if (!order || (!isAdmin && order.userId !== userId)) {
      throw new OrderServiceError(ORDER_ERRORS.ORDER_NOT_FOUND, 'Order not found', 404)
    }

    if (isAdmin) {
      await assertAdminCanAccessStore(userId, order.storeId, tx)
    }

    if (
      order.status === OrderStatus.CANCELLED ||
      order.status === OrderStatus.SHIPPED ||
      order.status === OrderStatus.CONFIRMED
    ) {
      throw new OrderServiceError(
        ORDER_ERRORS.ORDER_NOT_CANCELLABLE,
        'Pesanan sudah tidak bisa dibatalkan',
        400,
      )
    }

    if (!isAdmin && order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new OrderServiceError(
        ORDER_ERRORS.ORDER_NOT_CANCELLABLE,
        'Pesanan hanya bisa dibatalkan sebelum pembayaran diproses',
        400,
      )
    }

    if (!isAdmin && order.paymentProof) {
      throw new OrderServiceError(
        ORDER_ERRORS.ORDER_NOT_CANCELLABLE,
        'Pesanan hanya bisa dibatalkan sebelum bukti bayar diupload',
        400,
      )
    }

    await restoreReservedOrderStock({
      db: tx,
      order,
      actorUserId: userId,
      notes: reason || 'Order cancelled, reserved stock restored',
    })

    return tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelReason: reason || (isAdmin ? 'Pesanan dibatalkan oleh admin' : 'Pesanan dibatalkan oleh pelanggan'),
      },
      select: isAdmin ? adminOrderSelect : orderSelect,
    })
  })
}

export const shipOrder = async ({ userId, orderId }: OrderPaymentParams) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        storeId: true,
        status: true,
        stockMutations: {
          where: {
            status: {
              in: [MutationStatus.PENDING, MutationStatus.IN_TRANSIT],
            },
          },
          select: {
            id: true,
            status: true,
          },
        },
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

    if (order.stockMutations.length > 0) {
      throw new OrderServiceError(
        ORDER_ERRORS.ORDER_NOT_SHIPPABLE,
        'Complete pending fulfillment requests before sending this order',
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

export const autoCancelExpiredManualTransferOrders = async () => {
  const now = new Date()
  const expiredOrders = await prisma.order.findMany({
    where: {
      status: OrderStatus.PENDING_PAYMENT,
      paymentMethod: PaymentMethod.MANUAL_TRANSFER,
      paymentDeadline: {
        lte: now,
      },
    },
    select: {
      id: true,
    },
  })

  let cancelledCount = 0

  for (const expiredOrder of expiredOrders) {
    const cancelledOrder = await prisma.$transaction(async (tx) => {
      const claimedOrder = await tx.order.findFirst({
        where: {
          id: expiredOrder.id,
          status: OrderStatus.PENDING_PAYMENT,
          paymentMethod: PaymentMethod.MANUAL_TRANSFER,
          paymentDeadline: {
            lte: now,
          },
        },
        select: {
          id: true,
          userId: true,
          orderNumber: true,
          stockJournals: {
            where: {
              type: StockJournalType.ORDER,
              quantityChange: { lt: 0 },
            },
            select: {
              stockId: true,
              quantityChange: true,
            },
          },
        },
      })

      if (!claimedOrder) return null

      const cancelReason = 'Auto-cancelled because manual payment proof was not uploaded before deadline'
      const updatedOrder = await tx.order.updateMany({
        where: {
          id: claimedOrder.id,
          status: OrderStatus.PENDING_PAYMENT,
          paymentMethod: PaymentMethod.MANUAL_TRANSFER,
          paymentDeadline: {
            lte: now,
          },
        },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: now,
          cancelReason,
        },
      })

      if (updatedOrder.count !== 1) return null

      await restoreReservedOrderStock({
        db: tx,
        order: claimedOrder,
        actorUserId: claimedOrder.userId,
        notes: cancelReason,
      })

      return claimedOrder
    })

    if (cancelledOrder) {
      cancelledCount += 1
    }
  }

  return {
    checkedCount: expiredOrders.length,
    cancelledCount,
  }
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
