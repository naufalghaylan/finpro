import type { Dispatch, FormEvent, SetStateAction } from 'react'
import { Loader2, MapPin } from 'lucide-react'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: string })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

export type StoreDetailFormData = {
  name: string
  address: string
  phone: string
  description: string
  latitude: number
  longitude: number
  serviceRadius: number
}

type AdminStoreDetailsFormProps = {
  formData: StoreDetailFormData
  position: [number, number]
  saving: boolean
  setFormData: Dispatch<SetStateAction<StoreDetailFormData>>
  setPosition: (position: [number, number]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

function LocationMarker({
  position,
  setPosition,
}: {
  position: [number, number]
  setPosition: (position: [number, number]) => void
}) {
  useMapEvents({
    click(event) {
      setPosition([event.latlng.lat, event.latlng.lng])
    },
  })

  return <Marker position={position} />
}

export function AdminStoreDetailsForm({
  formData,
  position,
  saving,
  setFormData,
  setPosition,
  onSubmit,
}: AdminStoreDetailsFormProps) {
  return (
    <div className="rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm p-6 md:p-8 max-w-4xl">
      <h4 className="text-base font-bold text-admin-ink m-0 mb-6 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-admin-accent" />
        Ubah Detail Toko & Lokasi
      </h4>
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">Nama Toko</label>
            <input
              type="text"
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                         focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">Alamat Lengkap</label>
            <input
              type="text"
              value={formData.address}
              onChange={(event) => setFormData({ ...formData, address: event.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                         focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">Nomor Telepon</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                         focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">Deskripsi</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(event) => setFormData({ ...formData, description: event.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink resize-y
                         focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
            />
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">
              Tentukan Titik Koordinat
            </label>
            <p className="text-[11px] text-admin-ink-muted mb-3 leading-relaxed">
              Klik pada peta untuk mengubah lokasi toko. Ini akan memperbarui latitude dan longitude secara otomatis.
            </p>

            <div className="h-[240px] w-full rounded-xl overflow-hidden border border-admin-line bg-admin-surface-2 mb-4 z-0 relative">
              <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={position} setPosition={setPosition} />
              </MapContainer>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[10px] font-semibold text-admin-ink-soft uppercase tracking-wider mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  readOnly
                  className="w-full px-3 py-2 rounded-lg border border-admin-line bg-admin-surface-2 text-xs text-admin-ink-soft cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-admin-ink-soft uppercase tracking-wider mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  readOnly
                  className="w-full px-3 py-2 rounded-lg border border-admin-line bg-admin-surface-2 text-xs text-admin-ink-soft cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-admin-ink-soft uppercase tracking-wider mb-1">Radius Layanan (km)</label>
              <input
                type="number"
                value={formData.serviceRadius}
                onChange={(event) => setFormData({ ...formData, serviceRadius: Number(event.target.value) })}
                className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                           focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
              />
            </div>
          </div>

          <div className="pt-2 mt-auto">
            <button
              type="submit"
              disabled={saving}
              className="w-full inline-flex justify-center items-center gap-2 px-6 py-3 rounded-xl bg-admin-accent text-white
                         text-sm font-semibold border-none cursor-pointer shadow-md
                         hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 admin-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Perubahan'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
