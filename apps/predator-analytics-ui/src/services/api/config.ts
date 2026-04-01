import axios, { AxiosError } from 'axios';

const getMetaEnv = () => {
    try {
        return (import.meta as any).env || {};
    } catch {
        return {};
    }
};

const metaEnv = getMetaEnv();

const isLocalBrowserDev = (): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }

    return ['localhost', '127.0.0.1'].includes(window.location.hostname);
};

// Determine API endpoint based on environment
const getApiUrl = (): string => {
    if (isLocalBrowserDev()) {
        return '/api/v1';
    }

    // Priority: env var > remote server > localhost mock
    if (metaEnv.VITE_API_URL && metaEnv.VITE_API_URL.includes('194.177')) {
        return metaEnv.VITE_API_URL; // Remote server
    }
    return metaEnv.VITE_API_URL || '/api/v1'; // Fallback to localhost or mock
};

const getV45Url = (): string => {
    if (isLocalBrowserDev()) {
        return '/api/v45';
    }

    if (metaEnv.VITE_V45_API_URL && metaEnv.VITE_V45_API_URL.includes('194.177')) {
        return metaEnv.VITE_V45_API_URL; // Remote server
    }
    return metaEnv.VITE_V45_API_URL || '/api/v45';
};

export const API_BASE_URL = getApiUrl();
export const API_V45_URL = getV45Url();
export const USE_LOCAL_DEV_PROXY = isLocalBrowserDev();

/**
 * TRUTH-ONLY MODE — no mock fallbacks when using remote server.
 * All API errors propagate to the component for proper error display.
 * 
 * v56.1: Added remote server support
 */
export const IS_TRUTH_ONLY_MODE = !USE_LOCAL_DEV_PROXY && API_BASE_URL.includes('194.177') ? true : false;

// Default timeout: 15 seconds
const DEFAULT_TIMEOUT = 15_000;

const updateBackendAvailability = (isOffline: boolean) => {
    if (typeof window === 'undefined') {
        return;
    }

    const globalWindow = window as Window & { __BACKEND_OFFLINE_MODE__?: boolean };

    if (globalWindow.__BACKEND_OFFLINE_MODE__ === isOffline) {
        return;
    }

    globalWindow.__BACKEND_OFFLINE_MODE__ = isOffline;
    window.dispatchEvent(new CustomEvent(isOffline ? 'predator-backend-offline' : 'predator-backend-online'));
};

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: DEFAULT_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': '56.1.0',
    }
});

export const v45Client = axios.create({
    baseURL: API_V45_URL,
    timeout: DEFAULT_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': '56.1.0',
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
        updateBackendAvailability(true);
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
    updateBackendAvailability(false);
    return response;
};

// Apply interceptors to both clients
apiClient.interceptors.request.use(authInterceptor);
apiClient.interceptors.response.use(successInterceptor, resilienceInterceptor);

v45Client.interceptors.request.use(authInterceptor);
v45Client.interceptors.response.use(successInterceptor, resilienceInterceptor);
