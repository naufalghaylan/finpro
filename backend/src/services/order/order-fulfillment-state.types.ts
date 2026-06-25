import { Prisma } from '../../generated/prisma/client'

export type DatabaseClient = Prisma.TransactionClient

export type StockFulfillmentStatus =
  | 'NOT_REQUIRED'
  | 'REQUIRED'
  | 'PENDING'
  | 'IN_TRANSIT'
  | 'COMPLETED'
  | 'REJECTED'

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
