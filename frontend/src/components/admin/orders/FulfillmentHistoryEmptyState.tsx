import { Truck } from 'lucide-react'

export function FulfillmentHistoryEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-admin-line-soft bg-admin-surface-2/30 py-14">
      <Truck className="h-10 w-10 text-admin-line" />
      <p className="m-0 mt-3 text-sm text-admin-ink-muted">Belum ada permintaan mutasi stok.</p>
    </div>
  )
}
