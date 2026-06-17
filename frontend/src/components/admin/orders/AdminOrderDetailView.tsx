import { ArrowLeft, StickyNote, XCircle } from 'lucide-react'
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

const hasActiveFulfillment = (order: AdminOrder) =>
  order.stockMutations.some((mutation) => ['PENDING', 'IN_TRANSIT'].includes(mutation.status))

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
  const canReviewPayment =
    order.paymentMethod === 'MANUAL_TRANSFER' &&
    order.status === 'WAITING_CONFIRMATION' &&
    Boolean(order.paymentProof)
  const canCancel = canAdminCancelOrder(order)
  const canManageFulfillment = order.status === 'PROCESSING'
  const fulfillmentInProgress = hasActiveFulfillment(order)
  const canShowActions = canReviewPayment || canManageFulfillment || canCancel
  const {
    storeDiscountAmount,
    referralVoucherAmount,
    otherVoucherAmount,
    voucherLabel,
  } = getOrderDiscountBreakdown(order)

  return (
    <div className="admin-fade-in">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold
                       text-admin-ink-soft bg-admin-surface border border-admin-line-soft cursor-pointer
                       hover:bg-admin-surface-2 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke daftar pesanan
          </button>
          <p className="text-xs font-semibold uppercase tracking-wider text-admin-accent-strong m-0 mt-5">
            Detail Pesanan
          </p>
          <div className="flex items-center gap-3 flex-wrap mt-1">
            <h3 className="text-xl font-bold text-admin-ink m-0">{order.orderNumber}</h3>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusBadgeClass[order.status]}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusMeta.label}
            </span>
          </div>
          <p className="text-sm text-admin-ink-muted m-0 mt-1">
            Dibuat {formatDateTime(order.createdAt)} oleh {order.user.name}
          </p>
        </div>
      </div>

      {order.status === 'CANCELLED' && order.cancelReason && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 mb-0">
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700 m-0">Pesanan Dibatalkan</p>
            <p className="text-sm text-red-600 m-0 mt-1">{order.cancelReason}</p>
            {order.cancelledAt && (
              <p className="text-xs text-red-400 m-0 mt-1">Dibatalkan pada {formatDateTime(order.cancelledAt)}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        <div className="flex flex-col gap-6">
          <AdminOrderItemsPanel order={order} />
          <AdminOrderCustomerPanel order={order} />
          <AdminOrderFulfillmentPanel order={order} />
        </div>

        <aside className="flex flex-col gap-4">
          <AdminOrderPaymentPanel order={order} />

          <section className="rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <h4 className="text-base font-bold text-admin-ink m-0">Pengiriman</h4>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <span className="block text-admin-ink-muted">Metode</span>
                <strong className="text-admin-ink">{order.shippingMethod || '-'}</strong>
              </div>
              <div>
                <span className="block text-admin-ink-muted">Service</span>
                <strong className="text-admin-ink">{order.shippingService || '-'}</strong>
              </div>
              <div>
                <span className="block text-admin-ink-muted">Toko Pemroses</span>
                <strong className="text-admin-ink">{order.store.name}</strong>
              </div>
            </div>
          </section>

          {order.notes && (
            <section className="rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <StickyNote className="w-4 h-4 text-admin-accent-strong" />
                <h4 className="text-base font-bold text-admin-ink m-0">Catatan Pesanan</h4>
              </div>
              <p className="text-sm text-admin-ink-muted m-0 whitespace-pre-wrap">{order.notes}</p>
            </section>
          )}

          <section className="rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <h4 className="text-base font-bold text-admin-ink m-0">Ringkasan</h4>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-admin-ink-muted">Total item</span>
                <strong className="text-admin-ink">{getOrderItemQuantity(order)} item</strong>
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
              <div className="flex justify-between gap-3 pt-3 border-t border-admin-line-soft">
                <span className="font-semibold text-admin-ink">Total bayar</span>
                <strong className="text-admin-ink">{formatCurrency(order.totalAmount)}</strong>
              </div>
            </div>
          </section>

          <AdminOrderActionPanel
            canShowActions={canShowActions}
            canReviewPayment={canReviewPayment}
            canManageFulfillment={canManageFulfillment}
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
