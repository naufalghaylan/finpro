import { X } from 'lucide-react'
import { AdminModal } from '../../AdminModal'
import { formatDateTime } from '../../../orders/orderDisplay'
import {
  getGroupStatus,
  groupStatusDisplay,
  mutationStatusDisplay,
  type StoreFulfillmentGroup,
} from '../utils/storeFulfillmentGroup'

type Props = {
  group: StoreFulfillmentGroup | null
  onClose: () => void
}

export function AdminStoreFulfillmentDetailModal({ group, onClose }: Props) {
  if (!group) return null

  const detailStatus = getGroupStatus(group.mutations)
  const detailDisplay = groupStatusDisplay[detailStatus]
  const totalQuantity = group.mutations.reduce((total, mutation) => total + mutation.quantity, 0)

  return (
    <AdminModal
      onClose={onClose}
      labelledBy="store-fulfillment-detail-title"
      maxWidthClassName="max-w-3xl"
    >
      {(closeModal) => (
        <>
          <div className="flex items-start justify-between gap-3 border-b border-admin-line-soft px-5 py-4">
            <div className="min-w-0">
              <p className="m-0 text-xs font-bold uppercase tracking-wider text-admin-accent-strong">
                Detail Mutasi Stok
              </p>
              <h3 id="store-fulfillment-detail-title" className="m-0 mt-1 truncate text-lg font-bold text-admin-ink">
                {group.orderNumber}
              </h3>
              <p className="m-0 mt-1 text-xs text-admin-ink-muted">
                {group.mutations.length} produk - {totalQuantity} item
              </p>
            </div>
            <button
              type="button"
              onClick={closeModal}
              aria-label="Tutup detail mutasi stok"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-admin-line-soft bg-admin-surface transition-colors hover:bg-admin-surface-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-admin-line-soft bg-admin-surface-2/35 p-4">
                <span className="block text-xs font-semibold uppercase tracking-wider text-admin-ink-muted">Status</span>
                <strong className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs ${detailDisplay.className}`}>
                  {detailDisplay.label}
                </strong>
              </div>
              <div className="rounded-xl border border-admin-line-soft bg-admin-surface-2/35 p-4">
                <span className="block text-xs font-semibold uppercase tracking-wider text-admin-ink-muted">Dari</span>
                <strong className="mt-2 block truncate text-sm text-admin-ink">{group.sourceStore.name}</strong>
              </div>
              <div className="rounded-xl border border-admin-line-soft bg-admin-surface-2/35 p-4">
                <span className="block text-xs font-semibold uppercase tracking-wider text-admin-ink-muted">Ke</span>
                <strong className="mt-2 block truncate text-sm text-admin-ink">{group.destinationStore.name}</strong>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-admin-line-soft bg-admin-surface">
              <div className="grid grid-cols-[minmax(0,1fr)_90px_130px] gap-3 border-b border-admin-line-soft bg-admin-surface-2/45 px-4 py-3 text-xs font-bold uppercase tracking-wider text-admin-ink-soft">
                <span>Produk</span>
                <span className="text-right">Jumlah</span>
                <span>Status</span>
              </div>
              <div className="divide-y divide-admin-line-soft">
                {group.mutations.map((mutation) => {
                  const mutationDisplay = mutationStatusDisplay[mutation.status]
                  const timeline = [
                    ['Dibuat', mutation.createdAt],
                    ['Disetujui', mutation.approvedAt],
                    ['Dikirim', mutation.sentAt],
                    ['Diterima', mutation.receivedAt],
                    ['Ditolak', mutation.rejectedAt],
                  ].filter(([, value]) => Boolean(value))

                  return (
                    <article key={mutation.id} className="px-4 py-3.5">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_90px_130px] md:items-start">
                        <div className="min-w-0">
                          <strong className="block truncate text-sm text-admin-ink">{mutation.product.name}</strong>
                          {mutation.notes && (
                            <p className="m-0 mt-1 break-words text-xs leading-5 text-admin-ink-muted">{mutation.notes}</p>
                          )}
                        </div>
                        <div className="flex justify-between gap-2 md:block md:text-right">
                          <span className="text-xs text-admin-ink-muted md:hidden">Jumlah</span>
                          <strong className="text-sm text-admin-ink">{mutation.quantity}</strong>
                        </div>
                        <span className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-bold ${mutationDisplay.className}`}>
                          {mutationDisplay.label}
                        </span>
                      </div>

                      {timeline.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-admin-ink-muted">
                          {timeline.map(([label, value]) => (
                            <span key={`${mutation.id}-${label}`} className="rounded-full bg-admin-surface-2 px-2.5 py-1">
                              {label}: {formatDateTime(value as string)}
                            </span>
                          ))}
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </AdminModal>
  )
}
