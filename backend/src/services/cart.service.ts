import { Prisma } from '../generated/prisma/client'
import prisma from '../lib/prisma'
import { getDiscountedProductUnitPrice } from './product-price-discount.service'

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

export const getOrCreateCart = async (userId: number, db: DatabaseClient = prisma, storeId?: number) => {
  return db.cart.upsert({
    where: { userId },
    create: { userId, ...(storeId ? { storeId } : {}) },
    update: storeId ? { storeId } : {},
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

const getProductStockTotals = async (productIds: number[], db: DatabaseClient = prisma, storeId?: number) => {
  if (productIds.length === 0) {
    return new Map<number, number>()
  }

  const stockTotals = await db.stock.groupBy({
    by: ['productId'],
    where: {
      productId: { in: productIds },
      ...(storeId ? { storeId } : {}),
    },
    _sum: { quantity: true },
  })

  return new Map(stockTotals.map((stock) => [stock.productId, stock._sum.quantity ?? 0]))
}

const getActiveDiscountWhere = (now: Date) => ({
  isActive: true,
  deletedAt: null,
  startDate: { lte: now },
  endDate: { gte: now },
})

export const getCart = async (userId: number, pricingStoreId?: number) => {
  const now = new Date()
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
                where: { deletedAt: null },
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
              discounts: {
                where: getActiveDiscountWhere(now),
                select: {
                  id: true,
                  storeId: true,
                  discountType: true,
                  discountValue: true,
                  isActive: true,
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

  const activePricingStoreId = pricingStoreId ?? cart.store?.id
  const productIds = cart.items.map((item) => item.productId)
  const stockTotals = await getProductStockTotals(productIds, prisma, activePricingStoreId)
  const items = cart.items.map((item) => {
    const totalStock = stockTotals.get(item.productId) ?? 0
    const discounts = activePricingStoreId
      ? item.product.discounts.filter((discount) => discount.storeId === activePricingStoreId)
      : []
    const discountedUnitPrice = getDiscountedProductUnitPrice(item.product.basePrice, discounts)
    const lineTotal = item.quantity * discountedUnitPrice
    const displayDiscounts = discounts
      .map((discount) => ({
        id: discount.id,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
        isActive: discount.isActive,
      }))

    return {
      ...item,
      product: {
        ...item.product,
        discounts: displayDiscounts,
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
