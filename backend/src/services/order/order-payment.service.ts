import { OrderStatus, PaymentMethod, StockJournalType } from '../../generated/prisma/client'
import { midtransCore, midtransSnap } from '../../lib/midtrans'
import prisma from '../../lib/prisma'
import { assertAdminCanAccessStore } from '../order-admin-access.service'
import { ORDER_ERRORS, OrderServiceError } from '../order.errors'
import { restoreReservedOrderStock } from '../order-stock.service'
import { PAYMENT_DEADLINE_IN_MS } from './order.constants'
import { adminOrderSelect, orderSelect } from './order.select'
import type {
  ConfirmManualPaymentParams,
  MidtransNotificationResult,
  MidtransTransactionStatus,
  OrderPaymentParams,
  UploadPaymentProofParams,
} from './order.types'

const getFrontendUrl = () =>
  (process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173').replace(/\/$/, '')

const getMidtransFinishUrl = (orderId: number) => `${getFrontendUrl()}/orders/${orderId}`

type MidtransApiError = {
  httpStatusCode?: string | number
  message?: string
  ApiResponse?: {
    status_code?: string | number
    status_message?: string | string[]
    validation_messages?: unknown
  }
}

const getMidtransErrorMessage = (error: unknown) => {
  const apiError = error as MidtransApiError
  const statusMessage = apiError.ApiResponse?.status_message

  if (Array.isArray(statusMessage)) return statusMessage.join(', ')
  if (statusMessage) return statusMessage
  if (apiError.message) return apiError.message

  return null
}

const getMidtransErrorDetails = (error: unknown) => {
  const apiError = error as MidtransApiError

  return {
    httpStatusCode: apiError.httpStatusCode,
    statusCode: apiError.ApiResponse?.status_code,
    statusMessage: apiError.ApiResponse?.status_message,
    validationMessages: apiError.ApiResponse?.validation_messages,
  }
}

const isMidtransTransactionNotFoundError = (error: unknown) => {
  const apiError = error as MidtransApiError
  const httpStatusCode = String(apiError.httpStatusCode ?? '')
  const statusCode = String(apiError.ApiResponse?.status_code ?? '')

  return httpStatusCode === '404' || statusCode === '404'
}

const getMidtransTransactionStatusOrNull = async (orderNumber: string) => {
  try {
    return await midtransCore.transaction.status(orderNumber)
  } catch (error) {
    if (isMidtransTransactionNotFoundError(error)) return null

    throw error
  }
}

export const getOrderPaymentDetails = async ({ userId, orderId }: OrderPaymentParams) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    select: orderSelect,
  })

  if (!order) {
    throw new OrderServiceError(ORDER_ERRORS.ORDER_NOT_FOUND, 'Order not found', 404)
  }

  return order
}

export const uploadManualPaymentProof = async ({
  userId,
  orderId,
  paymentProofUrl,
}: UploadPaymentProofParams) => {
  if (!paymentProofUrl) {
    throw new OrderServiceError(
      ORDER_ERRORS.PAYMENT_PROOF_REQUIRED,
      'Payment proof file is required',
      400,
    )
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        status: true,
        paymentMethod: true,
        paymentDeadline: true,
        paymentProof: true,
      },
    })

    if (!order || order.userId !== userId) {
      throw new OrderServiceError(ORDER_ERRORS.ORDER_NOT_FOUND, 'Order not found', 404)
    }

    if (order.paymentMethod !== PaymentMethod.MANUAL_TRANSFER) {
      throw new OrderServiceError(
        ORDER_ERRORS.PAYMENT_PROOF_NOT_ALLOWED,
        'Payment proof upload is only available for manual transfer orders',
        400,
      )
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new OrderServiceError(
        ORDER_ERRORS.PAYMENT_PROOF_NOT_ALLOWED,
        order.paymentProof
          ? 'Payment proof has already been uploaded'
          : 'Payment proof cannot be uploaded for this order status',
        400,
      )
    }

    if (order.paymentDeadline && new Date() > order.paymentDeadline) {
      throw new OrderServiceError(
        ORDER_ERRORS.PAYMENT_DEADLINE_EXPIRED,
        'Payment proof upload deadline has expired',
        400,
      )
    }

    return tx.order.update({
      where: { id: order.id },
      data: {
        paymentProof: paymentProofUrl,
        status: OrderStatus.WAITING_CONFIRMATION,
      },
      select: orderSelect,
    })
  })
}

export const confirmManualPayment = async ({
  userId,
  orderId,
  action,
}: ConfirmManualPaymentParams) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        storeId: true,
        status: true,
        paymentMethod: true,
        paymentProof: true,
      },
    })

    if (!order) {
      throw new OrderServiceError(ORDER_ERRORS.ORDER_NOT_FOUND, 'Order not found', 404)
    }

    await assertAdminCanAccessStore(userId, order.storeId, tx)

    if (order.paymentMethod !== PaymentMethod.MANUAL_TRANSFER) {
      throw new OrderServiceError(
        ORDER_ERRORS.PAYMENT_CONFIRMATION_NOT_ALLOWED,
        'Manual payment confirmation is only available for manual transfer orders',
        400,
      )
    }

    if (order.status !== OrderStatus.WAITING_CONFIRMATION || !order.paymentProof) {
      throw new OrderServiceError(
        ORDER_ERRORS.PAYMENT_CONFIRMATION_NOT_ALLOWED,
        'Order is not waiting for manual payment confirmation',
        400,
      )
    }

    return tx.order.update({
      where: { id: order.id },
      data: action === 'approve'
        ? {
          status: OrderStatus.PROCESSING,
          paymentDeadline: null,
        }
        : {
          status: OrderStatus.PENDING_PAYMENT,
          paymentProof: null,
          paymentDeadline: new Date(Date.now() + PAYMENT_DEADLINE_IN_MS),
        },
      select: adminOrderSelect,
    })
  })
}

export const createMidtransSnapToken = async ({ userId, orderId }: OrderPaymentParams) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalAmount: true,
      shippingCost: true,
      discountAmount: true,
      paymentMethod: true,
      paymentGatewayId: true,
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
      items: {
        select: {
          id: true,
          quantity: true,
          priceAtTime: true,
          subtotal: true,
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })

  if (!order) {
    throw new OrderServiceError(ORDER_ERRORS.ORDER_NOT_FOUND, 'Order not found', 404)
  }

  if (order.paymentMethod !== PaymentMethod.PAYMENT_GATEWAY) {
    throw new OrderServiceError(
      ORDER_ERRORS.PAYMENT_GATEWAY_NOT_ALLOWED,
      'Midtrans payment is only available for payment gateway orders',
      400,
    )
  }

  if (order.status !== OrderStatus.PENDING_PAYMENT) {
    throw new OrderServiceError(
      ORDER_ERRORS.PAYMENT_GATEWAY_NOT_ALLOWED,
      'Payment gateway token cannot be created for this order status',
      400,
    )
  }

  if (order.paymentGatewayId) {
    const existingTransactionStatus = await getMidtransTransactionStatusOrNull(order.orderNumber)

    if (!existingTransactionStatus) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentGatewayId: null,
        },
      })
    } else {
      await processMidtransTransactionStatus(existingTransactionStatus)

      if (existingTransactionStatus.transaction_status !== 'pending') {
        throw new OrderServiceError(
          ORDER_ERRORS.PAYMENT_GATEWAY_NOT_ALLOWED,
          'Payment gateway transaction is no longer pending. Please refresh order status.',
          409,
        )
      }

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        snapToken: order.paymentGatewayId,
        redirectUrl: null,
      }
    }
  }

  try {
    const midtransReturnUrl = getMidtransFinishUrl(order.id)
    const snapTransaction = await midtransSnap.createTransaction({
      transaction_details: {
        order_id: order.orderNumber,
        gross_amount: Math.round(order.totalAmount),
      },
      customer_details: {
        first_name: order.user.name,
        email: order.user.email,
        phone: order.user.phone || undefined,
      },
      item_details: [
        ...order.items.map((item) => ({
          id: String(item.product.id),
          name: item.product.name.slice(0, 50),
          price: Math.round(item.priceAtTime),
          quantity: item.quantity,
        })),
        {
          id: 'SHIPPING',
          name: 'Shipping Cost',
          price: Math.round(order.shippingCost),
          quantity: 1,
        },
        ...(order.discountAmount > 0 ? [{
          id: 'DISCOUNT',
          name: 'Discount',
          price: -Math.round(order.discountAmount),
          quantity: 1,
        }] : []),
      ],
      callbacks: {
        finish: midtransReturnUrl,
      },
      expiry: {
        unit: 'minute',
        duration: 60,
      },
    })

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentGatewayId: snapTransaction.token,
      },
    })

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      snapToken: snapTransaction.token,
      redirectUrl: snapTransaction.redirect_url,
    }
  } catch (error) {
    const midtransErrorMessage = getMidtransErrorMessage(error)

    throw new OrderServiceError(
      ORDER_ERRORS.PAYMENT_GATEWAY_TOKEN_FAILED,
      midtransErrorMessage
        ? `Failed to create Midtrans payment token: ${midtransErrorMessage}`
        : 'Failed to create Midtrans payment token',
      502,
      getMidtransErrorDetails(error),
    )
  }
}

const processMidtransTransactionStatus = async (
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

  return prisma.$transaction(async (tx) => {
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
          orderId: order.id,
          orderNumber: order.orderNumber,
          transactionStatus,
          orderStatus: order.status,
        }
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PROCESSING,
        },
      })

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        transactionStatus,
        orderStatus: OrderStatus.PROCESSING,
      }
    }

    if (isFailedPayment) {
      if (order.status !== OrderStatus.PENDING_PAYMENT) {
        return {
          orderId: order.id,
          orderNumber: order.orderNumber,
          transactionStatus,
          orderStatus: order.status,
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
        orderId: order.id,
        orderNumber: order.orderNumber,
        transactionStatus,
        orderStatus: OrderStatus.CANCELLED,
      }
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      transactionStatus,
      orderStatus: order.status,
    }
  })
}

export const handleMidtransNotification = async (payload: unknown): Promise<MidtransNotificationResult> => {
  const notification = await midtransCore.transaction.notification(payload)

  return processMidtransTransactionStatus(notification)
}

export const syncMidtransPaymentStatus = async ({ userId, orderId }: OrderPaymentParams) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    select: {
      id: true,
      orderNumber: true,
      paymentMethod: true,
    },
  })

  if (!order) {
    throw new OrderServiceError(ORDER_ERRORS.ORDER_NOT_FOUND, 'Order not found', 404)
  }

  if (order.paymentMethod !== PaymentMethod.PAYMENT_GATEWAY) {
    throw new OrderServiceError(
      ORDER_ERRORS.PAYMENT_GATEWAY_NOT_ALLOWED,
      'Midtrans status sync is only available for payment gateway orders',
      400,
    )
  }

  try {
    const transactionStatus = await getMidtransTransactionStatusOrNull(order.orderNumber)

    if (!transactionStatus) {
      return getOrderPaymentDetails({ userId, orderId })
    }

    await processMidtransTransactionStatus(transactionStatus)

    return getOrderPaymentDetails({ userId, orderId })
  } catch (error) {
    const midtransErrorMessage = getMidtransErrorMessage(error)

    throw new OrderServiceError(
      ORDER_ERRORS.PAYMENT_GATEWAY_STATUS_SYNC_FAILED,
      midtransErrorMessage
        ? `Failed to sync Midtrans payment status: ${midtransErrorMessage}`
        : 'Failed to sync Midtrans payment status',
      502,
      getMidtransErrorDetails(error),
    )
  }
}
