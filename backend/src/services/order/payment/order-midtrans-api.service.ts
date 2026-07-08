import { OrderStatus, PaymentMethod } from '../../../generated/prisma/client'
import { midtransSnap } from '../../../lib/midtrans'
import prisma from '../../../lib/prisma'
import { ORDER_ERRORS, OrderServiceError } from '../../order.errors'
import type { OrderPaymentParams } from '../core/order.types'
import { getOrderPaymentDetails } from './order-manual-payment.service'
import {
  getMidtransErrorDetails,
  getMidtransErrorMessage,
  getMidtransFinishUrl,
  getMidtransTransactionStatusOrNull,
} from './order-midtrans.helpers'
import { processMidtransTransactionStatus } from './order-midtrans-webhook.service'

export const createMidtransSnapToken = async ({ userId, orderId }: OrderPaymentParams) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
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
        select: { name: true, email: true, phone: true },
      },
      items: {
        select: {
          id: true,
          quantity: true,
          priceAtTime: true,
          subtotal: true,
          product: { select: { id: true, name: true } },
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
        data: { paymentGatewayId: null },
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
        ...(order.discountAmount > 0
          ? [{ id: 'DISCOUNT', name: 'Discount', price: -Math.round(order.discountAmount), quantity: 1 }]
          : []),
      ],
      callbacks: { finish: midtransReturnUrl },
      expiry: { unit: 'minute', duration: 60 },
    })

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentGatewayId: snapTransaction.token },
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

export const syncMidtransPaymentStatus = async ({ userId, orderId }: OrderPaymentParams) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    select: { id: true, orderNumber: true, paymentMethod: true },
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