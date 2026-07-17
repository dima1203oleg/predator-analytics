/**
 * 🔄 API Request Utilities with Retry Logic
 *
 * Provides robust API request handling with:
 * - Automatic retry with exponential backoff
 * - Request timeout handling
 * - Cache support
 * - Error normalization
 */

import { getErrorType } from '../components/shared/ErrorHandling';

// ========================
// Types
// ========================

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

interface RequestOptions extends Omit<RequestInit, 'cache'> {
  timeout?: number;
  retry?: RetryOptions;
  useCache?: boolean;
  cacheTime?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// ========================
// Cache Implementation
// ========================

const cache = new Map<string, CacheEntry<unknown>>();

const getCacheKey = (url: string, options?: RequestInit): string => {
  const method = options?.method || 'GET';
  const body = options?.body ? JSON.stringify(options.body) : '';
  return `${method}:${url}:${body}`;
};

const getFromCache = <T>(key: string): T | null => {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.data;
};

const setCache = <T>(key: string, data: T, cacheTime: number): void => {
  const now = Date.now();
  cache.set(key, {
    data,
    timestamp: now,
    expiresAt: now + cacheTime
  });
};

// Cleanup expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key);
    }
  }
}, 60000); // Every minute

// ========================
// Retry Logic
// ========================

const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

const defaultShouldRetry = (error: Error, attempt: number): boolean => {
  const type = getErrorType(error);
  // Retry on network and server errors, but not on auth or not found
  return (type === 'network' || type === 'server') && attempt <= 3;
};

// ========================
// Enhanced Fetch
// ========================

export class ApiError extends Error {
  status: number;
  statusText: string;
  data: unknown;

  constructor(message: string, status: number, statusText: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

export const fetchWithRetry = async <T>(
  url: string,
  options: RequestOptions = {}
): Promise<T> => {
  const {
    timeout = 30000,
    retry = {},
    useCache = false,
    cacheTime = 30000, // 30 seconds default
    ...fetchOptions
  } = options;

  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = defaultShouldRetry
  } = retry;

  // Check cache first for GET requests
  if (useCache && (!fetchOptions.method || fetchOptions.method === 'GET')) {
    const cacheKey = getCacheKey(url, fetchOptions);
    const cachedData = getFromCache<T>(cacheKey);
    if (cachedData !== null) {
      return cachedData;
    }
  }

  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = null;
        }
        throw new ApiError(
          errorData?.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response.statusText,
          errorData
        );
      }

      const data = await response.json();

      // Cache successful GET responses
      if (useCache && (!fetchOptions.method || fetchOptions.method === 'GET')) {
        const cacheKey = getCacheKey(url, fetchOptions);
        setCache(cacheKey, data, cacheTime);
      }

      return data as T;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (attempt < maxRetries && shouldRetry(lastError, attempt + 1)) {
        const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
        console.warn(`Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`, lastError);
        await sleep(delay);
        attempt++;
        continue;
      }

      throw lastError;
    }
  }

  throw lastError || new Error('Unknown error');
};

// ========================
// Convenience Methods
// ========================

export const api = {
  get: <T>(url: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> =>
    fetchWithRetry<T>(url, { ...options, method: 'GET' }),

  post: <T>(url: string, data: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> =>
    fetchWithRetry<T>(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: JSON.stringify(data)
    }),

  put: <T>(url: string, data: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> =>
    fetchWithRetry<T>(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: JSON.stringify(data)
    }),

  delete: <T>(url: string, options?: Omit<RequestOptions, 'method'>): Promise<T> =>
    fetchWithRetry<T>(url, { ...options, method: 'DELETE' }),

  // Clear all cache
  clearCache: (): void => {
    cache.clear();
  },

  // Clear specific cache entry
  invalidateCache: (url: string, method = 'GET'): void => {
    const key = getCacheKey(url, { method });
    cache.delete(key);
  }
};

// ========================
// React Query-like Hook Pattern
// ========================

export interface UseQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const createQueryFn = <T>(
  fetcher: () => Promise<T>
): {
  fetch: () => Promise<T>;
  prefetch: () => void;
} => {
  let promise: Promise<T> | null = null;

  return {
    fetch: async () => {
      if (!promise) {
        promise = fetcher();
      }
      return promise;
    },
    prefetch: () => {
      promise = fetcher();
    }
  };
};

export default api;
