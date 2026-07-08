import { useState } from 'react'
import { AxiosError } from 'axios'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useCategories } from '../../hooks/useCategories'
import { adminCreateCategory, adminUpdateCategory, adminDeleteCategory } from '../../api/product.api'
import type { Category } from '../../types/product'
import { Plus, Pencil, Trash2, Layers, Loader2 } from 'lucide-react'

const EMPTY = { name: '', icon: '', description: '' }

export default function AdminCategoryPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isAdminRole = user?.role === 'SUPER_ADMIN' || user?.role === 'STORE_ADMIN'

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
    } catch (err) {
      const e = err as AxiosError<{ error?: string }>;
      setError(e.response?.data?.error ?? 'Terjadi kesalahan')
    } finally { setSaving(false) }
  }

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Hapus kategori "${cat.name}"?`)) return
    try { await adminDeleteCategory(cat.id); refetch() }
    catch (err) { const e = err as AxiosError<{ error?: string }>; alert(e.response?.data?.error ?? 'Gagal menghapus') }
  }

  if (!isAdminRole) { navigate('/'); return null }

  return (
    <div className="shell">
      {/* Header */}
            <div className="admin-fade-in mb-8">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-admin-accent-soft">
                    <Layers className="w-5 h-5 text-admin-accent-strong" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-admin-accent-strong mb-0 m-0">Admin</p>
                    <h2 className="font-admin-display text-2xl md:text-3xl font-bold text-admin-ink m-0">
                      Manajemen Kategori
                    </h2>
                  </div>
                </div>
                {isSuperAdmin && (
                  <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-admin-accent text-white
                               text-sm font-semibold border-none cursor-pointer shadow-md font-admin
                               hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Kategori
                  </button>
                )}
              </div>
              <p className="text-sm text-admin-ink-soft mt-2 m-0 font-admin">
                {categories.length} kategori terdaftar
              </p>
            </div>

            {/* Table Card */}
            <div className="admin-fade-in rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm overflow-hidden font-admin"
                 style={{ animationDelay: '80ms' }}>
              <div className="admin-table-wrap overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-admin-line-soft bg-admin-surface-2/40">
                      <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider w-12">ID</th>
                      <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Nama</th>
                      <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider w-16">Icon</th>
                      <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Deskripsi</th>
                      {isSuperAdmin && (
                        <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider text-right">Aksi</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan={isSuperAdmin ? 5 : 4} className="px-5 py-16 text-center text-admin-ink-muted">
                          <Layers className="w-10 h-10 mx-auto mb-3 text-admin-line" />
                          <p className="m-0 font-medium">Belum ada kategori</p>
                        </td>
                      </tr>
                    ) : categories.map(cat => (
                      <tr key={cat.id} className="admin-table-row border-b border-admin-line-soft/50 last:border-b-0">
                        <td className="px-5 py-4 text-admin-ink-muted text-xs font-mono">#{cat.id}</td>
                        <td className="px-5 py-4 font-semibold text-admin-ink">{cat.name}</td>
                        <td className="px-5 py-4">
                          {cat.icon ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-admin-surface-2 text-base">
                              {cat.icon}
                            </span>
                          ) : (
                            <span className="text-admin-ink-muted text-xs">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-admin-ink-soft text-sm max-w-xs truncate">{cat.description ?? '—'}</td>
                        {isSuperAdmin && (
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                onClick={() => openEdit(cat)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                           text-admin-ink-soft bg-transparent border border-admin-line-soft cursor-pointer
                                           hover:bg-admin-surface-2 hover:text-admin-ink transition-all duration-150"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(cat)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg
                                           text-admin-red bg-transparent border-none cursor-pointer
                                           hover:bg-admin-red-soft transition-all duration-150"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal */}
            {modal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center admin-backdrop-in"
                   style={{ background: 'rgba(31,42,34,0.45)', backdropFilter: 'blur(8px)' }}
                   onClick={() => setModal(false)}>
                <div className="admin-modal-in bg-admin-surface rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden border border-admin-line-soft"
                     onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-6 py-5 border-b border-admin-line-soft/50">
                    <h3 className="text-base font-bold text-admin-ink m-0">
                      {editing ? 'Edit Kategori' : 'Tambah Kategori'}
                    </h3>
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center text-admin-ink-muted bg-transparent border-none cursor-pointer hover:bg-admin-surface-2 transition-colors text-lg" onClick={() => setModal(false)}>×</button>
                  </div>

                  <div className="px-6 py-5 flex flex-col gap-4">
                    {error && (
                      <div className="px-4 py-3 rounded-xl bg-admin-red-soft text-admin-red text-sm font-medium">
                        {error}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">Nama Kategori *</label>
                      <input
                        placeholder="Masukkan nama kategori"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                                   focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">Icon Emoji (Opsional)</label>
                      <input
                        placeholder="Misal: 🥦"
                        value={form.icon}
                        onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                                   focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">Deskripsi (Opsional)</label>
                      <input
                        placeholder="Deskripsi singkat kategori"
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                                   focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 px-6 py-4 border-t border-admin-line-soft/50 bg-admin-surface-2/30">
                    <button onClick={() => setModal(false)}
                            className="px-4 py-2 rounded-xl text-sm font-medium text-admin-ink-soft bg-transparent border border-admin-line-soft cursor-pointer hover:bg-admin-surface-2 transition-all">
                      Batal
                    </button>
                    <button onClick={handleSave} disabled={saving}
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-admin-accent border-none cursor-pointer hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 admin-spin" />
                          Menyimpan...
                        </>
                      ) : 'Simpan'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
  )
}
