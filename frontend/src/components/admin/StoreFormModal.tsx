import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Store, StoreInput } from '../../types/store';
import { createStore, updateStore } from '../../api/store';
import { getProvinces, getCities } from '../../api/rajaongkir';
import type { RajaOngkirProvince, RajaOngkirCity } from '../../api/rajaongkir';

// Fix leaflet icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Props {
  store?: Store | null;
  onClose: () => void;
  onSuccess: () => void;
}

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

export default function StoreFormModal({ store, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<StoreInput>({
    name: store?.name || '',
    description: store?.description || '',
    latitude: store?.latitude || -6.2088, // Default Jakarta
    longitude: store?.longitude || 106.8456,
    address: store?.address || '',
    city: store?.city || '',
    cityId: store?.cityId || '',
    province: store?.province || '',
    provinceId: store?.provinceId || '',
    postalCode: store?.postalCode || '',
    phone: store?.phone || '',
    serviceRadius: store?.serviceRadius || 50,
    status: store?.status ?? true,
  });

  const [position, setPosition] = useState<[number, number]>([form.latitude, form.longitude]);
  const [provinces, setProvinces] = useState<RajaOngkirProvince[]>([]);
  const [cities, setCities] = useState<RajaOngkirCity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProvinces().then(setProvinces).catch(console.error);
  }, []);

  useEffect(() => {
    if (form.provinceId) {
      getCities(form.provinceId).then(setCities).catch(console.error);
    } else {
      setCities([]);
    }
  }, [form.provinceId]);

  useEffect(() => {
    setForm(f => ({ ...f, latitude: position[0], longitude: position[1] }));
  }, [position]);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      if (store) {
        await updateStore(store.id, form);
      } else {
        await createStore(form);
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-admin-ink/40 backdrop-blur-sm animate-in fade-in duration-200 font-[family-name:var(--font-admin)]">
      <div className="bg-admin-surface rounded-2xl w-full max-w-4xl p-8 shadow-xl border border-admin-line-soft max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-admin-ink mb-5">{store ? 'Edit Toko' : 'Tambah Toko Baru'}</h3>
        
        {error && <p className="text-sm font-medium text-admin-red bg-admin-red-soft px-4 py-3 rounded-xl mb-4">{error}</p>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-3">
            <input placeholder="Nama Toko" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all" />
            <input placeholder="No. Telepon" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all" />
            
            <select 
              value={form.provinceId} 
              onChange={e => {
                const selected = provinces.find(p => p.province_id === e.target.value);
                setForm({ ...form, provinceId: e.target.value, province: selected?.province || '', cityId: '', city: '' });
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
            >
              <option value="">Pilih Provinsi</option>
              {provinces.map(p => <option key={p.province_id} value={p.province_id}>{p.province}</option>)}
            </select>

            <select 
              value={form.cityId} 
              onChange={e => {
                const selected = cities.find(c => c.city_id === e.target.value);
                setForm({ ...form, cityId: e.target.value, city: selected ? `${selected.type} ${selected.city_name}` : '' });
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all disabled:opacity-50 disabled:bg-admin-surface-2"
              disabled={!form.provinceId}
            >
              <option value="">Pilih Kota/Kabupaten</option>
              {cities.map(c => <option key={c.city_id} value={c.city_id}>{c.type} {c.city_name}</option>)}
            </select>

            <textarea placeholder="Alamat Lengkap" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all min-h-[80px]" />
            
            <div className="flex gap-3 items-center">
              <label className="text-sm font-medium text-admin-ink-soft">Radius Layanan (km):</label>
              <input type="number" value={form.serviceRadius} onChange={e => setForm({ ...form, serviceRadius: Number(e.target.value) })} className="w-24 px-4 py-2 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all" />
            </div>

            <div className="flex gap-3 items-center mt-1">
              <label className="text-sm font-medium text-admin-ink-soft">Status Aktif:</label>
              <input type="checkbox" checked={form.status} onChange={e => setForm({ ...form, status: e.target.checked })} className="w-4 h-4 text-admin-accent focus:ring-admin-accent/30 cursor-pointer rounded" />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="m-0 font-semibold text-admin-ink text-sm">Tentukan Titik Koordinat</p>
            <p className="m-0 text-xs text-admin-ink-muted">Klik pada peta untuk mengubah lokasi toko. Jika ada perbedaan, sistem kami juga akan mencoba menyesuaikan otomatis.</p>
            <div className="h-[300px] w-full rounded-xl overflow-hidden border border-admin-line-soft">
              <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={position} setPosition={setPosition} />
              </MapContainer>
            </div>
            <div className="flex gap-3">
              <input value={form.latitude} readOnly className="w-full px-4 py-2.5 rounded-xl border border-admin-line bg-admin-surface-2 text-sm text-admin-ink-soft" />
              <input value={form.longitude} readOnly className="w-full px-4 py-2.5 rounded-xl border border-admin-line bg-admin-surface-2 text-sm text-admin-ink-soft" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button className="px-5 py-2.5 rounded-xl text-sm font-medium text-admin-ink-soft bg-admin-surface border border-admin-line hover:bg-admin-line-soft hover:text-admin-ink transition-all cursor-pointer" onClick={onClose}>Batal</button>
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-admin-accent hover:bg-admin-accent-strong transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed shadow-sm" onClick={handleSubmit} disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan Toko'}</button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
