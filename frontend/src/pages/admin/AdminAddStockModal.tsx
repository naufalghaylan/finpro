import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Search, Loader2 } from 'lucide-react';
import { AdminModal } from '../../components/admin/AdminModal';
import { getAllProducts } from '../../api/product.api';
import type { Product } from '../../types/product';
import type { Stock } from '../../api/stock.api';

interface AdminAddStockModalProps {
  storeId: number;
  existingStocks: Stock[];
  onClose: () => void;
  onSubmit: (data: { productId: number; quantity: number }) => Promise<void>;
}

export default function AdminAddStockModal({ existingStocks, onClose, onSubmit }: AdminAddStockModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
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
    if (!selectedProductId) return;
    try {
      setSubmitting(true);
      await onSubmit({ productId: selectedProductId, quantity });
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
        <div className="flex items-center justify-between p-6 border-b border-admin-line-soft">
          <h2 id="admin-add-stock-title" className="text-xl font-bold text-admin-ink m-0 font-[family-name:var(--font-admin)]">
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
        <div className="min-h-0 p-6 overflow-y-auto overscroll-contain font-[family-name:var(--font-admin)] flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-admin-accent admin-spin" />
              <p className="text-sm text-admin-ink-muted m-0">Memuat data produk...</p>
            </div>
          ) : (
            <form id="add-stock-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
              
              {/* Product Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-admin-ink">
                  Pilih Produk <span className="text-admin-red">*</span>
                </label>
                
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
                          type="radio"
                          name="productId"
                          value={p.id}
                          checked={selectedProductId === p.id}
                          onChange={() => setSelectedProductId(p.id)}
                          className="w-4 h-4 text-admin-accent focus:ring-admin-accent/30 cursor-pointer"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-admin-ink">{p.name}</span>
                          <span className="text-xs text-admin-ink-muted">Rp {p.basePrice.toLocaleString('id-ID')}</span>
                        </div>
                      </label>
                    ))
                  )}
                </div>

                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-admin-ink-muted m-0">
                    Produk tidak ditemukan? <Link to="/admin/stores/products" className="text-admin-accent font-semibold hover:underline">Buat Produk Baru</Link>
                  </p>
                </div>
              </div>

              {/* Initial Quantity */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-admin-ink">
                  Stok Awal <span className="text-admin-red">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-admin-line bg-admin-surface text-sm focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
                  placeholder="0"
                />
                <p className="text-xs text-admin-ink-muted mt-1 m-0">Anda juga dapat merubah stok ini kapan saja melalui menu Sesuaikan Stok.</p>
              </div>

            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-admin-line-soft bg-admin-surface-2/30 flex justify-end gap-3 font-[family-name:var(--font-admin)] rounded-b-2xl">
          <button
            type="button"
            onClick={closeModal}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-admin-ink-soft bg-admin-surface border border-admin-line hover:bg-admin-line-soft hover:text-admin-ink transition-all cursor-pointer"
          >
            Batal
          </button>
          <button
            form="add-stock-form"
            type="submit"
            disabled={submitting || !selectedProductId}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-admin-accent hover:bg-admin-accent-strong transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : null}
            Tambah Produk
          </button>
        </div>
        </>
      )}
    </AdminModal>
  );
}
