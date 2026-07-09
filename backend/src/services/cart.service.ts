import { Prisma } from '../generated/prisma/client'
import prisma from '../lib/prisma'
import { getActiveProductDiscounts, resolveDiscountStoreId, type GetCartOptions } from './cart-pricing.service'
import { getProductStockTotals } from './cart-stock.service'
import { getBestProductDiscount } from './order/checkout/order-discount.service'

type DatabaseClient = Prisma.TransactionClient

const emptyCart = {
  id: null,
  store: null,
  items: [],
  summary: {
    totalQuantity: 0,
    subtotal: 0,
    discountAmount: 0,
    total: 0,
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

export const getCart = async (userId: number, options: GetCartOptions = {}) => {
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
            },
          },
        },
      },
    },
  })

  if (!cart) {
    return emptyCart
  }

  const applyItemDiscounts = options.applyItemDiscounts ?? false
  const productIds = cart.items.map((item) => item.productId)
  const discountStoreId = applyItemDiscounts ? await resolveDiscountStoreId(userId, options) : undefined
  const [stockTotals, activeDiscounts] = await Promise.all([
    getProductStockTotals(productIds),
    applyItemDiscounts ? getActiveProductDiscounts(productIds, discountStoreId) : Promise.resolve([]),
  ])

  const items = cart.items.map((item) => {
    const totalStock = stockTotals.get(item.productId) ?? 0
    const baseLineTotal = item.quantity * item.product.basePrice
    const bestDiscount = getBestProductDiscount(
      { productId: item.productId, quantity: item.quantity, product: { basePrice: item.product.basePrice } },
      activeDiscounts,
    )
    const discountAmount = Math.round(bestDiscount.amount)
    const lineTotal = Math.max(0, baseLineTotal - discountAmount)

    return {
      ...item,
      product: {
        ...item.product,
        totalStock,
      },
      baseLineTotal,
      discountAmount,
      lineTotal,
    }
  })

  const summary = items.reduce(
    (acc, item) => ({
      totalQuantity: acc.totalQuantity + item.quantity,
      subtotal: acc.subtotal + item.baseLineTotal,
      discountAmount: acc.discountAmount + item.discountAmount,
      total: acc.total + item.lineTotal,
    }),
    { totalQuantity: 0, subtotal: 0, discountAmount: 0, total: 0 },
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
