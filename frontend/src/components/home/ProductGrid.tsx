import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ArrowRight, Eye, ShoppingCart } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import type { Product } from '../../types/product'

type ProductGridProps = {
  products?: Product[] | any[]
  storeId?: string
}
import { useAddToCart } from '../../hooks/useAddToCart'

export const ProductGrid = ({ products: initialProducts, storeId }: ProductGridProps) => {
  const navigate = useNavigate()
  
  // If initialProducts is provided, we use it directly. Otherwise fetch using useProducts.
  const { products: fetchedProducts, loading, error } = useProducts(
    initialProducts ? undefined : { limit: 8, sortBy: 'newest', storeId }
  )
  
  const [displayProducts, setDisplayProducts] = useState<Product[] | any[]>(initialProducts || [])

  useEffect(() => {
    if (initialProducts) {
      setDisplayProducts(initialProducts)
    } else if (!loading && fetchedProducts) {
      setDisplayProducts(fetchedProducts)
    }
  }, [initialProducts, fetchedProducts, loading])

  const { addToCart, addingProductId } = useAddToCart()

  if (displayProducts.length === 0 && loading) return (
    <section className="section" id="products">
      <div className="shell">
        <p>Memuat produk...</p>
      </div>
    </section>
  )

  if (displayProducts.length === 0 && error) return (
    <section className="section" id="products">
      <div className="shell">
        <p style={{ color: 'var(--accent)' }}>{error}</p>
      </div>
    </section>
  )

  return (
    <section className="section" id="products">
      <div className="shell">
        <div className="section-head">
          <div>
            <p className="section-kicker">Produk Terbaru</p>
            <h2 className="section-title">Fresh picks untuk kamu</h2>
          </div>
          <button
            type="button"
            className="button ghost"
            onClick={() => navigate('/catalog')}
          >
            <span>Lihat semua</span>
            <ArrowRight className="button-icon" aria-hidden="true" />
          </button>
        </div>
        <div className="product-grid" style={{ opacity: (!initialProducts && loading) ? 0.5 : 1, transition: 'opacity 0.2s', pointerEvents: (!initialProducts && loading) ? 'none' : 'auto' }}>
          {displayProducts.map((product) => (
            <article key={product.id} className="product-card">
              <div className="product-swatch swatch-olive">
                <span>{product.category?.name || product.categoryName}</span>
              </div>
              <div className="product-meta">
                <div className="product-header">
                  <h3>{product.name}</h3>
                </div>
                <p className="product-price">
                  Rp {(product.basePrice ?? product.price)?.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="product-footer">
                <button
                  type="button"
                  className="button primary"
                  disabled={addingProductId === product.id}
                  onClick={() => void addToCart(product)}
                >
                  <ShoppingCart className="button-icon" aria-hidden="true" />
                  <span>{addingProductId === product.id ? 'Menambahkan...' : 'Tambah'}</span>
                </button>
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  <Eye className="button-icon" aria-hidden="true" />
                  <span>Detail</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
