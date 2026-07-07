import { useEffect, useState } from 'react'
import { AxiosError } from 'axios'
import { ArrowDownCircle, ArrowUpCircle, Boxes, Loader2 } from 'lucide-react'
import {
  getStockSummaryReport, MONTHS,
  type StockSummaryReport, type StockSummaryRow,
} from '../../api/report.api'
import { getStores } from '../../api/store'
import ReportFilterBar from '../../components/admin/reports/ReportFilterBar'
import StockDetailView from '../../components/admin/reports/StockDetailView'

export default function AdminStockReport({ storeId }: { storeId?: number }) {
  const storeLocked = !!storeId
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [filterStoreId, setFilterStoreId] = useState<number | ''>('')
  const [stores, setStores] = useState<{ id: number; name: string }[]>([])
  const [report, setReport] = useState<StockSummaryReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<StockSummaryRow | null>(null)

  const activeStoreId = storeId ?? (filterStoreId ? Number(filterStoreId) : undefined)

  useEffect(() => {
    if (storeLocked) return
    getStores(1, 100).then((r) => setStores(r.data)).catch(() => setStores([]))
  }, [storeLocked])

  useEffect(() => {
    setLoading(true)
    setError(null)
    getStockSummaryReport({ year, month, storeId: activeStoreId })
      .then(setReport)
      .catch((e: AxiosError<{ message?: string }>) =>
        setError(e.response?.data?.message || 'Gagal memuat laporan stok'))
      .finally(() => setLoading(false))
  }, [storeId, filterStoreId, year, month])

  if (selected) {
    return (
      <StockDetailView
        row={selected} year={year} month={month} storeId={activeStoreId}
        onBack={() => setSelected(null)}
      />
    )
  }

  const t = report?.totals
  return (
    <div className="font-admin">
      <section className="mb-5 rounded-2xl border border-admin-line-soft bg-admin-surface p-4 shadow-sm md:p-5">
        <div className="mb-4">
          <p className="m-0 text-xs font-bold uppercase tracking-[0.16em] text-admin-accent-strong">Laporan</p>
          <h3 className="m-0 mt-1 text-lg font-bold text-admin-ink">Laporan Stok — {MONTHS[month - 1]} {year}</h3>
          <p className="m-0 mt-0.5 text-sm text-admin-ink-muted">Ringkasan perubahan stok semua produk. Klik baris untuk melihat history detail.</p>
        </div>
        <ReportFilterBar
          storeLocked={storeLocked} stores={stores}
          storeId={filterStoreId} onStoreChange={setFilterStoreId}
          year={year} onYearChange={setYear}
          month={month} onMonthChange={setMonth}
        />
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Loader2 className="h-8 w-8 text-admin-accent admin-spin" />
          <p className="m-0 text-sm text-admin-ink-muted">Memuat laporan...</p>
        </div>
      ) : error ? (
        <p className="py-10 text-center text-sm text-admin-red">{error}</p>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-3 gap-3">
            <Totals label="Total Penambahan" value={`+${t?.totalAddition ?? 0}`} Icon={ArrowUpCircle} tone="green" />
            <Totals label="Total Pengurangan" value={`-${t?.totalReduction ?? 0}`} Icon={ArrowDownCircle} tone="red" />
            <Totals label="Total Stok Akhir" value={`${t?.endingStock ?? 0}`} Icon={Boxes} tone="accent" />
          </div>

          <section className="rounded-2xl border border-admin-line-soft bg-admin-surface p-4 shadow-sm md:p-5">
            <div className="admin-table-wrap overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-admin-line-soft text-xs uppercase tracking-wider text-admin-ink-soft">
                    <th className="py-2.5 pr-3 font-semibold">Produk</th>
                    {!activeStoreId && <th className="py-2.5 px-3 font-semibold">Toko</th>}
                    <th className="py-2.5 px-3 text-right font-semibold">Penambahan</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Pengurangan</th>
                    <th className="py-2.5 pl-3 text-right font-semibold">Stok Akhir</th>
                  </tr>
                </thead>
                <tbody>
                  {(report?.rows ?? []).length === 0 ? (
                    <tr><td colSpan={5} className="py-10 text-center text-admin-ink-muted">Tidak ada perubahan stok pada periode ini</td></tr>
                  ) : report?.rows.map((r) => (
                    <tr
                      key={r.stockId}
                      onClick={() => setSelected(r)}
                      className="admin-table-row cursor-pointer border-b border-admin-line-soft/50 last:border-b-0 hover:bg-admin-surface-2/50"
                    >
                      <td className="py-2.5 pr-3 font-medium text-admin-ink">{r.productName}</td>
                      {!activeStoreId && <td className="py-2.5 px-3 text-admin-ink-soft">{r.storeName}</td>}
                      <td className="py-2.5 px-3 text-right font-semibold text-admin-green">+{r.totalAddition}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-admin-red">-{r.totalReduction}</td>
                      <td className="py-2.5 pl-3 text-right font-bold text-admin-ink">{r.endingStock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function Totals({ label, value, Icon, tone }: { label: string; value: string; Icon: typeof Boxes; tone: 'green' | 'red' | 'accent' }) {
  const toneClass = tone === 'green' ? 'text-admin-green' : tone === 'red' ? 'text-admin-red' : 'text-admin-accent-strong'
  return (
    <div className="rounded-2xl border border-admin-line-soft bg-admin-surface p-4">
      <div className="mb-2 flex items-center gap-2 text-admin-ink-muted">
        <Icon className={`h-4 w-4 ${toneClass}`} />
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <strong className={`block text-lg font-bold ${toneClass}`}>{value}</strong>
    </div>
  )
}
