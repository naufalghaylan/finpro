import { AlertTriangle, X } from 'lucide-react'
import { AdminModal } from '../../AdminModal'
import type { AdminStoreFulfillmentActionTarget } from '../../../../hooks/admin/useAdminStoreFulfillmentPage'
import { AdminStoreFulfillmentActionFooter } from '../fulfillment/AdminStoreFulfillmentActionFooter'
import { storeFulfillmentActionCopy } from '../utils/storeFulfillmentActionDisplay'

type Props = {
  actionTarget: AdminStoreFulfillmentActionTarget | null
  actionNotes: string
  confirmed: boolean
  approvedQuantity: number
  submitting: boolean
  actionShouldClose: boolean
  onClose: () => void
  onSubmit: () => void
  onActionNotesChange: (notes: string) => void
  onConfirmedChange: (confirmed: boolean) => void
  onApprovedQuantityChange: (quantity: number) => void
}

export function AdminStoreFulfillmentActionModal({
  actionTarget,
  actionNotes,
  confirmed,
  approvedQuantity,
  submitting,
  actionShouldClose,
  onClose,
  onSubmit,
  onActionNotesChange,
  onConfirmedChange,
  onApprovedQuantityChange,
}: Props) {
  const actionLead = actionTarget?.mutations[0]
  if (!actionTarget || !actionLead) return null

  const copy = storeFulfillmentActionCopy[actionTarget.action]
  const actionProductCount = actionTarget.mutations.length
  const actionTotalQuantity = actionTarget.mutations.reduce((total, mutation) => total + mutation.quantity, 0)
  const isSingleApproval = actionTarget.action === 'approve' && actionProductCount === 1
  const isPartialApproval = isSingleApproval && approvedQuantity < actionLead.quantity
  const partialRemainingQuantity = Math.max(0, actionLead.quantity - approvedQuantity)
  const invalidApprovedQuantity = isSingleApproval && (
    approvedQuantity < 1 || approvedQuantity > actionLead.quantity
  )

  return (
    <AdminModal
      onClose={onClose}
      busy={submitting}
      requestClose={actionShouldClose}
      labelledBy="store-fulfillment-action-title"
    >
      {(closeModal) => (
        <>
          <div className="flex items-start justify-between gap-3 border-b border-admin-line-soft px-5 py-4">
            <div className="min-w-0">
              <p className="m-0 text-xs font-bold uppercase tracking-wider text-admin-accent-strong">
                {copy.eyebrow}
              </p>
              <h3 id="store-fulfillment-action-title" className="m-0 mt-1 wrap-break-word text-lg font-bold text-admin-ink">
                {copy.title}
              </h3>
              {actionProductCount > 1 && (
                <p className="m-0 mt-1 text-xs text-admin-ink-muted">
                  Aksi massal untuk {actionProductCount} produk - {actionTotalQuantity} item
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={closeModal}
              disabled={submitting}
              aria-label="Tutup"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-admin-line-soft bg-admin-surface disabled:opacity-40"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
            <div className="overflow-hidden rounded-xl border border-admin-line-soft bg-admin-surface-2/50">
              <div className="flex flex-wrap items-center gap-2 border-b border-admin-line-soft px-4 py-3 text-xs text-admin-ink-muted">
                <strong className="min-w-0 truncate text-admin-ink">{actionLead.order?.orderNumber ?? 'Mutasi stok'}</strong>
                <span className="hidden sm:inline">-</span>
                <span className="min-w-0 truncate">{actionLead.sourceStore.name} ke {actionLead.destinationStore.name}</span>
              </div>
              <div className="max-h-40 divide-y divide-admin-line-soft overflow-y-auto">
                {actionTarget.mutations.map((mutation) => (
                  <div key={mutation.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs">
                    <strong className="min-w-0 truncate text-admin-ink">{mutation.product.name}</strong>
                    <span className="shrink-0 text-admin-ink-muted">{mutation.quantity} item</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mb-0 mt-4 text-sm leading-6 text-admin-ink-soft">{copy.description}</p>
            {isSingleApproval && (
              <div className="mt-4 rounded-xl border border-admin-line-soft bg-admin-surface-2/50 p-4">
                <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[minmax(0,1fr)_140px]">
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-admin-ink-muted">
                      Diminta toko tujuan
                    </span>
                    <strong className="mt-1 block text-lg text-admin-ink">{actionLead.quantity} item</strong>
                  </div>
                  <label>
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-admin-ink-soft">
                      Jumlah dikirim
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={actionLead.quantity}
                      value={approvedQuantity}
                      onChange={(event) => onApprovedQuantityChange(Number(event.target.value))}
                      className="w-full rounded-xl border border-admin-line bg-admin-surface px-3.5 py-2.5 text-sm font-bold text-admin-ink focus:border-admin-accent focus:outline-none focus:ring-2 focus:ring-admin-accent/30"
                    />
                  </label>
                </div>
                {isPartialApproval && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-admin-amber/20 bg-admin-amber-soft/60 px-3 py-2.5">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-admin-amber" />
                    <p className="m-0 text-xs leading-5 text-admin-ink-soft">
                      {partialRemainingQuantity} item sisanya akan ditolak otomatis. Toko tujuan harus meminta sisa tersebut ke toko sumber lain.
                    </p>
                  </div>
                )}
                <p className="m-0 mt-2 text-xs text-admin-ink-muted">
                  Jika tidak dapat mengirim satu pun, tutup dialog lalu gunakan <strong>Tolak item</strong>.
                </p>
              </div>
            )}
            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-admin-ink-soft">Catatan aksi</span>
              <textarea
                value={actionNotes}
                onChange={(event) => onActionNotesChange(event.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Tambahkan catatan bila diperlukan"
                className="w-full resize-none rounded-xl border border-admin-line bg-admin-surface px-3.5 py-3 text-sm text-admin-ink placeholder:text-admin-ink-muted focus:outline-none focus:ring-2 focus:ring-admin-accent/30"
              />
            </label>
            {copy.confirmation && (
              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-admin-amber/25 bg-admin-amber-soft/60 p-3.5">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(event) => onConfirmedChange(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-admin-accent"
                />
                <span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-admin-ink">
                    <AlertTriangle className="h-3.5 w-3.5 text-admin-amber" /> Konfirmasi wajib
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-admin-ink-soft">{copy.confirmation}</span>
                </span>
              </label>
            )}
          </div>
          <AdminStoreFulfillmentActionFooter
            action={actionTarget.action}
            actionProductCount={actionProductCount}
            approvedQuantity={approvedQuantity}
            submitting={submitting}
            invalidApprovedQuantity={invalidApprovedQuantity}
            requiresConfirmation={Boolean(copy.confirmation)}
            confirmed={confirmed}
            onCancel={closeModal}
            onSubmit={onSubmit}
          />
        </>
      )}
    </AdminModal>
  )
}
