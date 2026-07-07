import { useMemo, useState } from 'react'
import { AlertCircle, MapPin, X } from 'lucide-react'
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

const hasAddressCoordinates = (address: CheckoutAddress) =>
  address.latitude !== null && address.longitude !== null

interface CheckoutAddressCardProps {
  address: CheckoutAddress
  isSelected: boolean
  onSelect: (addressId: number) => void
  className?: string
}

function CheckoutAddressCard({
  address,
  isSelected,
  onSelect,
  className = '',
}: CheckoutAddressCardProps) {
  const hasCoordinates = hasAddressCoordinates(address)

  return (
    <label
      className={`checkout-address-card ${isSelected ? 'selected' : ''} ${
        !hasCoordinates ? 'warning' : ''
      } ${className}`.trim()}
    >
      <input
        type="radio"
        name="addressId"
        checked={isSelected}
        onChange={() => onSelect(address.id)}
      />
      <span className="checkout-address-topline">
        <strong>{address.recipientName}</strong>
        {address.isPrimary && <em>Utama</em>}
      </span>
      <span className="checkout-address-phone">{address.phone}</span>
      <span className="checkout-address-detail">{address.address}</span>
      <span className="checkout-address-area">{getAddressLine(address)}</span>
      <span className={hasCoordinates ? 'checkout-coordinate-ok' : 'checkout-coordinate-missing'}>
        {hasCoordinates ? 'Koordinat tersedia' : 'Koordinat belum tersedia'}
      </span>
    </label>
  )
}

function CheckoutSelectedAddressCard({ address }: { address: CheckoutAddress }) {
  const hasCoordinates = hasAddressCoordinates(address)

  return (
    <div
      className={`checkout-address-card checkout-address-active-card ${
        hasCoordinates ? 'selected' : 'warning'
      }`}
    >
      <span className="checkout-address-topline">
        <strong>{address.recipientName}</strong>
        {address.isPrimary && <em>Utama</em>}
      </span>
      <span className="checkout-address-phone">{address.phone}</span>
      <span className="checkout-address-detail">{address.address}</span>
      <span className="checkout-address-area">{getAddressLine(address)}</span>
      <span className={hasCoordinates ? 'checkout-coordinate-ok' : 'checkout-coordinate-missing'}>
        {hasCoordinates ? 'Koordinat tersedia' : 'Koordinat belum tersedia'}
      </span>
    </div>
  )
}

export function CheckoutAddressList({
  addresses,
  selectedAddressId,
  onAddressChange,
}: CheckoutAddressListProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const addressCountLabel = `${addresses.length} alamat tersimpan`
  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  )

  const handlePickerAddressChange = (addressId: number) => {
    onAddressChange(addressId)
    setIsPickerOpen(false)
  }

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
        <>
          <div className="checkout-address-list-meta checkout-address-desktop-meta">
            <span>Pilih salah satu alamat</span>
            <strong>{addressCountLabel}</strong>
          </div>

          <div className="checkout-address-grid checkout-address-desktop-grid">
            {addresses.map((address) => (
              <CheckoutAddressCard
                key={address.id}
                address={address}
                isSelected={selectedAddressId === address.id}
                onSelect={onAddressChange}
              />
            ))}
          </div>

          <div className="checkout-address-mobile-selector">
            {selectedAddress ? (
              <CheckoutSelectedAddressCard address={selectedAddress} />
            ) : (
              <div className="checkout-inline-alert">
                <AlertCircle aria-hidden="true" />
                Pilih alamat pengiriman untuk melanjutkan checkout.
              </div>
            )}
            <button
              type="button"
              className="checkout-address-change-button"
              onClick={() => setIsPickerOpen(true)}
            >
              Ganti alamat
            </button>
          </div>

          {isPickerOpen && (
            <div
              className="checkout-address-picker"
              role="dialog"
              aria-modal="true"
              aria-labelledby="checkout-address-picker-title"
            >
              <button
                type="button"
                className="checkout-address-picker-backdrop"
                aria-label="Tutup pilihan alamat"
                onClick={() => setIsPickerOpen(false)}
              />
              <div className="checkout-address-picker-sheet">
                <div className="checkout-address-picker-header">
                  <div>
                    <h3 id="checkout-address-picker-title">Pilih alamat</h3>
                    <p>{addressCountLabel}</p>
                  </div>
                  <button
                    type="button"
                    className="checkout-address-picker-close"
                    aria-label="Tutup pilihan alamat"
                    onClick={() => setIsPickerOpen(false)}
                  >
                    <X aria-hidden="true" />
                  </button>
                </div>
                <div className="checkout-address-picker-list">
                  {addresses.map((address) => (
                    <CheckoutAddressCard
                      key={address.id}
                      address={address}
                      isSelected={selectedAddressId === address.id}
                      onSelect={handlePickerAddressChange}
                      className="checkout-address-picker-card"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
