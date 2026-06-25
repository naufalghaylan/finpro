import type { DiscountType } from './order-status.types'

export type VoucherSource = 'REFERRAL' | 'MIN_PURCHASE_REWARD' | 'PROMO' | 'FREE_SHIPPING_REWARD'
export type VoucherApplicableTo = 'ALL_PRODUCTS' | 'SPECIFIC_PRODUCT' | 'SHIPPING'

export type OrderVoucher = {
  id: number
  code: string
  name: string
  productId: number | null
  source: VoucherSource
  discountType: DiscountType
  discountValue: number
  maxDiscount: number | null
  minPurchase: number
  applicableTo: VoucherApplicableTo
  expiredAt: string
}

export type CheckoutVoucher = OrderVoucher
