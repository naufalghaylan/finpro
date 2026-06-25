import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Eye, EyeOff } from 'lucide-react';
import type { Store, StoreAdminInput } from '../../types/store';
import { createStoreAdmin } from '../../api/store';
import { getStoreAdmins, assignStoreAdmin } from '../../api/user';

interface Props {
  store: Store;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ManageStoreAdminModal({ store, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<StoreAdminInput>({
    name: '',
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [availableAdmins, setAvailableAdmins] = useState<any[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState<string>('');
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    getStoreAdmins().then(res => {
      // Filter out admins already in this store, or admins who already have a store assigned
      const unassigned = res.data.filter((a: any) => a.storeId !== store.id);
      setAvailableAdmins(unassigned);
    }).catch(console.error);
  }, [store.id]);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) {
      setError('Semua field wajib diisi');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await createStoreAdmin(store.id, form);
      // Reset form on success or show success message
      setForm({ name: '', email: '', password: '' });
      onSuccess();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message || 'Gagal membuat admin');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedAdminId) return;
    setAssignLoading(true);
    setError(null);
    try {
      await assignStoreAdmin(Number(selectedAdminId), store.id);
      setSelectedAdminId('');
      onSuccess();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message || 'Gagal menetapkan admin');
    } finally {
      setAssignLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-admin-ink/40 backdrop-blur-sm animate-in fade-in duration-200 font-[family-name:var(--font-admin)]">
      <div className="bg-admin-surface rounded-2xl w-full max-w-lg p-8 shadow-xl border border-admin-line-soft max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-admin-ink mb-1">Kelola Admin Toko</h3>
        <p className="text-sm text-admin-ink-muted mb-6">Toko: <strong className="text-admin-ink">{store.name}</strong></p>
        
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-admin-ink mb-3">Admin Saat Ini</h4>
          {store.admins && store.admins.length > 0 ? (
            <ul className="pl-5 m-0 text-sm text-admin-ink-soft flex flex-col gap-1.5">
              {store.admins.map(a => (
                <li key={a.id}>{a.name} ({a.email})</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-admin-ink-muted italic m-0">Belum ada admin yang ditugaskan di toko ini.</p>
          )}
        </div>

        <hr className="my-6 border-0 border-t border-admin-line-soft" />

        <h4 className="text-sm font-semibold text-admin-ink mb-4">Pilih Admin yang Sudah Ada</h4>
        <div className="flex flex-col gap-3 mb-6">
          <select 
            value={selectedAdminId}
            onChange={e => setSelectedAdminId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all appearance-none cursor-pointer"
          >
            <option value="">-- Pilih Admin --</option>
            {availableAdmins.map(admin => (
              <option key={admin.id} value={admin.id}>{admin.name} ({admin.email}) {admin.storeId ? '- Sudah di toko lain' : ''}</option>
            ))}
          </select>
          <div className="flex justify-end">
            <button 
              onClick={handleAssign}
              disabled={!selectedAdminId || assignLoading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-admin-accent hover:bg-admin-accent-strong transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed shadow-sm whitespace-nowrap"
            >
              {assignLoading ? 'Menyimpan...' : 'Assign Admin'}
            </button>
          </div>
        </div>

        <hr className="my-6 border-0 border-t border-admin-line-soft" />

        <h4 className="text-sm font-semibold text-admin-ink mb-4">Atau Daftarkan Admin Baru</h4>
        {error && <p className="text-sm font-medium text-admin-red bg-admin-red-soft px-4 py-3 rounded-xl mb-4">{error}</p>}
        
        <div className="flex flex-col gap-4">
          <input 
            placeholder="Nama Lengkap Admin" 
            value={form.name} 
            onChange={e => setForm({ ...form, name: e.target.value })} 
            className="w-full px-4 py-2.5 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all" 
          />
          <input 
            type="email"
            placeholder="Alamat Email" 
            value={form.email} 
            onChange={e => setForm({ ...form, email: e.target.value })} 
            className="w-full px-4 py-2.5 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all" 
          />
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"}
              placeholder="Password Sementara" 
              value={form.password} 
              onChange={e => setForm({ ...form, password: e.target.value })} 
              className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all" 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-admin-ink-muted hover:text-admin-ink flex items-center justify-center p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button className="px-5 py-2.5 rounded-xl text-sm font-medium text-admin-ink-soft bg-admin-surface border border-admin-line hover:bg-admin-line-soft hover:text-admin-ink transition-all cursor-pointer" onClick={onClose}>Tutup</button>
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-admin-accent hover:bg-admin-accent-strong transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed shadow-sm" onClick={handleSubmit} disabled={loading}>{loading ? 'Menyimpan...' : 'Daftarkan Admin'}</button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
