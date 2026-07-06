import { useEffect, useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import {
  getStockDetailReport, MONTHS,
  type StockDetailReport, type StockSummaryRow,
} from '../../../api/report.api'

interface Props {
  row: StockSummaryRow
  year: number
  month: number
  storeId?: number
  onBack: () => void
}

// Detail seluruh history jurnal stok satu produk selama satu bulan.
export default function StockDetailView({ row, year, month, storeId, onBack }: Props) {
  const [detail, setDetail] = useState<StockDetailReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getStockDetailReport({ year, month, storeId: storeId ?? row.storeId, productId: row.productId })
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoading(false))
  }, [row.productId, year, month, storeId, row.storeId])

  return (
    <div className="font-admin">
      <button onClick={onBack} className="mb-4 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-admin-line-soft bg-admin-surface px-3 py-1.5 text-sm font-medium text-admin-ink-soft hover:bg-admin-surface-2">
        <ArrowLeft className="h-4 w-4" /> Kembali ke ringkasan
      </button>

      <div className="mb-4 rounded-2xl border border-admin-line-soft bg-admin-surface p-4 shadow-sm md:p-5">
        <h3 className="m-0 text-lg font-bold text-admin-ink">{row.productName}</h3>
        <p className="m-0 mt-0.5 text-sm text-admin-ink-muted">{row.storeName} · History stok {MONTHS[month - 1]} {year}</p>
        {detail && (
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <span className="text-admin-green">Masuk: +{detail.summary.totalAddition}</span>
            <span className="text-admin-red">Keluar: -{detail.summary.totalReduction}</span>
            <span className="font-semibold text-admin-ink">Stok akhir: {detail.summary.endingStock}</span>
            <span className="text-admin-ink-muted">{detail.summary.entryCount} transaksi</span>
          </div>
        )}
      </div>

      <section className="rounded-2xl border border-admin-line-soft bg-admin-surface p-4 shadow-sm md:p-5">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-admin-ink-muted"><Loader2 className="h-5 w-5 admin-spin" /> Memuat detail...</div>
        ) : (
          <div className="admin-table-wrap overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-admin-line-soft text-xs uppercase tracking-wider text-admin-ink-soft">
                  <th className="py-2.5 pr-3 font-semibold">Tanggal</th>
                  <th className="py-2.5 px-3 font-semibold">Tipe</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Perubahan</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Sebelum</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Sesudah</th>
                  <th className="py-2.5 pl-3 font-semibold">Oleh</th>
                </tr>
              </thead>
              <tbody>
                {(detail?.entries ?? []).length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-admin-ink-muted">Tidak ada history pada periode ini</td></tr>
                ) : detail?.entries.map((e) => (
                  <tr key={e.id} className="border-b border-admin-line-soft/50 last:border-b-0">
                    <td className="py-2.5 pr-3 text-admin-ink-soft">{new Date(e.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td className="py-2.5 px-3"><span className="rounded-full bg-admin-surface-2 px-2 py-0.5 text-xs font-medium text-admin-ink-soft">{e.type}</span></td>
                    <td className={`py-2.5 px-3 text-right font-semibold ${e.quantityChange >= 0 ? 'text-admin-green' : 'text-admin-red'}`}>{e.quantityChange >= 0 ? '+' : ''}{e.quantityChange}</td>
                    <td className="py-2.5 px-3 text-right text-admin-ink-muted">{e.quantityBefore}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-admin-ink">{e.quantityAfter}</td>
                    <td className="py-2.5 pl-3 text-admin-ink-soft">{e.createdBy?.name ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
