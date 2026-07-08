import { CheckoutMainColumn } from './CheckoutMainColumn'
import { CheckoutSummaryConnector } from './CheckoutSummaryConnector'
import type { CheckoutController } from './checkoutPageTypes'

type CheckoutMainLayoutProps = {
  checkout: CheckoutController
}

export function CheckoutMainLayout({ checkout }: CheckoutMainLayoutProps) {
  return (
    <div className="checkout-layout">
      <CheckoutMainColumn checkout={checkout} />
      <CheckoutSummaryConnector checkout={checkout} />
    </div>
  )
}
