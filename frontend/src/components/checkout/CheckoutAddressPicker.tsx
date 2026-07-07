import { X } from 'lucide-react'
import type { CheckoutAddress } from '../../types/order'
import { CheckoutAddressCard } from './CheckoutAddressCard'

type CheckoutAddressPickerProps = {
  addresses: CheckoutAddress[]
  addressCountLabel: string
  selectedAddressId: number | null
  onAddressChange: (addressId: number) => void
  onClose: () => void
}

export function CheckoutAddressPicker(props: CheckoutAddressPickerProps) {
  return (
    <div className="checkout-address-picker" role="dialog" aria-modal="true" aria-labelledby="checkout-address-picker-title">
      <button type="button" className="checkout-address-picker-backdrop" aria-label="Tutup pilihan alamat" onClick={props.onClose} />
      <div className="checkout-address-picker-sheet">
        <CheckoutAddressPickerHeader addressCountLabel={props.addressCountLabel} onClose={props.onClose} />
        <CheckoutAddressPickerList {...props} />
      </div>
    </div>
  )
}

function CheckoutAddressPickerHeader({ addressCountLabel, onClose }: Pick<CheckoutAddressPickerProps, 'addressCountLabel' | 'onClose'>) {
  return (
    <div className="checkout-address-picker-header">
      <div>
        <h3 id="checkout-address-picker-title">Pilih alamat</h3>
        <p>{addressCountLabel}</p>
      </div>
      <button type="button" className="checkout-address-picker-close" aria-label="Tutup pilihan alamat" onClick={onClose}>
        <X aria-hidden="true" />
      </button>
    </div>
  )
}

function CheckoutAddressPickerList({ addresses, selectedAddressId, onAddressChange }: CheckoutAddressPickerProps) {
  return (
    <div className="checkout-address-picker-list">
      {addresses.map((address) => (
        <CheckoutAddressCard key={address.id} address={address} isSelected={selectedAddressId === address.id} onSelect={onAddressChange} className="checkout-address-picker-card" />
      ))}
    </div>
  )
}
