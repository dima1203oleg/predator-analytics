/**
 * ⚙️ КОНФІГУРАЦІЯ API | PREDATOR Analytics v57.2-WRAITH
 * Гібридний протокол відмовостійкості (Failover Protocol)
 *
 * Каскад пріоритетів:
 *  1. NVIDIA Direct   → http://194.177.1.240:8000/api/v1
 *  2. NVIDIA via ZROK → https://predator.share.zrok.io/api/v1
 *  3. Суверенний Mock → http://localhost:9080/api/v1  (Always available)
 */
import axios, { AxiosError } from 'axios';

// ─── Утиліта для безпечного читання import.meta.env ─────────────────────────
const getMetaEnv = () => {
    try { return (import.meta as any).env || {}; } catch { return {}; }
};
const metaEnv = getMetaEnv();

// ─── Точки підключення ───────────────────────────────────────────────────────
const NVIDIA_DIRECT_URL  = 'http://194.177.1.240:8000/api/v1';
const NVIDIA_ZROK_URL    = 'https://predator.share.zrok.io/api/v1';
const MOCK_URL           = 'http://localhost:9080/api/v1';

// Мітки для зручної ідентифікації в useBackendStatus
export const NODE_IDS = {
    NVIDIA:  'nvidia',
    ZROK:    'zrok',
    MOCK:    'mock',
} as const;

// ─── Визначення активного URL ────────────────────────────────────────────────
const resolveApiUrl = (): string => {
    // 1. Явна настройка через .env.local
    if (metaEnv.VITE_API_URL) return metaEnv.VITE_API_URL;
    // 2. HTTPS-сторінка — завжди через ZROK (немає mixed-content)
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
        return NVIDIA_ZROK_URL;
    }
    // 3. По замовчуванню — прямий NVIDIA
    return NVIDIA_DIRECT_URL;
};

export let API_BASE_URL  = resolveApiUrl();
export const API_V45_URL = metaEnv.VITE_V45_API_URL || 'http://localhost:9080/api/v45';

/** Визначає поточний вузол за URL */
const resolveNodeId = (url: string): string => {
    if (url.includes('zrok.io'))    return NODE_IDS.ZROK;
    if (url.includes('localhost') || url.includes('9080')) return NODE_IDS.MOCK;
    return NODE_IDS.NVIDIA;
};

/** Режим "тільки правдиві дані" — без підстановки мок-відповідей */
export const IS_TRUTH_ONLY_MODE = true;

// ─── Глобальний стан вузлів ──────────────────────────────────────────────────
type NodeStatus = 'online' | 'offline' | 'checking';
interface BackendNodeInternal {
    id: string;
    name: string;
    url: string;
    active: boolean;
    status: NodeStatus;
}

const ALL_NODES: BackendNodeInternal[] = [
    { id: NODE_IDS.NVIDIA, name: 'NVIDIA_MASTER',   url: NVIDIA_DIRECT_URL, active: false, status: 'checking' },
    { id: NODE_IDS.ZROK,   name: 'NVIDIA_VIA_ZROK', url: NVIDIA_ZROK_URL,   active: false, status: 'checking' },
    { id: NODE_IDS.MOCK,   name: 'SOVEREIGN_MOCK',  url: MOCK_URL,          active: false, status: 'checking' },
];

const getGlobalWindow = () => window as Window & {
    __BACKEND_OFFLINE_MODE__?: boolean;
    __CURRENT_BACKEND__?: string;
    __BACKEND_NODES__?: BackendNodeInternal[];
};

// ─── Ініціалізація глобального стану вузлів ──────────────────────────────────
const initNodes = () => {
    if (typeof window === 'undefined') return;
    const gw = getGlobalWindow();
    const activeNodeId = resolveNodeId(API_BASE_URL);
    gw.__BACKEND_NODES__ = ALL_NODES.map(n => ({
        ...n,
        active: n.id === activeNodeId,
        status: n.id === activeNodeId ? 'online' : 'checking',
    }));
    gw.__CURRENT_BACKEND__ = API_BASE_URL;
};

// ─── Функція відправки подій про зміну стану ─────────────────────────────────
const dispatchStatusEvent = (isOffline: boolean) => {
    if (typeof window === 'undefined') return;
    const gw = getGlobalWindow();
    window.dispatchEvent(new CustomEvent('predator-backend-status-change', {
        detail: { isOffline, nodes: gw.__BACKEND_NODES__ }
    }));
    window.dispatchEvent(new CustomEvent(
        isOffline ? 'predator-backend-offline' : 'predator-backend-online'
    ));
};

// ─── Перемикання на вузол ─────────────────────────────────────────────────────
const switchToNode = (nodeId: string, targetUrl: string) => {
    const gw = getGlobalWindow();
    API_BASE_URL = targetUrl;
    apiClient.defaults.baseURL = targetUrl;
    gw.__CURRENT_BACKEND__ = targetUrl;

    if (gw.__BACKEND_NODES__) {
        gw.__BACKEND_NODES__ = gw.__BACKEND_NODES__.map(n => ({
            ...n,
            active: n.id === nodeId,
            status: n.id === nodeId ? 'online' : (n.status === 'online' && n.id !== nodeId ? 'offline' : n.status),
        }));
    }

    const isOffline = nodeId === NODE_IDS.MOCK;
    const wasOffline = gw.__BACKEND_OFFLINE_MODE__;
    gw.__BACKEND_OFFLINE_MODE__ = isOffline;

    if (wasOffline !== isOffline) {
        dispatchStatusEvent(isOffline);
    }

    console.info(`[PREDATOR] Активний вузол: ${nodeId.toUpperCase()} → ${targetUrl}`);
};

// ─── Автоматичне перемикання при збої ────────────────────────────────────────
let _failoverAttempts = 0;
const MAX_FAILOVER_ATTEMPTS = 2;

const triggerFailover = async () => {
    if (typeof window === 'undefined') return;
    const gw = getGlobalWindow();
    const currentId = resolveNodeId(API_BASE_URL);

    _failoverAttempts++;

    if (_failoverAttempts > MAX_FAILOVER_ATTEMPTS) {
        // Кінцева точка — Суверенний Mock (завжди доступний)
        if (currentId !== NODE_IDS.MOCK) {
            console.warn('[PREDATOR] 🚨 Всі зовнішні вузли недоступні. Активація СУВЕРЕННОГО MOCK API...');
            switchToNode(NODE_IDS.MOCK, MOCK_URL);
        }
        return;
    }

    // Каскад: NVIDIA → ZROK → Mock
    if (currentId === NODE_IDS.NVIDIA) {
        console.warn('[PREDATOR] ⚠️ NVIDIA Direct недоступний. Спроба ZROK...');
        // Перевіряємо ZROK перед перемиканням
        try {
            await axios.get(`${NVIDIA_ZROK_URL.replace('/api/v1', '')}/health`, { timeout: 4000 });
            switchToNode(NODE_IDS.ZROK, NVIDIA_ZROK_URL);
            _failoverAttempts = 0;
        } catch {
            console.warn('[PREDATOR] ⚠️ ZROK також недоступний. Активація Mock...');
            switchToNode(NODE_IDS.MOCK, MOCK_URL);
        }
    } else if (currentId === NODE_IDS.ZROK) {
        console.warn('[PREDATOR] ⚠️ ZROK недоступний. Активація Mock...');
        switchToNode(NODE_IDS.MOCK, MOCK_URL);
    }
};

// ─── Успішна відповідь — фіксує вузол як онлайн ──────────────────────────────
const onSuccess = (response: any) => {
    const gw = getGlobalWindow();
    _failoverAttempts = 0;
    const currentId = resolveNodeId(API_BASE_URL);

    if (gw.__BACKEND_NODES__) {
        gw.__BACKEND_NODES__ = gw.__BACKEND_NODES__.map(n => ({
            ...n,
            active: n.id === currentId,
            status: n.id === currentId ? 'online' : n.status,
        }));
    }

    if (gw.__BACKEND_OFFLINE_MODE__ !== false) {
        gw.__BACKEND_OFFLINE_MODE__ = false;
        dispatchStatusEvent(false);
    }

    return response;
};

// ─── Перехоплювач помилок ────────────────────────────────────────────────────
const onError = async (error: AxiosError) => {
    const url   = error.config?.url ?? 'unknown';
    const status = error.response?.status;

    if (!error.response || (status && status >= 500)) {
        console.error(`[PREDATOR] Мережева/серверна помилка: ${error.config?.method?.toUpperCase()} ${url}`, { status, message: error.message });
        await triggerFailover();
    } else if (status === 401) {
        console.warn(`[PREDATOR] 401 Unauthorized: ${url} — очищення токену`);
        sessionStorage.removeItem('predator_auth_token');
    } else if (status === 403) {
        console.warn(`[PREDATOR] 403 Forbidden: ${url}`);
    } else if (status === 404) {
        console.warn(`[PREDATOR] 404 Not Found: ${url}`);
    } else {
        console.warn(`[PREDATOR] HTTP ${status}: ${url}`, error.message);
    }

    return Promise.reject(error);
};

// ─── Auth Interceptor ─────────────────────────────────────────────────────────
const authInterceptor = (config: any) => {
    const token = sessionStorage.getItem('predator_auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
};

// ─── Axios клієнти ───────────────────────────────────────────────────────────
export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10_000,
    headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': '56.5.0-WRAITH',
    },
});

export const v45Client = axios.create({
    baseURL: API_V45_URL,
    timeout: 10_000,
    headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': '56.5.0-WRAITH',
    },
});

// Підключення перехоплювачів
apiClient.interceptors.request.use(authInterceptor);
apiClient.interceptors.response.use(onSuccess, onError);

v45Client.interceptors.request.use(authInterceptor);
v45Client.interceptors.response.use(onSuccess, onError);

// ─── Watchdog: автоматичне відновлення до NVIDIA ─────────────────────────────
const startWatchdog = () => {
    if (typeof window === 'undefined') return;

    setInterval(async () => {
        const gw = getGlobalWindow();
        const currentId = resolveNodeId(API_BASE_URL);

        // Якщо не на NVIDIA — перевіряємо чи він знову доступний
        if (currentId !== NODE_IDS.NVIDIA) {
            try {
                await axios.get(`http://194.177.1.240:8000/health`, { timeout: 3000 });
                console.info('[PREDATOR] 🚀 NVIDIA Master відновлено. Failback...');
                switchToNode(NODE_IDS.NVIDIA, NVIDIA_DIRECT_URL);
                _failoverAttempts = 0;
            } catch {
                // NVIDIA все ще недоступний — лишаємось на поточному вузлі
            }
        }

        // Оновлення статусу поточних вузлів
        if (gw.__BACKEND_NODES__) {
            for (const node of gw.__BACKEND_NODES__) {
                try {
                    const healthUrl = node.url.replace('/api/v1', '/health');
                    await axios.get(healthUrl, { timeout: 2000 });
                    node.status = 'online';
                } catch {
                    node.status = node.active ? 'checking' : 'offline';
                }
            }
        }

        // Публікація оновленого стану
        window.dispatchEvent(new CustomEvent('predator-backend-status-change', {
            detail: {
                isOffline: gw.__BACKEND_OFFLINE_MODE__,
                nodes: gw.__BACKEND_NODES__,
            }
        }));
    }, 15_000);
};

// ─── Ініціалізація при завантаженні ─────────────────────────────────────────
if (typeof window !== 'undefined') {
    initNodes();
    startWatchdog();
}
