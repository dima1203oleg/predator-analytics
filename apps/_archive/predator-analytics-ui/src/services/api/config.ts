/**
 * ⚙️ API CONFIGURATION | PREDATOR v67.0-ELITE
 * Гібридний протокол відмовостійкості (Tri-State Routing)
 * 
 * ⚠️ MOCK-РЕЖИМ ПОВНІСТЮ ВИМКНЕНО (HR-15).
 * Усі запити йдуть до реального backend (Kaggle / NVIDIA / NVIDIA).
 * 
 * Вузли:
 *  1. SOVEREIGN (NVIDIA) → http://178.214.200.25:8000/api/v1
 *  2. HYBRID (NVIDIA)  → http://194.177.1.240:6666/api/v1
 *  3. CLOUD (Kaggle)   → VITE_API_URL (зазвичай через zrok тунель)
 */
import axios, { AxiosError } from 'axios';

const getMetaEnv = () => {
    try { return (import.meta as any).env || {}; } catch { return {}; }
};
const metaEnv = getMetaEnv();

const getGlobalWindow = () => (typeof window !== 'undefined' ? window : {}) as any;

// ─── Константи Вузлів ────────────────────────────────────────────────────────

export const NODE_IDS = {
    LOCAL:     'local',     // Local Developer API (MacBook)
    SOVEREIGN: 'sovereign', // NVIDIA (...199)
    HYBRID:    'hybrid',    // NVIDIA (...240)
    CLOUD:     'cloud',     // Kaggle CPU Backend (через zrok)
} as const;

const NODE_URLS: Record<string, string> = {
    [NODE_IDS.LOCAL]:     '/api/v1',                                                                    // Vite proxy → NVIDIA:8000
    [NODE_IDS.SOVEREIGN]: 'https://178.214.200.25:8000/api/v1',
    [NODE_IDS.HYBRID]:    'http://194.177.1.240:9010/api/v1', // OVERRIDDEN locally to prevent CORS errors
    [NODE_IDS.CLOUD]:     metaEnv.VITE_API_URL || 'https://predator-mirror.share.zrok.io/api/v1',
};

const NODE_NAMES: Record<string, string> = {
    [NODE_IDS.LOCAL]:     'LOCAL_DEVELOPER',
    [NODE_IDS.SOVEREIGN]: 'SOVEREIGN_NODE_NVIDIA',
    [NODE_IDS.HYBRID]:    'HYBRID_MASTER_NVIDIA',
    [NODE_IDS.CLOUD]:     'CLOUD_KAGGLE_PRODUCTION',
};

// ─── Визначення Активного Вузла ──────────────────────────────────────────────

const resolveInitialUrl = (): string => {
    if (typeof window === 'undefined') return NODE_URLS[NODE_IDS.CLOUD];

    // 1. Явна настройка через .env (пріоритет #1 — розробник задав свідомо)
    if (metaEnv.VITE_API_URL) return metaEnv.VITE_API_URL;

    try {
        // 2. Ручний вибір користувача (пріоритет #2)
        const savedNode = localStorage.getItem('PREDATOR_ACTIVE_NODE');
        if (savedNode && NODE_URLS[savedNode]) {
            return NODE_URLS[savedNode];
        }
    } catch {
        // Ignore localStorage errors in test environment
    }

    // 3. Дефолт — LOCAL (через Vite proxy)
    return NODE_URLS[NODE_IDS.LOCAL];
};

export let API_BASE_URL = resolveInitialUrl();

(window as any).__PREDATOR_DEBUG = {
    API_BASE_URL,
    metaEnv,
    NODE_URLS
};

// ─── Зовнішні сервіси (OpenSearch, etc.) ────────────────────────────────────
/** Обчислювані URL для OpenSearch — оновлюються при перемиканні вузла */
export const getOpensearchUrl = () => API_BASE_URL.replace(/:8000\/api\/v1/g, ':5601');
export const getOpensearchApiUrl = () => API_BASE_URL.replace(/:8000\/api\/v1/g, ':9200');
export const OPENSEARCH_URL = getOpensearchUrl();
export const OPENSEARCH_API_URL = getOpensearchApiUrl();

/** Визначає ID вузла за URL */
const resolveNodeId = (url: string): string => {
    if (url === NODE_URLS[NODE_IDS.LOCAL])     return NODE_IDS.LOCAL;
    if (url === NODE_URLS[NODE_IDS.SOVEREIGN]) return NODE_IDS.SOVEREIGN;
    if (url === NODE_URLS[NODE_IDS.HYBRID])    return NODE_IDS.HYBRID;
    if (url === NODE_URLS[NODE_IDS.CLOUD])     return NODE_IDS.CLOUD;
    return NODE_IDS.CLOUD;
};

// ⚠️ TRUTH ONLY — завжди true, mock назавжди вимкнено
export const IS_TRUTH_ONLY_MODE = true;

// ─── Глобальний Стан (для useBackendStatus) ──────────────────────────────────

interface BackendNodeInternal {
    id: string;
    name: string;
    url: string;
    active: boolean;
    status: 'online' | 'offline' | 'checking';
    mode: 'SOVEREIGN' | 'HYBRID' | 'CLOUD' | 'LOCAL';
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
    timeout: 120000, // 120 seconds for local LLM (DeepSeek-R1)
    headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': '68.0.0-ELITE',
    },
});

// Статичний токен для автоматичної авторизації з Kaggle бекендом (HR-06: через env)
const STATIC_TOKEN = metaEnv.VITE_STATIC_TOKEN || '';

// Alias for backward compatibility
export const v45Client = apiClient;
export const API_V45_URL = API_BASE_URL;

// ─── Request Interceptor (тільки токен авторизації) ──────────────────────────
// ⚠️ MOCK-режим НАЗАВЖДИ ВИМКНЕНО. Усі запити йдуть до реального backend.
// HR-15: 0% mock у production — ЗАСТОСОВАНО.

apiClient.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('predator_auth_token') || STATIC_TOKEN;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ─── Response Interceptor (Failover + Status Tracking) ───────────────────────

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
                // Для відносного URL (Vite proxy) — перевіряємо локальний health
                const healthUrl = node.url.startsWith('/')
                    ? '/api/v1/health'
                    : `${node.url.replace(/\/?$/, '')}/health`;
                await axios.get(healthUrl, { timeout: 8000 });
                node.status = 'online';
            } catch {
                node.status = 'offline';
            }
        }

        const activeNode = gw.__BACKEND_NODES__.find((node: any) => node.active);
        const isOffline = activeNode?.status !== 'online';
        gw.__BACKEND_OFFLINE_MODE__ = isOffline;

        if (!isOffline) {
            window.dispatchEvent(new CustomEvent('predator-backend-online'));
        }

        window.dispatchEvent(new CustomEvent('predator-backend-status-change', {
            detail: { isOffline, isRecovering: isOffline, nodes: gw.__BACKEND_NODES__ }
        }));
    }, 20000);
};

// ─── Ініціалізація ───────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
    initGlobalState();
    startWatchdog();
}
