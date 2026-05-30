import { useState, useEffect } from 'react'
import { useCategories } from '../../hooks/useCategories'
import { adminCreateProduct, adminUpdateProduct, adminUploadProductImage, adminDeleteProductImage } from '../../api/product.api'
import type { Product } from '../../types/product'

type Props = {
  editing: Product | null
  onClose: () => void
  onSaved: () => void
}

const EMPTY = { name: '', description: '', categoryId: 0, basePrice: 0, weight: 0 }
const SERVER = 'http://localhost:3000'

export default function ProductFormModal({ editing, onClose, onSaved }: Props) {
  const { categories } = useCategories()
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState(editing?.images ?? [])

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

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Nama produk wajib diisi'); return }
    if (!form.categoryId) { setError('Kategori wajib dipilih'); return }
    if (!form.basePrice) { setError('Harga wajib diisi'); return }
    setSaving(true); setError(null)
    try {
      if (editing) await adminUpdateProduct(editing.id, form)
      else await adminCreateProduct(form)
      onSaved()
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Terjadi kesalahan')
    } finally { setSaving(false) }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editing) return
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

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '24px' }}>
      <div style={{ background: 'white', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '520px' }}>
        <h3 style={{ marginBottom: '20px' }}>{editing ? 'Edit Produk' : 'Tambah Produk'}</h3>
        {error && <p style={{ color: '#e53e3e', marginBottom: '12px', fontSize: '0.9rem' }}>{error}</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input placeholder="Nama produk *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ padding: '10px 14px', border: '1px solid var(--line)', borderRadius: '8px', fontSize: '1rem' }} />
          <textarea placeholder="Deskripsi (opsional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ padding: '10px 14px', border: '1px solid var(--line)', borderRadius: '8px', fontSize: '1rem', resize: 'vertical' }} />
          <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: parseInt(e.target.value) }))} style={{ padding: '10px 14px', border: '1px solid var(--line)', borderRadius: '8px', fontSize: '1rem' }}>
            <option value={0}>Pilih kategori *</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
          </select>
          <input type="number" placeholder="Harga dasar (Rp) *" value={form.basePrice || ''} onChange={e => setForm(f => ({ ...f, basePrice: parseFloat(e.target.value) || 0 }))} style={{ padding: '10px 14px', border: '1px solid var(--line)', borderRadius: '8px', fontSize: '1rem' }} />
          <input type="number" placeholder="Berat (gram)" value={form.weight || ''} onChange={e => setForm(f => ({ ...f, weight: parseFloat(e.target.value) || 0 }))} style={{ padding: '10px 14px', border: '1px solid var(--line)', borderRadius: '8px', fontSize: '1rem' }} />
        </div>

        {editing && (
          <div style={{ marginTop: '20px' }}>
            <p style={{ fontWeight: 600, marginBottom: '10px' }}>Foto Produk</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
              {images.map(img => (
                <div key={img.id} style={{ position: 'relative' }}>
                  <img src={`${SERVER}${img.imageUrl}`} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--line)' }} />
                  <button onClick={() => handleDeleteImage(img.id)} style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px' }}>×</button>
                </div>
              ))}
            </div>
            <label style={{ cursor: 'pointer' }}>
              <span className="button ghost" style={{ fontSize: '0.9rem' }}>{uploading ? 'Mengupload...' : '+ Upload Foto'}</span>
              <input type="file" accept=".jpg,.jpeg,.png,.gif" onChange={handleUpload} disabled={uploading} style={{ display: 'none' }} />
            </label>
            <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', marginTop: '6px' }}>Maks 1MB · .jpg .jpeg .png .gif</p>
          </div>
        )}
        {!editing && <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--ink-soft)' }}>Foto dapat ditambahkan setelah produk dibuat (klik Edit).</p>}

        <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <button className="button ghost" onClick={onClose}>Batal</button>
          <button className="button primary" onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </div>
      </div>
    </div>
  )
}
