import { describe, expect, it } from 'vitest';
import { normalizeModelTrainingSnapshot } from '../modelTrainingView.utils';

describe('modelTrainingView.utils', () => {
    it('позначає екран чесно порожнім без вигаданих метрик і логів', () => {
        const snapshot = normalizeModelTrainingSnapshot(null, [], [], null);

        expect(snapshot.hasAnyData).toBe(false);
        expect(snapshot.session.statusLabel).toBe('Очікування');
        expect(snapshot.session.modelLabel).toBe('Н/д');
        expect(snapshot.accuracyHeadline).toBe('Н/д');
        expect(snapshot.metrics).toEqual([]);
        expect(snapshot.runs).toEqual([]);
        expect(snapshot.logs).toEqual([]);
        expect(snapshot.resources.cpuLabel).toBe('Н/д');
    });

    it('нормалізує активну сесію навчання з прогресом, епохами і loss', () => {
        const snapshot = normalizeModelTrainingSnapshot(
            {
                status: 'running',
                activeModel: 'Predator Core',
                progress: 48.4,
                currentEpoch: 6,
                totalEpochs: 12,
                loss: 0.1842,
                queueSize: 3,
                startTime: '2026-03-30T09:00:00Z',
                logs: ['[09:01] Ініціалізовано сесію'],
            },
            [],
            [],
            {
                cpu_usage: 0,
                cpu_percent: 72.6,
                cpu_count: 8,
                memory_usage: 0,
                memory_percent: 61.4,
                memory_total: 0,
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
                active_tasks: 14,
                uptime: '1d',
                uptime_seconds: 86400,
                documents_total: 0,
                search_rate: 0,
                avg_latency: 183,
                indexing_rate: 0,
                total_indices: 0,
                storage_gb: 0,
                last_sync: null,
                timestamp: '2026-03-30T09:15:00Z',
            },
        );

        expect(snapshot.hasAnyData).toBe(true);
        expect(snapshot.session.statusKey).toBe('TRAINING');
        expect(snapshot.session.modelLabel).toBe('Predator Core');
        expect(snapshot.session.progressLabel).toBe('48%');
        expect(snapshot.session.epochLabel).toBe('6 / 12');
        expect(snapshot.session.lossLabel).toBe('0.1842');
        expect(snapshot.session.queueLabel).toBe('3 в черзі');
        expect(snapshot.logs).toEqual(['[09:01] Ініціалізовано сесію']);
        expect(snapshot.resources.cpuLabel).toBe('73%');
        expect(snapshot.resources.memoryLabel).toBe('61%');
        expect(snapshot.resources.taskLabel).toBe('14 активних');
    });

    it('будує історію запусків і графік тільки з підтверджених job metrics', () => {
        const snapshot = normalizeModelTrainingSnapshot(
            {},
            {
                history: [
                    {
                        id: 'run-2',
                        name: 'LoRA митний профіль',
                        status: 'completed',
                        progress: 100,
                        metrics: { epoch: 2, accuracy: 0.93, loss: 0.11 },
                        updated_at: '2026-03-30T11:00:00Z',
                    },
                ],
            },
            {
                jobs: [
                    {
                        id: 'run-1',
                        model_name: 'Базовий трансформер',
                        status: 'running',
                        progress: 62,
                        metrics: { epoch: 1, accuracy: 0.88, loss: 0.24 },
                        started_at: '2026-03-30T10:00:00Z',
                        message: 'Триває перший цикл валідації',
                    },
                ],
            },
            null,
        );

        expect(snapshot.metrics).toHaveLength(2);
        expect(snapshot.metrics[0].epoch).toBe(1);
        expect(snapshot.metrics[0].accuracy).toBe(88);
        expect(snapshot.metrics[1].loss).toBe(0.11);
        expect(snapshot.runs[0].id).toBe('run-2');
        expect(snapshot.runs[0].statusLabel).toBe('Завершено');
        expect(snapshot.runs[0].accuracyLabel).toBe('93%');
        expect(snapshot.runs[1].progressLabel).toBe('62%');
        expect(snapshot.logs[0]).toMatch(/валідації/i);
    });
});
