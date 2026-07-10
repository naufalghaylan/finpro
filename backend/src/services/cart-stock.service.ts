import { Prisma } from '../generated/prisma/client'
import prisma from '../lib/prisma'

type DatabaseClient = Prisma.TransactionClient

export const getProductStockTotals = async (productIds: number[], storeId?: number, db: DatabaseClient = prisma) => {
  if (productIds.length === 0) {
    return new Map<number, number>()
  }

  const stockTotals = await db.stock.groupBy({
    by: ['productId'],
    where: {
      productId: { in: productIds },
      ...(storeId ? { storeId } : {}),
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

export const getProductListingSet = async (
  productIds: number[],
  storeId: number,
  db: DatabaseClient = prisma,
) => {
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
