import type { FooterSection } from '../../types/home/home'

type HomeFooterProps = {
  brandName: string
  sections: FooterSection[]
}

export const HomeFooter = ({ brandName, sections }: HomeFooterProps) => {
  return (
    <footer className="pt-12 pb-6 border-t border-[var(--line)] bg-[var(--surface)] mt-9">
      <div className="w-full max-w-[1200px] mx-auto px-[clamp(16px,4vw,48px)] grid grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)] gap-8 items-start">
        <div>
          <div className="inline-flex items-center gap-2.5 font-[family-name:var(--font-display)] text-[1.1rem] tracking-[-0.02em] font-semibold text-[var(--ink)]">
            <img src="/PanenMartLogo.svg" alt="Logo" className="h-8 w-auto" />
            <span>{brandName}</span>
          </div>
          <p className="m-0 mt-3 text-[var(--ink-soft)]">
            Belanja kebutuhan segar, stok terbaru, dan rekomendasi menu harian dari
            store terdekat.
          </p>
          <div className="flex flex-wrap gap-2.5 mt-4">
            <label className="sr-only" htmlFor="footer-email">
              Email
            </label>
            <input
              id="footer-email"
              type="email"
              placeholder="Email untuk update promo"
              className="flex-1 min-w-[180px] rounded-full border border-[var(--line)] px-3.5 py-2.5 bg-[var(--surface)] focus:outline-none focus:border-[var(--accent)]"
            />
            <button type="button" className="inline-flex items-center justify-center gap-2 rounded-full border border-transparent px-4 py-2 font-semibold cursor-pointer bg-[var(--accent)] text-white shadow-[var(--shadow-soft)] hover:-translate-y-[1px] hover:shadow-[var(--shadow-strong)] transition-all">
              Kirim
            </button>
          </div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4">
          {sections.map((section) => (
            <div key={section.id}>
              <h4 className="m-0 mb-2.5 text-[0.95rem] text-[var(--ink)] font-semibold">{section.title}</h4>
              <ul className="list-none p-0 m-0 grid gap-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="no-underline text-[var(--ink-soft)] text-[0.9rem] transition-colors hover:text-[var(--accent-strong)]">{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="w-full max-w-[1200px] mx-auto px-[clamp(16px,4vw,48px)] flex flex-col items-center justify-center gap-2 mt-8 pt-6 border-t border-[var(--line)] text-[0.85rem] text-[var(--ink-soft)] text-center">
        <span>2026 {brandName}. Semua hak dilindungi.</span>
        <span>Operasional 07.00 - 21.00</span>
      </div>
    </footer>
  )
}
