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

const IS_TRUTH_ONLY_MODE = true; // FORCE REAL DATA

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Helper to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
    // --- SYSTEM ---
    saveConfig: async (config: any) => {
        if (IS_TRUTH_ONLY_MODE) return (await apiClient.post('/system/config/save', config)).data;
        await delay(500);
        return { status: 'SAVED', timestamp: new Date().toISOString() };
    },

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
    executeQuery: async (query: string, params: any = {}) => {
        if (IS_TRUTH_ONLY_MODE) return (await apiClient.post('/databases/query', { query, params })).data;
        await delay(800);
        if (query.toUpperCase().includes('SELECT')) {
            return {
                columns: ["id", "name", "status", "created_at"],
                rows: [
                    [1, "Test Entity 1", "ACTIVE", new Date().toISOString()],
                    [2, "Test Entity 2", "PENDING", new Date().toISOString()],
                    [3, "Test Entity 3", "ARCHIVED", new Date().toISOString()]
                ],
                row_count: 3,
                execution_time_ms: 15
            };
        }
        return { status: 'SUCCESS', row_count: 1, execution_time_ms: 10 };
    },

    // --- CONNECTORS & SOURCES ---
    getConnectors: async () => {
        if (IS_TRUTH_ONLY_MODE) return (await apiClient.get('/sources/connectors')).data;
        await delay(400);
        return MOCK_CONNECTORS;
    },
    testConnector: async (id: string) => {
        if (IS_TRUTH_ONLY_MODE) return (await apiClient.post(`/sources/connectors/${id}/test`)).data;
        await delay(1000);
        return { status: 'SUCCESS', latency_ms: 120, message: 'Connection successful' };
    },
    syncConnector: async (id: string) => {
        if (IS_TRUTH_ONLY_MODE) return (await apiClient.post(`/sources/connectors/${id}/sync`)).data;
        await delay(1000);
        return { source_id: id, sync_id: `sync-${id}-001`, status: 'STARTED' };
    },

    // --- SECRETS & INTEGRATION CONFIG ---
    getSecrets: async () => {
        if (IS_TRUTH_ONLY_MODE) return (await apiClient.get('/sources/secrets')).data;
        await delay(300);
        return MOCK_SECRETS;
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

    // --- CATALOG ---
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

    // --- SECURITY ---
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

    // --- LLM ---
    getLLMBenchmarks: async () => {
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

    // --- INFRASTRUCTURE ---
    getClusterStatus: async () => {
        if (IS_TRUTH_ONLY_MODE) {
            try {
                const res = (await apiClient.get('/system/infrastructure')).data;
                return {
                    status: res.status === 'OPERATIONAL' ? 'Healthy' : 'Degraded',
                    nodes: Object.entries(res.components || {}).map(([k, v]: [string, any]) => ({
                        name: k,
                        status: v.status === 'UP' ? 'Ready' : 'NotReady',
                        role: 'data-layer',
                        version: v.version
                    })),
                    pods: []
                };
            } catch (e) {
                console.error("Infrastructure check failed", e);
                return { status: 'Unknown', nodes: [], pods: [] };
            }
        }
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
    getMonitoringTargets: async () => {
        await delay(300);
        return MOCK_TARGETS;
    },
    streamSystemLogs: async () => {
        await delay(200);
        const services = ['ua-sources', 'predator-backend', 'redis', 'py-engine', 'brain-svc'];
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

    // --- EVOLUTION ---
    getEvolutionStatus: async () => {
        try {
            if (IS_TRUTH_ONLY_MODE) return (await apiClient.get('/evolution/status')).data;
        } catch (e) { console.warn("Evolution offline"); }
        return { active: false, phase: 'IDLE', logs: [], progress: 0 };
    },
    startEvolutionCycle: async () => {
        return (await apiClient.post('/evolution/start')).data;
    },

    // --- BRAIN & COUNCIL ---
    askOpponent: async (query: string) => {
        try {
            return (await apiClient.post('/opponent/ask', { query })).data;
        } catch (e) {
            await delay(1000);
            return {
                answer: "Service Unavailable: Red Team module is offline.",
                sources: [],
                model: { mode: 'OFFLINE', name: 'System', confidence: 0, executionTimeMs: 0 }
            };
        }
    },
    runCouncil: async (query: string) => {
        try {
            return (await apiClient.post('/council/run', { query })).data;
        } catch (e) {
            await delay(2000);
            return {
                final_answer: "Neural Council Unreachable. Please check Brain Service status.",
                per_model_answers: [],
                ranking: []
            } as CouncilResult;
        }
    },

    // --- SEARCH ---
    search: {
        submitFeedback: async (resultId: string, type: string) => {
            if (IS_TRUTH_ONLY_MODE) return (await apiClient.post('/search/feedback', { result_id: resultId, feedback_type: type })).data;
            return { status: 'mocked' };
        },
        query: async (params: { q: string, rerank?: boolean, mode?: string, filters?: any }) => {
            if (IS_TRUTH_ONLY_MODE) {
                // Customs Handling
                if (params.filters?.category === 'customs') {
                    try {
                        const res = await apiClient.post('/search/customs', {
                            query: params.q,
                            limit: 50,
                            filters: params.filters
                        });
                        return res.data.results.map((r: any) => ({
                            id: r.id,
                            title: `Митна декларація: ${r.description?.substring(0, 50)}...`,
                            snippet: `Код: ${r.hs_code} | Країна: ${r.country_trading} | Митниця: ${r.customs_office}`,
                            score: r.score,
                            source: 'ua-customs',
                            category: 'customs',
                            searchType: 'full-text'
                        }));
                    } catch (e) {
                        console.error("Customs search failed", e);
                        return [];
                    }
                }

                const response = await apiClient.get('/search', {
                    params: {
                        q: params.q,
                        rerank: params.rerank ?? true,
                        mode: params.mode ?? 'hybrid',
                        category: params.filters?.category,
                        source: params.filters?.source
                    }
                });
                return response.data.results || [];
            }
            await delay(600);
            return [{
                id: 'mock-1', title: 'System Architecture v21', snippet: 'AutoOptimizer self-healing...', score: 0.95, source: 'internal-docs'
            }];
        }
    },

    // --- OPTIMIZER ---
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
            if (IS_TRUTH_ONLY_MODE) return (await apiClient.get('/optimizer/history')).data?.history || [];
            await delay(300);
            return [];
        }
    },

    // --- ML Utils ---
    ml: {
        explain: async (query: string, documentId: string, content?: string) => {
            if (IS_TRUTH_ONLY_MODE) return (await apiClient.post('/ml/explain', { query, document_id: documentId, content })).data;
            await delay(1500);
            return { method: 'SHAP', query_coverage: 0.8, top_features: [], interpretation: 'Mock explanation' };
        },
        summarize: async (text: string) => {
            if (IS_TRUTH_ONLY_MODE) return (await apiClient.post('/ml/summarize', { text })).data;
            await delay(2000);
            return { summary: "Simulated summary of content." };
        },
        getDocumentSummary: async (docId: string) => {
            if (IS_TRUTH_ONLY_MODE) return (await apiClient.get(`/documents/${docId}/summary`)).data;
            await delay(1500);
            return { summary: "Cached summary.", cached: true, model: 'mock' };
        }
    },

    // --- TESTING ---
    testing: {
        run: async (suiteType: string) => {
            if (IS_TRUTH_ONLY_MODE) return (await apiClient.post('/testing/run', { suite_type: suiteType })).data;
            await delay(2000);
            return { status: 'simulated_pass', logs: ['All checks passed.'], duration: '2.4s' };
        },
        getStatus: async () => {
            if (IS_TRUTH_ONLY_MODE) return (await apiClient.get('/testing/status')).data;
            return { status: 'ready', available_suites: ['unit', 'integration'] };
        }
    },

    // --- INTEGRATIONS (Slack/Notion) ---
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

    // --- UPLOAD ---
    uploadDataset: async (formData: FormData) => {
        const response = await apiClient.post('/integrations/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // --- NEXUS ---
    nexus: {
        chat: async (query: string, mode: string = 'chat') => {
            if (IS_TRUTH_ONLY_MODE) return (await apiClient.post('/nexus/chat', { query, mode })).data;
            return { answer: `[Simulated Nexus] Received: ${query}` };
        },
        speak: async (text: string) => {
            if (IS_TRUTH_ONLY_MODE) return (await apiClient.post('/nexus/speak', { text })).data;
            return { audioContent: null };
        }
    },

    // --- E2E REAL BACKEND INTEGRATION ---
    e2e: {
        getStatus: async () => {
            return (await apiClient.get('/e2e/status')).data;
        },
        getModelHealth: async (model: string) => {
            // Use POST test for active check, or GET health if available
            return (await apiClient.get(`/e2e/model/${model}/health`)).data;
        },
        testModel: async (model: string, prompt: string) => {
            return (await apiClient.post(`/e2e/model/${model}/test`, { test_prompt: prompt })).data;
        },
        toggleMock: async (model: string, mode: 'mock' | 'fail' | 'rate_limit', enabled: boolean) => {
            if (enabled) {
                return (await apiClient.post('/e2e/mock/enable', { model, mode })).data;
            } else {
                return (await apiClient.post('/e2e/mock/disable', { model })).data;
            }
        },
        startTestRun: async (runId: string, type: 'full' | 'models' | 'reports' = 'full') => {
            return (await apiClient.post('/e2e/test-run', { run_id: runId, test_type: type })).data;
        },
        getProcessingStatus: async () => {
            return (await apiClient.get('/e2e/processing/status')).data;
        },
        listReports: async (runId: string) => {
            return (await apiClient.get(`/e2e/reports/list?run_id=${runId}`)).data;
        },
        generateReport: async (runId: string, format: 'pdf' | 'markdown') => {
            return (await apiClient.post('/e2e/reports/generate', { run_id: runId, format })).data;
        }
    }
};