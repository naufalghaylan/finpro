import cron from 'node-cron'
import { autoCancelExpiredManualTransferOrders } from '../services/order.service'

let isAutoCancelRunning = false

export const startOrderCron = () => {
  cron.schedule('* * * * *', async () => {
    if (isAutoCancelRunning) return

    isAutoCancelRunning = true

    try {
      const result = await autoCancelExpiredManualTransferOrders()

      if (result.cancelledCount > 0) {
        console.log(
          `Auto-cancelled ${result.cancelledCount} expired manual transfer order(s).`,
        )
      }
    } catch (error) {
      console.error('Error during order auto-cancel cron job:', error)
    } finally {
      isAutoCancelRunning = false
    }
  })
}
