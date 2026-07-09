import { Prisma } from '../generated/prisma/client'
import prisma from '../lib/prisma'
import { getCartItemCount, getOrCreateCart } from './cart.service'

type DatabaseClient = Prisma.TransactionClient

export const CART_ITEM_ERRORS = {
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  CART_ITEM_NOT_FOUND: 'CART_ITEM_NOT_FOUND',
} as const

type AddCartItemParams = {
  userId: number
  productId: number
  quantity: number
  storeId?: number
}

type UpdateCartItemParams = {
  userId: number
  itemId: number
  quantity: number
}

type DeleteCartItemParams = {
  userId: number
  itemId: number
}

const getProductTotalStock = async (productId: number, db: DatabaseClient, storeId?: number) => {
  const stockAgg = await db.stock.aggregate({
    where: { productId, ...(storeId ? { storeId } : {}) },
    _sum: { quantity: true },
  })

  return stockAgg._sum.quantity ?? 0
}

export const addCartItem = async ({ userId, productId, quantity, storeId }: AddCartItemParams) => {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { id: true },
    })

    if (!product) {
      throw new Error(CART_ITEM_ERRORS.PRODUCT_NOT_FOUND)
    }

    const cart = await getOrCreateCart(userId, tx, storeId)
    const existingItem = await tx.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
      select: {
        id: true,
        quantity: true,
      },
    })

    const totalStock = await getProductTotalStock(productId, tx, storeId)
    const nextQuantity = (existingItem?.quantity ?? 0) + quantity
    if (nextQuantity > totalStock) {
      throw new Error(CART_ITEM_ERRORS.INSUFFICIENT_STOCK)
    }

    const cartItem = existingItem
      ? await tx.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: nextQuantity },
          select: {
            id: true,
            productId: true,
            quantity: true,
            createdAt: true,
            updatedAt: true,
          },
        })
      : await tx.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity,
          },
          select: {
            id: true,
            productId: true,
            quantity: true,
            createdAt: true,
            updatedAt: true,
          },
        })

    return {
      cartItem,
      cartCount: await getCartItemCount(cart.id, tx),
    }
  })
}

export const updateCartItem = async ({ userId, itemId, quantity }: UpdateCartItemParams) => {
  return prisma.$transaction(async (tx) => {
    const existingItem = await tx.cartItem.findFirst({
      where: {
        id: itemId,
        cart: { userId },
      },
      select: {
        id: true,
        cartId: true,
        productId: true,
      },
    })

    if (!existingItem) {
      throw new Error(CART_ITEM_ERRORS.CART_ITEM_NOT_FOUND)
    }

    const totalStock = await getProductTotalStock(existingItem.productId, tx)
    if (quantity > totalStock) {
      throw new Error(CART_ITEM_ERRORS.INSUFFICIENT_STOCK)
    }

    const cartItem = await tx.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity },
      select: {
        id: true,
        productId: true,
        quantity: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return {
      cartItem,
      cartCount: await getCartItemCount(existingItem.cartId, tx),
    }
  })
}

export const deleteCartItem = async ({ userId, itemId }: DeleteCartItemParams) => {
  return prisma.$transaction(async (tx) => {
    const existingItem = await tx.cartItem.findFirst({
      where: {
        id: itemId,
        cart: { userId },
      },
      select: {
        id: true,
        cartId: true,
      },
    })

    if (!existingItem) {
      throw new Error(CART_ITEM_ERRORS.CART_ITEM_NOT_FOUND)
    }

    await tx.cartItem.delete({
      where: { id: existingItem.id },
    })

    return {
      deletedItemId: existingItem.id,
      cartCount: await getCartItemCount(existingItem.cartId, tx),
    }
  })
}
