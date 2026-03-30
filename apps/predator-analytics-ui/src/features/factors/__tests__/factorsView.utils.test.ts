import { describe, expect, it } from 'vitest';
import { normalizeFactorsSnapshot } from '../factorsView.utils';
import type { DashboardOverview } from '@/services/api/dashboard';
import type { FactoryStats } from '@/features/factory/types';
import type { SystemStatsResponse } from '@/services/api/system';

const buildOverview = (): DashboardOverview => ({
    summary: {
        total_declarations: 1200,
        total_value_usd: 1500000,
        high_risk_count: 17,
        medium_risk_count: 42,
        import_count: 700,
        export_count: 500,
        graph_nodes: 3100,
        graph_edges: 8800,
        search_documents: 12500,
        vectors: 6400,
        active_pipelines: 6,
        completed_pipelines: 18,
    },
    radar: [],
    top_risk_companies: [],
    alerts: [
        {
            id: 'a-1',
            type: 'aml',
            message: 'Виявлено критичний AML-сигнал',
            severity: 'critical',
            timestamp: '2026-03-30T10:15:00Z',
            sector: 'Фінанси',
            company: 'ТОВ "Альфа"',
            value: 100000,
        },
        {
            id: 'a-2',
            type: 'risk',
            message: 'Потрібна додаткова перевірка',
            severity: 'warning',
            timestamp: '2026-03-30T09:45:00Z',
            sector: 'Логістика',
            company: 'ТОВ "Бета"',
            value: 50000,
        },
    ],
    categories: {},
    countries: {},
    customs_offices: {},
    infrastructure: {},
    engines: {},
    generated_at: '2026-03-30T10:20:00Z',
});

const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim();

const factoryStats: FactoryStats = {
    total_runs: 56,
    total_patterns: 142,
    gold_patterns: 18,
    avg_score: 94.2,
    last_run: '2026-03-30T10:10:00Z',
};

const systemStats: SystemStatsResponse = {
    cpu_usage: 52,
    cpu_percent: 52,
    cpu_count: 12,
    memory_usage: 66,
    memory_percent: 66,
    memory_total: 128000,
    memory_used: 84480,
    memory_available: 43520,
    disk_usage: 41,
    disk_percent: 41,
    disk_total: 1000000,
    disk_used: 410000,
    disk_free: 590000,
    network_bytes_sent: 1024,
    network_bytes_recv: 2048,
    active_connections: 33,
    active_tasks: 14,
    uptime: '4 дні',
    uptime_seconds: 345600,
    documents_total: 9000,
    search_rate: 120,
    avg_latency: 28,
    indexing_rate: 45,
    total_indices: 12,
    storage_gb: 830,
    timestamp: '2026-03-30T10:20:00Z',
};

describe('factorsView.utils', () => {
    it('повертає чесні порожні значення без mock-підстановок', () => {
        const snapshot = normalizeFactorsSnapshot(null, null, null);

        expect(snapshot.summary.activeFactors).toBe('Н/д');
        expect(snapshot.summary.anomalyCount).toBe('Н/д');
        expect(snapshot.summary.systemLoad).toBe('Н/д');
        expect(snapshot.quickStats.every((item) => item.value === 'Н/д')).toBe(true);
        expect(snapshot.modules[0].metrics[0].value).toBe('Н/д');
        expect(snapshot.signals).toEqual([]);
        expect(snapshot.hasAnyData).toBe(false);
    });

    it('нормалізує підтверджені агрегати з factory, dashboard і system stats', () => {
        const snapshot = normalizeFactorsSnapshot(factoryStats, buildOverview(), systemStats);

        expect(snapshot.summary.activeFactors).toBe('142');
        expect(snapshot.summary.anomalyCount).toBe('2');
        expect(snapshot.summary.systemLoad).toBe('52%');
        expect(normalizeWhitespace(snapshot.quickStats[0].value)).toBe('3 100');
        expect(snapshot.quickStats[2].value).toBe('6');
        expect(snapshot.quickStats[3].value).toBe('28 мс');
        expect(snapshot.modules[0].metrics[1].value).toBe('18');
        expect(snapshot.modules[1].metrics[0].value).toBe('17');
        expect(snapshot.modules[2].metrics[0].value).toBe('1');
        expect(snapshot.lastUpdatedLabel).toMatch(/30\.03\.2026/);
        expect(snapshot.hasAnyData).toBe(true);
    });

    it('сортує сигнали за часом і зберігає реальні severity', () => {
        const snapshot = normalizeFactorsSnapshot(factoryStats, buildOverview(), systemStats);

        expect(snapshot.signals).toHaveLength(2);
        expect(snapshot.signals[0].id).toBe('a-1');
        expect(snapshot.signals[0].severityLabel).toBe('Критично');
        expect(snapshot.signals[0].subtitle).toMatch(/ТОВ "Альфа"/);
        expect(snapshot.signals[1].severityLabel).toBe('Попередження');
    });
});
