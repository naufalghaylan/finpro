import { Outlet, useLocation, Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Navbar } from '../../components/common/Navbar';
import { HomeFooter } from '../../components/home/HomeFooter';
import { BRAND, navLinks, footerSections } from '../../data/home/homeData';
import { Store, Users, LayoutDashboard, Package, ShoppingBag, Layers, ClipboardList, BarChart3, LineChart } from 'lucide-react';


export function AdminStoreIndexRedirect() {
  const { user } = useAuthStore();
  if (user?.role === 'SUPER_ADMIN') return <Navigate to="list" replace />;
  if (user?.role === 'STORE_ADMIN') {
    if (user.storeId) return <Navigate to={`${user.storeId}`} replace />;
    return (
      <div className="font-[family-name:var(--font-admin)] text-center py-20">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-admin-amber-soft mb-4">
          <Store className="w-7 h-7 text-admin-amber" />
        </div>
        <h3 className="text-lg font-bold text-admin-ink m-0">Belum Ada Toko yang Ditugaskan</h3>
        <p className="text-sm text-admin-ink-muted mt-2 max-w-md mx-auto">
          Akun Anda belum ditugaskan ke toko mana pun. Silakan hubungi Super Admin untuk
          mendapatkan penugasan toko sebelum dapat mengakses dashboard.
        </p>
      </div>
    );
  }
  return <Navigate to="/" replace />;
}

export default function AdminStoreLayout() {
  const { user } = useAuthStore();
  const location = useLocation();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isStoreAdmin = user?.role === 'STORE_ADMIN';

  if (!isSuperAdmin && !isStoreAdmin) {
    return <Navigate to="/" replace />;
  }

  const currentPath = location.pathname;

  const tabs = [
    { to: '/admin/stores/list', label: 'Daftar Toko', icon: Store, match: '/list' },
    { to: '/admin/stores/admins', label: 'Daftar Admin', icon: Users, match: '/admins' },
    { to: '/admin/stores/stocks', label: 'Daftar Stok Global', icon: Package, match: '/stocks' },
    { to: '/admin/stores/products', label: 'Manajemen Produk', icon: ShoppingBag, match: '/products' },
    { to: '/admin/categories', label: 'Manajemen Kategori', icon: Layers, match: '/categories' },
    { to: '/admin/stores/orders', label: 'Pesanan', icon: ClipboardList, match: '/orders' },
    { to: '/admin/stores/sales-report', label: 'Laporan Penjualan', icon: LineChart, match: '/sales-report' },
    { to: '/admin/stores/stock-report', label: 'Laporan Stok', icon: BarChart3, match: '/stock-report' },
  ];

  return (
    <div className="page">
      <Navbar brandName={BRAND.name} links={navLinks} />
      <main className="page-main">
        <section className="section">
          <div className="shell">
            {/* Premium Header */}
            <div className="admin-fade-in mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-admin-accent-soft">
                  <LayoutDashboard className="w-5 h-5 text-admin-accent-strong" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-admin-accent-strong mb-0">
                    Admin
                  </p>
                  <h2 className="font-[family-name:var(--font-admin-display)] text-2xl md:text-3xl font-bold text-admin-ink m-0">
                    Manajemen Operasional
                  </h2>
                </div>
              </div>
              <p className="text-sm text-admin-ink-soft mt-1 font-[family-name:var(--font-admin)]">
                Kelola toko, admin, dan operasional bisnis Anda dari satu tempat.
              </p>
            </div>

            {/* Pill Tab Navigation — SUPER_ADMIN only */}
            {isSuperAdmin && (
              <div className="admin-fade-in flex gap-2 p-1.5 mb-8 rounded-2xl bg-admin-surface-2/70 w-fit" style={{ animationDelay: '60ms' }}>
                {tabs.map((tab) => {
                  const isActive = currentPath.includes(tab.match);
                  const Icon = tab.icon;
                  return (
                    <Link
                      key={tab.to}
                      to={tab.to}
                      className={`
                        flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold no-underline
                        transition-all duration-200 font-[family-name:var(--font-admin)]
                        ${isActive
                          ? 'bg-admin-surface text-admin-ink shadow-sm'
                          : 'text-admin-ink-soft hover:text-admin-ink hover:bg-admin-surface/50'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Render active tab */}
            <div className="admin-fade-in" style={{ animationDelay: '120ms' }}>
              <Outlet />
            </div>
          </div>
        </section>
      </main>
      <HomeFooter brandName={BRAND.name} sections={footerSections} />
    </div>
  );
}
