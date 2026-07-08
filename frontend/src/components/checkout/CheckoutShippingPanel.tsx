import { AlertCircle, Truck } from 'lucide-react'
import type { ShippingCostResult } from '../../api/rajaongkir'
import { CheckoutCourierOption } from './CheckoutCourierOption'
import { CheckoutInlineAlert } from './CheckoutInlineAlert'
import { CheckoutSectionTitle } from './CheckoutSectionTitle'
import { AVAILABLE_COURIERS } from './checkoutShippingDisplay'

interface CheckoutShippingPanelProps {
  hasSelectedAddressCoordinates: boolean
  hasNearestStore: boolean
  selectedCourier: string
  courierServices: Record<string, ShippingCostResult[]>
  selectedShippingService: ShippingCostResult | null
  fetchingCouriers: Record<string, boolean>
  onCourierChange: (courier: string) => void
  onShippingServiceChange: (service: ShippingCostResult) => void
}

export function CheckoutShippingPanel(props: CheckoutShippingPanelProps) {
  return (
    <section className="checkout-panel">
      <CheckoutSectionTitle icon={Truck} title="Metode Pengiriman" description="Pilih kurir dan layanan pengiriman untuk pesanan ini." />
      <CheckoutShippingContent {...props} />
    </section>
  )
}

function CheckoutShippingContent(props: CheckoutShippingPanelProps) {
  if (!props.hasSelectedAddressCoordinates) return <MissingAddressAlert />
  if (!props.hasNearestStore) return <MissingStoreAlert />
  return <CheckoutCourierContainer {...props} />
}

function CheckoutCourierContainer(props: CheckoutShippingPanelProps) {
  return (
    <div className="checkout-shipping-container">
      {AVAILABLE_COURIERS.length > 0 ? <CourierList {...props} /> : <DestinationHint />}
    </div>
  )
}

function CourierList(props: CheckoutShippingPanelProps) {
  return (
    <div className="checkout-courier-list">
      {AVAILABLE_COURIERS.map((courier) => <CheckoutCourierOption key={courier.code} courier={courier} {...props} />)}
    </div>
  )
}

function MissingAddressAlert() {
  return <CheckoutInlineAlert icon={AlertCircle}>Pilih alamat dengan koordinat untuk menampilkan metode pengiriman.</CheckoutInlineAlert>
}

function MissingStoreAlert() {
  return <CheckoutInlineAlert icon={AlertCircle}>Cabang PanenMart belum tersedia untuk alamat ini.</CheckoutInlineAlert>
}

function DestinationHint() {
  return <CheckoutInlineAlert icon={AlertCircle}>Pilih alamat tujuan untuk melihat tarif pengiriman dari cabang terdekat.</CheckoutInlineAlert>
}
