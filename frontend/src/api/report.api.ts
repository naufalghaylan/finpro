import api from './axios'

// ── Sales report ────────────────────────────────────────────────────────────
export interface SalesSummary {
  totalRevenue: number
  totalProductAmount: number
  totalDiscount: number
  totalShipping: number
  orderCount: number
  itemCount: number
}
export interface SalesMonthlyPoint { month: number; revenue: number; orderCount: number }
export interface SalesByProduct { productId: number; productName: string; quantity: number; revenue: number }
export interface SalesByCategory { categoryId: number; categoryName: string; quantity: number; revenue: number }
export interface SalesReport {
  summary: SalesSummary
  monthly: SalesMonthlyPoint[]
  byProduct: SalesByProduct[]
  byCategory: SalesByCategory[]
}

// ── Stock report ────────────────────────────────────────────────────────────
export interface StockSummaryRow {
  stockId: number
  productId: number
  productName: string
  storeId: number
  storeName: string
  totalAddition: number
  totalReduction: number
  endingStock: number
}
export interface StockSummaryReport {
  rows: StockSummaryRow[]
  totals: { totalAddition: number; totalReduction: number; endingStock: number }
}
export interface StockDetailEntry {
  id: number
  createdAt: string
  storeId: number
  storeName: string
  type: string
  quantityChange: number
  quantityBefore: number
  quantityAfter: number
  notes: string | null
  description: string | null
  createdBy: { id: number; name: string } | null
}
export interface StockDetailReport {
  product: { id: number; name: string } | null
  entries: StockDetailEntry[]
  summary: { totalAddition: number; totalReduction: number; endingStock: number; entryCount: number }
}

export interface ReportParams { year: number; month?: number; storeId?: number }

export const getSalesReport = async (params: ReportParams): Promise<SalesReport> => {
  const { data } = await api.get('/reports/sales', { params })
  return data.data
}

export const getStockSummaryReport = async (params: ReportParams): Promise<StockSummaryReport> => {
  const { data } = await api.get('/reports/stock/summary', { params })
  return data.data
}

export const getStockDetailReport = async (
  params: ReportParams & { productId: number },
): Promise<StockDetailReport> => {
  const { data } = await api.get('/reports/stock/detail', { params })
  return data.data
}

// ── Helpers tampilan ─────────────────────────────────────────────────────────
export const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export const rupiah = (n: number) => `Rp ${(n ?? 0).toLocaleString('id-ID')}`
