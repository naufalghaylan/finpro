import { Router } from 'express'
import authRouter from './auth.routes'
import storeRouter from './store.routes'
import productRouter from './product.routes'
import promotionRouter from './promotion.routes'

const router = Router()

router.use('/auth', authRouter)
router.use('/stores', storeRouter)
router.use('/products', productRouter)
router.use('/promotions', promotionRouter)

// ── Placeholder for future routes ──────────────────────────────────────────
// router.use('/users', userRouter)

export { router }
