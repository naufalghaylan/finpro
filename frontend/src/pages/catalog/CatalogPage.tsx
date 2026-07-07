import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProducts } from '../../hooks/useProducts'
import { useCategories } from '../../hooks/useCategories'
import { useAddToCart } from '../../hooks/useAddToCart'
import { useProductFilters } from '../../hooks/useProductFilters'
import { useAuthStore } from '../../store/authStore'
import { useAddressStore } from '../../store/addressStore'
import { useLocationSelection } from '../../hooks/home/useLocationSelection'
import { Navbar } from '../../components/common/Navbar'
import { HomeFooter } from '../../components/home/HomeFooter'
import { CategoryFilter } from '../../components/product/CategoryFilter'
import { SortSelect } from '../../components/product/SortSelect'
import { Pagination } from '../../components/product/Pagination'
import { ProductResults } from '../../components/product/ProductResults'
import { BRAND, navLinks, footerSections } from '../../data/home/homeData'
import type { Product } from '../../types/product'

export default function CatalogPage() {
  const navigate = useNavigate()
  const { filters, changeFilter, nextPage, prevPage, getPageInfo } = useProductFilters()

  // Lokasi user: hanya untuk user login. Tamu → stok total semua toko.
  const { isAuthenticated } = useAuthStore()
  const { addresses, selectedAddressId, fetchAddresses } = useAddressStore()
  const { coords } = useLocationSelection()

  useEffect(() => {
    if (isAuthenticated) fetchAddresses()
  }, [isAuthenticated, fetchAddresses])

  // Alamat acuan: yang dipilih user, jika tidak ada pakai alamat utama.
  const userAddress = useMemo(() => {
    if (!isAuthenticated) return null
    const selected = selectedAddressId != null ? addresses.find(a => a.id === selectedAddressId) : null
    return selected ?? addresses.find(a => a.isPrimary) ?? addresses[0] ?? null
  }, [isAuthenticated, selectedAddressId, addresses])

  // Koordinat user: dari alamat, atau fallback ke geolokasi browser.
  const userCoords = useMemo(() => {
    if (!isAuthenticated) return null
    if (userAddress?.latitude != null && userAddress?.longitude != null) {
      return { lat: userAddress.latitude, lng: userAddress.longitude }
    }
    return coords
  }, [isAuthenticated, userAddress, coords])

  // Kirim lat/lng hanya saat login & lokasi tersedia → backend pakai stok toko terdekat.
  const productFilters = useMemo(
    () => (userCoords ? { ...filters, lat: userCoords.lat, lng: userCoords.lng } : filters),
    [filters, userCoords],
  )

  const { products, total, loading, error } = useProducts(productFilters)
  const { categories } = useCategories()
  const { addToCart, addingProductId } = useAddToCart()

  // Tampilkan produk yang masih ada stok lebih dulu; "Stok habis" diletakkan di bawah.
  // Urutan asli dari backend (Terbaru/Nama/Harga) dipertahankan di dalam tiap grup.
  const sortedProducts = useMemo(() => {
    const inStock = (p: Product) => (p.stocks?.reduce((sum, s) => sum + s.quantity, 0) ?? 0) > 0
    return [...products].sort((a, b) => Number(inStock(b)) - Number(inStock(a)))
  }, [products])

  const handleAddToCart = (product: Product) => void addToCart(product)
  const { currentPage, totalPages } = getPageInfo(total)

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
              <SortSelect value={filters.sortBy} onChange={sortBy => changeFilter({ sortBy })} />
            </div>

            {/* Filter Kategori */}
            <CategoryFilter
              categories={categories}
              selectedId={filters.categoryId}
              onSelect={categoryId => changeFilter({ categoryId })}
            />

            {/* Filter Harga */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ color: 'var(--ink-soft)', fontSize: '0.9rem' }}>Harga:</span>
              <input
                type="number"
                placeholder="Min (Rp)"
                style={{ padding: '8px 12px', borderRadius: '999px', border: '1px solid var(--line)', width: '130px', fontSize: '0.9rem' }}
                onChange={e => changeFilter({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
              />
              <span style={{ color: 'var(--ink-soft)' }}>–</span>
              <input
                type="number"
                placeholder="Max (Rp)"
                style={{ padding: '8px 12px', borderRadius: '999px', border: '1px solid var(--line)', width: '130px', fontSize: '0.9rem' }}
                onChange={e => changeFilter({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>

            {/* Info total */}
            <p style={{ color: 'var(--ink-soft)', marginBottom: '16px' }}>{total} produk ditemukan</p>

            {/* Hasil produk */}
            <ProductResults
              products={sortedProducts}
              loading={loading}
              error={error}
              addingProductId={addingProductId ?? undefined}
              onSelect={p => navigate(`/products/${p.id}`)}
              onAddToCart={handleAddToCart}
            />

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPrev={prevPage}
              onNext={nextPage}
            />

          </div>
        </section>
      </main>

      <HomeFooter brandName={BRAND.name} sections={footerSections} />
    </div>
  )
}
