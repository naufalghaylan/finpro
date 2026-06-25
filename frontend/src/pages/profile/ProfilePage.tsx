import { useEffect } from 'react'
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
  const { fetchProfile, error } = useProfileStore()

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  if (error) {
    return (
      <ErrorPage />
    )
  }

  return (
    <div className="page">
      <Navbar brandName={BRAND.name} links={navLinks} />
      
      <main className="flex-1 w-full py-5 pb-10 sm:py-10 sm:pb-[60px]">
        <div className="w-full max-w-[1440px] mx-auto px-[clamp(16px,4vw,48px)]">
          <div className="mb-8">
            <h1 className="m-0 text-[#111] font-[family-name:var(--font-display)] font-normal tracking-normal leading-[1.2] text-[2.4rem] mb-2">Pengaturan Profil</h1>
            <p className="m-0 text-[1.05rem] text-[var(--ink-soft)] leading-[1.6]">Kelola informasi pribadi, keamanan akun, dan voucher Anda di sini.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-6 items-start">
            <div className="flex flex-col gap-6 animate-[fadeUp_0.4s_ease_forwards]">
              <ProfileForm />
              <VoucherSection />
            </div>
            <div className="flex flex-col gap-6 animate-[fadeUp_0.5s_ease_forwards]">
              <EmailForm />
              <AddressManagement />
              
              {/* Extra aesthetic card for visual balance */}
              <div className="p-6 bg-[var(--accent-soft)] rounded-[20px] shadow-[var(--shadow-soft)] border-none">
                <h4 className="m-0 mb-2 text-[var(--accent-strong)] text-[1.05rem] font-normal font-[family-name:var(--font-display)]">Keamanan Akun</h4>
                <p className="m-0 text-[0.9rem] text-[var(--ink)] leading-[1.5]">
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
