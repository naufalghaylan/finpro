import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';

export default function AdminDashboardLayout() {
  const { user, isAuthenticated } = useAuthStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  }

  // Ensure only SUPER_ADMIN or STORE_ADMIN can access this layout
  if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'STORE_ADMIN') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-[100svh] bg-admin-surface-2 font-[family-name:var(--font-admin)]">
      {/* Sidebar Component */}
      <AdminSidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />

      {/* Main Content Area */}
      <div 
        className="flex flex-col flex-1 transition-all duration-300 min-h-[100svh]"
        style={{ marginLeft: isSidebarCollapsed ? '80px' : '260px' }}
      >
        {/* Top Navigation Bar */}
        <AdminTopbar />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6 lg:p-8 bg-transparent overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
