import { CheckoutShippingPanel } from './CheckoutShippingPanel'
import type { CheckoutController } from './checkoutPageTypes'

type CheckoutShippingConnectorProps = {
  checkout: CheckoutController
}

export function CheckoutShippingConnector({ checkout }: CheckoutShippingConnectorProps) {
  return <CheckoutShippingPanel {...getShippingPanelProps(checkout)} />
}

function getShippingPanelProps(checkout: CheckoutController) {
  return {
    hasSelectedAddressCoordinates: checkout.hasSelectedAddressCoordinates,
    hasNearestStore: Boolean(checkout.preview!.nearestStore),
    selectedCourier: checkout.selectedCourier,
    courierServices: checkout.courierServices,
    selectedShippingService: checkout.selectedShippingService,
    fetchingCouriers: checkout.fetchingCouriers,
    shippingError: checkout.shippingError,
    onCourierChange: createCourierChangeHandler(checkout),
    onShippingServiceChange: checkout.setSelectedShippingService,
  }
}

function createCourierChangeHandler(checkout: CheckoutController) {
  return (courier: string) => {
    checkout.setSelectedCourier(courier)
    if (courier && !checkout.courierServices[courier]) void checkout.fetchShippingForCourier(courier)
  }
}
