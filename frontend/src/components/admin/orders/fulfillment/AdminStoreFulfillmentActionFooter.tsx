import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import type { FulfillmentAction } from '../utils/storeFulfillmentGroup'
import { storeFulfillmentActionCopy } from '../utils/storeFulfillmentActionDisplay'

type Props = {
  action: FulfillmentAction
  actionProductCount: number
  approvedQuantity: number
  submitting: boolean
  invalidApprovedQuantity: boolean
  requiresConfirmation: boolean
  confirmed: boolean
  onCancel: () => void
  onSubmit: () => void
}

export function AdminStoreFulfillmentActionFooter({
  action,
  actionProductCount,
  approvedQuantity,
  submitting,
  invalidApprovedQuantity,
  requiresConfirmation,
  confirmed,
  onCancel,
  onSubmit,
}: Props) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-admin-line-soft px-5 py-4 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        disabled={submitting}
        className="w-full cursor-pointer rounded-xl border border-admin-line bg-admin-surface px-4 py-2.5 text-sm font-semibold text-admin-ink-soft disabled:opacity-40 sm:w-auto"
      >
        Batal
      </button>
      <button
        type="button"
        onClick={() => void onSubmit()}
        disabled={submitting || invalidApprovedQuantity || (requiresConfirmation && !confirmed)}
        className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-none px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40 sm:w-auto ${action === 'reject' ? 'bg-admin-red' : action === 'receive' ? 'bg-admin-green' : 'bg-admin-accent'}`}
      >
        {submitting
          ? <Loader2 className="h-4 w-4 admin-spin" />
          : action === 'reject'
            ? <XCircle className="h-4 w-4" />
            : <CheckCircle2 className="h-4 w-4" />}
        {storeFulfillmentActionCopy[action].button}
        {actionProductCount > 1
          ? ` (${actionProductCount} produk)`
          : action === 'approve'
            ? ` (${approvedQuantity} item)`
            : ''}
      </button>
    </div>
  )
}
