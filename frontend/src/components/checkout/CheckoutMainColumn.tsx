import { CheckoutAddressList } from './CheckoutAddressList'
import { CheckoutDiscountPanel } from './CheckoutDiscountPanel'
import { CheckoutNotesPanel } from './CheckoutNotesPanel'
import { CheckoutPaymentPanel } from './CheckoutPaymentPanel'
import { CheckoutProductList } from './CheckoutProductList'
import { CheckoutShippingConnector } from './CheckoutShippingConnector'
import { CheckoutStorePanel } from './CheckoutStorePanel'
import { CheckoutVoucherPanel } from './CheckoutVoucherPanel'
import type { CheckoutController } from './checkoutPageTypes'

type CheckoutMainColumnProps = {
  checkout: CheckoutController
}

export function CheckoutMainColumn({ checkout }: CheckoutMainColumnProps) {
  return (
    <div className="checkout-main-column">
      <CheckoutAddressProductGroup checkout={checkout} />
      <CheckoutShippingDiscountGroup checkout={checkout} />
      <CheckoutPaymentNotesGroup checkout={checkout} />
    </div>
  )
}

function CheckoutAddressProductGroup({ checkout }: CheckoutMainColumnProps) {
  return (
    <>
      <CheckoutAddressList addresses={checkout.preview!.addresses} selectedAddressId={checkout.selectedAddressId} onAddressChange={checkout.handleAddressChange} onAddressAdded={() => { void checkout.loadPreview() }} />
      <CheckoutProductList items={checkout.preview!.cart.items} />
      <CheckoutStorePanel nearestStore={checkout.preview!.nearestStore} />
    </>
  )
}

function CheckoutShippingDiscountGroup({ checkout }: CheckoutMainColumnProps) {
  return (
    <>
      <CheckoutShippingConnector checkout={checkout} />
      <CheckoutDiscountPanel availableDiscountAmount={checkout.paymentSummary.availableStoreDiscount} discounts={checkout.preview!.storeDiscounts ?? []} isApplied={checkout.useStoreDiscount} onToggleApply={checkout.setUseStoreDiscount} />
      <CheckoutVoucherPanel vouchers={checkout.preview!.vouchers ?? []} items={checkout.preview!.cart.items} subtotal={checkout.paymentSummary.subtotal} shippingCost={checkout.paymentSummary.shippingCost} selectedVoucherId={checkout.selectedVoucherId} onVoucherChange={checkout.setSelectedVoucherId} />
    </>
  )
}

function CheckoutPaymentNotesGroup({ checkout }: CheckoutMainColumnProps) {
  return (
    <>
      <CheckoutPaymentPanel paymentMethods={checkout.preview!.paymentMethods} selectedPaymentMethod={checkout.paymentMethod} onPaymentMethodChange={checkout.setPaymentMethod} />
      <CheckoutNotesPanel notes={checkout.notes} onNotesChange={checkout.setNotes} />
    </>
  )
}
