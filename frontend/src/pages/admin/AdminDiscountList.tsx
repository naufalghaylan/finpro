import { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import { getDiscounts, createDiscount, updateDiscount, deleteDiscount, type Discount } from '../../api/discount.api';
import { getAllProducts } from '../../api/product.api';
import type { Product } from '../../types/product';
import { useToast } from '../../components/common/Toast';
import {
  Plus, Trash2, Tag, Loader2, Percent, DollarSign,
  Gift, Calendar, Pencil, X, Search, CheckCircle2, Clock
} from 'lucide-react';

type DiscountType = 'PERCENTAGE' | 'NOMINAL' | 'BUY_ONE_GET_ONE';

const EMPTY_FORM = {
  name: '',
  discountType: 'PERCENTAGE' as DiscountType,
  discountValue: '',
  productIds: [] as number[],
  minPurchase: '0',
  maxDiscount: '',
  startDate: '',
  endDate: '',
};

export default function AdminDiscountList({ storeId }: { storeId: number }) {
  const { showToast } = useToast();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');

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

  useEffect(() => {
    getAllProducts({ limit: 500 }).then(res => setProducts(res.products)).catch(() => {});
  }, []);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const toggleProduct = (id: number) => {
    setFormData(prev => ({
      ...prev,
      productIds: prev.productIds.includes(id)
        ? prev.productIds.filter(x => x !== id)
        : [...prev.productIds, id],
    }));
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setProductSearch('');
    setShowForm(true);
  };

  const openEdit = (d: Discount) => {
    setEditingId(d.id);
    setFormData({
      name: d.name,
      discountType: d.discountType,
      discountValue: d.discountType === 'BUY_ONE_GET_ONE' ? '' : String(d.discountValue),
      productIds: d.productId ? [d.productId] : [],
      minPurchase: String(d.minPurchase ?? 0),
      maxDiscount: d.maxDiscount ? String(d.maxDiscount) : '',
      startDate: toLocalDatetimeInput(d.startDate),
      endDate: toLocalDatetimeInput(d.endDate),
    });
    setProductSearch('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setProductSearch('');
  };

  const validate = (): string | null => {
    const { discountType, discountValue, productIds, minPurchase, maxDiscount } = formData;
    if (discountType === 'BUY_ONE_GET_ONE' && productIds.length === 0) return 'Pilih minimal satu produk untuk diskon Beli 1 Gratis 1';
    if (discountType !== 'BUY_ONE_GET_ONE') {
      if (!discountValue || Number(discountValue) <= 0) return 'Nilai diskon harus lebih dari 0';
      if (discountType === 'PERCENTAGE' && Number(discountValue) > 100) return 'Persentase diskon tidak boleh melebihi 100%';
    }
    if (minPurchase && Number(minPurchase) < 0) return 'Minimal belanja tidak boleh negatif';
    if (maxDiscount && Number(maxDiscount) <= 0) return 'Maks diskon harus lebih dari 0';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { showToast(err, 'error'); return; }
    try {
      setSaving(true);
      const isBOGO = formData.discountType === 'BUY_ONE_GET_ONE';
      const base = {
        storeId,
        name: formData.name,
        discountType: formData.discountType,
        discountValue: isBOGO ? 0 : Number(formData.discountValue),
        minPurchase: Number(formData.minPurchase) || 0,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        isActive: true,
      };

      if (editingId) {
        // Edit hanya untuk satu baris diskon → pakai produk pertama (atau semua produk bila kosong).
        await updateDiscount(editingId, { ...base, productId: formData.productIds[0] ?? null });
        showToast('Diskon berhasil diperbarui', 'success');
      } else if (formData.productIds.length > 0) {
        // Satu diskon per produk yang dipilih.
        await Promise.all(formData.productIds.map(pid => createDiscount({ ...base, productId: pid })));
        showToast(`${formData.productIds.length} diskon berhasil ditambahkan`, 'success');
      } else {
        // Tanpa produk → diskon berlaku untuk semua produk (diskon toko).
        await createDiscount({ ...base, productId: null });
        showToast('Diskon berhasil ditambahkan', 'success');
      }
      closeForm();
      fetchDiscounts();
    } catch (e) {
      const error = e as AxiosError<{ message?: string }>;
      showToast(error.response?.data?.message || 'Gagal menyimpan diskon', 'error');
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

  const isBOGO = formData.discountType === 'BUY_ONE_GET_ONE';
  const hasMinPurchase = !isBOGO;

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
          onClick={showForm ? closeForm : openCreate}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer shadow-md transition-all duration-200 ${
            showForm
              ? 'bg-admin-surface-2 text-admin-ink-soft hover:bg-admin-line-soft'
              : 'bg-admin-accent text-white hover:shadow-lg hover:-translate-y-0.5'
          }`}
        >
          {showForm ? (
            <><X className="w-4 h-4" />Tutup</>
          ) : (
            <><Plus className="w-4 h-4" />Tambah Diskon</>
          )}
        </button>
      </div>

      {/* Form Card */}
      {showForm && (
        <div className="admin-fade-in rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm p-6 mb-6">
          <h4 className="text-base font-bold text-admin-ink m-0 mb-5">
            {editingId ? 'Edit Diskon' : 'Diskon Baru'}
          </h4>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Nama */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">
                Nama Promo / Diskon <span className="text-admin-red">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Diskon Akhir Tahun, Flash Sale Sabtu"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                           focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
              />
            </div>

            {/* Tipe Diskon */}
            <div>
              <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">
                Tipe Diskon <span className="text-admin-red">*</span>
              </label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value as DiscountType, discountValue: '', maxDiscount: '' })}
                className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                           focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
              >
                <option value="PERCENTAGE">Persentase (%)</option>
                <option value="NOMINAL">Nominal (Rp)</option>
                <option value="BUY_ONE_GET_ONE">Beli 1 Gratis 1</option>
              </select>
              <p className="text-xs text-admin-ink-muted mt-1.5 m-0">
                {formData.discountType === 'PERCENTAGE' && 'Diskon berdasarkan persen dari harga produk.'}
                {formData.discountType === 'NOMINAL' && 'Potongan harga dalam rupiah.'}
                {formData.discountType === 'BUY_ONE_GET_ONE' && 'Beli 1 produk, gratis 1 produk yang sama.'}
              </p>
            </div>

            {/* Nilai Diskon — disembunyikan untuk BOGO */}
            {!isBOGO && (
              <div>
                <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">
                  Nilai Diskon {formData.discountType === 'PERCENTAGE' ? '(%)' : '(Rp)'} <span className="text-admin-red">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max={formData.discountType === 'PERCENTAGE' ? 100 : undefined}
                  placeholder={formData.discountType === 'PERCENTAGE' ? 'Contoh: 20' : 'Contoh: 50000'}
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                             focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
                />
              </div>
            )}

            {/* Product Selector — bisa pilih beberapa produk */}
            <div className={isBOGO ? '' : 'md:col-span-2'}>
              <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">
                Produk yang Didiskon
                {isBOGO && <span className="text-admin-red"> *</span>}
                {!isBOGO && <span className="text-admin-ink-muted font-normal normal-case tracking-normal ml-1">— pilih satu atau beberapa; kosongkan untuk semua produk</span>}
              </label>
              {editingId && (
                <p className="text-xs text-admin-amber mb-2 m-0">Saat mengedit, hanya satu produk yang berlaku untuk diskon ini.</p>
              )}
              <div className="relative mb-2">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-ink-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari produk..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-admin-line bg-admin-surface-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
                />
              </div>
              {productSearch && (
                <div className="border border-admin-line rounded-xl overflow-hidden max-h-40 overflow-y-auto bg-admin-surface-2/30">
                  {filteredProducts.length === 0 ? (
                    <p className="p-3 text-center text-xs text-admin-ink-muted m-0">Produk tidak ditemukan.</p>
                  ) : (
                    filteredProducts.slice(0, 20).map(p => {
                      const selected = formData.productIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleProduct(p.id)}
                          className={`w-full flex items-center justify-between text-left px-4 py-2.5 text-sm border-b border-admin-line last:border-0 cursor-pointer transition-colors
                            ${selected ? 'bg-admin-accent/10 text-admin-accent-strong font-semibold' : 'hover:bg-admin-surface-2 text-admin-ink'}`}
                        >
                          <span>{p.name}<span className="ml-2 text-xs text-admin-ink-muted">Rp {p.basePrice.toLocaleString('id-ID')}</span></span>
                          {selected && <CheckCircle2 className="w-4 h-4 text-admin-accent-strong shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
              {formData.productIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-xs text-admin-ink-muted">{formData.productIds.length} produk dipilih:</span>
                  {products.filter(p => formData.productIds.includes(p.id)).map(p => (
                    <span key={p.id} className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-semibold bg-admin-accent/10 text-admin-accent-strong">
                      {p.name}
                      <button type="button" onClick={() => toggleProduct(p.id)} aria-label={`Hapus ${p.name}`}
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-admin-accent/20 cursor-pointer bg-transparent border-none text-admin-accent-strong">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Min Belanja + Maks Diskon — hanya untuk non-BOGO */}
            {hasMinPurchase && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">
                    Minimal Belanja (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 = tanpa syarat minimal"
                    value={formData.minPurchase}
                    onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                               focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">
                    Maks Diskon (Rp) — Opsional
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Kosong = tidak ada batas"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                               focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
                  />
                </div>
              </>
            )}

            {/* Periode */}
            <div>
              <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">
                Tanggal Mulai <span className="text-admin-red">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                           focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">
                Tanggal Berakhir <span className="text-admin-red">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                           focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
              />
            </div>

            {/* Actions */}
            <div className="md:col-span-2 flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-admin-accent text-white
                           text-sm font-semibold border-none cursor-pointer shadow-md
                           hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {saving ? <><Loader2 className="w-4 h-4 admin-spin" />Menyimpan...</> : (editingId ? 'Perbarui Diskon' : 'Simpan Diskon')}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="px-5 py-3 rounded-xl text-sm font-medium text-admin-ink-soft bg-admin-surface
                           border border-admin-line hover:bg-admin-line-soft hover:text-admin-ink transition-all cursor-pointer"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-admin-accent admin-spin" />
            <p className="text-sm text-admin-ink-muted m-0">Memuat diskon...</p>
          </div>
        ) : discounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Tag className="w-10 h-10 text-admin-line" />
            <p className="text-sm text-admin-ink-muted m-0 font-medium">Belum ada diskon yang dibuat.</p>
          </div>
        ) : (
          <div className="admin-table-wrap overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-admin-line-soft bg-admin-surface-2/40">
                  <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Nama</th>
                  <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Tipe</th>
                  <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Nilai</th>
                  <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Produk</th>
                  <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Periode</th>
                  <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((discount) => {
                  const now = new Date();
                  const isExpired = new Date(discount.endDate) < now;
                  const isUpcoming = new Date(discount.startDate) > now;
                  return (
                    <tr key={discount.id} className="admin-table-row border-b border-admin-line-soft/50 last:border-b-0">
                      <td className="px-5 py-4 font-semibold text-admin-ink">{discount.name}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-admin-surface-2 text-admin-ink-soft">
                          {getTypeIcon(discount.discountType)}
                          {getTypeLabel(discount.discountType)}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-admin-accent-strong">
                        {discount.discountType === 'BUY_ONE_GET_ONE'
                          ? '1+1'
                          : discount.discountType === 'PERCENTAGE'
                            ? `${discount.discountValue}%`
                            : `Rp ${discount.discountValue.toLocaleString('id-ID')}`
                        }
                      </td>
                      <td className="px-5 py-4 text-xs text-admin-ink-soft">
                        {discount.product?.name ?? <span className="text-admin-ink-muted italic">Semua produk</span>}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-admin-ink-soft">
                          <Calendar className="w-3.5 h-3.5 text-admin-ink-muted" />
                          {new Date(discount.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          {' — '}
                          {new Date(discount.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-admin-red-soft text-admin-red">
                            Berakhir
                          </span>
                        ) : isUpcoming ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-admin-amber-soft text-admin-amber">
                            <Clock className="w-3 h-3" />Akan Datang
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-admin-green-soft text-admin-green">
                            <CheckCircle2 className="w-3 h-3" />Aktif
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(discount)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                       text-admin-blue bg-admin-blue-soft border-none cursor-pointer
                                       hover:bg-admin-blue/15 transition-all duration-150"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(discount.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                       text-admin-red bg-admin-red-soft border-none cursor-pointer
                                       hover:bg-admin-red/15 transition-all duration-150"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

function getTypeIcon(type: string) {
  switch (type) {
    case 'PERCENTAGE': return <Percent className="w-3.5 h-3.5" />;
    case 'NOMINAL': return <DollarSign className="w-3.5 h-3.5" />;
    case 'BUY_ONE_GET_ONE': return <Gift className="w-3.5 h-3.5" />;
    default: return <Tag className="w-3.5 h-3.5" />;
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'PERCENTAGE': return 'Persentase';
    case 'NOMINAL': return 'Nominal';
    case 'BUY_ONE_GET_ONE': return 'Beli 1 Gratis 1';
    default: return type;
  }
}

function toLocalDatetimeInput(isoString: string): string {
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
