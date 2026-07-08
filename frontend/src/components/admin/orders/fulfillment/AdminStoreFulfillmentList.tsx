import { CheckCircle2, Loader2 } from 'lucide-react'
import type { OrderFulfillmentMutation } from '../../../../types/order'
import { AdminStoreFulfillmentGroupCard } from './AdminStoreFulfillmentGroupCard'
import type { FulfillmentAction, StoreFulfillmentGroup } from '../utils/storeFulfillmentGroup'

type Props = {
  loading: boolean
  groups: StoreFulfillmentGroup[]
  storeId: number
  onAction: (action: FulfillmentAction, mutations: OrderFulfillmentMutation[]) => void
  onViewDetail: (group: StoreFulfillmentGroup) => void
}

export function AdminStoreFulfillmentList({
  loading,
  groups,
  storeId,
  onAction,
  onViewDetail,
}: Props) {
  if (loading) {
    return (
      <section className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-admin-line-soft bg-admin-surface py-16 shadow-sm">
        <Loader2 className="h-8 w-8 text-admin-accent admin-spin" />
        <p className="m-0 text-sm text-admin-ink-muted">Memuat mutasi stok...</p>
      </section>
    )
  }

  if (groups.length === 0) {
    return (
      <section className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-admin-line-soft bg-admin-surface px-5 py-16 text-center shadow-sm">
        <CheckCircle2 className="h-10 w-10 text-admin-line" />
        <p className="m-0 text-sm font-semibold text-admin-ink">Tidak ada antrean pada filter ini</p>
        <p className="m-0 text-xs text-admin-ink-muted">Permintaan baru dibuat dari pesanan toko yang membutuhkan stok.</p>
      </section>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <AdminStoreFulfillmentGroupCard
          key={group.key}
          group={group}
          storeId={storeId}
          onAction={onAction}
          onViewDetail={onViewDetail}
        />
      ))}
    </div>
  )
}
