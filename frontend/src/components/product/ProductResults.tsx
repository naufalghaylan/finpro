import { ProductCard } from './ProductCard'
import type { Product } from '../../types/product'

type ProductResultsProps = {
  products: Product[]
  loading: boolean
  error: string | null
  onSelect: (product: Product) => void
  onAddToCart: (product: Product) => void
  loadingText?: string
  emptyIcon?: string
  emptyTitle?: string
  emptySubtitle?: string
  addingProductId?: number
}

const centerBox: React.CSSProperties = {
  textAlign: 'center',
  padding: '64px 0',
  color: 'var(--ink-soft)',
}

/**
 * Menangani state loading / error / empty sekaligus grid produk.
 * Dipakai oleh CatalogPage & SearchPage agar tampilan hasil konsisten.
 */
export function ProductResults({
  products,
  loading,
  error,
  onSelect,
  onAddToCart,
  loadingText = 'Memuat produk...',
  emptyIcon = '🔍',
  emptyTitle = 'Produk tidak ditemukan',
  emptySubtitle = 'Coba ubah filter atau kategori',
  addingProductId,
}: ProductResultsProps) {
  if (loading) return <p>{loadingText}</p>
  if (error) return <p style={{ color: 'var(--accent)' }}>{error}</p>

  if (products.length === 0) {
    return (
      <div style={centerBox}>
        <p style={{ fontSize: '2rem' }}>{emptyIcon}</p>
        <p style={{ fontWeight: 600 }}>{emptyTitle}</p>
        <p>{emptySubtitle}</p>
      </div>
    )
  }

  return (
    <div className="product-grid">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          isAddingToCart={addingProductId === product.id}
          onClick={onSelect}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  )
}
