import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PackageCheck, ShoppingCart, UserRound } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useCartCount } from '../../hooks/home/useCartCount'
import { useToast } from './toastContext'
import type { NavLink } from '../../types/home/home'

type NavbarProps = {
  brandName: string
  links: NavLink[]
}

export const Navbar = ({ brandName, links }: NavbarProps) => {
  const { user, isAuthenticated, logout } = useAuthStore()
  const { cartCount, isLoadingCartCount } = useCartCount()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [isScrolled, setIsScrolled] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  const handleCartClick = () => {
    if (!isAuthenticated) {
      showToast('Silakan login terlebih dahulu untuk mengakses keranjang atau checkout.', 'warning')
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
      <header ref={mobileMenuRef} className={`sticky top-0 z-[70] transition-all duration-400 ease-in-out ${isScrolled ? 'bg-white/45 backdrop-blur-[20px] backdrop-saturate-180 border-b border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)]' : 'bg-(--surface) border-b border-transparent'}`}>
        <div className="w-full max-w-[1440px] mx-auto px-[clamp(16px,4vw,48px)] flex items-center justify-between gap-4 py-[18px]">
          {/* Left section: Logo and Nav links */}
          <div className="flex items-center gap-6 lg:gap-10">
            {/* Logo */}
            <div className="inline-flex items-center gap-2.5 font-(family-name:--font-display) text-[1.1rem] tracking-[-0.02em] font-semibold text-(--ink)">
              <Link to="/home" onClick={closeMobileMenu} className="flex items-center gap-2.5 no-underline text-inherit">
                <img src="/PanenMartLogo.svg" alt="Logo" className="h-8 w-auto" />
                <span>{brandName}</span>
              </Link>
            </div>

            {/* Desktop nav links */}
            <nav className="hidden lg:flex items-center gap-6 justify-center whitespace-nowrap" aria-label="Main navigation">
              {links.map((link) =>
                link.href.startsWith('/') ? (
                  <Link key={link.id} to={link.href} className="no-underline text-(--ink) font-medium text-[0.95rem] transition-colors hover:text-(--accent-strong)">
                    {link.label}
                  </Link>
                ) : (
                  <a key={link.id} href={link.href} className="no-underline text-(--ink) font-medium text-[0.95rem] transition-colors hover:text-(--accent-strong)">
                    {link.label}
                  </a>
                )
              )}
              {(user?.role === 'SUPER_ADMIN' || user?.role === 'STORE_ADMIN') && (
                <Link to="/admin/stores" className="text-(--accent-strong)! font-bold no-underline text-[0.95rem]">Admin Toko</Link>
              )}
            </nav>
          </div>

          {/* Right section: Search bar and Actions */}
          <div className="flex items-center gap-4 lg:gap-6">
            {/* Search bar */}
            <div className="hidden lg:block">
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
                className="w-[220px] rounded-full border border-(--line) px-4 py-2.5 bg-(--surface) text-[0.9rem] transition-colors focus:outline-none focus:border-(--accent)"
              />
            </div>

            {/* Desktop actions */}
            <div className="flex items-center gap-4 justify-end">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="relative hidden lg:inline-flex group">
                  <div className="absolute top-full right-0 w-full h-3"></div>
                  <Link
                    to="/profile"
                    aria-haspopup="menu"
                    className="flex items-center gap-2.5 no-underline text-(--ink) bg-white border border-(--line) rounded-full pl-1.5 pr-4 py-1.5 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                  >
                    <div className="w-[34px] h-[34px] rounded-full bg-(--accent) text-white flex items-center justify-center font-bold text-[0.95rem] overflow-hidden">
                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={user.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getInitial(user.name)
                      )}
                    </div>
                    <span className="hidden lg:block font-semibold text-[0.95rem] whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">{user.name}</span>
                  </Link>
                  <div className="absolute top-[calc(100%+10px)] right-0 z-30 grid w-full min-w-max gap-1 border border-[rgba(232,107,79,0.22)] rounded-2xl p-2 bg-[#fff8f2] shadow-[0_18px_38px_rgba(31,42,34,0.13)] opacity-0 pointer-events-none -translate-y-1.5 transition-all duration-[0.18s] ease-in-out group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0" role="menu" aria-label="Menu akun">
                    <Link to="/profile" role="menuitem" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-(--ink) text-[0.94rem] font-bold no-underline transition-colors hover:bg-[#fff4ec] hover:text-(--accent-strong)">
                      <UserRound aria-hidden="true" className="w-[18px] h-[18px]" />
                      Profil
                    </Link>
                    <Link to="/orders" role="menuitem" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-(--ink) text-[0.94rem] font-bold no-underline transition-colors hover:bg-[#fff4ec] hover:text-(--accent-strong)">
                      <PackageCheck aria-hidden="true" className="w-[18px] h-[18px]" />
                      Pesanan
                    </Link>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="hidden lg:inline-flex items-center justify-center gap-2 rounded-full border border-(--line) bg-transparent px-3 py-2 font-semibold cursor-pointer text-[#e53e3e] transition-all hover:-translate-y-px hover:shadow-(--shadow-strong) hover:border-transparent"
                  aria-label="Logout"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="hidden lg:inline-flex items-center justify-center gap-2 rounded-full border border-(--line) bg-transparent px-4.5 py-2.5 font-semibold cursor-pointer text-(--ink) transition-all hover:-translate-y-px hover:shadow-(--shadow-strong) hover:border-transparent">Masuk</Link>
            )}
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-transparent p-[10px] cursor-pointer bg-(--accent) text-white shadow-(--shadow-soft) hover:-translate-y-px hover:shadow-(--shadow-strong) transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleCartClick}
              aria-label={`Keranjang belanja, ${isLoadingCartCount ? 'memuat jumlah item' : `${cartCount} item`}`}
            >
              <ShoppingCart className="w-5 h-5 stroke-[2.4]" aria-hidden="true" />
              <span className="min-w-[24px] h-[24px] px-1.5 rounded-full inline-flex items-center justify-center text-[0.75rem] font-bold leading-none text-(--ink) bg-white ml-2" aria-live="polite">
                {isLoadingCartCount ? '...' : cartCount}
              </span>
            </button>

            {/* Hamburger button — mobile only */}
            <button
              id="hamburger-menu-btn"
              type="button"
              className={`lg:hidden flex flex-col justify-center items-center gap-[5px] w-10 h-10 border-none bg-(--surface-muted,#f5f5f5) rounded-xl cursor-pointer p-0 shrink-0 transition-colors hover:bg-(--line,#e8e8e8)`}
              aria-label={isMobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              <span className={`block w-5 h-[2px] bg-(--ink) rounded-[2px] transition-all duration-300 origin-center ${isMobileMenuOpen ? 'translate-y-[7px] rotate-45' : ''}`}></span>
              <span className={`block w-5 h-[2px] bg-(--ink) rounded-[2px] transition-all duration-200 origin-center ${isMobileMenuOpen ? 'opacity-0 scale-x-0' : ''}`}></span>
              <span className={`block w-5 h-[2px] bg-(--ink) rounded-[2px] transition-all duration-300 origin-center ${isMobileMenuOpen ? 'translate-y-[-7px] -rotate-45' : ''}`}></span>
            </button>
          </div>
        </div>
      </div>

        {/* Mobile dropdown menu */}
        <div
          id="mobile-menu"
          className={`overflow-hidden transition-all duration-350 ease-in-out border-t bg-(--surface) ${isMobileMenuOpen ? 'max-h-[600px] opacity-100 border-(--line) shadow-[0_12px_32px_rgba(0,0,0,0.08)]' : 'max-h-0 opacity-0 border-transparent'}`}
          aria-hidden={!isMobileMenuOpen}
        >
          <div className="w-full max-w-[1440px] mx-auto px-[clamp(16px,4vw,48px)] flex flex-col gap-3 py-4 pb-5">
            {/* Mobile Search */}
            <div>
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
                className="w-full rounded-full border border-(--line) px-4 py-3 bg-(--surface) text-[0.95rem] focus:outline-none focus:border-(--accent)"
              />
            </div>
            
            {/* Nav links */}
            {links.length > 0 && (
              <nav className="flex flex-col gap-0.5" aria-label="Mobile navigation">
                {links.map((link) =>
                  link.href.startsWith('/') ? (
                    <Link key={link.id} to={link.href} onClick={closeMobileMenu} className="no-underline text-(--ink) font-medium text-base py-3 border-b border-(--line) transition-colors hover:text-(--accent-strong)">
                      {link.label}
                    </Link>
                  ) : (
                    <a key={link.id} href={link.href} onClick={closeMobileMenu} className="no-underline text-(--ink) font-medium text-base py-3 border-b border-(--line) transition-colors hover:text-(--accent-strong)">
                      {link.label}
                    </a>
                  )
                )}
                {(user?.role === 'SUPER_ADMIN' || user?.role === 'STORE_ADMIN') && (
                  <Link to="/admin/stores" onClick={closeMobileMenu} className="no-underline font-bold text-base py-3 border-b border-(--line) transition-colors text-(--accent-strong)!">
                    Admin Toko
                  </Link>
                )}
              </nav>
            )}

            <div className="h-px bg-(--line) my-1" />

            {/* Auth section */}
            {isAuthenticated && user ? (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-3 text-(--ink) py-2.5">
                  <div className="w-[42px] h-[42px] rounded-full bg-(--accent) text-white flex items-center justify-center font-bold text-base overflow-hidden shrink-0">
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitial(user.name)
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-[0.95rem]">{user.name}</span>
                    <span className="text-[0.8rem] text-(--ink-soft)">Akun PanenMart</span>
                  </div>
                </div>
                <nav className="grid gap-2" aria-label="Menu akun">
                  <Link to="/profile" onClick={closeMobileMenu} className="flex items-center gap-2.5 border border-(--line) rounded-xl px-3.5 py-3 bg-(--surface) text-(--ink) font-bold no-underline transition-colors hover:text-(--accent-strong) hover:border-[rgba(232,107,79,0.28)] hover:bg-[#fff8f2]">
                    <UserRound aria-hidden="true" className="w-[18px] h-[18px]" />
                    Profil
                  </Link>
                  <Link to="/orders" onClick={closeMobileMenu} className="flex items-center gap-2.5 border border-(--line) rounded-xl px-3.5 py-3 bg-(--surface) text-(--ink) font-bold no-underline transition-colors hover:text-(--accent-strong) hover:border-[rgba(232,107,79,0.28)] hover:bg-[#fff8f2]">
                    <PackageCheck aria-hidden="true" className="w-[18px] h-[18px]" />
                    Pesanan
                  </Link>
                </nav>
                <button
                  type="button"
                  onClick={() => { logout(); closeMobileMenu() }}
                  className="border border-[#fecaca] bg-[#fff5f5] text-[#e53e3e] rounded-xl p-3 font-semibold text-[0.95rem] cursor-pointer transition-colors text-center w-full hover:bg-[#ffe4e4]"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-full border border-transparent px-4.5 py-2.5 font-semibold cursor-pointer bg-(--accent) text-white shadow-(--shadow-soft) hover:-translate-y-px hover:shadow-(--shadow-strong) transition-all text-center w-full no-underline" onClick={closeMobileMenu}>
                Masuk
              </Link>
            )}

            {/* Cart button */}
            <button type="button" className="inline-flex items-center justify-center gap-2 rounded-full border border-transparent px-4.5 py-2.5 font-semibold cursor-pointer bg-(--accent) text-white shadow-(--shadow-soft) hover:-translate-y-px hover:shadow-(--shadow-strong) transition-all w-full mt-1" onClick={handleCartClick}>
              <ShoppingCart className="w-[18px] h-[18px]" aria-hidden="true" />
              <span>Keranjang</span>
              <span className="min-w-[24px] h-[24px] px-1.5 rounded-full inline-flex items-center justify-center text-[0.75rem] font-bold leading-none text-(--ink) bg-white ml-1" aria-live="polite">
                {isLoadingCartCount ? '...' : cartCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Backdrop overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-19 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}
    </>
  )
}
