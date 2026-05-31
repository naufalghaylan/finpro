import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters long'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['CUSTOMER', 'STORE_ADMIN']).optional()
})

export const verifyAccountSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters long')
})

export const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address')
})

export const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required')
})

export const socialLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  provider: z.string().min(1, 'Provider is required'),
  providerId: z.string().min(1, 'Provider ID is required')
})
