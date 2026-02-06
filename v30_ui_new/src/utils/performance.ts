/**
 * 🔍 Performance Monitoring Utilities
 *
 * Tools for measuring and optimizing React component performance.
 * Use in development to identify slow renders.
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';

// ========================
// Render Count Tracker
// ========================

/**
 * Hook to track component render counts
 * Only active in development mode
 */
export const useRenderCount = (componentName: string): number => {
  const renderCount = useRef(0);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      renderCount.current += 1;
      if (renderCount.current > 5) {
        console.warn(
          `[Performance] ${componentName} has rendered ${renderCount.current} times. Consider memoization.`
        );
      }
    }
  });

  return renderCount.current;
};

// ========================
// Render Time Tracker
// ========================

interface RenderTiming {
  renderStart: number;
  renderEnd: number;
  duration: number;
}

/**
 * Hook to measure render time
 */
export const useRenderTiming = (componentName: string): RenderTiming => {
  const renderStart = useRef(performance.now());
  const timing = useRef<RenderTiming>({
    renderStart: 0,
    renderEnd: 0,
    duration: 0
  });

  // Mark render start
  renderStart.current = performance.now();

  useEffect(() => {
    const end = performance.now();
    const duration = end - renderStart.current;

    timing.current = {
      renderStart: renderStart.current,
      renderEnd: end,
      duration
    };

    if (process.env.NODE_ENV === 'development' && duration > 16) {
      console.warn(
        `[Performance] ${componentName} took ${duration.toFixed(2)}ms to render (target: <16ms for 60fps)`
      );
    }
  });

  return timing.current;
};

// ========================
// Expensive Computation Tracker
// ========================

/**
 * Hook to warn about expensive computations that should be memoized
 */
export const useExpensiveComputation = <T>(
  computation: () => T,
  dependencies: unknown[],
  label: string
): T => {
  const start = performance.now();

  const result = useMemo(() => {
    const computeStart = performance.now();
    const computed = computation();
    const duration = performance.now() - computeStart;

    if (process.env.NODE_ENV === 'development' && duration > 5) {
      console.warn(
        `[Performance] Expensive computation "${label}" took ${duration.toFixed(2)}ms`
      );
    }

    return computed;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return result;
};

// ========================
// Debounced Callback
// ========================

/**
 * Hook for debounced callbacks to prevent excessive updates
 */
export const useDebouncedCallback = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
};

// ========================
// Throttled Callback
// ========================

/**
 * Hook for throttled callbacks (useful for scroll/resize events)
 */
export const useThrottledCallback = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  const lastRan = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastRan.current >= limit) {
        callback(...args);
        lastRan.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRan.current = Date.now();
        }, limit - (now - lastRan.current));
      }
    },
    [callback, limit]
  );
};

// ========================
// Intersection Observer Hook
// ========================

interface IntersectionOptions {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * Hook for lazy loading content when it enters viewport
 */
export const useIntersectionObserver = (
  options: IntersectionOptions = {}
): [React.RefObject<HTMLDivElement | null>, boolean] => {
  const { threshold = 0, rootMargin = '100px', triggerOnce = true } = options;
  const ref = useRef<HTMLDivElement | null>(null);
  const isVisible = useRef(false);
  const hasTriggered = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || (triggerOnce && hasTriggered.current)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          hasTriggered.current = true;
          if (triggerOnce) {
            observer.unobserve(element);
          }
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return [ref, isVisible.current];
};

// ========================
// Performance Report
// ========================

interface PerformanceReport {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
}

/**
 * Get performance metrics from browser
 */
export const getPerformanceReport = (): Partial<PerformanceReport> => {
  if (typeof window === 'undefined' || !window.performance) {
    return {};
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');

  const fcp = paint.find(entry => entry.name === 'first-contentful-paint');

  return {
    pageLoadTime: navigation?.loadEventEnd - navigation?.startTime || 0,
    firstContentfulPaint: fcp?.startTime || 0,
  };
};

// ========================
// Bundle Size Analyzer (Dev Only)
// ========================

export const logBundleAnalysis = () => {
  if (process.env.NODE_ENV !== 'development') return;

  const report = getPerformanceReport();

  console.group('📊 Performance Report');
  console.log(`Page Load Time: ${report.pageLoadTime?.toFixed(2)}ms`);
  console.log(`First Contentful Paint: ${report.firstContentfulPaint?.toFixed(2)}ms`);
  console.groupEnd();
};

export default {
  useRenderCount,
  useRenderTiming,
  useExpensiveComputation,
  useDebouncedCallback,
  useThrottledCallback,
  useIntersectionObserver,
  getPerformanceReport,
  logBundleAnalysis,
};
