import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '../../utils/format'
import { getSuccessDeadline, getSuccessPaymentDescription, getSuccessPaymentLabel } from './checkoutSuccessDisplay'

type CheckoutSuccessPanelProps = {
  order: {
    id: number
    orderNumber: string
    status: string
    paymentMethod: string
    totalAmount: number
    paymentDeadline: string | null
    store: { name: string }
  }
}

export function CheckoutSuccessPanel({ order }: CheckoutSuccessPanelProps) {
  return (
    <section className="checkout-success-card" aria-live="polite">
      <SuccessIcon />
      <SuccessMessage order={order} />
      <SuccessMetrics order={order} />
      <SuccessActions orderId={order.id} />
    </section>
  )
}

function SuccessIcon() {
  return <div className="checkout-success-icon"><CheckCircle2 aria-hidden="true" /></div>
}

function SuccessMessage({ order }: CheckoutSuccessPanelProps) {
  return (
    <>
      <p className="eyebrow">Order berhasil dibuat</p>
      <h1>{order.orderNumber}</h1>
      <p>Status pesanan sekarang <strong>{order.status}</strong>. {getSuccessPaymentDescription(order.paymentMethod)}</p>
    </>
  )
}

function SuccessMetrics({ order }: CheckoutSuccessPanelProps) {
  return (
    <div className="checkout-success-grid">
      <SuccessMetric label="Total Pembayaran" value={formatCurrency(order.totalAmount)} />
      <SuccessMetric label="Cabang Pengiriman" value={order.store.name} />
      <SuccessMetric label="Metode Bayar" value={getSuccessPaymentLabel(order.paymentMethod)} />
      <SuccessMetric label="Batas Bayar" value={getSuccessDeadline(order)} />
    </div>
  )
}

function SuccessMetric({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>
}

function SuccessActions({ orderId }: { orderId: number }) {
  return (
    <div className="checkout-success-actions">
      <Link to="/" className="button primary">Lanjut Belanja</Link>
      <Link to={`/orders/${orderId}`} className="button ghost">Lihat Detail Pesanan</Link>
    </div>
  )
}
