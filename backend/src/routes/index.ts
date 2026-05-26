import { Router } from 'express'
import authRouter from './auth.routes'
import productRoutes from './product.routes'
import categoryRoutes from './category.routes'

const router = Router()

router.use('/auth', authRouter)
router.use('/products', productRoutes)
router.use('/categories', categoryRoutes)

export default router