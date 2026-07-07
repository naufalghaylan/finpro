import type { DiscountType } from '../../../generated/prisma/client'
import prisma from '../../../lib/prisma'
import type { DatabaseClient } from '../core/order.types'

type DiscountDb = DatabaseClient | typeof prisma

type DiscountCartItem = {
  productId: number
  quantity: number
  product: {
    basePrice: number
    name?: string
  }
}

export type CheckoutDiscount = {
  id: number
  name: string
  productId: number | null
  discountType: DiscountType
  discountValue: number
  minPurchase: number
  maxDiscount: number | null
  startDate: Date
  endDate: Date
}

export type AppliedCheckoutDiscount = CheckoutDiscount & {
  amount: number
}

// Ambil diskon toko yang sedang berlaku (aktif & dalam rentang tanggal)
export const getActiveStoreDiscounts = async (storeId: number, db: DiscountDb = prisma) => {
  const now = new Date()
  return db.discount.findMany({
    where: {
      storeId,
      isActive: true,
      deletedAt: null,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    select: {
      id: true,
      name: true,
      productId: true,
      discountType: true,
      discountValue: true,
      minPurchase: true,
      maxDiscount: true,
      startDate: true,
      endDate: true,
    },
  })
}

const capDiscount = (amount: number, maxDiscount: number | null) =>
  maxDiscount != null && maxDiscount > 0 ? Math.min(amount, maxDiscount) : amount

// Hitung total potongan diskon-toko untuk sebuah checkout.
// Aturan: tiap produk ambil diskon-produk terbaik (PERCENTAGE/NOMINAL/BOGO),
// lalu tambah satu diskon level-toko terbaik (productId null) bila min. belanja terpenuhi.
// Total dibatasi maksimal sebesar subtotal produk.
export const calculateOrderDiscount = (
  items: DiscountCartItem[],
  discounts: CheckoutDiscount[],
  totalProductAmount: number,
) => {
  return calculateOrderDiscountBreakdown(items, discounts, totalProductAmount).totalDiscount
}

const normalizeAppliedDiscounts = (
  appliedDiscounts: AppliedCheckoutDiscount[],
  totalDiscount: number,
) => {
  const normalizedDiscounts = appliedDiscounts
    .map((discount) => ({ ...discount, amount: Math.round(discount.amount) }))
    .filter((discount) => discount.amount > 0)

  if (normalizedDiscounts.length === 0) return normalizedDiscounts

  const appliedTotal = normalizedDiscounts.reduce((total, discount) => total + discount.amount, 0)
  const delta = totalDiscount - appliedTotal

  if (delta === 0) return normalizedDiscounts

  const lastIndex = normalizedDiscounts.length - 1
  normalizedDiscounts[lastIndex] = {
    ...normalizedDiscounts[lastIndex],
    amount: normalizedDiscounts[lastIndex].amount + delta,
  }

  return normalizedDiscounts.filter((discount) => discount.amount > 0)
}

export const calculateOrderDiscountBreakdown = (
  items: DiscountCartItem[],
  discounts: CheckoutDiscount[],
  totalProductAmount: number,
) => {
  let productDiscountTotal = 0
  const appliedDiscounts: AppliedCheckoutDiscount[] = []

  for (const item of items) {
    const lineSubtotal = item.quantity * item.product.basePrice
    const productDiscounts = discounts.filter((d) => d.productId === item.productId)

    let bestLineDiscount = 0
    let bestLineDiscountRule: CheckoutDiscount | null = null
    for (const d of productDiscounts) {
      let amount = 0
      if (d.discountType === 'BUY_ONE_GET_ONE') {
        amount = Math.floor(item.quantity / 2) * item.product.basePrice
      } else if (d.discountType === 'PERCENTAGE') {
        amount = capDiscount((lineSubtotal * d.discountValue) / 100, d.maxDiscount)
      } else {
        amount = capDiscount(d.discountValue, d.maxDiscount)
      }
      amount = Math.min(amount, lineSubtotal)
      if (amount > bestLineDiscount) {
        bestLineDiscount = amount
        bestLineDiscountRule = d
      }
    }

    if (bestLineDiscountRule && bestLineDiscount > 0) {
      appliedDiscounts.push({ ...bestLineDiscountRule, amount: bestLineDiscount })
    }
    productDiscountTotal += bestLineDiscount
  }

  let storeDiscount = 0
  let storeDiscountRule: CheckoutDiscount | null = null
  const storeWideDiscounts = discounts.filter((d) => d.productId === null)
  for (const d of storeWideDiscounts) {
    if (totalProductAmount < d.minPurchase) continue
    if (d.discountType === 'BUY_ONE_GET_ONE') continue // BOGO butuh produk tertentu

    const amount =
      d.discountType === 'PERCENTAGE'
        ? capDiscount((totalProductAmount * d.discountValue) / 100, d.maxDiscount)
        : capDiscount(d.discountValue, d.maxDiscount)
    if (amount > storeDiscount) {
      storeDiscount = amount
      storeDiscountRule = d
    }
  }

  if (storeDiscountRule && storeDiscount > 0) {
    appliedDiscounts.push({ ...storeDiscountRule, amount: storeDiscount })
  }

  const totalDiscount = Math.min(Math.round(productDiscountTotal + storeDiscount), totalProductAmount)

  return {
    totalDiscount,
    appliedDiscounts: normalizeAppliedDiscounts(appliedDiscounts, totalDiscount),
  }
}

// Hitung diskon toko otomatis untuk satu store + daftar item belanja.
export const calculateStoreDiscountForCheckout = async (
  storeId: number,
  items: DiscountCartItem[],
  totalProductAmount: number,
  db: DiscountDb = prisma,
) => {
  if (items.length === 0 || totalProductAmount <= 0) return 0
  const activeDiscounts = await getActiveStoreDiscounts(storeId, db)
  return calculateOrderDiscount(items, activeDiscounts, totalProductAmount)
}

export const getStoreDiscountBreakdownForCheckout = async (
  storeId: number,
  items: DiscountCartItem[],
  totalProductAmount: number,
  db: DiscountDb = prisma,
) => {
  if (items.length === 0 || totalProductAmount <= 0) {
    return { totalDiscount: 0, appliedDiscounts: [] }
  }

  const activeDiscounts = await getActiveStoreDiscounts(storeId, db)
  return calculateOrderDiscountBreakdown(items, activeDiscounts, totalProductAmount)
}
