import type { FormEvent } from 'react'
import { CalendarDays, RotateCcw, Search } from 'lucide-react'

type OrdersFilterPanelProps = {
  searchDraft: string
  startDateDraft: string
  endDateDraft: string
  hasActiveFilters: boolean
  onSearchChange: (val: string) => void
  onStartDateChange: (val: string) => void
  onEndDateChange: (val: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onClear: () => void
}

export function OrdersFilterPanel({
  searchDraft,
  startDateDraft,
  endDateDraft,
  hasActiveFilters,
  onSearchChange,
  onStartDateChange,
  onEndDateChange,
  onSubmit,
  onClear,
}: OrdersFilterPanelProps) {
  return (
    <form className="orders-filter-panel" onSubmit={onSubmit}>
      <label className="orders-filter-field">
        <span>No Order / Produk</span>
        <div className="orders-input-shell">
          <Search aria-hidden="true" />
          <input
            type="search"
            placeholder="Masukkan nomor order atau nama produk"
            value={searchDraft}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </label>

      <label className="orders-filter-field">
        <span>Dari Tanggal</span>
        <div className="orders-input-shell">
          <CalendarDays aria-hidden="true" />
          <input
            type="date"
            value={startDateDraft}
            onChange={(event) => onStartDateChange(event.target.value)}
          />
        </div>
      </label>

      <label className="orders-filter-field">
        <span>Sampai Tanggal</span>
        <div className="orders-input-shell">
          <CalendarDays aria-hidden="true" />
          <input
            type="date"
            value={endDateDraft}
            onChange={(event) => onEndDateChange(event.target.value)}
          />
        </div>
      </label>

      <div className="orders-filter-actions">
        <button type="submit" className="button primary">
          <Search className="button-icon" aria-hidden="true" />
          Cari
        </button>
        <button
          type="button"
          className="button ghost"
          disabled={!hasActiveFilters}
          onClick={onClear}
        >
          <RotateCcw className="button-icon" aria-hidden="true" />
          Reset
        </button>
      </div>
    </form>
  )
}
