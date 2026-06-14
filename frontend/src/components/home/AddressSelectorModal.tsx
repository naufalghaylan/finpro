import { useAddressStore } from '../../store/addressStore'
import { MapPin, X, Check, Search } from 'lucide-react'

interface AddressSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectAddress: (addressId: number | null) => void // null means use current location
}

export const AddressSelectorModal = ({ isOpen, onClose, onSelectAddress }: AddressSelectorModalProps) => {
  const { addresses, selectedAddressId } = useAddressStore()

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
        maxWidth: '500px',
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-strong)',
        animation: 'fadeUp 0.3s ease-out forwards'
      }}>
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid var(--line)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--ink)' }}>
            Pilih Lokasi Pengiriman
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

        <div style={{ padding: '24px 32px', overflowY: 'auto' }}>
          <div 
            onClick={() => {
              onSelectAddress(null)
              onClose()
            }}
            style={{
              padding: '16px', borderRadius: '12px', border: '1px solid var(--line)',
              backgroundColor: selectedAddressId === null ? 'var(--accent-soft)' : 'transparent',
              borderColor: selectedAddressId === null ? 'var(--accent-strong)' : 'var(--line)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px',
              marginBottom: '24px', transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              if (selectedAddressId !== null) e.currentTarget.style.backgroundColor = 'var(--surface-muted)'
            }}
            onMouseOut={(e) => {
              if (selectedAddressId !== null) e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '50%', 
              backgroundColor: 'var(--surface-muted)', display: 'flex', 
              alignItems: 'center', justifyContent: 'center' 
            }}>
              <Search size={20} color="var(--ink)" />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 4px', fontSize: '1rem', color: 'var(--ink)' }}>Gunakan Lokasi Saat Ini</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-soft)' }}>Deteksi lokasi dari perangkat Anda</p>
            </div>
            {selectedAddressId === null && <Check size={20} color="var(--accent-strong)" />}
          </div>

          <h3 style={{ fontSize: '1.05rem', margin: '0 0 16px', color: 'var(--ink)' }}>Alamat Tersimpan</h3>
          
          {addresses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ink-soft)', fontSize: '0.9rem' }}>
              Anda belum menyimpan alamat. <br/> Tambahkan alamat di halaman Profil.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {addresses.map(address => {
                const isSelected = selectedAddressId === address.id
                // Fallback to auto select primary if nothing selected but we actually store null for "current location" so if user wants to use saved address they must select it.
                return (
                  <div 
                    key={address.id}
                    onClick={() => {
                      onSelectAddress(address.id)
                      onClose()
                    }}
                    style={{
                      padding: '16px', borderRadius: '12px',
                      border: isSelected ? '1px solid var(--accent-strong)' : '1px solid var(--line)',
                      backgroundColor: isSelected ? 'var(--accent-soft)' : 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '16px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--surface-muted)'
                    }}
                    onMouseOut={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <div style={{ 
                      width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                      backgroundColor: 'var(--surface)', display: 'flex', 
                      alignItems: 'center', justifyContent: 'center', border: '1px solid var(--line)'
                    }}>
                      <MapPin size={20} color={isSelected ? "var(--accent-strong)" : "var(--ink-soft)"} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--ink)' }}>{address.recipientName}</h4>
                        {address.isPrimary && (
                          <span style={{ 
                            fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', 
                            backgroundColor: 'var(--ink)', color: 'white', fontWeight: 600 
                          }}>Utama</span>
                        )}
                      </div>
                      <p style={{ margin: '0 0 4px', fontSize: '0.85rem', color: 'var(--ink)' }}>{address.phone}</p>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-soft)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {address.address}, {address.city}, {address.province}
                      </p>
                    </div>
                    {isSelected && <Check size={20} color="var(--accent-strong)" style={{ flexShrink: 0, marginTop: '10px' }} />}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
