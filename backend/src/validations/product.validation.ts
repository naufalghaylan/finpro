import { z } from 'zod'

export const productListSchema = z.object({
  query: z.object({
    storeId: z.string().regex(/^\d+$/, "Invalid storeId format").optional(),
    page: z.string().regex(/^\d+$/, "Invalid page format").optional(),
    limit: z.string().regex(/^\d+$/, "Invalid limit format").optional(),
    sort: z.string().optional(),
    filter: z.string().optional()
  })
})
