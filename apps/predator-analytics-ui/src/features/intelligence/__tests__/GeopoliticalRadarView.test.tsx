import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import GeopoliticalRadarView from '../GeopoliticalRadarView';
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

// Mock Recharts
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div style={{ width: '100%', height: '100%' }}>{children}</div>,
    AreaChart: ({ children }: any) => <div>{children}</div>,
    Area: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    CartesianGrid: () => <div />,
    Tooltip: () => <div />,
    RadarChart: ({ children }: any) => <div>{children}</div>,
    PolarGrid: () => <div />,
    PolarAngleAxis: () => <div />,
    PolarRadiusAxis: () => <div />,
    Radar: () => <div />,
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
        nodeSource: 'SAT_SYNC_PRIMARY',
        healingProgress: 100
    })
}));

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('GeopoliticalRadarView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('відображає заголовок та сейсмограф', async () => {
        render(<GeopoliticalRadarView />);
        
        expect(screen.getByText(/ГЕОПОЛІТИЧНИЙ/i)).toBeInTheDocument();
        expect(screen.getByText(/СЕЙСМОГРАФ/i)).toBeInTheDocument();
        expect(screen.getByText(/ГЛОБАЛЬНИЙ ІНДЕКС ТЕКТОНІЧНОГО РИЗИКУ/i)).toBeInTheDocument();
    });

    it('перемикає регіони', async () => {
        render(<GeopoliticalRadarView />);
        
        // Знаходимо кнопку для іншого регіону, наприклад "Тихоокеанська Дуга"
        const regionBtn = screen.getByText(/Тихоокеанська Дуга/i);
        await act(async () => {
            fireEvent.click(regionBtn);
        });

        expect(screen.getAllByText(/Тихоокеанська Дуга/i).length).toBeGreaterThan(0);
    });

    it('ініціює predator-error при автономному режимі', async () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ isOffline: true, nodeSource: 'SAT_MIRROR', healingProgress: 45 })
        }));

        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

        render(<GeopoliticalRadarView />);

        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'predator-error',
                    detail: expect.objectContaining({
                        service: 'GeoRadar',
                        code: 'GEOSPATIAL_NODES'
                    })
                })
            );
        });
    });
});
