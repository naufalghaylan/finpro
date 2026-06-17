import { Truck } from 'lucide-react'
import type { AdminOrder, MutationStatus } from '../../../types/order'
import { formatDateTime } from '../../../utils/format'

type AdminOrderFulfillmentPanelProps = {
  order: AdminOrder
}

const mutationStatusLabel: Record<MutationStatus, string> = {
  PENDING: 'Menunggu Approval',
  APPROVED: 'Disetujui',
  IN_TRANSIT: 'Dalam Pengiriman',
  COMPLETED: 'Diterima',
  REJECTED: 'Ditolak',
}

const mutationStatusClass: Record<MutationStatus, string> = {
  PENDING: 'bg-admin-amber-soft text-admin-amber',
  APPROVED: 'bg-admin-blue-soft text-admin-blue',
  IN_TRANSIT: 'bg-admin-blue-soft text-admin-blue',
  COMPLETED: 'bg-admin-green-soft text-admin-green',
  REJECTED: 'bg-admin-red-soft text-admin-red',
}

export function AdminOrderFulfillmentPanel({ order }: AdminOrderFulfillmentPanelProps) {
  return (
    <section className="rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Truck className="w-5 h-5 text-admin-accent-strong" />
        <h4 className="text-base font-bold text-admin-ink m-0">Fulfillment</h4>
      </div>

      {order.stockMutations.length === 0 ? (
        <p className="text-sm text-admin-ink-muted m-0">Belum ada request fulfillment untuk pesanan ini.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {order.stockMutations.map((mutation) => (
            <div key={mutation.id} className="rounded-xl border border-admin-line-soft bg-admin-surface-2/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <strong className="block text-sm text-admin-ink">{mutation.product.name}</strong>
                  <span className="block text-xs text-admin-ink-muted mt-1">
                    {mutation.sourceStore.name} ke {mutation.destinationStore.name}
                  </span>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${mutationStatusClass[mutation.status]}`}>
                  {mutationStatusLabel[mutation.status]}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-xs">
                <div>
                  <span className="block text-admin-ink-muted">Quantity</span>
                  <strong className="text-admin-ink">{mutation.quantity}</strong>
                </div>
                <div>
                  <span className="block text-admin-ink-muted">Dibuat</span>
                  <strong className="text-admin-ink">{formatDateTime(mutation.createdAt)}</strong>
                </div>
                <div>
                  <span className="block text-admin-ink-muted">Dikirim</span>
                  <strong className="text-admin-ink">{formatDateTime(mutation.sentAt)}</strong>
                </div>
                <div>
                  <span className="block text-admin-ink-muted">Diterima</span>
                  <strong className="text-admin-ink">{formatDateTime(mutation.receivedAt)}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
