import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ArrowRight, AlertCircle, RefreshCcw, Loader2 } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { ProductCard } from '../product/ProductCard'
import type { Product } from '../../types/product'

type ProductGridProps = {
  products?: Product[] 
  storeId?: string
}
import { useAddToCart } from '../../hooks/useAddToCart'

export const ProductGrid = ({ products: initialProducts, storeId }: ProductGridProps) => {
  const navigate = useNavigate()
  
  // If initialProducts is provided, we use it directly. Otherwise fetch using useProducts.
  const { products: fetchedProducts, loading, error } = useProducts(
    initialProducts ? undefined : { limit: 8, sortBy: 'newest', storeId }
  )
  
  const [displayProducts, setDisplayProducts] = useState<Product[] >(initialProducts || [])

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
        <div className="section-head">
          <div>
            <p className="section-kicker">Produk Terbaru</p>
            <h2 className="section-title">Fresh picks untuk kamu</h2>
          </div>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '64px 24px',
          background: 'var(--surface)',
          borderRadius: '24px',
          border: '1px dashed var(--line)',
        }}>
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
          <p style={{ color: 'var(--ink-soft)', fontWeight: 500, margin: 0 }}>Memuat produk...</p>
        </div>
      </div>
    </section>
  )

  if (displayProducts.length === 0 && error) return (
    <section className="section" id="products">
      <div className="shell">
        <div className="section-head">
          <div>
            <p className="section-kicker">Produk Terbaru</p>
            <h2 className="section-title">Fresh picks untuk kamu</h2>
          </div>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '48px 24px',
          background: 'var(--surface)',
          borderRadius: '24px',
          border: '1px dashed var(--line)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#fdf2f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#c53030',
            marginBottom: '4px'
          }}>
            <AlertCircle size={32} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>Yah, gagal memuat produk</h3>
          <p style={{ margin: 0, color: 'var(--ink-soft)', maxWidth: '400px' }}>
            {error || 'Terjadi masalah saat memuat daftar produk. Silakan coba beberapa saat lagi.'}
          </p>
          <button 
            type="button" 
            className="button primary" 
            style={{ marginTop: '8px' }}
            onClick={() => window.location.reload()}
          >
            <RefreshCcw size={18} />
            Muat Ulang
          </button>
        </div>
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
            <ProductCard
              key={product.id}
              product={product}
              isAddingToCart={addingProductId === product.id}
              onAddToCart={() => void addToCart(product)}
              onClick={() => navigate(`/products/${product.id}`)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
