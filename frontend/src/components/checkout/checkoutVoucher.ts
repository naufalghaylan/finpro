import type { CartItem } from '../../types/cart'
import type { CheckoutVoucher } from '../../types/order'

export const voucherSourceLabel: Record<CheckoutVoucher['source'], string> = {
  REFERRAL: 'Voucher Referral',
  MIN_PURCHASE_REWARD: 'Voucher Belanja',
  PROMO: 'Voucher Promo',
  FREE_SHIPPING_REWARD: 'Voucher Ongkir',
}

const getDiscountableAmount = (
  voucher: CheckoutVoucher,
  items: CartItem[],
  subtotal: number,
  shippingCost: number,
) => {
  if (voucher.applicableTo === 'SHIPPING') return shippingCost
  if (voucher.applicableTo === 'SPECIFIC_PRODUCT') {
    return items.reduce(
      (total, item) => (item.productId === voucher.productId ? total + item.lineTotal : total),
      0,
    )
  }

  return subtotal
}

export const getVoucherDiscountPreview = (
  voucher: CheckoutVoucher,
  items: CartItem[],
  subtotal: number,
  shippingCost: number,
) => {
  if (subtotal < voucher.minPurchase) return 0

  const discountableAmount = getDiscountableAmount(voucher, items, subtotal, shippingCost)
  if (discountableAmount <= 0) return 0

  const rawDiscount = voucher.discountType === 'PERCENTAGE'
    ? discountableAmount * (voucher.discountValue / 100)
    : voucher.discountType === 'NOMINAL'
      ? voucher.discountValue
      : 0
  const cappedDiscount = voucher.maxDiscount ? Math.min(rawDiscount, voucher.maxDiscount) : rawDiscount

  return Math.min(discountableAmount, Math.max(0, cappedDiscount))
}
