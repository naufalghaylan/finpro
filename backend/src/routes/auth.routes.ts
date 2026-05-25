import { Router } from 'express'
import { register, login, getMe, logout, verifyAccount, socialLogin, resendVerification } from '../controllers/auth.controller'
import { authenticate } from '../middlewares/auth.middleware'

const authRouter = Router()

authRouter.post('/register', register)
authRouter.post('/verify', verifyAccount)
authRouter.post('/resend-verification', resendVerification)
authRouter.post('/login', login)
authRouter.post('/social-login', socialLogin)
authRouter.post('/logout', logout)
authRouter.get('/me', authenticate, getMe)

export default authRouter
