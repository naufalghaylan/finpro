import { useEffect, useState } from 'react'
import { AxiosError } from 'axios'
import { Loader2, TrendingUp, Wallet, Package, ShoppingCart, Tag, Truck } from 'lucide-react'
import {
  getSalesReport, rupiah, MONTHS,
  type SalesReport,
} from '../../api/report.api'
import { getStores } from '../../api/store'
import ReportFilterBar from '../../components/admin/reports/ReportFilterBar'

export default function AdminSalesReport({ storeId }: { storeId?: number }) {
  const storeLocked = !!storeId
  const [year, setYear] = useState(new Date().getFullYear())
  const [filterStoreId, setFilterStoreId] = useState<number | ''>('')
  const [stores, setStores] = useState<{ id: number; name: string }[]>([])
  const [report, setReport] = useState<SalesReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (storeLocked) return
    getStores(1, 100).then((r) => setStores(r.data)).catch(() => setStores([]))
  }, [storeLocked])

  useEffect(() => {
    const activeStoreId = storeId ?? (filterStoreId ? Number(filterStoreId) : undefined)
    setLoading(true)
    setError(null)
    getSalesReport({ year, storeId: activeStoreId })
      .then(setReport)
      .catch((e: AxiosError<{ message?: string }>) =>
        setError(e.response?.data?.message || 'Gagal memuat laporan penjualan'))
      .finally(() => setLoading(false))
  }, [storeId, filterStoreId, year])

  const s = report?.summary
  const cards = [
    { label: 'Total Pendapatan', value: rupiah(s?.totalRevenue ?? 0), Icon: Wallet, accent: true },
    { label: 'Total Diskon', value: rupiah(s?.totalDiscount ?? 0), Icon: Tag },
    { label: 'Total Ongkir', value: rupiah(s?.totalShipping ?? 0), Icon: Truck },
    { label: 'Jumlah Order', value: `${s?.orderCount ?? 0}`, Icon: ShoppingCart },
    { label: 'Item Terjual', value: `${s?.itemCount ?? 0}`, Icon: Package },
  ]
  const maxRevenue = Math.max(1, ...(report?.monthly ?? []).map((m) => m.revenue))

  return (
    <div className="font-admin">
      <section className="mb-5 rounded-2xl border border-admin-line-soft bg-admin-surface p-4 shadow-sm md:p-5">
        <div className="mb-4">
          <p className="m-0 text-xs font-bold uppercase tracking-[0.16em] text-admin-accent-strong">Laporan</p>
          <h3 className="m-0 mt-1 text-lg font-bold text-admin-ink">Laporan Penjualan {year}</h3>
          <p className="m-0 mt-0.5 text-sm text-admin-ink-muted">Ringkasan pendapatan, tren bulanan, produk & kategori terlaris.</p>
        </div>
        <ReportFilterBar
          storeLocked={storeLocked} stores={stores}
          storeId={filterStoreId} onStoreChange={setFilterStoreId}
          year={year} onYearChange={setYear}
          month={1} onMonthChange={() => {}} showMonth={false}
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
          {/* Summary cards */}
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
            {cards.map(({ label, value, Icon, accent }) => (
              <div key={label} className={`rounded-2xl border p-4 ${accent ? 'border-admin-accent/30 bg-admin-accent-soft/40' : 'border-admin-line-soft bg-admin-surface'}`}>
                <div className="mb-2 flex items-center gap-2 text-admin-ink-muted">
                  <Icon className="h-4 w-4 text-admin-accent-strong" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
                </div>
                <strong className="block text-base font-bold text-admin-ink">{value}</strong>
              </div>
            ))}
          </div>

          {/* Tren bulanan */}
          <section className="mb-5 rounded-2xl border border-admin-line-soft bg-admin-surface p-4 shadow-sm md:p-5">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-admin-accent-strong" />
              <h4 className="m-0 text-sm font-bold text-admin-ink">Tren Pendapatan per Bulan</h4>
            </div>
            <div className="flex flex-col gap-2">
              {(report?.monthly ?? []).map((m) => (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-xs text-admin-ink-muted">{MONTHS[m.month - 1]}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-admin-surface-2">
                    <div className="h-full rounded-full bg-admin-accent" style={{ width: `${(m.revenue / maxRevenue) * 100}%` }} />
                  </div>
                  <span className="w-32 shrink-0 text-right text-xs font-medium text-admin-ink">{rupiah(m.revenue)}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Produk & kategori terlaris */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ReportTable title="Produk Terlaris" col="Produk"
              rows={(report?.byProduct ?? []).slice(0, 10).map((p) => ({ name: p.productName, qty: p.quantity, revenue: p.revenue }))} />
            <ReportTable title="Kategori Terlaris" col="Kategori"
              rows={(report?.byCategory ?? []).map((c) => ({ name: c.categoryName, qty: c.quantity, revenue: c.revenue }))} />
          </div>
        </>
      )}
    </div>
  )
}

function ReportTable({ title, col, rows }: { title: string; col: string; rows: { name: string; qty: number; revenue: number }[] }) {
  return (
    <section className="rounded-2xl border border-admin-line-soft bg-admin-surface p-4 shadow-sm md:p-5">
      <h4 className="m-0 mb-3 text-sm font-bold text-admin-ink">{title}</h4>
      <div className="admin-table-wrap overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-admin-line-soft text-xs uppercase tracking-wider text-admin-ink-soft">
              <th className="py-2 pr-3 font-semibold">{col}</th>
              <th className="py-2 px-3 text-right font-semibold">Qty</th>
              <th className="py-2 pl-3 text-right font-semibold">Pendapatan</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={3} className="py-8 text-center text-admin-ink-muted">Belum ada data</td></tr>
            ) : rows.map((r, i) => (
              <tr key={i} className="border-b border-admin-line-soft/50 last:border-b-0">
                <td className="py-2.5 pr-3 font-medium text-admin-ink">{r.name}</td>
                <td className="py-2.5 px-3 text-right text-admin-ink-soft">{r.qty}</td>
                <td className="py-2.5 pl-3 text-right font-semibold text-admin-accent-strong">{rupiah(r.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
