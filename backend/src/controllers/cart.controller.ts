import { Request, Response } from 'express'
import {
  CART_ITEM_ERRORS,
  addCartItem as addCartItemService,
  deleteCartItem as deleteCartItemService,
  updateCartItem as updateCartItemService,
} from '../services/cart-item.service'
import { getCart as getCartService, getCartCount as getCartCountService } from '../services/cart.service'
import {
  addToCartSchema,
  cartItemParamsSchema,
  updateCartItemSchema,
} from '../validations/cart.validation'

const getAuthenticatedUserId = (req: Request, res: Response) => {
  const userId = req.user?.userId

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized: Login required' })
    return null
  }

  return userId
}

const handleCartItemError = (error: unknown, res: Response) => {
  if (!(error instanceof Error)) {
    return false
  }

  if (error.message === CART_ITEM_ERRORS.PRODUCT_NOT_FOUND) {
    res.status(404).json({ message: 'Product not found' })
    return true
  }

  if (error.message === CART_ITEM_ERRORS.CART_ITEM_NOT_FOUND) {
    res.status(404).json({ message: 'Cart item not found' })
    return true
  }

  if (error.message === CART_ITEM_ERRORS.INSUFFICIENT_STOCK) {
    res.status(400).json({ message: 'Requested quantity exceeds available stock' })
    return true
  }

  return false
}

export const addToCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsed = addToCartSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation Error', errors: parsed.error.flatten().fieldErrors })
      return
    }

    const result = await addCartItemService({
      userId,
      productId: parsed.data.productId,
      quantity: parsed.data.quantity,
    })

    res.status(200).json({
      message: 'Product added to cart',
      data: result,
    })
  } catch (error) {
    if (handleCartItemError(error, res)) return

    console.error('[addToCart]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const getCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const cart = await getCartService(userId)
    res.json({ data: cart })
  } catch (error) {
    console.error('[getCart]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const getCartCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const count = await getCartCountService(userId)
    res.json({ count })
  } catch (error) {
    console.error('[getCartCount]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const updateCartItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsedParams = cartItemParamsSchema.safeParse(req.params)
    const parsedBody = updateCartItemSchema.safeParse(req.body)
    if (!parsedParams.success || !parsedBody.success) {
      res.status(400).json({
        message: 'Validation Error',
        errors: {
          ...(parsedParams.success ? {} : parsedParams.error.flatten().fieldErrors),
          ...(parsedBody.success ? {} : parsedBody.error.flatten().fieldErrors),
        },
      })
      return
    }

    const result = await updateCartItemService({
      userId,
      itemId: parsedParams.data.id,
      quantity: parsedBody.data.quantity,
    })

    res.json({
      message: 'Cart item updated',
      data: result,
    })
  } catch (error) {
    if (handleCartItemError(error, res)) return

    console.error('[updateCartItem]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const deleteCartItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req, res)
    if (!userId) return

    const parsedParams = cartItemParamsSchema.safeParse(req.params)
    if (!parsedParams.success) {
      res.status(400).json({ message: 'Validation Error', errors: parsedParams.error.flatten().fieldErrors })
      return
    }

    const result = await deleteCartItemService({
      userId,
      itemId: parsedParams.data.id,
    })

    res.json({
      message: 'Cart item deleted',
      data: result,
    })
  } catch (error) {
    if (handleCartItemError(error, res)) return

    console.error('[deleteCartItem]', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
