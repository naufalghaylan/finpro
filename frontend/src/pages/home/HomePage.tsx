
import { HeroCarousel } from '../../components/home/HeroCarousel'
import { HomeFooter } from '../../components/home/HomeFooter'
import { Navbar } from '../../components/common/Navbar'
import { LocationPanel } from '../../components/home/LocationPanel'
import { ProductGrid } from '../../components/home/ProductGrid'
import { StoreShowcase } from '../../components/home/StoreShowcase'
import { ValueStrip } from '../../components/home/ValueStrip'
import {
  BRAND,
  footerSections as defaultFooter,
  heroSlides as defaultSlides,
  MAIN_STORE_ID,
  SERVICE_RANGE_KM,
  storeLocations as defaultStores,
  valueProps,
  navLinks as defaultNavLinks
} from '../../data/home/homeData'
import { useLocationSelection } from '../../hooks/home/useLocationSelection'
import { useHomepageData } from '../../hooks/home/useHomepageData'
import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  ShoppingBag, Tag, MapPin, HelpCircle,
  Carrot, Apple, Beef, Milk, Flame, ChefHat, LayoutGrid
} from 'lucide-react'
import type { HomepageStore, HomepageBanner, HomepageCategory, HomepageFooterSocial } from '../../types/home/homepage'
import type { NavLink } from '../../types/home/home'

const getCategoryIcon = (label: string) => {
  const normalizedLabel = label.toLowerCase()
  if (normalizedLabel.includes('katalog')) return <ShoppingBag size={18} style={{ marginRight: 8 }} />
  if (normalizedLabel.includes('promo')) return <Tag size={18} style={{ marginRight: 8 }} />
  if (normalizedLabel.includes('toko') || normalizedLabel.includes('store')) return <MapPin size={18} style={{ marginRight: 8 }} />
  if (normalizedLabel.includes('bantuan') || normalizedLabel.includes('help')) return <HelpCircle size={18} style={{ marginRight: 8 }} />
  if (normalizedLabel.includes('sayur')) return <Carrot size={18} style={{ marginRight: 8 }} />
  if (normalizedLabel.includes('buah')) return <Apple size={18} style={{ marginRight: 8 }} />
  if (normalizedLabel.includes('protein') || normalizedLabel.includes('daging')) return <Beef size={18} style={{ marginRight: 8 }} />
  if (normalizedLabel.includes('dairy') || normalizedLabel.includes('susu')) return <Milk size={18} style={{ marginRight: 8 }} />
  if (normalizedLabel.includes('bumbu')) return <Flame size={18} style={{ marginRight: 8 }} />
  if (normalizedLabel.includes('siap')) return <ChefHat size={18} style={{ marginRight: 8 }} />
  return <LayoutGrid size={18} style={{ marginRight: 8 }} />
}

const getMainStore = () =>
  defaultStores.find((store) => store.id === MAIN_STORE_ID) ?? defaultStores[0]

export default function HomePage() {
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)

  const {
    status,
    coords,
    error,
    requestLocation,
    fallbackToMainStore,
    isFallback,
  } = useLocationSelection()

  const { data, loading, error: apiError } = useHomepageData(coords?.lat, coords?.lng)

  const location = useLocation()

  useEffect(() => {
    if (!loading && location.hash) {
      const id = location.hash.replace('#', '')
      const el = document.getElementById(id)
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }
    }
  }, [location.hash, loading])

  const activeStores = data?.stores && data.stores.length > 0
    ? data.stores.map((s: HomepageStore) => ({
        id: s.id.toString(),
        name: s.name,
        city: s.city,
        address: s.address,
        lat: s.latitude,
        lng: s.longitude,
        isMain: s.id.toString() === MAIN_STORE_ID
      }))
    : defaultStores;

  const mainStore = getMainStore()

  const isManuallySelected = selectedStoreId && selectedStoreId !== data?.storeInfo?.id?.toString()

  const activeStore = selectedStoreId 
    ? activeStores.find((s: { id: string }) => s.id === selectedStoreId) || mainStore
    : data?.storeInfo 
      ? activeStores.find((s: { id: string }) => s.id === data.storeInfo?.id?.toString()) || mainStore
      : mainStore

  const distanceKm = isManuallySelected ? null : (data?.storeInfo?.distance ?? null)
  const serviceable = isManuallySelected ? true : (data?.storeInfo ? !data.storeInfo.isOutOfRange : true)

  // Fallbacks if data is missing
  const activeBanners = data?.banners && data.banners.length > 0 
    ? data.banners.map((b: HomepageBanner) => ({
        id: b.id.toString(),
        kicker: "Promo Spesial",
        title: b.title,
        description: "Nikmati penawaran terbaik dari kami.",
        ctaLabel: "Belanja Sekarang",
        note: "S&K Berlaku",
        highlight: "Terbatas",
        imageUrl: b.imageUrl,
        linkUrl: b.linkUrl
      }))
    : defaultSlides;

  const activeNavLinks = data?.categories && data.categories.length > 0
    ? data.categories.map((c: HomepageCategory) => ({
        id: c.id.toString(),
        label: c.name,
        href: `/catalog?category=${c.slug}`,
        icon: c.icon
      }))
    : defaultNavLinks;

  const activeFooter = data?.footer 
    ? [
        {
          id: 'about',
          title: 'Tentang Kami',
          links: [{ label: data.footer.about, href: '#' }]
        },
        {
          id: 'contact',
          title: 'Kontak',
          links: [
            { label: data.footer.contact.email, href: `mailto:${data.footer.contact.email}` },
            { label: data.footer.contact.phone, href: `tel:${data.footer.contact.phone}` }
          ]
        },
        {
          id: 'socials',
          title: 'Media Sosial',
          links: data.footer.socials.map((s: HomepageFooterSocial) => ({ label: s.name, href: s.url }))
        }
      ]
    : defaultFooter;
    


  return (
    <div className="page">
      <Navbar
        brandName={BRAND.name}
        links={activeNavLinks}
      />
      <main className="page-main">
        {loading ? (
          <div className="shell" style={{ padding: '4rem 0', textAlign: 'center' }}>
            <p>Memuat halaman utama...</p>
          </div>
        ) : (
          <>
            <HeroCarousel slides={activeBanners} storeName={activeStore.name} />
            <section className="category-strip">
              <div className="shell">
                <div className="category-row">
                  {activeNavLinks.map((link: NavLink) => (
                    <span key={link.id} className="category-chip" style={{ display: 'flex', alignItems: 'center' }}>
                      {link.icon ? (
                        <img src={link.icon} alt="" style={{width: 18, height: 18, marginRight: 8, borderRadius: '50%'}} />
                      ) : (
                        getCategoryIcon(link.label)
                      )}
                      {link.label}
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
          error={error || apiError}
          isFallback={isFallback}
          onRequestLocation={requestLocation}
          onUseMainStore={fallbackToMainStore}
        />
        <ValueStrip items={valueProps} sectionId="deals" />
        
        {/* We pass the fetched products to ProductGrid if it supports it, else ProductGrid handles it.
            Actually, the user requirement states Product list based on nearest store.
            Let's pass the nearest storeId down to the ProductGrid or it will fetch on its own.
            Since ProductGrid uses useProducts natively, let's update ProductGrid to take storeId,
            or just pass the products array if ProductGrid is modified.
        */}
        <ProductGrid products={isManuallySelected ? undefined : data?.products} storeId={activeStore.id} />
          
        <StoreShowcase
          stores={activeStores}
          activeStoreId={activeStore.id}
          onSelectStore={setSelectedStoreId}
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
        </>
        )}
      </main>
      <HomeFooter brandName={BRAND.name} sections={activeFooter} />
    </div>
  )
}
