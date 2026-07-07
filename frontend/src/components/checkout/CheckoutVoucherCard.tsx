import { CheckCircle2, TicketPercent } from 'lucide-react'
import type { CheckoutVoucher } from '../../types/order'
import { formatCurrency, formatDateTime } from '../../utils/format'

type CheckoutVoucherCardProps = {
  voucher: CheckoutVoucher
  discountPreview: number
  isSelected: boolean
  onVoucherChange: (voucherId: number | null) => void
}

export function CheckoutVoucherCard(props: CheckoutVoucherCardProps) {
  const isDisabled = props.discountPreview <= 0
  return (
    <button type="button" className={getVoucherCardClassName(props.isSelected, isDisabled)} disabled={isDisabled} onClick={() => props.onVoucherChange(props.isSelected ? null : props.voucher.id)}>
      <VoucherCardTop isSelected={props.isSelected} />
      <strong className="checkout-voucher-name">{props.voucher.name}</strong>
      <VoucherDiscountValue discountPreview={props.discountPreview} />
      <VoucherMeta label="Kode" value={props.voucher.code} />
      <VoucherMeta label="Min. Belanja" value={formatCurrency(props.voucher.minPurchase)} />
      <span className="checkout-voucher-expiry">Berlaku s/d {formatDateTime(props.voucher.expiredAt)}</span>
    </button>
  )
}

const getVoucherCardClassName = (isSelected: boolean, isDisabled: boolean) =>
  `checkout-payment-card checkout-voucher-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`

function VoucherCardTop({ isSelected }: { isSelected: boolean }) {
  return <div className="checkout-voucher-card-top"><TicketPercent aria-hidden="true" />{isSelected && <VoucherSelectedBadge />}</div>
}

function VoucherSelectedBadge() {
  return <span className="checkout-selection-badge"><CheckCircle2 aria-hidden="true" />Terpasang</span>
}

function VoucherDiscountValue({ discountPreview }: { discountPreview: number }) {
  const value = discountPreview > 0 ? `Hemat ${formatCurrency(discountPreview)}` : 'Tidak memenuhi'
  return <span className="checkout-voucher-discount">{value}</span>
}

function VoucherMeta({ label, value }: { label: string; value: string }) {
  return <span className="checkout-voucher-meta"><strong>{label}:</strong> {value}</span>
}
