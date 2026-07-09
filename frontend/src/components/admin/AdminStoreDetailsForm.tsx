import React, { useState } from 'react'
import type { Dispatch, FormEvent, SetStateAction } from 'react'
import { Loader2, MapPin } from 'lucide-react'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import { useAuthStore } from '../../store/authStore'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import MapSearchControl from '../common/MapSearchControl'

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
  disabled
}: {
  position: [number, number]
  setPosition: (position: [number, number]) => void
  disabled?: boolean
}) {
  useMapEvents({
    click(event) {
      if (!disabled) {
        setPosition([event.latlng.lat, event.latlng.lng])
      }
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
  const { user } = useAuthStore()
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const [formErrors, setFormErrors] = useState<{name?: string; address?: string}>({})

  const handleLocalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormErrors({})
    const errors: {name?: string; address?: string} = {}
    let hasError = false

    if (!formData.name.trim()) {
      errors.name = 'Nama toko harus diisi'
      hasError = true
    }
    if (!formData.address.trim()) {
      errors.address = 'Alamat lengkap harus diisi'
      hasError = true
    }

    if (hasError) {
      setFormErrors(errors)
      return
    }

    onSubmit(e)
  }

  return (
    <div className="rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm p-6 md:p-8 max-w-4xl">
      <h4 className="text-base font-bold text-admin-ink m-0 mb-6 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-admin-accent" />
        Ubah Detail Toko & Lokasi
      </h4>
      <form onSubmit={handleLocalSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">Nama Toko</label>
            <input
              type="text"
              value={formData.name}
              onChange={(event) => {
                setFormData({ ...formData, name: event.target.value })
                if (formErrors.name) setFormErrors({ ...formErrors, name: '' })
              }}
              className={`w-full px-4 py-3 rounded-xl border ${formErrors.name ? 'border-[#dc2626]' : 'border-admin-line'} bg-admin-surface text-sm text-admin-ink
                         focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all`}
            />
            {formErrors.name && <span className="text-[#dc2626] text-xs mt-1 block">{formErrors.name}</span>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">Alamat Lengkap</label>
            <input
              type="text"
              value={formData.address}
              onChange={(event) => {
                setFormData({ ...formData, address: event.target.value })
                if (formErrors.address) setFormErrors({ ...formErrors, address: '' })
              }}
              className={`w-full px-4 py-3 rounded-xl border ${formErrors.address ? 'border-[#dc2626]' : 'border-admin-line'} bg-admin-surface text-sm text-admin-ink
                         focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all`}
            />
            {formErrors.address && <span className="text-[#dc2626] text-xs mt-1 block">{formErrors.address}</span>}
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
              {isSuperAdmin
                ? 'Klik pada peta untuk mengubah lokasi toko. Ini akan memperbarui latitude dan longitude secara otomatis.'
                : 'Lokasi toko hanya dapat diubah oleh Super Admin.'}
            </p>

            <div className="h-[240px] w-full rounded-xl overflow-hidden border border-admin-line bg-admin-surface-2 mb-4 z-0 relative">
              <MapContainer
                center={position}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                dragging={isSuperAdmin}
                touchZoom={isSuperAdmin}
                zoomControl={isSuperAdmin}
                scrollWheelZoom={isSuperAdmin}
                doubleClickZoom={isSuperAdmin}
                boxZoom={isSuperAdmin}
                keyboard={isSuperAdmin}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {isSuperAdmin && (
                  <MapSearchControl onLocationSelect={(pos) => setPosition(pos)} />
                )}
                <LocationMarker position={position} setPosition={setPosition} disabled={!isSuperAdmin} />
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
                disabled={!isSuperAdmin}
                className={`w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all ${!isSuperAdmin ? 'cursor-not-allowed opacity-70 bg-admin-surface-2' : ''}`}
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
