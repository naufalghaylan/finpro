import { z } from 'zod';

export const adjustStockSchema = z.object({
  body: z.object({
    quantityChange: z.number().int().refine(val => val !== 0, {
      message: "quantityChange cannot be 0"
    }),
    notes: z.string().optional()
  })
});

export const addStockSchema = z.object({
  body: z.object({
    productId: z.number().int().positive("productId is required"),
    storeId: z.number().int().positive("storeId is required"),
    quantity: z.number().int().min(0, "quantity cannot be negative").default(0),
    notes: z.string().optional()
  })
});
