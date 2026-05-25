import { Request, Response } from 'express'
import prisma from '../lib/prisma'

const INSUFFICIENT_STOCK_ERROR = 'INSUFFICIENT_STOCK'

const toPositiveInt = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    return null
  }
  return value
}

export const addToCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized: Login required' })
      return
    }

    const productId = toPositiveInt(req.body?.productId)
    const quantity = req.body?.quantity === undefined ? 1 : toPositiveInt(req.body?.quantity)

    if (!productId || !quantity) {
      res
        .status(400)
        .json({ message: 'productId and quantity are required and must be positive integers' })
      return
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        stocks: {
          select: {
            quantity: true,
          },
        },
      },
    })

    if (!product) {
      res.status(404).json({ message: 'Product not found' })
      return
    }

    const totalStock = product.stocks.reduce((sum, stock) => sum + stock.quantity, 0)
    if (totalStock <= 0) {
      res.status(400).json({ message: 'Product is out of stock' })
      return
    }

    const result = await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.upsert({
        where: { userId },
        create: { userId },
        update: {},
        select: { id: true },
      })

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

      const nextQuantity = (existingItem?.quantity ?? 0) + quantity
      if (nextQuantity > totalStock) {
        throw new Error(INSUFFICIENT_STOCK_ERROR)
      }

      const cartItem = existingItem
        ? await tx.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: nextQuantity },
            select: {
              id: true,
              productId: true,
              quantity: true,
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
            },
          })

      const totalItemInCart = await tx.cartItem.aggregate({
        where: { cartId: cart.id },
        _sum: { quantity: true },
      })

      return {
        cartItem,
        cartCount: totalItemInCart._sum.quantity ?? 0,
      }
    })

    res.status(200).json({
      message: 'Product added to cart',
      data: result,
    })
  } catch (error) {
    if (error instanceof Error && error.message === INSUFFICIENT_STOCK_ERROR) {
      res.status(400).json({ message: 'Requested quantity exceeds available stock' })
      return
    }

    console.error('[addToCart]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const getCartCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized: Login required' })
      return
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!cart) {
      res.json({ count: 0 })
      return
    }

    const countAgg = await prisma.cartItem.aggregate({
      where: { cartId: cart.id },
      _sum: { quantity: true },
    })

    res.json({ count: countAgg._sum.quantity ?? 0 })
  } catch (error) {
    console.error('[getCartCount]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

