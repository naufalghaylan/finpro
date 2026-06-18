import React, { useState, useRef, useEffect } from 'react'
import { useProfileStore } from '../../store/profileStore'
import { useAuthStore } from '../../store/authStore'
import api from '../../api/axios'
import { Eye, EyeOff } from 'lucide-react'
import { z } from 'zod'

const profileSchema = z.object({
  name: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
  phone: z.string().optional().refine(val => !val || /^[0-9]{10,15}$/.test(val), {
    message: 'Nomor telepon harus 10-15 angka'
  }),
  newPassword: z.string().optional(),
  currentPassword: z.string().optional(),
}).refine(data => {
  if (data.newPassword && !data.currentPassword) return false;
  return true;
}, {
  message: 'Password saat ini harus diisi jika ingin mengubah password',
  path: ['currentPassword'],
}).refine(data => {
  if (data.newPassword && data.newPassword.length < 6) return false;
  return true;
}, {
  message: 'Password baru minimal 6 karakter',
  path: ['newPassword'],
});

type ProfileErrors = Partial<Record<'name' | 'phone' | 'newPassword' | 'currentPassword', string>>;

export const ProfileForm = () => {
  const { profile, updateProfile, isUpdating, error } = useProfileStore()
  const { checkAuth, logout } = useAuthStore()
  const [successMsg, setSuccessMsg] = useState('')
  const [localError, setLocalError] = useState('')
  const [formErrors, setFormErrors] = useState<ProfileErrors>({})
  const [resetMsg, setResetMsg] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        name: profile.name || '',
        phone: profile.phone || '',
      }))
      setPreviewImage(profile.profilePicture || null)
    }
  }, [profile])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setLocalError('')
    if (file) {
      if (file.size > 1024 * 1024) {
        setLocalError('Ukuran file maksimal 1MB.')
        return
      }
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMsg('')
    setLocalError('')
    setFormErrors({})

    const result = profileSchema.safeParse(formData)
    if (!result.success) {
      const errors: ProfileErrors = {}
      result.error.issues.forEach((issue: z.ZodIssue) => {
        if (issue.path[0]) errors[issue.path[0] as keyof ProfileErrors] = issue.message
      })
      setFormErrors(errors)
      return
    }

    const data = new FormData()
    if (formData.name !== profile?.name) data.append('name', formData.name)
    if (formData.phone !== profile?.phone) data.append('phone', formData.phone)
    if (formData.newPassword) {
      data.append('currentPassword', formData.currentPassword)
      data.append('newPassword', formData.newPassword)
    }
    if (selectedFile) {
      data.append('profilePicture', selectedFile)
    }

    try {
      await updateProfile(data)
      
      if (formData.newPassword) {
        setSuccessMsg('Password berhasil diperbarui. Mengalihkan ke halaman login...')
        setTimeout(() => {
          logout()
        }, 2500)
        return
      }

      setSuccessMsg('Profil berhasil diperbarui. Halaman akan dimuat ulang...')
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '' }))
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      
      // Update global auth store as well so the navbar updates
      checkAuth()

      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      // Error is handled in the store
    }
  }

  const handleResetPassword = async () => {
    if (!profile?.email) return
    setIsResetting(true)
    setResetMsg('')
    setLocalError('')
    try {
      await api.post('/auth/forgot-password', { email: profile.email })
      setResetMsg('Link reset password telah dikirim ke email Anda. Mengalihkan ke halaman login...')
      setTimeout(() => {
        logout()
      }, 3000)
    } catch (err: any) {
      setLocalError(err.response?.data?.message || 'Gagal mengirim link reset password.')
      setIsResetting(false)
    }
  }

  return (
    <div className="hero-card" style={{ padding: '32px' }}>
      <h3 className="section-title" style={{ fontSize: '1.6rem', marginBottom: '8px' }}>Detail Profil</h3>
      <p className="section-body" style={{ marginBottom: '24px' }}>Perbarui informasi pribadi dan keamanan akun Anda.</p>
      
      {(error || localError) && (
        <div className="location-error" style={{ marginBottom: '20px', padding: '12px', background: '#fdf2f2', borderRadius: '12px' }}>
          {error || localError}
        </div>
      )}
      
      {successMsg && (
        <div style={{ marginBottom: '20px', padding: '12px', background: '#f2fcf5', color: '#2b7a4b', border: '1px solid #c6f0d3', borderRadius: '12px', fontSize: '0.9rem' }}>
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '10px' }}>
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', 
            background: 'var(--surface-muted)', border: '1px solid var(--line)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {previewImage ? (
              <img src={previewImage} alt="Profile preview" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '2rem', color: 'var(--ink-soft)' }}>
                {profile?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div>
            <label htmlFor="profilePicture" className="button ghost" style={{ display: 'inline-block', cursor: 'pointer', padding: '8px 14px', fontSize: '0.9rem' }}>
              Ubah Foto
            </label>
            <input 
              type="file" 
              id="profilePicture" 
              ref={fileInputRef}
              accept=".jpg,.jpeg,.png,.gif"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>Maks. 1MB (JPG, PNG, GIF)</p>
          </div>
        </div>

        <div className="input-group">
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem' }}>Nama Lengkap</label>
          <input 
            type="text" 
            name="name" 
            value={formData.name} 
            onChange={e => {
              handleChange(e)
              if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }))
            }}
            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: formErrors.name ? '1px solid #dc2626' : '1px solid var(--line)', background: 'var(--surface)' }} 
          />
          {formErrors.name && <span style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{formErrors.name}</span>}
        </div>

        <div className="input-group">
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem' }}>Nomor Telepon</label>
          <input 
            type="tel" 
            name="phone" 
            value={formData.phone} 
            onChange={e => {
              handleChange(e)
              if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: '' }))
            }}
            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: formErrors.phone ? '1px solid #dc2626' : '1px solid var(--line)', background: 'var(--surface)' }} 
          />
          {formErrors.phone && <span style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{formErrors.phone}</span>}
        </div>
        
        <div style={{ height: '1px', background: 'var(--line)', margin: '10px 0' }}></div>
        
        <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Ubah Password</h4>

        <div className="input-group">
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem' }}>Password Saat Ini</label>
          <div style={{ position: 'relative' }}>
            <input 
              type={showCurrentPassword ? "text" : "password"} 
              name="currentPassword" 
              value={formData.currentPassword} 
              onChange={e => {
                handleChange(e)
                if (formErrors.currentPassword) setFormErrors(prev => ({ ...prev, currentPassword: '' }))
              }}
              placeholder="Masukkan jika ingin mengubah password"
              style={{ width: '100%', padding: '12px 48px 12px 16px', borderRadius: '12px', border: formErrors.currentPassword ? '1px solid #dc2626' : '1px solid var(--line)', background: 'var(--surface)' }} 
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
              aria-label={showCurrentPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {formErrors.currentPassword && <span style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{formErrors.currentPassword}</span>}
        </div>

        <div className="input-group">
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem' }}>Password Baru</label>
          <div style={{ position: 'relative' }}>
            <input 
              type={showNewPassword ? "text" : "password"} 
              name="newPassword" 
              value={formData.newPassword} 
              onChange={e => {
                handleChange(e)
                if (formErrors.newPassword) setFormErrors(prev => ({ ...prev, newPassword: '' }))
              }}
              placeholder="Minimal 6 karakter"
              style={{ width: '100%', padding: '12px 48px 12px 16px', borderRadius: '12px', border: formErrors.newPassword ? '1px solid #dc2626' : '1px solid var(--line)', background: 'var(--surface)' }} 
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
              aria-label={showNewPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {formErrors.newPassword && <span style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{formErrors.newPassword}</span>}
        </div>

        <div style={{ fontSize: '0.9rem', color: 'var(--ink-soft)' }}>
          Lupa password saat ini?{' '}
          <button 
            type="button" 
            onClick={handleResetPassword} 
            disabled={isResetting}
            style={{ 
              background: 'none', border: 'none', padding: 0, 
              color: 'var(--accent-strong)', fontWeight: 600, 
              cursor: 'pointer', textDecoration: 'underline' 
            }}
          >
            {isResetting ? 'Mengirim...' : 'Kirim link reset password'}
          </button>
        </div>
        {resetMsg && (
          <div style={{ padding: '10px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '8px', fontSize: '0.85rem', marginTop: '-10px' }}>
            {resetMsg}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button type="submit" className="button primary" disabled={isUpdating}>
            {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  )
}
