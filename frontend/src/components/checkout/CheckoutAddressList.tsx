import { AlertCircle, MapPin } from 'lucide-react'
import type { CheckoutAddress } from '../../types/order'

interface CheckoutAddressListProps {
  addresses: CheckoutAddress[]
  selectedAddressId: number | null
  onAddressChange: (addressId: number) => void
}

const getAddressLine = (address: CheckoutAddress) =>
  [address.district, address.city, address.province, address.postalCode]
    .filter(Boolean)
    .join(', ')

export function CheckoutAddressList({
  addresses,
  selectedAddressId,
  onAddressChange,
}: CheckoutAddressListProps) {
  return (
    <section className="checkout-panel">
      <div className="checkout-section-title">
        <MapPin aria-hidden="true" />
        <div>
          <h2>Alamat Pengiriman</h2>
          <p>Pilih alamat berkoordinat agar cabang PanenMart terdekat bisa dihitung.</p>
        </div>
      </div>

      {addresses.length === 0 ? (
        <div className="checkout-inline-alert">
          <AlertCircle aria-hidden="true" />
          Belum ada alamat tersimpan. Tambahkan alamat terlebih dahulu di profil.
        </div>
      ) : (
        <div className="checkout-address-grid">
          {addresses.map((address) => {
            const hasCoordinates = address.latitude !== null && address.longitude !== null

            return (
              <label
                key={address.id}
                className={`checkout-address-card ${
                  selectedAddressId === address.id ? 'selected' : ''
                } ${!hasCoordinates ? 'warning' : ''}`}
              >
                <input
                  type="radio"
                  name="addressId"
                  checked={selectedAddressId === address.id}
                  onChange={() => onAddressChange(address.id)}
                />
                <span className="checkout-address-topline">
                  <strong>{address.recipientName}</strong>
                  {address.isPrimary && <em>Utama</em>}
                </span>
                <span>{address.phone}</span>
                <span>{address.address}</span>
                <span>{getAddressLine(address)}</span>
                <span className={hasCoordinates ? 'checkout-coordinate-ok' : 'checkout-coordinate-missing'}>
                  {hasCoordinates ? 'Koordinat tersedia' : 'Koordinat belum tersedia'}
                </span>
              </label>
            )
          })}
        </div>
      )}
    </section>
  )
}