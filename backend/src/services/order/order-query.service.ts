import type { Prisma } from '../../generated/prisma/client'
import prisma from '../../lib/prisma'
import { ORDER_ERRORS, OrderServiceError } from '../order.errors'
import { orderStatusGroups } from './order.constants'
import { adminOrderSelect, orderSelect } from './order.select'
import type { ListAdminOrdersParams, ListOrdersParams } from './order.types'

const getStartOfDate = (date: string) => new Date(`${date}T00:00:00.000`)

const getEndOfDate = (date: string) => new Date(`${date}T23:59:59.999`)

const applyOrderListFilters = (
  where: Prisma.OrderWhereInput,
  {
    startDate,
    endDate,
    orderNumber,
    status,
    statusGroup,
  }: Pick<ListOrdersParams, 'startDate' | 'endDate' | 'orderNumber' | 'status' | 'statusGroup'>,
) => {
  if (orderNumber) {
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

export const listOrders = async ({
  userId,
  page,
  limit,
  startDate,
  endDate,
  orderNumber,
  status,
  statusGroup,
}: ListOrdersParams) => {
  const skip = (page - 1) * limit
  const where: Prisma.OrderWhereInput = { userId }

  applyOrderListFilters(where, {
    startDate,
    endDate,
    orderNumber,
    status,
    statusGroup,
  })

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      select: orderSelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ])
  const totalPages = Math.ceil(total / limit)

  return {
    data: orders,
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

export const listAdminOrders = async ({
  actorRole,
  actorStoreId,
  page,
  limit,
  startDate,
  endDate,
  orderNumber,
  status,
  statusGroup,
  storeId,
}: ListAdminOrdersParams) => {
  const skip = (page - 1) * limit
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
  } else if (actorRole === 'SUPER_ADMIN') {
    if (storeId) {
      where.storeId = storeId
    }
  } else {
    throw new OrderServiceError(
      ORDER_ERRORS.FULFILLMENT_ACCESS_DENIED,
      'You do not have access to admin orders',
      403,
    )
  }

  applyOrderListFilters(where, {
    startDate,
    endDate,
    orderNumber,
    status,
    statusGroup,
  })

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      select: adminOrderSelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ])
  const totalPages = Math.ceil(total / limit)

  return {
    data: orders,
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
