import { Router } from 'express'
import {
  adminCancelOrder,
  approveFulfillment,
  cancelOrder,
  createCheckoutOrder,
  getCheckoutPreview,
  receiveFulfillment,
  rejectFulfillment,
  requestOrderFulfillment,
} from '../controllers/order.controller'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import { requireVerifiedUser } from '../middlewares/verified.middleware'

const orderRouter = Router()

orderRouter.use(authenticate, requireVerifiedUser)

orderRouter.get('/checkout', getCheckoutPreview)
orderRouter.post('/checkout', createCheckoutOrder)
orderRouter.post('/:id/cancel', cancelOrder)
orderRouter.post(
  '/admin/:id/cancel',
  authorize('SUPER_ADMIN', 'STORE_ADMIN'),
  adminCancelOrder,
)
orderRouter.post(
  '/admin/:id/fulfillments',
  authorize('SUPER_ADMIN', 'STORE_ADMIN'),
  requestOrderFulfillment,
)
orderRouter.post(
  '/admin/fulfillments/:mutationId/approve',
  authorize('SUPER_ADMIN', 'STORE_ADMIN'),
  approveFulfillment,
)
orderRouter.post(
  '/admin/fulfillments/:mutationId/receive',
  authorize('SUPER_ADMIN', 'STORE_ADMIN'),
  receiveFulfillment,
)
orderRouter.post(
  '/admin/fulfillments/:mutationId/reject',
  authorize('SUPER_ADMIN', 'STORE_ADMIN'),
  rejectFulfillment,
)

export default orderRouter
