import { CheckCircle2, Loader2, Send, XCircle } from 'lucide-react'
import type { OrderFulfillmentMutation } from '../../../../types/order'

type Props = {
  mutation: OrderFulfillmentMutation
  submittingKey: string | null
  canActForStore: (storeId: number) => boolean
  onApprove: (mutationId: number) => void
  onReject: (mutationId: number) => void
  onReceive: (mutationId: number) => void
}

export function FulfillmentMutationActions({
  mutation,
  submittingKey,
  canActForStore,
  onApprove,
  onReject,
  onReceive,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {mutation.status === 'PENDING' && canActForStore(mutation.sourceStoreId) && (
        <>
          <button
            type="button"
            onClick={() => onApprove(mutation.id)}
            disabled={Boolean(submittingKey)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-none bg-admin-green px-3 py-1.5 text-xs font-semibold text-white transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submittingKey === `approve-${mutation.id}` ? (
              <Loader2 className="h-3.5 w-3.5 admin-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Setujui
          </button>
          <button
            type="button"
            onClick={() => onReject(mutation.id)}
            disabled={Boolean(submittingKey)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-none bg-admin-red-soft px-3 py-1.5 text-xs font-semibold text-admin-red transition-all hover:bg-admin-red/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submittingKey === `reject-${mutation.id}` ? (
              <Loader2 className="h-3.5 w-3.5 admin-spin" />
            ) : (
              <XCircle className="h-3.5 w-3.5" />
            )}
            Tolak
          </button>
        </>
      )}

      {mutation.status === 'IN_TRANSIT' && canActForStore(mutation.destinationStoreId) && (
        <button
          type="button"
          onClick={() => onReceive(mutation.id)}
          disabled={Boolean(submittingKey)}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-none bg-admin-blue px-3 py-1.5 text-xs font-semibold text-white transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submittingKey === `receive-${mutation.id}` ? (
            <Loader2 className="h-3.5 w-3.5 admin-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          Terima Barang
        </button>
      )}
    </div>
  )
}
