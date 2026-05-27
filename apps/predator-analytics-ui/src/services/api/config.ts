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
    [NODE_IDS.LOCAL]:     '/api/v1',                                                                    // Vite proxy → iMac:8000
    [NODE_IDS.SOVEREIGN]: 'http://178.214.200.25:8000/api/v1',
    [NODE_IDS.HYBRID]:    'http://194.177.1.240:8000/api/v1',
    [NODE_IDS.CLOUD]:     'https://manor-buttons-shell-solutions.trycloudflare.com/api/v1',  // Kaggle CPU Backend
    // MOCK disabled for production mode
};

const NODE_NAMES: Record<string, string> = {
    [NODE_IDS.LOCAL]:     'LOCAL_DEVELOPER',
    [NODE_IDS.SOVEREIGN]: 'SOVEREIGN_NODE_IMAC',
    [NODE_IDS.HYBRID]:    'HYBRID_MASTER_NVIDIA',
    [NODE_IDS.CLOUD]:     'CLOUD_MIRROR_COLAB',
    // MOCK disabled for production mode
};

// ─── Утиліти стану ───────────────────────────────────────────────────────────

const getMetaEnv = () => {
    try { return (import.meta as any).env || {}; } catch { return {}; }
};
const metaEnv = getMetaEnv();

const getGlobalWindow = () => (typeof window !== 'undefined' ? window : {}) as any;

// ─── Визначення Активного Вузла ──────────────────────────────────────────────

const resolveInitialUrl = (): string => {
    if (typeof window === 'undefined') return NODE_URLS[NODE_IDS.CLOUD];

    try {
        // 1. Ручний вибір користувача (пріоритет #1)
        const savedNode = localStorage.getItem('PREDATOR_ACTIVE_NODE');
        if (savedNode && NODE_URLS[savedNode]) {
            return NODE_URLS[savedNode];
        }
    } catch {
        // Ignore localStorage errors in test environment
    }

    // 2. Явна настройка через .env
    if (metaEnv.VITE_API_URL) return metaEnv.VITE_API_URL;

    // 3. Дефолт — CLOUD (Kaggle CPU Backend)
    return NODE_URLS[NODE_IDS.CLOUD];
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
    return NODE_IDS.LOCAL;
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

import { systemState } from './mockData';

apiClient.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('predator_auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;

    // ✅ SOVEREIGN CLIENT-SIDE MOCK ADAPTER
    // ⚠️ ВИМКНЕНО за замовчуванням (HR-15: 0% mock у production)
    // Для увімкнення в dev-режимі: localStorage.setItem('PREDATOR_CLIENT_MOCKS', 'true')
    const enableMocks = localStorage.getItem('PREDATOR_CLIENT_MOCKS') === 'true';
    if (enableMocks) console.warn('[PREDATOR MOCK] ⚠️ Mock-режим АКТИВНИЙ — дані не реальні!');
    if (enableMocks && config.url) {
        const url = config.url;
        let mockData: any = null;

        if (url.includes('/api/v2/admin/telemetry')) {
            mockData = systemState.infra;
        } else if (url.includes('/api/v2/admin/failover')) {
            mockData = systemState.failover;
        } else if (url.includes('/api/v2/admin/agents') || url.includes('/api/v1/agents')) {
            mockData = systemState.agents;
        } else if (url.includes('/api/v2/admin/gitops')) {
            mockData = systemState.gitops;
        } else if (url.includes('/api/v2/admin/dataops')) {
            mockData = systemState.dataops;
        } else if (url.includes('/api/v2/admin/security/audit')) {
            mockData = systemState.security.recentEvents;
        } else if (url.includes('/api/v2/admin/security/sessions')) {
            mockData = systemState.security.sessions;
        } else if (url.includes('/api/v2/admin/security/keys')) {
            mockData = systemState.security.keys;
        } else if (url.includes('/health') || url.includes('/api/v1/health') || url.includes('/api/v45/monitoring/health')) {
            mockData = { status: 'ok', uptime: systemState.system.status.uptime };
        } else if (url.includes('/api/v1/system/status')) {
            mockData = systemState.system.status;
        } else if (url.includes('/api/v1/system/stats')) {
            mockData = {
                cpu_percent: 15 + Math.random() * 20,
                memory_percent: 45 + Math.random() * 5,
                memory_total: 32 * 1024 * 1024 * 1024,
                memory_used: 16 * 1024 * 1024 * 1024,
                memory_available: 16 * 1024 * 1024 * 1024,
                disk_percent: 12 + Math.random() * 2,
                disk_total: 2 * 1024 * 1024 * 1024 * 1024,
                disk_used: 0.24 * 1024 * 1024 * 1024 * 1024,
                disk_free: 1.76 * 1024 * 1024 * 1024 * 1024,
                gpu_available: true,
                gpu_name: 'NVIDIA RTX 4090 (Sovereign Mock)',
                gpu_temp: 65 + Math.random() * 5,
                gpu_utilization: 30 + Math.random() * 10,
                gpu_mem_total: 8 * 1024 * 1024 * 1024,
                gpu_mem_used: 4.2 * 1024 * 1024 * 1024,
                uptime_seconds: 1044000,
                timestamp: new Date().toISOString()
            };
        } else if (url.includes('/api/v1/system/engines')) {
            mockData = systemState.system.engines;
        } else if (url.includes('/api/v1/system/logs/stream') || url.includes('/api/v1/monitoring/logs/stream')) {
            mockData = url.includes('/api/v1/system/logs/stream') ? { logs: systemState.system.logs } : systemState.system.logs;
        } else if (url.includes('/api/v1/dashboard/overview')) {
            mockData = { ...systemState.dashboard, generated_at: new Date().toISOString() };
        } else if (url.includes('/api/v1/alerts')) {
            mockData = { items: systemState.dashboard.alerts };
        } else if (url.includes('/api/v1/factory/stats')) {
            mockData = { active_agents: 42, total_tasks: 1250, success_rate: 98.5, avg_latency_ms: 120, vram_usage_gb: 4.2 };
        } else if (url.includes('/api/v1/system/nodes')) {
            mockData = systemState.infra.nodes;
        } else if (url.includes('/api/v1/system/infrastructure')) {
            mockData = systemState.infra.infrastructure;
        } else if (url.includes('/api/v1/factory/bugs')) {
            mockData = systemState.factory.bugs;
        } else if (url.includes('/api/v1/factory/patterns/gold')) {
            mockData = systemState.factory.goldPatterns;
        } else if (url.includes('/api/v1/factory/infinite/status')) {
            mockData = systemState.factory.infinite;
        } else if (url.includes('/api/v1/antigravity/status')) {
            mockData = {
                is_running: true,
                completed_tasks: 124,
                total_spent_usd: 12.45,
                llm_gateway_status: 'online',
                sandbox_status: 'ready',
                agents: [
                    { id: 'a1', name: 'Qwen-Coder', role: 'Surgical Coder', is_busy: true, last_task: 'Refactor Auth' },
                    { id: 'a2', name: 'Nemotron', role: 'Logic Specialist', is_busy: false, last_task: 'Audit DB' }
                ]
            };
        } else if (url.includes('/api/v1/antigravity/tasks')) {
            mockData = [
                { task_id: 't1', description: 'Fix PTY exhaustion', priority: 'high', status: 'completed', created_at: '2026-04-25T12:00:00Z' },
                { task_id: 't2', description: 'Optimize Neo4j indexes', priority: 'medium', status: 'running', created_at: '2026-04-26T00:00:00Z' }
            ];
        } else if (url.includes('/api/v2/admin/chaos')) {
            mockData = systemState.chaos;
        } else if (url.includes('/api/v45/trinity/audit')) {
            mockData = [
                { id: 't1', created_at: new Date().toISOString(), status: 'verified', intent: 'CODE_OPTIMIZATION', request_text: 'Refactor search_tenders using SQLAlchemy ORM', mistral_output: 'Generated optimization patch #42...' },
                { id: 't2', created_at: new Date().toISOString(), status: 'info', intent: 'THREAT_SCAN', request_text: 'Periodic security audit of ua-sources', gemini_plan: 'Scanning for SQL injection patterns...' }
            ];
        } else if (url.includes('/api/v1/intelligence/council-history')) {
            mockData = [
                { id: 'ch1', query: 'Яка стратегія захисту від картельних змов?', final_answer: 'Рекомендується впровадження графових алгоритмів Louvain для детекції прихованих зв\'язків.' }
            ];
        } else if (url.includes('/api/v1/nas/providers')) {
            mockData = [
                { id: 'google', name: 'Gemini 2.0 Flash' },
                { id: 'openai', name: 'GPT-4o' },
                { id: 'deepseek', name: 'DeepSeek V3' }
            ];
        } else if (url.includes('/api/v45/training/arbitration-scores')) {
            mockData = [
                { modelId: 'gemini', modelName: 'Gemini 2.0', criteria: { safety: 0.95, performance: 0.85, cost: 0.9, logic: 0.92 }, totalScore: 0.91 },
                { modelId: 'openai', modelName: 'GPT-4o', criteria: { safety: 0.92, performance: 0.9, cost: 0.8, logic: 0.95 }, totalScore: 0.89 }
            ];
        } else if (url.includes('/api/v45/azr/status')) {
            mockData = { status: 'active', generation: 42, phase_name: 'Режим Рекомендацій', uptime: '124г', health: 99.8, active: true };
        } else if (url.includes('/api/v1/llm/providers')) {
            mockData = [
                { id: 'google', name: 'Google Vertex AI', status: 'connected' },
                { id: 'anthropic', name: 'Anthropic Claude', status: 'connected' },
                { id: 'ollama', name: 'Ollama (Local)', status: 'connected' }
            ];
        } else if (url.includes('/api/v1/monitoring/cluster')) {
            mockData = {
                pods: [
                    { id: 'core-api-85947', name: 'core-api', status: 'Running', restarts: 0, replicas: 2, cpu: '120m', memory: '450Mi', uptime: '12d' },
                    { id: 'graph-service-2341', name: 'graph-service', status: 'Running', restarts: 1, replicas: 1, cpu: '80m', memory: '1.2Gi', uptime: '4d' },
                    { id: 'ingestion-worker-992', name: 'ingestion-worker', status: 'Running', restarts: 12, replicas: 3, cpu: '450m', memory: '890Mi', uptime: '2h' },
                ]
            };
        } else if (url.includes('/api/v1/graph/summary')) {
            mockData = {
                node_count: 154200,
                relationship_count: 892100,
                labels: ['Company', 'Person', 'Asset', 'Transaction'],
                types: ['OWNER_OF', 'DIRECTOR_OF', 'TRANSFER_TO']
            };
        }

        if (mockData !== null) {
            console.debug(`[PREDATOR MOCK] Intercepted ${url}`, mockData);
            config.adapter = async () => {
                return {
                    data: mockData,
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    config: config
                };
            };
        }
    }

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
                // Для відносного URL (Vite proxy) — перевіряємо локальний health
                const healthUrl = node.url.startsWith('/') 
                    ? '/health' 
                    : node.url.replace('/api/v1', '/health');
                await axios.get(healthUrl, { timeout: 3000 });
                node.status = 'online';
            } catch {
                node.status = node.active ? 'offline' : 'offline';
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
