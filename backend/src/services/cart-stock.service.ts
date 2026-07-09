import { Prisma } from '../generated/prisma/client'
import prisma from '../lib/prisma'

type DatabaseClient = Prisma.TransactionClient

export const getProductStockTotals = async (productIds: number[], db: DatabaseClient = prisma) => {
  if (productIds.length === 0) {
    return new Map<number, number>()
  }

  const stockTotals = await db.stock.groupBy({
    by: ['productId'],
    where: {
      productId: { in: productIds },
    },
    _sum: { quantity: true },
  })

  return new Map(stockTotals.map((stock) => [stock.productId, stock._sum.quantity ?? 0]))
}
