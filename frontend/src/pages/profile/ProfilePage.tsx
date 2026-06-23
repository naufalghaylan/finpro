import { useEffect, useState } from 'react'
import ErrorPage from '../error/ErrorPage'
import { Navbar } from '../../components/common/Navbar'
import { HomeFooter } from '../../components/home/HomeFooter'
import { ProfileForm } from '../../components/profile/ProfileForm'
import { EmailForm } from '../../components/profile/EmailForm'
import { VoucherSection } from '../../components/profile/VoucherSection'
import { AddressManagement } from '../../components/profile/AddressManagement'
import { useProfileStore } from '../../store/profileStore'
import { BRAND, navLinks, footerSections } from '../../data/home/homeData'

export default function ProfilePage() {
  const { fetchProfile } = useProfileStore()
  const [fetchError, setFetchError] = useState<{message: string, code: number} | null>(null)

  useEffect(() => {
    fetchProfile().catch((error) => {
      console.error('Failed to fetch profile:', error)
      setFetchError({
        message: error?.response?.data?.message || 'Terjadi kesalahan saat memuat data profil Anda. Silakan coba lagi nanti.',
        code: error?.response?.status || 500
      })
    })
  }, [fetchProfile])

  if (fetchError) {
    return (
      <ErrorPage />
    )
  }

  return (
    <div className="page">
      <Navbar brandName={BRAND.name} links={navLinks} />
      
      <main className="page-main profile-main">
        <div className="shell">
          <div className="profile-page-header">
            <h1 className="section-title profile-page-title">Pengaturan Profil</h1>
            <p className="section-body">Kelola informasi pribadi, keamanan akun, dan voucher Anda di sini.</p>
          </div>

          <div className="profile-grid">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeUp 0.4s ease forwards' }}>
              <ProfileForm />
              <VoucherSection />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeUp 0.5s ease forwards' }}>
              <EmailForm />
              <AddressManagement />
              
              {/* Extra aesthetic card for visual balance */}
              <div className="hero-card" style={{ padding: '24px', background: 'var(--accent-soft)', border: 'none' }}>
                <h4 style={{ margin: '0 0 8px', color: 'var(--accent-strong)', fontSize: '1.05rem' }}>Keamanan Akun</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--ink)' }}>
                  Pastikan Anda menggunakan kombinasi password yang kuat. PanenMart tidak pernah meminta password Anda di luar halaman ini.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <HomeFooter brandName={BRAND.name} sections={footerSections} />
    </div>
  )
}
