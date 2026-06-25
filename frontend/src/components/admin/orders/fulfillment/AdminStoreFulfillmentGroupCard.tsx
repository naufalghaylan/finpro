import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  Eye,
  PackageCheck,
  Send,
  XCircle,
} from 'lucide-react'
import type { OrderFulfillmentMutation } from '../../../../types/order'
import { formatDateTime } from '../../../orders/orderDisplay'
import {
  getGroupStatus,
  groupStatusDisplay,
  mutationStatusDisplay,
  type FulfillmentAction,
  type StoreFulfillmentGroup,
} from '../utils/storeFulfillmentGroup'

type Props = {
  group: StoreFulfillmentGroup
  storeId: number
  onAction: (action: FulfillmentAction, mutations: OrderFulfillmentMutation[]) => void
  onViewDetail: (group: StoreFulfillmentGroup) => void
}

export function AdminStoreFulfillmentGroupCard({ group, storeId, onAction, onViewDetail }: Props) {
  const incoming = group.destinationStore.id === storeId
  const groupStatus = getGroupStatus(group.mutations)
  const display = groupStatusDisplay[groupStatus]
  const totalQuantity = group.mutations.reduce((total, mutation) => total + mutation.quantity, 0)
  const canPrepareAll = (
    group.sourceStore.id === storeId &&
    group.mutations.every((mutation) => mutation.status === 'PENDING')
  )
  const canReceiveAll = (
    incoming &&
    group.mutations.every((mutation) => mutation.status === 'IN_TRANSIT')
  )

  return (
    <article className="overflow-hidden rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm transition-shadow hover:shadow-md">
      <header className="flex flex-col gap-4 border-b border-admin-line-soft bg-admin-surface-2/25 p-4 md:p-5 xl:flex-row xl:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${incoming ? 'bg-admin-green-soft text-admin-green' : 'bg-admin-blue-soft text-admin-blue'}`}>
            {incoming
              ? <ArrowDownToLine className="h-5 w-5" />
              : <ArrowUpFromLine className="h-5 w-5" />}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="m-0 truncate text-sm font-bold text-admin-ink">{group.orderNumber}</h4>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${display.className}`}>
                {display.label}
              </span>
            </div>
            <p className="m-0 mt-1 text-xs text-admin-ink-muted">
              {formatDateTime(group.createdAt)} - {group.mutations.length} produk - {totalQuantity} item
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-admin-line-soft bg-admin-surface px-3.5 py-3">
          <div className="min-w-0 flex-1">
            <p className="m-0 text-[10px] font-semibold uppercase tracking-wider text-admin-ink-muted">Dari</p>
            <p className="m-0 truncate text-xs font-bold text-admin-ink">{group.sourceStore.name}</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-admin-accent-strong" />
          <div className="min-w-0 flex-1 text-right">
            <p className="m-0 text-[10px] font-semibold uppercase tracking-wider text-admin-ink-muted">Ke</p>
            <p className="m-0 truncate text-xs font-bold text-admin-ink">{group.destinationStore.name}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onViewDetail(group)}
          className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-admin-line-soft bg-admin-surface px-3 text-xs font-semibold text-admin-ink-soft transition-all hover:bg-admin-surface-2 hover:text-admin-ink"
        >
          <Eye className="h-3.5 w-3.5" />
          Detail
        </button>
      </header>

      <div className="divide-y divide-admin-line-soft">
        {group.mutations.map((mutation) => {
          const itemDisplay = mutationStatusDisplay[mutation.status]
          const canPrepareItem = mutation.status === 'PENDING' && mutation.sourceStoreId === storeId
          const canReceiveItem = mutation.status === 'IN_TRANSIT' && mutation.destinationStoreId === storeId

          return (
            <div key={mutation.id} className="grid grid-cols-1 gap-3 px-4 py-3.5 md:grid-cols-[minmax(0,1fr)_100px_auto] md:items-center md:px-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="truncate text-sm text-admin-ink">{mutation.product.name}</strong>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${itemDisplay.className}`}>
                    {itemDisplay.label}
                  </span>
                </div>
                {mutation.notes && (
                  <p className="m-0 mt-1 truncate text-xs text-admin-ink-muted">{mutation.notes}</p>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 md:block md:text-right">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-admin-ink-muted md:block">Jumlah</span>
                <strong className="text-sm text-admin-ink">{mutation.quantity} item</strong>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                {canPrepareItem && (
                  <>
                    <button
                      type="button"
                      onClick={() => onAction('reject', [mutation])}
                      className="h-8 cursor-pointer rounded-lg border border-admin-red/20 bg-admin-red-soft px-2.5 text-[11px] font-semibold text-admin-red"
                    >
                      Tolak item
                    </button>
                    <button
                      type="button"
                      onClick={() => onAction('approve', [mutation])}
                      className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border-none bg-admin-surface-2 px-2.5 text-[11px] font-semibold text-admin-accent-strong"
                    >
                      <Send className="h-3 w-3" /> Kirim item
                    </button>
                  </>
                )}
                {canReceiveItem && (
                  <button
                    type="button"
                    onClick={() => onAction('receive', [mutation])}
                    className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border-none bg-admin-green-soft px-2.5 text-[11px] font-semibold text-admin-green"
                  >
                    <PackageCheck className="h-3 w-3" /> Terima item
                  </button>
                )}
                {!canPrepareItem && !canReceiveItem && (
                  <span className="text-xs text-admin-ink-muted">Tidak ada aksi</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {(canPrepareAll || canReceiveAll) && (
        <footer className="flex flex-col gap-3 border-t border-admin-line-soft bg-admin-surface-2/30 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between md:px-5">
          <div>
            <strong className="block text-xs text-admin-ink">Aksi untuk seluruh manifest</strong>
            <span className="text-xs text-admin-ink-muted">
              Berlaku untuk {group.mutations.length} produk dalam pengiriman ini.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canPrepareAll && (
              <>
                <button
                  type="button"
                  onClick={() => onAction('reject', group.mutations)}
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-admin-red/20 bg-admin-red-soft px-3 text-xs font-semibold text-admin-red"
                >
                  <XCircle className="h-3.5 w-3.5" /> Tolak semua
                </button>
                <button
                  type="button"
                  onClick={() => onAction('approve', group.mutations)}
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border-none bg-admin-accent px-3 text-xs font-semibold text-white"
                >
                  <Send className="h-3.5 w-3.5" /> Siapkan & kirim semua
                </button>
              </>
            )}
            {canReceiveAll && (
              <button
                type="button"
                onClick={() => onAction('receive', group.mutations)}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border-none bg-admin-green px-3 text-xs font-semibold text-white"
              >
                <PackageCheck className="h-3.5 w-3.5" /> Terima semua barang
              </button>
            )}
          </div>
        </footer>
      )}
    </article>
  )
}