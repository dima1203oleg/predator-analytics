import { describe, expect, it } from 'vitest';
import {
    normalizeActiveJobsPayload,
    summarizeActiveJobs,
} from '../activeJobsPanel.utils';

describe('activeJobsPanel.utils', () => {
    it('нормалізує фактичний контракт /ingestion/jobs', () => {
        const jobs = normalizeActiveJobsPayload([
            {
                job_id: 'job-1',
                status: 'running',
                file_name: 'imports/customs.csv',
                total_records: 100,
                successful_records: 45,
                progress_pct: 45,
                created_at: '2026-03-30T10:00:00Z',
                started_at: '2026-03-30T10:02:00Z',
            },
        ]);

        expect(jobs).toHaveLength(1);
        expect(jobs[0]).toMatchObject({
            id: 'job-1',
            name: 'customs.csv',
            type: 'csv',
            status: 'processing',
            progressPct: 45,
            stageLabel: 'Виконання',
            itemsProcessed: 45,
            itemsTotal: 100,
        });
        expect(jobs[0].startedAt).toBe('2026-03-30T10:02:00.000Z');
    });

    it('підтримує сумісність з legacy payload без локальних вигадок', () => {
        const jobs = normalizeActiveJobsPayload({
            jobs: [
                {
                    id: 'tg-17',
                    pipeline_type: 'telegram',
                    source_file: 'telegram_customs_watch',
                    state: 'INDEXED',
                    progress: {
                        percent: 88,
                        stage: 'ROUTING_SEARCH',
                        records_processed: 902,
                        records_total: 1024,
                    },
                    completed_at: '2026-03-30T11:20:00Z',
                },
            ],
        });

        expect(jobs).toHaveLength(1);
        expect(jobs[0]).toMatchObject({
            id: 'tg-17',
            name: 'Telegram: @customs_watch',
            type: 'telegram',
            status: 'indexing',
            progressPct: 88,
            stageLabel: 'Маршрутизація в пошук',
            itemsProcessed: 902,
            itemsTotal: 1024,
        });
        expect(jobs[0].completedAt).toBe('2026-03-30T11:20:00.000Z');
    });

    it('рахує активні, завершені та аварійні jobs', () => {
        const summary = summarizeActiveJobs([
            {
                id: 'job-1',
                name: 'a.csv',
                type: 'csv',
                status: 'processing',
                progressPct: 45,
                stageLabel: 'Виконання',
                startedAt: null,
                completedAt: null,
                itemsProcessed: null,
                itemsTotal: null,
                error: null,
            },
            {
                id: 'job-2',
                name: 'b.csv',
                type: 'csv',
                status: 'completed',
                progressPct: 100,
                stageLabel: 'Завершено',
                startedAt: null,
                completedAt: null,
                itemsProcessed: null,
                itemsTotal: null,
                error: null,
            },
            {
                id: 'job-3',
                name: 'c.csv',
                type: 'csv',
                status: 'failed',
                progressPct: 10,
                stageLabel: 'Помилка',
                startedAt: null,
                completedAt: null,
                itemsProcessed: null,
                itemsTotal: null,
                error: 'boom',
            },
        ]);

        expect(summary).toEqual({
            activeCount: 1,
            completedCount: 1,
            failedCount: 1,
        });
    });
});
