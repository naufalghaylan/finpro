import { OrderStatus, PaymentMethod } from '../../generated/prisma/client'
import prisma from '../../lib/prisma'
import { assertAdminCanAccessStore } from '../order-admin-access.service'
import { ORDER_ERRORS, OrderServiceError } from '../order.errors'
import { PAYMENT_DEADLINE_IN_MS } from './order.constants'
import { adminOrderSelect, orderSelect } from './order.select'
import type {
  ConfirmManualPaymentParams,
  OrderPaymentParams,
  UploadPaymentProofParams,
} from './order.types'

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
