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
    <div className="fixed inset-0 bg-[#1f2a22]/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-5">
      <div className="bg-[var(--surface)] rounded-3xl w-full max-w-[500px] max-h-[90vh] flex flex-col shadow-[var(--shadow-strong)] animate-[fadeUp_0.3s_ease-out_forwards]">
        <div className="px-8 py-6 border-b border-[var(--line)] flex justify-between items-center">
          <h2 className="m-0 text-xl text-[var(--ink)]">
            Pilih Lokasi Pengiriman
          </h2>
          <button 
            onClick={onClose} 
            className="bg-transparent border-none cursor-pointer text-[var(--ink-soft)] p-2 rounded-full flex items-center justify-center hover:bg-[var(--surface-muted)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-8 py-6 overflow-y-auto">
          <div 
            onClick={() => {
              onSelectAddress(null)
              onClose()
            }}
            className={`p-4 rounded-xl border cursor-pointer flex items-center gap-4 mb-6 transition-all ${
              selectedAddressId === null 
                ? 'bg-[var(--accent-soft)] border-[var(--accent-strong)]' 
                : 'bg-transparent border-[var(--line)] hover:bg-[var(--surface-muted)]'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-[var(--surface-muted)] flex items-center justify-center">
              <Search size={20} color="var(--ink)" />
            </div>
            <div className="flex-1">
              <h4 className="m-0 mb-1 text-base text-[var(--ink)]">Gunakan Lokasi Saat Ini</h4>
              <p className="m-0 text-[0.85rem] text-[var(--ink-soft)]">Deteksi lokasi dari perangkat Anda</p>
            </div>
            {selectedAddressId === null && <Check size={20} color="var(--accent-strong)" />}
          </div>

          <h3 className="text-[1.05rem] m-0 mb-4 text-[var(--ink)]">Alamat Tersimpan</h3>
          
          {addresses.length === 0 ? (
            <div className="text-center py-8 text-[var(--ink-soft)] text-[0.9rem]">
              Anda belum menyimpan alamat. <br/> Tambahkan alamat di halaman Profil.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {addresses.map(address => {
                const isSelected = selectedAddressId === address.id
                return (
                  <div 
                    key={address.id}
                    onClick={() => {
                      onSelectAddress(address.id)
                      onClose()
                    }}
                    className={`p-4 rounded-xl border cursor-pointer flex items-start gap-4 transition-all ${
                      isSelected 
                        ? 'bg-[var(--accent-soft)] border-[var(--accent-strong)]' 
                        : 'bg-transparent border-[var(--line)] hover:bg-[var(--surface-muted)]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full shrink-0 bg-[var(--surface)] flex items-center justify-center border border-[var(--line)]">
                      <MapPin size={20} color={isSelected ? "var(--accent-strong)" : "var(--ink-soft)"} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="m-0 text-base text-[var(--ink)]">{address.recipientName}</h4>
                        {address.isPrimary && (
                          <span className="text-[0.7rem] px-1.5 py-0.5 rounded bg-[var(--ink)] text-white font-semibold">Utama</span>
                        )}
                      </div>
                      <p className="m-0 mb-1 text-[0.85rem] text-[var(--ink)]">{address.phone}</p>
                      <p className="m-0 text-[0.85rem] text-[var(--ink-soft)] line-clamp-2">
                        {address.address}, {address.city}, {address.province}
                      </p>
                    </div>
                    {isSelected && <Check size={20} color="var(--accent-strong)" className="shrink-0 mt-2.5" />}
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
