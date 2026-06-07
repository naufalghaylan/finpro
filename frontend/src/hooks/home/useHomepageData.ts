import { useState, useEffect } from 'react';
import { getHomepageData } from '../../api/homepage.api';
import type { HomepageData } from '../../types/home/homepage';

export function useHomepageData(lat?: number, lng?: number) {
  const [data, setData] = useState<HomepageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getHomepageData(lat, lng);
        if (mounted) {
          setData(response.data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError('Gagal memuat data homepage');
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
