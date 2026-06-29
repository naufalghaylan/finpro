import { OrderStatus, PaymentMethod, StockJournalType } from '../../../generated/prisma/client'
import { midtransCore } from '../../../lib/midtrans'
import prisma from '../../../lib/prisma'
import { restoreReservedOrderStock } from '../../order-stock.service'
import type { MidtransNotificationResult, MidtransTransactionStatus } from '../core/order.types'
import {
  notifyOrderStatusChange,
  type OrderNotificationEvent,
} from '../order-notification.service'

type ProcessedMidtransNotification = {
  result: NonNullable<MidtransNotificationResult>
  event?: OrderNotificationEvent
} | null

export const processMidtransTransactionStatus = async (
  notification: MidtransTransactionStatus,
): Promise<MidtransNotificationResult> => {
  const orderNumber = notification.order_id
  const transactionStatus = notification.transaction_status
  const fraudStatus = notification.fraud_status
  const isSuccessfulPayment =
    transactionStatus === 'settlement' ||
    (transactionStatus === 'capture' && (!fraudStatus || fraudStatus === 'accept'))
  const isFailedPayment = ['cancel', 'deny', 'expire', 'failure'].includes(transactionStatus)

  if (!isSuccessfulPayment && !isFailedPayment && transactionStatus !== 'pending') {
    return null
  }

  const processed = await prisma.$transaction(async (tx): Promise<ProcessedMidtransNotification> => {
    const order = await tx.order.findUnique({
      where: { orderNumber },
      select: {
        id: true,
        userId: true,
        orderNumber: true,
        status: true,
        paymentMethod: true,
        stockJournals: {
          where: {
            type: StockJournalType.ORDER,
            quantityChange: { lt: 0 },
          },
          select: {
            stockId: true,
            quantityChange: true,
            type: true,
          },
        },
      },
    })

    if (!order || order.paymentMethod !== PaymentMethod.PAYMENT_GATEWAY) {
      return null
    }

    if (isSuccessfulPayment) {
      if (order.status !== OrderStatus.PENDING_PAYMENT) {
        return {
          result: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            transactionStatus,
            orderStatus: order.status,
          },
        }
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PROCESSING,
        },
      })

      return {
        result: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          transactionStatus,
          orderStatus: OrderStatus.PROCESSING,
        },
        event: 'PAYMENT_SUCCESS',
      }
    }

    if (isFailedPayment) {
      if (order.status !== OrderStatus.PENDING_PAYMENT) {
        return {
          result: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            transactionStatus,
            orderStatus: order.status,
          },
        }
      }

      const cancelReason = `Midtrans payment ${transactionStatus}`
      const updatedOrder = await tx.order.updateMany({
        where: {
          id: order.id,
          status: OrderStatus.PENDING_PAYMENT,
        },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelReason,
        },
      })

      if (updatedOrder.count !== 1) {
        return null
      }

      await restoreReservedOrderStock({
        db: tx,
        order,
        actorUserId: order.userId,
        notes: `${cancelReason}, reserved stock restored`,
      })

      return {
        result: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          transactionStatus,
          orderStatus: OrderStatus.CANCELLED,
        },
        event: 'ORDER_CANCELLED',
      }
    }

    return {
      result: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        transactionStatus,
        orderStatus: order.status,
      },
    }
  })

  if (processed?.event) {
    await notifyOrderStatusChange(processed.result.orderId, processed.event)
  }

  return processed?.result ?? null
}

export const handleMidtransNotification = async (payload: unknown): Promise<MidtransNotificationResult> => {
  const notification = await midtransCore.transaction.notification(payload)
  return processMidtransTransactionStatus(notification)
}
