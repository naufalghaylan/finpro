import { useNavigate } from 'react-router-dom'
import { useProducts } from '../../hooks/useProducts'
import type { Product } from '../../types/product'

type ProductGridProps = {
  products?: Product[] | any[]
  storeId?: string
}

export const ProductGrid = ({ products: initialProducts, storeId }: ProductGridProps) => {
  const navigate = useNavigate()
  
  // If initialProducts is provided, we use it directly. Otherwise fetch using useProducts.
  const { products: fetchedProducts, loading, error } = useProducts(
    initialProducts ? undefined : { limit: 8, sortBy: 'newest', storeId }
  )
  
  const products = initialProducts || fetchedProducts

  if (!initialProducts && loading) return (
    <section className="section" id="products">
      <div className="shell">
        <p>Memuat produk...</p>
      </div>
    </section>
  )

  if (!initialProducts && error) return (
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
            Lihat semua
          </button>
        </div>
        <div className="product-grid">
          {products.map((product) => (
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
                <button type="button" className="button primary">
                  Tambah ke daftar
                </button>
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  Detail
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
