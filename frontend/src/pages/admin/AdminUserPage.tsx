import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { adminListUsers, adminDeleteUser } from '../../api/admin.api'
import type { AdminUser } from '../../api/admin.api'
import { Navbar } from '../../components/common/Navbar'
import { HomeFooter } from '../../components/home/HomeFooter'
import UserFormModal from '../../components/admin/UserFormModal'
import { BRAND, navLinks, footerSections } from '../../data/home/homeData'

const th = { textAlign: 'left' as const, padding: '10px 8px' }
const td = { padding: '10px 8px' }
const roleBadge = (role: string): CSSProperties => ({
  padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600,
  background: role === 'SUPER_ADMIN' ? '#e9d8fd' : role === 'STORE_ADMIN' ? '#bee3f8' : '#e2e8f0',
  color: role === 'SUPER_ADMIN' ? '#553c9a' : role === 'STORE_ADMIN' ? '#2c5282' : '#4a5568',
})

export default function AdminUserPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [showModal, setShowModal] = useState(false)

  if (user?.role !== 'SUPER_ADMIN') { navigate('/'); return null }

  const load = () => {
    setLoading(true)
    adminListUsers({ page, limit: 10, search, role: roleFilter || undefined, sortBy, order })
      .then(res => { setUsers(res.data); setTotal(res.total); setTotalPages(res.totalPages) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, search, roleFilter, sortBy, order])

  const handleDelete = async (u: AdminUser) => {
    if (!confirm(`Hapus user "${u.name}"? Tindakan ini tidak bisa dibatalkan.`)) return
    try { await adminDeleteUser(u.id); load() }
    catch (e: any) { alert(e?.response?.data?.message ?? 'Gagal menghapus user') }
  }

  const handleSortChange = (val: string) => {
    const [s, o] = val.split('-')
    setSortBy(s)
    setOrder(o as 'asc' | 'desc')
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
                <h2 className="section-title">Manajemen User</h2>
                <p style={{ color: 'var(--ink-soft)', marginTop: '4px' }}>{total} user terdaftar</p>
              </div>
              <button className="button primary" onClick={() => { setEditing(null); setShowModal(true) }}>
                + Tambah Store Admin
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
              <input placeholder="Cari nama / email / username..." value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                style={{ padding: '8px 12px', border: '1px solid var(--line)', borderRadius: '6px', minWidth: '220px' }} />
              <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
                style={{ padding: '8px 12px', border: '1px solid var(--line)', borderRadius: '6px' }}>
                <option value="">Semua Role</option>
                <option value="CUSTOMER">Customer</option>
                <option value="STORE_ADMIN">Store Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
              <select value={`${sortBy}-${order}`} onChange={e => handleSortChange(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid var(--line)', borderRadius: '6px' }}>
                <option value="createdAt-desc">Terbaru</option>
                <option value="createdAt-asc">Terlama</option>
                <option value="name-asc">Nama A-Z</option>
                <option value="name-desc">Nama Z-A</option>
              </select>
            </div>

            {loading && <p style={{ marginTop: '24px' }}>Memuat data...</p>}

            {!loading && (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--line)' }}>
                    <th style={th}>ID</th><th style={th}>Nama</th><th style={th}>Email</th>
                    <th style={th}>Role</th><th style={th}>Verified</th><th style={th}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={td}>{u.id}</td>
                      <td style={{ ...td, fontWeight: 600 }}>{u.name}</td>
                      <td style={td}>{u.email}</td>
                      <td style={td}><span style={roleBadge(u.role)}>{u.role}</span></td>
                      <td style={td}>{u.emailVerified ? '✓' : '✗'}</td>
                      <td style={td}>
                        {u.role !== 'SUPER_ADMIN' && (
                          <>
                            <button className="button ghost" style={{ marginRight: '8px' }}
                              onClick={() => { setEditing(u); setShowModal(true) }}>Edit</button>
                            <button className="button ghost" style={{ color: '#e53e3e' }}
                              onClick={() => handleDelete(u)}>Hapus</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', alignItems: 'center' }}>
                <button className="button ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹ Prev</button>
                <span style={{ color: 'var(--ink-soft)' }}>Halaman {page} / {totalPages}</span>
                <button className="button ghost" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next ›</button>
              </div>
            )}
          </div>
        </section>
      </main>
      <HomeFooter brandName={BRAND.name} sections={footerSections} />
      {showModal && <UserFormModal editing={editing} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load() }} />}
    </div>
  )
}
