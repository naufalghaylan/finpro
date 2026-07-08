import type { OrderStatus, OrderStatusGroup } from './order-status.types'
import type { CheckoutOrder } from './checkout.types'

export type OrderListQuery = {
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
  search?: string
  orderNumber?: string
  status?: OrderStatus
  statusGroup?: OrderStatusGroup
}

export type OrderListMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type OrderListResponse = {
  orders: CheckoutOrder[]
  meta: OrderListMeta
}
