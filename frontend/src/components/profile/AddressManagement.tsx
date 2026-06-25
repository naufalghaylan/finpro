import { useEffect, useState } from 'react'
import { useAddressStore } from '../../store/addressStore'
import { MapPin, Plus, Star, Edit2, Trash2 } from 'lucide-react'
import { AddressFormModal } from './AddressFormModal'
import type { UserAddress } from '../../types/address'
import ErrorPage from '../../pages/error/ErrorPage'

export const AddressManagement = () => {
  const { addresses, fetchAddresses, deleteAddress, setPrimaryAddress, isLoading, error} = useAddressStore()
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
  
  if (error) {
    return <ErrorPage />
  }

  return (
    <div className="p-[24px] border border-[var(--line)] rounded-[20px] shadow-[var(--shadow-soft)] bg-white/85">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0 mb-6">
        <div>
          <h3 className="m-0 text-[#111] font-[family-name:var(--font-display)] font-normal tracking-normal text-[1.6rem] mb-1">Daftar Alamat</h3>
          <p className="m-0 text-[0.95rem] text-[var(--ink-soft)] leading-[1.6]">Kelola alamat pengiriman untuk pesanan Anda.</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="flex items-center gap-2 px-5 py-[10px] rounded-full bg-[var(--accent)] text-white font-semibold border-none cursor-pointer hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(232,107,79,0.25)] transition-all shrink-0 text-[0.95rem]"
        >
          <Plus size={18} />
          Tambah Alamat
        </button>
      </div>

      {isLoading && addresses.length === 0 ? (
        <div className="py-10 text-center text-[var(--ink-soft)]">
          Memuat alamat...
        </div>
      ) : addresses.length === 0 ? (
        <div className="py-12 text-center bg-[var(--surface-muted)] rounded-2xl border border-dashed border-[var(--line)]">
          <MapPin size={48} color="var(--line)" className="mx-auto mb-4" />
          <h4 className="m-0 mb-2 text-[1.1rem]">Belum Ada Alamat</h4>
          <p className="m-0 text-[var(--ink-soft)] text-[0.9rem]">Anda belum menyimpan alamat satupun.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {addresses.map((address) => (
            <div 
              key={address.id} 
              className={`p-5 sm:p-6 rounded-2xl flex flex-col gap-4 relative transition-all duration-200 ${address.isPrimary ? 'border-2 border-[var(--accent-strong)] bg-[var(--surface)]' : 'border border-[var(--line)] bg-transparent hover:border-[var(--ink-soft)] hover:bg-[var(--surface-muted)]'}`}
            >
              {address.isPrimary && (
                <div className="absolute -top-3 left-6 bg-[var(--accent-strong)] text-white px-3 py-1 rounded-[20px] text-[0.75rem] font-semibold flex items-center gap-1">
                  <Star size={12} fill="white" />
                  Alamat Utama
                </div>
              )}

              <div className="flex justify-between items-start">
                <div>
                  <h4 className="m-0 mb-1 text-[1.1rem] text-[var(--ink)]">{address.recipientName}</h4>
                  <p className="m-0 text-[0.9rem] text-[var(--ink-soft)]">{address.phone}</p>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(address)}
                    className="bg-transparent border border-[var(--line)] rounded-lg p-2 cursor-pointer text-[var(--ink)] flex items-center justify-center hover:bg-[var(--surface)] transition-colors"
                    title="Edit Alamat"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(address.id)}
                    className="bg-transparent border border-[var(--line)] rounded-lg p-2 cursor-pointer text-[#dc2626] flex items-center justify-center hover:bg-[#fff5f5] hover:border-[#ffcdcd] transition-colors"
                    title="Hapus Alamat"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div>
                <p className="m-0 mb-1 text-[0.95rem] leading-[1.5]">
                  {address.address}
                </p>
                <p className="m-0 text-[0.9rem] text-[var(--ink-soft)]">
                  {address.district ? `${address.district}, ` : ''}{address.city}, {address.province} {address.postalCode}
                </p>
              </div>

              {!address.isPrimary && (
                <div className="border-t border-dashed border-[var(--line)] pt-4 mt-1">
                  <button 
                    onClick={() => setPrimaryAddress(address.id)}
                    className="bg-transparent border-none p-0 text-[var(--accent-strong)] font-semibold text-[0.9rem] cursor-pointer hover:underline"
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
