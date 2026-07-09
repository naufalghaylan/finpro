export const getOtherDiscountAmount = (
  discountAmount: number,
  productDiscountAmount: number,
  storeDiscountAmount: number,
  voucherReferralAmount: number,
) => Math.max(0, discountAmount - productDiscountAmount - storeDiscountAmount - voucherReferralAmount)

export const getReadinessItems = (hasReadyAddress: boolean, hasNearestBranch: boolean, hasShipping: boolean) => [
  { label: 'Alamat berkoordinat', ready: hasReadyAddress },
  { label: 'Cabang pemrosesan tersedia', ready: hasNearestBranch },
  { label: 'Layanan pengiriman dipilih', ready: hasShipping },
]
