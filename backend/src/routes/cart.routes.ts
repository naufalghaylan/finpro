import { Router } from 'express'
import {
  addToCart,
  deleteCartItem,
  getCart,
  getCartCount,
  updateCartItem,
} from '../controllers/cart.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { requireVerifiedUser } from '../middlewares/verified.middleware'

const cartRouter = Router()

cartRouter.use(authenticate, requireVerifiedUser)

cartRouter.get('/', getCart)
cartRouter.post('/items', addToCart)
cartRouter.patch('/items/:id', updateCartItem)
cartRouter.delete('/items/:id', deleteCartItem)
cartRouter.get('/count', getCartCount)

export default cartRouter

