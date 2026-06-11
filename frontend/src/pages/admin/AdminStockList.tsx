import { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import { getStocks, type Stock } from '../../api/stock.api';
import { getStores } from '../../api/store';
import { useToast } from '../../components/common/Toast';
import AdminStockDetail from './AdminStockDetail';
import AdminAddStockModal from './AdminAddStockModal';
import { Search, Package, Loader2, ChevronRight, Store, Plus } from 'lucide-react';
import { addStock } from '../../api/stock.api';

export default function AdminStockList({ storeId }: { storeId?: number }) {
  const { showToast } = useToast();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedStockId, setSelectedStockId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // States for Global View
  const [stores, setStores] = useState<{ id: number; name: string }[]>([]);
  const [selectedFilterStoreId, setSelectedFilterStoreId] = useState<number | ''>('');

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const activeStoreId = storeId || (selectedFilterStoreId ? Number(selectedFilterStoreId) : undefined);
      const res = await getStocks(activeStoreId, page, 10, search);
      setStocks(res.data);
    } catch (e) {
      const error = e as AxiosError<{ message?: string }>;
      showToast(error.response?.data?.message || 'Gagal memuat stok', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchStocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, selectedFilterStoreId, page, search]);

  useEffect(() => {
    if (!storeId) {
      getStores(1, 100).then(res => setStores(res.data)).catch(() => {});
    }
  }, [storeId]);

  if (selectedStockId) {
    return <AdminStockDetail stockId={selectedStockId} onBack={() => setSelectedStockId(null)} />;
  }

  return (
    <div className="font-[family-name:var(--font-admin)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-bold text-admin-ink m-0">
            {storeId ? 'Daftar Stok Produk' : 'Daftar Stok Global'}
          </h3>
          <p className="text-sm text-admin-ink-muted mt-0.5 m-0">
            {loading ? 'Memuat...' : `${stocks.length} stok ditampilkan`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {storeId && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-admin-accent hover:bg-admin-accent-strong transition-all cursor-pointer border-none shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah Produk</span>
            </button>
          )}
          {!storeId && (
            <div className="relative hidden md:block">
              <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-ink-muted pointer-events-none" />
              <select
                value={selectedFilterStoreId}
                onChange={(e) => { setSelectedFilterStoreId(e.target.value === '' ? '' : Number(e.target.value)); setPage(1); }}
                className="pl-10 pr-8 py-2.5 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                           focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all appearance-none cursor-pointer"
              >
                <option value="">Semua Toko</option>
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-ink-muted pointer-events-none rotate-90" />
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-ink-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10 pr-4 py-2.5 w-64 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                         placeholder:text-admin-ink-muted
                         focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-admin-accent admin-spin" />
            <p className="text-sm text-admin-ink-muted m-0">Memuat stok...</p>
          </div>
        ) : stocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 border border-admin-line-soft rounded-2xl bg-admin-surface-2/30">
            <Package className="w-10 h-10 text-admin-line" />
            <p className="text-sm text-admin-ink-muted m-0">
              {storeId ? 'Produk tidak ditemukan di toko ini.' : 'Belum ada data stok.'}
            </p>
          </div>
        ) : (
          <div className="admin-table-wrap overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-admin-line-soft bg-admin-surface-2/40">
                  <th className="px-5 py-3 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider rounded-tl-2xl">Produk</th>
                  {!storeId && (
                    <th className="px-5 py-3 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Toko</th>
                  )}
                  <th className="px-5 py-3 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider text-center">Stok Tersedia</th>
                  <th className="px-5 py-3 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider text-right rounded-tr-2xl">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => (
                  <tr key={stock.id} className="admin-table-row border-b border-admin-line-soft/50 last:border-b-0">
                    <td className="px-5 py-4 font-semibold text-admin-ink">{stock.product.name}</td>
                    {!storeId && (
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-admin-surface-2 text-admin-ink-soft">
                          {stock.store?.name || 'Toko Umum'}
                        </span>
                      </td>
                    )}
                    <td className="px-5 py-4 text-center">
                      <span className={`
                        inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold
                        ${stock.quantity > 10
                          ? 'bg-admin-green-soft text-admin-green'
                          : stock.quantity > 0
                            ? 'bg-admin-amber-soft text-admin-amber'
                            : 'bg-admin-red-soft text-admin-red'
                        }
                      `}>
                        {stock.quantity}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedStockId(stock.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                   text-admin-blue bg-admin-blue-soft border-none cursor-pointer
                                   hover:bg-admin-blue/15 transition-all duration-150"
                      >
                        Detail & Sesuaikan
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-admin-line-soft/50 bg-admin-surface-2/20">
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                         text-admin-ink-soft bg-admin-surface border border-admin-line-soft cursor-pointer
                         hover:bg-admin-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              ← Sebelumnya
            </button>
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                         text-admin-ink-soft bg-admin-surface border border-admin-line-soft cursor-pointer
                         hover:bg-admin-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
              disabled={stocks.length < 10}
              onClick={() => setPage(p => p + 1)}
            >
              Selanjutnya →
            </button>
          </div>
        )}
      </div>

      {showAddModal && storeId && (
        <AdminAddStockModal
          storeId={storeId}
          existingStocks={stocks}
          onClose={() => setShowAddModal(false)}
          onSubmit={async (data) => {
            try {
              await addStock({ storeId, productId: data.productId, quantity: data.quantity });
              setShowAddModal(false);
              fetchStocks();
              showToast('Produk berhasil ditambahkan ke toko', 'success');
            } catch (err: unknown) {
              const error = err as AxiosError<{ message?: string }>;
              showToast(error.response?.data?.message || 'Gagal menambahkan produk', 'error');
            }
          }}
        />
      )}
    </div>
  );
}
