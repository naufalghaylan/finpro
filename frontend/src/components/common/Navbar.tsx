import { useState, useEffect } from 'react'
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

  const handleCartClick = () => {
    if (!isAuthenticated) {
      navigate('/login')
    } else {
      navigate('/cart')
    }
  }

  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const getInitial = (name?: string) => {
    if (!name) return 'U'
    return name.charAt(0).toUpperCase()
  }

  return (
    <header className={`nav ${isScrolled ? 'scrolled' : ''}`}>
      <div className="shell nav-inner">
        <div className="logo">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}>
            <span className="logo-mark"></span>
            <span>{brandName}</span>
          </Link>
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
          {isAuthenticated && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link to="/profile" className="profile-pill" style={{ 
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
              }}>
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
                  fontSize: '0.95rem'
                }}>
                  {getInitial(user.name)}
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
            <Link to="/login" className="button ghost">
              Masuk
            </Link>
          )}
          <button type="button" className="button primary cart-button" onClick={handleCartClick}>
            Keranjang
            <span className="cart-badge" aria-live="polite">
              {isLoadingCartCount ? '...' : cartCount}
            </span>
          </button>
          <button type="button" className="menu-button" aria-label="Buka menu">
            Menu
          </button>
        </div>
      </div>
    </header>
  )
}
