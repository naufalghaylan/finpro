import { useState, useEffect, type FormEvent } from 'react';
import { AxiosError } from 'axios';
import type { Store } from '../../types/store';
import { useParams, useNavigate } from 'react-router-dom';
import { getStoreById, updateStore } from '../../api/store';

import { useToast } from '../../components/common/Toast';
import AdminStockList from './AdminStockList';
import AdminDiscountList from './AdminDiscountList';
import AdminOrderList from './AdminOrderList';
import { Info, Package, Tag, Loader2, ClipboardList } from 'lucide-react';
import { AdminStoreDetailsForm, type StoreDetailFormData } from '../../components/admin/AdminStoreDetailsForm';

export default function AdminStoreDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'details' | 'stocks' | 'discounts' | 'orders'>('details');
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<StoreDetailFormData>({
    name: '',
    address: '',
    phone: '',
    description: '',
    latitude: -6.2088,
    longitude: 106.8456,
    serviceRadius: 50,
  });
  
  const [position, setPosition] = useState<[number, number]>([-6.2088, 106.8456]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData(f => ({ ...f, latitude: position[0], longitude: position[1] }));
  }, [position]);

  const fetchStore = async () => {
    try {
      setLoading(true);
      const res = await getStoreById(Number(id));
      setStore(res.data);
      setFormData({
        name: res.data.name,
        address: res.data.address,
        phone: res.data.phone || '',
        description: res.data.description || '',
        latitude: res.data.latitude || -6.2088,
        longitude: res.data.longitude || 106.8456,
        serviceRadius: res.data.serviceRadius || 50,
      });
      setPosition([res.data.latitude || -6.2088, res.data.longitude || 106.8456]);
    } catch (e) {
      const error = e as AxiosError<{ message?: string }>;
      showToast(error.response?.data?.message || 'Gagal mengambil data toko', 'error');
      if (error.response?.status === 403) navigate('/admin/stores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchStore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleUpdateStore = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateStore(Number(id), formData);
      showToast('Detail toko berhasil diperbarui', 'success');
      fetchStore();
    } catch (e) {
      const error = e as AxiosError<{ message?: string }>;
      showToast(error.response?.data?.message || 'Gagal memperbarui toko', 'error');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: 'details' as const, label: 'Detail Toko', icon: Info },
    { key: 'stocks' as const, label: 'Manajemen Stok', icon: Package },
    { key: 'discounts' as const, label: 'Manajemen Diskon', icon: Tag },
    { key: 'orders' as const, label: 'Pesanan Toko', icon: ClipboardList },
  ];

  if (loading) {
    return (
      <div className="font-[family-name:var(--font-admin)] flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-admin-accent admin-spin" />
        <p className="text-sm text-admin-ink-muted m-0">Memuat data toko...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="font-[family-name:var(--font-admin)] text-center py-20">
        <p className="text-admin-ink-muted">Toko tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="font-[family-name:var(--font-admin)]">
      {/* Store Name Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-admin-ink m-0">{store.name}</h3>
        <p className="text-sm text-admin-ink-muted mt-0.5 m-0">{store.city}, {store.province}</p>
      </div>

      {/* Pill Tabs */}
      <div className="flex gap-2 p-1.5 mb-8 rounded-2xl bg-admin-surface-2/70 w-fit">
        {tabs.map(tab => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                border-none cursor-pointer transition-all duration-200
                ${isActive
                  ? 'bg-admin-surface text-admin-ink shadow-sm'
                  : 'bg-transparent text-admin-ink-soft hover:text-admin-ink hover:bg-admin-surface/50'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="admin-fade-in" key={activeTab}>
        {activeTab === 'details' && (
          <AdminStoreDetailsForm
            formData={formData}
            position={position}
            saving={saving}
            setFormData={setFormData}
            setPosition={setPosition}
            onSubmit={handleUpdateStore}
          />
        )}

        {activeTab === 'stocks' && <AdminStockList storeId={Number(id)} />}
        {activeTab === 'discounts' && <AdminDiscountList storeId={Number(id)} />}
        {activeTab === 'orders' && <AdminOrderList storeId={Number(id)} />}
      </div>
    </div>
  );
}
