import cron from 'node-cron'
import {
  autoCancelExpiredManualTransferOrders,
  autoConfirmShippedOrders,
} from '../services/order.service'

let isOrderCronRunning = false

export const startOrderCron = () => {
  cron.schedule('* * * * *', async () => {
    if (isOrderCronRunning) return

    isOrderCronRunning = true

    try {
      await autoCancelExpiredManualTransferOrders()
      await autoConfirmShippedOrders()
    } catch (error) {
      console.error('Error during order cron job:', error)
    } finally {
      isOrderCronRunning = false
    }
  })
}
