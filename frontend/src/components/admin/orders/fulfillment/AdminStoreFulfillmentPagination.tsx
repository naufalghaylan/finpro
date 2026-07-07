import type { OrderListMeta } from '../../../../types/order'

type Props = {
  loading: boolean
  meta: OrderListMeta
  onPrevious: () => void
  onNext: () => void
}

export function AdminStoreFulfillmentPagination({ loading, meta, onPrevious, onNext }: Props) {
  if (loading || meta.totalPages <= 1) return null

  return (
    <div className="mt-4 flex items-center justify-between rounded-xl border border-admin-line-soft bg-admin-surface px-5 py-3.5 shadow-sm">
      <button
        type="button"
        disabled={!meta.hasPreviousPage}
        onClick={onPrevious}
        className="cursor-pointer rounded-lg border border-admin-line-soft bg-admin-surface px-3.5 py-2 text-sm text-admin-ink-soft disabled:opacity-40"
      >
        Sebelumnya
      </button>
      <span className="text-xs text-admin-ink-muted">Halaman {meta.page} dari {meta.totalPages}</span>
      <button
        type="button"
        disabled={!meta.hasNextPage}
        onClick={onNext}
        className="cursor-pointer rounded-lg border border-admin-line-soft bg-admin-surface px-3.5 py-2 text-sm text-admin-ink-soft disabled:opacity-40"
      >
        Selanjutnya
      </button>
    </div>
  )
}
