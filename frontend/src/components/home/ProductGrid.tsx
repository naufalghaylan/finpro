import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
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
