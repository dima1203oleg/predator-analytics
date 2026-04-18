import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import MarketEntryView from '../MarketEntryView';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ─── MOCKS ───────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => {
    const motionProxy = new Proxy(
        {},
        {
            get: (_target, prop) => {
                return ({ children, ...props }: any) => {
                    const Tag = typeof prop === 'string' ? prop : 'div';
                    return <Tag {...props}>{children}</Tag>;
                };
            },
        }
    );
    return {
        motion: motionProxy,
        AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    };
});

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
})

vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div data-testid="recharts-container">{children}</div>,
    RadarChart: () => <div data-testid="radar-chart" />,
    Radar: () => <div />,
    PolarGrid: () => <div />,
    PolarAngleAxis: () => <div />,
    PolarRadiusAxis: () => <div />,
    BarChart: () => <div data-testid="bar-chart" />,
    Bar: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    CartesianGrid: () => <div />,
    Tooltip: () => <div />,
}));

vi.mock('@/components/AdvancedBackground', () => ({ AdvancedBackground: () => <div data-testid="advanced-bg" /> }));
vi.mock('@/components/CyberGrid', () => ({ CyberGrid: () => <div data-testid="cyber-grid" /> }));
vi.mock('@/components/CyberOrb', () => ({ CyberOrb: () => <div data-testid="cyber-orb" /> }));
vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title, stats }: any) => (
        <div data-testid="view-header">
            {title}
            <div data-testid="stats-count">{stats?.length}</div>
        </div>
    )
}));

vi.mock('@/components/intelligence/DiagnosticsTerminal', () => ({ DiagnosticsTerminal: () => <div data-testid="diag-terminal" /> }));

vi.mock('@/hooks/useBackendStatus', () => ({
    useBackendStatus: () => ({
        isOffline: false,
        sourceLabel: 'NVIDIA_PRIMARY',
        statusLabel: 'SYNCHRONIZED',
        activeFailover: false
    })
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('MarketEntryView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
    });

    it('відображає заголовок та список ринків', async () => {
        render(<MarketEntryView />, { wrapper });
        
        expect(screen.getByText(/MARKET ENTRY/i)).toBeInTheDocument();
        expect(screen.getByText(/SCORE/i)).toBeInTheDocument();
        expect(screen.getByText(/Польща/i)).toBeInTheDocument();
    });

    it('дозволяє змінювати вибраний ринок', async () => {
        render(<MarketEntryView />, { wrapper });
        
        const market2 = screen.getByText(/Німеччина/i);
        fireEvent.click(market2);

        await waitFor(() => {
            expect(screen.getByText(/€210B/i)).toBeInTheDocument();
        });
    });

    it('ініціює predator-error при автономному режимі', async () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ 
                isOffline: true, 
                sourceLabel: 'MIRROR', 
                statusLabel: 'OFFLINE',
                activeFailover: true
            })
        }));

        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

        render(<MarketEntryView />, { wrapper });

        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'predator-error',
                    detail: expect.objectContaining({
                        service: 'MarketEntry',
                        code: 'OPPORTUNITY_NODES'
                    })
                })
            );
        });
    });
});
