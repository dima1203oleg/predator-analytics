import { useState, useEffect } from 'react';
import { apiClient } from '../../services/api/config';

export function useAdminApi<T>(endpoint: string, intervalMs: number = 5000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      try {
        const res = await apiClient.get<T>(endpoint);
        if (mounted) {
          setData(res.data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('API Error'));
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchData();
    const timer = setInterval(fetchData, intervalMs);
    
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [endpoint, intervalMs]);

  return { data, error, isLoading };
}
