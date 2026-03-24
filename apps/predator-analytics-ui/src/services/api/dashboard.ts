import { apiClient } from './config';

// ─── Типи для Dashboard Overview ─────────────────────────────────────────────

export interface DashboardSummary {
    total_declarations: number;
    total_value_usd: number;
    high_risk_count: number;
    medium_risk_count: number;
    import_count: number;
    export_count: number;
    graph_nodes: number;
    graph_edges: number;
    search_documents: number;
    vectors: number;
    active_pipelines: number;
    completed_pipelines: number;
}

export interface RadarItem {
    name: string;
    value: number;
    count: number;
}

export interface RiskCompany {
    name: string;
    edrpou: string;
    maxRisk: number;
    totalValue: number;
    count: number;
}

export interface DashboardAlert {
    id: string;
    type: string;
    message: string;
    severity: 'critical' | 'warning' | 'info';
    timestamp: string;
    sector: string;
    company: string;
    value: number;
}

export interface EngineInfo {
    id: string;
    name: string;
    score: number;
    trend: string;
    status: 'optimal' | 'calibrating' | 'degraded';
    throughput: number;
    latency: number;
    load: number;
}

export interface InfraComponent {
    status: string;
    records?: number;
    documents?: number;
    vectors?: number;
    nodes?: number;
    edges?: number;
    files?: number;
    keys?: number;
}

export interface CategoryStat {
    count: number;
    value: number;
    avgRisk: number;
}

export interface DashboardOverview {
    summary: DashboardSummary;
    radar: RadarItem[];
    top_risk_companies: RiskCompany[];
    alerts: DashboardAlert[];
    categories: Record<string, CategoryStat>;
    countries: Record<string, { count: number; value: number }>;
    customs_offices: Record<string, { count: number; value: number; highRisk: number }>;
    infrastructure: Record<string, InfraComponent>;
    engines: Record<string, EngineInfo>;
    generated_at: string;
}

// ─── Dashboard API ───────────────────────────────────────────────────────────

export const dashboardApi = {
    /**
     * Отримати агреговану статистику для головного дашборду.
     */
    getOverview: async (): Promise<DashboardOverview> => {
        const response = await apiClient.get('/dashboard/overview');
        return response.data;
    },

    /**
     * Отримати стан аналітичних двигунів.
     */
    getEngines: async (): Promise<Record<string, EngineInfo>> => {
        const response = await apiClient.get('/system/engines');
        return response.data;
    },

    /**
     * Отримати активні алерти.
     */
    getAlerts: async (limit: number = 10): Promise<{ items: DashboardAlert[] }> => {
        const response = await apiClient.get(`/alerts?limit=${limit}`);
        return response.data;
    },

    /**
     * Отримати стан інфраструктури.
     */
    getInfrastructure: async (): Promise<Record<string, InfraComponent>> => {
        const response = await apiClient.get('/system/infrastructure');
        return response.data;
    },
};
