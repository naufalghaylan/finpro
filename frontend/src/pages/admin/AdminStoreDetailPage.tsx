import { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import type { Store } from '../../types/store';
import { useParams, useNavigate } from 'react-router-dom';
import { getStoreById, updateStore } from '../../api/store';

import { useToast } from '../../components/common/Toast';
import AdminStockList from './AdminStockList';
import AdminDiscountList from './AdminDiscountList';
import { Info, Package, Tag, Loader2, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon issue in React
delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }: { position: [number, number], setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function AdminStoreDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'details' | 'stocks' | 'discounts'>('details');
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
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

  const handleUpdateStore = async (e: React.FormEvent) => {
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
          <div className="rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm p-6 md:p-8 max-w-4xl">
            <h4 className="text-base font-bold text-admin-ink m-0 mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-admin-accent" />
              Ubah Detail Toko & Lokasi
            </h4>
            <form onSubmit={handleUpdateStore} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">Nama Toko</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                             focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">Alamat Lengkap</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                             focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">Nomor Telepon</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                             focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">Deskripsi</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink resize-y
                             focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
                />
              </div>
              </div>

              <div className="flex flex-col gap-5">
                <div>
                  <label className="block text-xs font-semibold text-admin-ink-soft uppercase tracking-wider mb-2">
                    Tentukan Titik Koordinat
                  </label>
                  <p className="text-[11px] text-admin-ink-muted mb-3 leading-relaxed">
                    Klik pada peta untuk mengubah lokasi toko. Ini akan memperbarui latitude dan longitude secara otomatis.
                  </p>
                  
                  <div className="h-[240px] w-full rounded-xl overflow-hidden border border-admin-line bg-admin-surface-2 mb-4 z-0 relative">
                    <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <LocationMarker position={position} setPosition={setPosition} />
                    </MapContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-admin-ink-soft uppercase tracking-wider mb-1">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={formData.latitude}
                        readOnly
                        className="w-full px-3 py-2 rounded-lg border border-admin-line bg-admin-surface-2 text-xs text-admin-ink-soft cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-admin-ink-soft uppercase tracking-wider mb-1">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={formData.longitude}
                        readOnly
                        className="w-full px-3 py-2 rounded-lg border border-admin-line bg-admin-surface-2 text-xs text-admin-ink-soft cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-admin-ink-soft uppercase tracking-wider mb-1">Radius Layanan (km)</label>
                    <input
                      type="number"
                      value={formData.serviceRadius}
                      onChange={(e) => setFormData({...formData, serviceRadius: Number(e.target.value)})}
                      className="w-full px-4 py-3 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink
                                 focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2 mt-auto">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full inline-flex justify-center items-center gap-2 px-6 py-3 rounded-xl bg-admin-accent text-white
                               text-sm font-semibold border-none cursor-pointer shadow-md
                               hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 admin-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      'Simpan Perubahan'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'stocks' && <AdminStockList storeId={Number(id)} />}
        {activeTab === 'discounts' && <AdminDiscountList storeId={Number(id)} />}
      </div>
    </div>
  );
}
