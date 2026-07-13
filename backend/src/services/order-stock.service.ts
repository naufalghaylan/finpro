import { Prisma, StockJournalType } from '../generated/prisma/client'
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
  type: StockJournalType
}

export type ReservedStockOrder = {
  id: number
  orderNumber: string
  stockJournals: ReservedStockJournal[]
}

const getStockTotals = async (productIds: number[], db: DatabaseClient) => {
  const stockTotals = await db.stock.groupBy({
    by: ['productId'],
    where: {
      productId: { in: productIds },
      deletedAt: null,
      store: {
        status: true,
        deletedAt: null,
      },
    },
    _sum: { quantity: true },
  })

  return new Map(stockTotals.map((stock) => [stock.productId, stock._sum.quantity ?? 0]))
}

const getProductListingSet = async (productIds: number[], storeId: number, db: DatabaseClient) => {
  if (productIds.length === 0) {
    return new Set<number>()
  }

  const stocks = await db.stock.findMany({
    where: {
      productId: { in: productIds },
      storeId,
      deletedAt: null,
      store: {
        status: true,
        deletedAt: null,
      },
    },
    select: { productId: true },
  })

  return new Set(stocks.map((stock) => stock.productId))
}

export const assertProductsAvailableInStore = async (
  items: StockAvailabilityItem[],
  storeId: number,
  db: DatabaseClient,
) => {
  const productIds = [...new Set(items.map((item) => item.productId))]
  const listedProductIds = await getProductListingSet(productIds, storeId, db)
  const unavailableItems = items
    .map((item) => ({
      productId: item.productId,
      productName: item.product.name,
    }))
    .filter((item) => !listedProductIds.has(item.productId))

  if (unavailableItems.length > 0) {
    throw new OrderServiceError(
      ORDER_ERRORS.PRODUCT_NOT_AVAILABLE_IN_STORE,
      'Beberapa produk tidak tersedia di cabang pengiriman',
      400,
      { items: unavailableItems },
    )
  }
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

export const allocateStockForOrder = async ({
  db,
  items,
  orderId,
  orderNumber,
  userId,
  nearestStoreId,
}: {
  db: DatabaseClient
  items: StockAvailabilityItem[]
  orderId: number
  orderNumber: string
  userId: number
  nearestStoreId: number
}) => {
  for (const item of items) {
    const destinationStock = await db.stock.findFirst({
      where: {
        productId: item.productId,
        storeId: nearestStoreId,
        quantity: { gt: 0 },
        deletedAt: null,
        store: {
          status: true,
          deletedAt: null,
        },
      },
      select: stockJournalSnapshotSelect,
    }) as StockWithJournalSnapshots | null

    if (!destinationStock) {
      continue
    }

    const quantityTaken = Math.min(item.quantity, destinationStock.quantity)

    await adjustStockWithJournal({
      db,
      stock: destinationStock,
      orderId,
      quantityChange: -quantityTaken,
      type: StockJournalType.ORDER,
      userId,
      description: `Reservasi pesanan ${orderNumber}`,
      notes: 'Stok toko tujuan dialokasikan otomatis untuk pesanan pelanggan',
      insufficientStockMessage: 'Stock changed while creating order. Please try again.',
    })
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
  const outstandingByStock = new Map<number, number>()

  for (const journal of order.stockJournals) {
    const currentQuantity = outstandingByStock.get(journal.stockId) ?? 0
    outstandingByStock.set(journal.stockId, currentQuantity - journal.quantityChange)
  }

  for (const [stockId, rawRestoreQuantity] of outstandingByStock) {
    const restoreQuantity = Math.max(0, rawRestoreQuantity)
    if (restoreQuantity === 0) continue

    const stock = await db.stock.findUnique({
      where: { id: stockId },
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
      description: `Pengembalian stok pesanan ${order.orderNumber}`,
      notes: notes || 'Pesanan dibatalkan, stok dikembalikan ke toko',
    })
  }
}
