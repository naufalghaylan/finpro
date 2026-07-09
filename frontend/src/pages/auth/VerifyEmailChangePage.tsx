import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useProfileStore } from '../../store/profileStore'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

const VerifyEmailChangePage = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const { verifyEmailChange } = useProfileStore()
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const hasAttempted = useRef(false)

  useEffect(() => {
    if (!token) {
      Promise.resolve().then(() => {
        setStatus('error')
        setErrorMessage('Token verifikasi tidak ditemukan.')
      })
      return
    }

    if (hasAttempted.current) return
    hasAttempted.current = true

    const verifyToken = async () => {
      try {
        await verifyEmailChange(token)
        Promise.resolve().then(() => setStatus('success'))
      } catch (err: unknown) {
        Promise.resolve().then(() => {
          setStatus('error')
          if (typeof err === 'object' && err !== null && 'response' in err) {
            setErrorMessage((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Gagal memverifikasi email.')
          } else {
            setErrorMessage('Gagal memverifikasi email.')
          }
        })
      }
    }

    verifyToken()
  }, [token, verifyEmailChange])

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '50vh', gap: '16px' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
        <p style={{ color: 'var(--ink-soft)', fontWeight: 500 }}>Memverifikasi...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--surface-sunken)] flex items-center justify-center p-4 font-[family-name:var(--font-sans)]">
      <div className="max-w-[440px] w-full bg-white rounded-2xl shadow-[var(--shadow-soft)] p-8 text-center border border-[var(--line)]">
        {status === 'success' ? (
          <>
            <CheckCircle className="mx-auto w-16 h-16 text-[#2b7a4b] mb-4" />
            <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-[#111] mb-2">
              Email Berhasil Diperbarui
            </h1>
            <p className="text-[var(--ink-soft)] mb-6 text-[0.95rem] leading-[1.6]">
              Alamat email Anda telah berhasil diverifikasi dan diperbarui. Anda sekarang dapat menggunakan email baru ini untuk login.
            </p>
            <button
              onClick={() => navigate('/profile')}
              className="w-full bg-[var(--accent)] text-white font-semibold py-3 px-4 rounded-xl hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(232,107,79,0.25)] transition-all cursor-pointer border-none"
            >
              Kembali ke Profil
            </button>
          </>
        ) : (
          <>
            <XCircle className="mx-auto w-16 h-16 text-[#dc2626] mb-4" />
            <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-[#111] mb-2">
              Verifikasi Gagal
            </h1>
            <p className="text-[var(--ink-soft)] mb-6 text-[0.95rem] leading-[1.6]">
              {errorMessage}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/profile')}
                className="w-full bg-[var(--surface)] text-[var(--ink)] font-semibold py-3 px-4 rounded-xl hover:bg-[var(--line)] transition-colors cursor-pointer border border-[var(--line)]"
              >
                Kembali ke Profil
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default VerifyEmailChangePage
