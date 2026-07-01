import { useAuthStore } from '../../store/authStore';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AdminTopbar() {
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
    <header className="h-[72px] bg-admin-surface border-b border-admin-line-soft flex items-center justify-between px-6 sticky top-0 z-[50]">
      <div>
        <h1 className="text-xl font-bold text-admin-ink m-0 font-[family-name:var(--font-admin-display)] tracking-tight">
          PanenMart Admin
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end font-[family-name:var(--font-admin)]">
              <span className="text-sm font-semibold text-admin-ink leading-tight">{user.name}</span>
              <span className="text-xs text-admin-ink-soft uppercase tracking-wider">{user.role.replace('_', ' ')}</span>
            </div>
            
            <div className="w-[40px] h-[40px] rounded-full bg-admin-accent text-white flex items-center justify-center font-bold text-lg overflow-hidden shrink-0 border-2 border-admin-surface shadow-sm">
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

            <div className="w-px h-8 bg-admin-line-soft mx-2"></div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-admin-red hover:bg-admin-red-soft rounded-lg transition-colors border-none cursor-pointer bg-transparent font-[family-name:var(--font-admin)]"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
