import type { AppliedCheckoutDiscount, CheckoutDiscount, DiscountCartItem } from './order-discount-query.service'

type DiscountCandidate = {
  rule: CheckoutDiscount | null
  amount: number
}

const capDiscount = (amount: number, maxDiscount: number | null) =>
  maxDiscount != null && maxDiscount > 0 ? Math.min(amount, maxDiscount) : amount

const createEmptyCandidate = (): DiscountCandidate => ({ rule: null, amount: 0 })

const selectBetterDiscount = (best: DiscountCandidate, rule: CheckoutDiscount, amount: number) =>
  amount > best.amount ? { rule, amount } : best

const getLineSubtotal = (item: DiscountCartItem) => item.quantity * item.product.basePrice

const getDiscountAmountForBase = (discount: CheckoutDiscount, baseAmount: number) =>
  discount.discountType === 'PERCENTAGE'
    ? capDiscount((baseAmount * discount.discountValue) / 100, discount.maxDiscount)
    : capDiscount(discount.discountValue, discount.maxDiscount)

const getProductDiscountAmount = (item: DiscountCartItem, discount: CheckoutDiscount) => {
  const lineSubtotal = getLineSubtotal(item)
  const amount = discount.discountType === 'BUY_ONE_GET_ONE'
    ? Math.floor(item.quantity / 2) * item.product.basePrice
    : getDiscountAmountForBase(discount, lineSubtotal)

  return Math.min(amount, lineSubtotal)
}

export const getBestProductDiscount = (item: DiscountCartItem, discounts: CheckoutDiscount[]) =>
  discounts
    .filter((discount) => discount.productId === item.productId)
    .reduce((best, discount) => selectBetterDiscount(best, discount, getProductDiscountAmount(item, discount)), createEmptyCandidate())

const isStoreWideDiscount = (discount: CheckoutDiscount) => discount.productId === null

const isEligibleStoreDiscount = (discount: CheckoutDiscount, totalProductAmount: number) =>
  totalProductAmount >= discount.minPurchase && discount.discountType !== 'BUY_ONE_GET_ONE'

const getBestStoreDiscount = (discounts: CheckoutDiscount[], totalProductAmount: number) =>
  discounts
    .filter(isStoreWideDiscount)
    .filter((discount) => isEligibleStoreDiscount(discount, totalProductAmount))
    .reduce((best, discount) => selectBetterDiscount(best, discount, getDiscountAmountForBase(discount, totalProductAmount)), createEmptyCandidate())

const addAppliedDiscount = (appliedDiscounts: AppliedCheckoutDiscount[], candidate: DiscountCandidate) => {
  if (!candidate.rule || candidate.amount <= 0) return
  appliedDiscounts.push({ ...candidate.rule, amount: candidate.amount })
}

const calculateProductDiscounts = (items: DiscountCartItem[], discounts: CheckoutDiscount[]) => {
  const appliedDiscounts: AppliedCheckoutDiscount[] = []
  const productDiscountTotal = items.reduce((total, item) => {
    const bestDiscount = getBestProductDiscount(item, discounts)
    addAppliedDiscount(appliedDiscounts, bestDiscount)
    return total + bestDiscount.amount
  }, 0)

  return { productDiscountTotal, appliedDiscounts }
}

const getTotalCheckoutDiscount = (productDiscountTotal: number, storeDiscount: number, totalProductAmount: number) =>
  Math.min(Math.round(productDiscountTotal + storeDiscount), totalProductAmount)

const roundPositiveDiscounts = (appliedDiscounts: AppliedCheckoutDiscount[]) =>
  appliedDiscounts
    .map((discount) => ({ ...discount, amount: Math.round(discount.amount) }))
    .filter((discount) => discount.amount > 0)

const sumDiscountAmounts = (discounts: AppliedCheckoutDiscount[]) =>
  discounts.reduce((total, discount) => total + discount.amount, 0)

const applyDiscountDelta = (discounts: AppliedCheckoutDiscount[], delta: number) => {
  if (delta === 0 || discounts.length === 0) return discounts
  const lastIndex = discounts.length - 1
  return discounts.map((discount, index) =>
    index === lastIndex ? { ...discount, amount: discount.amount + delta } : discount)
}

const normalizeAppliedDiscounts = (
  appliedDiscounts: AppliedCheckoutDiscount[],
  totalDiscount: number,
) => {
  const roundedDiscounts = roundPositiveDiscounts(appliedDiscounts)
  const delta = totalDiscount - sumDiscountAmounts(roundedDiscounts)
  return applyDiscountDelta(roundedDiscounts, delta).filter((discount) => discount.amount > 0)
}

export const calculateOrderDiscount = (
  items: DiscountCartItem[],
  discounts: CheckoutDiscount[],
  totalProductAmount: number,
) => calculateOrderDiscountBreakdown(items, discounts, totalProductAmount).totalDiscount

export const calculateOrderDiscountBreakdown = (
  items: DiscountCartItem[],
  discounts: CheckoutDiscount[],
  totalProductAmount: number,
) => {
  const productBreakdown = calculateProductDiscounts(items, discounts)
  const storeDiscount = getBestStoreDiscount(discounts, totalProductAmount)
  addAppliedDiscount(productBreakdown.appliedDiscounts, storeDiscount)
  const totalDiscount = getTotalCheckoutDiscount(productBreakdown.productDiscountTotal, storeDiscount.amount, totalProductAmount)

  return {
    totalDiscount,
    appliedDiscounts: normalizeAppliedDiscounts(productBreakdown.appliedDiscounts, totalDiscount),
  }
}

export const getProductDiscountTotalOnly = (items: DiscountCartItem[], discounts: CheckoutDiscount[]) =>
  Math.round(calculateProductDiscounts(items, discounts).productDiscountTotal)

export const getEligibleStoreWideDiscounts = (
  discounts: CheckoutDiscount[],
  totalProductAmount: number,
): AppliedCheckoutDiscount[] =>
  discounts
    .filter(isStoreWideDiscount)
    .filter((discount) => isEligibleStoreDiscount(discount, totalProductAmount))
    .map((discount) => ({
      ...discount,
      amount: Math.round(Math.min(getDiscountAmountForBase(discount, totalProductAmount), totalProductAmount)),
    }))
    .filter((discount) => discount.amount > 0)
