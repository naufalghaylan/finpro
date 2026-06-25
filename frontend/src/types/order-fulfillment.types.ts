import type { MutationStatus, StockFulfillmentStatus, OrderStatus } from './order-status.types'
import type { OrderListMeta } from './order-list.types'

export type FulfillmentSourceRecommendation = {
  storeId: number
  storeName: string
  city: string
  distanceKm: number
  availableQuantity: number
  reservedQuantity: number
}

export type FulfillmentRequirement = {
  productId: number
  productName: string
  requiredQuantity: number
  completedQuantity: number
  activeQuantity: number
  remainingQuantity: number
  status: StockFulfillmentStatus
  sources: FulfillmentSourceRecommendation[]
}

export type OrderStockFulfillment = {
  status: StockFulfillmentStatus
  required: boolean
  canShip: boolean
  requirements: FulfillmentRequirement[]
}

export type OrderFulfillmentMutation = {
  id: number
  orderId: number | null
  sourceStoreId: number
  destinationStoreId: number
  productId: number
  quantity: number
  status: MutationStatus
  notes: string | null
  approvedAt: string | null
  rejectedAt: string | null
  sentAt: string | null
  receivedAt: string | null
  createdAt: string
  updatedAt: string
  sourceStore: {
    id: number
    name: string
  }
  destinationStore: {
    id: number
    name: string
  }
  product: {
    id: number
    name: string
    slug: string
  }
  order?: {
    id: number
    orderNumber: string
    status: OrderStatus
  } | null
}

export type FulfillmentDirection = 'all' | 'incoming' | 'outgoing'

export type StoreFulfillmentListQuery = {
  storeId: number
  page?: number
  limit?: number
  direction?: FulfillmentDirection
  status?: MutationStatus
  search?: string
}

export type StoreFulfillmentListResponse = {
  fulfillments: OrderFulfillmentMutation[]
  meta: OrderListMeta
}
