import { AlertCircle, PackageCheck } from 'lucide-react'
import type { CheckoutStore } from '../../types/order'
import { CheckoutInlineAlert } from './CheckoutInlineAlert'
import { CheckoutSectionTitle } from './CheckoutSectionTitle'
import { CheckoutStoreCard } from './CheckoutStoreCard'

interface CheckoutStorePanelProps {
  nearestStore: CheckoutStore | null
}

export function CheckoutStorePanel({ nearestStore }: CheckoutStorePanelProps) {
  return (
    <section className="checkout-panel checkout-branch-panel">
      <CheckoutSectionTitle icon={PackageCheck} title="Cabang Pemrosesan" description="Pesanan diproses dari cabang PanenMart yang paling sesuai dengan alamat pengiriman." />
      {nearestStore ? <CheckoutStoreCard nearestStore={nearestStore} /> : <EmptyStoreAlert />}
    </section>
  )
}

function EmptyStoreAlert() {
  return (
    <CheckoutInlineAlert icon={AlertCircle}>
      Pilih alamat dengan koordinat untuk menentukan cabang PanenMart terdekat.
    </CheckoutInlineAlert>
  )
}
