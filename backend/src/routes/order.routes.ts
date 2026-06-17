import { Router } from 'express'
import {
  adminCancelOrder,
  approveFulfillment,
  cancelOrder,
  confirmOrderReceived,
  confirmManualPayment,
  createCheckoutOrder,
  createMidtransPayment,
  getCheckoutPreview,
  getOrderPaymentDetails,
  listAdminOrders,
  listOrders,
  receiveFulfillment,
  rejectFulfillment,
  requestOrderFulfillment,
  shipOrder,
  syncMidtransPaymentStatus,
  uploadManualPaymentProof,
} from '../controllers/order.controller'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import { handlePaymentProofUpload } from '../middlewares/payment-proof-upload.middleware'
import { requireVerifiedUser } from '../middlewares/verified.middleware'

const orderRouter = Router()

orderRouter.use(authenticate, requireVerifiedUser)

orderRouter.get('/', listOrders)
orderRouter.get('/checkout', getCheckoutPreview)
orderRouter.post('/checkout', createCheckoutOrder)
orderRouter.get('/admin', authorize('SUPER_ADMIN', 'STORE_ADMIN'), listAdminOrders)
orderRouter.get('/:id', getOrderPaymentDetails)
orderRouter.get('/:id/payment', getOrderPaymentDetails)
orderRouter.post('/:id/payment-gateway', createMidtransPayment)
orderRouter.post('/:id/payment-gateway/sync', syncMidtransPaymentStatus)
orderRouter.post('/:id/payment-proof', handlePaymentProofUpload, uploadManualPaymentProof)
orderRouter.post('/:id/cancel', cancelOrder)
orderRouter.post('/:id/confirm', confirmOrderReceived)
orderRouter.post(
  '/admin/:id/confirm-payment',
  authorize('SUPER_ADMIN', 'STORE_ADMIN'),
  confirmManualPayment,
)
orderRouter.post(
  '/admin/:id/ship',
  authorize('SUPER_ADMIN', 'STORE_ADMIN'),
  shipOrder,
)
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
