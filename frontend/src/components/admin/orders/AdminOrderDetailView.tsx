import {
  ArrowLeft,
  CalendarClock,
  CircleDollarSign,
  MapPin,
  Package,
  StickyNote,
  Store,
  XCircle,
} from 'lucide-react'
import {
  getOrderDiscountBreakdown,
  getOrderItemQuantity,
  orderStatusDisplay,
} from '../../orders/orderDisplay'
import type { AdminOrder, OrderStatus } from '../../../types/order'
import { formatCurrency, formatDateTime } from '../../../utils/format'
import { AdminOrderItemsPanel } from './AdminOrderItemsPanel'
import { AdminOrderCustomerPanel } from './AdminOrderCustomerPanel'
import { AdminOrderFulfillmentPanel } from './AdminOrderFulfillmentPanel'
import { AdminOrderPaymentPanel } from './AdminOrderPaymentPanel'
import { AdminOrderActionPanel } from './AdminOrderActionPanel'

type AdminOrderDetailViewProps = {
  order: AdminOrder
  onBack: () => void
  onReviewPayment: () => void
  onCancelOrder: () => void
  onManageFulfillment: () => void
  onShipOrder: () => void
}

const statusBadgeClass: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'bg-admin-amber-soft text-admin-amber',
  WAITING_CONFIRMATION: 'bg-admin-blue-soft text-admin-blue',
  PROCESSING: 'bg-admin-green-soft text-admin-green',
  SHIPPED: 'bg-admin-blue-soft text-admin-blue',
  CONFIRMED: 'bg-admin-green-soft text-admin-green',
  CANCELLED: 'bg-admin-red-soft text-admin-red',
}

const canAdminCancelOrder = (order: AdminOrder) =>
  !['SHIPPED', 'CONFIRMED', 'CANCELLED'].includes(order.status)

export function AdminOrderDetailView({
  order,
  onBack,
  onReviewPayment,
  onCancelOrder,
  onManageFulfillment,
  onShipOrder,
}: AdminOrderDetailViewProps) {
  const statusMeta = orderStatusDisplay[order.status]
  const StatusIcon = statusMeta.Icon
  const totalItemQuantity = getOrderItemQuantity(order)
  const canReviewPayment =
    order.paymentMethod === 'MANUAL_TRANSFER' &&
    order.status === 'WAITING_CONFIRMATION' &&
    Boolean(order.paymentProof)
  const canCancel = canAdminCancelOrder(order)
  const canShipOrder = order.status === 'PROCESSING'
  const canManageFulfillment = canShipOrder && order.stockFulfillment.required
  const fulfillmentInProgress = !order.stockFulfillment.canShip
  const canShowActions = canReviewPayment || canManageFulfillment || canShipOrder || canCancel
  const {
    storeDiscountAmount,
    referralVoucherAmount,
    otherVoucherAmount,
    voucherLabel,
  } = getOrderDiscountBreakdown(order)
  const detailMetrics = [
    {
      label: 'Total Bayar',
      value: formatCurrency(order.totalAmount),
      Icon: CircleDollarSign,
    },
    {
      label: 'Total Item',
      value: `${totalItemQuantity} item`,
      Icon: Package,
    },
    {
      label: 'Cabang Pemroses',
      value: order.store.name,
      Icon: Store,
    },
    {
      label: 'Dibuat',
      value: formatDateTime(order.createdAt),
      Icon: CalendarClock,
    },
  ]

  return (
    <div className="admin-fade-in">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-admin-line-soft bg-admin-surface px-3 py-2 text-sm font-semibold text-admin-ink-soft transition-all hover:bg-admin-surface-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke daftar pesanan
          </button>
          <p className="m-0 mt-5 text-xs font-bold uppercase tracking-[0.16em] text-admin-accent-strong">
            Detail Pesanan
          </p>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-3">
            <h3 className="m-0 truncate text-2xl font-bold text-admin-ink">{order.orderNumber}</h3>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${statusBadgeClass[order.status]}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {statusMeta.label}
            </span>
          </div>
          <p className="m-0 mt-1 text-sm text-admin-ink-muted">
            Dipesan oleh {order.user.name}. Gunakan panel di bawah untuk memeriksa pembayaran, stok, dan pengiriman.
          </p>
        </div>
      </div>

      <section className="mb-5 grid grid-cols-1 gap-3 rounded-3xl border border-admin-line-soft bg-admin-surface p-3 shadow-sm sm:grid-cols-2 xl:grid-cols-4">
        {detailMetrics.map((metric) => {
          const Icon = metric.Icon

          return (
            <div key={metric.label} className="min-w-0 rounded-2xl border border-admin-line-soft bg-admin-surface-2/35 p-4">
              <div className="mb-2 flex items-center gap-2 text-admin-ink-muted">
                <Icon className="h-4 w-4 text-admin-accent-strong" />
                <span className="text-xs font-semibold uppercase tracking-wider">{metric.label}</span>
              </div>
              <strong className="block truncate text-sm text-admin-ink">{metric.value}</strong>
            </div>
          )
        })}
      </section>

      {order.status === 'CANCELLED' && order.cancelReason && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-admin-red/20 bg-admin-red-soft p-4">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-admin-red" />
          <div>
            <p className="m-0 text-sm font-bold text-admin-red">Pesanan Dibatalkan</p>
            <p className="m-0 mt-1 text-sm text-admin-red">{order.cancelReason}</p>
            {order.cancelledAt && (
              <p className="m-0 mt-1 text-xs text-admin-red/75">Dibatalkan pada {formatDateTime(order.cancelledAt)}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <AdminOrderItemsPanel order={order} />
          <AdminOrderCustomerPanel order={order} />
          <AdminOrderFulfillmentPanel order={order} />
        </div>

        <aside className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-24 xl:self-start">
          <AdminOrderPaymentPanel order={order} />

          <section className="rounded-2xl border border-admin-line-soft bg-admin-surface p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-admin-accent-strong" />
              <h4 className="m-0 text-base font-bold text-admin-ink">Pengiriman</h4>
            </div>
            <div className="space-y-3 text-sm">
              <div className="rounded-xl bg-admin-surface-2/35 p-3">
                <span className="block text-admin-ink-muted">Metode</span>
                <strong className="text-admin-ink">{order.shippingMethod || '-'}</strong>
              </div>
              <div className="rounded-xl bg-admin-surface-2/35 p-3">
                <span className="block text-admin-ink-muted">Layanan</span>
                <strong className="text-admin-ink">{order.shippingService || '-'}</strong>
              </div>
              <div className="rounded-xl bg-admin-surface-2/35 p-3">
                <span className="block text-admin-ink-muted">Cabang Pemroses</span>
                <strong className="text-admin-ink">{order.store.name}</strong>
              </div>
            </div>
          </section>

          {order.notes && (
            <section className="rounded-2xl border border-admin-line-soft bg-admin-surface p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-admin-accent-strong" />
                <h4 className="m-0 text-base font-bold text-admin-ink">Catatan Pesanan</h4>
              </div>
              <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-admin-ink-muted">{order.notes}</p>
            </section>
          )}

          <section className="rounded-2xl border border-admin-line-soft bg-admin-surface p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5 text-admin-accent-strong" />
              <h4 className="m-0 text-base font-bold text-admin-ink">Ringkasan</h4>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-admin-ink-muted">Total item</span>
                <strong className="text-admin-ink">{totalItemQuantity} item</strong>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-admin-ink-muted">Subtotal produk</span>
                <strong className="text-admin-ink">{formatCurrency(order.totalProductAmount)}</strong>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-admin-ink-muted">Ongkir</span>
                <strong className="text-admin-ink">{formatCurrency(order.shippingCost)}</strong>
              </div>
              {storeDiscountAmount > 0 && (
                <div className="flex justify-between gap-3">
                  <span className="text-admin-ink-muted">Diskon toko</span>
                  <strong className="text-admin-ink">-{formatCurrency(storeDiscountAmount)}</strong>
                </div>
              )}
              {referralVoucherAmount > 0 && (
                <div className="flex justify-between gap-3">
                  <span className="text-admin-ink-muted">Voucher referral</span>
                  <strong className="text-admin-ink">-{formatCurrency(referralVoucherAmount)}</strong>
                </div>
              )}
              {otherVoucherAmount > 0 && (
                <div className="flex justify-between gap-3">
                  <span className="text-admin-ink-muted">{voucherLabel ?? 'Voucher'}</span>
                  <strong className="text-admin-ink">-{formatCurrency(otherVoucherAmount)}</strong>
                </div>
              )}
              <div className="flex justify-between gap-3 border-t border-admin-line-soft pt-3">
                <span className="font-semibold text-admin-ink">Total bayar</span>
                <strong className="text-admin-ink">{formatCurrency(order.totalAmount)}</strong>
              </div>
            </div>
          </section>

          <AdminOrderActionPanel
            canShowActions={canShowActions}
            canReviewPayment={canReviewPayment}
            canManageFulfillment={canManageFulfillment}
            canShipOrder={canShipOrder}
            canCancel={canCancel}
            fulfillmentInProgress={fulfillmentInProgress}
            onReviewPayment={onReviewPayment}
            onCancelOrder={onCancelOrder}
            onManageFulfillment={onManageFulfillment}
            onShipOrder={onShipOrder}
          />
        </aside>
      </div>
    </div>
  )
}
