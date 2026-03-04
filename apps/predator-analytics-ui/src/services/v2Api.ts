/**
 * PREDATOR v55.1 — v2 API Client
 * Real backend integration for CERS, Behavioral, Pipeline, Signals, Entities.
 * All endpoints hit /api/v2/* (proxied to backend:8000 or 194.177.1.240:9080)
 */

import axios from 'axios';

const getMetaEnv = () => {
    try {
        return (import.meta as any).env || {};
    } catch {
        return {};
    }
};

const metaEnv = getMetaEnv();

// v2 API base — uses same backend, different prefix
const V2_BASE = metaEnv.VITE_API_URL
    ? `${metaEnv.VITE_API_URL.replace(/\/api\/v1\/?$/, '')}/api/v2`
    : '/api/v2';

export const v2Client = axios.create({
    baseURL: V2_BASE,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
});

// Auth interceptor
v2Client.interceptors.request.use((config: any) => {
    const token = sessionStorage.getItem('predator_auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Resilience interceptor — safe fallbacks on 5xx/network errors
v2Client.interceptors.response.use(
    (r) => r,
    (error) => {
        if (!error.response || error.response.status >= 500) {
            console.warn(`[v2 Resilience] ${error.config?.url} failed.`);
            if (typeof window !== 'undefined') {
                (window as any).__BACKEND_OFFLINE_MODE__ = true;
                window.dispatchEvent(new CustomEvent('predator-backend-offline'));
            }
        }
        return Promise.reject(error);
    }
);

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface CERSScore {
    ueid: string;
    score: number;
    level: string;
    level_ua: string;
    level_en: string;
    confidence: number;
    components: {
        behavioral: number;
        institutional: number;
        influence: number;
        structural: number;
        predictive: number;
    };
    calculated_at: string;
}

export interface CERSHistoryItem {
    score: number;
    level: string;
    level_en: string;
    confidence: number;
    calculated_at: string;
}

export interface CERSHistoryResponse {
    ueid: string;
    history: CERSHistoryItem[];
    trend: string;
    avg_score: number;
}

export interface BehavioralIndices {
    ueid: string;
    bvi: number;
    ass: number;
    cp: number;
    inertia_index: number;
    aggregate: number;
    confidence: number;
    calculated_at: string;
}

export interface Signal {
    id: string;
    signal_type: string;
    topic: string;
    layer: string;
    ueid?: string;
    score?: number;
    confidence?: number;
    summary?: string;
    created_at: string;
}

export interface SignalListResponse {
    total: number;
    items: Signal[];
}

export interface EntityResult {
    ueid: string;
    entity_type: string;
    name: string;
    name_normalized: string;
    edrpou?: string;
    inn?: string;
    is_new: boolean;
    created_at: string;
    updated_at: string;
}

export interface PipelineRunRequest {
    source: string;
    entity_type?: string;
    records: Record<string, any>[];
}

export interface PipelineSteps {
    fusion: {
        records_processed: number;
        entities_resolved: number;
        entities_created: number;
        errors: string[];
    };
    behavioral: {
        entities_scored: number;
        errors: any[];
        results: Record<string, { bvi: number; ass: number; cp: number; aggregate: number }>;
    };
    cers: {
        entities_scored: number;
        errors: any[];
        results: Record<string, { score: number; level: string; level_ua: string }>;
    };
}

export interface PipelineRunResponse {
    pipeline: string;
    source: string;
    unique_entities: number;
    steps: PipelineSteps;
}

export interface RescoreResult {
    ueid: string;
    behavioral: {
        bvi: number; ass: number; cp: number; aggregate: number; confidence: number;
    };
    cers: {
        score: number; level: string; level_ua: string; level_en: string; confidence: number;
    };
    status: string;
}

export interface DecisionArtifact {
    id: string;
    decision_type: string;
    confidence_score: number;
    explanation: Record<string, any>;
    created_at: string;
}

// ─────────────────────────────────────────
// v2 API
// ─────────────────────────────────────────

export const v2Api = {

    // ── Entities ──
    entities: {
        resolve: async (data: { name: string; entity_type: string; edrpou?: string; inn?: string }) => {
            return (await v2Client.post<EntityResult>('/entities/resolve', data)).data;
        },
        get: async (ueid: string) => {
            return (await v2Client.get<EntityResult>(`/entities/${ueid}`)).data;
        },
        search: async (q: string, params?: { entity_type?: string; limit?: number; offset?: number }) => {
            return (await v2Client.get<{ total: number; items: EntityResult[]; query: string }>('/entities/', {
                params: { q, ...params },
            })).data;
        },
    },

    // ── Analytics (CERS + Indices) ──
    analytics: {
        getCERS: async (ueid: string): Promise<CERSScore> => {
            return (await v2Client.get<CERSScore>(`/analytics/cers/${ueid}`)).data;
        },
        calculateCERS: async (ueid: string): Promise<CERSScore> => {
            return (await v2Client.post<CERSScore>('/analytics/cers/calculate', { ueid })).data;
        },
        getCERSHistory: async (ueid: string, limit?: number): Promise<CERSHistoryResponse> => {
            return (await v2Client.get<CERSHistoryResponse>(`/analytics/cers/${ueid}/history`, {
                params: limit ? { limit } : undefined,
            })).data;
        },
        getIndices: async (ueid: string): Promise<BehavioralIndices> => {
            return (await v2Client.get<BehavioralIndices>(`/analytics/indices/${ueid}`)).data;
        },
    },

    // ── Signals ──
    signals: {
        list: async (params?: {
            ueid?: string; layer?: string; signal_type?: string; limit?: number; offset?: number;
        }): Promise<SignalListResponse> => {
            return (await v2Client.get<SignalListResponse>('/signals/', { params })).data;
        },
        get: async (id: string): Promise<Signal> => {
            return (await v2Client.get<Signal>(`/signals/${id}`)).data;
        },
    },

    // ── Decisions (WORM Ledger) ──
    decisions: {
        list: async (params?: { decision_type?: string; limit?: number; offset?: number }) => {
            return (await v2Client.get<{ total: number; items: DecisionArtifact[] }>('/decisions/', { params })).data;
        },
        get: async (id: string) => {
            return (await v2Client.get<DecisionArtifact>(`/decisions/${id}`)).data;
        },
    },

    // ── Pipeline ──
    pipeline: {
        run: async (data: PipelineRunRequest): Promise<PipelineRunResponse> => {
            return (await v2Client.post<PipelineRunResponse>('/pipeline/run', data)).data;
        },
        rescore: async (ueid: string): Promise<RescoreResult> => {
            return (await v2Client.post<RescoreResult>(`/pipeline/entity/${ueid}/rescore`)).data;
        },
    },
};

export default v2Api;
