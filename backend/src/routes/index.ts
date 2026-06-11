import { Router } from 'express'
import authRouter from './auth.routes'
import storeRouter from './store.routes'
import productRouter from './product.routes'
import categoryRouter from './category.routes'
import promotionRouter from './promotion.routes'
import discountRouter from './discount.routes'
import cartRouter from './cart.routes'
import stockRouter from './stock.routes'
import profileRouter from './profile.routes'
import orderRouter from './order.routes'
import rajaongkirRouter from './rajaongkir.routes'
import userRouter from './user.routes'
import paymentRouter from './payment.routes'

const router = Router()

router.use('/auth', authRouter)
router.use('/stores', storeRouter)
router.use('/products', productRouter)
router.use('/categories', categoryRouter)
router.use('/promotions', promotionRouter)
router.use('/discounts', discountRouter)
router.use('/cart', cartRouter)
router.use('/stocks', stockRouter)
router.use('/profile', profileRouter)
router.use('/orders', orderRouter)
router.use('/shipping', rajaongkirRouter)
router.use('/payments', paymentRouter)

// ── Placeholder for future routes ──────────────────────────────────────────
router.use('/users', userRouter)

export default router
