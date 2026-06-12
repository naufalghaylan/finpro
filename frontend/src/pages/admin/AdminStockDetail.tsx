import { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import { getStockById, adjustStock, type StockDetail } from '../../api/stock.api';
import { useToast } from '../../components/common/Toast';
import { ArrowLeft, Package, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function AdminStockDetail({ stockId, onBack }: { stockId: number, onBack: () => void }) {
  const { showToast } = useToast();
  const [stock, setStock] = useState<StockDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [adjusting, setAdjusting] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState({
    quantityChange: '',
    notes: ''
  });

  const fetchStockDetail = async () => {
    try {
      setLoading(true);
      const res = await getStockById(stockId);
      setStock(res.data);
    } catch (e) {
      const error = e as AxiosError<{ message?: string }>;
      showToast(error.response?.data?.message || 'Gagal memuat detail stok', 'error');
      onBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchStockDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockId]);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAdjusting(true);
      const change = Number(adjustmentForm.quantityChange);
      if (change === 0) throw new Error('Perubahan tidak boleh 0');
      
      await adjustStock(stockId, { quantityChange: change, notes: adjustmentForm.notes });
      showToast('Stok berhasil disesuaikan', 'success');
      setAdjustmentForm({ quantityChange: '', notes: '' });
      fetchStockDetail();
    } catch (e) {
      const error = e as AxiosError<{ message?: string }>;
      showToast(error.message || error.response?.data?.message || 'Gagal menyesuaikan stok', 'error');
    } finally {
      setAdjusting(false);
    }
  };

  if (loading || !stock) {
    return (
      <div className="font-[family-name:var(--font-admin)] flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-admin-accent admin-spin" />
        <p className="text-sm text-admin-ink-muted m-0">Memuat detail stok...</p>
      </div>
    );
  }

  return (
    <div className="font-[family-name:var(--font-admin)] admin-fade-in">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium mb-6
                   text-admin-ink-soft bg-admin-surface border border-admin-line-soft cursor-pointer
                   hover:bg-admin-surface-2 hover:text-admin-ink transition-all duration-150"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali
      </button>

      {/* Top Section: Stat Card + Adjustment Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Stat Card */}
        <div className="rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-admin-accent-soft">
              <Package className="w-5 h-5 text-admin-accent-strong" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-admin-ink m-0">{stock.product.name}</h3>
              <p className="text-xs text-admin-ink-muted mt-0.5 m-0">
                Kategori: {stock.product.category?.name || '—'}
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-admin-surface-2/70 p-5">
            <p className="text-xs font-semibold text-admin-ink-muted uppercase tracking-wider m-0 mb-2">Sisa Stok Saat Ini</p>
            <span className={`
              text-4xl font-extrabold
              ${stock.quantity > 10
                ? 'text-admin-green'
                : stock.quantity > 0
                  ? 'text-admin-amber'
                  : 'text-admin-red'
              }
            `}>
              {stock.quantity}
            </span>
            <span className="text-sm text-admin-ink-muted ml-2">unit</span>
          </div>
        </div>

        {/* Adjustment Form */}
        <div className="rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm p-6">
          <h4 className="text-base font-bold text-admin-ink m-0 mb-4">Penyesuaian Stok (Manual)</h4>
          <form onSubmit={handleAdjust} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">
                Penambahan / Pengurangan (+/-)
              </label>
              <input
                type="number"
                placeholder="Contoh: 10 atau -5"
                value={adjustmentForm.quantityChange}
                onChange={(e) => setAdjustmentForm({...adjustmentForm, quantityChange: e.target.value})}
                required
                className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                           focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">
                Catatan Jurnal
              </label>
              <input
                type="text"
                placeholder="Alasan penyesuaian..."
                value={adjustmentForm.notes}
                onChange={(e) => setAdjustmentForm({...adjustmentForm, notes: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                           focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={adjusting}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-admin-accent text-white
                         text-sm font-semibold border-none cursor-pointer shadow-md
                         hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {adjusting ? (
                <>
                  <Loader2 className="w-4 h-4 admin-spin" />
                  Menyimpan...
                </>
              ) : 'Terapkan'}
            </button>
          </form>
        </div>
      </div>

      {/* Journal History */}
      <div className="rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-admin-line-soft/50 bg-admin-surface-2/20">
          <h4 className="text-base font-bold text-admin-ink m-0">Riwayat Jurnal Stok</h4>
          <p className="text-xs text-admin-ink-muted mt-0.5 m-0">
            {stock.journals.length} entri tercatat
          </p>
        </div>

        {stock.journals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Package className="w-10 h-10 text-admin-line" />
            <p className="text-sm text-admin-ink-muted m-0">Belum ada riwayat stok.</p>
          </div>
        ) : (
          <div className="admin-table-wrap overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-admin-line-soft bg-admin-surface-2/40">
                  <th className="px-5 py-3 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Tanggal</th>
                  <th className="px-5 py-3 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Tipe</th>
                  <th className="px-5 py-3 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider text-center">Awal</th>
                  <th className="px-5 py-3 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider text-center">Perubahan</th>
                  <th className="px-5 py-3 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider text-center">Akhir</th>
                  <th className="px-5 py-3 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Oleh</th>
                  <th className="px-5 py-3 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {stock.journals.map((journal) => (
                  <tr key={journal.id} className="admin-table-row border-b border-admin-line-soft/50 last:border-b-0">
                    <td className="px-5 py-3.5 text-xs text-admin-ink-soft whitespace-nowrap">
                      {new Date(journal.createdAt).toLocaleString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-admin-surface-2 text-admin-ink-soft">
                        {journal.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center text-admin-ink-soft">{journal.quantityBefore}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`
                        inline-flex items-center gap-1 font-bold text-sm
                        ${journal.quantityChange > 0 ? 'text-admin-green' : journal.quantityChange < 0 ? 'text-admin-red' : 'text-admin-ink-muted'}
                      `}>
                        {journal.quantityChange > 0 ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : journal.quantityChange < 0 ? (
                          <TrendingDown className="w-3.5 h-3.5" />
                        ) : (
                          <Minus className="w-3.5 h-3.5" />
                        )}
                        {journal.quantityChange > 0 ? `+${journal.quantityChange}` : journal.quantityChange}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center font-semibold text-admin-ink">{journal.quantityAfter}</td>
                    <td className="px-5 py-3.5 text-admin-ink-soft text-xs">{journal.creator.name}</td>
                    <td className="px-5 py-3.5 text-admin-ink-muted text-xs max-w-[200px] truncate">{journal.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
