import { AlertCircle, MapPin, PackageCheck } from 'lucide-react'
import type { CheckoutStore } from '../../types/order'

interface CheckoutStorePanelProps {
  nearestStore: CheckoutStore | null
}

export function CheckoutStorePanel({ nearestStore }: CheckoutStorePanelProps) {
  return (
    <section className="checkout-panel checkout-branch-panel">
      <div className="checkout-section-title">
        <PackageCheck aria-hidden="true" />
        <div>
          <h2>Cabang Pemrosesan</h2>
          <p>Pesanan diproses dari cabang PanenMart yang paling sesuai dengan alamat pengiriman.</p>
        </div>
      </div>

      {nearestStore ? (
        <div className="checkout-store-card">
          <div className="checkout-store-card-main">
            <span className="store-chip">Cabang Terdekat</span>
            <h3>{nearestStore.name}</h3>
            <p className="checkout-store-address">{nearestStore.address}</p>
            <p className="checkout-store-location">
              <MapPin className="size-4 shrink-0 text-(--green)" aria-hidden="true" />
              {nearestStore.city}, {nearestStore.province}
            </p>
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
          Pilih alamat dengan koordinat untuk menentukan cabang PanenMart terdekat.
        </div>
      )}
    </section>
  )
}
