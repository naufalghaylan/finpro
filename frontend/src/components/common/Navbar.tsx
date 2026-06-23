import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PackageCheck, ShoppingCart, UserRound } from 'lucide-react'
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
  const [keyword, setKeyword] = useState('')
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
      <div ref={mobileMenuRef} style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
      <header className={`nav ${isScrolled ? 'scrolled' : ''}`} style={{ position: 'static', paddingRight: 'var(--scrollbar-width, 0px)' }}>
        <div className="shell nav-inner">
          {/* Logo */}
          <div className="logo">
            <Link to="/home" onClick={closeMobileMenu} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}>
              <img src="/PanenMartLogo.svg" alt="Logo" style={{ height: '32px', width: 'auto' }} />
              <span>{brandName}</span>
            </Link>
          </div>

          {/* Desktop nav links */}
          <nav className="nav-links" aria-label="Main navigation">
            {links.map((link) =>
              link.href.startsWith('/') ? (
                <Link key={link.id} to={link.href}>
                  {link.label}
                </Link>
              ) : (
                <a key={link.id} href={link.href}>
                  {link.label}
                </a>
              )
            )}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'STORE_ADMIN') && (
              <Link to="/admin/stores" style={{ color: 'var(--accent-strong)', fontWeight: 600 }}>Admin Toko</Link>
            )}
          </nav>

          {/* Search bar */}
          <div className="nav-search">
            <label className="sr-only" htmlFor="home-search">
              Cari produk
            </label>
            <input
              id="home-search"
              type="search"
              placeholder="Cari sayur, buah, bumbu"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && keyword.trim()) {
                  navigate(`/search?keyword=${encodeURIComponent(keyword.trim())}`)
                  setKeyword('')
                }
              }}
            />
          </div>

          {/* Desktop actions */}
          <div className="nav-actions">
            {isAuthenticated && user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="profile-menu">
                  <Link
                    to="/profile"
                    className="profile-pill"
                    aria-haspopup="menu"
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
                  <div className="profile-dropdown" role="menu" aria-label="Menu akun">
                    <Link to="/profile" role="menuitem" className="profile-dropdown-item">
                      <UserRound aria-hidden="true" />
                      Profil
                    </Link>
                    <Link to="/orders" role="menuitem" className="profile-dropdown-item">
                      <PackageCheck aria-hidden="true" />
                      Pesanan
                    </Link>
                  </div>
                </div>
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
            <button
              type="button"
              className="button primary cart-button cart-button-icon-only"
              onClick={handleCartClick}
              aria-label={`Keranjang belanja, ${isLoadingCartCount ? 'memuat jumlah item' : `${cartCount} item`}`}
            >
              <ShoppingCart className="button-icon" aria-hidden="true" />
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
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && keyword.trim()) {
                    navigate(`/search?keyword=${encodeURIComponent(keyword.trim())}`)
                    setKeyword('')
                    closeMobileMenu()
                  }
                }}
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
                {links.map((link) =>
                  link.href.startsWith('/') ? (
                    <Link key={link.id} to={link.href} onClick={closeMobileMenu}>
                      {link.label}
                    </Link>
                  ) : (
                    <a key={link.id} href={link.href} onClick={closeMobileMenu}>
                      {link.label}
                    </a>
                  )
                )}
                {(user?.role === 'SUPER_ADMIN' || user?.role === 'STORE_ADMIN') && (
                  <Link to="/admin/stores" onClick={closeMobileMenu} style={{ color: 'var(--accent-strong)', fontWeight: 600 }}>
                    Admin Toko
                  </Link>
                )}
              </nav>
            )}

            <div className="mobile-menu-divider" />

            {/* Auth section */}
            {isAuthenticated && user ? (
              <div className="mobile-menu-auth">
                <div className="mobile-profile-row">
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
                    <span className="mobile-profile-sub">Akun PanenMart</span>
                  </div>
                </div>
                <nav className="mobile-account-links" aria-label="Menu akun">
                  <Link to="/profile" onClick={closeMobileMenu}>
                    <UserRound aria-hidden="true" />
                    Profil
                  </Link>
                  <Link to="/orders" onClick={closeMobileMenu}>
                    <PackageCheck aria-hidden="true" />
                    Pesanan
                  </Link>
                </nav>
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
              <ShoppingCart className="button-icon" aria-hidden="true" />
              <span>Keranjang</span>
              <span className="cart-badge" aria-live="polite">
                {isLoadingCartCount ? '...' : cartCount}
              </span>
            </button>
          </div>
        </div>
      </header>
      </div>
      {/* Spacer to prevent layout shift since navbar is fixed */}
      <div style={{ height: '72px' }}></div>

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
