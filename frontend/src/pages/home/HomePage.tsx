import { useMemo } from 'react'
import { HeroCarousel } from '../../components/home/HeroCarousel'
import { HomeFooter } from '../../components/home/HomeFooter'
import { HomeNavbar } from '../../components/home/HomeNavbar'
import { LocationPanel } from '../../components/home/LocationPanel'
import { ProductGrid } from '../../components/home/ProductGrid'
import { StoreShowcase } from '../../components/home/StoreShowcase'
import { ValueStrip } from '../../components/home/ValueStrip'
import {
  BRAND,
  categoryChips,
  footerSections,
  heroSlides,
  MAIN_STORE_ID,
  navLinks,
  products,
  SERVICE_RANGE_KM,
  storeLocations,
  valueProps,
} from '../../data/home/homeData'
import { useLocationSelection } from '../../hooks/home/useLocationSelection'
import { useCartCount } from '../../hooks/home/useCartCount'
import { findNearestStore } from '../../utils/home/geo'

const getMainStore = () =>
  storeLocations.find((store) => store.id === MAIN_STORE_ID) ?? storeLocations[0]

export default function HomePage() {
  const {
    status,
    coords,
    error,
    requestLocation,
    fallbackToMainStore,
    isFallback,
  } = useLocationSelection()
  const { cartCount, isLoadingCartCount } = useCartCount()

  const mainStore = getMainStore()

  const nearestStore = useMemo(() => {
    if (!coords) {
      return null
    }

    return findNearestStore(storeLocations, coords)
  }, [coords])

  const activeStore =
    status === 'granted' && nearestStore ? nearestStore.store : mainStore
  const distanceKm =
    status === 'granted' && nearestStore ? nearestStore.distanceKm : null
  const serviceable = distanceKm === null ? true : distanceKm <= SERVICE_RANGE_KM

  return (
    <div className="page">
      <HomeNavbar
        brandName={BRAND.name}
        links={navLinks}
        cartCount={cartCount}
        isLoadingCartCount={isLoadingCartCount}
      />
      <main className="page-main">
        <HeroCarousel slides={heroSlides} storeName={activeStore.name} />
        <section className="category-strip">
          <div className="shell">
            <div className="category-row">
              {categoryChips.map((chip) => (
                <span key={chip.id} className="category-chip">
                  {chip.label}
                </span>
              ))}
            </div>
          </div>
        </section>
        <LocationPanel
          status={status}
          store={activeStore}
          distanceKm={distanceKm}
          serviceRangeKm={SERVICE_RANGE_KM}
          serviceable={serviceable}
          error={error}
          isFallback={isFallback}
          onRequestLocation={requestLocation}
          onUseMainStore={fallbackToMainStore}
        />
        <ValueStrip items={valueProps} sectionId="deals" />
        <ProductGrid
          products={products}
          storeId={activeStore.id}
          storeName={activeStore.name}
        />
        <StoreShowcase
          stores={storeLocations}
          activeStoreId={activeStore.id}
        />
        <section className="section help-section" id="help">
          <div className="shell help-card">
            <div className="help-copy">
              <p className="section-kicker">Butuh bantuan</p>
              <h2 className="section-title">
                Tim customer care siap bantu pilihan belanja kamu.
              </h2>
              <p className="section-body">
                Dapatkan saran menu harian, info stok, dan rekomendasi store
                alternatif dengan cepat.
              </p>
            </div>
            <div className="help-actions">
              <button type="button" className="button primary">
                Hubungi kami
              </button>
              <button type="button" className="button ghost">
                Lihat pusat bantuan
              </button>
            </div>
          </div>
        </section>
      </main>
      <HomeFooter brandName={BRAND.name} sections={footerSections} />
    </div>
  )
}
