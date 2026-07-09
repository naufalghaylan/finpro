import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useCategories } from '../../hooks/useCategories'
import { adminCreateProduct, adminUpdateProduct, adminUploadProductImage, adminDeleteProductImage } from '../../api/product.api'
import { getImageUrl } from '../../utils/image'
import type { Product } from '../../types/product'

type Props = {
  editing: Product | null
  onClose: () => void
  onSaved: () => void
}

const EMPTY = { name: '', description: '', categoryId: 0, basePrice: 0, weight: 0 }

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.gif']
const MAX_SIZE = 1 * 1024 * 1024 // 1MB

// Validasi sisi klien, mencerminkan aturan multer di backend.
const validateFile = (file: File): string | null => {
  const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '')
  if (!ALLOWED_EXT.includes(ext)) return 'Ekstensi tidak diizinkan. Gunakan .jpg, .jpeg, .png, atau .gif'
  if (file.size > MAX_SIZE) return 'Ukuran file maksimal 1MB'
  return null
}

type PendingImage = { file: File; preview: string }

export default function ProductFormModal({ editing, onClose, onSaved }: Props) {
  const { categories } = useCategories()
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState(editing?.images ?? [])
  // Foto yang di-stage saat membuat produk baru (belum punya id, di-upload setelah create).
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const pendingRef = useRef<PendingImage[]>([])

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        description: editing.description ?? '',
        categoryId: editing.category.id,
        basePrice: editing.basePrice,
        weight: editing.weight ?? 0,
      })
      setImages(editing.images)
    } else {
      setForm(EMPTY)
      setImages([])
    }
  }, [editing])

  // Selalu simpan referensi terbaru agar cleanup unmount bisa membebaskan object URL.
  useEffect(() => { pendingRef.current = pendingImages }, [pendingImages])
  useEffect(() => () => { pendingRef.current.forEach(p => URL.revokeObjectURL(p.preview)) }, [])

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Nama produk wajib diisi'); return }
    if (!form.categoryId) { setError('Kategori wajib dipilih'); return }
    if (!form.basePrice) { setError('Harga wajib diisi'); return }
    setSaving(true); setError(null)
    try {
      if (editing) {
        await adminUpdateProduct(editing.id, form)
      } else {
        const created = await adminCreateProduct(form)
        // Produk sudah dibuat → upload foto yang di-stage satu per satu.
        const failed: string[] = []
        for (const item of pendingImages) {
          try {
            await adminUploadProductImage(created.id, item.file)
          } catch {
            failed.push(item.file.name)
          }
        }
        if (failed.length) {
          alert(`Produk dibuat, tetapi sebagian foto gagal diupload: ${failed.join(', ')}`)
        }
      }
      onSaved()
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Terjadi kesalahan')
    } finally { setSaving(false) }
  }

  // Mode edit: upload langsung ke produk yang sudah ada.
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editing) return
    const err = validateFile(file)
    if (err) { setError(err); e.target.value = ''; return }
    setError(null)
    setUploading(true)
    try {
      const img = await adminUploadProductImage(editing.id, file)
      setImages(prev => [...prev, img])
    } catch (e: any) {
      alert(e?.response?.data?.error ?? 'Gagal upload foto')
    } finally { setUploading(false); e.target.value = '' }
  }

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Hapus foto ini?')) return
    try {
      await adminDeleteProductImage(imageId)
      setImages(prev => prev.filter(img => img.id !== imageId))
    } catch { alert('Gagal menghapus foto') }
  }

  // Mode create: stage foto secara lokal sampai produk dibuat.
  const handleStageFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const staged: PendingImage[] = []
    for (const file of files) {
      const err = validateFile(file)
      if (err) { setError(err); continue }
      staged.push({ file, preview: URL.createObjectURL(file) })
    }
    if (staged.length) setError(null)
    setPendingImages(prev => [...prev, ...staged])
    e.target.value = ''
  }

  const handleRemovePending = (index: number) => {
    setPendingImages(prev => {
      const target = prev[index]
      if (target) URL.revokeObjectURL(target.preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-admin-ink/40 backdrop-blur-sm animate-in fade-in duration-200 font-[family-name:var(--font-admin)]">
      <div className="bg-admin-surface rounded-2xl w-full max-w-lg p-8 shadow-xl border border-admin-line-soft max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-admin-ink mb-5">{editing ? 'Edit Produk' : 'Tambah Produk'}</h3>
        {error && <p className="text-sm font-medium text-admin-red bg-admin-red-soft px-4 py-3 rounded-xl mb-4">{error}</p>}

        <div className="flex flex-col gap-4">
          <input placeholder="Nama produk *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all" />
          <textarea placeholder="Deskripsi (opsional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all min-h-[80px]" />
          <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: parseInt(e.target.value) }))} className="w-full px-4 py-2.5 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all appearance-none cursor-pointer">
            <option value={0}>Pilih kategori *</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
          </select>
          <input type="number" placeholder="Harga dasar (Rp) *" value={form.basePrice || ''} onChange={e => setForm(f => ({ ...f, basePrice: parseFloat(e.target.value) || 0 }))} className="w-full px-4 py-2.5 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all" />
          <input type="number" placeholder="Berat (gram)" value={form.weight || ''} onChange={e => setForm(f => ({ ...f, weight: parseFloat(e.target.value) || 0 }))} className="w-full px-4 py-2.5 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all" />
        </div>

        <div className="mt-6 border-t border-admin-line-soft pt-5">
          <p className="font-semibold text-admin-ink text-sm mb-3">Foto Produk</p>
          <div className="flex flex-wrap gap-3 mb-4">
            {editing
              ? images.map(img => (
                  <div key={img.id} className="relative group">
                    <img src={getImageUrl(img.imageUrl)} alt="" className="w-20 h-20 object-cover rounded-xl border border-admin-line-soft" />
                    <button onClick={() => handleDeleteImage(img.id)} className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center bg-admin-red text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border-none cursor-pointer">×</button>
                  </div>
                ))
              : pendingImages.map((item, index) => (
                  <div key={item.preview} className="relative group">
                    <img src={item.preview} alt="" className="w-20 h-20 object-cover rounded-xl border border-admin-line-soft" />
                    <button onClick={() => handleRemovePending(index)} className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center bg-admin-red text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border-none cursor-pointer">×</button>
                  </div>
                ))}
          </div>
          <label className="cursor-pointer inline-block">
            <span className="px-4 py-2 rounded-xl text-sm font-medium text-admin-ink-soft bg-admin-surface border border-admin-line hover:bg-admin-line-soft transition-all">{uploading ? 'Mengupload...' : '+ Upload Foto'}</span>
            <input type="file" accept=".jpg,.jpeg,.png,.gif" multiple={!editing} onChange={editing ? handleUpload : handleStageFiles} disabled={uploading} className="hidden" />
          </label>
          <p className="text-xs text-admin-ink-muted mt-2">.jpg .jpeg .png .gif · maksimal 3 foto</p>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button className="px-5 py-2.5 rounded-xl text-sm font-medium text-admin-ink-soft bg-admin-surface border border-admin-line hover:bg-admin-line-soft hover:text-admin-ink transition-all cursor-pointer" onClick={onClose}>Batal</button>
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-admin-accent hover:bg-admin-accent-strong transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed shadow-sm" onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
