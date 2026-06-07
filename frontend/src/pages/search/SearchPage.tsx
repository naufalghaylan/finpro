import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { searchProducts } from '../../api/product.api'
import { useCategories } from '../../hooks/useCategories'
import { Navbar } from '../../components/common/Navbar'
import { HomeFooter } from '../../components/home/HomeFooter'
import { ProductCard } from '../../components/product/ProductCard'
import { BRAND, navLinks, footerSections } from '../../data/home/homeData'
import { useAddToCart } from '../../hooks/useAddToCart'
import type { Product, SearchFilters } from '../../types/product'

const LIMIT = 20

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const keyword = searchParams.get('keyword') ?? ''

  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Omit<SearchFilters, 'keyword'>>({
    limit: LIMIT,
    offset: 0,
    sortBy: 'newest'
  })

  const { categories } = useCategories()
  const { addToCart } = useAddToCart()

  useEffect(() => {
    if (!keyword) return
    setLoading(true)
    setError(null)
    searchProducts({ keyword, ...filters })
      .then(res => {
        setProducts(res.products)
        setTotal(res.total)
      })
      .catch(() => setError('Gagal mencari produk'))
      .finally(() => setLoading(false))
  }, [keyword, JSON.stringify(filters)])

  const handleFilterChange = (next: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...next, offset: 0 }))
  }

  const handleAddToCart = (product: Product) => {
    void addToCart(product)
  }

  const currentPage = Math.floor((filters.offset ?? 0) / LIMIT) + 1
  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="page">
      <Navbar brandName={BRAND.name} links={navLinks} />

      <main className="page-main">
        <section className="section">
          <div className="shell">

            {/* Header */}
            <div className="section-head">
              <div>
                <p className="section-kicker">Hasil Pencarian</p>
                <h2 className="section-title">"{keyword}"</h2>
              </div>
              {keyword && (
                <p style={{ color: 'var(--ink-soft)' }}>{total} produk ditemukan</p>
              )}
            </div>

            {/* Filter & Sort — hanya tampil kalau ada keyword */}
            {keyword && (
              <>
                <div className="category-row" style={{ marginBottom: '16px' }}>
                  <button
                    className={`category-chip ${!filters.categoryId ? 'button primary' : ''}`}
                    onClick={() => handleFilterChange({ categoryId: undefined })}
                  >
                    Semua
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      className={`category-chip ${filters.categoryId === cat.id ? 'button primary' : ''}`}
                      onClick={() => handleFilterChange({ categoryId: cat.id })}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--ink-soft)', fontSize: '0.9rem' }}>Urutkan:</span>
                  <select
                    value={filters.sortBy}
                    onChange={e => handleFilterChange({ sortBy: e.target.value as SearchFilters['sortBy'] })}
                    className="button ghost"
                    style={{ fontSize: '0.9rem' }}
                  >
                    <option value="newest">Terbaru</option>
                    <option value="price">Harga Terendah</option>
                    <option value="name">Nama A-Z</option>
                  </select>
                </div>
              </>
            )}

            {/* Jika tidak ada keyword */}
            {!keyword && (
              <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--ink-soft)' }}>
                <p style={{ fontSize: '2rem' }}>🔎</p>
                <p>Masukkan kata kunci di kotak pencarian atas</p>
              </div>
            )}

            {loading && <p>Mencari produk...</p>}
            {error && <p style={{ color: 'var(--accent)' }}>{error}</p>}

            {/* Empty State */}
            {keyword && !loading && !error && products.length === 0 && (
              <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--ink-soft)' }}>
                <p style={{ fontSize: '2rem' }}>😕</p>
                <p style={{ fontWeight: 600 }}>Tidak ada produk untuk "{keyword}"</p>
                <p>Coba kata kunci yang berbeda</p>
              </div>
            )}

            {/* Grid Produk */}
            <div className="product-grid">
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={p => navigate(`/products/${p.id}`)}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
                <button
                  className="button ghost"
                  disabled={currentPage === 1}
                  onClick={() => setFilters(prev => ({ ...prev, offset: (prev.offset ?? 0) - LIMIT }))}
                >
                  ← Sebelumnya
                </button>
                <span style={{ padding: '10px 16px', color: 'var(--ink-soft)' }}>
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button
                  className="button ghost"
                  disabled={currentPage === totalPages}
                  onClick={() => setFilters(prev => ({ ...prev, offset: (prev.offset ?? 0) + LIMIT }))}
                >
                  Selanjutnya →
                </button>
              </div>
            )}

          </div>
        </section>
      </main>

      <HomeFooter brandName={BRAND.name} sections={footerSections} />
    </div>
  )
}
