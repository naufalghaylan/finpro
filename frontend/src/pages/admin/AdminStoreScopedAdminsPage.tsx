import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { UserCog, Loader2 } from 'lucide-react';
import { getStoreAdmins, assignStoreAdmin } from '../../api/user';
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

export default function AdminStoreScopedAdminsPage() {
  const { id } = useParams<{ id: string }>();
  const [admins, setAdmins] = useState<StoreAdmin[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [allAdmins, setAllAdmins] = useState<StoreAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get all admins
      const adminsResult = await getStoreAdmins();
      setAllAdmins(adminsResult.data);
      
      // Filter admins that are assigned to this store
      const storeAdmins = adminsResult.data.filter((admin: StoreAdmin) => admin.storeId === Number(id));
      setAdmins(storeAdmins);

      // Get store details for the header
      const storesResult = await getStores(1, 100);
      const currentStore = storesResult.data.find((s: Store) => s.id === Number(id));
      if (currentStore) setStore(currentStore);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchData();
    }
  }, [id]);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdminId) return;

    setIsSubmitting(true);
    try {
      // Assign the selected admin to this store
      await assignStoreAdmin(Number(selectedAdminId), Number(id));
      setAssignModalOpen(false);
      setSelectedAdminId('');
      fetchData();
    } catch (e) {
      const error = e as AxiosError<{ message?: string }>;
      alert(error.response?.data?.message ?? 'Gagal menugaskan admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnassign = async (adminId: number) => {
    if (!confirm('Lepas penugasan admin ini dari toko ini?')) return;
    
    setIsSubmitting(true);
    try {
      await assignStoreAdmin(adminId, null);
      fetchData();
    } catch (e) {
      const error = e as AxiosError<{ message?: string }>;
      alert(error.response?.data?.message ?? 'Gagal melepas admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter admins that are not currently assigned to this store
  const availableAdmins = allAdmins.filter(admin => admin.storeId !== Number(id));

  return (
    <div className="font-[family-name:var(--font-admin)] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-admin-ink m-0">Admin Toko {store ? `- ${store.name}` : ''}</h3>
          <p className="text-sm text-admin-ink-muted mt-0.5 m-0">
            {loading ? 'Memuat...' : `${admins.length} admin ditugaskan di toko ini`}
          </p>
        </div>
        <button
          onClick={() => setAssignModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-admin-accent text-white
                     text-sm font-semibold border-none cursor-pointer shadow-md
                     hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
          <UserCog className="w-4 h-4" />
          Tugaskan Admin ke Toko
        </button>
      </div>

      <div className="rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-admin-accent admin-spin" />
            <p className="text-sm text-admin-ink-muted m-0">Memuat data admin...</p>
          </div>
        ) : (
          <div className="admin-table-wrap overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-admin-line-soft bg-admin-surface-2/40">
                  <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Nama</th>
                  <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Terdaftar</th>
                  <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {admins.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-16 text-center text-admin-ink-muted">
                      <UserCog className="w-10 h-10 mx-auto mb-3 text-admin-line" />
                      <p className="m-0 font-medium">Belum ada admin ditugaskan ke toko ini</p>
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
                    <td className="px-5 py-4 text-admin-ink-soft text-xs">
                      {new Date(admin.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleUnassign(admin.id)}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                   text-admin-red bg-admin-red-soft border-none cursor-pointer
                                   hover:bg-admin-red/15 transition-all duration-150 disabled:opacity-50"
                      >
                        Lepas Penugasan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center admin-backdrop-in"
             style={{ background: 'rgba(31,42,34,0.45)', backdropFilter: 'blur(8px)' }}
             onClick={() => setAssignModalOpen(false)}>
          <div className="admin-modal-in bg-admin-surface rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden border border-admin-line-soft"
               onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-admin-line-soft/50">
              <div>
                <h3 className="text-base font-bold text-admin-ink m-0">Tugaskan Admin ke Toko</h3>
                <p className="text-xs text-admin-ink-muted mt-0.5 m-0">Pilih admin yang akan ditugaskan ke {store?.name}</p>
              </div>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center text-admin-ink-muted bg-transparent border-none cursor-pointer hover:bg-admin-surface-2 transition-colors" onClick={() => setAssignModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAssignSubmit}>
              <div className="px-6 py-5">
                <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">Pilih Admin</label>
                <select
                  value={selectedAdminId}
                  onChange={e => setSelectedAdminId(e.target.value as unknown as number)}
                  className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                             focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
                  required
                >
                  <option value="">— Pilih Admin —</option>
                  {availableAdmins.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.email}) {a.store ? `- Terdaftar di ${a.store.name}` : '- Belum Ditugaskan'}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-admin-ink-muted mt-2">Peringatan: Menugaskan admin yang sudah memiliki toko akan mencabut penugasan sebelumnya.</p>
              </div>
              <div className="flex justify-end gap-2 px-6 py-4 border-t border-admin-line-soft/50 bg-admin-surface-2/30">
                <button type="button" onClick={() => setAssignModalOpen(false)}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-admin-ink-soft bg-transparent border border-admin-line-soft cursor-pointer hover:bg-admin-surface-2 transition-all">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting || !selectedAdminId}
                        className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-admin-accent border-none cursor-pointer hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  {isSubmitting ? 'Menyimpan...' : 'Tugaskan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
