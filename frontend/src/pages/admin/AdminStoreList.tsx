import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { useAuthStore } from '../../store/authStore';
import { getStores, deleteStore } from '../../api/store';
import type { Store } from '../../types/store';
import StoreFormModal from '../../components/admin/StoreFormModal';
import ManageStoreAdminModal from '../../components/admin/ManageStoreAdminModal';
import ConfirmationModal from '../../components/modal/ConfirmationModal';
import { Plus, Pencil, Users, Trash2, MapPin, Radio, Loader2, Settings } from 'lucide-react';

export default function AdminStoreList() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [stores, setStores] = useState<Store[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [selectedStoreForAdmin, setSelectedStoreForAdmin] = useState<Store | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Store | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const result = await getStores(page, 10);
      setStores(result.data);
      setTotalPages(result.pagination.totalPages);
      
      setSelectedStoreForAdmin(prev => {
        if (!prev) return null;
        const updated = result.data.find((s: Store) => s.id === prev.id);
        return updated || prev;
      });
    } catch (error) {
      console.error('Failed to fetch stores', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const openCreate = () => {
    setEditingStore(null);
    setFormModalOpen(true);
  };

  const openEdit = (store: Store) => {
    setEditingStore(store);
    setFormModalOpen(true);
  };

  const openManageAdmin = (store: Store) => {
    setSelectedStoreForAdmin(store);
    setAdminModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteStore(deleteTarget.id);
      setDeleteTarget(null);
      fetchStores();
    } catch (e) {
      const err = e as AxiosError<{ message?: string }>;
      alert(err.response?.data?.message ?? 'Gagal menghapus');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="font-[family-name:var(--font-admin)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-admin-ink m-0">Daftar Toko</h3>
          <p className="text-sm text-admin-ink-muted mt-0.5 m-0">
            {loading ? 'Memuat...' : `${stores.length} toko ditampilkan`}
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-admin-accent text-white
                       text-sm font-semibold border-none cursor-pointer shadow-md
                       hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Tambah Toko
          </button>
        )}
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-admin-accent admin-spin" />
            <p className="text-sm text-admin-ink-muted m-0">Memuat data toko...</p>
          </div>
        ) : (
          <div className="admin-table-wrap overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-admin-line-soft bg-admin-surface-2/40">
                  <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Nama Toko</th>
                  <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Lokasi</th>
                  <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Radius</th>
                  <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider">Admin</th>
                  {isSuperAdmin && (
                    <th className="px-5 py-3.5 font-semibold text-admin-ink-soft text-xs uppercase tracking-wider text-right">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {stores.map(store => (
                  <tr key={store.id} className="admin-table-row border-b border-admin-line-soft/50 last:border-b-0">
                    <td className="px-5 py-4 font-semibold text-admin-ink">{store.name}</td>
                    <td className="px-5 py-4 text-admin-ink-soft">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-admin-ink-muted" />
                        {store.city}, {store.province}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-admin-ink-soft">
                        <Radio className="w-3.5 h-3.5 text-admin-ink-muted" />
                        {store.serviceRadius} km
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`
                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                        ${store.status
                          ? 'bg-admin-green-soft text-admin-green'
                          : 'bg-admin-red-soft text-admin-red'
                        }
                      `}>
                        <span className={`w-1.5 h-1.5 rounded-full ${store.status ? 'bg-admin-green' : 'bg-admin-red'}`} />
                        {store.status ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-admin-blue-soft text-admin-blue">
                        <Users className="w-3 h-3" />
                        {store._count?.admins ?? 0}
                      </span>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => openEdit(store)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                       text-admin-ink-soft bg-transparent border border-admin-line-soft cursor-pointer
                                       hover:bg-admin-surface-2 hover:text-admin-ink transition-all duration-150"
                            title="Edit Cepat"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Ubah Cepat
                          </button>
                          <Link
                            to={`/admin/stores/${store.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                       text-admin-ink-soft bg-transparent border border-admin-line-soft cursor-pointer no-underline
                                       hover:bg-admin-surface-2 hover:text-admin-ink transition-all duration-150"
                            title="Detail & Kelola"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            Kelola
                          </Link>
                          <button
                            onClick={() => openManageAdmin(store)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                       text-admin-blue bg-admin-blue-soft border-none cursor-pointer
                                       hover:bg-admin-blue/15 transition-all duration-150"
                            title="Kelola Admin"
                          >
                            <Users className="w-3.5 h-3.5" />
                            Admin
                          </button>
                          <button
                            onClick={() => setDeleteTarget(store)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg
                                       text-admin-red bg-transparent border-none cursor-pointer
                                       hover:bg-admin-red-soft transition-all duration-150"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-admin-line-soft/50 bg-admin-surface-2/20">
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                         text-admin-ink-soft bg-admin-surface border border-admin-line-soft cursor-pointer
                         hover:bg-admin-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              ← Sebelumnya
            </button>
            <span className="text-sm text-admin-ink-muted font-medium">
              Halaman <span className="text-admin-ink font-semibold">{page}</span> dari {totalPages}
            </span>
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                         text-admin-ink-soft bg-admin-surface border border-admin-line-soft cursor-pointer
                         hover:bg-admin-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Selanjutnya →
            </button>
          </div>
        )}
      </div>

      {formModalOpen && (
        <StoreFormModal 
          store={editingStore} 
          onClose={() => setFormModalOpen(false)} 
          onSuccess={fetchStores} 
        />
      )}

      {adminModalOpen && selectedStoreForAdmin && (
        <ManageStoreAdminModal
          store={selectedStoreForAdmin}
          onClose={() => setAdminModalOpen(false)}
          onSuccess={fetchStores}
        />
      )}

      <ConfirmationModal
        open={deleteTarget !== null}
        title="Hapus Toko"
        message={deleteTarget ? `Hapus toko "${deleteTarget.name}"? Tindakan ini tidak bisa dibatalkan.` : ''}
        confirmLabel="Ya, hapus"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
