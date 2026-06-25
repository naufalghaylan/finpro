import { useState } from 'react'
import type { LocationStatus } from '../../hooks/home/useLocationSelection'
import type { StoreLocation } from '../../types/home/home'
import { formatDistance } from '../../utils/home/format'
import { useAuthStore } from '../../store/authStore'
import { useAddressStore } from '../../store/addressStore'
import { AddressSelectorModal } from './AddressSelectorModal'

type LocationPanelProps = {
  status: LocationStatus
  store: StoreLocation
  distanceKm: number | null
  serviceRangeKm: number
  serviceable: boolean
  error: string | null
  isFallback: boolean
  onRequestLocation: () => void
  onUseMainStore: () => void
}

const getStatusLabel = (status: LocationStatus, isFallback: boolean, isAddressSelected: boolean) => {
  if (isAddressSelected) {
    return 'Menggunakan alamat tersimpan'
  }
  if (isFallback) {
    return 'Menggunakan toko utama'
  }

  switch (status) {
    case 'requesting':
      return 'Mencari lokasi kamu'
    case 'granted':
      return 'Lokasi kamu digunakan'
    case 'denied':
      return 'Izin lokasi ditolak'
    case 'unavailable':
      return 'Lokasi tidak tersedia'
    default:
      return 'Menentukan lokasi'
  }
}

export const LocationPanel = ({
  status,
  store,
  distanceKm,
  serviceRangeKm,
  serviceable,
  error,
  isFallback,
  onRequestLocation,
  onUseMainStore,
}: LocationPanelProps) => {
  const { isAuthenticated } = useAuthStore()
  const { selectedAddressId, selectAddress } = useAddressStore()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const isAddressSelected = selectedAddressId !== null
  const statusLabel = getStatusLabel(status, isFallback, isAddressSelected)
  const distanceLabel = distanceKm !== null ? formatDistance(distanceKm) : '--'
  const storeTag = store.isMain ? 'Toko utama' : 'Toko terdekat'

  return (
    <section className="py-[28px]">
      <div className="w-full max-w-[1440px] mx-auto px-[clamp(16px,4vw,48px)]">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-5 items-start md:items-center p-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)]">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`px-2.5 py-1 rounded-full text-[0.7rem] font-bold tracking-wider uppercase bg-[var(--accent-soft)] text-[var(--accent-strong)]`}>{statusLabel}</span>
              <span className="text-[0.8rem] text-[var(--ink-soft)]">{storeTag}</span>
            </div>
            <h3 className="m-0 font-[family-name:var(--font-display)] text-[1.4rem] font-semibold text-[var(--ink)] mt-2">{store.name}</h3>
            <p className="m-0 text-[0.95rem] text-[var(--ink-soft)]">{store.address}</p>
            <div className="flex gap-3 text-[0.85rem] text-[var(--ink-soft)]">
              <span>Jarak {distanceLabel}</span>
              <span>Maks {serviceRangeKm} km</span>
            </div>
          </div>
          <div className="flex gap-2.5 flex-wrap justify-start md:justify-end">
            {isAuthenticated ? (
              <button type="button" className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-transparent px-4 py-2 font-semibold cursor-pointer text-[var(--ink)] transition-all hover:-translate-y-[1px] hover:shadow-[var(--shadow-strong)] hover:border-transparent" onClick={() => setIsModalOpen(true)}>
                Pilih Alamat Pengiriman
              </button>
            ) : (
              <button type="button" className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-transparent px-4 py-2 font-semibold cursor-pointer text-[var(--ink)] transition-all hover:-translate-y-[1px] hover:shadow-[var(--shadow-strong)] hover:border-transparent" onClick={onRequestLocation}>
                Gunakan lokasi saya
              </button>
            )}
            
            <button type="button" className="inline-flex items-center justify-center rounded-full border border-transparent bg-transparent px-4 py-2 font-semibold cursor-pointer text-[var(--ink-soft)] transition-colors hover:bg-[var(--line)] hover:text-[var(--ink)]" onClick={onUseMainStore}>
              Pakai toko utama
            </button>
            <a href="#stores" className="inline-flex items-center justify-center rounded-full border border-transparent bg-transparent px-4 py-2 font-semibold cursor-pointer text-[var(--ink-soft)] transition-colors hover:bg-[var(--line)] hover:text-[var(--ink)] no-underline">
              Pilih toko lain
            </a>
          </div>
          {error && !isAddressSelected ? (
            <div className="col-span-full flex items-center gap-2 px-4 py-3 bg-[#fdf2f2] text-[#c53030] rounded-xl border border-[#fed7d7] text-[0.9rem] font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              {error}
            </div>
          ) : null}
          {!serviceable ? (
            <div className="col-span-full px-3.5 py-3 rounded-2xl bg-[#fff3e5] text-[#8f4a1f] text-[0.9rem] font-medium">
              Lokasi di luar jangkauan layanan. Coba lokasi lain atau pilih toko utama.
            </div>
          ) : null}
        </div>
      </div>

      <AddressSelectorModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectAddress={(id) => {
          selectAddress(id)
          if (id === null) {
            onRequestLocation()
          }
        }}
      />
    </section>
  )
}
