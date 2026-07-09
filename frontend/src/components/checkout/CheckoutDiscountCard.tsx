import { BadgePercent, CheckCircle2 } from 'lucide-react'
import type { CheckoutStoreDiscount } from '../../types/order'
import { formatCurrency, formatDateTime } from '../../utils/format'

type CheckoutDiscountCardProps = {
  discount: CheckoutStoreDiscount
  isSelected: boolean
  onToggle?: () => void
}

export function CheckoutDiscountCard({ discount, isSelected, onToggle }: CheckoutDiscountCardProps) {
  return (
    <button type="button" className={`checkout-payment-card checkout-voucher-card${isSelected ? ' selected' : ''}`} onClick={() => onToggle?.()} aria-pressed={isSelected}>
      <DiscountCardTop isSelected={isSelected} />
      <strong className="checkout-voucher-name">{discount.name}</strong>
      <span className="checkout-voucher-discount">Hemat {formatCurrency(discount.amount)}</span>
      <DiscountMeta label="Berlaku untuk" value={discount.productId ? 'Produk tertentu' : 'Semua produk'} />
      <DiscountMeta label="Min. Belanja" value={formatCurrency(discount.minPurchase)} />
      <span className="checkout-voucher-expiry">Berlaku s/d {formatDateTime(discount.endDate)}</span>
    </button>
  )
}

function DiscountCardTop({ isSelected }: { isSelected: boolean }) {
  return (
    <div className="checkout-voucher-card-top">
      <BadgePercent aria-hidden="true" />
      {isSelected && <DiscountSelectedBadge />}
    </div>
  )
}

function DiscountSelectedBadge() {
  return (
    <span className="checkout-selection-badge">
      <CheckCircle2 aria-hidden="true" />
      Dipilih
    </span>
  )
}

function DiscountMeta({ label, value }: { label: string; value: string }) {
  return <span className="checkout-voucher-meta"><strong>{label}:</strong> {value}</span>
}
