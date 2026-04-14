import axios, { AxiosError } from 'axios';

const getMetaEnv = () => {
    try {
        return (import.meta as any).env || {};
    } catch {
        return {};
    }
};

const metaEnv = getMetaEnv();

// Determine API endpoint based on environment
const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

const PRIMARY_URL = isHttps 
    ? 'https://2e41c24fa38f0d.lhr.life/api/v1' // NVIDIA Master (Secure Tunnel)
    : 'http://194.177.1.240:8000/api/v1';     // NVIDIA Master (Direct IP)

const FALLBACK_URL = 'https://predator-api.share.zrok.io/api/v1'; // Colab Mirror

const getApiUrl = (): string => {
    // Якщо ми в режимі розробки з моками, повертаємо локальний порт
    if (metaEnv.VITE_ENABLE_MOCK_API === 'true') {
        return 'http://localhost:9080/api/v1';
    }
    // Пріоритет: .env -> NVIDIA -> FALLBACK
    return metaEnv.VITE_API_URL || PRIMARY_URL;
};

const getV45Url = (): string => {
    if (metaEnv.VITE_V45_API_URL) return metaEnv.VITE_V45_API_URL;
    return '/api/v45';
};

export let API_BASE_URL = getApiUrl();
export const API_V45_URL = getV45Url();

/**
 * TRUTH-ONLY MODE — no mock fallbacks when using remote server.
 */
export const IS_TRUTH_ONLY_MODE = true;

// Default timeout: 10 seconds (optimized for failover)
const DEFAULT_TIMEOUT = 10_000; 

const updateBackendAvailability = async (isOffline: boolean) => {
    if (typeof window === 'undefined') return;
    const globalWindow = window as Window & { 
        __BACKEND_OFFLINE_MODE__?: boolean; 
        __CURRENT_BACKEND__?: string;
        __BACKEND_NODES__?: Array<{ id: string; name: string; url: string; active: boolean; status: 'online' | 'offline' | 'checking' }>
    };
    
    // Initialize nodes if not present
    if (!globalWindow.__BACKEND_NODES__) {
        globalWindow.__BACKEND_NODES__ = [
            { id: 'nvidia', name: 'NVIDIA_MASTER', url: PRIMARY_URL, active: false, status: 'online' },
            { id: 'colab', name: 'COLAB_MIRROR', url: FALLBACK_URL, active: false, status: 'online' }
        ];
    }

    // Sync active state with API_BASE_URL (checks if current base matches node url or if overridden)
    globalWindow.__BACKEND_NODES__ = globalWindow.__BACKEND_NODES__.map(node => ({
        ...node,
        active: API_BASE_URL.includes(node.url.split('://')[1]) || (node.id === 'nvidia' && !API_BASE_URL.includes('zrok.io') && !API_BASE_URL.includes('localhost'))
    }));

    // Failover Logic: NVIDIA -> Colab -> Local Mock
    if (isOffline) {
        if (globalWindow.__CURRENT_BACKEND__ !== FALLBACK_URL) {
            console.warn('⚠️ Основний сервер NVIDIA недоступний. Перемикання на Colab (Failover)...');
            API_BASE_URL = FALLBACK_URL;
            apiClient.defaults.baseURL = FALLBACK_URL;
            globalWindow.__CURRENT_BACKEND__ = FALLBACK_URL;
            
            // Update node status
            globalWindow.__BACKEND_NODES__ = globalWindow.__BACKEND_NODES__.map(n => ({
                ...n,
                active: n.url === FALLBACK_URL,
                status: n.url === PRIMARY_URL ? 'offline' : n.status
            }));
        } else {
            console.warn('🚨 Colab Cluster також недоступний. Активація локального Mock API (Emergency Mode)...');
            const MOCK_URL = 'http://localhost:9080/api/v1';
            API_BASE_URL = MOCK_URL;
            apiClient.defaults.baseURL = MOCK_URL;
            globalWindow.__CURRENT_BACKEND__ = MOCK_URL;
            
            globalWindow.__BACKEND_NODES__ = globalWindow.__BACKEND_NODES__.map(n => ({
                ...n,
                active: false,
                status: n.url === FALLBACK_URL ? 'offline' : 'online'
            }));
        }
    } else {
        // If we are online, ensure the active state is reflected
        const currentUrl = globalWindow.__CURRENT_BACKEND__ || PRIMARY_URL;
        globalWindow.__BACKEND_NODES__ = globalWindow.__BACKEND_NODES__.map(n => ({
            ...n,
            active: n.url === currentUrl,
            status: n.url === currentUrl ? 'online' : n.status
        }));
    }

    if (globalWindow.__BACKEND_OFFLINE_MODE__ === isOffline) return;
    globalWindow.__BACKEND_OFFLINE_MODE__ = isOffline;
    window.dispatchEvent(new CustomEvent('predator-backend-status-change', { 
        detail: { isOffline, nodes: globalWindow.__BACKEND_NODES__ } 
    }));
    window.dispatchEvent(new CustomEvent(isOffline ? 'predator-backend-offline' : 'predator-backend-online'));
};

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: DEFAULT_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': '56.4.0',
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

// ─── Active Watchdog Loop (Auto-Healing Trigger) ──────────────────────────────
const startWatchdog = () => {
    if (typeof window === 'undefined') return;
    
    setInterval(async () => {
        const nodes = (window as any).__BACKEND_NODES__ || [];
        for (const node of nodes) {
            try {
                // Short timeout for health probe
                const response = await axios.get(`${node.url}/health`, { timeout: 3000 });
                if (response.status === 200) {
                    node.status = 'online';
                    // If we were offline and now NVIDIA is back, failback!
                    if (node.id === 'nvidia' && API_BASE_URL !== PRIMARY_URL) {
                        console.info('🚀 Guardian: NVIDIA Master is back. Performing Failback...');
                        API_BASE_URL = PRIMARY_URL;
                        apiClient.defaults.baseURL = PRIMARY_URL;
                        updateBackendAvailability(false);
                    }
                }
            } catch {
                node.status = 'offline';
                if (node.active) updateBackendAvailability(true);
            }
        }
        
        // Dispatch update
        window.dispatchEvent(new CustomEvent('predator-backend-status-change', { 
            detail: { isOffline: (window as any).__BACKEND_OFFLINE_MODE__, nodes } 
        }));
    }, 15000); // Check every 15 seconds
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

// Bootstrap initialization
if (typeof window !== 'undefined') {
    updateBackendAvailability(false);
    startWatchdog();
}
