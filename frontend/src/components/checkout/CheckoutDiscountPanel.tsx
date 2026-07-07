import { BadgePercent } from 'lucide-react'
import type { CheckoutStoreDiscount } from '../../types/order'
import { CheckoutDiscountCard } from './CheckoutDiscountCard'
import { CheckoutDiscountEmptyState } from './CheckoutDiscountEmptyState'
import { CheckoutSectionTitle } from './CheckoutSectionTitle'
import { getDisplayedDiscounts } from './checkoutDiscountDisplay'

type CheckoutDiscountPanelProps = {
  availableDiscountAmount?: number
  discounts?: CheckoutStoreDiscount[]
  isApplied?: boolean
  onToggleApply?: (apply: boolean) => void
}

export function CheckoutDiscountPanel(props: CheckoutDiscountPanelProps) {
  const amount = props.availableDiscountAmount ?? 0
  const displayedDiscounts = getDisplayedDiscounts(props.discounts ?? [], amount)

  return (
    <section className="checkout-panel">
      <CheckoutSectionTitle icon={BadgePercent} title="Diskon" description="Pilih apakah ingin memakai diskon toko untuk pesanan ini." />
      {amount > 0 ? <DiscountGrid discounts={displayedDiscounts} isApplied={Boolean(props.isApplied)} onToggleApply={props.onToggleApply} /> : <CheckoutDiscountEmptyState />}
    </section>
  )
}

function DiscountGrid({ discounts, isApplied, onToggleApply }: Required<Pick<CheckoutDiscountPanelProps, 'discounts' | 'isApplied'>> & Pick<CheckoutDiscountPanelProps, 'onToggleApply'>) {
  return (
    <div className="checkout-payment-grid">
      {discounts.map((discount) => <CheckoutDiscountCard key={discount.id} discount={discount} isApplied={isApplied} onToggleApply={onToggleApply} />)}
    </div>
  )
}
