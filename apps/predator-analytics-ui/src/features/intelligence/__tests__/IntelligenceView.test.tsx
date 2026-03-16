import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import IntelligenceView from '../IntelligenceView';
import React from 'react';

// Mock high-level components to avoid deep rendering issues
vi.mock('@/components/AdvancedBackground', () => ({
    AdvancedBackground: () => <div data-testid="advanced-background" />
}));

vi.mock('@/components/CyberGrid', () => ({
    CyberGrid: () => <div data-testid="cyber-grid" />
}));

vi.mock('@/components/PageTransition', () => ({
    PageTransition: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock('@/components/TacticalCard', () => ({
    TacticalCard: ({ children, className, variant }: any) => (
        <div data-testid={`tactical-card-${variant}`} className={className}>
            {children}
        </div>
    )
}));

vi.mock('@/components/HoloContainer', () => ({
    HoloContainer: ({ children, className }: any) => (
        <div data-testid="holo-container" className={className}>
            {children}
        </div>
    )
}));

vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title, subtitle }: any) => (
        <div data-testid="view-header">
            {title} - {subtitle}
        </div>
    )
}));

vi.mock('@/components/graph/SemanticRadar', () => ({
    SemanticRadar: ({ className }: any) => <div data-testid="semantic-radar" className={className} />
}));

vi.mock('@/components/pipeline/DatabasePipelineMonitor', () => ({
    DatabasePipelineMonitor: () => <div data-testid="database-pipeline-monitor" />
}));

vi.mock('@/features/ai/AIInsightsHub', () => ({
    default: ({ isWidgetMode }: any) => <div data-testid="ai-insights-hub">{isWidgetMode ? 'Widget' : 'Full'}</div>
}));

vi.mock('@/components/intelligence/SovereignReportWidget', () => ({
    SovereignReportWidget: ({ ueid }: any) => <div data-testid="sovereign-report-widget">{ueid}</div>
}));

// Mock framer-motion as it's often causing issues in unit tests
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
        span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    },
    AnimatePresence: ({ children }: any) => children,
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
    Brain: (props: any) => <span data-testid="icon-brain" {...props} />,
    RefreshCw: (props: any) => <span data-testid="icon-refresh" {...props} />,
    Sparkles: (props: any) => <span data-testid="icon-sparkles" {...props} />,
    RadioTower: (props: any) => <span data-testid="icon-radiotower" {...props} />,
    Layers: (props: any) => <span data-testid="icon-layers" {...props} />,
    Database: (props: any) => <span data-testid="icon-database" {...props} />,
    Terminal: (props: any) => <span data-testid="icon-terminal" {...props} />,
    Info: (props: any) => <span data-testid="icon-info" {...props} />,
    Cpu: (props: any) => <span data-testid="icon-cpu" {...props} />,
    Boxes: (props: any) => <span data-testid="icon-boxes" {...props} />,
    ShieldCheck: (props: any) => <span data-testid="icon-shieldcheck" {...props} />,
    TrendingUp: (props: any) => <span data-testid="icon-trendingup" {...props} />,
    Radio: (props: any) => <span data-testid="icon-radio" {...props} />,
    Fingerprint: (props: any) => <span data-testid="icon-fingerprint" {...props} />,
    Workflow: (props: any) => <span data-testid="icon-workflow" {...props} />,
}));

describe('IntelligenceView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('повинен відмальовувати основний заголовок та структуру', () => {
        render(<IntelligenceView />);
        
        expect(screen.getByText(/СВЯТИЛИЩЕ/i)).toBeInTheDocument();
        expect(screen.getByText(/РОЗВІДКИ/i)).toBeInTheDocument();
        expect(screen.getByTestId('icon-brain')).toBeInTheDocument();
        
        // Перевірка наявності основних секцій
        expect(screen.getByText(/СЕМАНТИЧНА РАДАРНА МАТРИЦЯ/i)).toBeInTheDocument();
        expect(screen.getByText(/ЦЕНТР_СУВЕРЕННИХ_ОПЕРАЦІЙ/i)).toBeInTheDocument();
        expect(screen.getByTestId('ai-insights-hub')).toBeInTheDocument();
    });

    it('повинен активувати режим "мислення" при натисканні на кнопку оптимізації', async () => {
        render(<IntelligenceView />);
        
        const optBtn = screen.getByText(/ОПТИМІЗУВАТИ_ЯДРО/i);
        
        await act(async () => {
            fireEvent.click(optBtn);
        });
        
        // Повинна з'явитися іконка завантаження (RefreshCw)
        expect(screen.getByTestId('icon-refresh')).toBeInTheDocument();
        
        // Через 2 секунди мислення має припинитися
        await act(async () => {
            vi.advanceTimersByTime(2000);
        });
        
        expect(screen.queryByTestId('icon-refresh')).not.toBeInTheDocument();
        expect(screen.getByTestId('icon-sparkles')).toBeInTheDocument();
    });

    it('повинен перемикати шари (Graph vs Radar)', async () => {
        render(<IntelligenceView />);
        
        const graphBtn = screen.getByText(/ГРАФ_v5/i);
        const radarBtn = screen.getByText(/РАДАР_X/i);
        
        // За замовчуванням активний Граф
        expect(graphBtn).toHaveClass('bg-indigo-500');
        
        await act(async () => {
            fireEvent.click(radarBtn);
        });
        
        expect(radarBtn).toHaveClass('bg-indigo-500');
        expect(graphBtn).not.toHaveClass('bg-indigo-500');
    });

    it('повинен відображати віджет звітів для вибраного об\'єкта', () => {
        render(<IntelligenceView />);
        
        // за замовчуванням вибрано '12345678'
        expect(screen.getByTestId('sovereign-report-widget')).toHaveTextContent('12345678');
    });

    it('повинен відображати діагностичні панелі та їх стани', () => {
        render(<IntelligenceView />);
        
        expect(screen.getByText(/АСИНХРОННИЙ_ІНДЕКС/i)).toBeInTheDocument();
        expect(screen.getByText(/99.99%/i)).toBeInTheDocument();
        expect(screen.getByText(/ВЕКТОРНИЙ_ДРЕЙФ/i)).toBeInTheDocument();
        expect(screen.getByText(/0.002/i)).toBeInTheDocument();
    });
});
