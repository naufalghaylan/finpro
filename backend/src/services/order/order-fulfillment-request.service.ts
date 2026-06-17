import { OrderStatus, Prisma } from '../../generated/prisma/client'
import prisma from '../../lib/prisma'
import { assertAdminCanAccessStore } from '../order-admin-access.service'
import { ORDER_ERRORS, OrderServiceError } from '../order.errors'
import { fulfillmentMutationInclude } from './order-fulfillment.utils'

type RequestFulfillmentParams = {
  userId: number
  orderId: number
  sourceStoreId: number
  productId: number
  quantity: number
  notes?: string
}

export const requestOrderFulfillment = async ({
  userId,
  orderId,
  sourceStoreId,
  productId,
  quantity,
  notes,
}: RequestFulfillmentParams) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        storeId: true,
        status: true,
        orderNumber: true,
        items: {
          where: { productId },
          select: {
            productId: true,
            quantity: true,
          },
        },
      },
    })

    if (!order) {
      throw new OrderServiceError(ORDER_ERRORS.ORDER_NOT_FOUND, 'Order not found', 404)
    }

    if (
      order.status === OrderStatus.CANCELLED ||
      order.status === OrderStatus.SHIPPED ||
      order.status === OrderStatus.CONFIRMED
    ) {
      throw new OrderServiceError(
        ORDER_ERRORS.INVALID_FULFILLMENT_REQUEST,
        'Cannot request fulfillment for this order status',
        400,
      )
    }

    if (sourceStoreId === order.storeId) {
      throw new OrderServiceError(
        ORDER_ERRORS.INVALID_FULFILLMENT_REQUEST,
        'Source store must be different from destination store',
        400,
      )
    }

    if (order.items.length === 0) {
      throw new OrderServiceError(
        ORDER_ERRORS.INVALID_FULFILLMENT_REQUEST,
        'Product is not part of this order',
        400,
      )
    }

    await assertAdminCanAccessStore(userId, order.storeId, tx)

    const sourceStock = await tx.stock.findUnique({
      where: {
        productId_storeId: {
          productId,
          storeId: sourceStoreId,
        },
      },
      select: {
        quantity: true,
      },
    })

    if (!sourceStock || sourceStock.quantity < quantity) {
      throw new OrderServiceError(
        ORDER_ERRORS.INSUFFICIENT_STOCK,
        'Source store does not have enough stock for fulfillment',
        400,
      )
    }

    return tx.stockMutation.create({
      data: {
        orderId: order.id,
        sourceStoreId,
        destinationStoreId: order.storeId,
        productId,
        quantity,
        requestedBy: userId,
        notes: notes || `Fulfillment request for order ${order.orderNumber}`,
      },
      include: fulfillmentMutationInclude,
    })
  })
}
