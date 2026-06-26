import React, { useState } from 'react'
import { useProfileStore } from '../../store/profileStore'
import { z } from 'zod'

const emailSchema = z.object({
  email: z.string().min(1, 'Email tidak boleh kosong').email('Format email tidak valid'),
})

export const EmailForm = () => {
  const { profile, updateEmail, reverifyEmail, isUpdating } = useProfileStore()
  const [email, setEmail] = useState(() => profile?.email || '')
  const [prevProfileEmail, setPrevProfileEmail] = useState(() => profile?.email || '')
  const [successMsg, setSuccessMsg] = useState('')
  const [localError, setLocalError] = useState('')
  const [emailError, setEmailError] = useState('')

  if (profile?.email !== prevProfileEmail) {
    setPrevProfileEmail(profile?.email || '')
    setEmail(profile?.email || '')
  }

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
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setLocalError(error.response?.data?.message || 'Gagal mengubah email.');
    }
  }

  const handleReverify = async () => {
    setSuccessMsg('')
    setLocalError('')
    try {
      await reverifyEmail()
      setSuccessMsg('Email verifikasi berhasil dikirim ulang. Silakan cek inbox Anda.')
    } catch {
      // Error handled by store
    }
  }

  return (
    <div className="p-[24px] rounded-[20px] border border-[var(--line)] bg-white/85 shadow-[var(--shadow-soft)] flex flex-col gap-1.5">
      <h3 className="m-0 text-[#111] font-[family-name:var(--font-display)] font-normal tracking-normal text-[1.6rem] mb-1">Alamat Email</h3>
      <p className="m-0 text-[0.95rem] text-[var(--ink-soft)] leading-[1.6] mb-6">
        Email ini digunakan untuk login dan menerima informasi penting.
      </p>

      {profile && !profile.emailVerified && (
        <div className="mb-5 flex flex-col gap-2.5 p-[14px_16px] bg-[#fff8eb] border border-[#f2c26b] rounded-xl text-[#9b660e]">
          <div>
            <strong className="text-[0.95rem]">Email Belum Diverifikasi!</strong>
            <p className="m-0 mt-1 text-[0.85rem] leading-[1.4]">Anda harus memverifikasi email Anda agar bisa menggunakan seluruh fitur aplikasi.</p>
          </div>
          <button 
            type="button" 
            onClick={handleReverify}
            disabled={isUpdating}
            className="w-fit mt-1 px-3 py-1.5 text-[0.85rem] font-medium bg-transparent border border-[#f2c26b] text-[#9b660e] rounded-lg cursor-pointer hover:bg-[#faebd2] transition-colors disabled:opacity-50"
          >
            {isUpdating ? 'Mengirim...' : 'Kirim Ulang Verifikasi'}
          </button>
        </div>
      )}

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
        <div className="flex flex-col gap-2">
          <label className="block font-medium text-[0.9rem]">Email</label>
          <input 
            type="text" 
            value={email} 
            onChange={(e) => {
              setEmail(e.target.value)
              if (emailError) setEmailError('')
            }} 
            className={`w-full p-[12px_16px] rounded-xl border ${emailError ? 'border-[#dc2626]' : 'border-[var(--line)]'} bg-[var(--surface)] focus:outline-none focus:border-[var(--accent)] transition-colors`}
          />
          {emailError && <span className="text-[#dc2626] text-[0.8rem] mt-1 block">{emailError}</span>}
        </div>

        <div className="flex justify-end mt-2">
          <button type="submit" className="px-[18px] py-[10px] bg-[var(--accent)] text-white font-semibold rounded-full border-none cursor-pointer hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(232,107,79,0.25)] transition-all disabled:opacity-70 text-[0.95rem]" disabled={isUpdating || email === profile?.email}>
            {isUpdating ? 'Menyimpan...' : 'Perbarui Email'}
          </button>
        </div>
      </form>
    </div>
  )
}
