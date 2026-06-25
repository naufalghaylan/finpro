import { useSearchParams, useNavigate } from 'react-router-dom'
import { useCategories } from '../../hooks/useCategories'
import { useAddToCart } from '../../hooks/useAddToCart'
import { useProductFilters } from '../../hooks/useProductFilters'
import { useProductSearch } from '../../hooks/useProductSearch'
import { Navbar } from '../../components/common/Navbar'
import { HomeFooter } from '../../components/home/HomeFooter'
import { CategoryFilter } from '../../components/product/CategoryFilter'
import { SortSelect } from '../../components/product/SortSelect'
import { Pagination } from '../../components/product/Pagination'
import { ProductResults } from '../../components/product/ProductResults'
import { BRAND, navLinks, footerSections } from '../../data/home/homeData'
import type { Product } from '../../types/product'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const keyword = searchParams.get('keyword') ?? ''

  const { filters, changeFilter, nextPage, prevPage, getPageInfo } = useProductFilters()
  const { products, total, loading, error } = useProductSearch(keyword, filters)
  const { categories } = useCategories()
  const { addToCart, addingProductId } = useAddToCart()

  const handleAddToCart = (product: Product) => void addToCart(product)
  const { currentPage, totalPages } = getPageInfo(total)

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
              {keyword && <p style={{ color: 'var(--ink-soft)' }}>{total} produk ditemukan</p>}
            </div>

            {/* Tanpa keyword: tampilkan ajakan, selesai */}
            {!keyword ? (
              <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--ink-soft)' }}>
                <p style={{ fontSize: '2rem' }}>🔎</p>
                <p>Masukkan kata kunci di kotak pencarian atas</p>
              </div>
            ) : (
              <>
                {/* Filter Kategori */}
                <CategoryFilter
                  categories={categories}
                  selectedId={filters.categoryId}
                  onSelect={categoryId => changeFilter({ categoryId })}
                />

                {/* Sort */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--ink-soft)', fontSize: '0.9rem' }}>Urutkan:</span>
                  <SortSelect value={filters.sortBy} onChange={sortBy => changeFilter({ sortBy })} />
                </div>

                {/* Hasil produk */}
                <ProductResults
                  products={products}
                  loading={loading}
                  error={error}
                  addingProductId={addingProductId ?? undefined}
                  loadingText="Mencari produk..."
                  emptyIcon="😕"
                  emptyTitle={`Tidak ada produk untuk "${keyword}"`}
                  emptySubtitle="Coba kata kunci yang berbeda"
                  onSelect={p => navigate(`/products/${p.id}`)}
                  onAddToCart={handleAddToCart}
                />

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPrev={prevPage}
                  onNext={nextPage}
                />
              </>
            )}

          </div>
        </section>
      </main>

      <HomeFooter brandName={BRAND.name} sections={footerSections} />
    </div>
  )
}
