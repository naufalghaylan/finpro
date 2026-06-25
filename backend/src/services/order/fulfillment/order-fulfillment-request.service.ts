import { OrderStatus } from '../../../generated/prisma/client'
import prisma from '../../../lib/prisma'
import { assertAdminCanAccessStore } from '../../order-admin-access.service'
import { ORDER_ERRORS, OrderServiceError } from '../../order.errors'
import { getOrderStockFulfillment } from '../fulfillment/order-fulfillment-state.service'
import { fulfillmentMutationInclude } from '../fulfillment/order-fulfillment.utils'

export type RequestFulfillmentItem = {
  sourceStoreId: number
  productId: number
  quantity: number
  notes?: string
}

type RequestFulfillmentParams = RequestFulfillmentItem & {
  userId: number
  orderId: number
}

type RequestFulfillmentsParams = {
  userId: number
  orderId: number
  requests: RequestFulfillmentItem[]
}

export const requestOrderFulfillments = async ({
  userId,
  orderId,
  requests,
}: RequestFulfillmentsParams) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        storeId: true,
        status: true,
        orderNumber: true,
        items: {
          select: {
            productId: true,
          },
        },
      },
    })

    if (!order) {
      throw new OrderServiceError(ORDER_ERRORS.ORDER_NOT_FOUND, 'Pesanan tidak ditemukan', 404)
    }

    if (order.status !== OrderStatus.PROCESSING) {
      throw new OrderServiceError(
        ORDER_ERRORS.INVALID_FULFILLMENT_REQUEST,
        'Mutasi stok hanya dapat dibuat untuk pesanan yang sedang diproses',
        400,
      )
    }

    await assertAdminCanAccessStore(userId, order.storeId, tx)

    const fulfillment = await getOrderStockFulfillment(order.id, tx)
    const orderProductIds = new Set(order.items.map((item) => item.productId))
    const requestedProductIds = new Set<number>()

    for (const request of requests) {
      if (requestedProductIds.has(request.productId)) {
        throw new OrderServiceError(
          ORDER_ERRORS.INVALID_FULFILLMENT_REQUEST,
          'Satu produk hanya boleh memiliki satu permintaan dalam proses batch',
          400,
        )
      }
      requestedProductIds.add(request.productId)

      if (request.sourceStoreId === order.storeId) {
        throw new OrderServiceError(
          ORDER_ERRORS.INVALID_FULFILLMENT_REQUEST,
          'Toko sumber harus berbeda dari toko tujuan',
          400,
        )
      }

      if (!orderProductIds.has(request.productId)) {
        throw new OrderServiceError(
          ORDER_ERRORS.INVALID_FULFILLMENT_REQUEST,
          'Produk tidak termasuk dalam pesanan ini',
          400,
        )
      }

      const requirement = fulfillment.requirements.find(
        (item) => item.productId === request.productId,
      )

      if (!requirement || requirement.remainingQuantity <= 0) {
        throw new OrderServiceError(
          ORDER_ERRORS.INVALID_FULFILLMENT_REQUEST,
          `${requirement?.productName ?? 'Produk'} tidak membutuhkan mutasi stok tambahan`,
          400,
        )
      }

      if (request.quantity > requirement.remainingQuantity) {
        throw new OrderServiceError(
          ORDER_ERRORS.INVALID_FULFILLMENT_REQUEST,
          `Jumlah mutasi ${requirement.productName} maksimal ${requirement.remainingQuantity} item`,
          400,
        )
      }

      const selectedSource = requirement.sources.find(
        (source) => source.storeId === request.sourceStoreId,
      )
      if (!selectedSource || selectedSource.availableQuantity < request.quantity) {
        throw new OrderServiceError(
          ORDER_ERRORS.INSUFFICIENT_STOCK,
          `Toko sumber untuk ${requirement.productName} tidak memiliki stok yang mencukupi`,
          400,
        )
      }
    }

    const mutations = []
    for (const request of requests) {
      const mutation = await tx.stockMutation.create({
        data: {
          orderId: order.id,
          sourceStoreId: request.sourceStoreId,
          destinationStoreId: order.storeId,
          productId: request.productId,
          quantity: request.quantity,
          requestedBy: userId,
          notes: request.notes || `Permintaan mutasi stok untuk pesanan ${order.orderNumber}`,
        },
        include: fulfillmentMutationInclude,
      })
      mutations.push(mutation)
    }

    return mutations
  })
}

export const requestOrderFulfillment = async ({
  userId,
  orderId,
  sourceStoreId,
  productId,
  quantity,
  notes,
}: RequestFulfillmentParams) => {
  const [mutation] = await requestOrderFulfillments({
    userId,
    orderId,
    requests: [{ sourceStoreId, productId, quantity, notes }],
  })

  return mutation
}
