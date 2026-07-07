import { useEffect, useState } from 'react'
import { AxiosError } from 'axios'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  Plus,
  Search,
  Store as StoreIcon,
} from 'lucide-react'
import { addStock, getStocks, type Stock } from '../../api/stock.api'
import { getStores } from '../../api/store'
import { useToast } from '../../components/common/Toast'
import { getUploadUrl } from '../../components/orders/orderDisplay'
import AdminAddStockModal from './AdminAddStockModal'
import AdminStockDetail from './AdminStockDetail'

export default function AdminStockList({ storeId }: { storeId?: number }) {
  const { showToast } = useToast()
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedStockId, setSelectedStockId] = useState<number | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [stores, setStores] = useState<{ id: number; name: string }[]>([])
  const [selectedFilterStoreId, setSelectedFilterStoreId] = useState<number | ''>('')

  const fetchStocks = async () => {
    try {
      setLoading(true)
      const activeStoreId = storeId || (selectedFilterStoreId ? Number(selectedFilterStoreId) : undefined)
      const response = await getStocks(activeStoreId, page, 10, search)
      setStocks(response.data)
    } catch (e) {
      const error = e as AxiosError<{ message?: string }>
      showToast(error.response?.data?.message || 'Gagal memuat stok', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchStocks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, selectedFilterStoreId, page, search])

  useEffect(() => {
    if (storeId) return

    getStores(1, 100).then((response) => setStores(response.data)).catch(() => setStores([]))
  }, [storeId])

  if (selectedStockId) {
        return <AdminStockDetail stockId={selectedStockId} onBack={() => { setSelectedStockId(null); fetchStocks(); }} />;
  }

  return (
    <div className="font-admin">
      <section className="mb-5 rounded-2xl border border-admin-line-soft bg-admin-surface p-4 shadow-sm md:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="m-0 text-xs font-bold uppercase tracking-[0.16em] text-admin-accent-strong">
              Manajemen Stok
            </p>
            <h3 className="m-0 mt-1 text-lg font-bold text-admin-ink">
              {storeId ? 'Daftar Stok Produk' : 'Daftar Stok Global'}
            </h3>
            <p className="m-0 mt-0.5 text-sm text-admin-ink-muted">
              {loading ? 'Memuat...' : `${stocks.length} stok ditampilkan`}
            </p>
          </div>
          {storeId && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border-none bg-admin-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-admin-accent-strong"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Tambah Produk</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,0.8fr)_minmax(280px,1.2fr)]">
          {!storeId && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-admin-ink-soft">
                Cabang
              </span>
              <div className="relative">
                <StoreIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-ink-muted" />
                <select
                  value={selectedFilterStoreId}
                  onChange={(event) => {
                    setSelectedFilterStoreId(event.target.value === '' ? '' : Number(event.target.value))
                    setPage(1)
                  }}
                  className="w-full cursor-pointer appearance-none rounded-xl border border-admin-line bg-admin-surface px-10 py-2.5 text-sm text-admin-ink transition-all focus:border-admin-accent focus:outline-none focus:ring-2 focus:ring-admin-accent/30"
                >
                  <option value="">Semua Cabang</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
                <ChevronRight className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-admin-ink-muted" />
              </div>
            </label>
          )}
          <label className={`block ${storeId ? 'md:col-span-2' : ''}`}>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-admin-ink-soft">
              Pencarian
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-ink-muted" />
              <input
                type="text"
                placeholder="Cari nama produk"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                className="w-full rounded-xl border border-admin-line bg-admin-surface py-2.5 pl-10 pr-4 text-sm text-admin-ink transition-all placeholder:text-admin-ink-muted focus:border-admin-accent focus:outline-none focus:ring-2 focus:ring-admin-accent/30"
              />
            </div>
          </label>
        </div>
      </section>

      <div className="overflow-hidden rounded-3xl border border-admin-line-soft bg-admin-surface shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 bg-admin-surface-2/20 px-6 py-20 text-center">
            <Loader2 className="h-8 w-8 text-admin-accent admin-spin" />
            <p className="m-0 text-sm text-admin-ink-muted">Memuat stok...</p>
          </div>
        ) : stocks.length === 0 ? (
          <div className="m-4 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-admin-line bg-admin-surface-2/35 px-6 py-16 text-center">
            <Package className="h-10 w-10 text-admin-line" />
            <p className="m-0 text-sm text-admin-ink-muted">
              {storeId ? 'Produk tidak ditemukan di cabang ini.' : 'Belum ada data stok.'}
            </p>
          </div>
        ) : (
          <div className="admin-table-wrap overflow-x-auto">
            <table className="w-full min-w-[820px] table-fixed text-left text-sm">
              <thead>
                <tr className="border-b border-admin-line-soft bg-admin-surface-2/55">
                  <th className="w-[360px] px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-admin-ink-soft rounded-tl-2xl">Produk</th>
                  {!storeId && (
                    <th className="w-[220px] px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-admin-ink-soft">Cabang</th>
                  )}
                  <th className="w-[180px] px-5 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-admin-ink-soft">Stok Tersedia</th>
                  <th className="w-[170px] px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-admin-ink-soft rounded-tr-2xl">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => {
                  const primaryImage = stock.product.images?.find((image) => image.isPrimary) ?? stock.product.images?.[0]
                  const imageUrl = getUploadUrl(primaryImage?.imageUrl ?? null)
                  const stockTone = stock.quantity > 10
                    ? 'bg-admin-green-soft text-admin-green'
                    : stock.quantity > 0
                      ? 'bg-admin-amber-soft text-admin-amber'
                      : 'bg-admin-red-soft text-admin-red'

                  return (
                    <tr key={stock.id} className="admin-table-row border-b border-admin-line-soft/70 last:border-b-0">
                      <td className="px-5 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-admin-line-soft bg-admin-surface-2 text-admin-ink-muted">
                            {imageUrl ? (
                              <img src={imageUrl} alt={stock.product.name} className="h-full w-full object-cover" />
                            ) : (
                              <Package className="h-5 w-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <strong className="block truncate text-sm text-admin-ink">{stock.product.name}</strong>
                            <span className="mt-1 block truncate text-xs text-admin-ink-muted">
                              {stock.product.category?.name || 'Belum berkategori'}
                            </span>
                          </div>
                        </div>
                      </td>
                      {!storeId && (
                        <td className="px-5 py-4">
                          <span className="inline-flex max-w-full items-center rounded-full bg-admin-surface-2 px-2.5 py-1 text-xs font-semibold text-admin-ink-soft">
                            <span className="truncate">{stock.store?.name || 'Cabang umum'}</span>
                          </span>
                        </td>
                      )}
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${stockTone}`}>
                          {stock.quantity} unit
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedStockId(stock.id)}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-none bg-admin-blue-soft px-3 py-1.5 text-xs font-semibold text-admin-blue transition-all duration-150 hover:bg-admin-blue/15"
                        >
                          Detail
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && (
          <div className="flex items-center justify-between border-t border-admin-line-soft/50 bg-admin-surface-2/20 px-5 py-3.5">
            <button
              type="button"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-admin-line-soft bg-admin-surface px-4 py-2 text-sm font-medium text-admin-ink-soft transition-all duration-150 hover:bg-admin-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={page === 1}
              onClick={() => setPage((currentPage) => currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Sebelumnya
            </button>
            <span className="text-xs text-admin-ink-muted">Halaman {page}</span>
            <button
              type="button"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-admin-line-soft bg-admin-surface px-4 py-2 text-sm font-medium text-admin-ink-soft transition-all duration-150 hover:bg-admin-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={stocks.length < 10}
              onClick={() => setPage((currentPage) => currentPage + 1)}
            >
              Selanjutnya
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {showAddModal && storeId && (
        <AdminAddStockModal
          storeId={storeId}
          existingStocks={stocks}
          onClose={() => setShowAddModal(false)}
          onSubmit={async ({ items }) => {
            const results = await Promise.allSettled(
              items.map(({ productId, quantity }) => addStock({ storeId, productId, quantity })),
            )
            await fetchStocks()

            const failed = results.filter((r) => r.status === 'rejected').length
            const succeeded = items.length - failed

            if (succeeded === 0) {
              const firstError = results.find((r) => r.status === 'rejected') as
                | PromiseRejectedResult
                | undefined
              const error = firstError?.reason as AxiosError<{ message?: string }> | undefined
              showToast(error?.response?.data?.message || 'Gagal menambahkan produk', 'error')
              throw new Error('Gagal menambahkan produk')
            }

            if (failed > 0) {
              showToast(`${succeeded} produk ditambahkan, ${failed} gagal`, 'error')
            } else {
              showToast(
                succeeded === 1
                  ? 'Produk berhasil ditambahkan ke cabang'
                  : `${succeeded} produk berhasil ditambahkan ke cabang`,
                'success',
              )
            }
          }}
        />
      )}
    </div>
  )
}