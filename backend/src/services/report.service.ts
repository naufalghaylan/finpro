import prisma from '../lib/prisma'
import { OrderStatus, Prisma } from '../generated/prisma/client'

// Order yang dihitung sebagai penjualan: sudah dibayar sampai selesai.
// Dikecualikan: PENDING_PAYMENT (belum bayar) & CANCELLED (batal).
export const SALES_STATUSES: OrderStatus[] = [
  OrderStatus.WAITING_CONFIRMATION,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.CONFIRMED,
]

export interface SalesReportFilter {
  storeId?: number
  year: number
  month?: number // 1-12, opsional
}

export interface SalesSummary {
  totalRevenue: number // Order.totalAmount (final dibayar) — headline
  totalProductAmount: number // subtotal produk sebelum diskon & ongkir
  totalDiscount: number
  totalShipping: number
  orderCount: number
  itemCount: number
}

export interface SalesMonthlyPoint {
  month: number // 1-12
  revenue: number
  orderCount: number
}

export interface SalesByProduct {
  productId: number
  productName: string
  quantity: number
  revenue: number // sum OrderItem.subtotal
}

export interface SalesByCategory {
  categoryId: number
  categoryName: string
  quantity: number
  revenue: number
}

export interface SalesReport {
  filter: SalesReportFilter
  summary: SalesSummary
  monthly: SalesMonthlyPoint[]
  byProduct: SalesByProduct[]
  byCategory: SalesByCategory[]
}

// Rentang tanggal [start, end) berdasarkan tahun & (opsional) bulan.
function resolveDateRange(year: number, month?: number): { start: Date; end: Date } {
  if (month) {
    return { start: new Date(year, month - 1, 1), end: new Date(year, month, 1) }
  }
  return { start: new Date(year, 0, 1), end: new Date(year + 1, 0, 1) }
}

export async function getSalesReport(filter: SalesReportFilter): Promise<SalesReport> {
  const { storeId, year, month } = filter
  const { start, end } = resolveDateRange(year, month)

  const orderWhere: Prisma.OrderWhereInput = {
    status: { in: SALES_STATUSES },
    createdAt: { gte: start, lt: end },
    ...(storeId ? { storeId } : {}),
  }

  // 1) Order-level: summary + tren bulanan (selalu 12 baris Jan–Des)
  const orders = await prisma.order.findMany({
    where: orderWhere,
    select: {
      createdAt: true,
      totalAmount: true,
      totalProductAmount: true,
      discountAmount: true,
      shippingCost: true,
    },
  })

  const monthlyMap = new Map<number, SalesMonthlyPoint>()
  for (let m = 1; m <= 12; m++) monthlyMap.set(m, { month: m, revenue: 0, orderCount: 0 })

  const summary: SalesSummary = {
    totalRevenue: 0,
    totalProductAmount: 0,
    totalDiscount: 0,
    totalShipping: 0,
    orderCount: orders.length,
    itemCount: 0,
  }

  for (const o of orders) {
    summary.totalRevenue += o.totalAmount
    summary.totalProductAmount += o.totalProductAmount
    summary.totalDiscount += o.discountAmount
    summary.totalShipping += o.shippingCost

    const point = monthlyMap.get(o.createdAt.getMonth() + 1)!
    point.revenue += o.totalAmount
    point.orderCount += 1
  }

  // 2) Item-level: agregasi per produk & per kategori dalam satu query
  const items = await prisma.orderItem.findMany({
    where: { order: orderWhere },
    select: {
      productId: true,
      quantity: true,
      subtotal: true,
      product: {
        select: {
          name: true,
          categoryId: true,
          category: { select: { name: true } },
        },
      },
    },
  })

  const productMap = new Map<number, SalesByProduct>()
  const categoryMap = new Map<number, SalesByCategory>()

  for (const it of items) {
    summary.itemCount += it.quantity

    const p = productMap.get(it.productId) ?? {
      productId: it.productId,
      productName: it.product.name,
      quantity: 0,
      revenue: 0,
    }
    p.quantity += it.quantity
    p.revenue += it.subtotal
    productMap.set(it.productId, p)

    const catId = it.product.categoryId
    const c = categoryMap.get(catId) ?? {
      categoryId: catId,
      categoryName: it.product.category?.name ?? 'Tanpa Kategori',
      quantity: 0,
      revenue: 0,
    }
    c.quantity += it.quantity
    c.revenue += it.subtotal
    categoryMap.set(catId, c)
  }

  const byProduct = [...productMap.values()].sort((a, b) => b.revenue - a.revenue)
  const byCategory = [...categoryMap.values()].sort((a, b) => b.revenue - a.revenue)

  return { filter, summary, monthly: [...monthlyMap.values()], byProduct, byCategory }
}
