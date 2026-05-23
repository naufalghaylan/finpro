import type { NavLink } from '../../types/home/home'

type HomeNavbarProps = {
  brandName: string
  links: NavLink[]
}

export const HomeNavbar = ({ brandName, links }: HomeNavbarProps) => {
  return (
    <header className="nav">
      <div className="shell nav-inner">
        <div className="logo">
          <span className="logo-mark"></span>
          <span>{brandName}</span>
        </div>
        <nav className="nav-links" aria-label="Main navigation">
          {links.map((link) => (
            <a key={link.id} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="nav-search">
          <label className="sr-only" htmlFor="home-search">
            Cari produk
          </label>
          <input
            id="home-search"
            type="search"
            placeholder="Cari sayur, buah, bumbu"
          />
        </div>
        <div className="nav-actions">
          <button type="button" className="button ghost">
            Masuk
          </button>
          <button type="button" className="button primary">
            Mulai belanja
          </button>
          <button type="button" className="menu-button" aria-label="Buka menu">
            Menu
          </button>
        </div>
      </div>
    </header>
  )
}
