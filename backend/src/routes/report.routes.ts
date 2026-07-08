import { Router } from 'express'
import {
  getSalesReportController,
  getStockSummaryReportController,
  getStockDetailReportController,
} from '../controllers/report.controller'
import { authenticate, authorize } from '../middlewares/auth.middleware'

const router = Router()

router.get(
  '/sales',
  authenticate,
  authorize('SUPER_ADMIN', 'STORE_ADMIN'),
  getSalesReportController,
)

// Laporan stok — ringkasan semua produk & detail per produk (bulanan).
// Store admin otomatis dikunci ke tokonya di controller.
router.get(
  '/stock/summary',
  authenticate,
  authorize('SUPER_ADMIN', 'STORE_ADMIN'),
  getStockSummaryReportController,
)

router.get(
  '/stock/detail',
  authenticate,
  authorize('SUPER_ADMIN', 'STORE_ADMIN'),
  getStockDetailReportController,
)

export default router
