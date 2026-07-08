import { MapPin } from 'lucide-react'
import type { CheckoutStore } from '../../types/order'

type CheckoutStoreCardProps = {
  nearestStore: CheckoutStore
}

export function CheckoutStoreCard({ nearestStore }: CheckoutStoreCardProps) {
  return (
    <div className="checkout-store-card">
      <CheckoutStoreDisplay nearestStore={nearestStore} />
      <CheckoutDistanceBadge nearestStore={nearestStore} />
    </div>
  )
}

function CheckoutStoreDisplay({ nearestStore }: CheckoutStoreCardProps) {
  return (
    <div className="checkout-store-card-main">
      <span className="store-chip">Cabang Terdekat</span>
      <h3>{nearestStore.name}</h3>
      <p className="checkout-store-address">{nearestStore.address}</p>
      <CheckoutStoreLocation nearestStore={nearestStore} />
    </div>
  )
}

function CheckoutStoreLocation({ nearestStore }: CheckoutStoreCardProps) {
  return (
    <p className="checkout-store-location">
      <MapPin className="size-4 shrink-0 text-(--green)" aria-hidden="true" />
      {nearestStore.city}, {nearestStore.province}
    </p>
  )
}

function CheckoutDistanceBadge({ nearestStore }: CheckoutStoreCardProps) {
  const className = nearestStore.isOutOfRange ? 'warning' : 'success'

  return (
    <div className={`checkout-distance-badge ${className}`}>
      <strong>{nearestStore.distance} km</strong>
      <span>{nearestStore.isOutOfRange ? 'Di luar radius' : 'Dalam radius'}</span>
    </div>
  )
}
