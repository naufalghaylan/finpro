import { Navbar } from '../../components/common/Navbar'
import { HomeFooter } from '../../components/home/HomeFooter'
import {
  BRAND,
  footerSections as defaultFooter,
  navLinks as defaultNavLinks
} from '../../data/home/homeData'

export default function CareersPage() {
  const jobOpenings = [
    {
      title: 'Store Operations Manager',
      location: 'Jakarta Selatan',
      type: 'Full-time'
    },
    {
      title: 'Supply Chain Analyst',
      location: 'Jakarta Pusat',
      type: 'Full-time'
    },
    {
      title: 'Frontend Engineer (React)',
      location: 'Remote',
      type: 'Full-time'
    },
    {
      title: 'Quality Control Specialist',
      location: 'Tangerang',
      type: 'Contract'
    }
  ]

  return (
    <div className="min-h-[100svh] flex flex-col relative overflow-clip before:content-[''] before:fixed before:inset-0 before:bg-[radial-gradient(circle_at_12%_18%,rgba(241,184,132,0.22),transparent_45%),radial-gradient(circle_at_80%_8%,rgba(95,149,123,0.18),transparent_48%),radial-gradient(circle_at_92%_75%,rgba(232,107,79,0.18),transparent_48%)] before:pointer-events-none before:-z-10 bg-[var(--bg)]">
      <Navbar brandName={BRAND.name} links={defaultNavLinks} />
      
      <main className="flex-1 w-full max-w-[1024px] mx-auto px-[clamp(16px,4vw,48px)] py-12 md:py-16">
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-5xl font-bold text-[var(--ink)] mb-6 font-[family-name:var(--font-display)] tracking-tight">Karir di PanenMart</h1>
          <p className="text-[var(--ink-soft)] text-lg max-w-[600px] mx-auto leading-relaxed">
            Mari bergabung bersama kami membangun ekosistem pangan lokal yang inovatif, transparan, dan berkelanjutan.
          </p>
        </div>

        <div className="bg-[var(--surface)] p-8 md:p-12 rounded-3xl border border-[var(--line)] shadow-[var(--shadow-soft)] mb-16">
          <h2 className="text-2xl font-bold text-[var(--ink)] mb-8 text-center">Posisi yang Tersedia</h2>
          
          <div className="flex flex-col gap-4">
            {jobOpenings.map((job, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)] hover:shadow-[var(--shadow-soft)] transition-all">
                <div className="mb-4 sm:mb-0">
                  <h3 className="text-lg font-bold text-[var(--ink)] mb-1">{job.title}</h3>
                  <div className="flex items-center gap-3 text-[var(--ink-soft)] text-sm">
                    <span className="flex items-center gap-1">📍 {job.location}</span>
                    <span className="flex items-center gap-1">⏱️ {job.type}</span>
                  </div>
                </div>
                <button className="inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-transparent px-5 py-2 font-semibold text-[var(--ink)] hover:text-[var(--accent-strong)] hover:border-[var(--accent)] transition-all shrink-0">
                  Lihat Detail
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center p-8 bg-[var(--surface-muted)] rounded-3xl border border-[var(--line)]">
          <h2 className="text-xl font-bold text-[var(--ink)] mb-4">Tidak menemukan posisi yang pas?</h2>
          <p className="text-[var(--ink-soft)] mb-8">Kirimkan resume Anda dan kami akan menghubungi Anda saat ada posisi yang sesuai.</p>
          <a href="mailto:careers@panenmart.com" className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] text-white px-8 py-3 font-semibold shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-strong)] hover:-translate-y-px transition-all">
            Kirim Resume
          </a>
        </div>
      </main>

      <HomeFooter brandName={BRAND.name} sections={defaultFooter} />
    </div>
  )
}
