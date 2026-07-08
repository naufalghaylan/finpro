import prisma from '../lib/prisma'
import { StockJournalType } from '../generated/prisma/client'

// ── Laporan Stok ────────────────────────────────────────────────────────────
// Sumber data: StockJournal (jurnal setiap perubahan stok). Read-only.
// quantityChange > 0 = penambahan, < 0 = pengurangan; quantityAfter = stok
// setelah perubahan → nilai jurnal terakhir dipakai sebagai "stok akhir".

export interface StockReportFilter {
  storeId?: number // opsional untuk SUPER_ADMIN; dikunci untuk STORE_ADMIN
  year: number
  month: number // 1-12, wajib (laporan stok bersifat bulanan)
}

export interface StockSummaryRow {
  stockId: number
  productId: number
  productName: string
  storeId: number
  storeName: string
  totalAddition: number // total penambahan bulan ini
  totalReduction: number // total pengurangan bulan ini (nilai positif)
  endingStock: number // stok akhir pada akhir bulan
}

export interface StockSummaryReport {
  filter: StockReportFilter
  rows: StockSummaryRow[]
  totals: { totalAddition: number; totalReduction: number; endingStock: number }
}

// Rentang [start, end) untuk satu bulan.
function monthRange(year: number, month: number): { start: Date; end: Date } {
  return { start: new Date(year, month - 1, 1), end: new Date(year, month, 1) }
}

// Ringkasan stok semua produk untuk satu bulan: total penambahan, total
// pengurangan, dan stok akhir per (produk, toko).
export async function getStockSummaryReport(filter: StockReportFilter): Promise<StockSummaryReport> {
  const { storeId, year, month } = filter
  const { start, end } = monthRange(year, month)

  // Ambil jurnal s/d akhir bulan: yang <start hanya untuk menentukan stok akhir
  // awal, yang dalam bulan untuk akumulasi penambahan/pengurangan.
  const journals = await prisma.stockJournal.findMany({
    where: {
      createdAt: { lt: end },
      ...(storeId ? { stock: { storeId } } : {}),
    },
    orderBy: { createdAt: 'asc' },
    select: {
      stockId: true,
      quantityChange: true,
      quantityAfter: true,
      createdAt: true,
      stock: {
        select: {
          productId: true,
          storeId: true,
          product: { select: { name: true } },
          store: { select: { name: true } },
        },
      },
    },
  })

  const map = new Map<number, StockSummaryRow>()
  for (const j of journals) {
    let row = map.get(j.stockId)
    if (!row) {
      row = {
        stockId: j.stockId,
        productId: j.stock.productId,
        productName: j.stock.product.name,
        storeId: j.stock.storeId,
        storeName: j.stock.store.name,
        totalAddition: 0,
        totalReduction: 0,
        endingStock: 0,
      }
      map.set(j.stockId, row)
    }
    // Jurnal urut menaik → quantityAfter terakhir = stok akhir bulan.
    row.endingStock = j.quantityAfter
    // Penambahan/pengurangan hanya dihitung untuk jurnal dalam bulan berjalan.
    if (j.createdAt >= start) {
      if (j.quantityChange > 0) row.totalAddition += j.quantityChange
      else row.totalReduction += -j.quantityChange
    }
  }

  const rows = [...map.values()].sort((a, b) => a.productName.localeCompare(b.productName))
  const totals = rows.reduce(
    (t, r) => {
      t.totalAddition += r.totalAddition
      t.totalReduction += r.totalReduction
      t.endingStock += r.endingStock
      return t
    },
    { totalAddition: 0, totalReduction: 0, endingStock: 0 },
  )

  return { filter, rows, totals }
}

export interface StockDetailFilter extends StockReportFilter {
  productId: number
}

export interface StockDetailEntry {
  id: number
  createdAt: Date
  storeId: number
  storeName: string
  type: StockJournalType
  quantityChange: number
  quantityBefore: number
  quantityAfter: number
  notes: string | null
  description: string | null
  createdBy: { id: number; name: string } | null
}

export interface StockDetailReport {
  filter: StockDetailFilter
  product: { id: number; name: string } | null
  entries: StockDetailEntry[]
  summary: { totalAddition: number; totalReduction: number; endingStock: number; entryCount: number }
}

// Detail seluruh history stok satu produk selama satu bulan.
export async function getStockDetailReport(filter: StockDetailFilter): Promise<StockDetailReport> {
  const { storeId, productId, year, month } = filter
  const { start, end } = monthRange(year, month)

  const journals = await prisma.stockJournal.findMany({
    where: {
      createdAt: { gte: start, lt: end },
      stock: { productId, ...(storeId ? { storeId } : {}) },
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      createdAt: true,
      stockId: true,
      type: true,
      quantityChange: true,
      quantityBefore: true,
      quantityAfter: true,
      notes: true,
      description: true,
      creator: { select: { id: true, name: true } },
      stock: {
        select: {
          storeId: true,
          product: { select: { name: true } },
          store: { select: { name: true } },
        },
      },
    },
  })

  const entries: StockDetailEntry[] = journals.map((j) => ({
    id: j.id,
    createdAt: j.createdAt,
    storeId: j.stock.storeId,
    storeName: j.stock.store.name,
    type: j.type,
    quantityChange: j.quantityChange,
    quantityBefore: j.quantityBefore,
    quantityAfter: j.quantityAfter,
    notes: j.notes,
    description: j.description,
    createdBy: j.creator,
  }))

  // Stok akhir = quantityAfter jurnal terakhir per stock (dijumlah bila lintas toko).
  const lastByStock = new Map<number, number>()
  let totalAddition = 0
  let totalReduction = 0
  for (const j of journals) {
    lastByStock.set(j.stockId, j.quantityAfter)
    if (j.quantityChange > 0) totalAddition += j.quantityChange
    else totalReduction += -j.quantityChange
  }
  const endingStock = [...lastByStock.values()].reduce((a, b) => a + b, 0)

  return {
    filter,
    product: journals.length > 0 ? { id: productId, name: journals[0].stock.product.name } : null,
    entries,
    summary: { totalAddition, totalReduction, endingStock, entryCount: entries.length },
  }
}
