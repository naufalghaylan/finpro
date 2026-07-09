import { useEffect, useState } from 'react'
import { useAddressStore } from '../../store/addressStore'
import { MapPin, Plus, Star, Edit2, Trash2, AlertTriangle } from 'lucide-react'
import { AddressFormModal } from './AddressFormModal'
import type { UserAddress } from '../../types/address'
import ErrorPage from '../../pages/error/ErrorPage'
import { createPortal } from 'react-dom'

export const AddressManagement = () => {
  const { addresses, fetchAddresses, deleteAddress, setPrimaryAddress, isLoading, error} = useAddressStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

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

  const handleDelete = (id: number) => {
    setDeleteConfirmId(id)
  }

  const confirmDelete = async () => {
    if (deleteConfirmId !== null) {
      await deleteAddress(deleteConfirmId)
      setDeleteConfirmId(null)
    }
  }

  const cancelDelete = () => {
    setDeleteConfirmId(null)
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

      {deleteConfirmId !== null && createPortal(
        <div className="fixed inset-0 bg-[#1f2a2266] backdrop-blur-[4px] flex items-center justify-center z-[1000] p-4">
          <div className="bg-[var(--surface)] w-full max-w-[400px] rounded-[24px] shadow-[var(--shadow-strong)] animate-[fadeUp_0.3s_ease-out_forwards] p-6 text-center">
            <div className="w-16 h-16 bg-[#fee2e2] text-[#dc2626] rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="m-0 mb-2 text-[1.25rem] text-[var(--ink)] font-semibold">Hapus Alamat?</h3>
            <p className="m-0 mb-6 text-[var(--ink-soft)] text-[0.95rem] leading-[1.5]">
              Apakah Anda yakin ingin menghapus alamat ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={cancelDelete}
                className="px-6 py-2.5 rounded-[30px] border border-[var(--line)] bg-transparent cursor-pointer font-medium text-[var(--ink)] hover:bg-[var(--surface-muted)] transition-colors flex-1"
              >
                Batal
              </button>
              <button 
                onClick={confirmDelete}
                className="px-6 py-2.5 rounded-[30px] border-none bg-[#dc2626] text-white cursor-pointer font-medium hover:bg-[#b91c1c] hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(220,38,38,0.25)] transition-all flex-1"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
