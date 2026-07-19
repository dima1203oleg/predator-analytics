import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { OSINT_ENTITIES, OsintEntity } from '../osintData';

const fallbackSearch = async (query: string): Promise<OsintEntity[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!query.trim()) {
        resolve(OSINT_ENTITIES);
        return;
      }
      const lowerQuery = query.toLowerCase();
      const results = OSINT_ENTITIES.filter(entity => 
        entity.name.toLowerCase().includes(lowerQuery) ||
        (entity.description && entity.description.toLowerCase().includes(lowerQuery)) ||
        (entity.code && entity.code.includes(lowerQuery))
      );
      resolve(results);
    }, 800);
  });
};

export const useOsintSearch = (searchQuery: string, activeDatabases: Set<string>, dateRange: {start: string, end: string}) => {
  return useQuery({
    queryKey: ['osintSearch', searchQuery, Array.from(activeDatabases).sort(), dateRange],
    queryFn: async () => {
      try {
        const response = await apiFetch(`/api/v1/osint/search?q=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) {
          throw new Error('API not available, using fallback');
        }
        const data = await response.json();
        return data as OsintEntity[];
      } catch (e) {
        console.warn('OSINT API failed or not found, using local mock data.', e);
        return fallbackSearch(searchQuery);
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};
