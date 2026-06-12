import { z } from 'zod'

export const calculateShippingCostSchema = z.object({
  addressId: z.number().int().positive(),
  storeId: z.number().int().positive(),
  weight: z.number().int().positive(),
  courier: z.string().min(1)
})
