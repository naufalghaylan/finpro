import { StockJournalType } from '../../../generated/prisma/client'
import { FulfillmentStateOrder } from '../fulfillment/order-fulfillment-state.select'
import { DatabaseClient } from '../fulfillment/order-fulfillment-state.types'

export const getReservedQuantities = (order: FulfillmentStateOrder) => {
  const reservedByProductAndStore = new Map<string, number>()

  for (const journal of order.stockJournals) {
    if (journal.type === StockJournalType.MUTATION_OUT) continue

    const key = `${journal.stock.productId}:${journal.stock.storeId}`
    const currentQuantity = reservedByProductAndStore.get(key) ?? 0
    reservedByProductAndStore.set(key, currentQuantity - journal.quantityChange)
  }

  return reservedByProductAndStore
}

export const getReservedQuantityForSource = async ({
  orderId,
  productId,
  sourceStoreId,
  db,
}: {
  orderId: number
  productId: number
  sourceStoreId: number
  db: DatabaseClient
}) => {
  const journals = await db.stockJournal.findMany({
    where: {
      orderId,
      stock: {
        productId,
        storeId: sourceStoreId,
      },
      type: {
        in: [StockJournalType.ORDER, StockJournalType.CANCEL_RETURN],
      },
    },
    select: {
      quantityChange: true,
    },
  })

  return Math.max(0, -journals.reduce((total, journal) => total + journal.quantityChange, 0))
}
