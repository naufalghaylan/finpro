import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCurrency, formatDateTime } from '../../utils/format'

type CheckoutSuccessPanelProps = {
  order: {
    id: number
    orderNumber: string
    status: string
    paymentMethod: string
    totalAmount: number
    paymentDeadline: string | null
    store: {
      name: string
    }
  }
}

export function CheckoutSuccessPanel({ order }: CheckoutSuccessPanelProps) {
  return (
    <section className="checkout-success-card" aria-live="polite">
      <div className="checkout-success-icon">
        <CheckCircle2 aria-hidden="true" />
      </div>
      <p className="eyebrow">Order berhasil dibuat</p>
      <h1>{order.orderNumber}</h1>
      <p>
        Status pesanan sekarang <strong>{order.status}</strong>.{' '}
        {order.paymentMethod === 'MANUAL_TRANSFER'
          ? 'Upload bukti pembayaran diperlukan sebelum admin memproses pesanan.'
          : 'Pembayaran gateway disimulasikan berhasil sehingga order langsung masuk proses.'}
      </p>

      <div className="checkout-success-grid">
        <div>
          <span>Total Pembayaran</span>
          <strong>{formatCurrency(order.totalAmount)}</strong>
        </div>
        <div>
          <span>Store Pengiriman</span>
          <strong>{order.store.name}</strong>
        </div>
        <div>
          <span>Metode Bayar</span>
          <strong>
            {order.paymentMethod === 'MANUAL_TRANSFER' ? 'Transfer Manual' : 'Payment Gateway'}
          </strong>
        </div>
        <div>
          <span>Deadline Bayar</span>
          <strong>{order.paymentDeadline ? formatDateTime(order.paymentDeadline) : '-'}</strong>
        </div>
      </div>

      <div className="checkout-success-actions">
        <Link to="/" className="button primary">
          Lanjut Belanja
        </Link>
        <Link to={`/orders/${order.id}`} className="button ghost">
          Lihat Detail Pesanan
        </Link>
      </div>
    </section>
  )
}
