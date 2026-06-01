import 'dotenv/config'
import app from './app'
import { startVoucherCron } from './cron/voucher.cron'

const PORT = process.env.PORT || 3000

// Start cron jobs
startVoucherCron()

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})

