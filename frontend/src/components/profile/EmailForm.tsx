import React, { useState, useEffect } from 'react'
import { useProfileStore } from '../../store/profileStore'
import { z } from 'zod'

const emailSchema = z.object({
  email: z.string().min(1, 'Email tidak boleh kosong').email('Format email tidak valid'),
})

export const EmailForm = () => {
  const { profile, updateEmail, reverifyEmail, isUpdating } = useProfileStore()
  const [email, setEmail] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [localError, setLocalError] = useState('')
  const [emailError, setEmailError] = useState('')

  useEffect(() => {
    if (profile) {
      setEmail(profile.email || '')
    }
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMsg('')
    setLocalError('')
    setEmailError('')

    const result = emailSchema.safeParse({ email })
    if (!result.success) {
      setEmailError(result.error.issues[0]?.message || 'Email tidak valid')
      return
    }

    if (email === profile?.email) {
      setLocalError('Email masih sama dengan email saat ini.')
      return
    }

    try {
      await updateEmail(email)
      setSuccessMsg('Email berhasil diperbarui. Silakan cek inbox Anda untuk memverifikasi email baru.')
    } catch (err: any) {
      // Error handled by store, we can use global error or local
    }
  }

  const handleReverify = async () => {
    setSuccessMsg('')
    setLocalError('')
    try {
      await reverifyEmail()
      setSuccessMsg('Email verifikasi berhasil dikirim ulang. Silakan cek inbox Anda.')
    } catch (err: any) {
      // Error handled by store
    }
  }

  return (
    <div className="hero-card" style={{ padding: '32px' }}>
      <h3 className="section-title" style={{ fontSize: '1.6rem', marginBottom: '8px' }}>Alamat Email</h3>
      <p className="section-body" style={{ marginBottom: '24px' }}>
        Email ini digunakan untuk login dan menerima informasi penting.
      </p>

      {profile && !profile.emailVerified && (
        <div className="location-warning" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <strong>Email Belum Diverifikasi!</strong>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>Anda harus memverifikasi email Anda agar bisa menggunakan seluruh fitur aplikasi.</p>
          </div>
          <button 
            type="button" 
            className="button ghost" 
            onClick={handleReverify}
            disabled={isUpdating}
            style={{ width: 'fit-content', padding: '6px 12px', fontSize: '0.85rem', borderColor: '#f2c26b' }}
          >
            {isUpdating ? 'Mengirim...' : 'Kirim Ulang Verifikasi'}
          </button>
        </div>
      )}

      {localError && (
        <div className="location-error" style={{ marginBottom: '20px', padding: '12px', background: '#fdf2f2', borderRadius: '12px' }}>
          {localError}
        </div>
      )}

      {successMsg && (
        <div style={{ marginBottom: '20px', padding: '12px', background: '#f2fcf5', color: '#2b7a4b', border: '1px solid #c6f0d3', borderRadius: '12px', fontSize: '0.9rem' }}>
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
        <div className="input-group">
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem' }}>Email</label>
          <input 
            type="text" 
            value={email} 
            onChange={(e) => {
              setEmail(e.target.value)
              if (emailError) setEmailError('')
            }} 
            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: emailError ? '1px solid #dc2626' : '1px solid var(--line)', background: 'var(--surface)' }} 
          />
          {emailError && <span style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{emailError}</span>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="button primary" disabled={isUpdating || email === profile?.email}>
            {isUpdating ? 'Menyimpan...' : 'Perbarui Email'}
          </button>
        </div>
      </form>
    </div>
  )
}
