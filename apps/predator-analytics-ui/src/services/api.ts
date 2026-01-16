import axios from 'axios';
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

// V25 Canonical Client (Internal)
export const v25Client = axios.create({
    baseURL: '/api/v25',
    headers: {
        'Content-Type': 'application/json',
    }
});

// Shared interceptor for Auth
const authInterceptor = (config: any) => {
    const token = sessionStorage.getItem('predator_auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
};

apiClient.interceptors.request.use(authInterceptor as any);
v25Client.interceptors.request.use(authInterceptor as any);

// Truth-only mode: no simulated delays, no mock fallbacks.

const optimizerApi = {
    getStatus: async () => {
        return (await v25Client.get('/optimizer/status')).data;
    },
    trigger: async (reason: string = 'manual') => {
        return (await v25Client.post('/optimizer/trigger', { reason })).data;
    },
    getMetrics: async () => {
        return (await v25Client.get('/optimizer/metrics')).data;
    },
    getHistory: async () => {
        return (await v25Client.get('/optimizer/history')).data?.history || [];
    }
};

export const api = {
    // --- SYSTEM ---
    saveConfig: async (config: any) => {
        return (await apiClient.post('/system/config/save', config)).data;
    },
    getLiveAlerts: async () => {
        return (await v25Client.get('/monitoring/alerts')).data;
    },
    lockdown: async () => {
        return (await v25Client.post('/system/lockdown')).data;
    },
    syncETL: async () => {
        return (await v25Client.post('/etl/sync')).data;
    },
    runOptimizer: async () => {
        return (await v25Client.post('/optimizer/run')).data;
    },
    restartServices: async () => {
        return (await v25Client.post('/system/restart')).data;
    },
    generateDataset: async (config: any) => {
        return (await v25Client.post('/dataset/generate', config)).data;
    },
    getTrainingHistory: async () => {
        return (await v25Client.get('/ml/training/history')).data;
    },
    getMLJobs: async () => {
        return (await v25Client.get('/ml/jobs')).data;
    },
    getLogs: async () => {
        return (await v25Client.get('/system/status')).data;
    },
    getConfig: async () => {
        return (await apiClient.get('/system/config')).data;
    },
    getStatus: async () => {
        return (await v25Client.get('/system/status')).data;
    },

    // --- DATABASES (UA-Sources) ---
    getDatabases: async () => {
        return (await apiClient.get('/databases/')).data;
    },
    getVectors: async () => {
        return (await apiClient.get('/databases/vectors')).data;
    },
    executeQuery: async (query: string, params: any = {}) => {
        return (await apiClient.post('/databases/query', { query, params })).data;
    },

    // --- CONNECTORS & SOURCES ---
    getConnectors: async () => {
        return (await apiClient.get('/sources/connectors')).data;
    },
    getSources: async () => {
        return (await apiClient.get('/sources/')).data;
    },
    testConnector: async (id: string) => {
        return (await apiClient.post(`/sources/connectors/${id}/test`)).data;
    },
    syncConnector: async (id: string) => {
        return (await apiClient.post(`/sources/connectors/${id}/sync`)).data;
    },
    createDataSource: async (data: any) => {
        return (await apiClient.post('/sources/', data)).data;
    },
    uploadSourceFile: async (sourceId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return (await apiClient.post(`/sources/${sourceId}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })).data;
    },
    uploadDataset: async (formData: FormData, onProgress?: (progressEvent: any) => void) => {
        const response = await apiClient.post('/data/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: onProgress,
        });
        return response.data;
    },
    getSourcePreview: async (sourceId: string) => {
        return (await apiClient.get(`/sources/${sourceId}/preview`)).data;
    },
    syncSource: async (id: string) => {
        return (await apiClient.post(`/sources/${id}/sync`)).data;
    },
    getSourceLogs: async (id: string) => {
        return (await apiClient.get(`/sources/${id}/logs`)).data;
    },

    // --- SECRETS & INTEGRATION CONFIG ---
    getSecrets: async () => {
        return (await apiClient.get('/sources/secrets')).data;
    },
    saveSecret: async (id: string, value: string) => {
        return (await apiClient.post(`/sources/secrets/${id}`, { value })).data;
    },
    validateSecret: async (id: string, value: string) => {
        return (await apiClient.post(`/sources/secrets/${id}/validate`, { value })).data;
    },
    getIntegrationSources: async (type: 'FILE' | 'WEB' | 'API') => {
        return (await apiClient.get(`/sources/list?type=${type}`)).data;
    },
    getTelegramBots: async () => {
        return (await apiClient.get('/sources/bots')).data;
    },

    // --- CATALOG ---
    getDataCatalog: async () => {
        return (await apiClient.get('/sources/catalog')).data;
    },
    getUserTemplates: async () => {
        return (await apiClient.get('/sources/templates')).data;
    },
    getAutoDatasets: async () => {
        return (await apiClient.get('/sources/datasets/auto')).data;
    },

    // --- SECURITY ---
    getWafLogs: async () => {
        return (await apiClient.get('/security/waf')).data;
    },
    getSecurityLogs: async () => {
        return (await apiClient.get('/security/audit')).data;
    },

    // --- LLM ---
    getLLMBenchmarks: async () => {
        try {
            return (await apiClient.get('/llm/benchmarks')).data;
        } catch (e) {
            console.warn('LLM Benchmarks endpoint not available');
            return [];
        }
    },
    getAutoMLExperiments: async () => {
        try {
            return (await apiClient.get('/ml/experiments')).data;
        } catch (e) {
            console.warn('AutoML experiments endpoint not available');
            return [];
        }
    },
    getLLMConfig: async () => {
        return (await apiClient.get('/council/config')).data;
    },

    // --- INFRASTRUCTURE ---
    getClusterStatus: async () => {
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
    },
    getEnvironments: async () => {
        try {
            return (await apiClient.get('/system/environments')).data;
        } catch (e) {
            console.warn('Environments endpoint not available');
            return [];
        }
    },
    getPipelines: async () => {
        try {
            return (await apiClient.get('/system/pipelines')).data;
        } catch (e) {
            console.warn('Pipelines endpoint not available');
            return [];
        }
    },
    triggerPipeline: async (type: 'FULL' | 'TEST') => {
        throw new Error('Pipeline trigger is not available in truth-only mode until backend endpoint is implemented');
    },
    syncEnvironment: async (id: string) => {
        throw new Error('Environment sync is not available in truth-only mode until backend endpoint is implemented');
    },
    getMonitoringTargets: async () => {
        try {
            return (await v25Client.get('/monitoring/targets')).data;
        } catch (e) {
            try {
                const infra = (await apiClient.get('/system/infrastructure')).data;
                return Object.entries(infra.components || {}).map(([name, data]: [string, any]) => ({
                    id: name,
                    name: name.charAt(0).toUpperCase() + name.slice(1),
                    status: data.status === 'UP' ? 'UP' : 'DOWN',
                    latency: data.latency_ms ? `${data.latency_ms}ms` : 'N/A'
                }));
            } catch (e2) {
                return [];
            }
        }
    },
    streamSystemLogs: async () => {
        try {
            const logs = (await v25Client.get('/monitoring/logs?limit=5')).data;
            return logs.map((log: any) => ({
                ts: log.timestamp || new Date().toLocaleTimeString(),
                service: log.service || 'system',
                level: log.level || 'INFO',
                msg: log.message || log.msg
            }));
        } catch (e) {
            return [];
        }
    },

    // --- EVOLUTION & NAS ---
    getEvolutionStatus: async () => {
        try {
            if (IS_TRUTH_ONLY_MODE) return (await apiClient.get('/evolution/status')).data;
        } catch (e) { console.warn("Evolution offline"); }
        return { active: false, phase: 'IDLE', logs: [], progress: 0 };
    },
    startEvolutionCycle: async (config?: any) => {
        return (await apiClient.post('/evolution/start', config)).data;
    },
    getNasTournaments: async () => {
        return (await apiClient.get('/evolution/tournaments')).data;
    },
    getNasModels: async (tournamentId?: string) => {
        return (await apiClient.get('/evolution/models', { params: { tournament_id: tournamentId } })).data;
    },
    getNasProviders: async () => {
        return (await apiClient.get('/llm/providers')).data;
    },

    // --- BRAIN & COUNCIL ---
    askOpponent: async (query: string) => {
        try {
            return (await apiClient.post('/opponent/ask', { query })).data;
        } catch (e) {
            return {
                answer: "Service Unavailable: Red Team module is offline.",
                sources: [],
                confidence: 0.0,
                model: { mode: 'OFFLINE', name: 'System', confidence: 0, executionTimeMs: 0 }
            };
        }
    },
    runCouncil: async (query: string, models?: string[], peerReview: boolean = true) => {
        try {
            return (await apiClient.post('/council/query', {
                query,
                models,
                enable_peer_review: peerReview
            })).data;
        } catch (e) {
            throw e;
        }
    },
    runCouncilStrategy: async () => {
        try {
            return (await apiClient.post('/council/strategy')).data;
        } catch (e) {
            throw e;
        }
    },
    getCouncilHistory: async (limit: number = 10) => {
        return (await apiClient.get(`/council/history?limit=${limit}`)).data;
    },


    // --- SEARCH ---
    search: {
        submitFeedback: async (resultId: string, type: string) => {
            return (await apiClient.post('/search/feedback', { result_id: resultId, feedback_type: type })).data;
        },
        query: async (params: { q: string, rerank?: boolean, mode?: string, filters?: any }) => {
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
    },

    // --- OPTIMIZER ---
    optimizer: optimizerApi,

    // --- ML Utils ---
    ml: {
        explain: async (query: string, documentId: string, content?: string) => {
            return (await apiClient.post('/ml/explain', { query, document_id: documentId, content })).data;
        },
        summarize: async (text: string) => {
            return (await apiClient.post('/ml/summarize', { text })).data;
        },
        getDocumentSummary: async (docId: string) => {
            return (await apiClient.get(`/documents/${docId}/summary`)).data;
        }
    },

    // --- TESTING ---
    testing: {
        run: async (suiteType: string) => {
            return (await apiClient.post('/testing/run', { suite_type: suiteType })).data;
        },
        getStatus: async () => {
            return (await apiClient.get('/testing/status')).data;
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
                return (await apiClient.post('/integrations/slack/sync', { source: 'slack', target_id: channelId })).data;
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
                return (await apiClient.post('/integrations/notion/sync', { source: 'notion', target_id: pageId })).data;
            }
        }
    },

    // --- NEXUS ---
    nexus: {
        chat: async (query: string, mode: string = 'chat') => {
            return (await apiClient.post('/nexus/chat', { query, mode })).data;
        },
        speak: async (text: string) => {
            return (await apiClient.post('/nexus/speak', { text })).data;
        }
    },

    // --- SUPERINTELLIGENCE v25.0 ---
    ai: {
        query: async (query: string, mode: string = 'auto', context?: Record<string, any>) => {
            return (await v25Client.post('/ai/query', { query, mode, context })).data;
        },
        getHealth: async () => {
            return (await v25Client.get('/ai/health')).data;
        },
        getAgents: async () => {
            return (await v25Client.get('/ai/agents')).data;
        },
        getMetrics: async () => {
            return (await v25Client.get('/ai/metrics')).data;
        },
        triggerSelfImprovement: async () => {
            return (await v25Client.post('/ai/self-improve')).data;
        },
        healing: {
            trigger: async (component: string = 'all') => {
                return (await v25Client.post(`/ai/healing/trigger?component=${component}`)).data;
            },
            getHistory: async () => {
                return (await v25Client.get('/ai/healing/history')).data;
            }
        },
        // Temporal Workflow Integration
        workflow: {
            startSelfImprovement: async (reason: string = 'manual') => {
                return (await v25Client.post(`/workflow/self-improvement?reason=${reason}`)).data;
            },
            startSelfHealing: async (component: string = 'all', failureType: string = 'unknown', severity: string = 'medium') => {
                return (await v25Client.post(`/workflow/self-healing?component=${component}&failure_type=${failureType}&severity=${severity}`)).data;
            },
            getStatus: async (workflowId: string) => {
                return (await v25Client.get(`/workflow/status/${workflowId}`)).data;
            }
        },
        // Prometheus Metrics
        getPrometheusMetrics: async () => {
            return (await v25Client.get('/metrics')).data;
        }
    },

    // --- E2E REAL BACKEND INTEGRATION ---
    e2e: {
        getStatus: async () => {
            return (await apiClient.get('/e2e/status')).data;
        },
        getModelHealth: async (model: string) => {
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
    },
    v25: {
        getLiveQueues: async () => {
            return (await v25Client.get('/monitoring/queues')).data;
        },
        getLiveHealth: async () => {
            return (await v25Client.get('/monitoring/health')).data;
        },
        getLiveSagas: async () => {
            return (await v25Client.get('/monitoring/sagas')).data;
        },
        getLiveAlerts: async () => {
            return (await v25Client.get('/monitoring/alerts')).data;
        },
        getSystemStatus: async () => {
            return (await v25Client.get('/system/status')).data;
        },
        getSystemStage: async () => {
            return (await v25Client.get('/system/stage')).data;
        },
        getStats: async () => {
            return (await v25Client.get('/stats')).data;
        },
        runSystemDoctor: async () => {
            return (await v25Client.get('/system/doctor')).data;
        },
        applyDoctorFixes: async (fixes: string[]) => {
            return (await v25Client.post('/system/doctor/fix', fixes)).data;
        },
        runSystemRestart: async () => {
            return (await v25Client.post('/system/restart')).data;
        },
        runSystemRollback: async () => {
            return (await v25Client.post('/system/rollback')).data;
        },
        toggleLockdown: async () => {
            return (await v25Client.post('/system/lockdown')).data;
        },
        getLockdownStatus: async () => {
            return (await v25Client.get('/system/lockdown')).data;
        },
        trinity: {
            process: async (command: string) => {
                return (await v25Client.post('/trinity/process', { command })).data;
            },
            getAuditLogs: async (limit: number = 20) => {
                return (await v25Client.get(`/trinity/audit-logs?limit=${limit}`)).data;
            },
            getLogs: async (limit: number = 20) => {
                return (await v25Client.get(`/trinity/audit-logs?limit=${limit}`)).data;
            },
            getLogDetail: async (id: string) => {
                return (await v25Client.get(`/trinity/logs/${id}`)).data;
            }
        },
        optimizer: optimizerApi,
        ml: {
            fineTune: async (dataset: string) => {
                return (await v25Client.post('/ml/fine-tune', { dataset })).data;
            },
            getJobs: async () => {
                return (await v25Client.get('/ml/jobs')).data;
            },
            getArbitrationScores: async () => {
                return (await v25Client.get('/arbitration/scores')).data;
            }
        },
        getRecommendations: async () => {
            return (await v25Client.get('/recommendations')).data;
        },
        triggerSimulation: async (target: string, intensity: number = 0.5) => {
            return (await v25Client.post('/simulation/stress-test', null, { params: { target, intensity } })).data;
        },
        getSimulationStatus: async (simId: string) => {
            return (await v25Client.get(`/simulation/status/${simId}`)).data;
        },
        triggerMaintenance: async (action: string) => {
            return (await v25Client.post('/maintenance/run', { action })).data;
        },
        training: {
            trigger: async () => {
                return (await v25Client.post('/training/trigger')).data;
            },
            status: async () => {
                return (await v25Client.get('/training/status')).data;
            }
        },
        getNotifications: async () => {
            try {
                const notifications = (await v25Client.get('/user/notifications')).data;
                return notifications;
            } catch (e) {
                try {
                    const [health, queues] = await Promise.all([
                        v25Client.get('/monitoring/health').catch(() => ({ data: null })),
                        v25Client.get('/monitoring/queues').catch(() => ({ data: null }))
                    ]);

                    const notifications: any[] = [];
                    if (health.data) {
                        const unhealthyServices = Object.entries(health.data.services || {})
                            .filter(([_, v]: [string, any]) => v.status !== 'UP');
                        unhealthyServices.forEach(([name]) => {
                            notifications.push({
                                id: `health-${name}`,
                                type: 'error',
                                title: `Проблема сервісу ${name}`,
                                message: `Сервіс ${name} не відповідає належним чином.`,
                                time: 'Зараз'
                            });
                        });
                    }

                    if (notifications.length === 0) {
                        notifications.push({
                            id: 'system-ok',
                            type: 'success',
                            title: 'Система Операційна',
                            message: 'Всі служби працюють нормально.',
                            time: 'Зараз'
                        });
                    }
                    return notifications;
                } catch (e2) {
                    return [];
                }
            }
        },
        getRealtimeMetrics: async () => {
            return (await v25Client.get('/metrics/realtime')).data;
        },
        // --- Аналітичні операції PREDATOR v25 ---
        analyze: async (query: string, tenantId: string = 'default') => {
            return (await v25Client.post('/analyze', { query, tenant_id: tenantId })).data;
        },
        getCases: async (limit: number = 20) => {
            return (await v25Client.get('/cases', { params: { limit } })).data;
        },
        getCaseDetail: async (caseId: string) => {
            return (await v25Client.get(`/cases/${caseId}`)).data;
        },
        // --- AZR ENGINE (Autonomous Evolution) ---
        azr: {
             getStatus: async () => {
                 return (await v25Client.get('/azr/status')).data;
             },
             getAudit: async (limit: number = 50) => {
                 return (await v25Client.get(`/azr/audit?limit=${limit}`)).data;
             },
             freeze: async () => {
                 return (await v25Client.post('/azr/freeze')).data;
             },
             unfreeze: async () => {
                 return (await v25Client.post('/azr/unfreeze')).data;
             },
             // Governance (DAO)
             governance: {
                 propose: async (title: string, description: string, category: string = "TWEAK") => {
                     return (await v25Client.post('/azr/governance/propose', { title, description, category })).data;
                 },
                 getConstitution: async () => {
                     return (await v25Client.get('/azr/constitution')).data;
                 }
             }
        }
    },

    // --- DOCUMENTS (Gold Layer Registry) ---
    documents: {
        list: async (params: { limit?: number, offset?: number, category?: string, source?: string } = {}) => {
            const response = await apiClient.get('/documents', { params });
            return response.data;
        },
        get: async (id: string) => {
            const response = await apiClient.get(`/documents/${id}`);
            return response.data;
        },
        delete: async (id: string) => {
            const response = await apiClient.delete(`/documents/${id}`);
            return response.data;
        }
    },

    // --- KNOWLEDGE GRAPH (v25 Canonical) ---
    graph: {
        getSummary: async () => {
            try {
                return (await v25Client.get('/graph/summary')).data;
            } catch (e) {
                return { total_nodes: 0, total_edges: 0, categories: {} };
            }
        },
        summary: async () => {
            try {
                return (await v25Client.get('/graph/summary')).data;
            } catch (e) {
                return { total_nodes: 0, total_edges: 0, categories: {} };
            }
        },
        search: async (q: string, depth: number = 2) => {
            try {
                return (await v25Client.get(`/graph/search`, { params: { q, depth } })).data;
            } catch (e) {
                return { nodes: [], edges: [] };
            }
        },
        build: async (docId: string) => {
            return (await v25Client.post(`/graph/build/${docId}`)).data;
        },
        execute: async (query: string) => {
            return (await v25Client.post('/graph/query', { query })).data;
        }
    },

    // --- CASES (PREDATOR Core Value) ---
    cases: {
        list: async (filters?: { status?: string, sector?: string }) => {
            const res = await apiClient.get('/cases/', { params: filters });
            return res.data;
        },
        getStats: async () => {
            const res = await apiClient.get('/cases/stats');
            return res.data;
        },
        get: async (id: string) => {
            const res = await apiClient.get(`/cases/${id}`);
            return res.data;
        },
        archive: async (id: string) => {
            const res = await apiClient.post(`/cases/${id}/archive`);
            return res.data;
        },
        escalate: async (id: string) => {
            const res = await apiClient.post(`/cases/${id}/escalate`);
            return res.data;
        }
    }
};