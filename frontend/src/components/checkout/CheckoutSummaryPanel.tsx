import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import type { ShippingCostResult } from '../../api/rajaongkir'
import { formatCurrency } from '../../utils/format'

interface CheckoutSummaryPanelProps {
  totalQuantity: number
  subtotal: number
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
  onCreateOrder: () => void
}

export function CheckoutSummaryPanel({
  totalQuantity,
  subtotal,
  storeDiscountAmount = 0,
  voucherReferralAmount = 0,
  discountAmount = 0,
  selectedShippingService,
  totalPayment,
  hasSelectedAddressCoordinates,
  hasSelectedAddress,
  hasNearestBranch,
  canCreateOrder,
  isSubmitting,
  onCreateOrder,
}: CheckoutSummaryPanelProps) {
  const otherDiscountAmount = Math.max(0, discountAmount - storeDiscountAmount - voucherReferralAmount)
  const hasReadyAddress = hasSelectedAddress && hasSelectedAddressCoordinates
  const hasShipping = Boolean(selectedShippingService)
  const readinessItems = [
    { label: 'Alamat berkoordinat', ready: hasReadyAddress },
    { label: 'Cabang pemrosesan tersedia', ready: hasNearestBranch },
    { label: 'Layanan pengiriman dipilih', ready: hasShipping },
  ]

  return (
    <aside className="checkout-summary-panel">
      <div className="checkout-summary-heading">
        <h2>Rincian Pembayaran</h2>
        <span>{totalQuantity} item</span>
      </div>

      <div className="checkout-summary-readiness" aria-label="Kelengkapan checkout">
        {readinessItems.map((item) => (
          <div key={item.label} className={item.ready ? 'ready' : ''}>
            {item.ready ? <CheckCircle2 aria-hidden="true" /> : <AlertCircle aria-hidden="true" />}
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="cart-summary-row">
        <span>Total Harga ({totalQuantity} item)</span>
        <strong>{formatCurrency(subtotal)}</strong>
      </div>
      {storeDiscountAmount > 0 && (
        <div className="cart-summary-row">
          <span>Diskon PanenMart</span>
          <strong>-{formatCurrency(storeDiscountAmount)}</strong>
        </div>
      )}
      {voucherReferralAmount > 0 && (
        <div className="cart-summary-row">
          <span>Voucher Referral</span>
          <strong>-{formatCurrency(voucherReferralAmount)}</strong>
        </div>
      )}
      {otherDiscountAmount > 0 && (
        <div className="cart-summary-row">
          <span>Potongan Lainnya</span>
          <strong>-{formatCurrency(otherDiscountAmount)}</strong>
        </div>
      )}
      <div className="cart-summary-row">
        <span>Ongkir</span>
        <strong>{selectedShippingService ? formatCurrency(selectedShippingService.cost) : 'Pilih pengiriman'}</strong>
      </div>
      <div className="cart-summary-row checkout-summary-total">
        <span>Total Bayar</span>
        <strong>{formatCurrency(totalPayment)}</strong>
      </div>

      {!hasSelectedAddressCoordinates && hasSelectedAddress && (
        <div className="checkout-inline-alert compact">
          <AlertCircle aria-hidden="true" />
          Alamat terpilih belum punya koordinat.
        </div>
      )}

      <button
        type="button"
        className="button primary checkout-create-button"
        disabled={!canCreateOrder}
        onClick={onCreateOrder}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="button-icon spin" aria-hidden="true" />
            Membuat Pesanan
          </>
        ) : (
          <>
            <CheckCircle2 className="button-icon" aria-hidden="true" />
            Buat Pesanan
          </>
        )}
      </button>
    </aside>
  )
}