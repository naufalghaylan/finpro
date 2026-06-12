import { AlertCircle, CheckCircle2, CreditCard, Loader2, RefreshCw } from 'lucide-react'
import type { CheckoutOrder } from '../../types/order'

type PaymentGatewaySectionProps = {
  order: CheckoutOrder
  embedContainerId: string
  isPreparing: boolean
  isEmbedReady: boolean
  errorMessage: string | null
  onRetry: () => void
}

export function PaymentGatewaySection({
  order,
  embedContainerId,
  isPreparing,
  isEmbedReady,
  errorMessage,
  onRetry,
}: PaymentGatewaySectionProps) {
  return (
    <section className="checkout-panel">
      <div className="checkout-section-title">
        <CreditCard aria-hidden="true" />
        <div>
          <h2>Payment Gateway Midtrans</h2>
          <p>Bayar pesanan melalui Midtrans Sandbox. Status pesanan akan disinkronkan otomatis setelah pembayaran.</p>
        </div>
      </div>
      {order.status === 'PENDING_PAYMENT' ? (
        <div className="payment-gateway-card payment-gateway-card--embedded">
          <div className="payment-gateway-intro">
            <CreditCard aria-hidden="true" />
            <div>
              <h3>Midtrans Sandbox</h3>
              <p>
                Pilih metode pembayaran Midtrans langsung dari halaman ini. Setelah simulasi pembayaran selesai,
                status pesanan akan diperbarui otomatis.
              </p>
            </div>
          </div>

          {errorMessage ? (
            <div className="payment-gateway-status-card payment-gateway-status-card--error">
              <AlertCircle aria-hidden="true" />
              <div>
                <h3>Pembayaran Midtrans belum bisa dimuat</h3>
                <p>{errorMessage}</p>
                <button type="button" className="button ghost payment-gateway-retry-button" onClick={onRetry}>
                  <RefreshCw className="button-icon" aria-hidden="true" />
                  Muat Ulang Midtrans
                </button>
              </div>
            </div>
          ) : (
            <>
              {isPreparing && !isEmbedReady && (
                <div className="payment-gateway-status-card payment-gateway-status-card--pending">
                  <Loader2 className="spin" aria-hidden="true" />
                  <div>
                    <h3>Menyiapkan pembayaran Midtrans</h3>
                    <p>Tunggu sebentar, pilihan pembayaran sedang dimuat ke halaman ini.</p>
                  </div>
                </div>
              )}
              <div className="midtrans-embed-shell" aria-busy={isPreparing && !isEmbedReady}>
                <div id={embedContainerId} className="midtrans-embed-container" />
              </div>
            </>
          )}

          {isEmbedReady && !errorMessage && (
            <div className="payment-gateway-status-card payment-gateway-status-card--pending">
              <CreditCard aria-hidden="true" />
              <div>
                <h3>Menunggu pembayaran Midtrans</h3>
                <p>
                  Selesaikan simulasi pembayaran pada panel Midtrans di atas. Jangan refresh halaman sebelum proses
                  selesai.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="payment-gateway-status-card">
          <CheckCircle2 aria-hidden="true" />
          <div>
            <h3>
              {order.status === 'PROCESSING'
                ? 'Pembayaran berhasil'
                : order.status === 'CANCELLED'
                  ? 'Pembayaran tidak berhasil'
                  : 'Status pembayaran diperbarui'}
            </h3>
            <p>
              {order.status === 'PROCESSING'
                ? 'Pesanan sudah masuk proses dan tidak memerlukan pembayaran ulang.'
                : order.status === 'CANCELLED'
                  ? 'Transaksi gateway gagal atau kedaluwarsa, sehingga pesanan dibatalkan.'
                  : 'Pembayaran gateway sudah tidak berada di status menunggu pembayaran.'}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
