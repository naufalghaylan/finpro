import { ChevronRight, Search, Store as StoreIcon } from 'lucide-react'
import type { OrderStatus } from '../../../types/order'

type AdminOrderFilterBarProps = {
  storeId?: number
  loading: boolean
  totalOrders: number
  showStoreFilter: boolean
  stores: { id: number; name: string }[]
  selectedFilterStoreId: number | ''
  statusFilter: OrderStatus | ''
  search: string
  statusOptions: { value: OrderStatus | ''; label: string }[]
  onStoreChange: (storeId: number | '') => void
  onStatusChange: (status: OrderStatus | '') => void
  onSearchChange: (search: string) => void
}

export function AdminOrderFilterBar({
  storeId,
  loading,
  totalOrders,
  showStoreFilter,
  stores,
  selectedFilterStoreId,
  statusFilter,
  search,
  statusOptions,
  onStoreChange,
  onStatusChange,
  onSearchChange,
}: AdminOrderFilterBarProps) {
  return (
    <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
      <div>
        <h3 className="text-lg font-bold text-admin-ink m-0">
          {storeId ? 'Daftar Pesanan Toko' : 'Daftar Pesanan Global'}
        </h3>
        <p className="text-sm text-admin-ink-muted mt-0.5 m-0">
          {loading ? 'Memuat...' : `${totalOrders} pesanan ditemukan`}
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {showStoreFilter && (
          <div className="relative">
            <StoreIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-ink-muted pointer-events-none" />
            <select
              value={selectedFilterStoreId}
              onChange={(event) => onStoreChange(event.target.value === '' ? '' : Number(event.target.value))}
              className="pl-10 pr-8 py-2.5 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                         focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all appearance-none cursor-pointer"
            >
              <option value="">Semua Toko</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
            <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-ink-muted pointer-events-none rotate-90" />
          </div>
        )}

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(event) => onStatusChange(event.target.value as OrderStatus | '')}
            className="px-4 pr-8 py-2.5 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                       focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all appearance-none cursor-pointer"
          >
            {statusOptions.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-ink-muted pointer-events-none rotate-90" />
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-ink-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nomor order..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="pl-10 pr-4 py-2.5 w-64 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                       placeholder:text-admin-ink-muted
                       focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
          />
        </div>
      </div>
    </div>
  )
}
