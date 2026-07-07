import { Navbar } from '../../components/common/Navbar'
import { HomeFooter } from '../../components/home/HomeFooter'
import {
  BRAND,
  footerSections as defaultFooter,
  navLinks as defaultNavLinks
} from '../../data/home/homeData'

export default function HelpPage() {
  const faqs = [
    {
      question: 'Bagaimana cara berbelanja di PanenMart?',
      answer: 'Anda dapat mencari produk melalui kolom pencarian atau memilih dari kategori yang tersedia. Tambahkan produk ke keranjang, lalu lanjutkan ke halaman checkout dan pembayaran.'
    },
    {
      question: 'Apakah ada minimum pembelian?',
      answer: 'Tidak ada minimum pembelian, namun untuk menikmati promo gratis ongkir, Anda perlu berbelanja dengan nominal tertentu sesuai syarat yang berlaku.'
    },
    {
      question: 'Berapa lama pesanan akan sampai?',
      answer: 'Untuk area yang terjangkau, pesanan rata-rata akan tiba kurang dari 2 jam karena kami mengirim langsung dari toko terdekat kami ke lokasi Anda.'
    },
    {
      question: 'Bagaimana jika produk yang saya terima rusak atau tidak segar?',
      answer: 'Kami menggaransi kesegaran produk. Jika Anda menerima produk yang tidak sesuai standar, Anda dapat mengajukan komplain melalui halaman pesanan atau menghubungi customer service kami dalam waktu 1x24 jam.'
    },
    {
      question: 'Metode pembayaran apa saja yang tersedia?',
      answer: 'Kami menerima berbagai metode pembayaran termasuk transfer bank otomatis (Virtual Account), e-wallet (GoPay, OVO, Dana), dan metode pembayaran instan lainnya melalui gateway pembayaran resmi.'
    }
  ]

  return (
    <div className="min-h-[100svh] flex flex-col relative overflow-clip before:content-[''] before:fixed before:inset-0 before:bg-[radial-gradient(circle_at_12%_18%,rgba(241,184,132,0.22),transparent_45%),radial-gradient(circle_at_80%_8%,rgba(95,149,123,0.18),transparent_48%),radial-gradient(circle_at_92%_75%,rgba(232,107,79,0.18),transparent_48%)] before:pointer-events-none before:-z-10 bg-[var(--bg)]">
      <Navbar brandName={BRAND.name} links={defaultNavLinks} />
      
      <main className="flex-1 w-full max-w-[800px] mx-auto px-[clamp(16px,4vw,48px)] py-12 md:py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--ink)] mb-4 font-[family-name:var(--font-display)] tracking-tight">Pusat Bantuan</h1>
          <p className="text-[var(--ink-soft)] text-[1.05rem]">Temukan jawaban untuk pertanyaan yang sering diajukan (FAQ).</p>
        </div>
        
        <div className="flex flex-col gap-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-[var(--surface)] border border-[var(--line)] p-6 rounded-2xl shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-strong)] transition-all">
              <h3 className="text-[1.05rem] font-semibold text-[var(--ink)] mb-2.5 flex items-start gap-3">
                <span className="text-[var(--accent)] font-bold">Q.</span>
                {faq.question}
              </h3>
              <p className="text-[var(--ink-soft)] leading-relaxed pl-[1.6rem] text-[0.95rem]">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-16 p-8 md:p-10 bg-[var(--surface-muted)] rounded-3xl border border-[var(--line)] text-center shadow-inner">
          <h2 className="text-xl font-bold text-[var(--ink)] mb-3">Masih butuh bantuan?</h2>
          <p className="text-[var(--ink-soft)] m-0 text-[0.95rem]">Tim customer service kami siap membantu Anda setiap hari pukul 07.00 - 21.00 WIB melalui aplikasi.</p>
        </div>
      </main>

      <HomeFooter brandName={BRAND.name} sections={defaultFooter} />
    </div>
  )
}
