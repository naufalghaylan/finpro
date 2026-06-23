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
    <section className="section location-section">
      <div className="shell location-panel">
        <div className="location-info">
          <div className="location-header">
            <span className={`status-pill status-${isAddressSelected ? 'granted' : status}`}>{statusLabel}</span>
            <span className="store-tag">{storeTag}</span>
          </div>
          <h3>{store.name}</h3>
          <p className="location-address">{store.address}</p>
          <div className="location-meta">
            <span>Jarak {distanceLabel}</span>
            <span>Maks {serviceRangeKm} km</span>
          </div>
        </div>
        <div className="location-actions">
          {isAuthenticated ? (
            <button type="button" className="button ghost" onClick={() => setIsModalOpen(true)}>
              Pilih Alamat Pengiriman
            </button>
          ) : (
            <button type="button" className="button ghost" onClick={onRequestLocation}>
              Gunakan lokasi saya
            </button>
          )}
          
          <button type="button" className="button subtle" onClick={onUseMainStore}>
            Pakai toko utama
          </button>
          <a href="#stores" className="button subtle">
            Pilih toko lain
          </a>
        </div>
        {error && !isAddressSelected ? (
          <div className="location-error" style={{ 
            gridColumn: '1 / -1',
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '12px 16px', 
            background: '#fdf2f2', 
            color: '#c53030', 
            borderRadius: '12px', 
            border: '1px solid #fed7d7',
            fontSize: '0.9rem',
            fontWeight: 500
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            {error}
          </div>
        ) : null}
        {!serviceable ? (
          <div className="location-warning">
            Lokasi di luar jangkauan layanan. Coba lokasi lain atau pilih toko utama.
          </div>
        ) : null}
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
