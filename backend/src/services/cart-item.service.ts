import { Prisma } from '../generated/prisma/client'
import prisma from '../lib/prisma'
import { getCartItemCount, getOrCreateCart } from './cart.service'

type DatabaseClient = Prisma.TransactionClient

export const CART_ITEM_ERRORS = {
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  STORE_NOT_FOUND: 'STORE_NOT_FOUND',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  PRODUCT_NOT_AVAILABLE_IN_STORE: 'PRODUCT_NOT_AVAILABLE_IN_STORE',
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
  storeId?: number
}

type DeleteCartItemParams = {
  userId: number
  itemId: number
}

const getProductTotalStock = async (productId: number, storeId: number, db: DatabaseClient) => {
  const stockAgg = await db.stock.aggregate({
    where: {
      productId,
      storeId,
      deletedAt: null,
      store: {
        status: true,
        deletedAt: null,
      },
    },
    _sum: { quantity: true },
  })

  return stockAgg._sum.quantity ?? 0
}

const assertProductListedInStore = async (
  productId: number,
  storeId: number | undefined,
  db: DatabaseClient,
) => {
  if (!storeId) return

  const stock = await db.stock.findFirst({
    where: {
      productId,
      storeId,
      deletedAt: null,
      store: {
        status: true,
        deletedAt: null,
      },
    },
    select: { id: true },
  })

  if (!stock) {
    throw new Error(CART_ITEM_ERRORS.PRODUCT_NOT_AVAILABLE_IN_STORE)
  }
}

const assertActiveStore = async (storeId: number | undefined, db: DatabaseClient) => {
  if (!storeId) return

  const store = await db.store.findFirst({
    where: {
      id: storeId,
      status: true,
      deletedAt: null,
    },
    select: { id: true },
  })

  if (!store) {
    throw new Error(CART_ITEM_ERRORS.STORE_NOT_FOUND)
  }
}

export const addCartItem = async ({ userId, productId, quantity, storeId }: AddCartItemParams) => {
  return prisma.$transaction(async (tx) => {
    await assertActiveStore(storeId, tx)

    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { id: true },
    })

    if (!product) {
      throw new Error(CART_ITEM_ERRORS.PRODUCT_NOT_FOUND)
    }

    await assertProductListedInStore(productId, storeId, tx)

    if (!storeId) {
      throw new Error(CART_ITEM_ERRORS.STORE_NOT_FOUND)
    }

    const cart = await getOrCreateCart(userId, tx)
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

    const availableStock = await getProductTotalStock(productId, storeId, tx)
    const nextQuantity = (existingItem?.quantity ?? 0) + quantity
    if (nextQuantity > availableStock) {
      throw new Error(CART_ITEM_ERRORS.INSUFFICIENT_STOCK)
    }

    if (storeId) {
      await tx.cart.update({
        where: { id: cart.id },
        data: { storeId },
        select: { id: true },
      })
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

export const updateCartItem = async ({ userId, itemId, quantity, storeId }: UpdateCartItemParams) => {
  return prisma.$transaction(async (tx) => {
    await assertActiveStore(storeId, tx)

    const existingItem = await tx.cartItem.findFirst({
      where: {
        id: itemId,
        cart: { userId },
      },
      select: {
        id: true,
        cartId: true,
        productId: true,
        cart: {
          select: { storeId: true },
        },
      },
    })

    if (!existingItem) {
      throw new Error(CART_ITEM_ERRORS.CART_ITEM_NOT_FOUND)
    }

    const activeStoreId = storeId ?? existingItem.cart.storeId ?? undefined
    if (!activeStoreId) {
      throw new Error(CART_ITEM_ERRORS.STORE_NOT_FOUND)
    }

    await assertProductListedInStore(existingItem.productId, activeStoreId, tx)
    const totalStock = await getProductTotalStock(existingItem.productId, activeStoreId, tx)
    if (quantity > totalStock) {
      throw new Error(CART_ITEM_ERRORS.INSUFFICIENT_STOCK)
    }

    if (storeId) {
      await tx.cart.update({
        where: { id: existingItem.cartId },
        data: { storeId },
        select: { id: true },
      })
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
