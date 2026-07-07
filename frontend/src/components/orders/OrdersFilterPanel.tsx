import type { FormEvent } from 'react'
import { RotateCcw, Search } from 'lucide-react'
import { OrdersDatePicker } from './OrdersDatePicker'

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
        <span>Nomor Pesanan / Produk / Cabang</span>
        <div className="orders-input-shell">
          <Search aria-hidden="true" />
          <input
            type="search"
            placeholder="Cari nomor pesanan, produk, atau cabang PanenMart"
            value={searchDraft}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </label>

      <OrdersDatePicker
        label="Dari Tanggal"
        value={startDateDraft}
        onChange={onStartDateChange}
      />

      <OrdersDatePicker
        label="Sampai Tanggal"
        value={endDateDraft}
        onChange={onEndDateChange}
      />

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
