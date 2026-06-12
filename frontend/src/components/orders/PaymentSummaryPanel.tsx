import { Loader2, XCircle } from 'lucide-react'
import type { CheckoutOrder } from '../../types/order'
import { formatCurrency } from './orderDisplay'

type PaymentSummaryPanelProps = {
  order: CheckoutOrder
  isManualTransfer: boolean
  canCancel: boolean
  isCancelling: boolean
  onCancelClick: () => void
}

export function PaymentSummaryPanel({
  order,
  isManualTransfer,
  canCancel,
  isCancelling,
  onCancelClick,
}: PaymentSummaryPanelProps) {
  return (
    <aside className="checkout-summary-panel payment-summary-panel">
      <h2>Rincian Pembayaran</h2>
      <div className="cart-summary-row">
        <span>Subtotal Produk</span>
        <strong>{formatCurrency(order.totalProductAmount)}</strong>
      </div>
      <div className="cart-summary-row">
        <span>Ongkir</span>
        <strong>{order.shippingCost > 0 ? formatCurrency(order.shippingCost) : 'Rp -'}</strong>
      </div>
      <div className="cart-summary-row checkout-summary-total">
        <span>Total Bayar</span>
        <strong>{formatCurrency(order.totalAmount)}</strong>
      </div>
      <div className="payment-summary-meta">
        <span>Metode</span>
        <strong>{isManualTransfer ? 'Transfer Manual' : 'Payment Gateway'}</strong>
      </div>
      <div className="payment-summary-meta">
        <span>Store</span>
        <strong>{order.store.name}</strong>
      </div>

      {canCancel && (
        <div className="payment-cancel-panel">
          <h3>Batalkan Pesanan</h3>
          <p>Pesanan hanya bisa dibatalkan sebelum bukti bayar diupload atau pembayaran diproses.</p>
          <button
            type="button"
            className="button danger payment-cancel-button"
            disabled={!canCancel}
            onClick={onCancelClick}
          >
            {isCancelling ? (
              <>
                <Loader2 className="button-icon spin" aria-hidden="true" />
                Membatalkan...
              </>
            ) : (
              <>
                <XCircle className="button-icon" aria-hidden="true" />
                Batalkan Pesanan
              </>
            )}
          </button>
        </div>
      )}

      {order.status === 'CANCELLED' && order.cancelReason && (
        <div className="payment-cancel-note">
          <span>Alasan Pembatalan</span>
          <strong>{order.cancelReason}</strong>
        </div>
      )}
    </aside>
  )
}
