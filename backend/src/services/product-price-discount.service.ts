import { DiscountType } from '../generated/prisma/client'

type ProductPriceDiscount = {
  discountType: DiscountType
  discountValue: number
  isActive?: boolean
}

export const getDiscountedProductUnitPrice = (
  basePrice: number,
  discounts: ProductPriceDiscount[] = [],
) => {
  const priceCutAmount = discounts
    .filter((discount) => discount.isActive ?? true)
    .reduce((bestAmount, discount) => {
      let amount = 0

      if (discount.discountType === DiscountType.PERCENTAGE) {
        amount = (basePrice * discount.discountValue) / 100
      } else if (discount.discountType === DiscountType.NOMINAL) {
        amount = discount.discountValue
      }

      return Math.max(bestAmount, Math.min(amount, basePrice))
    }, 0)

  return Math.max(0, basePrice - priceCutAmount)
}
