import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import type { ShippingCostResult } from '../../api/rajaongkir'
import { formatCurrency } from '../../utils/format'

interface CheckoutSummaryPanelProps {
  totalQuantity: number
  subtotal: number
  selectedShippingService: ShippingCostResult | null
  totalPayment: number
  hasSelectedAddressCoordinates: boolean
  hasSelectedAddress: boolean
  canCreateOrder: boolean
  isSubmitting: boolean
  onCreateOrder: () => void
}

export function CheckoutSummaryPanel({
  totalQuantity,
  subtotal,
  selectedShippingService,
  totalPayment,
  hasSelectedAddressCoordinates,
  hasSelectedAddress,
  canCreateOrder,
  isSubmitting,
  onCreateOrder,
}: CheckoutSummaryPanelProps) {
  return (
    <aside className="checkout-summary-panel">
      <h2>Rincian Pembayaran</h2>
      <div className="cart-summary-row">
        <span>Total Harga ({totalQuantity} item)</span>
        <strong>{formatCurrency(subtotal)}</strong>
      </div>
      <div className="cart-summary-row">
        <span>Ongkir</span>
        <strong>{selectedShippingService ? formatCurrency(selectedShippingService.cost) : 'Rp -'}</strong>
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
