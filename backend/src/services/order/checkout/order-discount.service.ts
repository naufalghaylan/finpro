import {
  getActiveStoreDiscounts,
  type AppliedCheckoutDiscount,
  type DiscountCartItem,
  type DiscountDb,
} from './order-discount-query.service'
import {
  getEligibleStoreWideDiscounts,
  getProductDiscountTotalOnly,
} from './order-discount-calculation.service'

export {
  checkoutDiscountSelect,
  getActiveStoreDiscounts,
  type AppliedCheckoutDiscount,
  type CheckoutDiscount,
  type DiscountCartItem,
} from './order-discount-query.service'

export {
  calculateOrderDiscount,
  calculateOrderDiscountBreakdown,
  getBestProductDiscount,
} from './order-discount-calculation.service'

export const getCheckoutStoreDiscountOptions = async (
  storeId: number,
  items: DiscountCartItem[],
  totalProductAmount: number,
  db?: DiscountDb,
) => {
  if (items.length === 0 || totalProductAmount <= 0) {
    return { productDiscountAmount: 0, availableStoreDiscounts: [] as AppliedCheckoutDiscount[] }
  }

  const activeDiscounts = await getActiveStoreDiscounts(storeId, db)
  return {
    productDiscountAmount: getProductDiscountTotalOnly(items, activeDiscounts),
    availableStoreDiscounts: getEligibleStoreWideDiscounts(activeDiscounts, totalProductAmount),
  }
}

export const resolveCheckoutDiscount = async (
  storeId: number,
  items: DiscountCartItem[],
  totalProductAmount: number,
  selectedStoreDiscountId?: number,
  db?: DiscountDb,
) => {
  if (items.length === 0 || totalProductAmount <= 0) {
    return { productDiscountAmount: 0, storeDiscountAmount: 0, totalDiscount: 0 }
  }

  const activeDiscounts = await getActiveStoreDiscounts(storeId, db)
  const productDiscountAmount = getProductDiscountTotalOnly(items, activeDiscounts)
  const selected = selectedStoreDiscountId
    ? getEligibleStoreWideDiscounts(activeDiscounts, totalProductAmount).find((discount) => discount.id === selectedStoreDiscountId)
    : undefined
  const storeDiscountAmount = selected?.amount ?? 0
  const totalDiscount = Math.min(productDiscountAmount + storeDiscountAmount, totalProductAmount)

  return { productDiscountAmount, storeDiscountAmount, totalDiscount }
}
