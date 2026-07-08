import { Link } from 'react-router-dom'
import { ClipboardList, ReceiptText, Store } from 'lucide-react'
import type { CheckoutOrder } from '../../types/order'
import {
  formatCurrency,
  formatDateTime,
  getOrderItemQuantity,
  getOrderItemsSummary,
  getPrimaryOrderImage,
  orderStatusDisplay,
} from './orderDisplay'

type OrderCardProps = {
  order: CheckoutOrder
}

export function OrderCard({ order }: OrderCardProps) {
  const statusMeta = orderStatusDisplay[order.status]
  const StatusIcon = statusMeta.Icon
  const primaryImage = getPrimaryOrderImage(order)

  return (
    <article className="order-card">
      <div className="order-card-content">
        <div className="order-card-image">
          {primaryImage ? (
            <img src={primaryImage.imageUrl} alt={getOrderItemsSummary(order)} />
          ) : (
            <ClipboardList aria-hidden="true" />
          )}
        </div>

        <div className="order-card-main">
          <div className="order-card-topline">
            <div>
              <p className="order-number">{order.orderNumber}</p>
              <span>{formatDateTime(order.createdAt)}</span>
            </div>
            <span className={`order-status-badge ${statusMeta.className}`}>
              <StatusIcon aria-hidden="true" />
              {statusMeta.label}
            </span>
          </div>

          <p className="order-product-summary">{getOrderItemsSummary(order)}</p>

          <div className="order-card-meta">
            <span>
              <Store aria-hidden="true" />
              Cabang {order.store.name}
            </span>
            <span>
              <ReceiptText aria-hidden="true" />
              {getOrderItemQuantity(order)} item
            </span>
          </div>
        </div>
      </div>

      <div className="order-card-side">
        <span>Total Bayar</span>
        <strong>{formatCurrency(order.totalAmount)}</strong>
        <em>
          {order.paymentMethod === 'MANUAL_TRANSFER'
            ? 'Transfer Manual'
            : 'Pembayaran Online'}
        </em>
        <Link to={`/orders/${order.id}`} className="button ghost order-detail-link">
          Lihat Detail
        </Link>
      </div>
    </article>
  )
}
