import { useMemo, useState } from 'react'
import { AlertCircle, MapPin, Plus } from 'lucide-react'
import { AddressFormModal } from '../profile/AddressFormModal'
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
  onAddressAdded?: () => void
}

export function CheckoutAddressList(props: CheckoutAddressListProps) {
  const picker = useCheckoutAddressPicker(props)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)

  const openAddressModal = () => setIsAddressModalOpen(true)
  const closeAddressModal = () => {
    setIsAddressModalOpen(false)
    if (props.onAddressAdded) {
      props.onAddressAdded()
    }
  }

  return (
    <section className="checkout-panel">
      <CheckoutSectionTitle icon={MapPin} title="Alamat Pengiriman" description="Pilih alamat berkoordinat agar cabang PanenMart terdekat bisa dihitung." />
      {props.addresses.length === 0 ? (
        <EmptyAddressAlert onAddAddress={openAddressModal} />
      ) : (
        <AddressOptions {...props} {...picker} onAddAddress={openAddressModal} />
      )}
      <AddressFormModal isOpen={isAddressModalOpen} onClose={closeAddressModal} />
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

type AddressOptionsProps = CheckoutAddressListProps & ReturnType<typeof useCheckoutAddressPicker> & { onAddAddress: () => void }

function AddressOptions(props: AddressOptionsProps) {
  return (
    <>
      <DesktopAddressOptions {...props} />
      <MobileAddressSelector {...props} />
      {props.isPickerOpen && <CheckoutAddressPicker addresses={props.addresses} addressCountLabel={props.addressCountLabel} selectedAddressId={props.selectedAddressId} onAddressChange={props.changePickerAddress} onClose={props.closePicker} />}
    </>
  )
}

function DesktopAddressOptions({ addresses, selectedAddressId, onAddressChange, addressCountLabel, onAddAddress }: AddressOptionsProps) {
  return (
    <>
      <div className="checkout-address-list-meta checkout-address-desktop-meta">
        <span>Pilih salah satu alamat</span>
        <div className="flex items-center gap-3">
          <strong>{addressCountLabel}</strong>
          <button type="button" onClick={onAddAddress} className="flex items-center gap-1 text-[0.85rem] text-[var(--accent)] font-medium hover:underline bg-transparent border-none cursor-pointer p-0">
            <Plus size={14} /> Tambah
          </button>
        </div>
      </div>
      <div className="checkout-address-grid checkout-address-desktop-grid">
        {addresses.map((address) => <CheckoutAddressCard key={address.id} address={address} isSelected={selectedAddressId === address.id} onSelect={onAddressChange} />)}
      </div>
    </>
  )
}

function MobileAddressSelector({ selectedAddress, setIsPickerOpen, onAddAddress }: AddressOptionsProps) {
  return (
    <div className="checkout-address-mobile-selector">
      {selectedAddress ? <CheckoutSelectedAddressCard address={selectedAddress} /> : <SelectAddressAlert />}
      <div className="flex gap-2 w-full mt-3">
        <button type="button" className="checkout-address-change-button flex-1" onClick={() => setIsPickerOpen(true)}>Ganti alamat</button>
        <button type="button" className="checkout-address-change-button flex-1 !bg-[var(--surface)] !text-[var(--accent-strong)] !border-[var(--accent-strong)]" onClick={onAddAddress}>Tambah</button>
      </div>
    </div>
  )
}

function EmptyAddressAlert({ onAddAddress }: { onAddAddress: () => void }) {
  return (
    <div className="flex flex-col gap-3">
      <CheckoutInlineAlert icon={AlertCircle}>Belum ada alamat tersimpan. Anda diwajibkan untuk membuat alamat pengiriman terlebih dahulu.</CheckoutInlineAlert>
      <button 
        type="button" 
        onClick={onAddAddress}
        className="w-full sm:w-auto self-start px-5 py-2.5 rounded-full bg-[var(--accent)] text-white font-semibold border-none cursor-pointer hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(232,107,79,0.25)] transition-all flex items-center justify-center gap-2"
      >
        <Plus size={18} />
        Tambah Alamat Baru
      </button>
    </div>
  )
}

function SelectAddressAlert() {
  return <CheckoutInlineAlert icon={AlertCircle}>Pilih alamat pengiriman untuk melanjutkan checkout.</CheckoutInlineAlert>
}
