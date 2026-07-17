import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import IntelligenceView from '../IntelligenceView';
import React from 'react';

// ─── MOCKS ───────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return new Proxy(actual, {
        get: (target, prop) => {
            if (typeof prop === 'string' && /^[A-Z]/.test(prop)) {
                return (props: any) => <span data-testid={`icon-${prop.toLowerCase()}`} {...props} />;
            }
            return target[prop];
        }
    });
});

vi.mock('@/hooks/useBackendStatus', () => ({
    useBackendStatus: () => ({
        isOffline: false,
        activeFailover: false,
        nodeSource: 'NVIDIA_PRIMARY',
        healingProgress: 0
    })
}));

vi.mock('@/components/AdvancedBackground', () => ({ AdvancedBackground: () => <div data-testid="advanced-bg" /> }));
vi.mock('@/components/CyberGrid', () => ({ CyberGrid: () => <div data-testid="cyber-grid" /> }));
vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title, stats, badges, actions }: any) => (
        <div data-testid="view-header">
            <div data-testid="header-title">{title}</div>
            <div data-testid="header-stats">{stats?.map((s: any) => s.label).join(', ')}</div>
            <div data-testid="header-badges">{badges?.map((b: any) => b.label).join(', ')}</div>
            <div data-testid="header-actions">{actions}</div>
        </div>
    )
}));

vi.mock('@/components/graph/SemanticRadar', () => ({ SemanticRadar: () => <div data-testid="semantic-radar" /> }));
vi.mock('@/components/layout/PageTransition', () => ({ PageTransition: ({ children }: any) => <>{children}</> }));
vi.mock('@/features/ai/AIInsightsHub', () => ({ default: () => <div data-testid="ai-hub" /> }));
vi.mock('@/components/search/SearchWidget', () => ({ SearchWidget: () => <div data-testid="search-widget" /> }));
vi.mock('@/components/intelligence/SovereignReportWidget', () => ({ SovereignReportWidget: () => <div data-testid="sovereign-report" /> }));
vi.mock('@/components/intelligence/DiagnosticsTerminal', () => ({ DiagnosticsTerminal: () => <div data-testid="diagnostics-terminal" /> }));
vi.mock('@/components/pipeline/DatabasePipelineMonitor', () => ({ DatabasePipelineMonitor: () => <div data-testid="pipeline-monitor" /> }));

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('IntelligenceView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('відображає інтерфейс стратегічної розвідки NEXUS', () => {
        render(<IntelligenceView />);
        
        expect(screen.getByText(/ЦЕНТ /i)).toBeInTheDocument();
        expect(screen.getByText(/ РОЗВІДКИ/i)).toBeInTheDocument();
        expect(screen.getByTestId('search-widget')).toBeInTheDocument();
        expect(screen.getByTestId('sovereign-report')).toBeInTheDocument();
    });

    it('ініціює INTEL_SUCCESS при завантаженні матриці', async () => {
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
        render(<IntelligenceView />);
        
        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: expect.objectContaining({
                        code: 'INTEL_SUCCESS'
                    })
                })
            );
        });
    });

    it('запускає операцію ОПТИМІЗУВАТИ_ЯДРО (COG_RECOVERY)', async () => {
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
        render(<IntelligenceView />);
        
        const optimizeBtn = screen.getByText(/ОПТИМІЗУВАТИ_ЯДРО/i);
        fireEvent.click(optimizeBtn);
        
        expect(dispatchSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                detail: expect.objectContaining({
                    code: 'COG_RECOVERY'
                })
            })
        );
        
        // Перевірка завершення через 2 сек (тепер мокаємо таймер або чекаємо)
        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: expect.objectContaining({
                        code: 'COG_STABLE'
                    })
                })
            ), { timeout: 3000 };
        });
    });

    it('перемикає шари візуалізації (GRAPH_SCAN / RADAR_OSINT)', () => {
        render(<IntelligenceView />);
        
        const radarBtn = screen.getByText(/RADAR_OSINT/i);
        fireEvent.click(radarBtn);
        
        expect(screen.getByTestId('semantic-radar')).toBeInTheDocument();
    });

    it('відображає MIRROR_NEXUS в автономному режимі', () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ 
                isOffline: true, 
                nodeSource: 'MIRROR_CLUSTER',
                healingProgress: 45,
                activeFailover: true
            })
        }));

        render(<IntelligenceView />);
        
        expect(screen.getByText(/MIRROR_NEXUS/i)).toBeInTheDocument();
        expect(screen.getByText(/MIRROR_RECOVERY/i)).toBeInTheDocument();
    });
});
