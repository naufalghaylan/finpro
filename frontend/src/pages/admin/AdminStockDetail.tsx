import { useEffect, useState, type FormEvent } from 'react'
import { AxiosError } from 'axios'
import {
  ArrowLeft,
  ClipboardList,
  Loader2,
  Minus,
  Package,
  Repeat2,
  SlidersHorizontal,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { adjustStock, deleteStock, getStockById, type StockDetail, type StockJournal, type StockJournalType } from '../../api/stock.api'
import { useToast } from '../../components/common/Toast'
import { formatDateTime } from '../../utils/format'

const journalTypeMeta: Record<StockJournalType, { label: string; className: string }> = {
  IN: { label: 'Stok Masuk', className: 'bg-admin-green-soft text-admin-green' },
  OUT: { label: 'Stok Keluar', className: 'bg-admin-red-soft text-admin-red' },
  ADJUSTMENT: { label: 'Penyesuaian Manual', className: 'bg-admin-surface-2 text-admin-ink-soft' },
  ORDER: { label: 'Reservasi Pesanan', className: 'bg-admin-blue-soft text-admin-blue' },
  CANCEL_RETURN: { label: 'Pengembalian Stok', className: 'bg-admin-amber-soft text-admin-amber' },
  MUTATION_IN: { label: 'Masuk Mutasi', className: 'bg-admin-green-soft text-admin-green' },
  MUTATION_OUT: { label: 'Keluar Mutasi', className: 'bg-admin-blue-soft text-admin-blue' },
}

const getJournalContext = (journal: StockJournal) => {
  if (journal.stockMutation) {
    return `${journal.stockMutation.sourceStore.name} ke ${journal.stockMutation.destinationStore.name}`
  }

  if (journal.order) return journal.order.orderNumber

  return 'Manual'
}

const getJournalNote = (journal: StockJournal) => (
  journal.description || journal.notes || '-'
)

export default function AdminStockDetail({ stockId, onBack }: { stockId: number; onBack: () => void }) {
  const { showToast } = useToast()
  const [stock, setStock] = useState<StockDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [adjusting, setAdjusting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [adjustmentForm, setAdjustmentForm] = useState({
    quantityChange: '',
    notes: '',
  })

  const fetchStockDetail = async () => {
    try {
      setLoading(true)
      const response = await getStockById(stockId)
      setStock(response.data)
    } catch (e) {
      const error = e as AxiosError<{ message?: string }>
      showToast(error.response?.data?.message || 'Gagal memuat detail stok', 'error')
      onBack()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchStockDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockId])

  const handleAdjust = async (event: FormEvent) => {
    event.preventDefault()
    try {
      setAdjusting(true)
      const change = Number(adjustmentForm.quantityChange)
      if (change === 0) throw new Error('Perubahan tidak boleh 0')

      await adjustStock(stockId, { quantityChange: change, notes: adjustmentForm.notes })
      showToast('Stok berhasil disesuaikan', 'success')
      setAdjustmentForm({ quantityChange: '', notes: '' })
      await fetchStockDetail()
    } catch (e) {
      const error = e as AxiosError<{ message?: string }>
      showToast(error.message || error.response?.data?.message || 'Gagal menyesuaikan stok', 'error')
    } finally {
      setAdjusting(false)
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Hapus data stok produk ini dari toko? Stok akan disembunyikan (soft delete), namun riwayat jurnalnya tetap tersimpan dan bisa dipulihkan saat produk ditambahkan kembali.')) return;
    try {
      setDeleting(true);
      await deleteStock(stockId);
      showToast('Data stok berhasil dihapus', 'success');
      onBack();
    } catch (e) {
      const error = e as AxiosError<{ message?: string }>;
      showToast(error.response?.data?.message || 'Gagal menghapus stok', 'error');
      setDeleting(false);
    }
  };

  if (loading || !stock) {
    return (
      <div className="font-admin flex flex-col items-center justify-center gap-3 py-20">
        <Loader2 className="h-8 w-8 text-admin-accent admin-spin" />
        <p className="m-0 text-sm text-admin-ink-muted">Memuat detail stok...</p>
      </div>
    )
  }

  const mutationJournalCount = stock.journals.filter((journal) => journal.type.startsWith('MUTATION')).length
  const manualJournalCount = stock.journals.filter((journal) => journal.type === 'ADJUSTMENT').length

  return (
    <div className="font-[family-name:var(--font-admin)] admin-fade-in">
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                     text-admin-ink-soft bg-admin-surface border border-admin-line-soft cursor-pointer
                     hover:bg-admin-surface-2 hover:text-admin-ink transition-all duration-150"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                     text-admin-red bg-admin-red-soft border-none cursor-pointer
                     hover:bg-admin-red/15 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
        >
          {deleting ? <Loader2 className="w-4 h-4 admin-spin" /> : <Trash2 className="w-4 h-4" />}
          Hapus Stok
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-2xl border border-admin-line-soft bg-admin-surface p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="m-0 text-xs font-bold uppercase tracking-[0.16em] text-admin-accent-strong">Detail Stok</p>
              <h3 className="m-0 mt-1 truncate text-xl font-bold text-admin-ink">{stock.product.name}</h3>
              <p className="m-0 mt-1 text-sm text-admin-ink-muted">
                {stock.store.name} - Kategori: {stock.product.category?.name || 'Belum berkategori'}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${stock.quantity > 10 ? 'bg-admin-green-soft text-admin-green' : stock.quantity > 0 ? 'bg-admin-amber-soft text-admin-amber' : 'bg-admin-red-soft text-admin-red'}`}>
              {stock.quantity > 10 ? 'Aman' : stock.quantity > 0 ? 'Menipis' : 'Kosong'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-admin-line-soft bg-admin-surface-2/35 p-4">
              <div className="mb-2 flex items-center gap-2 text-admin-ink-muted">
                <Package className="h-4 w-4 text-admin-accent-strong" />
                <span className="text-xs font-semibold uppercase tracking-wider">Stok Saat Ini</span>
              </div>
              <strong className={`text-3xl ${stock.quantity > 10 ? 'text-admin-green' : stock.quantity > 0 ? 'text-admin-amber' : 'text-admin-red'}`}>
                {stock.quantity}
              </strong>
              <span className="ml-2 text-sm text-admin-ink-muted">unit</span>
            </div>
            <div className="rounded-2xl border border-admin-line-soft bg-admin-surface-2/35 p-4">
              <div className="mb-2 flex items-center gap-2 text-admin-ink-muted">
                <Repeat2 className="h-4 w-4 text-admin-accent-strong" />
                <span className="text-xs font-semibold uppercase tracking-wider">Mutasi</span>
              </div>
              <strong className="text-2xl text-admin-ink">{mutationJournalCount}</strong>
              <span className="ml-2 text-sm text-admin-ink-muted">entri</span>
            </div>
            <div className="rounded-2xl border border-admin-line-soft bg-admin-surface-2/35 p-4">
              <div className="mb-2 flex items-center gap-2 text-admin-ink-muted">
                <SlidersHorizontal className="h-4 w-4 text-admin-accent-strong" />
                <span className="text-xs font-semibold uppercase tracking-wider">Manual</span>
              </div>
              <strong className="text-2xl text-admin-ink">{manualJournalCount}</strong>
              <span className="ml-2 text-sm text-admin-ink-muted">entri</span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-admin-line-soft bg-admin-surface p-6 shadow-sm">
          <h4 className="m-0 text-base font-bold text-admin-ink">Penyesuaian Stok Manual</h4>
          <p className="m-0 mt-1 text-xs leading-5 text-admin-ink-muted">
            Gunakan hanya untuk koreksi stok di luar alur pesanan atau fulfillment.
          </p>
          <form onSubmit={handleAdjust} className="mt-4 flex flex-col gap-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-admin-ink-soft">
                Penambahan / Pengurangan
              </label>
              <input
                type="number"
                placeholder="Contoh: 10 atau -5"
                value={adjustmentForm.quantityChange}
                onChange={(event) => setAdjustmentForm({ ...adjustmentForm, quantityChange: event.target.value })}
                required
                className="w-full rounded-xl border border-admin-line bg-admin-surface px-4 py-3 text-sm text-admin-ink transition-all focus:border-admin-accent focus:outline-none focus:ring-2 focus:ring-admin-accent/30"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-admin-ink-soft">
                Catatan Jurnal
              </label>
              <input
                type="text"
                placeholder="Alasan penyesuaian"
                value={adjustmentForm.notes}
                onChange={(event) => setAdjustmentForm({ ...adjustmentForm, notes: event.target.value })}
                className="w-full rounded-xl border border-admin-line bg-admin-surface px-4 py-3 text-sm text-admin-ink transition-all focus:border-admin-accent focus:outline-none focus:ring-2 focus:ring-admin-accent/30"
              />
            </div>
            <button
              type="submit"
              disabled={adjusting}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border-none bg-admin-accent px-5 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {adjusting ? (
                <>
                  <Loader2 className="h-4 w-4 admin-spin" />
                  Menyimpan...
                </>
              ) : 'Terapkan'}
            </button>
          </form>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm">
        <div className="border-b border-admin-line-soft/50 bg-admin-surface-2/25 px-6 py-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-admin-accent-strong" />
            <h4 className="m-0 text-base font-bold text-admin-ink">Riwayat Jurnal Stok</h4>
          </div>
          <p className="m-0 mt-0.5 text-xs text-admin-ink-muted">
            {stock.journals.length} entri tercatat, termasuk reservasi pesanan dan mutasi antar toko.
          </p>
        </div>

        {stock.journals.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Package className="h-10 w-10 text-admin-line" />
            <p className="m-0 text-sm text-admin-ink-muted">Belum ada riwayat stok.</p>
          </div>
        ) : (
          <div className="admin-table-wrap overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="border-b border-admin-line-soft bg-admin-surface-2/45">
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-admin-ink-soft">Tanggal</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-admin-ink-soft">Aktivitas</th>
                  <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wider text-admin-ink-soft">Perubahan</th>
                  <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wider text-admin-ink-soft">Stok</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-admin-ink-soft">Referensi</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-admin-ink-soft">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {stock.journals.map((journal) => {
                  const meta = journalTypeMeta[journal.type]
                  const isMutation = journal.type.startsWith('MUTATION')
                  const changeIcon = journal.quantityChange > 0
                    ? <TrendingUp className="h-3.5 w-3.5" />
                    : journal.quantityChange < 0
                      ? <TrendingDown className="h-3.5 w-3.5" />
                      : <Minus className="h-3.5 w-3.5" />

                  return (
                    <tr key={journal.id} className="admin-table-row border-b border-admin-line-soft/50 last:border-b-0">
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs text-admin-ink-soft">
                        {formatDateTime(journal.createdAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col items-start gap-1.5">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${meta.className}`}>
                            {meta.label}
                          </span>
                          {isMutation && (
                            <span className="text-[11px] text-admin-ink-muted">Fulfillment antar toko</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 text-sm font-bold ${journal.quantityChange > 0 ? 'text-admin-green' : journal.quantityChange < 0 ? 'text-admin-red' : 'text-admin-ink-muted'}`}>
                          {changeIcon}
                          {journal.quantityChange > 0 ? `+${journal.quantityChange}` : journal.quantityChange}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center text-xs text-admin-ink-soft">
                        <strong className="text-admin-ink">{journal.quantityBefore}</strong>
                        <span className="mx-1 text-admin-ink-muted">ke</span>
                        <strong className="text-admin-ink">{journal.quantityAfter}</strong>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-admin-ink-soft">
                        <div className="max-w-[220px]">
                          <strong className="block truncate text-admin-ink">{getJournalContext(journal)}</strong>
                          {journal.order && (
                            <span className="mt-1 block truncate text-admin-ink-muted">Pesanan {journal.order.orderNumber}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-admin-ink-muted">
                        <p className="m-0 max-w-[260px] break-words leading-5">{getJournalNote(journal)}</p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}