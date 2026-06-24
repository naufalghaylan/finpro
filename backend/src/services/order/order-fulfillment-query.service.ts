import type { MutationStatus, Prisma } from '../../generated/prisma/client'
import prisma from '../../lib/prisma'
import { ORDER_ERRORS, OrderServiceError } from '../order.errors'

type ListFulfillmentsParams = {
  actorRole: string
  actorStoreId?: number | null
  storeId: number
  page: number
  limit: number
  direction: 'all' | 'incoming' | 'outgoing'
  status?: MutationStatus
  search?: string
}

const fulfillmentListSelect = {
  id: true,
  orderId: true,
  sourceStoreId: true,
  destinationStoreId: true,
  productId: true,
  quantity: true,
  status: true,
  notes: true,
  approvedAt: true,
  rejectedAt: true,
  sentAt: true,
  receivedAt: true,
  createdAt: true,
  updatedAt: true,
  sourceStore: { select: { id: true, name: true } },
  destinationStore: { select: { id: true, name: true } },
  product: { select: { id: true, name: true, slug: true } },
  order: { select: { id: true, orderNumber: true, status: true } },
} satisfies Prisma.StockMutationSelect

export const listStoreFulfillments = async ({
  actorRole,
  actorStoreId,
  storeId,
  page,
  limit,
  direction,
  status,
  search,
}: ListFulfillmentsParams) => {
  if (actorRole === 'STORE_ADMIN' && actorStoreId !== storeId) {
    throw new OrderServiceError(
      ORDER_ERRORS.FULFILLMENT_ACCESS_DENIED,
      'Anda hanya dapat mengakses mutasi stok untuk toko yang ditugaskan',
      403,
    )
  }

  if (actorRole !== 'SUPER_ADMIN' && actorRole !== 'STORE_ADMIN') {
    throw new OrderServiceError(
      ORDER_ERRORS.FULFILLMENT_ACCESS_DENIED,
      'Anda tidak memiliki akses ke mutasi stok toko',
      403,
    )
  }

  const storeScope: Prisma.StockMutationWhereInput = direction === 'incoming'
    ? { destinationStoreId: storeId }
    : direction === 'outgoing'
      ? { sourceStoreId: storeId }
      : { OR: [{ sourceStoreId: storeId }, { destinationStoreId: storeId }] }

  const where: Prisma.StockMutationWhereInput = {
    AND: [
      storeScope,
      ...(status ? [{ status }] : []),
      ...(search
        ? [{
            OR: [
              { product: { name: { contains: search, mode: 'insensitive' as const } } },
              { order: { orderNumber: { contains: search, mode: 'insensitive' as const } } },
              { sourceStore: { name: { contains: search, mode: 'insensitive' as const } } },
              { destinationStore: { name: { contains: search, mode: 'insensitive' as const } } },
            ],
          }]
        : []),
    ],
  }
  const skip = (page - 1) * limit

  const [fulfillments, total] = await Promise.all([
    prisma.stockMutation.findMany({
      where,
      select: fulfillmentListSelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.stockMutation.count({ where }),
  ])
  const totalPages = Math.ceil(total / limit)

  return {
    data: fulfillments,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  }
}
