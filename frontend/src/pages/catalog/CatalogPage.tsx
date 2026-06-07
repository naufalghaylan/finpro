import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProducts } from '../../hooks/useProducts'
import { useCategories } from '../../hooks/useCategories'
import { useAddToCart } from '../../hooks/useAddToCart'
import { Navbar } from '../../components/common/Navbar'
import { HomeFooter } from '../../components/home/HomeFooter'
import { ProductCard } from '../../components/product/ProductCard'
import { BRAND, navLinks, footerSections } from '../../data/home/homeData'
import type { Product, ProductFilters } from '../../types/product'

export default function CatalogPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<ProductFilters>({
    limit: 20,
    offset: 0,
    sortBy: 'newest'
  })

  const { products, total, loading, error } = useProducts(filters)
  const { categories } = useCategories()
  const { addToCart } = useAddToCart()

  const handleFilterChange = (newFilters: Partial<ProductFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, offset: 0 }))
  }

  const handleAddToCart = (product: Product) => {
    void addToCart(product)
  }

  const currentPage = Math.floor((filters.offset ?? 0) / (filters.limit ?? 20)) + 1
  const totalPages = Math.ceil(total / (filters.limit ?? 20))

  return (
    <div className="page">
      <Navbar brandName={BRAND.name} links={navLinks} />

      <main className="page-main">
        <section className="section">
          <div className="shell">

            {/* Judul + Sort */}
            <div className="section-head">
              <div>
                <p className="section-kicker">Semua Produk</p>
                <h2 className="section-title">Katalog Produk</h2>
              </div>
              <select
                value={filters.sortBy}
                onChange={e => handleFilterChange({ sortBy: e.target.value as ProductFilters['sortBy'] })}
                className="button ghost"
              >
                <option value="newest">Terbaru</option>
                <option value="price">Harga Terendah</option>
                <option value="name">Nama A-Z</option>
              </select>
            </div>

            {/* Filter Kategori */}
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

            {/* Filter Harga */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ color: 'var(--ink-soft)', fontSize: '0.9rem' }}>Harga:</span>
              <input
                type="number"
                placeholder="Min (Rp)"
                style={{ padding: '8px 12px', borderRadius: '999px', border: '1px solid var(--line)', width: '130px', fontSize: '0.9rem' }}
                onChange={e => handleFilterChange({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
              />
              <span style={{ color: 'var(--ink-soft)' }}>–</span>
              <input
                type="number"
                placeholder="Max (Rp)"
                style={{ padding: '8px 12px', borderRadius: '999px', border: '1px solid var(--line)', width: '130px', fontSize: '0.9rem' }}
                onChange={e => handleFilterChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>

            {/* Info total */}
            <p style={{ color: 'var(--ink-soft)', marginBottom: '16px' }}>{total} produk ditemukan</p>

            {/* Loading & Error */}
            {loading && <p>Memuat produk...</p>}
            {error && <p style={{ color: 'var(--accent)' }}>{error}</p>}

            {/* Empty State */}
            {!loading && !error && products.length === 0 && (
              <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--ink-soft)' }}>
                <p style={{ fontSize: '2rem' }}>🔍</p>
                <p style={{ fontWeight: 600 }}>Produk tidak ditemukan</p>
                <p>Coba ubah filter atau kategori</p>
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
                  onClick={() => setFilters(prev => ({ ...prev, offset: (prev.offset ?? 0) - (prev.limit ?? 20) }))}
                >
                  ← Sebelumnya
                </button>
                <span style={{ padding: '10px 16px', color: 'var(--ink-soft)' }}>
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button
                  className="button ghost"
                  disabled={currentPage === totalPages}
                  onClick={() => setFilters(prev => ({ ...prev, offset: (prev.offset ?? 0) + (prev.limit ?? 20) }))}
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
