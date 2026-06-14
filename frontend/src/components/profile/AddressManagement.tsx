import { useEffect, useState } from 'react'
import { useAddressStore } from '../../store/addressStore'
import { MapPin, Plus, Star, Edit2, Trash2 } from 'lucide-react'
import { AddressFormModal } from './AddressFormModal'
import type { UserAddress } from '../../types/address'

export const AddressManagement = () => {
  const { addresses, fetchAddresses, deleteAddress, setPrimaryAddress, isLoading } = useAddressStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null)

  useEffect(() => {
    fetchAddresses()
  }, [fetchAddresses])

  const handleEdit = (address: UserAddress) => {
    setEditingAddress(address)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setEditingAddress(null)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus alamat ini?')) {
      await deleteAddress(id)
    }
  }

  return (
    <div className="hero-card" style={{ padding: '32px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>Daftar Alamat</h2>
          <p style={{ margin: 0, color: 'var(--ink-soft)' }}>Kelola alamat pengiriman untuk pesanan Anda.</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="button primary"
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            padding: '10px 20px', borderRadius: '30px'
          }}
        >
          <Plus size={18} />
          Tambah Alamat
        </button>
      </div>

      {isLoading && addresses.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink-soft)' }}>
          Memuat alamat...
        </div>
      ) : addresses.length === 0 ? (
        <div style={{ 
          padding: '48px 0', textAlign: 'center', backgroundColor: 'var(--surface-muted)', 
          borderRadius: '16px', border: '1px dashed var(--line)'
        }}>
          <MapPin size={48} color="var(--line)" style={{ margin: '0 auto 16px' }} />
          <h4 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>Belum Ada Alamat</h4>
          <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: '0.9rem' }}>Anda belum menyimpan alamat satupun.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {addresses.map((address) => (
            <div 
              key={address.id} 
              style={{
                padding: '24px', 
                borderRadius: '16px',
                border: address.isPrimary ? '2px solid var(--accent-strong)' : '1px solid var(--line)',
                backgroundColor: address.isPrimary ? 'var(--surface)' : 'transparent',
                display: 'flex', 
                flexDirection: 'column',
                gap: '16px',
                position: 'relative',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                if (!address.isPrimary) {
                  e.currentTarget.style.borderColor = 'var(--ink-soft)'
                  e.currentTarget.style.backgroundColor = 'var(--surface-muted)'
                }
              }}
              onMouseOut={(e) => {
                if (!address.isPrimary) {
                  e.currentTarget.style.borderColor = 'var(--line)'
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              {address.isPrimary && (
                <div style={{
                  position: 'absolute', top: '-12px', left: '24px',
                  backgroundColor: 'var(--accent-strong)', color: 'white',
                  padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem',
                  fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <Star size={12} fill="white" />
                  Alamat Utama
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem', color: 'var(--ink)' }}>{address.recipientName}</h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--ink-soft)' }}>{address.phone}</p>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => handleEdit(address)}
                    style={{ 
                      background: 'none', border: '1px solid var(--line)', borderRadius: '8px',
                      padding: '8px', cursor: 'pointer', color: 'var(--ink)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    title="Edit Alamat"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(address.id)}
                    style={{ 
                      background: 'none', border: '1px solid var(--line)', borderRadius: '8px',
                      padding: '8px', cursor: 'pointer', color: '#dc2626',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    title="Hapus Alamat"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div>
                <p style={{ margin: '0 0 4px', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  {address.address}
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--ink-soft)' }}>
                  {address.district ? `${address.district}, ` : ''}{address.city}, {address.province} {address.postalCode}
                </p>
              </div>

              {!address.isPrimary && (
                <div style={{ borderTop: '1px dashed var(--line)', paddingTop: '16px', marginTop: '4px' }}>
                  <button 
                    onClick={() => setPrimaryAddress(address.id)}
                    style={{
                      background: 'none', border: 'none', padding: 0, color: 'var(--accent-strong)',
                      fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                  >
                    Jadikan Alamat Utama
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AddressFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        editData={editingAddress} 
      />
    </div>
  )
}
