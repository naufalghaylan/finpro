import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import type { ShippingCostResult } from '../../api/rajaongkir'
import { formatCurrency } from '../../utils/format'
import { CheckoutInlineAlert } from './CheckoutInlineAlert'
import { getOtherDiscountAmount, getReadinessItems } from './checkoutSummaryDisplay'

export interface CheckoutSummaryPanelProps {
  totalQuantity: number
  subtotal: number
  productDiscountAmount?: number
  storeDiscountAmount?: number
  voucherReferralAmount?: number
  discountAmount?: number
  selectedShippingService: ShippingCostResult | null
  totalPayment: number
  hasSelectedAddressCoordinates: boolean
  hasSelectedAddress: boolean
  hasNearestBranch: boolean
  canCreateOrder: boolean
  isSubmitting: boolean
  cartBlockingReason?: string | null
  onCreateOrder: () => void
}

export function CheckoutSummaryPanel(props: CheckoutSummaryPanelProps) {
  const otherDiscountAmount = getOtherDiscountAmount(props.discountAmount ?? 0, props.productDiscountAmount ?? 0, props.storeDiscountAmount ?? 0, props.voucherReferralAmount ?? 0)

  return (
    <aside className="checkout-summary-panel">
      <CheckoutSummaryHeader totalQuantity={props.totalQuantity} />
      <CheckoutReadinessList {...props} />
      <CheckoutSummaryRows {...props} otherDiscountAmount={otherDiscountAmount} />
      <AddressCoordinateAlert {...props} />
      <CartAvailabilityAlert {...props} />
      <CheckoutCreateButton canCreateOrder={props.canCreateOrder} isSubmitting={props.isSubmitting} onCreateOrder={props.onCreateOrder} />
    </aside>
  )
}

function CheckoutSummaryHeader({ totalQuantity }: Pick<CheckoutSummaryPanelProps, 'totalQuantity'>) {
  return (
    <div className="checkout-summary-header">
      <h2>Rincian Pembayaran</h2>
      <span>{totalQuantity} item</span>
    </div>
  )
}

function CheckoutReadinessList(props: CheckoutSummaryPanelProps) {
  const items = getReadinessItems(props.hasSelectedAddress && props.hasSelectedAddressCoordinates, props.hasNearestBranch, Boolean(props.selectedShippingService), !props.cartBlockingReason)

  return (
    <div className="checkout-readiness-list" aria-label="Kelengkapan checkout">
      {items.map((item) => <CheckoutReadinessItem key={item.label} {...item} />)}
    </div>
  )
}

function CheckoutReadinessItem({ label, ready }: { label: string; ready: boolean }) {
  const Icon = ready ? CheckCircle2 : AlertCircle

  return (
    <div className={`checkout-readiness-item ${ready ? 'ready' : ''}`}>
      <Icon aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

type CheckoutSummaryRowsProps = CheckoutSummaryPanelProps & { otherDiscountAmount: number }

function CheckoutSummaryRows(props: CheckoutSummaryRowsProps) {
  const subtotalAfterProductDiscount = Math.max(0, props.subtotal - (props.productDiscountAmount ?? 0))

  return (
    <>
      <SummaryRow label={`Subtotal Produk (${props.totalQuantity} item)`} value={formatCurrency(props.subtotal)} />
      {(props.productDiscountAmount ?? 0) > 0 && (
        <SummaryRow label="Diskon Produk" value={`-${formatCurrency(props.productDiscountAmount ?? 0)}`} className="checkout-summary-discount" />
      )}
      {(props.productDiscountAmount ?? 0) > 0 && (
        <SummaryRow label="Subtotal Setelah Diskon" value={formatCurrency(subtotalAfterProductDiscount)} />
      )}
      <DiscountRows {...props} />
      <SummaryRow label="Ongkir" value={props.selectedShippingService ? formatCurrency(props.selectedShippingService.cost) : 'Pilih pengiriman'} />
      <SummaryRow label="Total Bayar" value={formatCurrency(props.totalPayment)} className="checkout-summary-total" />
    </>
  )
}

function DiscountRows({ storeDiscountAmount = 0, voucherReferralAmount = 0, otherDiscountAmount }: CheckoutSummaryRowsProps) {
  return (
    <>
      {storeDiscountAmount > 0 && <SummaryRow label="Diskon Toko" value={`-${formatCurrency(storeDiscountAmount)}`} className="checkout-summary-discount" />}
      {voucherReferralAmount > 0 && <SummaryRow label="Voucher Referral" value={`-${formatCurrency(voucherReferralAmount)}`} className="checkout-summary-discount" />}
      {otherDiscountAmount > 0 && <SummaryRow label="Potongan Lainnya" value={`-${formatCurrency(otherDiscountAmount)}`} className="checkout-summary-discount" />}
    </>
  )
}

function SummaryRow({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className={`cart-summary-row ${className}`.trim()}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function AddressCoordinateAlert({ hasSelectedAddress, hasSelectedAddressCoordinates }: CheckoutSummaryPanelProps) {
  if (hasSelectedAddressCoordinates || !hasSelectedAddress) return null
  return <CheckoutInlineAlert icon={AlertCircle} compact>Alamat terpilih belum punya koordinat.</CheckoutInlineAlert>
}

function CartAvailabilityAlert({ cartBlockingReason }: CheckoutSummaryPanelProps) {
  if (!cartBlockingReason) return null
  return <CheckoutInlineAlert icon={AlertCircle} compact>{cartBlockingReason}</CheckoutInlineAlert>
}

function CheckoutCreateButton({ canCreateOrder, isSubmitting, onCreateOrder }: Pick<CheckoutSummaryPanelProps, 'canCreateOrder' | 'isSubmitting' | 'onCreateOrder'>) {
  const Icon = isSubmitting ? Loader2 : CheckCircle2

  return (
    <button type="button" className="button primary checkout-create-button" disabled={!canCreateOrder} onClick={onCreateOrder}>
      <Icon className={`button-icon ${isSubmitting ? 'spin' : ''}`.trim()} aria-hidden="true" />
      {isSubmitting ? 'Membuat Pesanan' : 'Buat Pesanan'}
    </button>
  )
}
