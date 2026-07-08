import { Navbar } from '../../components/common/Navbar'
import { HomeFooter } from '../../components/home/HomeFooter'
import {
  BRAND,
  footerSections as defaultFooter,
  navLinks as defaultNavLinks
} from '../../data/home/homeData'

export default function PartnersPage() {
  return (
    <div className="min-h-[100svh] flex flex-col relative overflow-clip before:content-[''] before:fixed before:inset-0 before:bg-[radial-gradient(circle_at_12%_18%,rgba(241,184,132,0.22),transparent_45%),radial-gradient(circle_at_80%_8%,rgba(95,149,123,0.18),transparent_48%),radial-gradient(circle_at_92%_75%,rgba(232,107,79,0.18),transparent_48%)] before:pointer-events-none before:-z-10 bg-[var(--bg)]">
      <Navbar brandName={BRAND.name} links={defaultNavLinks} />
      
      <main className="flex-1 w-full max-w-[1024px] mx-auto px-[clamp(16px,4vw,48px)] py-12 md:py-16">
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-5xl font-bold text-[var(--ink)] mb-6 font-[family-name:var(--font-display)] tracking-tight">Mitra Petani Kami</h1>
          <p className="text-[var(--ink-soft)] text-lg max-w-[600px] mx-auto leading-relaxed">
            PanenMart berkomitmen untuk berkembang bersama ribuan petani dan peternak lokal di seluruh Indonesia.
          </p>
        </div>
        
        <div className="bg-[var(--surface)] p-8 md:p-12 rounded-3xl border border-[var(--line)] shadow-[var(--shadow-soft)] mb-16">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl font-bold text-[var(--ink)] mb-4">Mengapa Bergabung dengan PanenMart?</h2>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <span className="text-[var(--accent)] font-bold">✓</span>
                  <div>
                    <h4 className="font-semibold text-[var(--ink)]">Kepastian Pasar</h4>
                    <p className="text-[var(--ink-soft)] text-sm">Tidak perlu khawatir produk terbuang, kami merencanakan penyerapan secara berkala.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-[var(--accent)] font-bold">✓</span>
                  <div>
                    <h4 className="font-semibold text-[var(--ink)]">Harga Beli yang Adil</h4>
                    <p className="text-[var(--ink-soft)] text-sm">Memangkas rantai perantara sehingga petani mendapatkan margin yang lebih baik.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-[var(--accent)] font-bold">✓</span>
                  <div>
                    <h4 className="font-semibold text-[var(--ink)]">Dukungan Agronomi</h4>
                    <p className="text-[var(--ink-soft)] text-sm">Akses pendampingan dari tim ahli pertanian untuk meningkatkan kualitas panen.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="aspect-square rounded-2xl overflow-hidden">
              <img src="/farmers_harvesting.png" alt="Petani memanen" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        <div className="text-center p-8 bg-[var(--surface-muted)] rounded-3xl border border-[var(--line)]">
          <h2 className="text-xl font-bold text-[var(--ink)] mb-4">Tertarik Menjadi Mitra Kami?</h2>
          <p className="text-[var(--ink-soft)] mb-8">Daftarkan kelompok tani Anda dan jadilah bagian dari rantai pasokan pangan masa depan.</p>
          <a href="mailto:mitra@panenmart.com" className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] text-white px-8 py-3 font-semibold shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-strong)] hover:-translate-y-px transition-all">
            Hubungi Tim Kemitraan
          </a>
        </div>
      </main>

      <HomeFooter brandName={BRAND.name} sections={defaultFooter} />
    </div>
  )
}
