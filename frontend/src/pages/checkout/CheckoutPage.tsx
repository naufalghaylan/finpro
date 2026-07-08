import { Navbar } from '../../components/common/Navbar'
import { CheckoutMobileCreateOrderBar } from '../../components/checkout/CheckoutMobileCreateOrderBar'
import { CheckoutPageContent } from '../../components/checkout/CheckoutPageContent'
import { HomeFooter } from '../../components/home/HomeFooter'
import { BRAND, footerSections, navLinks } from '../../data/home/homeData'
import { useCheckout } from '../../hooks/checkout/useCheckout'

function CheckoutPage() {
  const checkout = useCheckout()

  return (
    <div className="page checkout-flow-page">
      <Navbar brandName={BRAND.name} links={navLinks} />
      <CheckoutPageContent checkout={checkout} />
      {shouldShowMobileBar(checkout) && <CheckoutMobileCreateOrderBar canCreateOrder={checkout.canCreateOrder} isSubmitting={checkout.isSubmitting} totalPayment={checkout.paymentSummary.totalPayment} onCreateOrder={checkout.handleCreateOrder} />}
      <HomeFooter sections={footerSections} brandName={BRAND.name} />
    </div>
  )
}

const shouldShowMobileBar = (checkout: ReturnType<typeof useCheckout>) =>
  Boolean(checkout.preview) && !checkout.isCartEmpty && !checkout.createdOrder && !checkout.isLoading && !checkout.error

export default CheckoutPage
