import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Search, Loader2, CheckCheck } from 'lucide-react';
import { AdminModal } from '../../components/admin/AdminModal';
import { getAllProducts } from '../../api/product.api';
import type { Product } from '../../types/product';
import type { Stock } from '../../api/stock.api';

interface AdminAddStockModalProps {
  storeId: number;
  existingStocks: Stock[];
  onClose: () => void;
  onSubmit: (data: { items: { productId: number; quantity: number }[] }) => Promise<void>;
}

type QuantityMode = 'same' | 'different';

export default function AdminAddStockModal({ existingStocks, onClose, onSubmit }: AdminAddStockModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [quantityMode, setQuantityMode] = useState<QuantityMode>('same');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [quantities, setQuantities] = useState<Record<number, number | ''>>({});
  const [submitting, setSubmitting] = useState(false);
  const [shouldClose, setShouldClose] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // We fetch a large limit to get products, in a real app this might be server-searched
        const res = await getAllProducts({ limit: 500 });
        setProducts(res.products);
      } catch (err) {
        console.error('Failed to fetch products', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProductIds.length === 0) return;

    const items = selectedProductIds.map((productId) => ({
      productId,
      quantity:
        quantityMode === 'same'
          ? Number(quantity)
          : Number(quantities[productId] ?? 0),
    }));

    try {
      setSubmitting(true);
      await onSubmit({ items });
      setShouldClose(true);
    } catch {
      // The parent owns the user-facing error message.
    } finally {
      setSubmitting(false);
    }
  };

  const existingProductIds = new Set(existingStocks.map(s => s.productId));
  const availableProducts = products.filter(p => !existingProductIds.has(p.id));
  const filteredProducts = availableProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const selectedProducts = availableProducts.filter(p => selectedProductIds.includes(p.id));

  const toggleProduct = (id: number) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // "Pilih Semua" beroperasi pada produk yang sedang tampil (menghormati pencarian).
  const filteredIds = filteredProducts.map(p => p.id);
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every(id => selectedProductIds.includes(id));

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedProductIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedProductIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const setQuantityFor = (id: number, value: string) => {
    setQuantities(prev => ({ ...prev, [id]: value === '' ? '' : Number(value) }));
  };

  return (
    <AdminModal
      onClose={onClose}
      busy={submitting}
      requestClose={shouldClose}
      labelledBy="admin-add-stock-title"
    >
      {(closeModal) => (
        <>

        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-5 border-b border-admin-line-soft sm:p-6">
          <h2 id="admin-add-stock-title" className="min-w-0 text-lg font-bold text-admin-ink m-0 font-[family-name:var(--font-admin)] sm:text-xl">
            Tambah Produk ke Toko
          </h2>
          <button
            onClick={closeModal}
            className="p-2 -mr-2 text-admin-ink-muted hover:text-admin-red hover:bg-admin-red-soft rounded-xl transition-colors cursor-pointer border-none bg-transparent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="min-h-0 p-5 overflow-y-auto overscroll-contain font-[family-name:var(--font-admin)] flex-1 sm:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-admin-accent admin-spin" />
              <p className="text-sm text-admin-ink-muted m-0">Memuat data produk...</p>
            </div>
          ) : (
            <form id="add-stock-form" onSubmit={handleSubmit} className="flex flex-col gap-6">

              {/* Product Selection */}
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="text-sm font-semibold text-admin-ink">
                    Pilih Produk <span className="text-admin-red">*</span>
                  </label>
                  {filteredProducts.length > 0 && (
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-admin-line bg-admin-surface px-2.5 py-1 text-xs font-semibold text-admin-accent-strong hover:bg-admin-accent-soft transition-colors cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      {allFilteredSelected ? 'Hapus Semua' : 'Pilih Semua'}
                    </button>
                  )}
                </div>

                <div className="relative mb-2">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-ink-muted" />
                  <input
                    type="text"
                    placeholder="Cari produk yang tersedia..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-admin-line bg-admin-surface-2 text-sm focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
                  />
                </div>

                <div className="border border-admin-line rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-admin-surface-2/30">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-admin-ink-muted">
                      Tidak ada produk baru yang tersedia.
                    </div>
                  ) : (
                    filteredProducts.map(p => (
                      <label key={p.id} className="flex items-center gap-3 p-3 border-b border-admin-line last:border-0 hover:bg-admin-surface-2 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          name="productId"
                          value={p.id}
                          checked={selectedProductIds.includes(p.id)}
                          onChange={() => toggleProduct(p.id)}
                          className="w-4 h-4 rounded text-admin-accent focus:ring-admin-accent/30 cursor-pointer"
                        />
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-medium text-admin-ink">{p.name}</span>
                          <span className="text-xs text-admin-ink-muted">Rp {p.basePrice.toLocaleString('id-ID')}</span>
                        </div>
                      </label>
                    ))
                  )}
                </div>

                <div className="flex flex-col gap-2 mt-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <p className="text-xs text-admin-ink-muted m-0">
                    Produk tidak ditemukan? <Link to="/admin/stores/products" className="text-admin-accent font-semibold hover:underline">Buat Produk Baru</Link>
                  </p>
                  {selectedProductIds.length > 0 && (
                    <p className="text-xs font-semibold text-admin-accent-strong m-0 whitespace-nowrap">
                      {selectedProductIds.length} produk dipilih
                    </p>
                  )}
                </div>
              </div>

              {/* Initial Quantity */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <label className="text-sm font-semibold text-admin-ink">
                    Stok Awal <span className="text-admin-red">*</span>
                  </label>
                  {/* Mode selector: kuantiti sama vs berbeda */}
                  <div className="inline-flex rounded-xl border border-admin-line bg-admin-surface-2 p-1 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setQuantityMode('same')}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer border-none ${
                        quantityMode === 'same'
                          ? 'bg-admin-accent text-white shadow-sm'
                          : 'bg-transparent text-admin-ink-soft hover:text-admin-ink'
                      }`}
                    >
                      Kuantiti Sama
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuantityMode('different')}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer border-none ${
                        quantityMode === 'different'
                          ? 'bg-admin-accent text-white shadow-sm'
                          : 'bg-transparent text-admin-ink-soft hover:text-admin-ink'
                      }`}
                    >
                      Kuantiti Berbeda
                    </button>
                  </div>
                </div>

                {quantityMode === 'same' ? (
                  <>
                    <input
                      type="number"
                      min="0"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-admin-line bg-admin-surface text-sm focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
                      placeholder="0"
                    />
                    <p className="text-xs text-admin-ink-muted mt-1 m-0">
                      {selectedProductIds.length > 1
                        ? 'Stok awal ini akan diterapkan ke semua produk yang dipilih. Anda dapat mengubahnya kapan saja melalui menu Sesuaikan Stok.'
                        : 'Anda juga dapat merubah stok ini kapan saja melalui menu Sesuaikan Stok.'}
                    </p>
                  </>
                ) : selectedProducts.length === 0 ? (
                  <div className="border border-dashed border-admin-line rounded-xl p-4 text-center text-sm text-admin-ink-muted">
                    Pilih produk terlebih dahulu untuk mengatur stok masing-masing.
                  </div>
                ) : (
                  <>
                    <div className="border border-admin-line rounded-xl overflow-hidden max-h-56 overflow-y-auto bg-admin-surface-2/30">
                      {selectedProducts.map(p => (
                        <div key={p.id} className="flex items-center justify-between gap-3 p-3 border-b border-admin-line last:border-0">
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-admin-ink truncate">{p.name}</span>
                            <span className="text-xs text-admin-ink-muted">Rp {p.basePrice.toLocaleString('id-ID')}</span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            value={quantities[p.id] ?? ''}
                            onChange={(e) => setQuantityFor(p.id, e.target.value)}
                            className="w-24 shrink-0 px-3 py-2 rounded-lg border border-admin-line bg-admin-surface text-sm text-right focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
                            placeholder="0"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-admin-ink-muted mt-1 m-0">
                      Isi stok awal per produk. Kosongkan untuk mengisi 0. Anda dapat mengubahnya kapan saja melalui menu Sesuaikan Stok.
                    </p>
                  </>
                )}
              </div>

            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-admin-line-soft bg-admin-surface-2/30 flex flex-col-reverse gap-3 font-[family-name:var(--font-admin)] rounded-b-2xl sm:flex-row sm:justify-end sm:p-6">
          <button
            type="button"
            onClick={closeModal}
            className="w-full px-5 py-2.5 rounded-xl text-sm font-medium text-admin-ink-soft bg-admin-surface border border-admin-line hover:bg-admin-line-soft hover:text-admin-ink transition-all cursor-pointer sm:w-auto"
          >
            Batal
          </button>
          <button
            form="add-stock-form"
            type="submit"
            disabled={submitting || selectedProductIds.length === 0}
            className="inline-flex w-full items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-admin-accent hover:bg-admin-accent-strong transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed shadow-sm sm:w-auto"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : null}
            {selectedProductIds.length > 1 ? `Tambah ${selectedProductIds.length} Produk` : 'Tambah Produk'}
          </button>
        </div>
        </>
      )}
    </AdminModal>
  );
}
