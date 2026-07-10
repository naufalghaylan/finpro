import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { Loader2, UserCog, X } from 'lucide-react';
import { getStoreAdmins, assignStoreAdmin } from '../../api/user';
import { getStores } from '../../api/store';
import { AdminModal } from '../../components/admin/AdminModal';
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
      const adminsResult = await getStoreAdmins();
      setAllAdmins(adminsResult.data);
      setAdmins(adminsResult.data.filter((admin: StoreAdmin) => admin.storeId === Number(id)));

      const storesResult = await getStores(1, 100);
      const currentStore = storesResult.data.find((candidate: Store) => candidate.id === Number(id));
      if (currentStore) setStore(currentStore);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      void fetchData();
    }
  }, [id]);

  const handleAssignSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedAdminId) return;

    setIsSubmitting(true);
    try {
      await assignStoreAdmin(Number(selectedAdminId), Number(id));
      setAssignModalOpen(false);
      setSelectedAdminId('');
      void fetchData();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      alert(axiosError.response?.data?.message ?? 'Gagal menugaskan admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnassign = async (adminId: number) => {
    if (!confirm('Lepas penugasan admin ini dari toko ini?')) return;

    setIsSubmitting(true);
    try {
      await assignStoreAdmin(adminId, null);
      void fetchData();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      alert(axiosError.response?.data?.message ?? 'Gagal melepas admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableAdmins = allAdmins.filter((admin) => admin.storeId !== Number(id));

  return (
    <div className="font-[family-name:var(--font-admin)] p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="m-0 text-lg font-bold text-admin-ink wrap-break-word">
            Admin Toko {store ? `- ${store.name}` : ''}
          </h3>
          <p className="m-0 mt-0.5 text-sm text-admin-ink-muted">
            {loading ? 'Memuat...' : `${admins.length} admin ditugaskan di toko ini`}
          </p>
        </div>
        <button
          onClick={() => setAssignModalOpen(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-admin-accent px-5 py-2.5 text-sm font-semibold text-white
                     border-none cursor-pointer shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:w-auto"
        >
          <UserCog className="h-4 w-4" />
          Tugaskan Admin ke Toko
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 className="h-8 w-8 text-admin-accent admin-spin" />
            <p className="m-0 text-sm text-admin-ink-muted">Memuat data admin...</p>
          </div>
        ) : (
          <div className="admin-table-wrap overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-admin-line-soft bg-admin-surface-2/40">
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-admin-ink-soft">Nama</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-admin-ink-soft">Email</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-admin-ink-soft">Terdaftar</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-admin-ink-soft">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {admins.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-16 text-center text-admin-ink-muted">
                      <UserCog className="mx-auto mb-3 h-10 w-10 text-admin-line" />
                      <p className="m-0 font-medium">Belum ada admin ditugaskan ke toko ini</p>
                    </td>
                  </tr>
                ) : admins.map((admin) => (
                  <tr key={admin.id} className="admin-table-row border-b border-admin-line-soft/50 last:border-b-0">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-admin-accent-soft text-sm font-bold text-admin-accent-strong">
                          {admin.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-admin-ink">{admin.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-admin-ink-soft">{admin.email}</td>
                    <td className="px-5 py-4 text-xs text-admin-ink-soft">
                      {new Date(admin.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => void handleUnassign(admin.id)}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-admin-red-soft px-3 py-1.5 text-xs font-medium
                                   text-admin-red border-none cursor-pointer transition-all duration-150 hover:bg-admin-red/15 disabled:opacity-50"
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
        <AdminModal
          onClose={() => setAssignModalOpen(false)}
          busy={isSubmitting}
          labelledBy="assign-store-admin-title"
        >
          {(closeModal) => (
            <>
              <div className="flex items-start justify-between gap-4 border-b border-admin-line-soft/50 px-5 py-4 sm:px-6 sm:py-5">
                <div className="min-w-0">
                  <h3 id="assign-store-admin-title" className="m-0 text-base font-bold text-admin-ink wrap-break-word">
                    Tugaskan Admin ke Toko
                  </h3>
                  <p className="m-0 mt-0.5 text-xs text-admin-ink-muted wrap-break-word">
                    Pilih admin yang akan ditugaskan ke {store?.name}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isSubmitting}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-admin-line-soft bg-transparent text-admin-ink-muted
                             cursor-pointer transition-colors hover:bg-admin-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={closeModal}
                  aria-label="Tutup penugasan admin toko"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleAssignSubmit}>
                <div className="px-5 py-5 sm:px-6">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-admin-ink-soft">Pilih Admin</label>
                  <select
                    value={selectedAdminId}
                    onChange={(event) => setSelectedAdminId(event.target.value === '' ? '' : Number(event.target.value))}
                    className="w-full rounded-xl border border-admin-line bg-admin-surface px-4 py-3 text-sm text-admin-ink
                               transition-all focus:border-admin-accent focus:outline-none focus:ring-2 focus:ring-admin-accent/30"
                    required
                  >
                    <option value="">Pilih Admin</option>
                    {availableAdmins.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.name} ({admin.email}) {admin.store ? `- Terdaftar di ${admin.store.name}` : '- Belum Ditugaskan'}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-admin-ink-muted">
                    Peringatan: Menugaskan admin yang sudah memiliki toko akan mencabut penugasan sebelumnya.
                  </p>
                </div>
                <div className="flex flex-col-reverse gap-2 border-t border-admin-line-soft/50 bg-admin-surface-2/30 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-admin-line-soft bg-transparent px-4 py-2 text-sm font-medium text-admin-ink-soft
                               cursor-pointer transition-all hover:bg-admin-surface-2 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedAdminId}
                    className="w-full rounded-xl border-none bg-admin-accent px-5 py-2 text-sm font-semibold text-white
                               cursor-pointer transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Tugaskan'}
                  </button>
                </div>
              </form>
            </>
          )}
        </AdminModal>
      )}
    </div>
  );
}
