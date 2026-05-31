import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useCategories } from '../../hooks/useCategories'
import { adminCreateCategory, adminUpdateCategory, adminDeleteCategory } from '../../api/product.api'
import { Navbar } from '../../components/common/Navbar'
import { HomeFooter } from '../../components/home/HomeFooter'
import { BRAND, navLinks, footerSections } from '../../data/home/homeData'
import type { Category } from '../../types/product'

const EMPTY = { name: '', icon: '', description: '' }

export default function AdminCategoryPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isAdminRole = user?.role === 'SUPER_ADMIN' || user?.role === 'STORE_ADMIN'

  if (!isAdminRole) { navigate('/'); return null }

  const { categories, refetch } = useCategories()
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const openCreate = () => { setForm(EMPTY); setEditing(null); setError(null); setModal(true) }
  const openEdit = (cat: Category) => {
    setForm({ name: cat.name, icon: cat.icon ?? '', description: cat.description ?? '' })
    setEditing(cat); setError(null); setModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Nama kategori wajib diisi'); return }
    setSaving(true); setError(null)
    try {
      if (editing) await adminUpdateCategory(editing.id, form)
      else await adminCreateCategory(form)
      setModal(false); refetch()
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Terjadi kesalahan')
    } finally { setSaving(false) }
  }

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Hapus kategori "${cat.name}"?`)) return
    try { await adminDeleteCategory(cat.id); refetch() }
    catch (e: any) { alert(e?.response?.data?.error ?? 'Gagal menghapus') }
  }

  return (
    <div className="page">
      <Navbar brandName={BRAND.name} links={navLinks} />
      <main className="page-main">
        <section className="section">
          <div className="shell">
            <div className="section-head">
              <div>
                <p className="section-kicker">Admin</p>
                <h2 className="section-title">Manajemen Kategori</h2>
              </div>
              {isSuperAdmin && <button className="button primary" onClick={openCreate}>+ Tambah Kategori</button>}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--line)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 8px' }}>ID</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px' }}>Nama</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px' }}>Icon</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px' }}>Deskripsi</th>
                  {isSuperAdmin && <th style={{ textAlign: 'left', padding: '10px 8px' }}>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat.id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '10px 8px' }}>{cat.id}</td>
                    <td style={{ padding: '10px 8px', fontWeight: 600 }}>{cat.name}</td>
                    <td style={{ padding: '10px 8px' }}>{cat.icon ?? '-'}</td>
                    <td style={{ padding: '10px 8px', color: 'var(--ink-soft)' }}>{cat.description ?? '-'}</td>
                    {isSuperAdmin && (
                      <td style={{ padding: '10px 8px' }}>
                        <button className="button ghost" onClick={() => openEdit(cat)} style={{ marginRight: '8px' }}>Edit</button>
                        <button className="button ghost" style={{ color: '#e53e3e' }} onClick={() => handleDelete(cat)}>Hapus</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {modal && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                <div style={{ background: 'white', borderRadius: '12px', padding: '32px', minWidth: '400px', maxWidth: '90vw' }}>
                  <h3 style={{ marginBottom: '20px' }}>{editing ? 'Edit Kategori' : 'Tambah Kategori'}</h3>
                  {error && <p style={{ color: '#e53e3e', marginBottom: '12px', fontSize: '0.9rem' }}>{error}</p>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input placeholder="Nama kategori *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ padding: '10px 14px', border: '1px solid var(--line)', borderRadius: '8px', fontSize: '1rem' }} />
                    <input placeholder="Icon emoji (opsional, misal: 🥦)" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} style={{ padding: '10px 14px', border: '1px solid var(--line)', borderRadius: '8px', fontSize: '1rem' }} />
                    <input placeholder="Deskripsi (opsional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ padding: '10px 14px', border: '1px solid var(--line)', borderRadius: '8px', fontSize: '1rem' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                    <button className="button ghost" onClick={() => setModal(false)}>Batal</button>
                    <button className="button primary" onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <HomeFooter brandName={BRAND.name} sections={footerSections} />
    </div>
  )
}
