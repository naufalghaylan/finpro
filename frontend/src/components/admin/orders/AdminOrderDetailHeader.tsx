import { ArrowLeft } from 'lucide-react'
import type { AdminOrder } from '../../../types/order'
import { orderStatusDisplay } from '../../orders/orderDisplay'
import { statusBadgeClass } from '../../../utils/adminOrderDisplay'

type AdminOrderDetailHeaderProps = {
  order: AdminOrder
  onBack: () => void
}

export function AdminOrderDetailHeader({ order, onBack }: AdminOrderDetailHeaderProps) {
  const statusMeta = orderStatusDisplay[order.status]
  const StatusIcon = statusMeta.Icon

  return (
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
  )
}
