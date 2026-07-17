/**
 * 📜 Virtual List Component
 *
 * Efficient rendering of large lists using windowing.
 * Only renders visible items + buffer for smooth scrolling.
 */

import React, { useRef, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ========================
// Types
// ========================

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  overscan?: number;
  className?: string;
  emptyMessage?: string;
  keyExtractor?: (item: T, index: number) => string;
}

interface VirtualGridProps<T> {
  items: T[];
  itemHeight: number;
  itemWidth: number;
  containerHeight: number;
  containerWidth: number;
  renderItem: (item: T, index: number) => ReactNode;
  gap?: number;
  overscan?: number;
  className?: string;
  keyExtractor?: (item: T, index: number) => string;
}

// ========================
// Virtual List Component
// ========================

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  className = '',
  emptyMessage = 'Немає даних',
  keyExtractor = (_item, index) => String(index)
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate visible range
  const { startIndex, endIndex, totalHeight, offsetY } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length - 1, start + visibleCount + overscan * 2);

    return {
      startIndex: start,
      endIndex: end,
      totalHeight: items.length * itemHeight,
      offsetY: start * itemHeight
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, i) => ({
      item,
      index: startIndex + i
    }));
  }, [items, startIndex, endIndex]);

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full text-slate-500 text-sm ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(({ item, index }) => (
            <div
              key={keyExtractor(item, index)}
              style={{ height: itemHeight }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========================
// Virtual Grid Component
// ========================

export function VirtualGrid<T>({
  items,
  itemHeight,
  itemWidth,
  containerHeight,
  containerWidth,
  renderItem,
  gap = 16,
  overscan = 2,
  className = '',
  keyExtractor = (_item, index) => String(index)
}: VirtualGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate columns and visible range
  const { columnsPerRow, startRow, endRow, totalHeight, visibleItems } = useMemo(() => {
    const cols = Math.max(1, Math.floor((containerWidth + gap) / (itemWidth + gap)));
    const rowHeight = itemHeight + gap;
    const totalRows = Math.ceil(items.length / cols);

    const startR = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const visibleRows = Math.ceil(containerHeight / rowHeight);
    const endR = Math.min(totalRows - 1, startR + visibleRows + overscan * 2);

    const startIdx = startR * cols;
    const endIdx = Math.min(items.length - 1, (endR + 1) * cols - 1);

    const visible = items.slice(startIdx, endIdx + 1).map((item, i) => ({
      item,
      index: startIdx + i,
      row: Math.floor((startIdx + i) / cols),
      col: (startIdx + i) % cols
    }));

    return {
      columnsPerRow: cols,
      startRow: startR,
      endRow: endR,
      totalHeight: totalRows * rowHeight,
      visibleItems: visible
    };
  }, [items, itemHeight, itemWidth, containerHeight, containerWidth, gap, scrollTop, overscan]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, row, col }) => (
          <div
            key={keyExtractor(item, index)}
            style={{
              position: 'absolute',
              top: row * (itemHeight + gap),
              left: col * (itemWidth + gap),
              width: itemWidth,
              height: itemHeight
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ========================
// Infinite Scroll Component
// ========================

interface InfiniteScrollProps<T> {
  items: T[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  renderItem: (item: T, index: number) => ReactNode;
  threshold?: number;
  className?: string;
  loadingComponent?: ReactNode;
  endMessage?: string;
  keyExtractor?: (item: T, index: number) => string;
}

export function InfiniteScroll<T>({
  items,
  hasMore,
  isLoading,
  onLoadMore,
  renderItem,
  threshold = 200,
  className = '',
  loadingComponent,
  endMessage = 'Більше немає даних',
  keyExtractor = (_item, index) => String(index)
}: InfiniteScrollProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  // Intersection observer for infinite loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { rootMargin: `${threshold}px` }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore, threshold]);

  return (
    <div ref={containerRef} className={`overflow-auto ${className}`}>
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <motion.div
            key={keyExtractor(item, index)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Loading trigger */}
      <div ref={loadingRef} className="h-4" />

      {isLoading && (
        <div className="py-4 flex justify-center">
          {loadingComponent || (
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <div className="w-4 h-4 border-2 border-slate-600 border-t-cyan-400 rounded-full animate-spin" />
              Завантаження...
            </div>
          )}
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <div className="py-4 text-center text-xs text-slate-600">
          {endMessage}
        </div>
      )}
    </div>
  );
}

export default VirtualList;
