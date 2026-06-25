import { formatDateTime } from '../../orders/orderDisplay'
import type { OrderFulfillmentMutation } from '../../../types/order'
import { mutationStatusClass, mutationStatusLabel } from './adminFulfillmentDisplay'
import { FulfillmentMutationActions } from './FulfillmentMutationActions'

type Props = {
  mutation: OrderFulfillmentMutation
  submittingKey: string | null
  canActForStore: (storeId: number) => boolean
  onApprove: (mutationId: number) => void
  onReject: (mutationId: number) => void
  onReceive: (mutationId: number) => void
}

export function FulfillmentMutationCard({
  mutation,
  submittingKey,
  canActForStore,
  onApprove,
  onReject,
  onReceive,
}: Props) {
  return (
    <div className="rounded-2xl border border-admin-line-soft bg-admin-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h5 className="m-0 text-sm font-bold text-admin-ink">{mutation.product.name}</h5>
          <p className="m-0 mt-1 text-xs text-admin-ink-muted">
            {mutation.sourceStore.name} ke {mutation.destinationStore.name}
          </p>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${mutationStatusClass[mutation.status]}`}>
          {mutationStatusLabel[mutation.status]}
        </span>
      </div>

      <div className="my-4 grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
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

      {mutation.notes && (
        <p className="m-0 mb-3 rounded-xl bg-admin-surface-2/50 px-3 py-2 text-xs leading-relaxed text-admin-ink-soft">
          {mutation.notes}
        </p>
      )}

      <FulfillmentMutationActions
        mutation={mutation}
        submittingKey={submittingKey}
        canActForStore={canActForStore}
        onApprove={onApprove}
        onReject={onReject}
        onReceive={onReceive}
      />
    </div>
  )
}
