import axios from 'axios';
import {
    MOCK_ENVIRONMENTS, MOCK_PIPELINES, MOCK_CONNECTORS, MOCK_FILES,
    MOCK_WEB_SOURCES, MOCK_API_SOURCES, MOCK_TELEGRAM_BOTS, MOCK_LLM_CONFIG,
    MOCK_DATABASES, MOCK_VECTORS, MOCK_SECURITY_LOGS, MOCK_WAF_LOGS,
    MOCK_TARGETS, MOCK_ETL_JOBS, MOCK_SERVICES, MOCK_CLUSTER, MOCK_SECTOR_DATA,
    MOCK_BENCHMARKS, MOCK_AUTOML_EXPERIMENTS, MOCK_AGENT_CONFIGS, MOCK_SECRETS,
    MOCK_DATA_CATALOG, MOCK_USER_TEMPLATES, MOCK_AUTO_DATASETS
} from './mockData';
import { RiskForecast, OpponentResponse, CouncilResult } from '../types';

const getMetaEnv = () => {
    try {
        return (import.meta as any).env || {};
    } catch {
        return {};
    }
};

const metaEnv = getMetaEnv();
// In dev, Vite proxy handles /api -> localhost:8080. In prod, Nginx handles it.
const API_BASE_URL = metaEnv.VITE_API_URL || '/api/v1';

const IS_TRUTH_ONLY_MODE = metaEnv.MODE === 'production' || metaEnv.VITE_TRUTH_ONLY === 'true';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Helper to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
    // --- DATABASES (UA-Sources) ---
    getDatabases: async () => {
        if (IS_TRUTH_ONLY_MODE) return (await apiClient.get('/databases/')).data;
        await delay(500);
        return MOCK_DATABASES;
    },
    getVectors: async () => {
        if (IS_TRUTH_ONLY_MODE) return (await apiClient.get('/databases/vectors')).data;
        await delay(500);
        return MOCK_VECTORS;
    },

    // --- SECURITY (UA-Sources) ---
    getWafLogs: async () => {
        if (IS_TRUTH_ONLY_MODE) return (await apiClient.get('/security/waf')).data;
        await delay(300);
        return MOCK_WAF_LOGS;
    },
    getSecurityLogs: async () => {
        if (IS_TRUTH_ONLY_MODE) return (await apiClient.get('/security/audit')).data;
        await delay(300);
        return MOCK_SECURITY_LOGS;
    },

    // --- CONNECTORS (UA-Sources) ---
    getConnectors: async () => {
        if (IS_TRUTH_ONLY_MODE) return (await apiClient.get('/sources/connectors')).data;
        await delay(400);
        return MOCK_CONNECTORS;
    },

    // --- INTEGRATIONS (UA-Sources) ---
    getSecrets: async () => {
        if (IS_TRUTH_ONLY_MODE) return (await apiClient.get('/sources/secrets')).data;
        await delay(300);
        return MOCK_SECRETS;
    },
    getIntegrationSources: async (type: 'FILE' | 'WEB' | 'API') => {
        if (IS_TRUTH_ONLY_MODE) return (await apiClient.get(`/sources/list?type=${type}`)).data;
        await delay(300);
        if (type === 'FILE') return MOCK_FILES;
        if (type === 'WEB') return MOCK_WEB_SOURCES;
        if (type === 'API') return MOCK_API_SOURCES;
        return [];
    },
    getTelegramBots: async () => {
        if (IS_TRUTH_ONLY_MODE) return (await apiClient.get('/sources/bots')).data;
        await delay(300);
        return MOCK_TELEGRAM_BOTS;
    },
    saveSecret: async (id: string, value: string) => {
        if (IS_TRUTH_ONLY_MODE) return (await apiClient.post(`/sources/secrets/${id}`, { value })).data;
        await delay(800);
        return { success: true };
    },
    validateSecret: async (id: string, value: string) => {
        if (IS_TRUTH_ONLY_MODE) return (await apiClient.post(`/sources/secrets/${id}/validate`, { value })).data;
        await delay(1500);
        return { success: true, valid: true };
    },
    getDataCatalog: async () => {
        if (IS_TRUTH_ONLY_MODE) return (await apiClient.get('/sources/catalog')).data;
        await delay(400);
        return MOCK_DATA_CATALOG;
    },
    getUserTemplates: async () => {
        if (IS_TRUTH_ONLY_MODE) return (await apiClient.get('/sources/templates')).data;
        await delay(300);
        return MOCK_USER_TEMPLATES;
    },
    getAutoDatasets: async () => {
        if (IS_TRUTH_ONLY_MODE) return (await apiClient.get('/sources/datasets/auto')).data;
        await delay(300);
        return MOCK_AUTO_DATASETS;
    },

    // --- LLM (Mocked or Brain Service) ---
    getLLMBenchmarks: async () => {
        // Benchmarks usually static or long-running, keeping mock for now unless Brain has an endpoint
        await delay(400);
        return MOCK_BENCHMARKS;
    },
    getAutoMLExperiments: async () => {
        await delay(400);
        return MOCK_AUTOML_EXPERIMENTS;
    },
    getLLMConfig: async () => {
        if (IS_TRUTH_ONLY_MODE) return (await apiClient.get('/council/config')).data;
        await delay(300);
        return MOCK_LLM_CONFIG;
    },

    // --- INFRA / DEPLOYMENT (Mocked or K8s Service) ---
    getClusterStatus: async () => {
        // Ideally hits a monitoring service
        await delay(400);
        return MOCK_CLUSTER;
    },
    getEnvironments: async () => {
        await delay(400);
        return MOCK_ENVIRONMENTS;
    },
    getPipelines: async () => {
        await delay(400);
        return MOCK_PIPELINES;
    },
    triggerPipeline: async (type: 'FULL' | 'TEST') => {
        await delay(1000);
        return { success: true, runId: `run-${Date.now()}` };
    },
    syncEnvironment: async (id: string) => {
        await delay(1500);
        return { success: true };
    },

    // --- MONITORING ---
    getMonitoringTargets: async () => {
        await delay(300);
        return MOCK_TARGETS;
    },
    streamSystemLogs: async () => {
        // Simulation for visual effect
        await delay(200);
        const services = ['ua-sources', 'predator-backend', 'redis', 'postgres', 'brain-svc'];
        const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
        const msgs = ['Health check OK', 'Processing batch', 'Connection timeout', 'Cache miss', 'Neural link established'];
        const randomLog = {
            ts: new Date().toLocaleTimeString(),
            service: services[Math.floor(Math.random() * services.length)],
            level: levels[Math.floor(Math.random() * levels.length)],
            msg: msgs[Math.floor(Math.random() * msgs.length)]
        };
        return [randomLog];
    },

    // --- EVOLUTION (Predator Agents Service) ---
    getEvolutionStatus: async () => {
        // Calls predator-agents service via Gateway
        try {
            return (await apiClient.get('/evolution/status')).data;
        } catch (e) {
            console.warn("Evolution status offline, using mock");
            return { active: false, phase: 'IDLE', logs: [], progress: 0 };
        }
    },
    startEvolutionCycle: async () => {
        try {
            return (await apiClient.post('/evolution/start')).data;
        } catch (e) {
            console.error("Failed to start evolution", e);
            throw e;
        }
    },

    // --- OPPONENT / RED TEAM (Predator Brain Service) ---
    askOpponent: async (query: string) => {
        try {
            return (await apiClient.post('/opponent/ask', { query })).data;
        } catch (e) {
            console.warn("Opponent offline, fallback");
            await delay(1000);
            return {
                answer: "Service Unavailable: Red Team module is offline.",
                sources: [],
                model: { mode: 'OFFLINE', name: 'System', confidence: 0, executionTimeMs: 0 }
            };
        }
    },

    // --- COUNCIL (Predator Brain Service) ---
    runCouncil: async (query: string) => {
        try {
            return (await apiClient.post('/council/run', { query })).data;
        } catch (e) {
            console.warn("Council offline, fallback");
            await delay(2000);
            return {
                final_answer: "Neural Council Unreachable. Please check Brain Service status.",
                per_model_answers: [],
                ranking: []
            } as CouncilResult;
        }
    },

    // --- SEMANTIC SEARCH (New v21) ---
    search: {
        query: async (params: { q: string, rerank?: boolean, mode?: string, filters?: any }) => {
            // Use real API if available or mandated
            if (IS_TRUTH_ONLY_MODE) {
                const response = await apiClient.get('/search', {
                    params: {
                        q: params.q,
                        rerank: params.rerank ?? true,
                        mode: params.mode ?? 'hybrid'
                    }
                });
                return response.data.results;
            }
            // Mock handled in component or basic array here
            await delay(600);
            return [
                {
                    id: 'mock-1',
                    title: 'System Architecture v21',
                    snippet: 'The new architecture utilizes <b>AutoOptimizer</b> for self-healing...',
                    score: 0.95,
                    source: 'internal-docs',
                    searchType: 'hybrid'
                }
            ];
        }
    },

    // --- AUTO OPTIMIZER (New v21) ---
    optimizer: {
        getStatus: async () => {
            if (IS_TRUTH_ONLY_MODE) return (await apiClient.get('/optimizer/status')).data;
            await delay(300);
            return { is_running: true, quality_gates_status: 'passing' };
        },
        trigger: async () => {
            if (IS_TRUTH_ONLY_MODE) return (await apiClient.post('/optimizer/trigger')).data;
            await delay(1000);
            return { status: 'triggered' };
        },
        getMetrics: async () => {
            if (IS_TRUTH_ONLY_MODE) return (await apiClient.get('/optimizer/metrics')).data;
            await delay(300);
            return { ndcg_at_10: 0.85, avg_latency_ms: 320 };
        },
        getHistory: async () => {
            if (IS_TRUTH_ONLY_MODE) {
                const res = await apiClient.get('/optimizer/history');
                return res.data?.history || [];
            }
            await delay(300);
            return [];
        }
    },

    // --- ML SERVICES (New v21) ---
    ml: {
        explain: async (query: string, documentId: string, content?: string) => {
            if (IS_TRUTH_ONLY_MODE) return (await apiClient.post('/ml/explain', { query, document_id: documentId, content })).data;
            await delay(1500);
            return { method: 'SHAP', query_coverage: 0.8, top_features: [], interpretation: 'Mock explanation' };
        },
        summarize: async (text: string) => {
            if (IS_TRUTH_ONLY_MODE) return (await apiClient.post('/ml/summarize', { text })).data;
            await delay(2000);
            return { summary: "This constitutes a simulated summary of the document content." };
        },
        getDocumentSummary: async (docId: string) => {
            if (IS_TRUTH_ONLY_MODE) return (await apiClient.get(`/documents/${docId}/summary`)).data;
            await delay(1500);
            return { summary: "Cached summary of the document content.", cached: true, model: 'mock' };
        }
    },

    testing: {
        run: async (suiteType: string) => {
            if (IS_TRUTH_ONLY_MODE) {
                const res = await apiClient.post('/testing/run', { suite_type: suiteType });
                return res.data;
            }
            await delay(2000);
            return {
                status: 'simulated_pass',
                logs: ['> Running simulated test...', '> All checks passed.'],
                duration: '2.4s'
            };
        },
        getStatus: async () => {
            if (IS_TRUTH_ONLY_MODE) return (await apiClient.get('/testing/status')).data;
            return { status: 'ready', available_suites: ['unit', 'integration'] };
        }
    },

    // Integrations
    integrations: {
        slack: {
            getStatus: async () => {
                if (IS_TRUTH_ONLY_MODE) return (await apiClient.get('/integrations/slack/status')).data;
                return { configured: false };
            },
            getChannels: async () => {
                if (IS_TRUTH_ONLY_MODE) return (await apiClient.get('/integrations/slack/channels')).data;
                return [];
            },
            syncChannel: async (channelId: string) => {
                if (IS_TRUTH_ONLY_MODE) return (await apiClient.post('/integrations/slack/sync', { source: 'slack', target_id: channelId })).data;
                return { status: 'simulated', message: 'Sync started' };
            }
        },
        notion: {
            getStatus: async () => {
                if (IS_TRUTH_ONLY_MODE) return (await apiClient.get('/integrations/notion/status')).data;
                return { configured: false };
            },
            search: async (q: string = "") => {
                if (IS_TRUTH_ONLY_MODE) return (await apiClient.get(`/integrations/notion/search?query=${q}`)).data;
                return [];
            },
            syncPage: async (pageId: string) => {
                if (IS_TRUTH_ONLY_MODE) return (await apiClient.post('/integrations/notion/sync', { source: 'notion', target_id: pageId })).data;
                return { status: 'simulated', message: 'Notion Sync started' };
            }
        }
    },

    // Nexus Hivemind
    nexus: {
        chat: async (query: string, mode: string = 'chat') => {
            if (IS_TRUTH_ONLY_MODE) return (await apiClient.post('/nexus/chat', { query, mode })).data;
            return { answer: `[Simulated Nexus] Received: ${query}. (Enable Truth Mode for LLM)` };
        }
    }
};