import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { 
  Store, 
  Users, 
  Package, 
  ShoppingBag, 
  Layers, 
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  UserCog
} from 'lucide-react';

interface AdminSidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export function AdminSidebar({ isCollapsed, toggleCollapse }: AdminSidebarProps) {
  const { user } = useAuthStore();
  const location = useLocation();
  const currentPath = location.pathname;

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const menuItems = [
    ...(isSuperAdmin ? [
      { to: '/admin/stores/list', label: 'Daftar Toko', icon: Store, match: '/admin/stores/list' },
      { to: '/admin/stores/admins', label: 'Daftar Admin', icon: Users, match: '/admin/stores/admins' },
      { to: '/admin/users', label: 'Daftar Pengguna', icon: UserCog, match: '/admin/users' },
    ] : [
      { to: `/admin/stores/${user?.storeId}`, label: 'Dashboard Toko', icon: Store, match: `/admin/stores/${user?.storeId}` },
    ]),
    { to: '/admin/stores/stocks', label: 'Daftar Stok', icon: Package, match: '/stocks' },
    { to: '/admin/stores/products', label: 'Manajemen Produk', icon: ShoppingBag, match: '/products' },
    { to: '/admin/categories', label: 'Manajemen Kategori', icon: Layers, match: '/categories' },
    { to: '/admin/stores/orders', label: 'Pesanan', icon: ClipboardList, match: '/orders' },
  ];

  return (
    <aside 
      className={`fixed top-0 left-0 h-[100svh] bg-admin-surface border-r border-admin-line-soft transition-all duration-300 z-[60] flex flex-col font-[family-name:var(--font-admin)]`}
      style={{ width: isCollapsed ? '80px' : '260px' }}
    >
      <div className="h-[72px] flex items-center justify-between px-4 border-b border-admin-line-soft shrink-0">
        {!isCollapsed && (
          <Link to="/admin/stores" className="flex items-center gap-2 no-underline">
            <img src="/PanenMartLogo.svg" alt="Logo" className="w-8 h-8" />
            <span className="font-bold text-lg text-admin-ink tracking-tight font-[family-name:var(--font-admin-display)]">Admin</span>
          </Link>
        )}
        {isCollapsed && (
          <div className="mx-auto flex justify-center w-full">
            <img src="/PanenMartLogo.svg" alt="Logo" className="w-8 h-8" />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-2 scrollbar-hide">
        {menuItems.map((item) => {
          const isActive = currentPath.includes(item.match) || currentPath === item.to;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.to}
              to={item.to}
              title={isCollapsed ? item.label : undefined}
              className={`
                flex items-center gap-3 px-3 py-3 rounded-xl no-underline transition-all font-[family-name:var(--font-admin)]
                ${isActive 
                  ? 'bg-admin-accent text-white shadow-md' 
                  : 'text-admin-ink-soft hover:bg-admin-surface-2 hover:text-admin-ink'
                }
              `}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && (
                <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-admin-line-soft">
        <button
          onClick={toggleCollapse}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-admin-surface-2 hover:bg-admin-line-soft rounded-lg text-admin-ink transition-colors border-none cursor-pointer font-[family-name:var(--font-admin)]"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!isCollapsed && <span className="font-medium text-sm">Sembunyikan</span>}
        </button>
      </div>
    </aside>
  );
}
