import { Prisma, StockJournalType } from '../../generated/prisma/client'

export const fulfillmentStateSelect = {
  id: true,
  status: true,
  storeId: true,
  store: {
    select: {
      id: true,
      latitude: true,
      longitude: true,
    },
  },
  items: {
    select: {
      productId: true,
      quantity: true,
      product: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  stockJournals: {
    where: {
      type: {
        in: [
          StockJournalType.ORDER,
          StockJournalType.CANCEL_RETURN,
          StockJournalType.MUTATION_OUT,
        ],
      },
    },
    select: {
      stockId: true,
      quantityChange: true,
      type: true,
      stock: {
        select: {
          productId: true,
          storeId: true,
        },
      },
    },
  },
  stockMutations: {
    orderBy: { createdAt: 'desc' as const },
    select: {
      id: true,
      productId: true,
      sourceStoreId: true,
      quantity: true,
      status: true,
      createdAt: true,
    },
  },
} satisfies Prisma.OrderSelect

export type FulfillmentStateOrder = Prisma.OrderGetPayload<{
  select: typeof fulfillmentStateSelect
}>
