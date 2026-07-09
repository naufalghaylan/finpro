import type { DiscountType } from '../../../generated/prisma/client'
import prisma from '../../../lib/prisma'
import type { DatabaseClient } from '../core/order.types'

type DiscountDb = DatabaseClient | typeof prisma
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

type DiscountCandidate = {
  rule: CheckoutDiscount | null
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

// Ambil diskon toko yang sedang berlaku (aktif & dalam rentang tanggal)
export const getActiveStoreDiscounts = async (
  storeId: number,
  db: DiscountDb = prisma,
  options?: ActiveDiscountOptions,
) =>
  db.discount.findMany({
    where: getActiveDiscountWhere(storeId, new Date(), options),
    select: checkoutDiscountSelect,
  })

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

// Hitung total potongan diskon-toko untuk sebuah checkout.
// Aturan: tiap produk ambil diskon-produk terbaik (PERCENTAGE/NOMINAL/BOGO),
// lalu tambah satu diskon level-toko terbaik (productId null) bila min. belanja terpenuhi.
// Total dibatasi maksimal sebesar subtotal produk.
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

// Hitung diskon toko otomatis untuk satu store + daftar item belanja.
export const calculateStoreDiscountForCheckout = async (
  storeId: number,
  items: DiscountCartItem[],
  totalProductAmount: number,
  db: DiscountDb = prisma,
  options?: ActiveDiscountOptions,
) => {
  if (items.length === 0 || totalProductAmount <= 0) return 0
  const activeDiscounts = await getActiveStoreDiscounts(storeId, db, options)
  return calculateOrderDiscount(items, activeDiscounts, totalProductAmount)
}

export const getStoreDiscountBreakdownForCheckout = async (
  storeId: number,
  items: DiscountCartItem[],
  totalProductAmount: number,
  db: DiscountDb = prisma,
  options?: ActiveDiscountOptions,
) => {
  if (items.length === 0 || totalProductAmount <= 0) {
    return { totalDiscount: 0, appliedDiscounts: [] }
  }

  const activeDiscounts = await getActiveStoreDiscounts(storeId, db, options)
  return calculateOrderDiscountBreakdown(items, activeDiscounts, totalProductAmount)
}

// ── Diskon toko yang DIPILIH user (1 saja) + diskon produk yang OTOMATIS ──────

// Total potongan dari diskon per-produk (productId terisi). Selalu otomatis.
const getProductDiscountTotalOnly = (items: DiscountCartItem[], discounts: CheckoutDiscount[]) =>
  Math.round(calculateProductDiscounts(items, discounts).productDiscountTotal)

// Daftar diskon toko (productId null) yang memenuhi syarat, tiap opsi dengan amount terhitung.
const getEligibleStoreWideDiscounts = (
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

// Untuk halaman checkout: diskon produk otomatis + daftar opsi diskon toko.
export const getCheckoutStoreDiscountOptions = async (
  storeId: number,
  items: DiscountCartItem[],
  totalProductAmount: number,
  db: DiscountDb = prisma,
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

// Saat membuat order: diskon produk (otomatis) + satu diskon toko yang dipilih user.
export const resolveCheckoutDiscount = async (
  storeId: number,
  items: DiscountCartItem[],
  totalProductAmount: number,
  selectedStoreDiscountId?: number,
  db: DiscountDb = prisma,
) => {
  if (items.length === 0 || totalProductAmount <= 0) {
    return { productDiscountAmount: 0, storeDiscountAmount: 0, totalDiscount: 0 }
  }

  const activeDiscounts = await getActiveStoreDiscounts(storeId, db)
  const productDiscountAmount = getProductDiscountTotalOnly(items, activeDiscounts)
  const selected = selectedStoreDiscountId
    ? getEligibleStoreWideDiscounts(activeDiscounts, totalProductAmount).find((d) => d.id === selectedStoreDiscountId)
    : undefined
  const storeDiscountAmount = selected?.amount ?? 0
  const totalDiscount = Math.min(productDiscountAmount + storeDiscountAmount, totalProductAmount)

  return { productDiscountAmount, storeDiscountAmount, totalDiscount }
}
