import { useMemo } from 'react'
import { getVoucherDiscountPreview } from '../../components/checkout/checkoutVoucher'
import type { CheckoutPreview, CheckoutVoucher } from '../../types/order'
import type { ShippingCostResult } from '../../api/rajaongkir'

export function useCheckoutPaymentSummary(
  preview: CheckoutPreview | null,
  selectedVoucher: CheckoutVoucher | null,
  selectedShippingService: ShippingCostResult | null,
) {
  return useMemo(() => {
    const subtotal = preview?.cart.summary.subtotal ?? 0
    const shippingCost = selectedShippingService?.cost ?? 0
    const storeDiscountAmount = preview?.cart.summary.storeDiscountAmount ?? 0
    const selectedVoucherAmount = selectedVoucher && preview
      ? getVoucherDiscountPreview(selectedVoucher, preview.cart.items, subtotal, shippingCost)
      : 0
    const voucherReferralAmount = selectedVoucher?.source === 'REFERRAL'
      ? selectedVoucherAmount
      : preview?.cart.summary.voucherReferralAmount ?? 0
    const discountAmount =
      preview?.cart.summary.discountAmount ??
      storeDiscountAmount + voucherReferralAmount + (selectedVoucher?.source !== 'REFERRAL' ? selectedVoucherAmount : 0)

    return {
      subtotal,
      shippingCost,
      storeDiscountAmount,
      voucherReferralAmount,
      discountAmount,
      totalPayment: Math.max(0, subtotal - discountAmount + shippingCost),
    }
  }, [
    preview?.cart.summary.discountAmount,
    preview?.cart.summary.storeDiscountAmount,
    preview?.cart.summary.subtotal,
    preview?.cart.summary.voucherReferralAmount,
    preview?.cart.items,
    selectedVoucher,
    selectedShippingService,
  ])
}
