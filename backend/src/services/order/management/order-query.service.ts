import type { Prisma } from '../../../generated/prisma/client'
import prisma from '../../../lib/prisma'
import { adminOrderSelect, orderSelect } from '../core/order.select'
import type { ListAdminOrdersParams, ListOrdersParams } from '../core/order.types'
import { getOrdersStockFulfillment } from '../fulfillment/order-fulfillment-state.service'
import {
  applyOrderListFilters,
  buildAdminOrderWhere,
  buildOrderListMeta,
} from './order-query.helpers'

export const listOrders = async ({
  userId,
  page,
  limit,
  startDate,
  endDate,
  search,
  orderNumber,
  status,
  statusGroup,
}: ListOrdersParams) => {
  const skip = (page - 1) * limit
  const where: Prisma.OrderWhereInput = { userId }

  applyOrderListFilters(where, {
    startDate,
    endDate,
    search,
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

  return {
    data: orders,
    meta: buildOrderListMeta(page, limit, total),
  }
}

export const listAdminOrders = async ({
  actorRole,
  actorStoreId,
  page,
  limit,
  startDate,
  endDate,
  search,
  orderNumber,
  status,
  statusGroup,
  storeId,
}: ListAdminOrdersParams) => {
  const skip = (page - 1) * limit
  const where = buildAdminOrderWhere({ actorRole, actorStoreId, storeId })

  applyOrderListFilters(where, {
    startDate,
    endDate,
    search,
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
  const fulfillmentStates = await getOrdersStockFulfillment(orders.map((order) => order.id))

  return {
    data: orders.map((order) => ({
      ...order,
      stockFulfillment: fulfillmentStates.get(order.id),
    })),
    meta: buildOrderListMeta(page, limit, total),
  }
}