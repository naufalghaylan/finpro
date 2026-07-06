import { Calendar, ChevronRight, Store as StoreIcon } from 'lucide-react'
import { MONTHS } from '../../../api/report.api'

interface Props {
  /** true bila toko sudah terkunci (store admin) → sembunyikan dropdown toko */
  storeLocked: boolean
  stores: { id: number; name: string }[]
  storeId: number | ''
  onStoreChange: (value: number | '') => void
  year: number
  onYearChange: (value: number) => void
  month: number
  onMonthChange: (value: number) => void
  /** kolom bulan opsional (sales bisa "setahun penuh") */
  showMonth?: boolean
}

const selectClass =
  'w-full cursor-pointer appearance-none rounded-xl border border-admin-line bg-admin-surface px-10 py-2.5 text-sm text-admin-ink transition-all focus:border-admin-accent focus:outline-none focus:ring-2 focus:ring-admin-accent/30'

const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

export default function ReportFilterBar({
  storeLocked, stores, storeId, onStoreChange,
  year, onYearChange, month, onMonthChange, showMonth = true,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {!storeLocked && (
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-admin-ink-soft">Cabang</span>
          <div className="relative">
            <StoreIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-ink-muted" />
            <select
              value={storeId}
              onChange={(e) => onStoreChange(e.target.value === '' ? '' : Number(e.target.value))}
              className={selectClass}
            >
              <option value="">Semua Cabang</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <ChevronRight className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-admin-ink-muted" />
          </div>
        </label>
      )}

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-admin-ink-soft">Tahun</span>
        <div className="relative">
          <Calendar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-ink-muted" />
          <select value={year} onChange={(e) => onYearChange(Number(e.target.value))} className={selectClass}>
            {years.map((y) => (<option key={y} value={y}>{y}</option>))}
          </select>
          <ChevronRight className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-admin-ink-muted" />
        </div>
      </label>

      {showMonth && (
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-admin-ink-soft">Bulan</span>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-ink-muted" />
            <select value={month} onChange={(e) => onMonthChange(Number(e.target.value))} className={selectClass}>
              {MONTHS.map((m, i) => (<option key={m} value={i + 1}>{m}</option>))}
            </select>
            <ChevronRight className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-admin-ink-muted" />
          </div>
        </label>
      )}
    </div>
  )
}
