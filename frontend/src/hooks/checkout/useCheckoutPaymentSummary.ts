import { useMemo } from 'react'
import { getVoucherDiscountPreview } from '../../components/checkout/checkoutVoucher'
import type { CheckoutPreview, CheckoutStoreDiscount, CheckoutVoucher } from '../../types/order'
import type { ShippingCostResult } from '../../api/rajaongkir'

export function useCheckoutPaymentSummary(
  preview: CheckoutPreview | null,
  selectedVoucher: CheckoutVoucher | null,
  selectedShippingService: ShippingCostResult | null,
  selectedStoreDiscount: CheckoutStoreDiscount | null,
) {
  return useMemo(() => {
    const subtotal = preview?.cart.summary.subtotal ?? 0
    const shippingCost = selectedShippingService?.cost ?? 0
    // Diskon per-produk otomatis dari backend.
    const productDiscountAmount = preview?.productDiscountAmount ?? 0
    // Diskon toko hanya yang dipilih user (maks 1).
    const storeDiscountAmount = selectedStoreDiscount?.amount ?? 0
    const selectedVoucherAmount = selectedVoucher && preview
      ? getVoucherDiscountPreview(selectedVoucher, preview.cart.items, subtotal, shippingCost)
      : 0
    const voucherReferralAmount = selectedVoucher?.source === 'REFERRAL' ? selectedVoucherAmount : 0
    const voucherOtherAmount = selectedVoucher && selectedVoucher.source !== 'REFERRAL' ? selectedVoucherAmount : 0
    const discountAmount = productDiscountAmount + storeDiscountAmount + voucherReferralAmount + voucherOtherAmount

    return {
      subtotal,
      shippingCost,
      productDiscountAmount,
      storeDiscountAmount,
      voucherReferralAmount,
      discountAmount,
      totalPayment: Math.max(0, subtotal - discountAmount + shippingCost),
    }
  }, [preview, selectedVoucher, selectedShippingService, selectedStoreDiscount])
}
