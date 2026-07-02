import type { Prisma } from '../../../generated/prisma/client'
import { ORDER_ERRORS, OrderServiceError } from '../../order.errors'
import { orderStatusGroups } from '../core/order.constants'
import type { ListAdminOrdersParams, ListOrdersParams } from '../core/order.types'

const getStartOfDate = (date: string) => new Date(`${date}T00:00:00.000`)

const getEndOfDate = (date: string) => new Date(`${date}T23:59:59.999`)

type OrderListFilters = Pick<
  ListOrdersParams,
  'startDate' | 'endDate' | 'search' | 'orderNumber' | 'status' | 'statusGroup'
>

export const applyOrderListFilters = (where: Prisma.OrderWhereInput, filters: OrderListFilters) => {
  const { startDate, endDate, search, orderNumber, status, statusGroup } = filters

  if (search) {
    where.OR = [
      {
        orderNumber: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        items: {
          some: {
            product: {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
      },
      {
        store: {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
      },
    ]
  } else if (orderNumber) {
    where.orderNumber = {
      contains: orderNumber,
      mode: 'insensitive',
    }
  }

  if (status) {
    where.status = status
  } else if (statusGroup) {
    where.status = {
      in: orderStatusGroups[statusGroup],
    }
  }

  if (startDate || endDate) {
    const createdAt: Prisma.DateTimeFilter = {}

    if (startDate) {
      createdAt.gte = getStartOfDate(startDate)
    }

    if (endDate) {
      createdAt.lte = getEndOfDate(endDate)
    }

    where.createdAt = createdAt
  }

  return where
}

type AdminOrderScopeParams = Pick<ListAdminOrdersParams, 'actorRole' | 'actorStoreId' | 'storeId'>

export const buildAdminOrderWhere = ({
  actorRole,
  actorStoreId,
  storeId,
}: AdminOrderScopeParams): Prisma.OrderWhereInput => {
  const where: Prisma.OrderWhereInput = {}

  if (actorRole === 'STORE_ADMIN') {
    if (!actorStoreId) {
      throw new OrderServiceError(
        ORDER_ERRORS.FULFILLMENT_ACCESS_DENIED,
        'Store admin is not assigned to a store',
        403,
      )
    }

    where.storeId = actorStoreId
    return where
  }

  if (actorRole === 'SUPER_ADMIN') {
    if (storeId) {
      where.storeId = storeId
    }

    return where
  }

  throw new OrderServiceError(
    ORDER_ERRORS.FULFILLMENT_ACCESS_DENIED,
    'You do not have access to admin orders',
    403,
  )
}

export const buildOrderListMeta = (page: number, limit: number, total: number) => {
  const totalPages = Math.ceil(total / limit)

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }
}