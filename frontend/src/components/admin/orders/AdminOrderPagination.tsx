import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { OrderListMeta } from '../../../types/order'

type AdminOrderPaginationProps = {
  meta: OrderListMeta
  onPageChange: (updater: (currentPage: number) => number) => void
}

export function AdminOrderPagination({ meta, onPageChange }: AdminOrderPaginationProps) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-t border-admin-line-soft/50 bg-admin-surface-2/20">
      <button
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                   text-admin-ink-soft bg-admin-surface border border-admin-line-soft cursor-pointer
                   hover:bg-admin-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
        disabled={!meta.hasPreviousPage}
        onClick={() => onPageChange((currentPage) => Math.max(currentPage - 1, 1))}
      >
        <ChevronLeft className="w-4 h-4" />
        Sebelumnya
      </button>
      <span className="text-xs font-semibold text-admin-ink-muted">
        Halaman {meta.page} dari {Math.max(meta.totalPages, 1)}
      </span>
      <button
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                   text-admin-ink-soft bg-admin-surface border border-admin-line-soft cursor-pointer
                   hover:bg-admin-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
        disabled={!meta.hasNextPage}
        onClick={() => onPageChange((currentPage) => currentPage + 1)}
      >
        Selanjutnya
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
