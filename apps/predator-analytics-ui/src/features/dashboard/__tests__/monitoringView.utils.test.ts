import { describe, expect, it } from 'vitest';
import {
    appendMetricPoint,
    hasVisibleClusterData,
    normalizeClusterSnapshot,
    normalizePipelineJobs,
    normalizeSystemLogs,
} from '../monitoringView.utils';

describe('monitoringView.utils', () => {
    it('не додає синтетичні точки в історію без валідного значення', () => {
        const history = [{ label: '10:00', value: 42 }];

        expect(appendMetricPoint(history, null, '2026-03-30T10:10:00Z')).toEqual(history);
        expect(appendMetricPoint(history, Number.NaN, '2026-03-30T10:10:00Z')).toEqual(history);
    });

    it('нормалізує системні логи без випадкової латентності', () => {
        const logs = normalizeSystemLogs([
            {
                timestamp: '2026-03-30T10:15:00Z',
                service: 'core-api',
                level: 'warn',
                message: 'Черга ingestion перевищила поріг',
            },
        ]);

        expect(logs).toHaveLength(1);
        expect(logs[0].service).toBe('CORE-API');
        expect(logs[0].level).toBe('WARN');
        expect(logs[0].latencyLabel).toBeNull();
        expect(logs[0].id).toContain('2026-03-30T10:15:00Z');
    });

    it('нормалізує ingestion jobs без домальованого прогресу', () => {
        const jobs = normalizePipelineJobs([
            {
                job_id: 'job-1',
                status: 'FAILED',
                file_name: 'customs.csv',
                failed_records: 12,
            },
            {
                job_id: 'job-2',
                status: 'PROCESSING',
                progress_pct: 48,
                successful_records: 120,
                total_records: 250,
            },
        ]);

        expect(jobs[0].id).toBe('job-1');
        expect(jobs[0].title).toBe('customs.csv');
        expect(jobs[0].progress).toBeNull();
        expect(jobs[0].statusLabel).toBe('Помилка');
        expect(jobs[0].processedLabel).toMatch(/12 помилок/i);

        expect(jobs[1].progress).toBe(48);
        expect(jobs[1].statusLabel).toBe('Обробка');
        expect(jobs[1].processedLabel).toMatch(/120 з 250/i);
    });

    it('позначає кластер чесно порожнім, якщо бекенд не повернув вузли або поди', () => {
        const cluster = normalizeClusterSnapshot({});

        expect(cluster.nodeCount).toBeNull();
        expect(cluster.podCount).toBeNull();
        expect(hasVisibleClusterData(cluster)).toBe(false);
    });

    it('витягає вузли і поди з кластерного знімка', () => {
        const cluster = normalizeClusterSnapshot({
            status: 'healthy',
            nodes: [{ id: 'n1', name: 'node-a', status: 'Ready' }],
            pods: [{ id: 'p1', name: 'core-api', status: 'Running', cpu: '120m', memory: '256Mi' }],
        });

        expect(cluster.statusLabel).toBe('Справно');
        expect(cluster.nodeCount).toBe(1);
        expect(cluster.podCount).toBe(1);
        expect(cluster.nodes[0].name).toBe('node-a');
        expect(cluster.pods[0].detail).toMatch(/120m/);
        expect(hasVisibleClusterData(cluster)).toBe(true);
    });
});
