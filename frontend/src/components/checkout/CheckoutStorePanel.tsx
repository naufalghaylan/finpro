import { AlertCircle, Store } from 'lucide-react'
import type { CheckoutStore } from '../../types/order'

interface CheckoutStorePanelProps {
  nearestStore: CheckoutStore | null
}

export function CheckoutStorePanel({ nearestStore }: CheckoutStorePanelProps) {
  return (
    <section className="checkout-panel">
      <div className="checkout-section-title">
        <Store aria-hidden="true" />
        <div>
          <h2>Store Terdekat</h2>
          <p>Order akan diarahkan ke gudang/store paling dekat dari alamat yang dipilih.</p>
        </div>
      </div>

      {nearestStore ? (
        <div className="checkout-store-card">
          <div>
            <span className="store-chip">Store Terpilih</span>
            <h3>{nearestStore.name}</h3>
            <p>{nearestStore.address}</p>
            <p>{nearestStore.city}, {nearestStore.province}</p>
          </div>
          <div
            className={`checkout-distance-badge ${
              nearestStore.isOutOfRange ? 'warning' : 'success'
            }`}
          >
            <strong>{nearestStore.distance} km</strong>
            <span>{nearestStore.isOutOfRange ? 'Di luar radius' : 'Dalam radius'}</span>
          </div>
        </div>
      ) : (
        <div className="checkout-inline-alert">
          <AlertCircle aria-hidden="true" />
          Pilih alamat dengan koordinat untuk menghitung store terdekat.
        </div>
      )}
    </section>
  )
}
