import { Request, Response } from 'express'
import { getSalesReport } from '../services/report.service'
import {
  getStockSummaryReport,
  getStockDetailReport,
} from '../services/stock-report.service'

// Ambil & validasi year/month/storeId dari query, sekaligus kunci store admin
// ke tokonya sendiri. month wajib untuk laporan stok.
function resolveStockParams(
  req: Request,
): { storeId?: number; year: number; month: number } | { error: string } {
  const now = new Date()
  const year = req.query.year ? parseInt(req.query.year as string) : now.getFullYear()
  const month = req.query.month ? parseInt(req.query.month as string) : now.getMonth() + 1
  let storeId = req.query.storeId ? parseInt(req.query.storeId as string) : undefined

  if (Number.isNaN(year)) return { error: 'Parameter year tidak valid' }
  if (Number.isNaN(month) || month < 1 || month > 12) {
    return { error: 'Parameter month harus antara 1 dan 12' }
  }

  // Store admin dikunci ke tokonya sendiri.
  if (req.user?.role === 'STORE_ADMIN') {
    if (!req.user.storeId) return { error: 'Anda belum ditugaskan ke toko mana pun' }
    storeId = req.user.storeId
  }

  return { storeId, year, month }
}

// GET /reports/sales?storeId=&year=&month=
export const getSalesReportController = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date()
    const year = req.query.year ? parseInt(req.query.year as string) : now.getFullYear()
    const month = req.query.month ? parseInt(req.query.month as string) : undefined
    let storeId = req.query.storeId ? parseInt(req.query.storeId as string) : undefined

    if (Number.isNaN(year)) {
      res.status(400).json({ message: 'Parameter year tidak valid' })
      return
    }
    if (month !== undefined && (Number.isNaN(month) || month < 1 || month > 12)) {
      res.status(400).json({ message: 'Parameter month harus antara 1 dan 12' })
      return
    }

    // Store admin dikunci ke tokonya sendiri.
    if (req.user?.role === 'STORE_ADMIN') {
      if (!req.user.storeId) {
        res.status(403).json({ message: 'Anda belum ditugaskan ke toko mana pun' })
        return
      }
      storeId = req.user.storeId
    }

    const report = await getSalesReport({ storeId, year, month })

    res.status(200).json({
      message: 'Sales report fetched successfully',
      data: report,
    })
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', error: error.message })
  }
}

// GET /reports/stock/summary?storeId=&year=&month=
// Ringkasan stok semua produk untuk satu bulan (penambahan, pengurangan, stok akhir).
export const getStockSummaryReportController = async (req: Request, res: Response): Promise<void> => {
  try {
    const params = resolveStockParams(req)
    if ('error' in params) {
      res.status(params.error.includes('ditugaskan') ? 403 : 400).json({ message: params.error })
      return
    }

    const report = await getStockSummaryReport(params)

    res.status(200).json({
      message: 'Stock summary report fetched successfully',
      data: report,
    })
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', error: error.message })
  }
}

// GET /reports/stock/detail?productId=&storeId=&year=&month=
// Detail seluruh history stok satu produk selama satu bulan.
export const getStockDetailReportController = async (req: Request, res: Response): Promise<void> => {
  try {
    const productId = req.query.productId ? parseInt(req.query.productId as string) : NaN
    if (Number.isNaN(productId)) {
      res.status(400).json({ message: 'Parameter productId wajib diisi' })
      return
    }

    const params = resolveStockParams(req)
    if ('error' in params) {
      res.status(params.error.includes('ditugaskan') ? 403 : 400).json({ message: params.error })
      return
    }

    const report = await getStockDetailReport({ ...params, productId })

    res.status(200).json({
      message: 'Stock detail report fetched successfully',
      data: report,
    })
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', error: error.message })
  }
}
