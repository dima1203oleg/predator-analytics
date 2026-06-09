/**
 * 🔄 Infinite Scroll Hook — пагінація через Intersection Observer
 * Оптимально для великих датасетів (150+ компаній, 600+ транзакцій)
 */
import { useState, useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions<T> {
  fetcher: (offset: number, limit: number) => Promise<{ items: T[]; total: number }>;
  limit?: number;
  threshold?: number;
}

interface UseInfiniteScrollResult<T> {
  items: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  refresh: () => void;
  sentinelRef: React.RefObject<HTMLDivElement>;
}

export function useInfiniteScroll<T>({
  fetcher,
  limit = 25,
  threshold = 100,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const offsetRef = useRef(0);
  const totalRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null!);
  const isFetchingRef = useRef(false);

  const fetchItems = useCallback(async (isInitial: boolean) => {
    if (isFetchingRef.current) return;
    if (!isInitial && !hasMore) return;

    isFetchingRef.current = true;
    if (isInitial) {
      setIsLoading(true);
      offsetRef.current = 0;
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      const { items: newItems, total } = await fetcher(offsetRef.current, limit);
      totalRef.current = total;

      setItems(prev => isInitial ? newItems : [...prev, ...newItems]);
      offsetRef.current += newItems.length;
      setHasMore(offsetRef.current < total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка завантаження');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [fetcher, limit, hasMore]);

  const refresh = useCallback(() => {
    setItems([]);
    setHasMore(true);
    offsetRef.current = 0;
    fetchItems(true);
  }, [fetchItems]);

  // Intersection Observer для sentinel елемента
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && !isLoadingMore && hasMore) {
          fetchItems(false);
        }
      },
      { rootMargin: `${threshold}px` }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchItems, isLoading, isLoadingMore, hasMore, threshold]);

  // Початкове завантаження
  useEffect(() => {
    fetchItems(true);
  }, []);

  return { items, isLoading, isLoadingMore, hasMore, error, refresh, sentinelRef };
}
