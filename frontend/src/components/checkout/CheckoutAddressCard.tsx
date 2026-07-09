import type { CheckoutAddress } from '../../types/order'
import { getAddressLine, getCoordinateClassName, getCoordinateLabel, hasAddressCoordinates } from './checkoutAddressDisplay'

type CheckoutAddressCardProps = {
  address: CheckoutAddress
  isSelected: boolean
  onSelect: (addressId: number) => void
  className?: string
}

export function CheckoutAddressCard({ address, isSelected, onSelect, className = '' }: CheckoutAddressCardProps) {
  const hasCoordinates = hasAddressCoordinates(address)

  return (
    <label className={`checkout-address-card ${isSelected ? 'selected' : ''} ${!hasCoordinates ? 'warning' : ''} ${className}`.trim()}>
      <input type="radio" checked={isSelected} onChange={() => onSelect(address.id)} />
      <CheckoutAddressDetails address={address} />
    </label>
  )
}

export function CheckoutAddressDetails({ address }: { address: CheckoutAddress }) {
  return (
    <>
      <span className="checkout-address-topline"><strong>{address.recipientName}</strong>{address.isPrimary && <em>Utama</em>}</span>
      <span className="checkout-address-phone">{address.phone}</span>
      <span className="checkout-address-detail">{address.address}</span>
      <span className="checkout-address-area">{getAddressLine(address)}</span>
      <span className={getCoordinateClassName(address)}>{getCoordinateLabel(address)}</span>
    </>
  )
}
