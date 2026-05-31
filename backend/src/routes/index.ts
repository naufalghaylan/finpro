import { Router } from 'express'
import authRouter from './auth.routes'

const router = Router()

router.use('/auth', authRouter)

// ── Placeholder for future routes ──────────────────────────────────────────
// router.use('/users', userRouter)
// router.use('/products', productRouter)

export { router }
