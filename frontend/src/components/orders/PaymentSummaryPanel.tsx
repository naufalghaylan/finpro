import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import type { CheckoutOrder } from '../../types/order'
import { formatCurrency, formatDateTime, getOrderDiscountSummary } from './orderDisplay'

type PaymentSummaryPanelProps = {
  order: CheckoutOrder
  isManualTransfer: boolean
  canCancel: boolean
  isCancelling: boolean
  canConfirmReceipt: boolean
  isConfirmingReceipt: boolean
  onCancelClick: () => void
  onConfirmReceiptClick: () => void
}

export function PaymentSummaryPanel({
  order,
  isManualTransfer,
  canCancel,
  isCancelling,
  canConfirmReceipt,
  isConfirmingReceipt,
  onCancelClick,
  onConfirmReceiptClick,
}: PaymentSummaryPanelProps) {
  const { discountAmount, discountLabel } = getOrderDiscountSummary(order)

  return (
    <aside className="checkout-summary-panel payment-summary-panel">
      <h2>Rincian Pembayaran</h2>
      <div className="cart-summary-row">
        <span>Subtotal Produk</span>
        <strong>{formatCurrency(order.totalProductAmount)}</strong>
      </div>
      {discountAmount > 0 && (
        <div className="cart-summary-row">
          <span>{discountLabel}</span>
          <strong>-{formatCurrency(discountAmount)}</strong>
        </div>
      )}
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
        <strong>{isManualTransfer ? 'Transfer Manual' : 'Pembayaran Online'}</strong>
      </div>
      <div className="payment-summary-meta">
        <span>Cabang</span>
        <strong>{order.store.name}</strong>
      </div>

      {canCancel && (
        <div className="payment-cancel-panel">
          <h3>Batalkan Pesanan</h3>
          <p>Pesanan hanya bisa dibatalkan sebelum bukti bayar diunggah atau pembayaran diproses.</p>
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

      {canConfirmReceipt && (
        <div className="payment-receipt-panel">
          <h3>Konfirmasi Pesanan</h3>
          <p>Pastikan pesanan sudah kamu terima sebelum menyelesaikan pesanan.</p>
          <button
            type="button"
            className="button primary payment-receipt-button"
            disabled={isConfirmingReceipt}
            onClick={onConfirmReceiptClick}
          >
            {isConfirmingReceipt ? (
              <>
                <Loader2 className="button-icon spin" aria-hidden="true" />
                Memproses...
              </>
            ) : (
              <>
                <CheckCircle2 className="button-icon" aria-hidden="true" />
                Pesanan Diterima
              </>
            )}
          </button>
        </div>
      )}

      {order.status === 'CANCELLED' && (
        <div className="payment-cancel-note">
          <span>Pesanan Dibatalkan</span>
          <strong>{order.cancelReason || 'Tidak ada alasan pembatalan yang tercatat.'}</strong>
          <em>{formatDateTime(order.cancelledAt)}</em>
        </div>
      )}
    </aside>
  )
}
