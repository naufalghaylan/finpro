import { useNavigate } from 'react-router-dom'
import { useProducts } from '../../hooks/useProducts'
import { useAddToCart } from '../../hooks/useAddToCart'

export const ProductGrid = () => {
  const navigate = useNavigate()
  const { products, loading, error } = useProducts({ limit: 8, sortBy: 'newest' })
  const { addToCart, addingProductId } = useAddToCart()

  if (loading) return (
    <section className="section" id="products">
      <div className="shell">
        <p>Memuat produk...</p>
      </div>
    </section>
  )

  if (error) return (
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
                <span>{product.category.name}</span>
              </div>
              <div className="product-meta">
                <div className="product-header">
                  <h3>{product.name}</h3>
                </div>
                <p className="product-price">
                  Rp {product.basePrice.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="product-footer">
                <button
                  type="button"
                  className="button primary"
                  disabled={addingProductId === product.id}
                  onClick={() => void addToCart(product)}
                >
                  {addingProductId === product.id ? 'Menambahkan...' : 'Tambah ke daftar'}
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
