import type { CheckoutStoreDiscount } from '../../types/order'

export const getDisplayedDiscounts = (
  discounts: CheckoutStoreDiscount[],
  amount: number,
): CheckoutStoreDiscount[] => discounts.length > 0 ? discounts : getFallbackDiscounts(amount)

const getFallbackDiscounts = (amount: number) =>
  amount > 0 ? [createFallbackDiscount(amount)] : []

const createFallbackDiscount = (amount: number) => ({
  id: 0,
  name: 'Diskon Toko',
  productId: null,
  discountType: 'NOMINAL' as const,
  discountValue: amount,
  minPurchase: 0,
  maxDiscount: null,
  startDate: '',
  endDate: '',
  amount,
})
