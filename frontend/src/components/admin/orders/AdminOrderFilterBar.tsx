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
    <section className="mb-5 rounded-2xl border border-admin-line-soft bg-admin-surface p-4 shadow-sm md:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="m-0 text-xs font-bold uppercase tracking-[0.16em] text-admin-accent-strong">
            Pesanan Admin
          </p>
          <h3 className="m-0 mt-1 text-lg font-bold text-admin-ink">
            {storeId ? 'Daftar Pesanan Toko' : 'Daftar Pesanan Global'}
          </h3>
        </div>
        <div className="rounded-xl border border-admin-line-soft bg-admin-surface-2/45 px-3.5 py-2 text-right">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-admin-ink-muted">
            Total hasil
          </span>
          <strong className="text-base text-admin-ink">
            {loading ? 'Memuat...' : `${totalOrders} pesanan`}
          </strong>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(220px,0.9fr)_minmax(190px,0.7fr)_minmax(280px,1.4fr)]">
        {showStoreFilter && (
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-admin-ink-soft">
              Cabang
            </span>
            <div className="relative">
              <StoreIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-ink-muted" />
              <select
                value={selectedFilterStoreId}
                onChange={(event) => onStoreChange(event.target.value === '' ? '' : Number(event.target.value))}
                className="w-full cursor-pointer appearance-none rounded-xl border border-admin-line bg-admin-surface px-10 py-2.5 text-sm text-admin-ink transition-all focus:border-admin-accent focus:outline-none focus:ring-2 focus:ring-admin-accent/30"
              >
                <option value="">Semua Cabang</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
              <ChevronRight className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-admin-ink-muted" />
            </div>
          </label>
        )}

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-admin-ink-soft">
            Status
          </span>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(event) => onStatusChange(event.target.value as OrderStatus | '')}
              className="w-full cursor-pointer appearance-none rounded-xl border border-admin-line bg-admin-surface px-4 py-2.5 pr-9 text-sm text-admin-ink transition-all focus:border-admin-accent focus:outline-none focus:ring-2 focus:ring-admin-accent/30"
            >
              {statusOptions.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronRight className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-admin-ink-muted" />
          </div>
        </label>

        <label className={`block ${showStoreFilter ? '' : 'lg:col-span-2'}`}>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-admin-ink-soft">
            Pencarian
          </span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-ink-muted" />
            <input
              type="text"
              placeholder="Cari nomor pesanan, produk, atau cabang"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              className="w-full rounded-xl border border-admin-line bg-admin-surface py-2.5 pl-10 pr-4 text-sm text-admin-ink transition-all placeholder:text-admin-ink-muted focus:border-admin-accent focus:outline-none focus:ring-2 focus:ring-admin-accent/30"
            />
          </div>
        </label>
      </div>
    </section>
  )
}
