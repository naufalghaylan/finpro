import type { CheckoutOrder } from './checkout.types'
import type { OrderListQuery, OrderListMeta } from './order-list.types'
import type { OrderFulfillmentMutation, OrderStockFulfillment } from './order-fulfillment.types'

export type AdminOrderListQuery = OrderListQuery & {
  storeId?: number
}

export type AdminOrder = CheckoutOrder & {
  shippingMethod: string | null
  shippingService: string | null
  user: {
    id: number
    name: string
    email: string
    phone: string | null
  }
  stockMutations: OrderFulfillmentMutation[]
  stockFulfillment: OrderStockFulfillment
}

export type AdminOrderListResponse = {
  orders: AdminOrder[]
  meta: OrderListMeta
}
