import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { getAllProducts, adminDeleteProduct } from '../../api/product.api'
import { Navbar } from '../../components/common/Navbar'
import { HomeFooter } from '../../components/home/HomeFooter'
import ProductFormModal from '../../components/admin/ProductFormModal'
import { BRAND, navLinks, footerSections } from '../../data/home/homeData'
import type { Product } from '../../types/product'

export default function AdminProductPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isAdminRole = user?.role === 'SUPER_ADMIN' || user?.role === 'STORE_ADMIN'

  if (!isAdminRole) { navigate('/'); return null }

  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Product | null>(null)
  const [showModal, setShowModal] = useState(false)

  const load = () => {
    setLoading(true)
    getAllProducts({ limit: 100 })
      .then(res => { setProducts(res.products); setTotal(res.total) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setShowModal(true) }
  const openEdit = (p: Product) => { setEditing(p); setShowModal(true) }

  const handleDelete = async (p: Product) => {
    if (!confirm(`Hapus produk "${p.name}"?`)) return
    try { await adminDeleteProduct(p.id); load() }
    catch (e: any) { alert(e?.response?.data?.error ?? 'Gagal menghapus produk') }
  }

  const handleSaved = () => { setShowModal(false); load() }

  return (
    <div className="page">
      <Navbar brandName={BRAND.name} links={navLinks} />
      <main className="page-main">
        <section className="section">
          <div className="shell">
            <div className="section-head">
              <div>
                <p className="section-kicker">Admin</p>
                <h2 className="section-title">Manajemen Produk</h2>
                <p style={{ color: 'var(--ink-soft)', marginTop: '4px' }}>{total} produk terdaftar</p>
              </div>
              {isSuperAdmin && <button className="button primary" onClick={openCreate}>+ Tambah Produk</button>}
            </div>

            {loading && <p style={{ marginTop: '24px' }}>Memuat produk...</p>}

            {!loading && (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--line)' }}>
                    <th style={{ textAlign: 'left', padding: '10px 8px' }}>ID</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px' }}>Nama</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px' }}>Kategori</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px' }}>Harga</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px' }}>Foto</th>
                    {isSuperAdmin && <th style={{ textAlign: 'left', padding: '10px 8px' }}>Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={{ padding: '10px 8px' }}>{p.id}</td>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>{p.name}</td>
                      <td style={{ padding: '10px 8px' }}>{p.category.icon} {p.category.name}</td>
                      <td style={{ padding: '10px 8px' }}>Rp {p.basePrice.toLocaleString('id-ID')}</td>
                      <td style={{ padding: '10px 8px', color: 'var(--ink-soft)' }}>{p.images.length} foto</td>
                      {isSuperAdmin && (
                        <td style={{ padding: '10px 8px' }}>
                          <button className="button ghost" onClick={() => openEdit(p)} style={{ marginRight: '8px' }}>Edit</button>
                          <button className="button ghost" style={{ color: '#e53e3e' }} onClick={() => handleDelete(p)}>Hapus</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
      <HomeFooter brandName={BRAND.name} sections={footerSections} />

      {showModal && (
        <ProductFormModal
          editing={editing}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
