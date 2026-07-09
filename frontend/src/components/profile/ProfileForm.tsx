import React, { useState, useRef } from 'react'
import { useProfileStore } from '../../store/profileStore'
import { useAuthStore } from '../../store/authStore'
import api from '../../api/axios'
import { Eye, EyeOff } from 'lucide-react'
import { z } from 'zod'
import { useToast } from '../common/Toast'

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
  if (data.currentPassword && !data.newPassword) return false;
  return true;
}, {
  message: 'Password baru harus diisi jika Anda memasukkan password saat ini',
  path: ['newPassword'],
}).refine(data => {
  if (data.newPassword && data.newPassword.length < 6) return false;
  return true;
}, {
  message: 'Password baru minimal 6 karakter',
  path: ['newPassword'],
});

type ProfileErrors = Partial<Record<'name' | 'phone' | 'newPassword' | 'currentPassword', string>>;

export const ProfileForm = () => {
  const { showToast } = useToast()
  const { profile, updateProfile, isUpdating } = useProfileStore()
  const { checkAuth, logout } = useAuthStore()
  const [successMsg, setSuccessMsg] = useState('')
  const [localError, setLocalError] = useState('')
  const [formErrors, setFormErrors] = useState<ProfileErrors>({})
  const [resetMsg, setResetMsg] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    currentPassword: '',
    newPassword: '',
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(profile?.profilePicture || null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [prevProfile, setPrevProfile] = useState(profile)

  if (profile !== prevProfile) {
    setPrevProfile(profile)
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        name: profile.name || '',
        phone: profile.phone || '',
      }))
      setPreviewImage(profile.profilePicture || null)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setLocalError('')
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setLocalError('Format file tidak didukung. Harap upload file JPG, PNG, atau GIF.');
        return;
      }
      
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
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage = error.response?.data?.message || 'Gagal mengupdate profil';
      
      const lowerError = errorMessage.toLowerCase();
      if (lowerError.includes('current password') || lowerError.includes('password saat ini') || lowerError.includes('invalid current')) {
        setFormErrors(prev => ({ ...prev, currentPassword: errorMessage }));
      } else if (lowerError.includes('password') || lowerError.includes('sandi')) {
        setFormErrors(prev => ({ ...prev, newPassword: errorMessage }));
      } else {
        showToast(errorMessage, 'error');
      }
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
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast(error.response?.data?.message || 'Gagal mengubah password', 'error');
      setLocalError(error.response?.data?.message || 'Gagal mengirim link reset password.')
      setIsResetting(false)
    }
  }

  return (
    <div className="p-[24px] rounded-[20px] border border-[var(--line)] bg-white/85 shadow-[var(--shadow-soft)] flex flex-col gap-1.5">
      <h3 className="m-0 text-[#111] font-[family-name:var(--font-display)] font-normal tracking-normal text-[1.6rem] mb-1">Detail Profil</h3>
      <p className="m-0 text-[0.95rem] text-[var(--ink-soft)] leading-[1.6] mb-6">Perbarui informasi pribadi dan keamanan akun Anda.</p>
      
      {localError && (
        <div className="mb-5 p-3 bg-[#fdf2f2] rounded-xl text-[#dc2626]">
          {localError}
        </div>
      )}
      
      {successMsg && (
        <div className="mb-5 p-3 bg-[#f2fcf5] text-[#2b7a4b] border border-[#c6f0d3] rounded-xl text-[0.9rem]">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-5">
        <div className="flex items-center gap-5 mb-2.5">
          <div className="w-[80px] h-[80px] rounded-full overflow-hidden bg-[var(--surface-muted)] border border-[var(--line)] flex items-center justify-center">
            {previewImage ? (
              <img src={previewImage} alt="Profile preview" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl text-[var(--ink-soft)]">
                {profile?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div>
            <label htmlFor="profilePicture" className="inline-block cursor-pointer px-[14px] py-2 text-[0.9rem] rounded-xl font-medium bg-transparent border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--surface-muted)] transition-colors">
              Ubah Foto
            </label>
            <input 
              type="file" 
              id="profilePicture" 
              ref={fileInputRef}
              accept=".jpg,.jpeg,.png,.gif"
              className="hidden"
              onChange={handleFileChange}
            />
            <p className="m-0 mt-1.5 text-[0.8rem] text-[var(--ink-soft)]">Maks. 1MB (JPG, PNG, GIF)</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="block font-medium text-[0.9rem]">Nama Lengkap</label>
          <input 
            type="text" 
            name="name" 
            value={formData.name} 
            onChange={e => {
              handleChange(e)
              if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }))
            }}
            className={`w-full p-[12px_16px] rounded-xl border ${formErrors.name ? 'border-[#dc2626]' : 'border-[var(--line)]'} bg-[var(--surface)] focus:outline-none focus:border-[var(--accent)] transition-colors`}
          />
          {formErrors.name && <span className="text-[#dc2626] text-[0.8rem] mt-1 block">{formErrors.name}</span>}
        </div>

        <div className="flex flex-col gap-2">
          <label className="block font-medium text-[0.9rem]">Nomor Telepon</label>
          <input 
            type="tel" 
            name="phone" 
            value={formData.phone} 
            onChange={e => {
              handleChange(e)
              if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: '' }))
            }}
            className={`w-full p-[12px_16px] rounded-xl border ${formErrors.phone ? 'border-[#dc2626]' : 'border-[var(--line)]'} bg-[var(--surface)] focus:outline-none focus:border-[var(--accent)] transition-colors`}
          />
          {formErrors.phone && <span className="text-[#dc2626] text-[0.8rem] mt-1 block">{formErrors.phone}</span>}
        </div>
        
        <div className="h-px bg-[var(--line)] my-2.5"></div>
        
        <h4 className="m-0 text-[1.1rem] font-normal font-[family-name:var(--font-display)]">Ubah Password</h4>

        <div className="flex flex-col gap-2">
          <label className="block font-medium text-[0.9rem]">Password Saat Ini</label>
          <div className="relative">
            <input 
              type={showCurrentPassword ? "text" : "password"} 
              name="currentPassword" 
              value={formData.currentPassword} 
              onChange={e => {
                handleChange(e)
                if (formErrors.currentPassword) setFormErrors(prev => ({ ...prev, currentPassword: '' }))
              }}
              placeholder="Masukkan jika ingin mengubah password"
              className={`w-full p-[12px_48px_12px_16px] rounded-xl border ${formErrors.currentPassword ? 'border-[#dc2626]' : 'border-[var(--line)]'} bg-[var(--surface)] focus:outline-none focus:border-[var(--accent)] transition-colors`}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[var(--ink-soft)] flex items-center justify-center p-0"
              aria-label={showCurrentPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {formErrors.currentPassword && <span className="text-[#dc2626] text-[0.8rem] mt-1 block">{formErrors.currentPassword}</span>}
        </div>

        <div className="flex flex-col gap-2">
          <label className="block font-medium text-[0.9rem]">Password Baru</label>
          <div className="relative">
            <input 
              type={showNewPassword ? "text" : "password"} 
              name="newPassword" 
              value={formData.newPassword} 
              onChange={e => {
                handleChange(e)
                if (formErrors.newPassword) setFormErrors(prev => ({ ...prev, newPassword: '' }))
              }}
              placeholder="Minimal 6 karakter"
              className={`w-full p-[12px_48px_12px_16px] rounded-xl border ${formErrors.newPassword ? 'border-[#dc2626]' : 'border-[var(--line)]'} bg-[var(--surface)] focus:outline-none focus:border-[var(--accent)] transition-colors`}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[var(--ink-soft)] flex items-center justify-center p-0"
              aria-label={showNewPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {formErrors.newPassword && <span className="text-[#dc2626] text-[0.8rem] mt-1 block">{formErrors.newPassword}</span>}
        </div>

        <div className="text-[0.9rem] text-[var(--ink-soft)]">
          Lupa password saat ini?{' '}
          <button 
            type="button" 
            onClick={handleResetPassword} 
            disabled={isResetting}
            className="bg-transparent border-none p-0 text-[var(--accent-strong)] font-semibold cursor-pointer underline hover:text-[var(--accent)] disabled:opacity-50"
          >
            {isResetting ? 'Mengirim...' : 'Kirim link reset password'}
          </button>
        </div>
        {resetMsg && (
          <div className="p-2.5 bg-[#e8f5e9] text-[#2e7d32] rounded-lg text-[0.85rem] -mt-2.5">
            {resetMsg}
          </div>
        )}

        <div className="flex justify-end mt-2.5">
          <button type="submit" className="px-[18px] py-[10px] bg-[var(--accent)] text-white font-semibold rounded-full border-none cursor-pointer hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(232,107,79,0.25)] transition-all disabled:opacity-70 text-[0.95rem]" disabled={isUpdating}>
            {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  )
}
