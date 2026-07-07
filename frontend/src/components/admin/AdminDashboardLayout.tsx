import { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';

const ADMIN_TOPBAR_HEIGHT = '72px';
const ADMIN_SIDEBAR_EXPANDED_WIDTH = '260px';
const ADMIN_SIDEBAR_COLLAPSED_WIDTH = '80px';

export default function AdminDashboardLayout() {
  const { user, isAuthenticated } = useAuthStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const sidebarWidth = isSidebarCollapsed
    ? ADMIN_SIDEBAR_COLLAPSED_WIDTH
    : ADMIN_SIDEBAR_EXPANDED_WIDTH;

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--admin-topbar-height', ADMIN_TOPBAR_HEIGHT);
    root.style.setProperty('--admin-sidebar-width', sidebarWidth);

    return () => {
      root.style.removeProperty('--admin-topbar-height');
      root.style.removeProperty('--admin-sidebar-width');
    };
  }, [sidebarWidth]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  }

  if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'STORE_ADMIN') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-[100svh] bg-admin-surface-2 font-[family-name:var(--font-admin)]">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[55] lg:hidden admin-backdrop-in" 
          onClick={() => setIsMobileOpen(false)} 
        />
      )}

      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <div
        className="flex flex-col flex-1 transition-all duration-300 min-h-[100svh] admin-mobile-ml-0"
        style={{ marginLeft: sidebarWidth, paddingTop: ADMIN_TOPBAR_HEIGHT }}
      >
        <AdminTopbar onMenuClick={() => setIsMobileOpen(true)} />

        <main className="flex-1 p-6 lg:p-8 bg-transparent overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
