import { Mail, MapPin, Phone } from 'lucide-react'
import type { AdminOrder } from '../../../../types/order'

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
    <section className="rounded-2xl border border-admin-line-soft bg-admin-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <MapPin className="h-5 w-5 text-admin-accent-strong" />
        <h4 className="m-0 text-base font-bold text-admin-ink">Alamat Pembeli</h4>
      </div>

      <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
        <div className="min-w-0 rounded-xl border border-admin-line-soft bg-admin-surface-2/35 p-4">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-admin-ink-muted">
            Penerima
          </span>
          <strong className="block truncate text-admin-ink">{order.address.recipientName}</strong>
          <span className="mt-1 inline-flex max-w-full items-center gap-1.5 text-admin-ink-soft">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{order.address.phone}</span>
          </span>
        </div>
        <div className="min-w-0 rounded-xl border border-admin-line-soft bg-admin-surface-2/35 p-4">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-admin-ink-muted">
            Akun
          </span>
          <strong className="block truncate text-admin-ink">{order.user.name}</strong>
          <span className="mt-1 inline-flex max-w-full items-center gap-1.5 text-admin-ink-soft">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{order.user.email}</span>
          </span>
          {order.user.phone && (
            <span className="mt-1 block truncate text-admin-ink-soft">{order.user.phone}</span>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-admin-line-soft bg-admin-surface-2/35 p-4">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-admin-ink-muted">
          Alamat Lengkap
        </span>
        <p className="m-0 break-words text-sm leading-relaxed text-admin-ink-soft">{getAddressLine(order)}</p>
      </div>
    </section>
  )
}
