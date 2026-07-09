import type { DiscountType } from '../../../generated/prisma/client'
import prisma from '../../../lib/prisma'
import type { DatabaseClient } from '../core/order.types'

export type DiscountDb = DatabaseClient | typeof prisma
type DiscountScope = 'all' | 'store-wide'
type ActiveDiscountOptions = {
  scope?: DiscountScope
}

export type DiscountCartItem = {
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

export const checkoutDiscountSelect = {
  id: true,
  name: true,
  productId: true,
  discountType: true,
  discountValue: true,
  minPurchase: true,
  maxDiscount: true,
  startDate: true,
  endDate: true,
} as const

const getActiveDiscountWhere = (storeId: number, now: Date, options?: ActiveDiscountOptions) => ({
  storeId,
  isActive: true,
  deletedAt: null,
  startDate: { lte: now },
  endDate: { gte: now },
  ...(options?.scope === 'store-wide' ? { productId: null } : {}),
})

export const getActiveStoreDiscounts = async (
  storeId: number,
  db: DiscountDb = prisma,
  options?: ActiveDiscountOptions,
) =>
  db.discount.findMany({
    where: getActiveDiscountWhere(storeId, new Date(), options),
    select: checkoutDiscountSelect,
  })
