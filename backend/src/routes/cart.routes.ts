import { Router } from 'express'
import { addToCart, getCartCount } from '../controllers/cart.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { requireVerifiedUser } from '../middlewares/verified.middleware'

const cartRouter = Router()

cartRouter.use(authenticate, requireVerifiedUser)

cartRouter.post('/items', addToCart)
cartRouter.get('/count', getCartCount)

export default cartRouter

