import type { FooterSection } from '../../types/home/home'

type HomeFooterProps = {
  brandName: string
  sections: FooterSection[]
}

export const HomeFooter = ({ brandName, sections }: HomeFooterProps) => {
  return (
    <footer className="footer">
      <div className="shell footer-grid">
        <div className="footer-brand">
          <div className="logo">
            <span className="logo-mark"></span>
            <span>{brandName}</span>
          </div>
          <p>
            Belanja kebutuhan segar, stok terbaru, dan rekomendasi menu harian dari
            store terdekat.
          </p>
          <div className="footer-input">
            <label className="sr-only" htmlFor="footer-email">
              Email
            </label>
            <input
              id="footer-email"
              type="email"
              placeholder="Email untuk update promo"
            />
            <button type="button" className="button primary">
              Kirim
            </button>
          </div>
        </div>
        <div className="footer-links">
          {sections.map((section) => (
            <div key={section.id}>
              <h4>{section.title}</h4>
              <ul>
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="footer-bottom">
        <span>2026 {brandName}. Semua hak dilindungi.</span>
        <span>Operasional 07.00 - 21.00</span>
      </div>
    </footer>
  )
}
