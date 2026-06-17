import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import type { CheckoutOrder } from '../../types/order'
import { formatCurrency, getOrderDiscountBreakdown } from './orderDisplay'

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
  const {
    storeDiscountAmount,
    referralVoucherAmount,
    otherVoucherAmount,
    voucherLabel,
  } = getOrderDiscountBreakdown(order)

  return (
    <aside className="checkout-summary-panel payment-summary-panel">
      <h2>Rincian Pembayaran</h2>
      <div className="cart-summary-row">
        <span>Subtotal Produk</span>
        <strong>{formatCurrency(order.totalProductAmount)}</strong>
      </div>
      {storeDiscountAmount > 0 && (
        <div className="cart-summary-row">
          <span>Diskon Toko</span>
          <strong>-{formatCurrency(storeDiscountAmount)}</strong>
        </div>
      )}
      {referralVoucherAmount > 0 && (
        <div className="cart-summary-row">
          <span>Voucher Referral</span>
          <strong>-{formatCurrency(referralVoucherAmount)}</strong>
        </div>
      )}
      {otherVoucherAmount > 0 && (
        <div className="cart-summary-row">
          <span>{voucherLabel ?? 'Voucher'}</span>
          <strong>-{formatCurrency(otherVoucherAmount)}</strong>
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

      {order.status === 'CANCELLED' && order.cancelReason && (
        <div className="payment-cancel-note">
          <span>Alasan Pembatalan</span>
          <strong>{order.cancelReason}</strong>
        </div>
      )}
    </aside>
  )
}
