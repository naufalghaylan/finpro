import { StickyNote } from 'lucide-react'
import type { AdminOrder } from '../../../types/order'
import { canAdminCancelOrder } from '../../../utils/adminOrderDisplay'
import { AdminOrderItemsPanel } from './AdminOrderItemsPanel'
import { AdminOrderCustomerPanel } from './AdminOrderCustomerPanel'
import { AdminOrderFulfillmentPanel } from './AdminOrderFulfillmentPanel'
import { AdminOrderPaymentPanel } from './AdminOrderPaymentPanel'
import { AdminOrderActionPanel } from './AdminOrderActionPanel'
import { AdminOrderDetailHeader } from './AdminOrderDetailHeader'
import { AdminOrderMetrics } from './AdminOrderMetrics'
import { AdminOrderCancelBanner } from './AdminOrderCancelBanner'
import { AdminOrderShippingPanel } from './AdminOrderShippingPanel'
import { AdminOrderSummaryPanel } from './AdminOrderSummaryPanel'

type AdminOrderDetailViewProps = {
  order: AdminOrder
  onBack: () => void
  onReviewPayment: () => void
  onCancelOrder: () => void
  onManageFulfillment: () => void
  onShipOrder: () => void
}

export function AdminOrderDetailView({
  order,
  onBack,
  onReviewPayment,
  onCancelOrder,
  onManageFulfillment,
  onShipOrder,
}: AdminOrderDetailViewProps) {
  const canReviewPayment =
    order.paymentMethod === 'MANUAL_TRANSFER' &&
    order.status === 'WAITING_CONFIRMATION' &&
    Boolean(order.paymentProof)
  const canCancel = canAdminCancelOrder(order)
  const canShipOrder = order.status === 'PROCESSING'
  const canManageFulfillment = canShipOrder && order.stockFulfillment.required
  const fulfillmentInProgress = !order.stockFulfillment.canShip
  const canShowActions = canReviewPayment || canManageFulfillment || canShipOrder || canCancel

  return (
    <div className="admin-fade-in">
      <AdminOrderDetailHeader order={order} onBack={onBack} />
      <AdminOrderMetrics order={order} />
      <AdminOrderCancelBanner order={order} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <AdminOrderItemsPanel order={order} />
          <AdminOrderCustomerPanel order={order} />
          <AdminOrderFulfillmentPanel order={order} />
        </div>

        <aside className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-24 xl:self-start">
          <AdminOrderPaymentPanel order={order} />
          <AdminOrderShippingPanel order={order} />

          {order.notes && (
            <section className="rounded-2xl border border-admin-line-soft bg-admin-surface p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-admin-accent-strong" />
                <h4 className="m-0 text-base font-bold text-admin-ink">Catatan Pesanan</h4>
              </div>
              <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-admin-ink-muted">{order.notes}</p>
            </section>
          )}

          <AdminOrderSummaryPanel order={order} />

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
