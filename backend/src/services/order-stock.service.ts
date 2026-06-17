import { Prisma, StockJournalType } from '../generated/prisma/client'
import { getDistanceFromLatLonInKm } from '../utils/geo.util'
import { ORDER_ERRORS, OrderServiceError } from './order.errors'
import {
  adjustStockWithJournal,
  stockJournalSnapshotSelect,
  StockWithJournalSnapshots,
} from './order-stock-journal.service'

type DatabaseClient = Prisma.TransactionClient

export type StockAvailabilityItem = {
  productId: number
  quantity: number
  product: {
    name: string
  }
}

export type ReservedStockJournal = {
  stockId: number
  quantityChange: number
}

export type ReservedStockOrder = {
  id: number
  orderNumber: string
  stockJournals: ReservedStockJournal[]
}

const getStockTotals = async (productIds: number[], db: DatabaseClient) => {
  const stockTotals = await db.stock.groupBy({
    by: ['productId'],
    where: { productId: { in: productIds } },
    _sum: { quantity: true },
  })

  return new Map(stockTotals.map((stock) => [stock.productId, stock._sum.quantity ?? 0]))
}

export const assertGlobalStockAvailable = async (
  items: StockAvailabilityItem[],
  db: DatabaseClient,
) => {
  const productIds = [...new Set(items.map((item) => item.productId))]
  const stockTotals = await getStockTotals(productIds, db)
  const insufficientItems = items
    .map((item) => ({
      productId: item.productId,
      productName: item.product.name,
      requestedQuantity: item.quantity,
      availableQuantity: stockTotals.get(item.productId) ?? 0,
    }))
    .filter((item) => item.requestedQuantity > item.availableQuantity)

  if (insufficientItems.length > 0) {
    throw new OrderServiceError(
      ORDER_ERRORS.INSUFFICIENT_STOCK,
      'Some products do not have enough stock',
      400,
      { items: insufficientItems },
    )
  }
}

const getStockPriority = (
  stock: { storeId: number; store: { latitude: number; longitude: number } },
  nearestStoreId: number,
  latitude: number,
  longitude: number,
) => {
  if (stock.storeId === nearestStoreId) {
    return -1
  }

  return getDistanceFromLatLonInKm(latitude, longitude, stock.store.latitude, stock.store.longitude)
}

export const allocateStockForOrder = async ({
  db,
  items,
  orderId,
  orderNumber,
  userId,
  nearestStoreId,
  latitude,
  longitude,
}: {
  db: DatabaseClient
  items: StockAvailabilityItem[]
  orderId: number
  orderNumber: string
  userId: number
  nearestStoreId: number
  latitude: number
  longitude: number
}) => {
  for (const item of items) {
    let remainingQuantity = item.quantity
    const availableStocks = await db.stock.findMany({
      where: {
        productId: item.productId,
        quantity: { gt: 0 },
      },
      select: {
        ...stockJournalSnapshotSelect,
        storeId: true,
      },
    }) as (StockWithJournalSnapshots & { storeId: number })[]

    const prioritizedStocks = availableStocks.sort((firstStock, secondStock) => {
      const firstPriority = getStockPriority(firstStock, nearestStoreId, latitude, longitude)
      const secondPriority = getStockPriority(secondStock, nearestStoreId, latitude, longitude)

      return firstPriority - secondPriority
    })

    for (const stock of prioritizedStocks) {
      if (remainingQuantity <= 0) break

      const quantityTaken = Math.min(remainingQuantity, stock.quantity)

      await adjustStockWithJournal({
        db,
        stock,
        orderId,
        quantityChange: -quantityTaken,
        type: StockJournalType.ORDER,
        userId,
        description: `Reserved for order ${orderNumber} - ${item.product.name}`,
        notes: 'Order stock reserve',
        insufficientStockMessage: 'Stock changed while creating order. Please try again.',
      })

      remainingQuantity -= quantityTaken
    }

    if (remainingQuantity > 0) {
      throw new OrderServiceError(
        ORDER_ERRORS.INSUFFICIENT_STOCK,
        'Some products do not have enough stock',
        400,
        {
          items: [{
            productId: item.productId,
            productName: item.product.name,
            remainingQuantity,
          }],
        },
      )
    }
  }
}

export const restoreReservedOrderStock = async ({
  db,
  order,
  actorUserId,
  notes,
}: {
  db: DatabaseClient
  order: ReservedStockOrder
  actorUserId: number
  notes: string
}) => {
  for (const journal of order.stockJournals) {
    const restoreQuantity = Math.abs(journal.quantityChange)
    const stock = await db.stock.findUnique({
      where: { id: journal.stockId },
      select: stockJournalSnapshotSelect,
    })

    if (!stock) {
      throw new OrderServiceError(ORDER_ERRORS.STOCK_NOT_FOUND, 'Reserved stock not found', 404)
    }

    await adjustStockWithJournal({
      db,
      stock,
      orderId: order.id,
      quantityChange: restoreQuantity,
      type: StockJournalType.CANCEL_RETURN,
      userId: actorUserId,
      description: `Returned reserved stock from cancelled order ${order.orderNumber}`,
      notes,
    })
  }
}
