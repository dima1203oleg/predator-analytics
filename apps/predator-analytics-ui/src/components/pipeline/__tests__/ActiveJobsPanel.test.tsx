import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveJobsPanel } from '../ActiveJobsPanel';

const getJobs = vi.fn();

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/hooks/useBackendStatus', () => ({
    useBackendStatus: () => ({
        isOffline: false,
        isTruthOnly: true,
        modeLabel: 'Режим правдивих даних',
        sourceLabel: 'localhost:9080/api/v1',
        sourceType: 'local',
        statusLabel: 'Зʼєднання активне',
    }),
}));

vi.mock('@/services/api/ingestion', () => ({
    ingestionApi: {
        getJobs: (...args: unknown[]) => getJobs(...args),
    },
}));

describe('ActiveJobsPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('показує тільки підтверджені jobs з /ingestion/jobs', async () => {
        getJobs.mockResolvedValue([
            {
                job_id: 'job-1',
                status: 'running',
                file_name: 'imports/manifest.csv',
                total_records: 100,
                successful_records: 45,
                progress_pct: 45,
                created_at: '2026-03-30T10:00:00Z',
            },
            {
                job_id: 'job-2',
                status: 'completed',
                file_name: 'archive/report.pdf',
                total_records: 20,
                successful_records: 20,
                progress_pct: 100,
                completed_at: '2026-03-30T11:00:00Z',
            },
        ]);

        render(<ActiveJobsPanel />);

        expect(await screen.findByText(/Активні процеси/i)).toBeInTheDocument();
        expect(screen.getByText(/Підтверджені ingestion jobs з \/ingestion\/jobs/i)).toBeInTheDocument();
        expect(screen.getByText('manifest.csv')).toBeInTheDocument();
        expect(screen.getByText('PDF: report.pdf')).toBeInTheDocument();
        expect(screen.getByText(/Бекенд: Зʼєднання активне/i)).toBeInTheDocument();
        expect(screen.getByText(/Завершено: 1/i)).toBeInTheDocument();
        expect(screen.getByText(/45 \/ 100/i)).toBeInTheDocument();
    });

    it('показує чесний порожній стан без synthetic jobs', async () => {
        getJobs.mockResolvedValue([]);

        render(<ActiveJobsPanel />);

        expect(await screen.findByText(/Немає підтверджених ingestion jobs/i)).toBeInTheDocument();
        expect(screen.queryByText(/Митний реєстр 2024/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/LIVE/i)).not.toBeInTheDocument();
    });

    it('показує збій бекенду і не підставляє demo-завдання', async () => {
        getJobs.mockRejectedValue(new Error('offline'));

        render(<ActiveJobsPanel />);

        expect(await screen.findByText(/Ендпоїнт \/ingestion\/jobs тимчасово недоступний/i)).toBeInTheDocument();
        expect(screen.getAllByText(/Панель не підставляє demo-завдання/i).length).toBeGreaterThan(0);
        await waitFor(() => {
            expect(screen.getByText(/Немає підтверджених ingestion jobs/i)).toBeInTheDocument();
        });
        expect(screen.queryByText(/Telegram: @customs_ua/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/LIVE/i)).not.toBeInTheDocument();
    });
});
