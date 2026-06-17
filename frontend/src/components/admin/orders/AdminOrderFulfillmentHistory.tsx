import { CheckCircle2, Loader2, Send, Truck, XCircle } from 'lucide-react'
import { formatDateTime } from '../../orders/orderDisplay'
import type { AdminOrder, MutationStatus } from '../../../types/order'

type AdminOrderFulfillmentHistoryProps = {
  order: AdminOrder
  actionNotes: string
  setActionNotes: (notes: string) => void
  submittingKey: string | null
  canActForStore: (storeId: number) => boolean
  onApprove: (mutationId: number) => void
  onReject: (mutationId: number) => void
  onReceive: (mutationId: number) => void
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

export function AdminOrderFulfillmentHistory({
  order,
  actionNotes,
  setActionNotes,
  submittingKey,
  canActForStore,
  onApprove,
  onReject,
  onReceive,
}: AdminOrderFulfillmentHistoryProps) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-base font-bold text-admin-ink m-0">Riwayat Fulfillment</h4>
          <p className="text-sm text-admin-ink-muted m-0 mt-1">
            Order bisa dikirim setelah request pending atau dalam pengiriman selesai.
          </p>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">
          Catatan Aksi
        </label>
        <input
          type="text"
          value={actionNotes}
          onChange={(event) => setActionNotes(event.target.value)}
          placeholder="Opsional untuk approve, reject, atau receive"
          className="w-full px-4 py-2.5 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                     placeholder:text-admin-ink-muted focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
        />
      </div>

      {order.stockMutations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 rounded-2xl border border-admin-line-soft bg-admin-surface-2/30">
          <Truck className="w-10 h-10 text-admin-line" />
          <p className="text-sm text-admin-ink-muted m-0 mt-3">Belum ada request fulfillment.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {order.stockMutations.map((mutation) => (
            <div
              key={mutation.id}
              className="rounded-2xl border border-admin-line-soft bg-admin-surface p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h5 className="text-sm font-bold text-admin-ink m-0">{mutation.product.name}</h5>
                  <p className="text-xs text-admin-ink-muted m-0 mt-1">
                    {mutation.sourceStore.name} ke {mutation.destinationStore.name}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${mutationStatusClass[mutation.status]}`}>
                  {mutationStatusLabel[mutation.status]}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4 text-xs">
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

              {mutation.notes && (
                <p className="text-xs text-admin-ink-soft leading-relaxed rounded-xl bg-admin-surface-2/50 px-3 py-2 m-0 mb-3">
                  {mutation.notes}
                </p>
              )}

              <div className="flex items-center justify-end gap-2">
                {mutation.status === 'PENDING' && canActForStore(mutation.sourceStoreId) && (
                  <>
                    <button
                      type="button"
                      onClick={() => onApprove(mutation.id)}
                      disabled={Boolean(submittingKey)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-admin-green
                                 border-none cursor-pointer hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      {submittingKey === `approve-${mutation.id}` ? (
                        <Loader2 className="w-3.5 h-3.5 admin-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => onReject(mutation.id)}
                      disabled={Boolean(submittingKey)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-admin-red bg-admin-red-soft
                                 border-none cursor-pointer hover:bg-admin-red/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      {submittingKey === `reject-${mutation.id}` ? (
                        <Loader2 className="w-3.5 h-3.5 admin-spin" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      Reject
                    </button>
                  </>
                )}

                {mutation.status === 'IN_TRANSIT' && canActForStore(mutation.destinationStoreId) && (
                  <button
                    type="button"
                    onClick={() => onReceive(mutation.id)}
                    disabled={Boolean(submittingKey)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-admin-blue
                               border-none cursor-pointer hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {submittingKey === `receive-${mutation.id}` ? (
                      <Loader2 className="w-3.5 h-3.5 admin-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    Receive
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
