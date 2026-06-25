import { Eye, ShoppingCart } from 'lucide-react'
import type { Product } from '../../types/product'
import { getImageUrl } from '../../utils/image'

type ProductCardProps = {
  product: Product
  onAddToCart?: (product: Product) => void
  onClick?: (product: Product) => void
  isAddingToCart?: boolean
}

export function ProductCard({ product, onAddToCart, onClick, isAddingToCart }: ProductCardProps) {
  const primaryImage = product.images?.find(img => img.isPrimary) ?? product.images?.[0]
  const totalStock = product.stocks?.reduce((sum, s) => sum + s.quantity, 0) ?? 0

  return (
    <article
      className="product-card"
      onClick={() => onClick?.(product)}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Gambar produk */}
      <div className="product-card-image">
        {primaryImage ? (
          <img
            src={getImageUrl(primaryImage.imageUrl)}
            alt={product.name}
          />
        ) : (
          <span style={{ color: 'var(--ink-soft)', fontSize: '0.85rem' }}>Tidak ada gambar</span>
        )}
      </div>

      <div className="product-meta">
        <div className="product-header">
          <h3>{product.name}</h3>
          <span className="product-tag">{product.category?.name || (product as any).categoryName}</span>
        </div>
        <p className="product-price">Rp {(product.basePrice ?? (product as any).price)?.toLocaleString('id-ID')}</p>

        {/* Stok */}
        <span className={`product-stock ${totalStock > 0 ? 'stock-ok' : 'stock-out'}`}>
          {totalStock > 0 ? `${totalStock} tersedia` : 'Stok habis'}
        </span>
      </div>

      <div className="product-footer">
        <button
          className="button primary"
          disabled={totalStock === 0 || isAddingToCart}
          onClick={e => {
            e.stopPropagation()
            onAddToCart?.(product)
          }}
        >
          <ShoppingCart className="button-icon" aria-hidden="true" />
          <span>{isAddingToCart ? 'Menambahkan...' : 'Tambah'}</span>
        </button>
        <button
          className="button ghost"
          onClick={e => {
            e.stopPropagation()
            onClick?.(product)
          }}
        >
          <Eye className="button-icon" aria-hidden="true" />
          <span>Detail</span>
        </button>
      </div>
    </article>
  )
}
