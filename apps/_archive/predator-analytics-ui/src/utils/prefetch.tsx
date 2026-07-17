/**
 * 🔗 Prefetching Utilities
 *
 * Pre-load data and routes on hover for instant navigation.
 * Improves perceived performance significantly.
 */

import { useCallback, useRef, useEffect } from 'react';
import { useNavigate, NavigateOptions } from 'react-router-dom';
import { queryClient, queryKeys, prefetchOnRouteChange } from '../providers/QueryProvider';

// ========================
// Types
// ========================

type PrefetchHandler = () => void;

interface PrefetchLinkProps {
  to: string;
  children: React.ReactNode;
  prefetchData?: boolean;
  prefetchDelay?: number;
  className?: string;
  onClick?: () => void;
}

// ========================
// Prefetch Hook
// ========================

/**
 * Hook for prefetching route data on hover
 */
export const usePrefetch = (route: string) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasPrefetched = useRef(false);

  const prefetch = useCallback(() => {
    if (hasPrefetched.current) return;

    // Prefetch route data
    prefetchOnRouteChange(route);
    hasPrefetched.current = true;
  }, [route]);

  const onMouseEnter = useCallback(() => {
    // Delay prefetch slightly to avoid unnecessary fetches on quick hovers
    timerRef.current = setTimeout(prefetch, 100);
  }, [prefetch]);

  const onMouseLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { onMouseEnter, onMouseLeave, prefetch };
};

// ========================
// Prefetch Link Component
// ========================

export const PrefetchLink: React.FC<PrefetchLinkProps> = ({
  to,
  children,
  prefetchData = true,
  prefetchDelay = 100,
  className,
  onClick
}) => {
  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasPrefetched = useRef(false);

  const handlePrefetch = useCallback(() => {
    if (hasPrefetched.current || !prefetchData) return;

    prefetchOnRouteChange(to);
    hasPrefetched.current = true;
  }, [to, prefetchData]);

  const handleMouseEnter = useCallback(() => {
    timerRef.current = setTimeout(handlePrefetch, prefetchDelay);
  }, [handlePrefetch, prefetchDelay]);

  const handleMouseLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onClick?.();
    navigate(to);
  }, [navigate, to, onClick]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <a
      href={to}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handlePrefetch}
      className={className}
    >
      {children}
    </a>
  );
};

// ========================
// Resource Prefetcher
// ========================

const prefetchedResources = new Set<string>();

/**
 * Prefetch a resource (image, script, etc.)
 */
export const prefetchResource = (url: string, as: 'image' | 'script' | 'style' | 'fetch' = 'fetch') => {
  if (prefetchedResources.has(url)) return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = as;
  link.href = url;
  document.head.appendChild(link);

  prefetchedResources.add(url);
};

/**
 * Preload a critical resource
 */
export const preloadResource = (url: string, as: 'image' | 'script' | 'style' | 'font') => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = url;

  if (as === 'font') {
    link.crossOrigin = 'anonymous';
  }

  document.head.appendChild(link);
};

// ========================
// DNS Prefetch
// ========================

/**
 * Prefetch DNS for external domains
 */
export const prefetchDNS = (domain: string) => {
  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = domain;
  document.head.appendChild(link);
};

/**
 * Preconnect to external domains (DNS + TCP + TLS)
 */
export const preconnect = (domain: string) => {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = domain;
  document.head.appendChild(link);
};

// ========================
// Intersection Prefetcher
// ========================

interface IntersectionPrefetcherProps {
  children: React.ReactNode;
  onIntersect: () => void;
  rootMargin?: string;
  threshold?: number;
}

/**
 * Component that triggers prefetch when entering viewport
 */
export const IntersectionPrefetcher: React.FC<IntersectionPrefetcherProps> = ({
  children,
  onIntersect,
  rootMargin = '200px',
  threshold = 0
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const hasFired = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasFired.current) {
          hasFired.current = true;
          onIntersect();
        }
      },
      { rootMargin, threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [onIntersect, rootMargin, threshold]);

  return <div ref={ref}>{children}</div>;
};

// ========================
// Page Transition Prefetcher
// ========================

/**
 * Hook that prefetches common routes on app load
 */
export const useRoutesPrefetch = () => {
  useEffect(() => {
    // Prefetch common routes after initial load
    const timer = setTimeout(() => {
      const commonRoutes = ['/', '/overview', '/monitoring', '/agents'];
      commonRoutes.forEach(route => prefetchOnRouteChange(route));
    }, 2000);

    return () => clearTimeout(timer);
  }, []);
};

// ========================
// Enhanced Navigation
// ========================

/**
 * Navigate with prefetching
 */
export const useNavigateWithPrefetch = () => {
  const navigate = useNavigate();

  const navigateWithPrefetch = useCallback(
    async (to: string, options?: NavigateOptions) => {
      // Start navigation immediately
      navigate(to, options);

      // Prefetch data in background
      prefetchOnRouteChange(to);
    },
    [navigate]
  );

  return navigateWithPrefetch;
};

export default {
  usePrefetch,
  PrefetchLink,
  prefetchResource,
  preloadResource,
  prefetchDNS,
  preconnect,
  IntersectionPrefetcher,
  useRoutesPrefetch,
  useNavigateWithPrefetch,
};
