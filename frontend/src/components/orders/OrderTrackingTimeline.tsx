import {
  Check,
  CheckCircle2,
  Clock3,
  PackageCheck,
  ReceiptText,
  Truck,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import type { CheckoutOrder, OrderStatus } from '../../types/order'
import { formatTrackingDateTime } from './orderDisplay'

type TrackingStep = {
  key: string
  titleLines: string[]
  description: string
  Icon: LucideIcon
}

type TrackingStepState = 'done' | 'active' | 'pending' | 'cancelled'

const statusStepIndex: Record<OrderStatus, number> = {
  PENDING_PAYMENT: 1,
  WAITING_CONFIRMATION: 1,
  PROCESSING: 2,
  SHIPPED: 3,
  CONFIRMED: 4,
  CANCELLED: 1,
}

const addHours = (dateValue: string, hours: number) => {
  const date = new Date(dateValue)
  date.setHours(date.getHours() + hours)

  return date.toISOString()
}

const getPaymentStepTitle = (order: CheckoutOrder) => {
  if (order.status === 'WAITING_CONFIRMATION') return 'Menunggu Konfirmasi'
  if (order.status === 'CANCELLED') return 'Pesanan Dibatalkan'

  return 'Menunggu Pembayaran'
}

const getPaymentStepDescription = (order: CheckoutOrder) => {
  if (order.status === 'CANCELLED') return formatTrackingDateTime(order.cancelledAt)
  if (order.status === 'WAITING_CONFIRMATION') return 'Bukti bayar menunggu admin'
  if (order.status === 'PENDING_PAYMENT' && order.paymentDeadline) {
    return `Batas ${formatTrackingDateTime(order.paymentDeadline)}`
  }
  if (order.status === 'PROCESSING' || order.status === 'SHIPPED' || order.status === 'CONFIRMED') {
    return order.paymentMethod === 'PAYMENT_GATEWAY' ? 'Pembayaran berhasil' : 'Pembayaran dikonfirmasi'
  }

  return 'Menunggu update'
}

const getProcessingDescription = (order: CheckoutOrder) => {
  if (order.status === 'PROCESSING') return `Update ${formatTrackingDateTime(order.updatedAt)}`
  if (order.status === 'SHIPPED' || order.status === 'CONFIRMED') return 'Sudah diproses'
  if (order.status === 'CANCELLED') return 'Tidak dilanjutkan'

  const estimatedDate = order.paymentDeadline ?? addHours(order.createdAt, 1)
  return `Estimasi ${formatTrackingDateTime(estimatedDate)}`
}

const getTrackingSteps = (order: CheckoutOrder): TrackingStep[] => [
  {
    key: 'created',
    titleLines: ['Pesanan', 'Dibuat'],
    description: formatTrackingDateTime(order.createdAt),
    Icon: CheckCircle2,
  },
  {
    key: 'payment',
    titleLines: getPaymentStepTitle(order).split(' '),
    description: getPaymentStepDescription(order),
    Icon: ReceiptText,
  },
  {
    key: 'processing',
    titleLines: ['Diproses'],
    description: getProcessingDescription(order),
    Icon: PackageCheck,
  },
  {
    key: 'shipping',
    titleLines: ['Sedang', 'Dikirim'],
    description: order.shippedAt ? formatTrackingDateTime(order.shippedAt) : 'Menunggu update',
    Icon: Truck,
  },
  {
    key: 'completed',
    titleLines: ['Pesanan', 'Selesai'],
    description: order.confirmedAt ? formatTrackingDateTime(order.confirmedAt) : 'Menunggu update',
    Icon: CheckCircle2,
  },
]

const getStepState = (order: CheckoutOrder, stepIndex: number): TrackingStepState => {
  if (order.status === 'CANCELLED' && stepIndex === statusStepIndex.CANCELLED) return 'cancelled'
  if (order.status === 'CONFIRMED') return 'done'

  const activeIndex = statusStepIndex[order.status]
  if (stepIndex < activeIndex) return 'done'
  if (stepIndex === activeIndex) return 'active'

  return 'pending'
}

export function OrderTrackingTimeline({ order }: { order: CheckoutOrder }) {
  const steps = getTrackingSteps(order)
  const activeIndex = statusStepIndex[order.status]

  return (
    <section className={`checkout-panel order-tracking-panel ${order.status === 'CANCELLED' ? 'cancelled' : ''}`}>
      <div className="checkout-section-title order-tracking-title">
        <Clock3 aria-hidden="true" />
        <div>
          <h2>Tracking Pesanan</h2>
          <p>Ikuti perkembangan pesanan dari pembayaran sampai barang diterima.</p>
        </div>
      </div>

      <div className="order-tracking-list" aria-label="Status tracking pesanan">
        {steps.map((step, index) => {
          const state = getStepState(order, index)
          const Icon = state === 'done' ? Check : state === 'cancelled' ? XCircle : step.Icon
          const isLineDone = order.status === 'CONFIRMED' ? index < steps.length - 1 : index < activeIndex

          return (
            <div
              key={step.key}
              className={`order-tracking-step ${state} ${isLineDone ? 'line-done' : ''}`}
              aria-current={state === 'active' || state === 'cancelled' ? 'step' : undefined}
            >
              <span className="order-tracking-icon">
                <Icon aria-hidden="true" />
              </span>
              <strong className={`order-tracking-label ${step.titleLines.length === 1 ? 'merged' : ''}`}>
                {step.titleLines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </strong>
              <span className="order-tracking-description">{step.description}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
