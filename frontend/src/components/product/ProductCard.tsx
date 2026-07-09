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

  // Diskon (khusus tampilan, asumsi beli 1 unit): mengikuti aturan checkout —
  // potongan dibatasi oleh maxDiscount, lalu dibatasi lagi maksimal sebesar harga produk.
  const capDiscount = (amount: number, maxDiscount?: number | null) =>
    maxDiscount != null && maxDiscount > 0 ? Math.min(amount, maxDiscount) : amount
  const activeDiscounts = product.discounts?.filter(d => d.isActive) ?? []
  const priceCutAmount = activeDiscounts.reduce((best, d) => {
    let amount = 0
    if (d.discountType === 'PERCENTAGE') amount = capDiscount((product.basePrice * d.discountValue) / 100, d.maxDiscount)
    else if (d.discountType === 'NOMINAL') amount = capDiscount(d.discountValue, d.maxDiscount)
    else return best
    return Math.max(best, Math.min(amount, product.basePrice))
  }, 0)
  const hasBogo = activeDiscounts.some(d => d.discountType === 'BUY_ONE_GET_ONE')
  const discountedPrice = product.basePrice - priceCutAmount
  const discountPercent = priceCutAmount > 0 ? Math.round((priceCutAmount / product.basePrice) * 100) : 0

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
          <span className="product-tag">{product.category.name}</span>
        </div>
        {priceCutAmount > 0 ? (
          <div className="product-price-group">
            <div className="product-price-row">
              <span className="product-discount-badge">{discountPercent}%</span>
              <span className="product-price-original">Rp {product.basePrice.toLocaleString('id-ID')}</span>
            </div>
            <p className="product-price">Rp {discountedPrice.toLocaleString('id-ID')}</p>
          </div>
        ) : (
          <div className="product-price-row">
            <p className="product-price">Rp {product.basePrice.toLocaleString('id-ID')}</p>
            {hasBogo && <span className="product-discount-badge product-badge-bogo">Beli 1 Gratis 1</span>}
          </div>
        )}

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
