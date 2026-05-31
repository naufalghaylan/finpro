import type { LocationStatus } from '../../hooks/home/useLocationSelection'
import type { StoreLocation } from '../../types/home/home'
import { formatDistance } from '../../utils/home/format'

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

const getStatusLabel = (status: LocationStatus, isFallback: boolean) => {
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
  const statusLabel = getStatusLabel(status, isFallback)
  const distanceLabel = distanceKm !== null ? formatDistance(distanceKm) : '--'
  const storeTag = store.isMain ? 'Toko utama' : 'Toko terdekat'

  return (
    <section className="section location-section">
      <div className="shell location-panel">
        <div className="location-info">
          <div className="location-header">
            <span className={`status-pill status-${status}`}>{statusLabel}</span>
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
          <button type="button" className="button ghost" onClick={onRequestLocation}>
            Gunakan lokasi
          </button>
          <button type="button" className="button subtle" onClick={onUseMainStore}>
            Pakai toko utama
          </button>
        </div>
        {error ? <p className="location-error">{error}</p> : null}
        {!serviceable ? (
          <div className="location-warning">
            Lokasi di luar jangkauan layanan. Coba lokasi lain atau pilih toko utama.
          </div>
        ) : null}
      </div>
    </section>
  )
}
