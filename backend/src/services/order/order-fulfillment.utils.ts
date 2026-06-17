import { MutationStatus, Prisma } from '../../generated/prisma/client'
import { ORDER_ERRORS, OrderServiceError } from '../order.errors'

export const fulfillmentMutationInclude = {
  order: true,
  sourceStore: true,
  destinationStore: true,
  product: true,
} satisfies Prisma.StockMutationInclude

export const assertMutationStatus = (
  actualStatus: MutationStatus,
  expectedStatus: MutationStatus,
  message: string,
) => {
  if (actualStatus === expectedStatus) return

  throw new OrderServiceError(
    ORDER_ERRORS.STOCK_MUTATION_INVALID_STATUS,
    message,
    400,
  )
}
