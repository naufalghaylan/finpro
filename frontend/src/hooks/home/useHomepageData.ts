import { useState, useEffect } from 'react';
import { getPublicStores, getNearestStore } from '../../api/store';

export function useHomepageData(lat?: number, lng?: number) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [storesRes, nearestRes] = await Promise.all([
          getPublicStores(1, 100),
          (lat && lng) ? getNearestStore(lat, lng).catch(() => null) : Promise.resolve(null)
        ]);

        if (mounted) {
          setData({
            stores: storesRes.data,
            storeInfo: nearestRes ? nearestRes.data : null,
            banners: null,
            categories: null,
            footer: null,
            products: undefined
          });
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError('Gagal memuat data toko');
          console.error(err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [lat, lng]);

  return { data, loading, error };
}
