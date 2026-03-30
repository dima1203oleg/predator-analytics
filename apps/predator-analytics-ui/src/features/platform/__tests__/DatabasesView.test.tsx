import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DatabasesView from '../DatabasesView';

vi.mock('@/hooks/useSystemMetrics', () => ({
    useSystemMetrics: () => ({})
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

vi.mock('@/services/api', () => ({
    api: {
        getDatabases: vi.fn(),
        getVectors: vi.fn(),
        getBuckets: vi.fn(),
        getTrainingPairs: vi.fn(),
        executeQuery: vi.fn(),
        graph: { execute: vi.fn() }
    }
}));

vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title }: any) => (
        <header>
            <h1>{title}</h1>
        </header>
    )
}));

vi.mock('@/components/Modal', () => ({
    default: ({ children, isOpen }: any) => (isOpen ? <div>{children}</div> : null)
}));

vi.mock('@/components/AdvancedBackground', () => ({
    AdvancedBackground: () => <div data-testid="advanced-background" />
}));

vi.mock('@/components/databases/RelationalView', () => ({
    RelationalView: () => <div data-testid="relational-view" />
}));

vi.mock('@/components/databases/ObjectStorageView', () => ({
    ObjectStorageView: ({ buckets }: any) => <div data-testid="object-view">BUCKETS:{buckets.length}</div>
}));

vi.mock('@/components/databases/VectorDBView', () => ({
    VectorDBView: () => <div data-testid="vector-view" />
}));

vi.mock('@/components/databases/GraphDBView', () => ({
    GraphDBView: () => <div data-testid="graph-view" />
}));

vi.mock('@/components/databases/CalibrationView', () => ({
    CalibrationView: () => <div data-testid="calibration-view" />
}));

vi.mock('@/components/etl/EtlProcessMonitor', () => ({
    EtlProcessMonitor: () => <div data-testid="etl-monitor" />
}));

describe('DatabasesView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('рендерить заголовок і базові блоки', () => {
        render(<DatabasesView />);

        expect(screen.getByRole('heading', { name: /НЕЙРОННА СІТКА/i })).toBeInTheDocument();
        expect(screen.getByText(/СИНХРОНІЗОВАНЕ ЯДРО ЗНАНЬ/i)).toBeInTheDocument();
        expect(screen.getByTestId('etl-monitor')).toBeInTheDocument();
    });

    it('не підставляє локальні bucket-и у вкладці OBJECT', async () => {
        render(<DatabasesView />);

        fireEvent.click(screen.getByRole('button', { name: /S3 Об'єкти/i }));

        await waitFor(() => {
            expect(screen.getByTestId('object-view')).toHaveTextContent('BUCKETS:0');
        });
        expect(screen.queryByText(/evidence-vault/i)).not.toBeInTheDocument();
    });
});
