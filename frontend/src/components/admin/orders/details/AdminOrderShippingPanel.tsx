import { MapPin } from 'lucide-react'
import type { AdminOrder } from '../../../../types/order'

type AdminOrderShippingPanelProps = {
  order: AdminOrder
}

export function AdminOrderShippingPanel({ order }: AdminOrderShippingPanelProps) {
  return (
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
  )
}
