import cron from 'node-cron'
import {
  autoCancelExpiredManualTransferOrders,
  autoConfirmShippedOrders,
} from '../services/order.service'
import { logger } from '../utils/logger'

let isOrderCronRunning = false

export const startOrderCron = () => {
  cron.schedule('* * * * *', async () => {
    if (isOrderCronRunning) return

    isOrderCronRunning = true

    try {
      await autoCancelExpiredManualTransferOrders()
      await autoConfirmShippedOrders()
    } catch (error) {
      logger.error('Order cron job failed', { error })
    } finally {
      isOrderCronRunning = false
    }
  })
}
