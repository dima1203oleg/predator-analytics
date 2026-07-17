import { useCallback, useMemo } from 'react';
import { useAtom } from 'jotai';
import {
  getAllVisibleNavigationItems,
  getRecommendedNavigation,
} from '@/config/navigation';
import { navFavoritesAtom, navRecentAtom } from '@/store/atoms';
import { pushRecentId, toggleFavoriteId } from '@/services/shell/userWorkspace';

export const useShellWorkspace = (role: string) => {
  const [favoriteIds, setFavoriteIds] = useAtom(navFavoritesAtom);
  const [recentIds, setRecentIds] = useAtom(navRecentAtom);

  const visibleItems = useMemo(() => getAllVisibleNavigationItems(role), [role]);
  const recommendedItems = useMemo(() => getRecommendedNavigation(role, 8), [role]);
  const visibleItemIds = useMemo(() => new Set(visibleItems.map((item) => item.id)), [visibleItems]);
  const visibleFavoriteIds = useMemo(
    () => favoriteIds.filter((itemId) => visibleItemIds.has(itemId)),
    [favoriteIds, visibleItemIds],
  );
  const visibleRecentIds = useMemo(
    () => recentIds.filter((itemId) => visibleItemIds.has(itemId)),
    [recentIds, visibleItemIds],
  );
  const favoriteIdSet = useMemo(() => new Set(visibleFavoriteIds), [visibleFavoriteIds]);

  const toggleFavorite = useCallback((itemId: string) => {
    setFavoriteIds((prev) => toggleFavoriteId(prev, itemId));
  }, [setFavoriteIds]);

  const pushRecent = useCallback((itemId: string) => {
    setRecentIds((prev) => pushRecentId(prev, itemId));
  }, [setRecentIds]);

  return {
    favoriteIds,
    recentIds,
    visibleItems,
    recommendedItems,
    visibleFavoriteIds,
    visibleRecentIds,
    favoriteIdSet,
    toggleFavorite,
    pushRecent,
  };
};
