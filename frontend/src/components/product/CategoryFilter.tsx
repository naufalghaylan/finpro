import type { Category } from '../../types/product'

type CategoryFilterProps = {
  categories: Category[]
  selectedId?: number
  onSelect: (id?: number) => void
}

/** Baris chip kategori dengan tombol "Semua" + satu chip per kategori. */
export function CategoryFilter({ categories, selectedId, onSelect }: CategoryFilterProps) {
  return (
    <div className="category-row" style={{ marginBottom: '16px' }}>
      <button
        className={`category-chip ${!selectedId ? 'button primary' : ''}`}
        onClick={() => onSelect(undefined)}
      >
        Semua
      </button>
      {categories.map(cat => (
        <button
          key={cat.id}
          className={`category-chip ${selectedId === cat.id ? 'button primary' : ''}`}
          onClick={() => onSelect(cat.id)}
        >
          {cat.icon} {cat.name}
        </button>
      ))}
    </div>
  )
}
