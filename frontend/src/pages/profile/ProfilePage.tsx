import { useEffect } from 'react'
import { Navbar } from '../../components/common/Navbar'
import { HomeFooter } from '../../components/home/HomeFooter'
import { ProfileForm } from '../../components/profile/ProfileForm'
import { EmailForm } from '../../components/profile/EmailForm'
import { VoucherSection } from '../../components/profile/VoucherSection'
import { AddressManagement } from '../../components/profile/AddressManagement'
import { useProfileStore } from '../../store/profileStore'
import { BRAND, navLinks, footerSections } from '../../data/home/homeData'

export default function ProfilePage() {
  const { fetchProfile, isLoading } = useProfileStore()

  useEffect(() => {
    void fetchProfile().catch(console.error)
  }, [fetchProfile])

  return (
    <div className="page">
      <Navbar brandName={BRAND.name} links={navLinks} />
      
      <main className="page-main profile-main">
        <div className="shell">
          <div className="profile-page-header">
            <h1 className="section-title profile-page-title">Pengaturan Profil</h1>
            <p className="section-body">Kelola informasi pribadi, keamanan akun, dan voucher Anda di sini.</p>
          </div>

          {isLoading ? (
            <div className="profile-grid">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="animate-pulse" style={{ padding: '24px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '18px' }}>
                  <div style={{ height: '24px', background: 'var(--line)', borderRadius: '6px', width: '30%', marginBottom: '24px' }} />
                  <div style={{ height: '40px', background: 'var(--surface-muted)', borderRadius: '8px', width: '100%', marginBottom: '16px' }} />
                  <div style={{ height: '40px', background: 'var(--surface-muted)', borderRadius: '8px', width: '100%' }} />
                </div>
                <div className="animate-pulse" style={{ padding: '24px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '18px' }}>
                  <div style={{ height: '24px', background: 'var(--line)', borderRadius: '6px', width: '40%', marginBottom: '16px' }} />
                  <div style={{ height: '80px', background: 'var(--surface-muted)', borderRadius: '8px', width: '100%' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="animate-pulse" style={{ padding: '24px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '18px' }}>
                  <div style={{ height: '24px', background: 'var(--line)', borderRadius: '6px', width: '35%', marginBottom: '24px' }} />
                  <div style={{ height: '40px', background: 'var(--surface-muted)', borderRadius: '8px', width: '100%' }} />
                </div>
                <div className="animate-pulse" style={{ padding: '24px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '18px' }}>
                  <div style={{ height: '24px', background: 'var(--line)', borderRadius: '6px', width: '35%', marginBottom: '24px' }} />
                  <div style={{ height: '120px', background: 'var(--surface-muted)', borderRadius: '8px', width: '100%' }} />
                </div>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      </main>

      <HomeFooter brandName={BRAND.name} sections={footerSections} />
    </div>
  )
}
