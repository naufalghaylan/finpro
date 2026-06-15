import { useState, useEffect, useRef } from 'react'
import { useAddressStore } from '../../store/addressStore'
import { searchDestinations } from '../../api/rajaongkir'
import type { KomerceDestination } from '../../api/rajaongkir'
import { MapPin, X, Target, Loader2, Search } from 'lucide-react'
import type { UserAddress, CreateUserAddressDTO } from '../../types/address'

interface AddressFormModalProps {
  isOpen: boolean
  onClose: () => void
  editData?: UserAddress | null
}

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
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
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
    }
  }, [isOpen, editData])

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
      cityId: dest.id.toString(), // destination_id
      city: dest.city_name,
      province: dest.province_name,
      district: dest.subdistrict_name || dest.district_name,
      postalCode: dest.zip_code
    }))
    setShowSuggestions(false)
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
    
    if (!formData.latitude || !formData.longitude) {
      setErrorMsg('Mohon dapatkan koordinat lokasi untuk pengiriman akurat')
      return
    }

    try {
      if (editData) {
        await updateAddress(editData.id, formData)
      } else {
        await createAddress(formData)
      }
      onClose()
    } catch (err: any) {
      // Check for backend Zod validation errors
      const backendMessage = err.response?.data?.message;
      const validationErrors = err.response?.data?.errors;
      
      if (validationErrors && Array.isArray(validationErrors)) {
        setErrorMsg(`Validasi gagal: ${validationErrors[0].message}`);
      } else if (backendMessage) {
        setErrorMsg(backendMessage);
      } else {
        setErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan alamat');
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(31, 42, 34, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px'
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'var(--surface)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: 'var(--shadow-strong)',
        animation: 'fadeUp 0.3s ease-out forwards'
      }}>
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid var(--line)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 10
        }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--ink)' }}>
            {editData ? 'Edit Alamat' : 'Tambah Alamat Baru'}
          </h2>
          <button onClick={onClose} style={{ 
            background: 'none', border: 'none', cursor: 'pointer', 
            color: 'var(--ink-soft)', padding: '8px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-muted)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
          {errorMsg && (
            <div style={{
              backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px 16px',
              borderRadius: '8px', marginBottom: '24px', fontSize: '0.9rem'
            }}>
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Nama Penerima *</label>
              <input 
                type="text" required
                value={formData.recipientName}
                onChange={e => setFormData({...formData, recipientName: e.target.value})}
                style={{
                  padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--line)',
                  backgroundColor: 'transparent', width: '100%', outline: 'none'
                }}
              />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Nomor Telepon *</label>
              <input 
                type="tel" required
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                style={{
                  padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--line)',
                  backgroundColor: 'transparent', width: '100%', outline: 'none'
                }}
              />
            </div>
          </div>

          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', position: 'relative' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Cari Kecamatan / Kota *</label>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-soft)' }} />
              <input 
                type="text" 
                required
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Ketik minimal 3 huruf..."
                style={{
                  padding: '12px 16px 12px 42px', borderRadius: '8px', border: '1px solid var(--line)',
                  backgroundColor: 'transparent', width: '100%', outline: 'none'
                }}
              />
              {isSearching && (
                <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-soft)' }} />
              )}
            </div>
            
            {showSuggestions && destinations.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px',
                backgroundColor: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--line)',
                boxShadow: 'var(--shadow-soft)', zIndex: 50, maxHeight: '200px', overflowY: 'auto'
              }}>
                {destinations.map(dest => (
                  <div 
                    key={dest.id}
                    onClick={() => handleSelectDestination(dest)}
                    style={{
                      padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--line)',
                      fontSize: '0.9rem', transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-muted)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <strong>{dest.subdistrict_name}</strong> - {dest.city_name}, {dest.province_name} ({dest.zip_code})
                  </div>
                ))}
              </div>
            )}
            
            {!formData.cityId && searchQuery.length >= 3 && !isSearching && destinations.length === 0 && (
              <div style={{ fontSize: '0.85rem', color: 'var(--accent-strong)', marginTop: '4px' }}>
                Pilih lokasi dari daftar yang muncul.
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Kecamatan</label>
              <input 
                type="text"
                value={formData.district || ''}
                onChange={e => setFormData({...formData, district: e.target.value})}
                style={{
                  padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--line)',
                  backgroundColor: 'transparent', width: '100%', outline: 'none'
                }}
              />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Kode Pos</label>
              <input 
                type="text"
                value={formData.postalCode || ''}
                onChange={e => setFormData({...formData, postalCode: e.target.value})}
                style={{
                  padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--line)',
                  backgroundColor: 'transparent', width: '100%', outline: 'none'
                }}
              />
            </div>
          </div>

          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Detail Alamat *</label>
            <textarea 
              required rows={3}
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              placeholder="Nama jalan, gedung, no. rumah..."
              style={{
                padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--line)',
                backgroundColor: 'transparent', width: '100%', outline: 'none', resize: 'vertical'
              }}
            />
          </div>

          <div style={{ 
            backgroundColor: 'var(--surface-muted)', borderRadius: '12px', padding: '16px',
            marginBottom: '32px', border: '1px dashed var(--line)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={18} color="var(--accent-strong)" />
                  Titik Pin Pengiriman *
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
                  Diperlukan untuk memvalidasi jarak ke toko terdekat.
                </p>
              </div>
              <button 
                type="button" 
                onClick={handleGetLocation}
                disabled={loadingLocation}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  backgroundColor: 'white', border: '1px solid var(--line)',
                  padding: '8px 16px', borderRadius: '20px', cursor: 'pointer',
                  fontSize: '0.9rem', fontWeight: 500, color: 'var(--ink)'
                }}
              >
                {loadingLocation ? <Loader2 size={16} className="animate-spin" /> : <Target size={16} />}
                Gunakan Lokasi Saat Ini
              </button>
            </div>
            
            {formData.latitude && formData.longitude ? (
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--accent-cool)', backgroundColor: '#eef6f0', padding: '8px 12px', borderRadius: '6px' }}>
                <span><strong>Lat:</strong> {formData.latitude.toFixed(6)}</span>
                <span><strong>Lng:</strong> {formData.longitude.toFixed(6)}</span>
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--accent-strong)' }}>
                Belum ada titik koordinat yang dipilih.
              </div>
            )}
          </div>

          {!editData && (
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
              <input 
                type="checkbox" 
                id="isPrimary"
                checked={formData.isPrimary}
                onChange={e => setFormData({...formData, isPrimary: e.target.checked})}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-strong)', cursor: 'pointer' }}
              />
              <label htmlFor="isPrimary" style={{ cursor: 'pointer', fontSize: '0.95rem' }}>
                Jadikan sebagai alamat utama
              </label>
            </div>
          )}

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{
                padding: '12px 24px', borderRadius: '30px', border: '1px solid var(--line)',
                backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 500
              }}
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="button primary"
              style={{
                padding: '12px 32px', borderRadius: '30px', border: 'none',
                backgroundColor: 'var(--accent)', color: 'white', cursor: 'pointer',
                fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              {isLoading && <Loader2 size={18} className="animate-spin" />}
              {editData ? 'Simpan Perubahan' : 'Tambah Alamat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
