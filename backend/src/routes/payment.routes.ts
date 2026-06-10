import { Router } from 'express'
import { handleMidtransNotificationWebhook } from '../controllers/payment.controller'

const paymentRouter = Router()

paymentRouter.post('/midtrans/notification', handleMidtransNotificationWebhook)

export default paymentRouter
