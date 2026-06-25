import { Search } from 'lucide-react'
import type { FulfillmentDirection, MutationStatus } from '../../../types/order'
import { mutationStatusDisplay } from './storeFulfillmentGroup'

type Props = {
  groupCount: number
  totalProducts: number
  direction: FulfillmentDirection
  status: MutationStatus | ''
  search: string
  onDirectionChange: (direction: FulfillmentDirection) => void
  onStatusChange: (status: MutationStatus | '') => void
  onSearchChange: (search: string) => void
}

export function AdminStoreFulfillmentToolbar({
  groupCount,
  totalProducts,
  direction,
  status,
  search,
  onDirectionChange,
  onStatusChange,
  onSearchChange,
}: Props) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h3 className="m-0 text-lg font-bold text-admin-ink">Manifest Mutasi Stok</h3>
        <p className="m-0 mt-0.5 text-sm text-admin-ink-muted">
          {groupCount} pengiriman pada halaman - {totalProducts} produk terkait toko ini
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={direction}
          onChange={(event) => onDirectionChange(event.target.value as FulfillmentDirection)}
          aria-label="Filter arah mutasi stok"
          className="cursor-pointer appearance-none rounded-xl border border-admin-line bg-admin-surface px-4 py-2.5 text-sm text-admin-ink focus:border-admin-accent focus:outline-none focus:ring-2 focus:ring-admin-accent/30"
        >
          <option value="all">Semua arah</option>
          <option value="incoming">Barang masuk</option>
          <option value="outgoing">Barang keluar</option>
        </select>
        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value as MutationStatus | '')}
          aria-label="Filter status mutasi stok"
          className="cursor-pointer appearance-none rounded-xl border border-admin-line bg-admin-surface px-4 py-2.5 text-sm text-admin-ink focus:border-admin-accent focus:outline-none focus:ring-2 focus:ring-admin-accent/30"
        >
          <option value="">Semua status</option>
          {Object.entries(mutationStatusDisplay).map(([value, display]) => (
            <option key={value} value={value}>{display.label}</option>
          ))}
        </select>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-ink-muted" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Cari pesanan, produk, atau toko"
            className="w-full rounded-xl border border-admin-line bg-admin-surface py-2.5 pl-10 pr-3.5 text-sm text-admin-ink placeholder:text-admin-ink-muted focus:outline-none focus:ring-2 focus:ring-admin-accent/30 sm:w-64"
          />
        </div>
      </div>
    </div>
  )
}
