import type { CheckoutAddress } from '../../types/order'
import { CheckoutAddressDetails } from './CheckoutAddressCard'
import { hasAddressCoordinates } from './checkoutAddressDisplay'

type CheckoutSelectedAddressCardProps = {
  address: CheckoutAddress
}

export function CheckoutSelectedAddressCard({ address }: CheckoutSelectedAddressCardProps) {
  const className = hasAddressCoordinates(address) ? 'selected' : 'warning'

  return (
    <div className={`checkout-address-card checkout-address-active-card ${className}`}>
      <CheckoutAddressDetails address={address} />
    </div>
  )
}
