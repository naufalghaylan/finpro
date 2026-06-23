import { CheckCircle2, Truck } from 'lucide-react'
import type { AdminOrder, MutationStatus, StockFulfillmentStatus } from '../../../types/order'
import { formatDateTime } from '../../../utils/format'

type AdminOrderFulfillmentPanelProps = {
  order: AdminOrder
}

const mutationStatusLabel: Record<MutationStatus, string> = {
  PENDING: 'Menunggu Persetujuan',
  APPROVED: 'Disetujui',
  IN_TRANSIT: 'Dalam Perjalanan',
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

const fulfillmentStatusLabel: Record<StockFulfillmentStatus, string> = {
  NOT_REQUIRED: 'Tidak Dibutuhkan',
  REQUIRED: 'Perlu Mutasi',
  PENDING: 'Menunggu Persetujuan',
  IN_TRANSIT: 'Dalam Perjalanan',
  COMPLETED: 'Sudah Diterima',
  REJECTED: 'Ditolak - Pilih Toko Lain',
}

const fulfillmentStatusClass: Record<StockFulfillmentStatus, string> = {
  NOT_REQUIRED: 'bg-admin-green-soft text-admin-green',
  REQUIRED: 'bg-admin-amber-soft text-admin-amber',
  PENDING: 'bg-admin-amber-soft text-admin-amber',
  IN_TRANSIT: 'bg-admin-blue-soft text-admin-blue',
  COMPLETED: 'bg-admin-green-soft text-admin-green',
  REJECTED: 'bg-admin-red-soft text-admin-red',
}

export function AdminOrderFulfillmentPanel({ order }: AdminOrderFulfillmentPanelProps) {
  return (
    <section className="rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm p-5">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-admin-accent-strong" />
          <h4 className="text-base font-bold text-admin-ink m-0">Mutasi Stok</h4>
        </div>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${fulfillmentStatusClass[order.stockFulfillment.status]}`}>
          {fulfillmentStatusLabel[order.stockFulfillment.status]}
        </span>
      </div>

      {order.stockFulfillment.requirements.length === 0 ? (
        <div className="flex items-start gap-3 rounded-xl bg-admin-green-soft p-3.5">
          <CheckCircle2 className="w-5 h-5 text-admin-green shrink-0 mt-0.5" />
          <p className="text-sm text-admin-green m-0">Stok toko pemroses mencukupi. Pesanan tidak memerlukan mutasi stok.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {order.stockFulfillment.requirements.map((requirement) => (
            <div key={requirement.productId} className="rounded-xl border border-admin-line-soft bg-admin-surface-2/40 p-3.5">
              <strong className="block text-sm text-admin-ink">{requirement.productName}</strong>
              <span className="block text-xs text-admin-ink-muted mt-1">
                Butuh {requirement.requiredQuantity} item dari toko lain
              </span>
              <div className="flex items-center justify-between gap-3 mt-3 text-xs">
                <span className="text-admin-ink-muted">Sisa permintaan</span>
                <strong className="text-admin-ink">{requirement.remainingQuantity} item</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {order.stockMutations.length === 0 ? (
        order.stockFulfillment.required && (
          <p className="text-sm text-admin-ink-muted m-0">Belum ada permintaan mutasi stok. Pilih toko sumber melalui aksi admin.</p>
        )
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
                  <span className="block text-admin-ink-muted">Jumlah</span>
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
