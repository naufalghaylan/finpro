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
      const autoCancelResult = await autoCancelExpiredManualTransferOrders()

      if (autoCancelResult.cancelledCount > 0) {
        console.log(
          `Auto-cancelled ${autoCancelResult.cancelledCount} expired manual transfer order(s).`,
        )
      }

      const autoConfirmResult = await autoConfirmShippedOrders()

      if (autoConfirmResult.confirmedCount > 0) {
        console.log(
          `Auto-confirmed ${autoConfirmResult.confirmedCount} shipped order(s).`,
        )
      }
    } catch (error) {
      console.error('Error during order cron job:', error)
    } finally {
      isOrderCronRunning = false
    }
  })
}
