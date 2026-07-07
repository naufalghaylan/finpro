import { CheckoutBackLink } from './CheckoutBackLink'
import { CheckoutEmptyState, CheckoutErrorState, CheckoutLoadingState } from './CheckoutStatePanel'
import { CheckoutFlowSteps } from './CheckoutFlowSteps'
import { CheckoutHeader } from './CheckoutHeader'
import { CheckoutMainLayout } from './CheckoutMainLayout'
import { CheckoutSuccessPanel } from './CheckoutSuccessPanel'
import type { CheckoutController } from './checkoutPageTypes'

type CheckoutPageContentProps = {
  checkout: CheckoutController
}

export function CheckoutPageContent({ checkout }: CheckoutPageContentProps) {
  return (
    <main className="page-main checkout-page">
      <section className="shell checkout-shell">
        <CheckoutBackLink />
        <CheckoutStateContent checkout={checkout} />
      </section>
    </main>
  )
}

function CheckoutStateContent({ checkout }: CheckoutPageContentProps) {
  if (checkout.isLoading) return <CheckoutLoadingState />
  if (checkout.error) return <CheckoutErrorState error={checkout.error} onRetry={() => void checkout.loadPreview(undefined, true)} />
  if (checkout.createdOrder) return <CheckoutSuccessPanel order={checkout.createdOrder} />
  if (checkout.preview) return <CheckoutReadyContent checkout={checkout} />
  return null
}

function CheckoutReadyContent({ checkout }: CheckoutPageContentProps) {
  return (
    <>
      <CheckoutHeader isRefreshingPreview={checkout.isRefreshingPreview} />
      {!checkout.isCartEmpty && <CheckoutFlowSteps />}
      {checkout.isCartEmpty ? <CheckoutEmptyState /> : <CheckoutMainLayout checkout={checkout} />}
    </>
  )
}
