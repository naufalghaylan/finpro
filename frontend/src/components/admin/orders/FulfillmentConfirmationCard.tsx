import { AlertTriangle, Loader2 } from 'lucide-react'
import type { FulfillmentConfirmation } from '../../../hooks/admin/useAdminOrderFulfillment'

type Props = {
  pendingConfirmation: FulfillmentConfirmation
  submittingKey: string | null
  onCancel: () => void
  onConfirm: () => void
}

export function FulfillmentConfirmationCard({
  pendingConfirmation,
  submittingKey,
  onCancel,
  onConfirm,
}: Props) {
  const confirmationSubmitting = submittingKey === `${pendingConfirmation.type}-${pendingConfirmation.mutationId}`
  const confirmationToneClass = pendingConfirmation.tone === 'info'
    ? 'border-admin-blue/20 bg-admin-blue-soft text-admin-blue'
    : 'border-admin-green/20 bg-admin-green-soft text-admin-green'

  return (
    <div className={`mb-4 rounded-2xl border p-4 ${confirmationToneClass}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <h5 className="m-0 text-sm font-bold text-admin-ink">{pendingConfirmation.title}</h5>
          <p className="m-0 mt-1 text-xs leading-5 text-admin-ink-soft">{pendingConfirmation.message}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={Boolean(submittingKey)}
          className="inline-flex items-center justify-center rounded-xl border border-admin-line-soft bg-admin-surface px-4 py-2 text-xs font-semibold text-admin-ink-soft transition-all hover:bg-admin-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Cek Lagi
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={Boolean(submittingKey)}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border-none px-4 py-2 text-xs font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40 ${pendingConfirmation.tone === 'info' ? 'bg-admin-blue' : 'bg-admin-green'}`}
        >
          {confirmationSubmitting && <Loader2 className="h-3.5 w-3.5 admin-spin" />}
          {pendingConfirmation.confirmLabel}
        </button>
      </div>
    </div>
  )
}
