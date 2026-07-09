import { Request, Response } from 'express'
import { updateProfileSchema, updateEmailSchema, verifyEmailChangeSchema } from '../validations/profile.validation'
import { AppError } from '../utils/AppError'
import * as profileService from '../services/profile.service'

const handleError = (res: Response, err: unknown, context: string) => {
  if (err instanceof AppError) return res.status(err.statusCode).json({ message: err.message })
  console.error(`[${context}]`, err)
  res.status(500).json({ message: 'Internal server error' })
}

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await profileService.getProfileService(req.user!.userId))
  } catch (err) { handleError(res, err, 'getProfile') }
}

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.issues })
      return
    }
    res.json({ 
      message: 'Profile updated successfully', 
      user: await profileService.updateProfileService(req.user!.userId, parsed.data, req.file) 
    })
  } catch (err) { handleError(res, err, 'updateProfile') }
}

export const updateEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = updateEmailSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.issues })
      return
    }
    await profileService.updateEmailService(req.user!.userId, parsed.data.email)
    res.json({ message: 'Konfirmasi perubahan email telah dikirim. Silakan cek inbox Anda.' })
  } catch (err) { handleError(res, err, 'updateEmail') }
}

export const reverifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    await profileService.reverifyEmailService(req.user!.userId)
    res.json({ message: 'Verification email resent successfully. Please check your email.' })
  } catch (err) { handleError(res, err, 'reverifyEmail') }
}

export const verifyEmailChange = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = verifyEmailChangeSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.issues })
      return
    }
    await profileService.verifyEmailChangeService(parsed.data.token)
    res.json({ message: 'Email berhasil diperbarui dan diverifikasi.' })
  } catch (err) { handleError(res, err, 'verifyEmailChange') }
}
