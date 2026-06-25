import { AdminOrderFulfillmentHistory } from './AdminOrderFulfillmentHistory'
import type { AdminOrder } from '../../../types/order'
import type { FulfillmentConfirmation } from '../../../hooks/admin/useAdminOrderFulfillment'

type Props = {
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

export function FulfillmentHistoryColumn(props: Props) {
  return (
    <div className="min-h-0 min-w-0 bg-admin-surface px-5 py-5 md:px-6 xl:overflow-y-auto xl:overscroll-contain">
      <AdminOrderFulfillmentHistory {...props} />
    </div>
  )
}
