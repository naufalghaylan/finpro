import { useState, useRef, useEffect } from 'react'
import { useAddressStore } from '../../store/addressStore'
import { searchDestinations } from '../../api/rajaongkir'
import type { KomerceDestination } from '../../api/rajaongkir'
import { MapPin, X, LocateFixed, Loader2, Search } from 'lucide-react'
import { z } from 'zod'
import type { UserAddress, CreateUserAddressDTO } from '../../types/address'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix leaflet icon issue in React
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

function LocationMarker({ position, setPosition }: { position: [number, number] | null, setPosition: (pos: [number, number]) => void }) {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  useEffect(() => {
    if (position) {
      map.flyTo(position, 15);
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}


const addressSchema = z.object({
  recipientName: z.string().min(3, "Nama penerima minimal 3 karakter"),
  phone: z.string().min(10, "Nomor telepon minimal 10 angka").max(15, "Nomor telepon maksimal 15 angka").regex(/^[0-9]+$/, "Nomor telepon hanya boleh berisi angka"),
  cityId: z.string().min(1, "Kecamatan / Kota harus dipilih dari opsi pencarian"),
  address: z.string().min(10, "Detail alamat minimal 10 karakter"),
  latitude: z.number({ error: "Titik pin pengiriman (lokasi) wajib ditentukan" }),
  longitude: z.number({ error: "Titik pin pengiriman (lokasi) wajib ditentukan" }),
})

interface AddressFormModalProps {
  isOpen: boolean
  onClose: () => void
  editData?: UserAddress | null
}

import { createPortal } from 'react-dom'

export const AddressFormModal = ({ isOpen, onClose, editData }: AddressFormModalProps) => {
  const { createAddress, updateAddress, isLoading } = useAddressStore()
  
  const [formData, setFormData] = useState<CreateUserAddressDTO>({
    recipientName: '',
    phone: '',
    address: '',
    province: '',
    provinceId: '',
    city: '',
    cityId: '',
    district: '',
    postalCode: '',
    latitude: undefined,
    longitude: undefined,
    isPrimary: false
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [destinations, setDestinations] = useState<KomerceDestination[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  const [prevEditData, setPrevEditData] = useState(editData)

  if (isOpen !== prevIsOpen || editData !== prevEditData) {
    setPrevIsOpen(isOpen)
    setPrevEditData(editData)
    if (isOpen) {
      if (editData) {
        setFormData({
          recipientName: editData.recipientName,
          phone: editData.phone,
          address: editData.address,
          province: editData.province,
          provinceId: editData.provinceId || '',
          city: editData.city,
          cityId: editData.cityId || '',
          district: editData.district || '',
          postalCode: editData.postalCode || '',
          latitude: editData.latitude || undefined,
          longitude: editData.longitude || undefined,
          isPrimary: editData.isPrimary
        })
        setSearchQuery(`${editData.city}, ${editData.province}`)
      } else {
        // Reset
        setFormData({
          recipientName: '',
          phone: '',
          address: '',
          province: '',
          provinceId: '',
          city: '',
          cityId: '',
          district: '',
          postalCode: '',
          latitude: undefined,
          longitude: undefined,
          isPrimary: false
        })
        setSearchQuery('')
      }
      setDestinations([])
      setShowSuggestions(false)
      setErrorMsg('')
      setFormErrors({})
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchQuery(val)
    setShowSuggestions(true)
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    
    if (val.length >= 3) {
      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearching(true)
        try {
          const results = await searchDestinations(val)
          setDestinations(results)
        } catch (err) {
          console.error(err)
          setErrorMsg('Gagal mencari lokasi.')
        } finally {
          setIsSearching(false)
        }
      }, 500)
    } else {
      setDestinations([])
    }
  }

  const handleSelectDestination = (dest: KomerceDestination) => {
    setSearchQuery(dest.label)
    setFormData(prev => ({
      ...prev,
      cityId: dest.id.toString(),
      city: dest.city_name,
      province: dest.province_name,
      district: dest.subdistrict_name || dest.district_name,
      postalCode: dest.zip_code
    }))
    setShowSuggestions(false)
    setFormErrors(prev => ({...prev, cityId: ''}))
  }

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation tidak didukung oleh browser ini')
      return
    }

    setLoadingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }))
        setFormErrors(prev => ({...prev, latitude: '', longitude: ''}))
        setLoadingLocation(false)
      },
      (err) => {
        setLoadingLocation(false)
        console.error(err)
        setErrorMsg('Gagal mendapatkan lokasi. Pastikan izin lokasi diberikan.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setFormErrors({})
    
    const result = addressSchema.safeParse(formData)
    if (!result.success) {
      const errors: Record<string, string> = {}
      result.error.issues.forEach((issue: z.ZodIssue) => {
        if (issue.path[0]) {
          errors[issue.path[0].toString()] = issue.message
        }
      })
      setFormErrors(errors)
      return
    }

    try {
      if (editData) {
        await updateAddress(editData.id, formData)
      } else {
        await createAddress(formData)
      }
      onClose()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string, errors?: Array<{ message: string }> } }, message?: string };
      const backendMessage = error.response?.data?.message;
      const validationErrors = error.response?.data?.errors;
      
      if (validationErrors && Array.isArray(validationErrors)) {
        setErrorMsg(`Validasi gagal: ${validationErrors[0].message}`);
      } else if (backendMessage) {
        setErrorMsg(backendMessage);
      } else {
        setErrorMsg(error.message || 'Terjadi kesalahan saat menyimpan alamat');
      }
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 bg-[#1f2a2266] backdrop-blur-[4px] flex items-center justify-center z-[1000] sm:p-6 lg:p-8">
      <div className="bg-[var(--surface)] w-full h-full sm:rounded-[24px] sm:max-w-[1000px] sm:max-h-[95vh] flex flex-col shadow-[var(--shadow-strong)] animate-[fadeUp_0.3s_ease-out_forwards]">
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-[var(--line)] flex justify-between items-center sticky top-0 bg-[var(--surface)] z-10 shrink-0">
          <h2 className="m-0 text-[1.25rem] text-[var(--ink)] font-semibold">
            {editData ? 'Edit Alamat' : 'Tambah Alamat Baru'}
          </h2>
          <button 
            type="button"
            onClick={onClose} 
            className="bg-transparent border-none cursor-pointer text-[var(--ink-soft)] p-2 rounded-full flex items-center justify-center hover:bg-[var(--surface-muted)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 flex-1 overflow-y-auto">
          {errorMsg && (
            <div className="bg-[#fee2e2] text-[#dc2626] px-4 py-3 rounded-lg mb-6 text-[0.9rem]">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            <div className="flex flex-col gap-2">
              <label className="text-[0.9rem] font-medium text-[var(--ink)]">Nama Penerima *</label>
              <input 
                type="text"
                value={formData.recipientName}
                onChange={e => {
                  setFormData({...formData, recipientName: e.target.value})
                  if (formErrors.recipientName) setFormErrors({...formErrors, recipientName: ''})
                }}
                className={`w-full px-4 py-3 rounded-lg border ${formErrors.recipientName ? 'border-[#dc2626]' : 'border-[var(--line)]'} bg-transparent focus:outline-none focus:border-[var(--accent)] transition-colors`}
              />
              {formErrors.recipientName && <span className="text-[#dc2626] text-[0.8rem] -mt-1">{formErrors.recipientName}</span>}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[0.9rem] font-medium text-[var(--ink)]">Nomor Telepon *</label>
              <input 
                type="tel"
                value={formData.phone}
                onChange={e => {
                  setFormData({...formData, phone: e.target.value})
                  if (formErrors.phone) setFormErrors({...formErrors, phone: ''})
                }}
                className={`w-full px-4 py-3 rounded-lg border ${formErrors.phone ? 'border-[#dc2626]' : 'border-[var(--line)]'} bg-transparent focus:outline-none focus:border-[var(--accent)] transition-colors`}
              />
              {formErrors.phone && <span className="text-[#dc2626] text-[0.8rem] -mt-1">{formErrors.phone}</span>}
            </div>
          </div>

          <div className="flex flex-col gap-2 mb-5 relative">
            <label className="text-[0.9rem] font-medium text-[var(--ink)]">Cari Kecamatan / Kota *</label>
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Ketik minimal 3 huruf..."
                className={`w-full py-3 pr-4 pl-11 rounded-lg border ${formErrors.cityId ? 'border-[#dc2626]' : 'border-[var(--line)]'} bg-transparent focus:outline-none focus:border-[var(--accent)] transition-colors`}
              />
              {isSearching && (
                <Loader2 size={16} className="animate-spin absolute right-4 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" />
              )}
            </div>
            
            {showSuggestions && destinations.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--surface)] rounded-lg border border-[var(--line)] shadow-[var(--shadow-soft)] z-50 max-h-[200px] overflow-y-auto">
                {destinations.map(dest => (
                  <div 
                    key={dest.id}
                    onClick={() => handleSelectDestination(dest)}
                    className="px-4 py-3 cursor-pointer border-b border-[var(--line)] text-[0.9rem] hover:bg-[var(--surface-muted)] transition-colors last:border-0"
                  >
                    <strong>{dest.subdistrict_name}</strong> - {dest.city_name}, {dest.province_name} ({dest.zip_code})
                  </div>
                ))}
              </div>
            )}
            
            {!formData.cityId && searchQuery.length >= 3 && !isSearching && destinations.length === 0 && (
              <div className="text-[0.85rem] text-[var(--accent-strong)] mt-1">
                Pilih lokasi dari daftar yang muncul.
              </div>
            )}
            {formErrors.cityId && <div className="text-[#dc2626] text-[0.8rem] mt-1">{formErrors.cityId}</div>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            <div className="flex flex-col gap-2">
              <label className="text-[0.9rem] font-medium text-[var(--ink)]">Kecamatan</label>
              <input 
                type="text"
                value={formData.district || ''}
                onChange={e => setFormData({...formData, district: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-[var(--line)] bg-transparent focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[0.9rem] font-medium text-[var(--ink)]">Kode Pos</label>
              <input 
                type="text"
                value={formData.postalCode || ''}
                onChange={e => setFormData({...formData, postalCode: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-[var(--line)] bg-transparent focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 mb-6">
            <label className="text-[0.9rem] font-medium text-[var(--ink)]">Detail Alamat *</label>
            <textarea 
              rows={3}
              value={formData.address}
              onChange={e => {
                setFormData({...formData, address: e.target.value})
                if (formErrors.address) setFormErrors({...formErrors, address: ''})
              }}
              placeholder="Nama jalan, gedung, no. rumah..."
              className={`w-full px-4 py-3 rounded-lg border ${formErrors.address ? 'border-[#dc2626]' : 'border-[var(--line)]'} bg-transparent focus:outline-none focus:border-[var(--accent)] transition-colors resize-y`}
            />
            {formErrors.address && <span className="text-[#dc2626] text-[0.8rem] -mt-1">{formErrors.address}</span>}
          </div>

          <div className="bg-[var(--surface-muted)] rounded-xl p-4 mb-8 border border-dashed border-[var(--line)]">
            <div className="flex justify-between items-start mb-4 gap-4">
              <div>
                <h4 className="m-0 mb-1 text-[1rem] flex items-center gap-2 text-[var(--ink)]">
                  <MapPin size={18} color="var(--accent-strong)" />
                  Titik Pin Pengiriman *
                </h4>
                <p className="m-0 text-[0.85rem] text-[var(--ink-soft)]">
                  Klik tombol disamping atau klik pada peta. Diperlukan untuk memvalidasi jarak ke toko terdekat.
                </p>
              </div>
              <button 
                type="button" 
                onClick={handleGetLocation}
                disabled={loadingLocation}
                title="Gunakan Lokasi Saat Ini"
                className="flex items-center justify-center bg-white border border-[var(--line)] w-10 h-10 rounded-full cursor-pointer text-[var(--ink)] shrink-0 hover:bg-[var(--surface)] transition-colors disabled:opacity-50"
              >
                {loadingLocation ? <Loader2 size={18} className="animate-spin" /> : <LocateFixed size={18} />}
              </button>
            </div>
            
            <div className="h-[250px] w-full rounded-xl overflow-hidden border border-[var(--line)] mb-4 relative z-0">
              <MapContainer 
                center={formData.latitude && formData.longitude ? [formData.latitude, formData.longitude] : [-6.2088, 106.8456]} 
                zoom={13} 
                style={{ height: '100%', width: '100%', zIndex: 0 }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker 
                  position={formData.latitude && formData.longitude ? [formData.latitude, formData.longitude] : null} 
                  setPosition={(pos) => {
                    setFormData(prev => ({
                      ...prev,
                      latitude: pos[0],
                      longitude: pos[1]
                    }))
                    setFormErrors(prev => ({...prev, latitude: '', longitude: ''}))
                  }} 
                />
              </MapContainer>
            </div>

            {formData.latitude && formData.longitude ? (
              <div className="flex gap-4 text-[0.85rem] text-[var(--accent-cool)] bg-[#eef6f0] px-3 py-2 rounded-md">
                <span><strong>Lat:</strong> {formData.latitude.toFixed(6)}</span>
                <span><strong>Lng:</strong> {formData.longitude.toFixed(6)}</span>
              </div>
            ) : (
              <div className="text-[0.85rem] text-[var(--accent-strong)]">
                Belum ada titik koordinat yang dipilih.
              </div>
            )}
            {formErrors.latitude && (
              <div className="text-[0.85rem] text-[#dc2626] mt-2">
                {formErrors.latitude}
              </div>
            )}
          </div>

          {!editData && (
             <div className="flex items-center gap-3 mb-8">
              <input 
                type="checkbox" 
                id="isPrimary"
                checked={formData.isPrimary}
                onChange={e => setFormData({...formData, isPrimary: e.target.checked})}
                className="w-[18px] h-[18px] accent-[var(--accent-strong)] cursor-pointer"
              />
              <label htmlFor="isPrimary" className="cursor-pointer text-[0.95rem] text-[var(--ink)]">
                Jadikan sebagai alamat utama
              </label>
            </div>
          )}

          <div className="flex gap-4 justify-end">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-3 rounded-[30px] border border-[var(--line)] bg-transparent cursor-pointer font-medium text-[var(--ink)] hover:bg-[var(--surface-muted)] transition-colors"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="px-8 py-3 rounded-[30px] border-none bg-[var(--accent)] text-white cursor-pointer font-semibold flex items-center gap-2 hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(232,107,79,0.25)] transition-all disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {isLoading && <Loader2 size={18} className="animate-spin" />}
              {editData ? 'Simpan Perubahan' : 'Tambah Alamat'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
