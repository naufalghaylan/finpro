import 'dotenv/config'
import app from './app'
import { startOrderCron } from './cron/order.cron'
import { startVoucherCron } from './cron/voucher.cron'

const PORT = process.env.PORT || 3000

// Start cron jobs
startVoucherCron()
startOrderCron()

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})

