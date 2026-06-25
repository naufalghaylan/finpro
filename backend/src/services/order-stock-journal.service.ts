import { Prisma, StockJournalType } from '../generated/prisma/client'
import { ORDER_ERRORS, OrderServiceError } from './order.errors'

type DatabaseClient = Prisma.TransactionClient

export type JournalProductSnapshot = {
  id: number
  name: string
  slug: string
  basePrice: number
  categoryId: number
}

export type JournalStoreSnapshot = {
  id: number
  name: string
  slug: string
  address: string
  city: string
  province: string
  latitude: number
  longitude: number
}

export const stockJournalSnapshotSelect = {
  id: true,
  quantity: true,
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      basePrice: true,
      categoryId: true,
    },
  },
  store: {
    select: {
      id: true,
      name: true,
      slug: true,
      address: true,
      city: true,
      province: true,
      latitude: true,
      longitude: true,
    },
  },
} satisfies Prisma.StockSelect

export type StockWithJournalSnapshots = Prisma.StockGetPayload<{
  select: typeof stockJournalSnapshotSelect
}>

const buildProductSnapshot = (product: JournalProductSnapshot): Prisma.InputJsonObject => ({
  id: product.id,
  name: product.name,
  slug: product.slug,
  basePrice: product.basePrice,
  categoryId: product.categoryId,
})

const buildStoreSnapshot = (store: JournalStoreSnapshot): Prisma.InputJsonObject => ({
  id: store.id,
  name: store.name,
  slug: store.slug,
  address: store.address,
  city: store.city,
  province: store.province,
  latitude: store.latitude,
  longitude: store.longitude,
})

export const createStockJournalEntry = async ({
  db,
  stock,
  orderId,
  stockMutationId,
  quantityChange,
  quantityBefore,
  quantityAfter,
  type,
  userId,
  description,
  notes,
}: {
  db: DatabaseClient
  stock: StockWithJournalSnapshots
  orderId?: number
  stockMutationId?: number
  quantityChange: number
  quantityBefore: number
  quantityAfter: number
  type: StockJournalType
  userId: number
  description: string
  notes?: string
}) => {
  return db.stockJournal.create({
    data: {
      stockId: stock.id,
      orderId,
      stockMutationId,
      quantityChange,
      quantityBefore,
      quantityAfter,
      type,
      createdBy: userId,
      description,
      productSnapshot: buildProductSnapshot(stock.product),
      storeSnapshot: buildStoreSnapshot(stock.store),
      notes: notes || null,
    },
  })
}

export const adjustStockWithJournal = async ({
  db,
  stock,
  orderId,
  stockMutationId,
  quantityChange,
  type,
  userId,
  description,
  notes,
  insufficientStockMessage = 'Stock changed while updating stock. Please try again.',
}: {
  db: DatabaseClient
  stock: StockWithJournalSnapshots
  orderId?: number
  stockMutationId?: number
  quantityChange: number
  type: StockJournalType
  userId: number
  description: string
  notes?: string
  insufficientStockMessage?: string
}) => {
  const quantityBefore = stock.quantity
  const quantityAfter = quantityBefore + quantityChange

  if (quantityAfter < 0) {
    throw new OrderServiceError(
      ORDER_ERRORS.INSUFFICIENT_STOCK,
      insufficientStockMessage,
      409,
    )
  }

  if (quantityChange < 0) {
    const decrementQuantity = Math.abs(quantityChange)
    const updatedStock = await db.stock.updateMany({
      where: {
        id: stock.id,
        quantity: { gte: decrementQuantity },
      },
      data: {
        quantity: { decrement: decrementQuantity },
      },
    })

    if (updatedStock.count !== 1) {
      throw new OrderServiceError(
        ORDER_ERRORS.INSUFFICIENT_STOCK,
        insufficientStockMessage,
        409,
      )
    }
  } else if (quantityChange > 0) {
    await db.stock.update({
      where: { id: stock.id },
      data: {
        quantity: { increment: quantityChange },
      },
    })
  }

  await createStockJournalEntry({
    db,
    stock,
    orderId,
    stockMutationId,
    quantityChange,
    quantityBefore,
    quantityAfter,
    type,
    userId,
    description,
    notes,
  })

  return {
    quantityBefore,
    quantityAfter,
  }
}
