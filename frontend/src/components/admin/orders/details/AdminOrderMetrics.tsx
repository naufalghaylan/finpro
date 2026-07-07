import { CalendarClock, CircleDollarSign, Package, Store } from 'lucide-react'
import type { AdminOrder } from '../../../../types/order'
import { getOrderItemQuantity } from '../../../orders/orderDisplay'
import { formatCurrency, formatDateTime } from '../../../../utils/format'

type AdminOrderMetricsProps = {
  order: AdminOrder
}

export function AdminOrderMetrics({ order }: AdminOrderMetricsProps) {
  const totalItemQuantity = getOrderItemQuantity(order)

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
  )
}
