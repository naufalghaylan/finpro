import { BadgePercent, CheckCircle2 } from 'lucide-react'
import type { CheckoutStoreDiscount } from '../../types/order'
import { formatCurrency, formatDateTime } from '../../utils/format'

type CheckoutDiscountCardProps = {
  discount: CheckoutStoreDiscount
  isApplied: boolean
  onToggleApply?: (apply: boolean) => void
}

export function CheckoutDiscountCard({ discount, isApplied, onToggleApply }: CheckoutDiscountCardProps) {
  return (
    <button type="button" className={`checkout-payment-card checkout-voucher-card${isApplied ? ' selected' : ''}`} onClick={() => onToggleApply?.(!isApplied)} aria-pressed={isApplied}>
      <DiscountCardTop isApplied={isApplied} />
      <strong className="checkout-voucher-name">{discount.name}</strong>
      <span className="checkout-voucher-discount">Hemat {formatCurrency(discount.amount)}</span>
      <DiscountMeta label="Berlaku untuk" value={discount.productId ? 'Produk tertentu' : 'Semua produk'} />
      <DiscountMeta label="Min. Belanja" value={formatCurrency(discount.minPurchase)} />
      <span className="checkout-voucher-expiry">Berlaku s/d {formatDateTime(discount.endDate)}</span>
    </button>
  )
}

function DiscountCardTop({ isApplied }: { isApplied: boolean }) {
  return (
    <div className="checkout-voucher-card-top">
      <BadgePercent aria-hidden="true" />
      {isApplied && <DiscountAppliedBadge />}
    </div>
  )
}

function DiscountAppliedBadge() {
  return (
    <span className="checkout-selection-badge">
      <CheckCircle2 aria-hidden="true" />
      Terpasang
    </span>
  )
}

function DiscountMeta({ label, value }: { label: string; value: string }) {
  return <span className="checkout-voucher-meta"><strong>{label}:</strong> {value}</span>
}
