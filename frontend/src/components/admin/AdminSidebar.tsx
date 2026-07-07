import { useState } from 'react';
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
  UserCog,
  Repeat2,
  ChevronDown,
  LineChart,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';

interface AdminSidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

type AdminMenuItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  subItems?: { to: string; label: string; icon: LucideIcon; exact?: boolean }[];
};

const matchesMenuItem = (currentPath: string, item: { to: string; exact?: boolean }) => {
  if (item.exact) return currentPath === item.to;
  return currentPath === item.to || currentPath.startsWith(`${item.to}/`);
};

export function AdminSidebar({ isCollapsed, toggleCollapse }: AdminSidebarProps) {
  const { user } = useAuthStore();
  const location = useLocation();
  const currentPath = location.pathname;

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({ 'Daftar Toko': true });

  const toggleMenu = (label: string, e: React.MouseEvent) => {
    e.preventDefault();
    setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const scopedStoreMatch = currentPath.match(/^\/admin\/stores\/(\d+)(?:\/.*)?$/);
  const scopedStoreId = scopedStoreMatch?.[1];

  const feature3MenuItems: AdminMenuItem[] = scopedStoreId
    ? [
        { to: `/admin/stores/${scopedStoreId}/stocks`, label: 'Stok Toko', icon: Package },
        { to: `/admin/stores/${scopedStoreId}/orders`, label: 'Pesanan Toko', icon: ClipboardList },
        { to: `/admin/stores/${scopedStoreId}/fulfillment`, label: 'Mutasi Stok', icon: Repeat2 },
        { to: `/admin/stores/${scopedStoreId}/sales-report`, label: 'Laporan Penjualan', icon: LineChart },
        { to: `/admin/stores/${scopedStoreId}/stock-report`, label: 'Laporan Stok', icon: BarChart3 },
        { to: `/admin/stores/${scopedStoreId}/admins`, label: 'Admin Toko', icon: Users },
      ]
    : [];

  const roleMenuItems: AdminMenuItem[] = isSuperAdmin
    ? [
        { 
          to: '/admin/stores/list', 
          label: 'Daftar Toko', 
          icon: Store,
          subItems: feature3MenuItems.length > 0 ? feature3MenuItems : undefined
        },
        { to: '/admin/stores/admins', label: 'Daftar Admin', icon: Users },
        { to: '/admin/users', label: 'Daftar Pengguna', icon: UserCog },
        { to: '/admin/stores/sales-report', label: 'Laporan Penjualan Global', icon: LineChart },
        { to: '/admin/stores/stock-report', label: 'Laporan Stok Global', icon: BarChart3 },
      ]
    : [
        {
          to: `/admin/stores/${user?.storeId}`,
          label: 'Dashboard Toko',
          icon: Store,
          exact: true,
        },
      ];


  const commonMenuItems: AdminMenuItem[] = [
    { to: '/admin/stores/stocks', label: 'Daftar Stok', icon: Package },
    { to: '/admin/stores/products', label: 'Manajemen Produk', icon: ShoppingBag },
    { to: '/admin/categories', label: 'Manajemen Kategori', icon: Layers },
    { to: '/admin/stores/orders', label: 'Pesanan', icon: ClipboardList },
  ];

  const menuItems = isSuperAdmin
    ? [...roleMenuItems, ...commonMenuItems]
    : [...roleMenuItems, ...feature3MenuItems];

  return (
    <aside
      className="fixed top-0 left-0 h-[100svh] bg-admin-surface border-r border-admin-line-soft transition-all duration-300 z-[60] flex flex-col font-[family-name:var(--font-admin)]"
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
          const isActive = matchesMenuItem(currentPath, item) || 
            (item.subItems?.some(sub => matchesMenuItem(currentPath, sub)) ?? false);
          const Icon = item.icon;
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isExpanded = expandedMenus[item.label];

          return (
            <div key={item.to} className="flex flex-col gap-1">
              <Link
                to={item.to}
                title={isCollapsed ? item.label : undefined}
                className={`
                  flex items-center justify-between px-3 py-3 rounded-xl no-underline transition-all font-[family-name:var(--font-admin)] group
                  ${isActive
                    ? 'bg-admin-accent text-white shadow-md'
                    : 'text-admin-ink-soft hover:bg-admin-surface-2 hover:text-admin-ink'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 shrink-0" />
                  {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>}
                </div>
                {!isCollapsed && hasSubItems && (
                  <button 
                    onClick={(e) => toggleMenu(item.label, e)}
                    className={`p-1 rounded-md transition-colors ${isActive ? 'hover:bg-white/20 text-white' : 'hover:bg-admin-line-soft text-admin-ink-soft'}`}
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                )}
              </Link>
              
              {!isCollapsed && hasSubItems && isExpanded && (
                <div className="flex flex-col gap-1 pl-4 mt-1">
                  {item.subItems!.map((sub) => {
                    const isSubActive = matchesMenuItem(currentPath, sub);
                    const SubIcon = sub.icon;
                    return (
                      <Link
                        key={sub.to}
                        to={sub.to}
                        title={isCollapsed ? sub.label : undefined}
                        className={`
                          flex items-center gap-3 px-3 py-2 rounded-lg no-underline transition-all font-[family-name:var(--font-admin)]
                          ${isSubActive
                            ? 'bg-admin-accent/10 text-admin-accent font-semibold'
                            : 'text-admin-ink-soft hover:bg-admin-surface-2 hover:text-admin-ink'
                          }
                        `}
                      >
                        <SubIcon className="w-4 h-4 shrink-0" />
                        <span className="font-medium text-sm whitespace-nowrap">{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-admin-line-soft">
        <button
          onClick={toggleCollapse}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-admin-surface-2 hover:bg-admin-line-soft rounded-lg text-admin-ink transition-colors border-none cursor-pointer font-[family-name:var(--font-admin)]"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!isCollapsed && <span className="font-medium text-sm">Sembunyikan</span>}
        </button>
      </div>
    </aside>
  );
}