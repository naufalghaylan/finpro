import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import MapSearchControl from '../common/MapSearchControl';
import type { Store, StoreInput } from '../../types/store';
import { createStore, updateStore } from '../../api/store';
import { searchDestinations } from '../../api/rajaongkir';
import type { KomerceDestination } from '../../api/rajaongkir';
import { Search, Loader2 } from 'lucide-react';

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
  
  const [searchQuery, setSearchQuery] = useState(form.city ? `${form.city}, ${form.province}` : '');
  const [destinations, setDestinations] = useState<KomerceDestination[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(f => ({ ...f, latitude: position[0], longitude: position[1] }));
  }, [position]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setShowSuggestions(true);
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (val.length >= 3) {
      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const results = await searchDestinations(val);
          setDestinations(results);
        } catch (err) {
          console.error(err);
          setError('Gagal mencari lokasi.');
        } finally {
          setIsSearching(false);
        }
      }, 500);
    } else {
      setDestinations([]);
    }
  };

  const handleSelectDestination = (dest: KomerceDestination) => {
    setSearchQuery(dest.label);
    setForm(prev => ({
      ...prev,
      cityId: dest.id.toString(), // destination_id
      city: dest.city_name,
      province: dest.province_name,
      postalCode: dest.zip_code
    }));
    setShowSuggestions(false);
  };

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
      <div className="bg-admin-surface rounded-2xl w-full max-w-4xl mx-auto p-5 sm:p-8 shadow-xl border border-admin-line-soft max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-admin-ink mb-5">{store ? 'Edit Toko' : 'Tambah Toko Baru'}</h3>
        
        {error && <p className="text-sm font-medium text-admin-red bg-admin-red-soft px-4 py-3 rounded-xl mb-4">{error}</p>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-3">
            <input placeholder="Nama Toko" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all" />
            <input placeholder="No. Telepon" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all" />
            
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-ink-soft" />
              <input 
                type="text" 
                placeholder="Cari Kecamatan / Kota Toko"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-admin-line bg-admin-surface text-sm text-admin-ink focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
              />
              {isSearching && (
                <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-admin-ink-soft animate-spin" />
              )}
              {showSuggestions && destinations.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-admin-surface rounded-xl border border-admin-line shadow-xl z-50 max-h-[200px] overflow-y-auto">
                  {destinations.map(dest => (
                    <div 
                      key={dest.id}
                      onClick={() => handleSelectDestination(dest)}
                      className="px-4 py-3 cursor-pointer border-b border-admin-line last:border-0 text-sm hover:bg-admin-surface-hover transition-colors"
                    >
                      <strong>{dest.subdistrict_name}</strong> - {dest.city_name}, {dest.province_name} ({dest.zip_code})
                    </div>
                  ))}
                </div>
              )}
            </div>

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
                <MapSearchControl onLocationSelect={(pos) => setPosition(pos)} />
                <LocationMarker position={position} setPosition={setPosition} />
              </MapContainer>
            </div>
            <div className="flex gap-3">
              <input value={form.latitude} readOnly className="w-full px-4 py-2.5 rounded-xl border border-admin-line bg-admin-surface-2 text-sm text-admin-ink-soft" />
              <input value={form.longitude} readOnly className="w-full px-4 py-2.5 rounded-xl border border-admin-line bg-admin-surface-2 text-sm text-admin-ink-soft" />
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8">
          <button className="px-5 py-2.5 rounded-xl text-sm font-medium text-admin-ink-soft bg-admin-surface border border-admin-line hover:bg-admin-line-soft hover:text-admin-ink transition-all cursor-pointer w-full sm:w-auto text-center" onClick={onClose}>Batal</button>
          <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-admin-accent hover:bg-admin-accent-strong transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed shadow-sm w-full sm:w-auto" onClick={handleSubmit} disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan Toko'}</button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
