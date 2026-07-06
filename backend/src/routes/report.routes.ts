import { Router } from 'express'
import { getSalesReportController } from '../controllers/report.controller'
import { authenticate, authorize } from '../middlewares/auth.middleware'

const router = Router()

router.get(
  '/sales',
  authenticate,
  authorize('SUPER_ADMIN', 'STORE_ADMIN'),
  getSalesReportController,
)

export default router
