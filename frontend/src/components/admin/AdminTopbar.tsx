import { useAuthStore } from '../../store/authStore';
import { LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminTopbarProps {
  onMenuClick: () => void;
}

export function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const getInitial = (name?: string) => {
    if (!name) return 'A';
    return name.charAt(0).toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header
      className="fixed top-0 right-0 z-[55] h-[72px] border-b border-admin-line-soft bg-admin-surface flex items-center justify-between px-4 lg:px-6 admin-mobile-left-0"
      style={{ left: 'var(--admin-sidebar-width, 260px)' }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-admin-ink hover:bg-admin-surface-2 rounded-lg transition-colors border-none cursor-pointer bg-transparent shrink-0"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg sm:text-xl font-bold text-admin-ink m-0 font-[family-name:var(--font-admin-display)] tracking-tight whitespace-nowrap truncate">
          PanenMart Admin
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {user && (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex flex-col items-end font-[family-name:var(--font-admin)]">
              <span className="text-sm font-semibold text-admin-ink leading-tight truncate max-w-[120px]">{user.name}</span>
              <span className="text-xs text-admin-ink-soft uppercase tracking-wider">{user.role.replace('_', ' ')}</span>
            </div>
            
            <div className="w-[36px] h-[36px] sm:w-[40px] sm:h-[40px] rounded-full bg-admin-accent text-white flex items-center justify-center font-bold text-sm sm:text-lg overflow-hidden shrink-0 border-2 border-admin-surface shadow-sm">
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

            <div className="w-px h-6 sm:h-8 bg-admin-line-soft mx-1 sm:mx-2"></div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 text-sm font-semibold text-admin-red hover:bg-admin-red-soft rounded-lg transition-colors border-none cursor-pointer bg-transparent font-[family-name:var(--font-admin)]"
              title="Keluar"
            >
              <LogOut className="w-5 h-5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

