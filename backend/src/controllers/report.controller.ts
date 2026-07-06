import { Request, Response } from 'express'
import { getSalesReport } from '../services/report.service'

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
