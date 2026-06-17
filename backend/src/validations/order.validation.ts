import { z } from 'zod'
import { OrderStatus, PaymentMethod } from '../generated/prisma/client'

const positiveIntegerSchema = z.coerce
  .number()
  .int('Must be an integer')
  .positive('Must be a positive integer')

const orderListLimitSchema = z.coerce
  .number()
  .int('Limit must be an integer')
  .positive('Limit must be a positive integer')
  .default(10)
  .transform((limit) => Math.min(limit, 50))

const optionalDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format')
  .optional()

const optionalOrderNumberSchema = z
  .string()
  .trim()
  .max(80, 'Order number must be at most 80 characters')
  .optional()
  .transform((value) => value || undefined)

const optionalOrderSearchSchema = z
  .string()
  .trim()
  .max(100, 'Search must be at most 100 characters')
  .optional()
  .transform((value) => value || undefined)

const orderStatusValues = [
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.WAITING_CONFIRMATION,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.CONFIRMED,
  OrderStatus.CANCELLED,
] as const

export const checkoutQuerySchema = z.object({
  addressId: positiveIntegerSchema.optional(),
})

const orderListBaseQuerySchema = z.object({
  page: positiveIntegerSchema.default(1),
  limit: orderListLimitSchema,
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
  search: optionalOrderSearchSchema,
  orderNumber: optionalOrderNumberSchema,
  status: z.enum(orderStatusValues).optional(),
  statusGroup: z.enum(['ongoing', 'completed', 'cancelled']).optional(),
})

const validateOrderDateRange = (
  query: { startDate?: string; endDate?: string },
  context: z.RefinementCtx,
) => {
  if (!query.startDate || !query.endDate) return

  const startDate = new Date(`${query.startDate}T00:00:00.000`)
  const endDate = new Date(`${query.endDate}T23:59:59.999`)

  if (startDate.getTime() > endDate.getTime()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'End date must be after start date',
      path: ['endDate'],
    })
  }
}

export const orderListQuerySchema = orderListBaseQuerySchema.superRefine(validateOrderDateRange)

export const adminOrderListQuerySchema = orderListBaseQuerySchema
  .extend({
    storeId: positiveIntegerSchema.optional(),
  })
  .superRefine(validateOrderDateRange)

export const createCheckoutOrderSchema = z.object({
  addressId: positiveIntegerSchema,
  shippingMethod: z.string().min(1, 'Shipping method is required'),
  shippingService: z.string().min(1, 'Shipping service is required'),
  shippingCost: z.number().int().min(0, 'Shipping cost cannot be negative'),
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

export const confirmManualPaymentSchema = z.object({
  action: z.enum(['approve', 'reject']),
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
export type OrderListQuery = z.infer<typeof orderListQuerySchema>
export type AdminOrderListQuery = z.infer<typeof adminOrderListQuerySchema>
export type CreateCheckoutOrderInput = z.infer<typeof createCheckoutOrderSchema>
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>
export type ConfirmManualPaymentInput = z.infer<typeof confirmManualPaymentSchema>
export type RequestFulfillmentInput = z.infer<typeof requestFulfillmentSchema>
export type FulfillmentActionInput = z.infer<typeof fulfillmentActionSchema>
