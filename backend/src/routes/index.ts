import { Router } from 'express'
import authRouter from './auth.routes'
import storeRouter from './store.routes'
import productRouter from './product.routes'
import categoryRouter from './category.routes'
import promotionRouter from './promotion.routes'
import cartRouter from './cart.routes'
import profileRouter from './profile.routes'
import homepageRouter from './homepage.routes'

const router = Router()

router.use('/auth', authRouter)
router.use('/stores', storeRouter)
router.use('/products', productRouter)
router.use('/categories', categoryRouter)
router.use('/promotions', promotionRouter)
router.use('/cart', cartRouter)
router.use('/profile', profileRouter)
router.use('/homepage', homepageRouter)

// ── Placeholder for future routes ──────────────────────────────────────────
// router.use('/users', userRouter)

export default router