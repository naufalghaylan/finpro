import { DiscountType, VoucherApplicableTo } from '../../generated/prisma/client'
import prisma from '../../lib/prisma'
import { ORDER_ERRORS, OrderServiceError } from '../order.errors'
import { DatabaseClient } from './order.types'

type CheckoutDb = DatabaseClient | typeof prisma

export type CheckoutVoucher = {
  id: number
  code: string
  name: string
  productId: number | null
  source: string
  discountType: DiscountType
  discountValue: number
  maxDiscount: number | null
  minPurchase: number
  applicableTo: VoucherApplicableTo
  expiredAt: Date
}

export type CheckoutCartItem = {
  productId: number
  quantity: number
  product: {
    basePrice: number
  }
}

const voucherSelect = {
  id: true,
  code: true,
  name: true,
  productId: true,
  source: true,
  discountType: true,
  discountValue: true,
  maxDiscount: true,
  minPurchase: true,
  applicableTo: true,
  expiredAt: true,
} as const

export const getAvailableCheckoutVouchers = (userId: number, db: CheckoutDb = prisma) =>
  db.voucher.findMany({
    where: {
      userId,
      used: false,
      expiredAt: { gt: new Date() },
    },
    select: voucherSelect,
    orderBy: { expiredAt: 'asc' },
  })

export const getDiscountableAmount = (
  voucher: CheckoutVoucher,
  cartItems: CheckoutCartItem[],
  totalProductAmount: number,
  shippingCost: number,
) => {
  if (voucher.applicableTo === VoucherApplicableTo.SHIPPING) {
    return shippingCost
  }

  if (voucher.applicableTo === VoucherApplicableTo.SPECIFIC_PRODUCT) {
    return cartItems.reduce((total, item) => (
      item.productId === voucher.productId
        ? total + item.quantity * item.product.basePrice
        : total
    ), 0)
  }

  return totalProductAmount
}

export const calculateVoucherDiscount = ({
  voucher,
  cartItems,
  totalProductAmount,
  shippingCost,
}: {
  voucher: CheckoutVoucher
  cartItems: CheckoutCartItem[]
  totalProductAmount: number
  shippingCost: number
}) => {
  if (totalProductAmount < voucher.minPurchase) return 0

  const discountableAmount = getDiscountableAmount(
    voucher,
    cartItems,
    totalProductAmount,
    shippingCost,
  )
  if (discountableAmount <= 0) return 0

  const rawDiscount = voucher.discountType === DiscountType.PERCENTAGE
    ? discountableAmount * (voucher.discountValue / 100)
    : voucher.discountType === DiscountType.NOMINAL
      ? voucher.discountValue
      : 0

  const cappedDiscount = voucher.maxDiscount
    ? Math.min(rawDiscount, voucher.maxDiscount)
    : rawDiscount

  return Math.min(discountableAmount, Math.max(0, cappedDiscount))
}

export const getCheckoutVoucher = async (userId: number, voucherId: number, db: CheckoutDb) => {
  const voucher = await db.voucher.findFirst({
    where: {
      id: voucherId,
      userId,
      used: false,
      expiredAt: { gt: new Date() },
    },
    select: voucherSelect,
  })

  if (!voucher) {
    throw new OrderServiceError(
      ORDER_ERRORS.VOUCHER_NOT_AVAILABLE,
      'Voucher tidak tersedia atau sudah tidak berlaku',
      400,
    )
  }

  return voucher
}
