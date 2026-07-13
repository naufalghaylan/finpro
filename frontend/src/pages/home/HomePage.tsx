

import type { Product } from '../../types/product'
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
  SERVICE_RANGE_KM,
  storeLocations as defaultStores,
  valueProps,
  navLinks as defaultNavLinks
} from '../../data/home/homeData'
import { useLocationSelection } from '../../hooks/home/useLocationSelection'
import { useHomepageData } from '../../hooks/home/useHomepageData'
import { useCallback, useEffect, useMemo } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useAddressStore } from '../../store/addressStore'
import { useFulfillmentStore, type FulfillmentSource } from '../../store/fulfillmentStore'
import {
  ShoppingBag, Tag, MapPin, HelpCircle,
  Carrot, Apple, Beef, Milk, Flame, ChefHat, LayoutGrid, Loader2
} from 'lucide-react'
import type { HomepageStore, HomepageBanner, HomepageCategory, HomepageFooterSocial } from '../../types/home/homepage'
import type { NavLink, StoreLocation } from '../../types/home/home'

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

export default function HomePage() {
  const selectedStoreId = useFulfillmentStore((state) => state.selectedStoreId)
  const setSelectedStoreId = useFulfillmentStore((state) => state.setSelectedStoreId)
  const setActiveStore = useFulfillmentStore((state) => state.setActiveStore)
  const clearSelectedStore = useFulfillmentStore((state) => state.clearSelectedStore)
  const { isAuthenticated } = useAuthStore()
  const { addresses, selectedAddressId, fetchAddresses } = useAddressStore()

  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses()
    }
  }, [isAuthenticated, fetchAddresses])

  const {
    status,
    coords,
    error,
    requestLocation,
    fallbackToMainStore,
    isFallback,
  } = useLocationSelection()

  const selectedAddress = useMemo(() => {
    if (!isAuthenticated || selectedAddressId === null) return null
    return addresses.find(a => a.id === selectedAddressId) || null
  }, [isAuthenticated, selectedAddressId, addresses])

  const finalCoords = selectedAddress && selectedAddress.latitude && selectedAddress.longitude
    ? { lat: selectedAddress.latitude, lng: selectedAddress.longitude }
    : coords

  const { data, loading, error: apiError } = useHomepageData(finalCoords?.lat, finalCoords?.lng)

  const location = useLocation()

  useEffect(() => {
    if (!loading && location.hash) {
      const id = location.hash.replace('#', '')
      const el = document.getElementById(id)
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      } //TODO: coba cek cleanup functionnya, takut keduplicate scroll kalau user cepet ganti hash atau ganti hash pas loading, jadi mungkin kita bisa clear timeoutnya dulu sebelum setTimeout baru, biar kalau user ganti hash cepet gak bikin banyak timeout yang numpuk dan bikin scroll kacau.
    }
  }, [location.hash, loading])

  const activeStores = data?.stores && data.stores.length > 0
    ? data.stores.map((s: HomepageStore, index: number) => ({
        id: s.id.toString(),
        name: s.name,
        city: s.city,
        address: s.address,
        lat: s.latitude,
        lng: s.longitude,
        isMain: index === 0
      }))
    : defaultStores;

  const mainStore = activeStores.find((s: { isMain?: boolean }) => s.isMain) || activeStores[0];

  const isManuallySelected = selectedStoreId && selectedStoreId !== data?.storeInfo?.id?.toString()

  const activeStore = selectedStoreId 
    ? activeStores.find((s: { id: string }) => s.id === selectedStoreId) || mainStore
    : data?.storeInfo 
      ? activeStores.find((s: { id: string }) => s.id === data.storeInfo?.id?.toString()) || mainStore
      : mainStore

  const distanceKm = isManuallySelected ? null : (data?.storeInfo?.distance ?? null)
  const serviceable = isManuallySelected ? true : (data?.storeInfo ? !data.storeInfo.isOutOfRange : true)

  const setFulfillmentStore = useCallback((store: StoreLocation, source: FulfillmentSource) => {
    const numericStoreId = Number(store.id)

    if (!Number.isFinite(numericStoreId)) {
      setActiveStore(null, null)
      return
    }

    setActiveStore(
      {
        id: numericStoreId,
        name: store.name,
        city: store.city,
        address: store.address,
        latitude: store.lat,
        longitude: store.lng,
      },
      source,
    )
  }, [setActiveStore])

  useEffect(() => {
    setFulfillmentStore(activeStore, isManuallySelected ? 'manual_store' : isFallback ? 'fallback' : 'nearest_location')
  }, [activeStore, isFallback, isManuallySelected, setFulfillmentStore])

  const handleSelectStore = (storeId: string) => {
    setSelectedStoreId(storeId)
    const selectedStore = activeStores.find((store: StoreLocation) => store.id === storeId)
    if (selectedStore) {
      setFulfillmentStore(selectedStore, 'manual_store')
    }
  }

  const handleUseMainStore = () => {
    setSelectedStoreId(mainStore.id)
    setFulfillmentStore(mainStore, 'fallback')
    fallbackToMainStore()
  }

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
          id: 'perusahaan',
          title: 'Perusahaan',
          links: [
            { label: 'Tentang PanenMart', href: '/about' },
            { label: 'Mitra petani', href: '/partners' },
            { label: 'Karir', href: '/careers' },
          ],
        },
        {
          id: 'layanan',
          title: 'Layanan',
          links: [
            { label: 'Bantuan', href: '/help' },
            { label: 'Pengembalian', href: '/orders' },
            { label: 'Status pesanan', href: '/orders' },
          ],
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
    <div className="min-h-[100svh] flex flex-col relative overflow-clip before:content-[''] before:fixed before:inset-0 before:bg-[radial-gradient(circle_at_12%_18%,rgba(241,184,132,0.22),transparent_45%),radial-gradient(circle_at_80%_8%,rgba(95,149,123,0.18),transparent_48%),radial-gradient(circle_at_92%_75%,rgba(232,107,79,0.18),transparent_48%)] before:pointer-events-none before:-z-10 bg-[var(--bg)]">
      <Navbar
        brandName={BRAND.name}
        links={activeNavLinks}
      />
      <main className="flex flex-col gap-3 flex-1">
        {loading ? (
          <div className="w-full max-w-[1440px] mx-auto px-[clamp(16px,4vw,48px)] py-32 flex flex-col items-center gap-4">
            <Loader2 size={40} className="animate-spin text-[var(--accent)]" />
            <p className="text-[var(--ink-soft)] font-medium">Loading...</p>
          </div>
        ) : (
          <>
            <HeroCarousel slides={activeBanners} storeName={activeStore.name} />
            <section className="pb-[18px]">
              <div className="w-full max-w-[1440px] mx-auto px-[clamp(16px,4vw,48px)]">
                <div className="flex flex-wrap gap-2.5">
                  {activeNavLinks.map((link: NavLink) => (
                    <Link key={link.id} to={link.href} className="flex items-center px-[14px] py-[8px] rounded-full border border-[var(--line)] bg-[var(--surface)] font-medium text-sm transition-colors hover:bg-[var(--surface-muted)] cursor-pointer">
                      {link.icon ? (
                        <img src={link.icon} alt="" className="w-[18px] h-[18px] mr-2 rounded-full" />
                      ) : (
                        getCategoryIcon(link.label)
                      )}
                      {link.label}
                    </Link>
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
          onUseMainStore={handleUseMainStore}
          onDeliveryLocationChange={clearSelectedStore}
        />
        <ValueStrip items={valueProps} sectionId="deals" />
        <StoreShowcase
          stores={activeStores}
          activeStoreId={activeStore.id}
          onSelectStore={handleSelectStore}
          error={apiError}
        />
        
        <ProductGrid products={isManuallySelected ? undefined : (data?.products as unknown as Product[])} storeId={activeStore.id} />
        </>
        )}
      </main>
      <HomeFooter brandName={BRAND.name} sections={activeFooter} />
    </div>
  )
}
