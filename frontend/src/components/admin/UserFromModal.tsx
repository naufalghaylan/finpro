import { useState } from 'react'
import { adminCreateStoreAdmin, adminUpdateUser } from '../../api/admin.api'
import type { AdminUser } from '../../api/admin.api'

interface Props {
  editing: AdminUser | null
  onClose: () => void
  onSaved: () => void
}

const inputStyle = {
  width: '100%', padding: '8px 12px', border: '1px solid var(--line)',
  borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box' as const,
}

export default function UserFormModal({ editing, onClose, onSaved }: Props) {
  const isEdit = !!editing
  const [name, setName] = useState(editing?.name ?? '')
  const [username, setUsername] = useState(editing?.username ?? '')
  const [email, setEmail] = useState(editing?.email ?? '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isEdit) {
        await adminUpdateUser(editing!.id, { name, username, email })
      } else {
        await adminCreateStoreAdmin({ name, username, email, password })
      }
      onSaved()
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '440px' }}>
        <h3 style={{ marginBottom: '20px' }}>{isEdit ? 'Edit User' : 'Tambah Store Admin'}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label>Nama</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label>Username</label>
            <input style={inputStyle} value={username} onChange={e => setUsername(e.target.value)} required minLength={3} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label>Email</label>
            <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          {!isEdit && (
            <div style={{ marginBottom: '12px' }}>
              <label>Password</label>
              <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
          )}
          {error && <p style={{ color: '#e53e3e', marginBottom: '12px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" className="button ghost" onClick={onClose}>Batal</button>
            <button type="submit" className="button primary" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
