import { Prisma } from '../generated/prisma/client'
import prisma from '../lib/prisma'

type DatabaseClient = Prisma.TransactionClient

const emptyCart = {
  id: null,
  store: null,
  items: [],
  summary: {
    totalQuantity: 0,
    subtotal: 0,
  },
}

export const createCart = async (userId: number, db: DatabaseClient = prisma) => {
  return db.cart.create({
    data: { userId },
    select: { id: true },
  })
}

export const getOrCreateCart = async (userId: number, db: DatabaseClient = prisma) => {
  return db.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    select: { id: true },
  })
}

export const getCartItemCount = async (cartId: number, db: DatabaseClient = prisma) => {
  const countAgg = await db.cartItem.aggregate({
    where: { cartId },
    _sum: { quantity: true },
  })

  return countAgg._sum.quantity ?? 0
}

const getProductStockTotals = async (productIds: number[], db: DatabaseClient = prisma) => {
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

export const getCart = async (userId: number) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: {
      id: true,
      store: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
        },
      },
      items: {
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          productId: true,
          quantity: true,
          createdAt: true,
          updatedAt: true,
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              basePrice: true,
              weight: true,
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
              images: {
                orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
                select: {
                  id: true,
                  imageUrl: true,
                  isPrimary: true,
                  sortOrder: true,
                },
              },
              stocks: {
                select: {
                  id: true,
                  quantity: true,
                  store: {
                    select: {
                      id: true,
                      name: true,
                      address: true,
                      city: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!cart) {
    return emptyCart
  }

  const productIds = cart.items.map((item) => item.productId)
  const stockTotals = await getProductStockTotals(productIds)
  const items = cart.items.map((item) => {
    const totalStock = stockTotals.get(item.productId) ?? 0
    const lineTotal = item.quantity * item.product.basePrice

    return {
      ...item,
      product: {
        ...item.product,
        totalStock,
      },
      lineTotal,
    }
  })

  const summary = items.reduce(
    (acc, item) => ({
      totalQuantity: acc.totalQuantity + item.quantity,
      subtotal: acc.subtotal + item.lineTotal,
    }),
    { totalQuantity: 0, subtotal: 0 },
  )

  return {
    id: cart.id,
    store: cart.store,
    items,
    summary,
  }
}

export const getCartCount = async (userId: number) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: { id: true },
  })

  if (!cart) {
    return 0
  }

  return getCartItemCount(cart.id)
}
