import { z } from 'zod'

export const createUserAddressSchema = z.object({
  recipientName: z.string().min(1, 'Recipient name is required'),
  phone: z.string().min(10, 'Phone number is required'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  city: z.string().min(1, 'City is required'),
  cityId: z.string().optional(),
  province: z.string().min(1, 'Province is required'),
  provinceId: z.string().optional(),
  district: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isPrimary: z.boolean().default(false)
})

export const updateUserAddressSchema = createUserAddressSchema.partial()
