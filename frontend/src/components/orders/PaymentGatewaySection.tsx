import { AlertCircle, CheckCircle2, CreditCard, Loader2, RefreshCw, XCircle } from 'lucide-react'
import type { CheckoutOrder } from '../../types/order'

type PaymentGatewaySectionProps = {
  order: CheckoutOrder
  embedContainerId: string
  isPreparing: boolean
  isEmbedReady: boolean
  errorMessage: string | null
  onRetry: () => void
}

const getResolvedGatewayCopy = (order: CheckoutOrder) => {
  if (order.status === 'CANCELLED') {
    return {
      title: 'Pembayaran tidak berhasil',
      description: 'Transaksi online gagal atau kedaluwarsa, sehingga pesanan dibatalkan.',
      Icon: XCircle,
      className: 'payment-gateway-status-card--error',
    }
  }

  if (order.status === 'PROCESSING') {
    return {
      title: 'Pembayaran berhasil',
      description: 'Pembayaran online sudah diterima. Pesanan sedang disiapkan oleh cabang PanenMart.',
      Icon: CheckCircle2,
      className: '',
    }
  }

  if (order.status === 'SHIPPED') {
    return {
      title: 'Pembayaran selesai, pesanan dikirim',
      description: 'Pembayaran online sudah selesai dan pesanan sedang dalam pengiriman.',
      Icon: CheckCircle2,
      className: '',
    }
  }

  if (order.status === 'CONFIRMED') {
    return {
      title: 'Pembayaran dan pesanan selesai',
      description: 'Pembayaran online sudah selesai dan pesanan sudah dikonfirmasi diterima.',
      Icon: CheckCircle2,
      className: '',
    }
  }

  return {
    title: 'Status pembayaran diperbarui',
    description: 'Pembayaran online sudah tidak berada di status menunggu pembayaran.',
    Icon: CheckCircle2,
    className: '',
  }
}

export function PaymentGatewaySection({
  order,
  embedContainerId,
  isPreparing,
  isEmbedReady,
  errorMessage,
  onRetry,
}: PaymentGatewaySectionProps) {
  const resolvedCopy = getResolvedGatewayCopy(order)
  const ResolvedIcon = resolvedCopy.Icon

  return (
    <section className="checkout-panel">
      <div className="checkout-section-title">
        <CreditCard aria-hidden="true" />
        <div>
          <h2>Pembayaran Online</h2>
          <p>Bayar pesanan melalui Midtrans. Status pesanan akan disinkronkan otomatis setelah pembayaran.</p>
        </div>
      </div>
      {order.status === 'PENDING_PAYMENT' ? (
        <div className="payment-gateway-card payment-gateway-card--embedded">
          <div className="payment-gateway-intro">
            <CreditCard aria-hidden="true" />
            <div>
              <h3>Midtrans</h3>
              <p>
                Pilih metode pembayaran Midtrans langsung dari halaman ini. Setelah pembayaran selesai,
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
                  Selesaikan pembayaran pada panel Midtrans di atas. Jangan refresh halaman sebelum proses
                  selesai.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={`payment-gateway-status-card ${resolvedCopy.className}`}>
          <ResolvedIcon aria-hidden="true" />
          <div>
            <h3>{resolvedCopy.title}</h3>
            <p>{resolvedCopy.description}</p>
          </div>
        </div>
      )}
    </section>
  )
}