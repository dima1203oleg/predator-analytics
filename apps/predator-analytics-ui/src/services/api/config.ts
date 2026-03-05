import axios from 'axios';

const getMetaEnv = () => {
    try {
        return (import.meta as any).env || {};
    } catch {
        return {};
    }
};

const metaEnv = getMetaEnv();
export const API_BASE_URL = metaEnv.VITE_API_URL || '/api/v1';
export const IS_TRUTH_ONLY_MODE = true; // FORCE REAL DATA

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

export const v45Client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

const authInterceptor = (config: any) => {
    const token = sessionStorage.getItem('predator_auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
};

const resilienceInterceptor = (error: any) => {
    if (!error.response || error.response.status >= 500) {
        console.warn(`[Resilience] API ${error.config?.url} failed.`);

        if (IS_TRUTH_ONLY_MODE) {
            return Promise.reject(error);
        }

        if (typeof window !== 'undefined') {
            (window as any).__BACKEND_OFFLINE_MODE__ = true;
            window.dispatchEvent(new CustomEvent('predator-backend-offline'));
        }

        const url = error.config?.url || '';

        // Minimal fallbacks if NOT in truth-only mode
        if (url.includes('/status')) return Promise.resolve({ data: { status: 'SYSTEM_OFFLINE' } });
        return Promise.resolve({ data: {} });
    }
    return Promise.reject(error);
};

apiClient.interceptors.request.use(authInterceptor as any);
apiClient.interceptors.response.use((r) => r, resilienceInterceptor);

v45Client.interceptors.request.use(authInterceptor as any);
v45Client.interceptors.response.use((r) => r, resilienceInterceptor);
