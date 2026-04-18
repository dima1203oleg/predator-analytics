import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import MATargetScannerView from '../MATargetScannerView';
import React from 'react';

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
    AreaChart: () => <div data-testid="area-chart" />,
    Area: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    CartesianGrid: () => <div />,
    Tooltip: () => <div />,
    BarChart: () => <div data-testid="bar-chart" />,
    Bar: () => <div />,
}));

vi.mock('@/components/AdvancedBackground', () => ({ AdvancedBackground: () => <div data-testid="advanced-bg" /> }));
vi.mock('@/components/CyberGrid', () => ({ CyberGrid: () => <div data-testid="cyber-grid" /> }));
vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title, stats }: any) => (
        <div data-testid="view-header">
            {title}
            <div data-testid="stats-count">{stats?.length}</div>
        </div>
    )
}));

vi.mock('@/hooks/useBackendStatus', () => ({
    useBackendStatus: () => ({
        isOffline: false,
        sourceLabel: 'NVIDIA_PRIMARY',
        statusLabel: 'SYNCHRONIZED',
        nodeSource: 'PRIMARY_CORE',
        healingProgress: 100
    })
}));

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('MATargetScannerView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('відображає заголовок та список цілей', async () => {
        render(<MATargetScannerView />);
        
        expect(screen.getByText(/TARGET/i)).toBeInTheDocument();
        expect(screen.getByText(/SCANNER/i)).toBeInTheDocument();
        expect(screen.getByText(/ТОВ "АгроМаш-Схід"/i)).toBeInTheDocument();
    });

    it('дозволяє змінювати вибрану ціль', async () => {
        render(<MATargetScannerView />);
        
        const target2 = screen.getByText(/ПАТ "КАРГО-ТРАНС"/i);
        fireEvent.click(target2);

        await waitFor(() => {
            expect(screen.getByText(/420 вантажівок/i)).toBeInTheDocument();
        });
    });

    it('фільтрує цілі за назвою', async () => {
        render(<MATargetScannerView />);
        
        const input = screen.getByPlaceholderText(/FILTER_SEARCH.../i);
        fireEvent.change(input, { target: { value: 'МедТех' } });

        expect(screen.getByText(/ТОВ "МедТех Україна"/i)).toBeInTheDocument();
        expect(screen.queryByText(/ТОВ "АгроМаш-Схід"/i)).not.toBeInTheDocument();
    });

    it('ініціює predator-error при автономному режимі', async () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ 
                isOffline: true, 
                sourceLabel: 'MIRROR', 
                statusLabel: 'OFFLINE',
                nodeSource: 'MIRROR_CLUSTER',
                healingProgress: 45
            })
        }));

        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

        render(<MATargetScannerView />);

        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'predator-error',
                    detail: expect.objectContaining({
                        service: 'TargetScanner',
                        code: 'MERGER_NODES'
                    })
                })
            );
        });
    });
});
