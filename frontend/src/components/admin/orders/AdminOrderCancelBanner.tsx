import { XCircle } from 'lucide-react'
import type { AdminOrder } from '../../../types/order'
import { formatDateTime } from '../../../utils/format'

type AdminOrderCancelBannerProps = {
  order: AdminOrder
}

export function AdminOrderCancelBanner({ order }: AdminOrderCancelBannerProps) {
  if (order.status !== 'CANCELLED' || !order.cancelReason) return null

  return (
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
  )
}
