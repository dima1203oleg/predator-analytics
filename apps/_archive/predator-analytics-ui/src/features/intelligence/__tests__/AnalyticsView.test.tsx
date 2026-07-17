import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AnalyticsView from '../AnalyticsView';
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

vi.mock('@/services/api', () => ({
    api: {
        graph: {
            summary: vi.fn(() => Promise.resolve({ total_nodes: 50, total_edges: 120 })),
            search: vi.fn(() => Promise.resolve({
                nodes: [{ id: '1', name: 'TEST_ENTITY', label: 'ORGANIZATION', properties: { ueid: '123' } }],
                edges: []
            }))
        }
    }
}));

vi.mock('@/hooks/useBackendStatus', () => ({
    useBackendStatus: () => ({
        isOffline: false,
        nodeSource: 'NVIDIA_PRIMARY'
    })
}));

vi.mock('@/components/AdvancedBackground', () => ({ AdvancedBackground: () => <div data-testid="advanced-bg" /> }));
vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title, stats, badges, actions }: any) => (
        <div data-testid="view-header">
            <div data-testid="header-title">{title}</div>
            <div data-testid="stats-list">{stats?.map((s: any) => s.label).join(', ')}</div>
            <div data-testid="badges-list">{badges?.map((b: any) => b.label).join(', ')}</div>
            <div data-testid="header-actions">{actions}</div>
        </div>
    )
}));

vi.mock('@/components/CyberOrb', () => ({ CyberOrb: () => <div data-testid="cyber-orb" /> }));
vi.mock('@/components/TacticalCard', () => ({ TacticalCard: ({ children }: any) => <div data-testid="tactical-card">{children}</div> }));
vi.mock('@/components/premium/VisualAnalytics', () => ({ VisualAnalytics: () => <div data-testid="visual-analytics" /> }));

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('AnalyticsView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('відображає інтерфейс семантичного радару та виконує початковий пошук', async () => {
        render(<AnalyticsView />);
        
        expect(screen.getByText(/СЕМАНТИЧНИЙ/i)).toBeInTheDocument();
        expect(screen.getByText(/ АДА /i)).toBeInTheDocument();
        
        await waitFor(() => {
            expect(screen.getByText('TEST_ENTITY')).toBeInTheDocument();
        });
    });

    it('ініціює SEMANTIC_SUCCESS при розгортанні радару', async () => {
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
        render(<AnalyticsView />);
        
        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: expect.objectContaining({
                        code: 'SEMANTIC_SUCCESS'
                    })
                })
            );
        });
    });

    it('ініціює SEMANTIC_SUCCESS після успішного пошуку', async () => {
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
        render(<AnalyticsView />);
        
        const searchInput = screen.getByPlaceholderText(/Введіть назву/i);
        fireEvent.change(searchInput, { target: { value: 'Global' } });
        fireEvent.keyDown(searchInput, { key: 'Enter' });
        
        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: expect.objectContaining({
                        code: 'SEMANTIC_SUCCESS'
                    })
                })
            );
        });
    });

    it('перемикає на візуальний вектор (VisualAnalytics)', () => {
        render(<AnalyticsView />);
        
        const visualTab = screen.getByText(/VISUAL_VECTOR/i);
        fireEvent.click(visualTab);
        
        expect(screen.getByTestId('visual-analytics')).toBeInTheDocument();
    });

    it('відображає MIRROR_SCAN в автономному режимі', () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ 
                isOffline: true, 
                nodeSource: 'MIRROR_CLUSTER'
            })
        }));

        render(<AnalyticsView />);
        
        expect(screen.getByText(/MIRROR_SCAN/i)).toBeInTheDocument();
    });
});
