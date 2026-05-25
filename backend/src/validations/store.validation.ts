import { z } from 'zod'

export const nearestStoreSchema = z.object({
  query: z.object({
    lat: z.string().regex(/^-?\d+(\.\d+)?$/, "Invalid latitude format"),
    lng: z.string().regex(/^-?\d+(\.\d+)?$/, "Invalid longitude format")
  })
})
