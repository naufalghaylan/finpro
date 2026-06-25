import type { AdminOrder } from '../../../types/order'
import type { FulfillmentConfirmation } from '../../../hooks/admin/useAdminOrderFulfillment'
import { FulfillmentConfirmationCard } from './FulfillmentConfirmationCard'
import { FulfillmentHistoryEmptyState } from './FulfillmentHistoryEmptyState'
import { FulfillmentMutationCard } from './FulfillmentMutationCard'

type AdminOrderFulfillmentHistoryProps = {
  order: AdminOrder
  actionNotes: string
  setActionNotes: (notes: string) => void
  submittingKey: string | null
  pendingConfirmation: FulfillmentConfirmation | null
  canActForStore: (storeId: number) => boolean
  onApprove: (mutationId: number) => void
  onReject: (mutationId: number) => void
  onReceive: (mutationId: number) => void
  onCancelConfirmation: () => void
  onConfirmConfirmation: () => void
}

export function AdminOrderFulfillmentHistory({
  order,
  actionNotes,
  setActionNotes,
  submittingKey,
  pendingConfirmation,
  canActForStore,
  onApprove,
  onReject,
  onReceive,
  onCancelConfirmation,
  onConfirmConfirmation,
}: AdminOrderFulfillmentHistoryProps) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h4 className="m-0 text-base font-bold text-admin-ink">Riwayat Mutasi Stok</h4>
          <p className="m-0 mt-1 text-sm text-admin-ink-muted">
            Pesanan baru bisa dikirim setelah seluruh proses mutasi stok selesai.
          </p>
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-admin-ink-soft">
          Catatan Aksi
        </label>
        <input
          type="text"
          value={actionNotes}
          onChange={(event) => setActionNotes(event.target.value)}
          placeholder="Opsional untuk persetujuan, penolakan, atau penerimaan"
          className="w-full rounded-xl border border-admin-line bg-admin-surface px-4 py-2.5 text-sm text-admin-ink transition-all placeholder:text-admin-ink-muted focus:border-admin-accent focus:outline-none focus:ring-2 focus:ring-admin-accent/30"
        />
      </div>

      {pendingConfirmation && (
        <FulfillmentConfirmationCard
          pendingConfirmation={pendingConfirmation}
          submittingKey={submittingKey}
          onCancel={onCancelConfirmation}
          onConfirm={onConfirmConfirmation}
        />
      )}

      {order.stockMutations.length === 0 ? (
        <FulfillmentHistoryEmptyState />
      ) : (
        <div className="flex flex-col gap-3">
          {order.stockMutations.map((mutation) => (
            <FulfillmentMutationCard
              key={mutation.id}
              mutation={mutation}
              submittingKey={submittingKey}
              canActForStore={canActForStore}
              onApprove={onApprove}
              onReject={onReject}
              onReceive={onReceive}
            />
          ))}
        </div>
      )}
    </section>
  )
}
