import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DatabasesView from '../DatabasesView';

vi.mock('@/hooks/useSystemMetrics', () => ({
    useSystemMetrics: () => ({})
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
    ObjectStorageView: () => <div data-testid="object-view" />
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
    it('рендерить заголовок і базові блоки', () => {
        render(<DatabasesView />);

        expect(screen.getByText(/НЕЙРОННА СІТКА/i)).toBeInTheDocument();
        expect(screen.getByText(/СХОВИЩ/i)).toBeInTheDocument();
        expect(screen.getByTestId('etl-monitor')).toBeInTheDocument();
    });
});
