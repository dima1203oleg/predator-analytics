import axios, { AxiosError } from 'axios';

const getMetaEnv = () => {
    try {
        return (import.meta as any).env || {};
    } catch {
        return {};
    }
};

const metaEnv = getMetaEnv();

export const API_BASE_URL = metaEnv.VITE_API_URL || '/api/v1';
export const API_V45_URL = metaEnv.VITE_V45_API_URL || '/api/v45';

/**
 * TRUTH-ONLY MODE — no mock fallbacks.
 * All API errors propagate to the component for proper error display.
 */
// TRUTH-ONLY MODE — configurable via env variable
export const IS_TRUTH_ONLY_MODE = metaEnv.VITE_TRUTH_ONLY === 'true';

// Default timeout: 15 seconds
const DEFAULT_TIMEOUT = 15_000;

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: DEFAULT_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': '55.0.0',
    }
});

export const v45Client = axios.create({
    baseURL: API_V45_URL,
    timeout: DEFAULT_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': '55.0.0',
    }
});

// ─── Auth Interceptor ────────────────────────────────────────────────────────
const authInterceptor = (config: any) => {
    const token = sessionStorage.getItem('predator_auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
};

// ─── Resilience Interceptor ───────────────────────────────────────────────────
const resilienceInterceptor = (error: AxiosError) => {
    const url = error.config?.url ?? 'unknown';
    const status = error.response?.status;

    if (!error.response || (status && status >= 500)) {
        // Server error or network failure
        console.error(`[API] Server/network error: ${error.config?.method?.toUpperCase()} ${url}`, {
            status,
            message: error.message,
        });
    } else if (status === 401) {
        console.warn(`[API] Unauthorized (401): ${url} — clearing token`);
        sessionStorage.removeItem('predator_auth_token');
    } else if (status === 403) {
        console.warn(`[API] Forbidden (403): ${url}`);
    } else if (status === 404) {
        console.warn(`[API] Not found (404): ${url}`);
    } else {
        console.warn(`[API] Error ${status}: ${url}`, error.message);
    }

    // TRUTH-ONLY MODE: always propagate errors to components
    return Promise.reject(error);
};

// ─── Response Success Interceptor ─────────────────────────────────────────────
const successInterceptor = (response: any) => {
    // Clear offline mode flag on successful response
    if (typeof window !== 'undefined' && (window as any).__BACKEND_OFFLINE_MODE__) {
        (window as any).__BACKEND_OFFLINE_MODE__ = false;
        window.dispatchEvent(new CustomEvent('predator-backend-online'));
    }
    return response;
};

// Apply interceptors to both clients
apiClient.interceptors.request.use(authInterceptor);
apiClient.interceptors.response.use(successInterceptor, resilienceInterceptor);

v45Client.interceptors.request.use(authInterceptor);
v45Client.interceptors.response.use(successInterceptor, resilienceInterceptor);
