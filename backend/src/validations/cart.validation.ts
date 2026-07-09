import { z } from 'zod'

const positiveIntegerSchema = z.coerce
  .number()
  .int('Must be an integer')
  .positive('Must be a positive integer')

export const addToCartSchema = z.object({
  productId: positiveIntegerSchema,
  quantity: positiveIntegerSchema.default(1),
  storeId: positiveIntegerSchema.optional(),
})

export const updateCartItemSchema = z.object({
  quantity: positiveIntegerSchema,
})

export const cartItemParamsSchema = z.object({
  id: positiveIntegerSchema,
})

export type AddToCartInput = z.infer<typeof addToCartSchema>
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>
export type CartItemParams = z.infer<typeof cartItemParamsSchema>
