import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters long'),
  email: z.string().email('Invalid email address'),
  role: z.literal('CUSTOMER').optional(),
  referralCode: z.string().optional()
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
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional()
})

export const socialLoginSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  provider: z.enum(['GOOGLE']),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters long')
})

export const completeOnboardingSchema = z.object({
  referralCode: z.string().optional()
})
