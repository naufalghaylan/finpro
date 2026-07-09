import { BadgePercent } from 'lucide-react'
import type { CheckoutStoreDiscount } from '../../types/order'
import { CheckoutDiscountCard } from './CheckoutDiscountCard'
import { CheckoutDiscountEmptyState } from './CheckoutDiscountEmptyState'
import { CheckoutSectionTitle } from './CheckoutSectionTitle'

type CheckoutDiscountPanelProps = {
  discounts?: CheckoutStoreDiscount[]
  selectedDiscountId?: number | null
  onSelect?: (id: number | null) => void
}

export function CheckoutDiscountPanel(props: CheckoutDiscountPanelProps) {
  const discounts = props.discounts ?? []

  return (
    <section className="checkout-panel">
      <CheckoutSectionTitle icon={BadgePercent} title="Diskon Toko" description="Pilih satu diskon toko untuk pesanan ini. Diskon per-produk otomatis diterapkan." />
      {discounts.length > 0
        ? <DiscountGrid discounts={discounts} selectedDiscountId={props.selectedDiscountId ?? null} onSelect={props.onSelect} />
        : <CheckoutDiscountEmptyState />}
    </section>
  )
}

type DiscountGridProps = {
  discounts: CheckoutStoreDiscount[]
  selectedDiscountId: number | null
  onSelect?: (id: number | null) => void
}

function DiscountGrid({ discounts, selectedDiscountId, onSelect }: DiscountGridProps) {
  return (
    <div className="checkout-payment-grid">
      {discounts.map((discount) => (
        <CheckoutDiscountCard
          key={discount.id}
          discount={discount}
          isSelected={discount.id === selectedDiscountId}
          onToggle={() => onSelect?.(discount.id === selectedDiscountId ? null : discount.id)}
        />
      ))}
    </div>
  )
}
