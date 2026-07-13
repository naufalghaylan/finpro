export const getOtherDiscountAmount = (
  discountAmount: number,
  productDiscountAmount: number,
  storeDiscountAmount: number,
  voucherReferralAmount: number,
) => Math.max(0, discountAmount - productDiscountAmount - storeDiscountAmount - voucherReferralAmount)

export const getReadinessItems = (hasReadyAddress: boolean, hasNearestBranch: boolean, hasShipping: boolean, hasAvailableProducts = true) => [
  { label: 'Alamat berkoordinat', ready: hasReadyAddress },
  { label: 'Cabang pemrosesan tersedia', ready: hasNearestBranch },
  { label: 'Produk tersedia di cabang', ready: hasAvailableProducts },
  { label: 'Layanan pengiriman dipilih', ready: hasShipping },
]
