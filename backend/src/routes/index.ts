import { Router } from 'express'
import authRouter from './auth.routes'
import cartRouter from './cart.routes'

const router = Router()

router.use('/auth', authRouter)
router.use('/cart', cartRouter)

// ── Placeholder for future routes ──────────────────────────────────────────
// router.use('/users', userRouter)
// router.use('/products', productRouter)

export { router }
