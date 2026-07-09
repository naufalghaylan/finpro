import { z } from 'zod'

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  phone: z.string().optional().nullable(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').optional(),
}).refine(data => {
  if (data.newPassword && !data.currentPassword) {
    return false
  }
  return true
}, {
  message: 'Current password is required to set a new password',
  path: ['currentPassword']
})

export const updateEmailSchema = z.object({
  email: z.string().email('Invalid email address')
})

export const verifyEmailChangeSchema = z.object({
  token: z.string().min(1, 'Token is required')
})
