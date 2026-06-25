import { Prisma } from '../../generated/prisma/client'

export type FulfillmentActionParams = {
  userId: number
  mutationId: number
  notes?: string
  approvedQuantity?: number
}

export type BatchFulfillmentActionParams = {
  userId: number
  mutationIds: number[]
  notes?: string
}

export type TransactionActionParams = FulfillmentActionParams & {
  db: Prisma.TransactionClient
}
