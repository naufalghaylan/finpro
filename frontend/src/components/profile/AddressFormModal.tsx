import { useState, useEffect } from 'react'
import { useAddressStore } from '../../store/addressStore'
import { getProvinces, getCities } from '../../api/rajaongkir'
import type { RajaOngkirProvince, RajaOngkirCity } from '../../api/rajaongkir'
import { MapPin, X, Target, Loader2 } from 'lucide-react'
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

  const [provinces, setProvinces] = useState<RajaOngkirProvince[]>([])
  const [cities, setCities] = useState<RajaOngkirCity[]>([])
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (isOpen) {
      // Fetch provinces on mount
      getProvinces().then(setProvinces).catch(console.error)

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

        if (editData.provinceId) {
          getCities(editData.provinceId).then(setCities).catch(console.error)
        }
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
        setCities([])
      }
      setErrorMsg('')
    }
  }, [isOpen, editData])

  const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceId = e.target.value
    const province = provinces.find(p => p.province_id === provinceId)?.province || ''
    
    setFormData(prev => ({ ...prev, provinceId, province, cityId: '', city: '' }))
    
    if (provinceId) {
      try {
        const fetchedCities = await getCities(provinceId)
        setCities(fetchedCities)
      } catch (err) {
        console.error(err)
      }
    } else {
      setCities([])
    }
  }

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityId = e.target.value
    const cityObj = cities.find(c => c.city_id === cityId)
    const city = cityObj ? `${cityObj.type} ${cityObj.city_name}` : ''
    
    setFormData(prev => ({ 
      ...prev, 
      cityId, 
      city,
      postalCode: cityObj?.postal_code || prev.postalCode 
    }))
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
      setErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan alamat')
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

          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Provinsi *</label>
            <select 
              required
              value={formData.provinceId}
              onChange={handleProvinceChange}
              style={{
                padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--line)',
                backgroundColor: 'transparent', width: '100%', outline: 'none', appearance: 'none'
              }}
            >
              <option value="">Pilih Provinsi</option>
              {provinces.map(p => (
                <option key={p.province_id} value={p.province_id}>{p.province}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Kota / Kabupaten *</label>
            <select 
              required disabled={!formData.provinceId}
              value={formData.cityId}
              onChange={handleCityChange}
              style={{
                padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--line)',
                backgroundColor: formData.provinceId ? 'transparent' : 'var(--surface-muted)', 
                width: '100%', outline: 'none', appearance: 'none',
                opacity: formData.provinceId ? 1 : 0.6
              }}
            >
              <option value="">Pilih Kota</option>
              {cities.map(c => (
                <option key={c.city_id} value={c.city_id}>{c.type} {c.city_name}</option>
              ))}
            </select>
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
