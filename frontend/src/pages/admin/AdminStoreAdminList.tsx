import { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import { Eye, EyeOff, Plus, UserCog, Loader2 } from 'lucide-react';
import { getStoreAdmins, assignStoreAdmin, createStoreAdmin } from '../../api/user';
import { getStores } from '../../api/store';
import type { Store } from '../../types/store';

type StoreAdmin = {
  id: number;
  name: string;
  email: string;
  storeId: number | null;
  store: { id: number; name: string } | null;
  createdAt: string;
};

export default function AdminStoreAdminList() {
  const [admins, setAdmins] = useState<StoreAdmin[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<StoreAdmin | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', storeId: '' as number | '' });
  const [isCreating, setIsCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const result = await getStoreAdmins();
      setAdmins(result.data);
    } catch (error) {
      console.error('Failed to fetch admins', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStoresData = async () => {
    try {
      const result = await getStores(1, 100);
      setStores(result.data);
    } catch (error) {
      console.error('Failed to fetch stores for dropdown', error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAdmins();
    void fetchStoresData();
  }, []);

  const openAssignModal = (admin: StoreAdmin) => {
    setSelectedAdmin(admin);
    setSelectedStoreId(admin.storeId || '');
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;

    setIsSubmitting(true);
    try {
      await assignStoreAdmin(selectedAdmin.id, selectedStoreId === '' ? null : Number(selectedStoreId));
      setAssignModalOpen(false);
      fetchAdmins();
    } catch (e) {
      const error = e as AxiosError<{ message?: string }>;
      alert(error.response?.data?.message ?? 'Gagal menugaskan admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.email || !createForm.password) {
      alert('Nama, Email, dan Password wajib diisi');
      return;
    }
    
    setIsCreating(true);
    try {
      await createStoreAdmin({
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        storeId: createForm.storeId === '' ? null : Number(createForm.storeId)
      });
      setCreateModalOpen(false);
      setCreateForm({ name: '', email: '', password: '', storeId: '' });
      fetchAdmins();
    } catch (e) {
      const error = e as AxiosError<{ message?: string }>;
      alert(error.response?.data?.message ?? 'Gagal membuat admin');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="font-[family-name:var(--font-admin)]">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-admin-ink m-0">Daftar Store Admin</h3>
          <p className="text-sm text-admin-ink-muted mt-0.5 m-0">
            {loading ? 'Memuat...' : `${admins.length} admin terdaftar`}
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-admin-accent text-white
                     text-sm font-semibold border-none cursor-pointer shadow-md w-full sm:w-auto
                     hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Tambah Admin
        </button>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-admin-accent admin-spin" />
            <p className="text-sm text-admin-ink-muted m-0">Memuat data admin...</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block admin-table-wrap overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-admin-line-soft bg-admin-surface-2/40">
                    <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Nama</th>
                    <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Email</th>
                    <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Penugasan Toko</th>
                    <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Terdaftar</th>
                    <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-16 text-center text-admin-ink-muted">
                        <UserCog className="w-10 h-10 mx-auto mb-3 text-admin-line" />
                        <p className="m-0 font-medium">Belum ada Store Admin</p>
                        <p className="m-0 text-xs mt-1">Klik "Tambah Admin" untuk memulai.</p>
                      </td>
                    </tr>
                  ) : admins.map(admin => (
                    <tr key={admin.id} className="admin-table-row border-b border-admin-line-soft/50 last:border-b-0">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-admin-accent-soft text-admin-accent-strong font-bold text-sm shrink-0">
                            {admin.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-admin-ink">{admin.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-admin-ink-soft">{admin.email}</td>
                      <td className="px-5 py-4">
                        {admin.store ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-admin-amber-soft text-admin-amber">
                            <span className="w-1.5 h-1.5 rounded-full bg-admin-amber" />
                            {admin.store.name}
                          </span>
                        ) : (
                          <span className="text-admin-ink-muted text-xs italic">Belum Ditugaskan</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-admin-ink-soft text-xs">
                        {new Date(admin.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => openAssignModal(admin)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                     text-admin-blue bg-admin-blue-soft border-none cursor-pointer
                                     hover:bg-admin-blue/15 transition-all duration-150"
                        >
                          <UserCog className="w-3.5 h-3.5" />
                          {admin.storeId ? 'Ubah Penugasan' : 'Tugaskan Toko'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col divide-y divide-admin-line-soft/50">
              {admins.length === 0 ? (
                <div className="px-5 py-16 text-center text-admin-ink-muted">
                  <UserCog className="w-10 h-10 mx-auto mb-3 text-admin-line" />
                  <p className="m-0 font-medium">Belum ada Store Admin</p>
                  <p className="m-0 text-xs mt-1">Klik "Tambah Admin" untuk memulai.</p>
                </div>
              ) : admins.map(admin => (
                <div key={admin.id} className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-admin-accent-soft text-admin-accent-strong font-bold text-sm shrink-0">
                        {admin.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-admin-ink m-0 text-base">{admin.name}</h4>
                        <span className="text-xs text-admin-ink-soft block mt-0.5">{admin.email}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs mt-1">
                    {admin.store ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold bg-admin-amber-soft text-admin-amber">
                        <span className="w-1.5 h-1.5 rounded-full bg-admin-amber" />
                        {admin.store.name}
                      </span>
                    ) : (
                      <span className="text-admin-ink-muted italic">Belum Ditugaskan</span>
                    )}
                    <span className="text-admin-ink-soft">
                      {new Date(admin.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="mt-2 pt-3 border-t border-admin-line-soft/30">
                    <button
                      onClick={() => openAssignModal(admin)}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold text-admin-blue bg-admin-blue-soft hover:bg-admin-blue/20 transition-colors border-none cursor-pointer [font-family:inherit]"
                    >
                      <UserCog className="w-4 h-4" />
                      {admin.storeId ? 'Ubah Penugasan Toko' : 'Tugaskan ke Toko'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Assign Modal */}
      {assignModalOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center admin-backdrop-in"
             style={{ background: 'rgba(31,42,34,0.45)', backdropFilter: 'blur(8px)' }}
             onClick={() => setAssignModalOpen(false)}>
          <div className="admin-modal-in bg-admin-surface rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden border border-admin-line-soft"
               onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-admin-line-soft/50">
              <div>
                <h3 className="text-base font-bold text-admin-ink m-0">Tugaskan Admin</h3>
                <p className="text-xs text-admin-ink-muted mt-0.5 m-0">Pilih toko untuk: <strong>{selectedAdmin.name}</strong></p>
              </div>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center text-admin-ink-muted bg-transparent border-none cursor-pointer hover:bg-admin-surface-2 transition-colors" onClick={() => setAssignModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAssignSubmit}>
              <div className="px-6 py-5">
                <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">Pilih Toko</label>
                <select
                  value={selectedStoreId}
                  onChange={e => setSelectedStoreId(e.target.value as unknown as number | '')}
                  className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                             focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
                >
                  <option value="">— Lepas Penugasan (Unassign) —</option>
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 px-6 py-4 border-t border-admin-line-soft/50 bg-admin-surface-2/30">
                <button type="button" onClick={() => setAssignModalOpen(false)}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-admin-ink-soft bg-transparent border border-admin-line-soft cursor-pointer hover:bg-admin-surface-2 transition-all">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting}
                        className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-admin-accent border-none cursor-pointer hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center admin-backdrop-in"
             style={{ background: 'rgba(31,42,34,0.45)', backdropFilter: 'blur(8px)' }}
             onClick={() => setCreateModalOpen(false)}>
          <div className="admin-modal-in bg-admin-surface rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden border border-admin-line-soft"
               onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-admin-line-soft/50">
              <div>
                <h3 className="text-base font-bold text-admin-ink m-0">Tambah Admin Baru</h3>
                <p className="text-xs text-admin-ink-muted mt-0.5 m-0">Buat akun Store Admin baru.</p>
              </div>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center text-admin-ink-muted bg-transparent border-none cursor-pointer hover:bg-admin-surface-2 transition-colors" onClick={() => setCreateModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="px-6 py-5 flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">Nama Lengkap</label>
                  <input
                    value={createForm.name}
                    onChange={e => setCreateForm({...createForm, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                               focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">Email</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={e => setCreateForm({...createForm, email: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                               focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">Password Sementara</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={createForm.password}
                      onChange={e => setCreateForm({...createForm, password: e.target.value})}
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                                 focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
                      required minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-transparent border-none cursor-pointer text-admin-ink-muted hover:text-admin-ink transition-colors flex items-center"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">Penugasan Toko (Opsional)</label>
                  <select
                    value={createForm.storeId}
                    onChange={e => setCreateForm({...createForm, storeId: e.target.value as unknown as number | ''})}
                    className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                               focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
                  >
                    <option value="">— Biarkan Kosong —</option>
                    {stores.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 px-6 py-4 border-t border-admin-line-soft/50 bg-admin-surface-2/30">
                <button type="button" onClick={() => setCreateModalOpen(false)}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-admin-ink-soft bg-transparent border border-admin-line-soft cursor-pointer hover:bg-admin-surface-2 transition-all">
                  Batal
                </button>
                <button type="submit" disabled={isCreating}
                        className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-admin-accent border-none cursor-pointer hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  {isCreating ? 'Menyimpan...' : 'Buat Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
