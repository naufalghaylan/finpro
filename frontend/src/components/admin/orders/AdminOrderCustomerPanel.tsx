import { Mail, MapPin } from 'lucide-react'
import type { AdminOrder } from '../../../types/order'

type AdminOrderCustomerPanelProps = {
  order: AdminOrder
}

const getAddressLine = (order: AdminOrder) =>
  [
    order.address.address,
    order.address.district,
    order.address.city,
    order.address.province,
    order.address.postalCode,
  ]
    .filter(Boolean)
    .join(', ')

export function AdminOrderCustomerPanel({ order }: AdminOrderCustomerPanelProps) {
  return (
    <section className="rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-admin-accent-strong" />
        <h4 className="text-base font-bold text-admin-ink m-0">Alamat Pembeli</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="rounded-xl border border-admin-line-soft bg-admin-surface-2/40 p-4">
          <span className="block text-xs font-semibold uppercase tracking-wider text-admin-ink-muted mb-2">
            Penerima
          </span>
          <strong className="block text-admin-ink">{order.address.recipientName}</strong>
          <span className="block text-admin-ink-soft mt-1">{order.address.phone}</span>
        </div>
        <div className="rounded-xl border border-admin-line-soft bg-admin-surface-2/40 p-4">
          <span className="block text-xs font-semibold uppercase tracking-wider text-admin-ink-muted mb-2">
            Akun
          </span>
          <strong className="block text-admin-ink">{order.user.name}</strong>
          <span className="inline-flex items-center gap-1.5 text-admin-ink-soft mt-1">
            <Mail className="w-3.5 h-3.5" />
            {order.user.email}
          </span>
          {order.user.phone && (
            <span className="block text-admin-ink-soft mt-1">{order.user.phone}</span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-admin-line-soft bg-admin-surface-2/40 p-4 mt-4">
        <span className="block text-xs font-semibold uppercase tracking-wider text-admin-ink-muted mb-2">
          Alamat Lengkap
        </span>
        <p className="text-sm text-admin-ink-soft leading-relaxed m-0">{getAddressLine(order)}</p>
      </div>
    </section>
  )
}
