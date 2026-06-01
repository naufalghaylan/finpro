import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useCartCount } from '../../hooks/home/useCartCount'
import type { NavLink } from '../../types/home/home'

type NavbarProps = {
  brandName: string
  links: NavLink[]
}

export const Navbar = ({ brandName, links }: NavbarProps) => {
  const { user, isAuthenticated, logout } = useAuthStore()
  const { cartCount, isLoadingCartCount } = useCartCount()
  const navigate = useNavigate()

  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  const handleCartClick = () => {
    if (!isAuthenticated) {
      navigate('/login')
    } else {
      navigate('/cart')
    }
    setIsMobileMenuOpen(false)
  }

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobileMenuOpen])

  // Close mobile menu on route-change / resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) setIsMobileMenuOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const getInitial = (name?: string) => {
    if (!name) return 'U'
    return name.charAt(0).toUpperCase()
  }

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <>
      <div ref={mobileMenuRef} style={{ position: 'sticky', top: 0, zIndex: 20 }}>
      <header className={`nav ${isScrolled ? 'scrolled' : ''}`} style={{ position: 'static' }}>
        <div className="shell nav-inner">
          {/* Logo */}
          <div className="logo">
            <Link to="/" onClick={closeMobileMenu} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}>
              <span className="logo-mark"></span>
              <span>{brandName}</span>
            </Link>
          </div>

          {/* Desktop nav links */}
          <nav className="nav-links" aria-label="Main navigation">
            {links.map((link) => (
              <a key={link.id} href={link.href}>{link.label}</a>
            ))}
          </nav>

          {/* Search bar */}
          <div className="nav-search">
            <label className="sr-only" htmlFor="home-search">Cari produk</label>
            <input
              id="home-search"
              type="search"
              placeholder="Cari sayur, buah, bumbu"
            />
          </div>

          {/* Desktop actions */}
          <div className="nav-actions">
            {isAuthenticated && user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Link
                  to="/profile"
                  className="profile-pill"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    textDecoration: 'none',
                    color: 'var(--ink)',
                    background: 'white',
                    border: '1px solid var(--line)',
                    borderRadius: '999px',
                    padding: '6px 16px 6px 6px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.95rem',
                    overflow: 'hidden'
                  }}>
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      getInitial(user.name)
                    )}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }} className="desktop-only">{user.name}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="button ghost"
                  style={{ color: '#e53e3e', padding: '8px 12px' }}
                  aria-label="Logout"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="button ghost">Masuk</Link>
            )}
            <button type="button" className="button primary cart-button" onClick={handleCartClick}>
              Keranjang
              <span className="cart-badge" aria-live="polite">
                {isLoadingCartCount ? '...' : cartCount}
              </span>
            </button>

            {/* Hamburger button — mobile only */}
            <button
              id="hamburger-menu-btn"
              type="button"
              className={`menu-button ${isMobileMenuOpen ? 'open' : ''}`}
              aria-label={isMobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              <span className="hamburger-bar"></span>
              <span className="hamburger-bar"></span>
              <span className="hamburger-bar"></span>
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        <div
          id="mobile-menu"
          className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}
          aria-hidden={!isMobileMenuOpen}
        >
          <div className="shell mobile-menu-inner">
            {/* Mobile Search */}
            <div className="mobile-search">
              <label className="sr-only" htmlFor="mobile-search">Cari produk</label>
              <input
                id="mobile-search"
                type="search"
                placeholder="Cari sayur, buah, bumbu"
                style={{
                  width: '100%',
                  borderRadius: '999px',
                  border: '1px solid var(--line)',
                  padding: '12px 16px',
                  background: 'var(--surface)',
                  fontSize: '0.95rem'
                }}
              />
            </div>
            
            {/* Nav links */}
            {links.length > 0 && (
              <nav className="mobile-nav-links" aria-label="Mobile navigation">
                {links.map((link) => (
                  <a key={link.id} href={link.href} onClick={closeMobileMenu}>{link.label}</a>
                ))}
              </nav>
            )}

            <div className="mobile-menu-divider" />

            {/* Auth section */}
            {isAuthenticated && user ? (
              <div className="mobile-menu-auth">
                <Link to="/profile" className="mobile-profile-row" onClick={closeMobileMenu}>
                  <div className="mobile-avatar">
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      />
                    ) : (
                      getInitial(user.name)
                    )}
                  </div>
                  <div className="mobile-profile-info">
                    <span className="mobile-profile-name">{user.name}</span>
                    <span className="mobile-profile-sub">Lihat profil</span>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => { logout(); closeMobileMenu() }}
                  className="mobile-logout-btn"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="button primary" style={{ width: '100%', textAlign: 'center', textDecoration: 'none', display: 'block' }} onClick={closeMobileMenu}>
                Masuk
              </Link>
            )}

            {/* Cart button */}
            <button type="button" className="button primary cart-button" style={{ width: '100%', justifyContent: 'center' }} onClick={handleCartClick}>
              Keranjang
              <span className="cart-badge" aria-live="polite">
                {isLoadingCartCount ? '...' : cartCount}
              </span>
            </button>
          </div>
        </div>
      </header>
      </div>

      {/* Backdrop overlay */}
      {isMobileMenuOpen && (
        <div
          className="mobile-menu-backdrop"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}
    </>
  )
}
