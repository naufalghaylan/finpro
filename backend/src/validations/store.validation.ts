import { z } from 'zod'

export const nearestStoreSchema = z.object({
  query: z.object({
    lat: z.string().regex(/^-?\d+(\.\d+)?$/, "Invalid latitude format"),
    lng: z.string().regex(/^-?\d+(\.\d+)?$/, "Invalid longitude format")
  })
})

export const createStoreSchema = z.object({
  body: z.object({
    name: z.string().min(3),
    description: z.string().optional(),
    latitude: z.number(),
    longitude: z.number(),
    address: z.string(),
    city: z.string(),
    cityId: z.string().optional(),
    province: z.string(),
    provinceId: z.string().optional(),
    postalCode: z.string().optional(),
    phone: z.string().optional(),
    serviceRadius: z.number().optional().default(50),
    status: z.boolean().optional().default(true),
  })
});

export const updateStoreSchema = z.object({
  body: z.object({
    name: z.string().min(3).optional(),
    description: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    cityId: z.string().optional(),
    province: z.string().optional(),
    provinceId: z.string().optional(),
    postalCode: z.string().optional(),
    phone: z.string().optional(),
    serviceRadius: z.number().optional(),
    status: z.boolean().optional(),
  })
});

export const createStoreAdminSchema = z.object({
  body: z.object({
    name: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6),
  })
});
