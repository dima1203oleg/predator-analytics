import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DataIngestionHub from '../DataIngestionHub';

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        tr: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/services/api/config', () => ({
    apiClient: {
        get: vi.fn().mockResolvedValue({ data: [] }),
        post: vi.fn().mockResolvedValue({ data: {} })
    }
}));

vi.mock('@/components/TacticalCard', () => ({
    TacticalCard: ({ children, title }: any) => (
        <section>
            {title ? <h2>{title}</h2> : null}
            {children}
        </section>
    )
}));

vi.mock('@/components/HoloContainer', () => ({
    HoloContainer: ({ children }: any) => <div>{children}</div>
}));

vi.mock('@/components/AdvancedBackground', () => ({
    AdvancedBackground: () => <div data-testid="advanced-background" />
}));

vi.mock('@/components/pipeline/ActiveJobsPanel', () => ({
    ActiveJobsPanel: () => <div data-testid="active-jobs" />
}));

vi.mock('@/components/pipeline/DatabasePipelineMonitor', () => ({
    DatabasePipelineMonitor: () => <div data-testid="db-pipeline" />
}));

vi.mock('@/components/layout/PageTransition', () => ({
    PageTransition: ({ children }: any) => <div>{children}</div>
}));

vi.mock('@/components/ui/badge', () => ({
    Badge: ({ children }: any) => <span>{children}</span>
}));

describe('DataIngestionHub', () => {
    it('рендерить основні елементи інтерфейсу', () => {
        const { unmount } = render(<DataIngestionHub />);

        expect(screen.getByText(/ЦЕНТ� /i)).toBeInTheDocument();
        expect(screen.getByText(/ІНГЕСТІЇ/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /ПІДКЛЮЧИТИ ДЖЕ� ЕЛО_v2/i })).toBeInTheDocument();
        expect(screen.getByText('ID_КОНЕКТО� А')).toBeInTheDocument();

        unmount();
    });
});
