import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ArrowRight, AlertCircle, RefreshCcw, Loader2, PackageOpen } from 'lucide-react'
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
  const numericStoreId = storeId ? Number(storeId) : undefined
  const activeStoreId = Number.isFinite(numericStoreId) ? numericStoreId : undefined

  if (displayProducts.length === 0 && loading) return (
    <section className="py-[28px]" id="products">
      <div className="w-full max-w-[1440px] mx-auto px-[clamp(16px,4vw,48px)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 mb-5">
          <div>
            <p className="m-0 mb-2 uppercase tracking-[0.12em] text-[0.75rem] font-semibold text-[var(--accent-strong)]">Produk Terbaru</p>
            <h2 className="m-0 font-[family-name:var(--font-display)] text-[clamp(1.6rem,2.4vw,2.2rem)] text-[var(--ink)] leading-tight">Fresh picks untuk kamu</h2>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 bg-[var(--surface)] rounded-3xl border border-dashed border-[var(--line)]">
          <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
          <p className="text-[var(--ink-soft)] font-medium m-0">Memuat produk...</p>
        </div>
      </div>
    </section>
  )

  if (displayProducts.length === 0 && error) return (
    <section className="py-[28px]" id="products">
      <div className="w-full max-w-[1440px] mx-auto px-[clamp(16px,4vw,48px)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 mb-5">
          <div>
            <p className="m-0 mb-2 uppercase tracking-[0.12em] text-[0.75rem] font-semibold text-[var(--accent-strong)]">Produk Terbaru</p>
            <h2 className="m-0 font-[family-name:var(--font-display)] text-[clamp(1.6rem,2.4vw,2.2rem)] text-[var(--ink)] leading-tight">Fresh picks untuk kamu</h2>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 py-12 px-6 bg-[var(--surface)] rounded-3xl border border-dashed border-[var(--line)] text-center">
          <div className="w-16 h-16 rounded-full bg-[#fdf2f2] flex items-center justify-center text-[#c53030] mb-1">
            <AlertCircle size={32} />
          </div>
          <h3 className="m-0 text-xl text-[var(--ink)] font-[family-name:var(--font-display)]">Yah, gagal memuat produk</h3>
          <p className="m-0 text-[var(--ink-soft)] max-w-[400px]">
            {error || 'Terjadi masalah saat memuat daftar produk. Silakan coba beberapa saat lagi.'}
          </p>
          <button 
            type="button" 
            className="inline-flex items-center justify-center gap-2 rounded-full border border-transparent px-4.5 py-2.5 font-semibold cursor-pointer bg-[var(--accent)] text-white shadow-[var(--shadow-soft)] hover:-translate-y-[1px] hover:shadow-[var(--shadow-strong)] transition-all mt-2"
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
    <section className="py-[28px]" id="products">
      <div className="w-full max-w-[1440px] mx-auto px-[clamp(16px,4vw,48px)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 mb-5">
          <div>
            <p className="m-0 mb-2 uppercase tracking-[0.12em] text-[0.75rem] font-semibold text-[var(--accent-strong)]">Produk Terbaru</p>
            <h2 className="m-0 font-[family-name:var(--font-display)] text-[clamp(1.6rem,2.4vw,2.2rem)] text-[var(--ink)] leading-tight">Fresh picks untuk kamu</h2>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-transparent px-4.5 py-2.5 font-semibold cursor-pointer text-[var(--ink)] transition-all hover:-translate-y-[1px] hover:shadow-[var(--shadow-strong)] hover:border-transparent"
            onClick={() => navigate('/catalog')}
          >
            <span>Lihat semua</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        {displayProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 bg-[var(--surface)] rounded-3xl border border-dashed border-[var(--line)] text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--surface-sunken)] border border-[var(--line)] flex items-center justify-center text-[var(--ink-soft)] mb-1">
              <PackageOpen size={32} />
            </div>
            <h3 className="m-0 text-xl text-[var(--ink)] font-[family-name:var(--font-display)]">Belum ada produk</h3>
            <p className="m-0 text-[var(--ink-soft)] max-w-[400px]">
              Toko ini belum memiliki produk yang tersedia saat ini. Silakan pilih toko lain atau kembali lagi nanti.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[18px] transition-opacity duration-200" style={{ opacity: (!initialProducts && loading) ? 0.5 : 1, pointerEvents: (!initialProducts && loading) ? 'none' : 'auto' }}>
            {displayProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isAddingToCart={addingProductId === product.id}
                onAddToCart={() => void addToCart(product, 1, activeStoreId)}
                onClick={() => navigate(`/products/${product.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
