import { Router } from 'express'
import { register, login, logout, verifyAccount, socialLogin, resendVerification, getMe, forgotPassword, resetPassword, completeOnboarding, refreshToken } from '../controllers/auth.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { validateRequest } from '../middlewares/validation.middleware'
import { checkDuplicateUser } from '../middlewares/checkDuplicateUser.middleware'
import { forgotPasswordSchema, resetPasswordSchema } from '../validations/auth.validation'

const authRouter = Router()

authRouter.post('/register', checkDuplicateUser, register)
authRouter.post('/verify', verifyAccount)
authRouter.post('/resend-verification', resendVerification)
authRouter.post('/login', login)
authRouter.post('/social-login', socialLogin)
authRouter.post('/logout', logout)
authRouter.post('/refresh-token', refreshToken)
authRouter.get('/me', authenticate, getMe)
authRouter.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPassword)
authRouter.post('/reset-password', validateRequest(resetPasswordSchema), resetPassword)
authRouter.post('/complete-onboarding', authenticate, completeOnboarding)

export default authRouter


