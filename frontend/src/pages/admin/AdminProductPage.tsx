import { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { getAllProducts, adminDeleteProduct } from '../../api/product.api'
import ProductFormModal from '../../components/admin/ProductFormModal'
import type { Product } from '../../types/product'
import { Plus, Pencil, Trash2, ShoppingBag, Image, Loader2 } from 'lucide-react'
import ConfirmationModal from '../../components/modal/ConfirmationModal';

export default function AdminProductPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const isAdminRole = user?.role === 'SUPER_ADMIN' || user?.role === 'STORE_ADMIN'
  // Store admin hanya bisa melihat (read only); kelola produk khusus super admin.
  const canManage = user?.role === 'SUPER_ADMIN'

  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Product | null>(null)
  const [showModal, setShowModal] = useState(false)
  // Produk yang sedang dikonfirmasi untuk dihapus (null = modal tertutup).
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    setLoading(true)
    getAllProducts({ limit: 100 })
      .then(res => { setProducts(res.products); setTotal(res.total) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { 
    if (!isAdminRole) { navigate('/'); return; }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load() 
  }, [isAdminRole, navigate])

  if (!isAdminRole) return null;
  const openCreate = () => { setEditing(null); setShowModal(true) }
  const openEdit = (p: Product) => { setEditing(p); setShowModal(true) }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try { await adminDeleteProduct(deleteTarget.id); setDeleteTarget(null); load() }
    catch (err) { const e = err as AxiosError<{ error?: string }>; alert(e.response?.data?.error ?? 'Gagal menghapus produk') }
    finally { setDeleting(false) }
  }

  const handleSaved = () => { setShowModal(false); load() }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="admin-fade-in mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-bold text-admin-ink m-0">
            Katalog Produk
          </h3>
          <p className="text-sm text-admin-ink-muted mt-0.5 m-0">
            {loading ? 'Memuat...' : `${total} produk terdaftar`}
          </p>
        </div>
        {canManage && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-admin-accent text-white
                       text-sm font-semibold border-none cursor-pointer shadow-md font-[family-name:var(--font-admin)]
                       hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Tambah Produk
          </button>
        )}
      </div>

            {/* Table Card */}
            <div className="admin-fade-in rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm overflow-hidden font-[family-name:var(--font-admin)]"
                 style={{ animationDelay: '80ms' }}>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="w-8 h-8 text-admin-accent admin-spin" />
                  <p className="text-sm text-admin-ink-muted m-0">Memuat data produk...</p>
                </div>
              ) : (
                <div className="admin-table-wrap overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-admin-line-soft bg-admin-surface-2/40">
                        <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider w-12">ID</th>
                        <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Nama</th>
                        <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Kategori</th>
                        <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Harga</th>
                        <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Foto</th>
                        {canManage && (
                          <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider text-right">Aksi</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {products.length === 0 ? (
                        <tr>
                          <td colSpan={canManage ? 6 : 5} className="px-5 py-16 text-center text-admin-ink-muted">
                            <ShoppingBag className="w-10 h-10 mx-auto mb-3 text-admin-line" />
                            <p className="m-0 font-medium">Belum ada produk</p>
                          </td>
                        </tr>
                      ) : products.map(p => (
                        <tr key={p.id} className="admin-table-row border-b border-admin-line-soft/50 last:border-b-0">
                          <td className="px-5 py-4 text-admin-ink-muted text-xs font-mono">#{p.id}</td>
                          <td className="px-5 py-4 font-semibold text-admin-ink">{p.name}</td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1.5 text-sm text-admin-ink-soft">
                              {p.category.icon && (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-admin-surface-2 text-xs">
                                  {p.category.icon}
                                </span>
                              )}
                              {p.category.name}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-semibold text-admin-accent-strong">
                              Rp {p.basePrice.toLocaleString('id-ID')}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-admin-surface-2 text-admin-ink-soft">
                              <Image className="w-3 h-3" />
                              {p.images.length}
                            </span>
                          </td>
                          {canManage && (
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1 justify-end">
                                <button
                                  onClick={() => openEdit(p)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                             text-admin-ink-soft bg-transparent border border-admin-line-soft cursor-pointer
                                             hover:bg-admin-surface-2 hover:text-admin-ink transition-all duration-150"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(p)}
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
              )}
            </div>

      {showModal && (
        <ProductFormModal
          editing={editing}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}

      <ConfirmationModal
        open={deleteTarget !== null}
        title="Hapus Produk"
        message={deleteTarget ? `Hapus produk "${deleteTarget.name}"? Tindakan ini tidak bisa dibatalkan.` : ''}
        confirmLabel="Ya, hapus"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
