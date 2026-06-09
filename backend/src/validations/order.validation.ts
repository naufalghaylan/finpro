import { z } from 'zod'
import { PaymentMethod } from '../generated/prisma/client'

const positiveIntegerSchema = z.coerce
  .number()
  .int('Must be an integer')
  .positive('Must be a positive integer')

export const checkoutQuerySchema = z.object({
  addressId: positiveIntegerSchema.optional(),
})

export const createCheckoutOrderSchema = z.object({
  addressId: positiveIntegerSchema,
  paymentMethod: z
    .enum([PaymentMethod.MANUAL_TRANSFER, PaymentMethod.PAYMENT_GATEWAY])
    .default(PaymentMethod.MANUAL_TRANSFER),
  notes: z.string().trim().max(500, 'Notes must be at most 500 characters').optional(),
})

export const orderParamsSchema = z.object({
  id: positiveIntegerSchema,
})

export const stockMutationParamsSchema = z.object({
  mutationId: positiveIntegerSchema,
})

export const cancelOrderSchema = z.object({
  reason: z.string().trim().max(500, 'Reason must be at most 500 characters').optional(),
})

export const requestFulfillmentSchema = z.object({
  sourceStoreId: positiveIntegerSchema,
  productId: positiveIntegerSchema,
  quantity: positiveIntegerSchema,
  notes: z.string().trim().max(500, 'Notes must be at most 500 characters').optional(),
})

export const fulfillmentActionSchema = z.object({
  notes: z.string().trim().max(500, 'Notes must be at most 500 characters').optional(),
})

export type CheckoutQuery = z.infer<typeof checkoutQuerySchema>
export type CreateCheckoutOrderInput = z.infer<typeof createCheckoutOrderSchema>
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>
export type RequestFulfillmentInput = z.infer<typeof requestFulfillmentSchema>
export type FulfillmentActionInput = z.infer<typeof fulfillmentActionSchema>
