import { OrderStatus, PaymentMethod, StockJournalType } from '../../generated/prisma/client'
import prisma from '../../lib/prisma'
import { restoreReservedOrderStock } from '../order-stock.service'

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
          voucherId: true,
          stockJournals: {
            where: {
              type: {
                in: [
                  StockJournalType.ORDER,
                  StockJournalType.MUTATION_OUT,
                  StockJournalType.CANCEL_RETURN,
                ],
              },
            },
            select: {
              stockId: true,
              quantityChange: true,
              type: true,
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

      if (claimedOrder.voucherId) {
        await tx.voucher.update({
          where: { id: claimedOrder.voucherId },
          data: {
            used: false,
            usedAt: null,
          },
        })
      }

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
