import { describe, expect, it } from 'vitest';
import {
    appendResourcePoint,
    buildOsintSummary,
    buildResourceSnapshot,
    formatAgentHealth,
    normalizeAgents,
    normalizeAgentLogs,
    normalizeFleetAlerts,
    normalizeOsintTools,
} from '../agentsView.utils';

describe('agentsView.utils', () => {
    it('не домальовує здоровʼя або останню дію агентів без підтверджених полів', () => {
        const agents = normalizeAgents([
            {
                id: 'agent-1',
                name: 'Risk Core',
                status: 'active',
            },
        ]);

        expect(agents).toHaveLength(1);
        expect(agents[0].status).toBe('WORKING');
        expect(agents[0].efficiency).toBe(-1);
        expect(formatAgentHealth(agents[0].efficiency)).toBe('Н/д');
        expect(agents[0].lastAction).toBe('Немає підтвердженої дії');
    });

    it('нормалізує системні ресурси лише з підтверджених процентів і не додає порожню точку', () => {
        const emptyHistory = appendResourcePoint(
            [{ time: '10:00', cpu: 42, mem: 58 }],
            null,
        );

        expect(emptyHistory).toEqual([{ time: '10:00', cpu: 42, mem: 58 }]);

        const snapshot = buildResourceSnapshot({
            cpu_usage: 44,
            cpu_percent: 47.2,
            cpu_count: 8,
            memory_usage: 51,
            memory_percent: 54.6,
            memory_total: 17179869184,
            memory_used: 0,
            memory_available: 0,
            disk_usage: 0,
            disk_percent: 0,
            disk_total: 0,
            disk_used: 0,
            disk_free: 0,
            network_bytes_sent: 0,
            network_bytes_recv: 0,
            active_connections: 0,
            active_tasks: 0,
            uptime: '1d',
            uptime_seconds: 86400,
            documents_total: 0,
            search_rate: 0,
            avg_latency: 0,
            indexing_rate: 0,
            total_indices: 0,
            storage_gb: 0,
            timestamp: '2026-03-30T10:15:00Z',
        });

        expect(snapshot.cpuPercent).toBe(47);
        expect(snapshot.memoryPercent).toBe(55);
        expect(snapshot.cpuCapacityLabel).toBe('8 ядер');
        expect(snapshot.memoryCapacityLabel).toMatch(/16/);

        const history = appendResourcePoint([], {
            cpu_usage: 44,
            cpu_percent: 47.2,
            cpu_count: 8,
            memory_usage: 51,
            memory_percent: 54.6,
            memory_total: 17179869184,
            memory_used: 0,
            memory_available: 0,
            disk_usage: 0,
            disk_percent: 0,
            disk_total: 0,
            disk_used: 0,
            disk_free: 0,
            network_bytes_sent: 0,
            network_bytes_recv: 0,
            active_connections: 0,
            active_tasks: 0,
            uptime: '1d',
            uptime_seconds: 86400,
            documents_total: 0,
            search_rate: 0,
            avg_latency: 0,
            indexing_rate: 0,
            total_indices: 0,
            storage_gb: 0,
            timestamp: '2026-03-30T10:15:00Z',
        });

        expect(history).toEqual([{ time: expect.stringMatching(/\d{2}:\d{2}/), cpu: 47, mem: 55 }]);
    });

    it('обʼєднує та сортує сповіщення без вигаданого статусу "все нормально"', () => {
        const alerts = normalizeFleetAlerts(
            [{ id: 'a-1', severity: 'warning', message: 'Черга ingestion зростає', timestamp: '2026-03-30T10:10:00Z', service: 'core-api' }],
            { items: [{ id: 'a-2', severity: 'critical', summary: 'Вузол graph-service недоступний', created_at: '2026-03-30T10:20:00Z', source: 'monitoring' }] },
        );

        expect(alerts).toHaveLength(2);
        expect(alerts[0].id).toBe('a-2');
        expect(alerts[0].severity).toBe('critical');
        expect(alerts[0].sourceLabel).toMatch(/monitoring/i);
        expect(alerts[1].message).toMatch(/ingestion/i);
    });

    it('нормалізує OSINT інструменти і рахує покриття лише з реального списку', () => {
        const tools = normalizeOsintTools([
            {
                id: 'sherlock',
                name: 'Sherlock',
                category: 'СОЦМЕРЕЖІ',
                status: 'online',
                findings_count: 142,
                updated_at: '2026-03-30T10:12:00Z',
            },
            {
                id: 'amass',
                name: 'Amass',
                category: 'МЕРЕЖА',
                status: 'scanning',
                findings: 87,
                last_scan: '2026-03-30T10:18:00Z',
            },
            {
                id: 'maigret',
                name: 'Maigret',
                category: 'СОЦМЕРЕЖІ',
                status: 'offline',
            },
        ]);

        expect(tools).toHaveLength(3);
        expect(tools[0].status).toBe('ОНЛАЙН');
        expect(tools[1].status).toBe('СКАНУЄ');
        expect(tools[1].route).toBe('/graph');
        expect(tools[2].findingsLabel).toBe('Н/д');
        expect(tools[2].lastScanLabel).toBe('Немає підтвердженого запуску');

        const summary = buildOsintSummary(tools);

        expect(summary.totalTools).toBe(3);
        expect(summary.onlineTools).toBe(2);
        expect(summary.activeScans).toBe(1);
        expect(summary.totalFindingsLabel).toBe('229');
        expect(summary.coverageLabel).toBe('67%');
    });

    it('нормалізує логи без підміни англомовними або випадковими полями', () => {
        const logs = normalizeAgentLogs([
            {
                timestamp: '2026-03-30T10:25:00Z',
                service: 'core-api',
                level: 'warn',
                message: 'Час відповіді перевищив поріг',
            },
        ]);

        expect(logs).toEqual([expect.stringMatching(/\[CORE-API\] \[WARN\]/)]);
        expect(logs[0]).toMatch(/Час відповіді перевищив поріг/);
    });
});
