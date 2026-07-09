import { CheckoutSummaryPanel, type CheckoutSummaryPanelProps } from './CheckoutSummaryPanel'
import type { CheckoutController } from './checkoutPageTypes'

type CheckoutSummaryConnectorProps = {
  checkout: CheckoutController
}

export function CheckoutSummaryConnector({ checkout }: CheckoutSummaryConnectorProps) {
  return <CheckoutSummaryPanel {...getCheckoutSummaryProps(checkout)} />
}

function getCheckoutSummaryProps(checkout: CheckoutController): CheckoutSummaryPanelProps {
  return {
    totalQuantity: checkout.preview!.cart.summary.totalQuantity,
    selectedShippingService: checkout.selectedShippingService,
    isSubmitting: checkout.isSubmitting,
    onCreateOrder: checkout.handleCreateOrder,
    ...getSummaryMoneyProps(checkout),
    ...getSummaryReadinessProps(checkout),
  }
}

function getSummaryMoneyProps({ paymentSummary }: CheckoutController) {
  return {
    subtotal: paymentSummary.subtotal,
    productDiscountAmount: paymentSummary.productDiscountAmount,
    storeDiscountAmount: paymentSummary.storeDiscountAmount,
    voucherReferralAmount: paymentSummary.voucherReferralAmount,
    discountAmount: paymentSummary.discountAmount,
    totalPayment: paymentSummary.totalPayment,
  }
}

function getSummaryReadinessProps(checkout: CheckoutController) {
  return {
    hasSelectedAddressCoordinates: checkout.hasSelectedAddressCoordinates,
    hasSelectedAddress: Boolean(checkout.selectedAddress),
    hasNearestBranch: Boolean(checkout.preview!.nearestStore),
    canCreateOrder: checkout.canCreateOrder,
  }
}
