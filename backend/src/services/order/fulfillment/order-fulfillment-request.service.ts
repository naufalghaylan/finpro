import { OrderStatus, StockJournalType } from '../../../generated/prisma/client'
import prisma from '../../../lib/prisma'
import { assertAdminCanAccessStore } from '../../order-admin-access.service'
import { ORDER_ERRORS, OrderServiceError } from '../../order.errors'
import { adjustStockWithJournal, stockJournalSnapshotSelect } from '../../order-stock-journal.service'
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

type ValidatedFulfillmentRequest = RequestFulfillmentItem & {
  reserveQuantity: number
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
    const validatedRequests: ValidatedFulfillmentRequest[] = []

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

      validatedRequests.push({
        ...request,
        reserveQuantity: Math.max(0, request.quantity - selectedSource.reservedQuantity),
      })
    }

    const mutations = []
    for (const request of validatedRequests) {
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

      if (request.reserveQuantity > 0) {
        const sourceStock = await tx.stock.findUnique({
          where: {
            productId_storeId: {
              productId: request.productId,
              storeId: request.sourceStoreId,
            },
          },
          select: stockJournalSnapshotSelect,
        })

        if (!sourceStock) {
          throw new OrderServiceError(
            ORDER_ERRORS.STOCK_NOT_FOUND,
            'Stok toko sumber tidak ditemukan',
            404,
          )
        }

        await adjustStockWithJournal({
          db: tx,
          stock: sourceStock,
          orderId: order.id,
          stockMutationId: mutation.id,
          quantityChange: -request.reserveQuantity,
          type: StockJournalType.MUTATION_OUT,
          userId,
          description: `Reservasi fulfillment #${mutation.id}`,
          notes: request.notes || `Stok dialokasikan untuk fulfillment pesanan ${order.orderNumber}`,
          insufficientStockMessage: 'Stok toko sumber berubah saat permintaan fulfillment dibuat. Silakan coba kembali.',
        })
      }

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
