import { MutationStatus, OrderStatus, StockJournalType } from '../../generated/prisma/client'
import prisma from '../../lib/prisma'
import { assertAdminCanAccessStore } from '../order-admin-access.service'
import { ORDER_ERRORS, OrderServiceError } from '../order.errors'
import { restoreReservedOrderStock } from '../order-stock.service'
import { adminOrderSelect, orderSelect } from './order.select'
import type { CancelOrderParams } from './order.types'

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
            id: true,
            stockId: true,
            quantityChange: true,
            type: true,
          },
        },
        stockMutations: {
          where: {
            status: { in: [MutationStatus.PENDING, MutationStatus.IN_TRANSIT, MutationStatus.COMPLETED] },
          },
          select: {
            id: true,
            status: true,
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

    if (order.stockMutations.some((mutation) => (
      mutation.status === MutationStatus.IN_TRANSIT || mutation.status === MutationStatus.COMPLETED
    ))) {
      throw new OrderServiceError(
        ORDER_ERRORS.ORDER_NOT_CANCELLABLE,
        'Pesanan tidak dapat dibatalkan setelah barang mutasi dikirim',
        400,
      )
    }

    await restoreReservedOrderStock({
      db: tx,
      order,
      actorUserId: userId,
      notes: reason || 'Order cancelled, reserved stock restored',
    })

    await tx.stockMutation.updateMany({
      where: {
        orderId: order.id,
        status: MutationStatus.PENDING,
      },
      data: {
        status: MutationStatus.REJECTED,
        rejectedBy: userId,
        rejectedAt: new Date(),
        notes: reason || 'Permintaan ditutup karena pesanan dibatalkan',
      },
    })

    if (order.voucherId) {
      await tx.voucher.update({
        where: { id: order.voucherId },
        data: {
          used: false,
          usedAt: null,
        },
      })
    }

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
