import { z } from 'zod';

export const createDiscountSchema = z.object({
  body: z.object({
    storeId: z.number().int().optional(), // Can be optional if STORE_ADMIN creates it
    productId: z.number().int().optional().nullable(),
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional().nullable(),
    discountType: z.enum(['PERCENTAGE', 'NOMINAL', 'BUY_ONE_GET_ONE']),
    discountValue: z.number().min(0),
    minPurchase: z.number().min(0).optional().default(0),
    maxDiscount: z.number().optional().nullable(),
    startDate: z.string().datetime().or(z.date()),
    endDate: z.string().datetime().or(z.date()),
    isActive: z.boolean().optional().default(true)
  })
});

export const updateDiscountSchema = z.object({
  body: createDiscountSchema.shape.body.partial()
});
