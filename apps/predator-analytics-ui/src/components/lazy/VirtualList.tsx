/**
 * Optimized Virtual List Component
 * 
 * Renders only visible items for large datasets to maintain smooth performance
 * Supports dynamic item heights, sticky headers, and infinite scrolling
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VirtualListItem {
  id: string;
  height?: number;
  data: any;
}

interface VirtualListProps {
  items: VirtualListItem[];
  itemHeight: number | ((item: VirtualListItem) => number);
  renderItem: (item: VirtualListItem, index: number) => React.ReactNode;
  containerHeight: number;
  overscan?: number;
  onScrollEnd?: () => void;
  className?: string;
  showScrollbar?: boolean;
}

export const VirtualList: React.FC<VirtualListProps> = ({
  items,
  itemHeight,
  renderItem,
  containerHeight,
  overscan = 5,
  onScrollEnd,
  className = '',
  showScrollbar = true
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: containerHeight });
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate item heights
  const itemHeights = useMemo(() => {
    return items.map(item => {
      const height = typeof itemHeight === 'function' ? (itemHeight as (item: VirtualListItem) => number)(item) : (itemHeight as number);
      return { id: item.id, height: height || 50 };
    });
  }, [items, itemHeight]);

  // Calculate cumulative heights
  const itemPositions = useMemo(() => {
    const positions = new Map<string, { top: number; height: number }>();
    let currentTop = 0;
    
    itemHeights.forEach(({ id, height }) => {
      positions.set(id, { top: currentTop, height });
      currentTop += height;
    });
    
    return positions;
  }, [itemHeights]);

  // Calculate total height
  const totalHeight = useMemo(() => {
    return Array.from(itemPositions.values()).reduce((sum, { height }) => sum + height, 0);
  }, [itemPositions]);

  // Find visible items
  const visibleItems = useMemo(() => {
    const visible: Array<{ item: VirtualListItem; index: number; top: number }> = [];
    const start = Math.max(0, scrollTop - overscan * 50);
    const end = scrollTop + containerSize.height + overscan * 50;

    let currentTop = 0;
    items.forEach((item, index) => {
      const currentItemHeight = typeof itemHeight === 'function' ? (itemHeight as (item: VirtualListItem) => number)(item) : (itemHeight as number);
      const itemBottom = currentTop + currentItemHeight;

      if (itemBottom >= start && currentTop <= end) {
        visible.push({ item, index, top: currentTop });
      }

      currentTop = itemBottom;
    });

    return visible;
  }, [items, itemHeight, scrollTop, containerSize.height, overscan]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);

    // Check if scrolled to bottom
    if (onScrollEnd && scrollElementRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollElementRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        onScrollEnd();
      }
    }
  }, [onScrollEnd]);

  // Update container size
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ height: containerHeight }}
    >
      <div
        ref={scrollElementRef}
        className={`overflow-y-auto ${showScrollbar ? '' : 'scrollbar-hide'}`}
        style={{ height: '100%' }}
        onScroll={handleScroll}
      >
        {/* Spacer element for total height */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* Visible items */}
          <AnimatePresence>
            {visibleItems.map(({ item, index, top }) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                style={{
                  position: 'absolute',
                  top: top,
                  left: 0,
                  right: 0,
                  zIndex: 1
                }}
              >
                {renderItem(item, index)}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Scroll indicators */}
      {totalHeight > containerSize.height && (
        <div className="absolute right-2 top-2 bottom-2 w-1 bg-slate-800 rounded-full overflow-hidden pointer-events-none">
          <div 
            className="absolute inset-x-0 bg-blue-500 rounded-full transition-all duration-200"
            style={{
              height: `${(containerSize.height / totalHeight) * 100}%`,
              top: `${(scrollTop / totalHeight) * 100}%`
            }}
          />
        </div>
      )}
    </div>
  );
};

// Hook for infinite loading
export const useInfiniteLoad = (
  fetchMore: () => Promise<boolean>,
  hasMore: boolean,
  threshold = 100
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const success = await fetchMore();
      if (!success) {
        setError('Не вдалося завантажити більше елементів');
      }
    } catch (err) {
      setError('Помилка завантаження даних');
    } finally {
      setLoading(false);
    }
  }, [fetchMore, hasMore, loading]);

  return { loadMore, loading, error };
};
