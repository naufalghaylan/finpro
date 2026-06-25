import type { ProductFilters } from '../../types/product'

type SortValue = ProductFilters['sortBy']

type SortSelectProps = {
  value: SortValue
  onChange: (value: SortValue) => void
  className?: string
}

/** Dropdown urutan produk (Terbaru / Harga Terendah / Nama A-Z). */
export function SortSelect({ value, onChange, className = 'button ghost' }: SortSelectProps) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as SortValue)}
      className={className}
      style={{ fontSize: '0.9rem' }}
    >
      <option value="newest">Terbaru</option>
      <option value="price">Harga Terendah</option>
      <option value="name">Nama A-Z</option>
    </select>
  )
}
