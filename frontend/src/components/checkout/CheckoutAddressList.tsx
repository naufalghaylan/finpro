import { useMemo, useState } from 'react'
import { AlertCircle, MapPin } from 'lucide-react'
import type { CheckoutAddress } from '../../types/order'
import { CheckoutAddressCard } from './CheckoutAddressCard'
import { CheckoutAddressPicker } from './CheckoutAddressPicker'
import { CheckoutInlineAlert } from './CheckoutInlineAlert'
import { CheckoutSectionTitle } from './CheckoutSectionTitle'
import { CheckoutSelectedAddressCard } from './CheckoutSelectedAddressCard'

interface CheckoutAddressListProps {
  addresses: CheckoutAddress[]
  selectedAddressId: number | null
  onAddressChange: (addressId: number) => void
}

export function CheckoutAddressList(props: CheckoutAddressListProps) {
  const picker = useCheckoutAddressPicker(props)

  return (
    <section className="checkout-panel">
      <CheckoutSectionTitle icon={MapPin} title="Alamat Pengiriman" description="Pilih alamat berkoordinat agar cabang PanenMart terdekat bisa dihitung." />
      {props.addresses.length === 0 ? <EmptyAddressAlert /> : <AddressOptions {...props} {...picker} />}
    </section>
  )
}

function useCheckoutAddressPicker({ addresses, selectedAddressId, onAddressChange }: CheckoutAddressListProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const selectedAddress = useMemo(() => addresses.find((address) => address.id === selectedAddressId) ?? null, [addresses, selectedAddressId])
  const addressCountLabel = `${addresses.length} alamat tersimpan`
  const closePicker = () => setIsPickerOpen(false)
  const changePickerAddress = (addressId: number) => {
    onAddressChange(addressId)
    closePicker()
  }
  return { addressCountLabel, changePickerAddress, closePicker, isPickerOpen, selectedAddress, setIsPickerOpen }
}

type AddressOptionsProps = CheckoutAddressListProps & ReturnType<typeof useCheckoutAddressPicker>

function AddressOptions(props: AddressOptionsProps) {
  return (
    <>
      <DesktopAddressOptions {...props} />
      <MobileAddressSelector {...props} />
      {props.isPickerOpen && <CheckoutAddressPicker addresses={props.addresses} addressCountLabel={props.addressCountLabel} selectedAddressId={props.selectedAddressId} onAddressChange={props.changePickerAddress} onClose={props.closePicker} />}
    </>
  )
}

function DesktopAddressOptions({ addresses, selectedAddressId, onAddressChange, addressCountLabel }: AddressOptionsProps) {
  return (
    <>
      <div className="checkout-address-list-meta checkout-address-desktop-meta"><span>Pilih salah satu alamat</span><strong>{addressCountLabel}</strong></div>
      <div className="checkout-address-grid checkout-address-desktop-grid">
        {addresses.map((address) => <CheckoutAddressCard key={address.id} address={address} isSelected={selectedAddressId === address.id} onSelect={onAddressChange} />)}
      </div>
    </>
  )
}

function MobileAddressSelector({ selectedAddress, setIsPickerOpen }: AddressOptionsProps) {
  return (
    <div className="checkout-address-mobile-selector">
      {selectedAddress ? <CheckoutSelectedAddressCard address={selectedAddress} /> : <SelectAddressAlert />}
      <button type="button" className="checkout-address-change-button" onClick={() => setIsPickerOpen(true)}>Ganti alamat</button>
    </div>
  )
}

function EmptyAddressAlert() {
  return <CheckoutInlineAlert icon={AlertCircle}>Belum ada alamat tersimpan. Tambahkan alamat terlebih dahulu di profil.</CheckoutInlineAlert>
}

function SelectAddressAlert() {
  return <CheckoutInlineAlert icon={AlertCircle}>Pilih alamat pengiriman untuk melanjutkan checkout.</CheckoutInlineAlert>
}
