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
  if (voucher.applicableTo === 'SPECIFIC_PRODUCT') return getProductDiscountableAmount(voucher, items)
  return subtotal
}

const getProductDiscountableAmount = (voucher: CheckoutVoucher, items: CartItem[]) =>
  items.reduce((total, item) => (item.productId === voucher.productId ? total + item.lineTotal : total), 0)

export const getVoucherDiscountPreview = (
  voucher: CheckoutVoucher,
  items: CartItem[],
  subtotal: number,
  shippingCost: number,
) => {
  if (subtotal < voucher.minPurchase) return 0

  const discountableAmount = getDiscountableAmount(voucher, items, subtotal, shippingCost)
  if (discountableAmount <= 0) return 0

  return getFinalVoucherDiscount(voucher, discountableAmount)
}

const getFinalVoucherDiscount = (voucher: CheckoutVoucher, discountableAmount: number) => {
  const cappedDiscount = getCappedVoucherDiscount(voucher, discountableAmount)
  return Math.min(discountableAmount, Math.max(0, cappedDiscount))
}

const getCappedVoucherDiscount = (voucher: CheckoutVoucher, discountableAmount: number) => {
  const rawDiscount = getRawVoucherDiscount(voucher, discountableAmount)
  return voucher.maxDiscount ? Math.min(rawDiscount, voucher.maxDiscount) : rawDiscount
}

const getRawVoucherDiscount = (voucher: CheckoutVoucher, discountableAmount: number) => {
  if (voucher.discountType === 'PERCENTAGE') return discountableAmount * (voucher.discountValue / 100)
  if (voucher.discountType === 'NOMINAL') return voucher.discountValue
  return 0
}
