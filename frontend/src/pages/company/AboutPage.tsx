import { Navbar } from '../../components/common/Navbar'
import { HomeFooter } from '../../components/home/HomeFooter'
import {
  BRAND,
  footerSections as defaultFooter,
  navLinks as defaultNavLinks
} from '../../data/home/homeData'

export default function AboutPage() {
  return (
    <div className="min-h-[100svh] flex flex-col relative overflow-clip before:content-[''] before:fixed before:inset-0 before:bg-[radial-gradient(circle_at_12%_18%,rgba(241,184,132,0.22),transparent_45%),radial-gradient(circle_at_80%_8%,rgba(95,149,123,0.18),transparent_48%),radial-gradient(circle_at_92%_75%,rgba(232,107,79,0.18),transparent_48%)] before:pointer-events-none before:-z-10 bg-[var(--bg)]">
      <Navbar brandName={BRAND.name} links={defaultNavLinks} />
      
      <main className="flex-1 w-full max-w-[1024px] mx-auto px-[clamp(16px,4vw,48px)] py-12 md:py-16">
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-5xl font-bold text-[var(--ink)] mb-6 font-[family-name:var(--font-display)] tracking-tight">Tentang PanenMart</h1>
          <p className="text-[var(--ink-soft)] text-lg max-w-[600px] mx-auto leading-relaxed">
            Menghubungkan kebaikan alam nusantara langsung ke meja makan Anda, dengan cara yang lebih segar, cepat, dan transparan.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div className="order-2 md:order-1">
            <h2 className="text-2xl font-bold text-[var(--ink)] mb-4">Visi Kami</h2>
            <p className="text-[var(--ink-soft)] leading-relaxed mb-6">
              PanenMart lahir dari sebuah visi sederhana: memberikan akses bahan pangan segar berkualitas bagi keluarga Indonesia sekaligus memberdayakan petani lokal.
              Kami percaya bahwa rantai pasokan makanan yang pendek tidak hanya menjamin kesegaran yang maksimal, tetapi juga menjaga stabilitas harga baik bagi produsen maupun konsumen.
            </p>
            <p className="text-[var(--ink-soft)] leading-relaxed">
              Melalui jaringan toko yang terdistribusi strategis, kami memangkas waktu kirim sehingga sayur, buah, dan protein favorit Anda tiba dalam hitungan jam.
            </p>
          </div>
          <div className="order-1 md:order-2 aspect-4/3 rounded-3xl overflow-hidden shadow-[var(--shadow-strong)] relative">
            <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800" alt="Sayuran segar" className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="bg-[var(--surface)] p-8 md:p-12 rounded-3xl border border-[var(--line)] shadow-[var(--shadow-soft)] mb-20">
          <h2 className="text-2xl font-bold text-[var(--ink)] mb-8 text-center">Nilai-Nilai Utama PanenMart</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--surface-muted)] rounded-2xl mx-auto flex items-center justify-center mb-4 text-3xl">🌱</div>
              <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">Kesegaran Terjamin</h3>
              <p className="text-[var(--ink-soft)] text-sm">Produk dikurasi dengan ketat dan dikirim cepat menjaga kualitas terbaik.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--surface-muted)] rounded-2xl mx-auto flex items-center justify-center mb-4 text-3xl">🤝</div>
              <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">Kemitraan Adil</h3>
              <p className="text-[var(--ink-soft)] text-sm">Membeli langsung dari petani dengan harga yang lebih adil dan transparan.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--surface-muted)] rounded-2xl mx-auto flex items-center justify-center mb-4 text-3xl">⚡</div>
              <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">Pengiriman Cepat</h3>
              <p className="text-[var(--ink-soft)] text-sm">Dikirim dari toko terdekat dalam waktu kurang dari 2 jam ke pintu Anda.</p>
            </div>
          </div>
        </div>
      </main>

      <HomeFooter brandName={BRAND.name} sections={defaultFooter} />
    </div>
  )
}
