const BASE = '';

const http = {
    get: async (url: string) => {
        const response = await fetch(`${BASE}${url}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
        return response.json();
    },
    post: async (url: string, data: unknown) => {
        const response = await fetch(`${BASE}${url}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
        return response.json();
    },
};

export const api = {
    // ── Legacy proxy ───────────────────────────────────────────────────────
    get: http.get,
    post: http.post,

    // ── V25 System Status ──────────────────────────────────────────────────
    v25: {
        getLiveAlerts: () => http.get('/api/v25/status/alerts'),
        getLiveQueues: () => http.get('/api/v25/status/queues'),
        getLiveHealth: () => http.get('/api/v25/status/health'),
    },

    // ── Market Nervous System (5 Layers + CERS) ────────────────────────────
    nerve: {
        /** Dataset #200 — Global Economic Climate Index */
        getMarketPulse: () => http.get('/api/v1/nerve/pulse'),

        /** Full 5-layer CERS profile for an entity (UUID or ЄДРПОУ) */
        getEntityProfile: (entityId: string) =>
            http.get(`/api/v1/nerve/profile/${entityId}`),

        /** CERS formula breakdown and threshold table */
        getCersFormula: () => http.get('/api/v1/nerve/cers/formula'),

        /** Strategic governance overview (institutional + structural layers) */
        getMarketOverview: () => http.get('/api/v1/nerve/overview'),

        /** Recent predictive alerts (Layer 5, DS 181-200) */
        getRecentAlerts: (limit = 10) =>
            http.get(`/api/v1/nerve/alerts/recent?limit=${limit}`),

        /** Status of all 5 analytical layers */
        getLayersStatus: () => http.get('/api/v1/nerve/layers/status'),

        /** Trigger deep entity scan (POST) */
        triggerScan: (entityId: string, entityType = 'company') =>
            http.post(`/api/v1/nerve/scan/${entityId}?entity_type=${entityType}`, {}),
    },

    // ── Infrastructure ──────────────────────────────────────────────────────
    getClusterStatus: () => http.get('/api/v1/cluster/status'),
    getMonitoringTargets: () => http.get('/api/v1/monitoring/targets'),
    streamSystemLogs: () => http.get('/api/v1/system/logs/stream'),
};
