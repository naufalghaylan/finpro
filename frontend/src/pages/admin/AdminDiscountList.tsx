import { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import { getDiscounts, createDiscount, deleteDiscount, type Discount } from '../../api/discount.api';
import { useToast } from '../../components/common/Toast';
import { Plus, Trash2, Tag, Loader2, ChevronUp, Percent, DollarSign, Gift, Calendar } from 'lucide-react';

export default function AdminDiscountList({ storeId }: { storeId: number }) {
  const { showToast } = useToast();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minPurchase: '0',
    maxDiscount: '',
    startDate: '',
    endDate: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const res = await getDiscounts(storeId, page, 10);
      setDiscounts(res.data);
    } catch (e) {
      const error = e as AxiosError<{ message?: string }>;
      showToast(error.response?.data?.message || 'Gagal memuat diskon', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchDiscounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await createDiscount({
        storeId,
        name: formData.name,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minPurchase: Number(formData.minPurchase),
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        isActive: true,
      });
      showToast('Diskon berhasil ditambahkan', 'success');
      setShowForm(false);
      fetchDiscounts();
      setFormData({
        name: '',
        discountType: 'PERCENTAGE',
        discountValue: '',
        minPurchase: '0',
        maxDiscount: '',
        startDate: '',
        endDate: '',
      });
    } catch (e) {
      const error = e as AxiosError<{ message?: string }>;
      showToast(error.response?.data?.message || 'Gagal menambahkan diskon', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus diskon ini?')) return;
    try {
      await deleteDiscount(id);
      showToast('Diskon dihapus', 'success');
      fetchDiscounts();
    } catch (e) {
      const error = e as AxiosError<{ message?: string }>;
      showToast(error.response?.data?.message || 'Gagal menghapus diskon', 'error');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PERCENTAGE': return <Percent className="w-3.5 h-3.5" />;
      case 'NOMINAL': return <DollarSign className="w-3.5 h-3.5" />;
      case 'BUY_ONE_GET_ONE': return <Gift className="w-3.5 h-3.5" />;
      default: return <Tag className="w-3.5 h-3.5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'PERCENTAGE': return 'Persentase';
      case 'NOMINAL': return 'Nominal';
      case 'BUY_ONE_GET_ONE': return 'BOGO';
      default: return type;
    }
  };

  return (
    <div className="font-[family-name:var(--font-admin)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-admin-ink m-0">Daftar Diskon</h3>
          <p className="text-sm text-admin-ink-muted mt-0.5 m-0">
            {loading ? 'Memuat...' : `${discounts.length} diskon ditampilkan`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer shadow-md transition-all duration-200 ${
            showForm
              ? 'bg-admin-surface-2 text-admin-ink-soft hover:bg-admin-line-soft'
              : 'bg-admin-accent text-white hover:shadow-lg hover:-translate-y-0.5'
          }`}
        >
          {showForm ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Tutup Form
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Tambah Diskon
            </>
          )}
        </button>
      </div>

      {/* Create Form — Expandable Card */}
      {showForm && (
        <div className="admin-fade-in rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm p-6 mb-6">
          <h4 className="text-base font-bold text-admin-ink m-0 mb-5">Diskon Baru</h4>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">Nama Promo/Diskon</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                           focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">Tipe Diskon</label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({...formData, discountType: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                           focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
              >
                <option value="PERCENTAGE">Persentase (%)</option>
                <option value="NOMINAL">Nominal (Rp)</option>
                <option value="BUY_ONE_GET_ONE">Beli 1 Gratis 1</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">Nilai Diskon</label>
              <input
                type="number"
                required
                value={formData.discountValue}
                onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                           focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">Minimal Belanja (Rp)</label>
              <input
                type="number"
                required
                value={formData.minPurchase}
                onChange={(e) => setFormData({...formData, minPurchase: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                           focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">Maks Diskon (Rp) — Opsional</label>
              <input
                type="number"
                value={formData.maxDiscount}
                onChange={(e) => setFormData({...formData, maxDiscount: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                           focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">Mulai</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="w-full px-3 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                             focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">Berakhir</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="w-full px-3 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                             focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
                />
              </div>
            </div>
            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-admin-accent text-white
                           text-sm font-semibold border-none cursor-pointer shadow-md
                           hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 admin-spin" />
                    Menyimpan...
                  </>
                ) : 'Simpan Diskon'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table Card */}
      <div className="rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-admin-accent admin-spin" />
            <p className="text-sm text-admin-ink-muted m-0">Memuat diskon...</p>
          </div>
        ) : discounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Tag className="w-10 h-10 text-admin-line" />
            <p className="text-sm text-admin-ink-muted m-0 font-medium">Belum ada diskon yang aktif.</p>
          </div>
        ) : (
          <div className="admin-table-wrap overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-admin-line-soft bg-admin-surface-2/40">
                  <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Nama</th>
                  <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Tipe</th>
                  <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Nilai</th>
                  <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Periode</th>
                  <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((discount) => (
                  <tr key={discount.id} className="admin-table-row border-b border-admin-line-soft/50 last:border-b-0">
                    <td className="px-5 py-4 font-semibold text-admin-ink">{discount.name}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-admin-surface-2 text-admin-ink-soft">
                        {getTypeIcon(discount.discountType)}
                        {getTypeLabel(discount.discountType)}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-admin-accent-strong">
                      {discount.discountType === 'PERCENTAGE'
                        ? `${discount.discountValue}%`
                        : `Rp ${discount.discountValue.toLocaleString('id-ID')}`
                      }
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-admin-ink-soft">
                        <Calendar className="w-3.5 h-3.5 text-admin-ink-muted" />
                        {new Date(discount.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        {' — '}
                        {new Date(discount.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleDelete(discount.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                   text-admin-red bg-admin-red-soft border-none cursor-pointer
                                   hover:bg-admin-red/15 transition-all duration-150"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus
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
              disabled={discounts.length < 10}
              onClick={() => setPage(p => p + 1)}
            >
              Selanjutnya →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
