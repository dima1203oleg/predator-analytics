/**
 * ⚙️ API CONFIGURATION | PREDATOR v63.0-ELITE
 * Гібридний протокол відмовостійкості (Tri-State Routing)
 * 
 * Вузли:
 *  1. SOVEREIGN (iMac) → http://178.214.200.25:8000/api/v1
 *  2. HYBRID (NVIDIA)  → http://194.177.1.240:8000/api/v1
 *  3. CLOUD (Colab)   → https://predator-mirror.share.zrok.io/api/v1
 *  4. MOCK (Local)    → /api/v1
 */
import axios, { AxiosError } from 'axios';

// ─── Константи Вузлів ────────────────────────────────────────────────────────

export const NODE_IDS = {
    LOCAL:     'local',     // Local Developer API (MacBook)
    SOVEREIGN: 'sovereign', // iMac (...199)
    HYBRID:    'hybrid',    // NVIDIA (...240)
    CLOUD:     'cloud',     // Colab Mirror
    MOCK:      'mock',      // Sandbox
} as const;

const NODE_URLS: Record<string, string> = {
    [NODE_IDS.LOCAL]:     'http://localhost:8001/api/v1',
    [NODE_IDS.SOVEREIGN]: 'http://178.214.200.25:8000/api/v1',
    [NODE_IDS.HYBRID]:    'http://194.177.1.240:8000/api/v1',
    [NODE_IDS.CLOUD]:     'https://predator.share.zrok.io/api/v1',
    [NODE_IDS.MOCK]:      'http://localhost:9080/api/v1',
};

const NODE_NAMES: Record<string, string> = {
    [NODE_IDS.LOCAL]:     'LOCAL_DEVELOPER',
    [NODE_IDS.SOVEREIGN]: 'SOVEREIGN_NODE_IMAC',
    [NODE_IDS.HYBRID]:    'HYBRID_MASTER_NVIDIA',
    [NODE_IDS.CLOUD]:     'CLOUD_MIRROR_COLAB',
    [NODE_IDS.MOCK]:      'LOCAL_SUVEREIGN_MOCK',
};

// ─── Утиліти стану ───────────────────────────────────────────────────────────

const getMetaEnv = () => {
    try { return (import.meta as any).env || {}; } catch { return {}; }
};
const metaEnv = getMetaEnv();

const getGlobalWindow = () => (typeof window !== 'undefined' ? window : {}) as any;

// ─── Визначення Активного Вузла ──────────────────────────────────────────────

const resolveInitialUrl = (): string => {
    if (typeof window === 'undefined') return NODE_URLS[NODE_IDS.HYBRID];

    // 1. Ручний вибір користувача (пріоритет #1)
    const savedNode = localStorage.getItem('PREDATOR_ACTIVE_NODE');
    if (savedNode && NODE_URLS[savedNode]) {
        return NODE_URLS[savedNode];
    }

    // 2. Явна настройка через .env
    if (metaEnv.VITE_API_URL) return metaEnv.VITE_API_URL;
    
    // 3. Авто-вибір для розробки (MacBook Local Dev)
    if (metaEnv.DEV) return NODE_URLS[NODE_IDS.LOCAL];

    // 4. Default
    return NODE_URLS[NODE_IDS.HYBRID];
};

export let API_BASE_URL = resolveInitialUrl();

// ─── Зовнішні сервіси (OpenSearch, etc.) ────────────────────────────────────
/** Обчислювані URL для OpenSearch — оновлюються при перемиканні вузла */
export const getOpensearchUrl = () => API_BASE_URL.replace(/:8000\/api\/v1|:9080\/api\/v1/g, ':5601');
export const getOpensearchApiUrl = () => API_BASE_URL.replace(/:8000\/api\/v1|:9080\/api\/v1/g, ':9200');
export const OPENSEARCH_URL = getOpensearchUrl();
export const OPENSEARCH_API_URL = getOpensearchApiUrl();

/** Визначає ID вузла за URL */
const resolveNodeId = (url: string): string => {
    if (url === NODE_URLS[NODE_IDS.LOCAL])     return NODE_IDS.LOCAL;
    if (url === NODE_URLS[NODE_IDS.SOVEREIGN]) return NODE_IDS.SOVEREIGN;
    if (url === NODE_URLS[NODE_IDS.HYBRID])    return NODE_IDS.HYBRID;
    if (url === NODE_URLS[NODE_IDS.CLOUD])     return NODE_IDS.CLOUD;
    if (url === NODE_URLS[NODE_IDS.MOCK])      return NODE_IDS.MOCK;
    return NODE_IDS.MOCK;
};

export const IS_TRUTH_ONLY_MODE = true;

// ─── Глобальний Стан (для useBackendStatus) ──────────────────────────────────

interface BackendNodeInternal {
    id: string;
    name: string;
    url: string;
    active: boolean;
    status: 'online' | 'offline' | 'checking';
    mode: 'SOVEREIGN' | 'HYBRID' | 'CLOUD' | 'MOCK' | 'LOCAL';
}

const initGlobalState = () => {
    if (typeof window === 'undefined') return;
    const gw = getGlobalWindow();
    const activeId = resolveNodeId(API_BASE_URL);

    gw.__BACKEND_NODES__ = Object.values(NODE_IDS).map(id => ({
        id,
        name: NODE_NAMES[id],
        url: NODE_URLS[id],
        active: id === activeId,
        status: id === activeId ? 'online' : 'checking',
        mode: id.toUpperCase() as any
    }));

    gw.__CURRENT_BACKEND__ = API_BASE_URL;
    gw.__BACKEND_OFFLINE_MODE__ = false;
};

// ─── Публічні Методи Управління ──────────────────────────────────────────────

export const switchToNode = (nodeId: string) => {
    const targetUrl = NODE_URLS[nodeId];
    if (!targetUrl) return;

    localStorage.setItem('PREDATOR_ACTIVE_NODE', nodeId);
    
    // Оновлюємо поточний стан
    API_BASE_URL = targetUrl;
    apiClient.defaults.baseURL = targetUrl;
    
    const gw = getGlobalWindow();
    gw.__CURRENT_BACKEND__ = targetUrl;
    gw.__BACKEND_OFFLINE_MODE__ = false;
    
    if (gw.__BACKEND_NODES__) {
        gw.__BACKEND_NODES__ = gw.__BACKEND_NODES__.map((n: any) => ({
            ...n,
            active: n.id === nodeId,
            status: n.id === nodeId ? 'online' : 'checking'
        }));
    }

    // Повідомляємо систему
    window.dispatchEvent(new CustomEvent('predator-backend-status-change', {
        detail: { isOffline: false, nodes: gw.__BACKEND_NODES__ }
    }));

    console.info(`[PREDATOR] Перемикання на вузол: ${nodeId.toUpperCase()} | ${targetUrl}`);
    
    // Перезавантаження для чистої ініціалізації всіх сервісів
    window.location.reload();
};

// ─── Axios Клієнт ────────────────────────────────────────────────────────────

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': '63.0.0-ELITE',
    },
});

// Alias for backward compatibility
export const v45Client = apiClient;
export const API_V45_URL = API_BASE_URL;

apiClient.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('predator_auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

apiClient.interceptors.response.use(
    (response) => {
        const gw = getGlobalWindow();
        const activeId = resolveNodeId(API_BASE_URL);
        if (gw.__BACKEND_NODES__) {
            const node = gw.__BACKEND_NODES__.find((n: any) => n.id === activeId);
            if (node) node.status = 'online';
        }
        if (gw.__BACKEND_OFFLINE_MODE__) {
            gw.__BACKEND_OFFLINE_MODE__ = false;
            window.dispatchEvent(new CustomEvent('predator-backend-online'));
        }
        return response;
    },
    async (error: AxiosError) => {
        const status = error.response?.status;
        
        // Автоматична відмовостійкість (Failover)
        if (!error.response || (status && status >= 500)) {
            console.warn(`[PREDATOR] Канал ${API_BASE_URL} нестабільний. Запущено фонове відновлення.`);
            await triggerFailover();
        }

        if (status === 401) sessionStorage.removeItem('predator_auth_token');
        return Promise.reject(error);
    }
);

// ─── Логіка Failover (Каскадна Відмовостійкість) ─────────────────────────────

const triggerFailover = async () => {
    const currentId = resolveNodeId(API_BASE_URL);
    
    const gw = getGlobalWindow();
    gw.__BACKEND_OFFLINE_MODE__ = false;

    if (gw.__BACKEND_NODES__) {
        gw.__BACKEND_NODES__ = gw.__BACKEND_NODES__.map((node: any) => ({
            ...node,
            status: node.id === currentId ? 'checking' : node.status,
        }));
    }

    window.dispatchEvent(new CustomEvent('predator-backend-status-change', {
        detail: { isOffline: false, isRecovering: true, nodes: gw.__BACKEND_NODES__ }
    }));
};

// ─── Watchdog (Синхронізація Стану) ──────────────────────────────────────────

const startWatchdog = () => {
    if (typeof window === 'undefined') return;

    setInterval(async () => {
        const gw = getGlobalWindow();
        if (!gw.__BACKEND_NODES__) return;

        for (const node of gw.__BACKEND_NODES__) {
            try {
                const healthUrl = node.url.replace('/api/v1', '/health');
                await axios.get(healthUrl, { timeout: 3000 });
                node.status = 'online';
            } catch {
                node.status = node.active ? 'checking' : 'offline';
            }
        }

        const activeNode = gw.__BACKEND_NODES__.find((node: any) => node.active);
        gw.__BACKEND_OFFLINE_MODE__ = false;
        if (activeNode?.status === 'online') {
            window.dispatchEvent(new CustomEvent('predator-backend-online'));
        }

        window.dispatchEvent(new CustomEvent('predator-backend-status-change', {
            detail: { isOffline: false, isRecovering: activeNode?.status !== 'online', nodes: gw.__BACKEND_NODES__ }
        }));
    }, 20000);
};

// ─── Ініціалізація ───────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
    initGlobalState();
    startWatchdog();
}
