import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CustomsIntelligenceView from '../CustomsIntelligenceView';
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
});

// Mock Recharts to avoid issues with SVG sizing in tests
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
    Area: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    CartesianGrid: () => <div />,
    Tooltip: () => <div />,
    PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
    Pie: ({ children }: any) => <div data-testid="pie-slice">{children}</div>,
    Cell: () => <div />,
    BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
    Bar: () => <div />
}));

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
        nodeSource: 'NVIDIA_PRIMARY',
        healingProgress: 100
    })
}));

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('CustomsIntelligenceView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('відображає заголовок модуля та початкові дані', async () => {
        render(<CustomsIntelligenceView />);
        
        expect(screen.getByText(/МИТНА/i)).toBeInTheDocument();
        expect(screen.getByText(/АНАЛІТИКА/i)).toBeInTheDocument();
        expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });

    it('перемикає вкладки аналітики', async () => {
        render(<CustomsIntelligenceView />);
        
        const importersTab = screen.getByText(/ТОП_ІМПОРТЕРІВ/i);
        fireEvent.click(importersTab);

        expect(screen.getByText(/DOMINANCE_LEADERBOARD/i)).toBeInTheDocument();
        expect(screen.getByText(/ТОВ "МЕТАЛ-ТРЕЙД ОПТ"/i)).toBeInTheDocument();
    });

    it('відображає попередження про митні ризики', async () => {
        render(<CustomsIntelligenceView />);
        
        const risksTab = screen.getByText(/МИТНІ_РИЗИКИ/i);
        fireEvent.click(risksTab);

        expect(screen.getByText(/CUSTOMS_RISK_ALERTS/i)).toBeInTheDocument();
        expect(screen.getByText(/ЗАНИЖЕННЯ_МИТНОЇ_ВАРТОСТІ/i)).toBeInTheDocument();
    });

    it('ініціює predator-error при автономному режимі', async () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ 
                isOffline: true, 
                nodeSource: 'MIRROR_CLUSTER',
                healingProgress: 60
            })
        }));

        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

        render(<CustomsIntelligenceView />);

        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'predator-error',
                    detail: expect.objectContaining({
                        service: 'CustomsIntel',
                        code: 'CUSTOMS_NODES'
                    })
                })
            );
        });
    });

    it('ініціює predator-error при успішному оновленні в автономному режимі', async () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ 
                isOffline: true, 
                nodeSource: 'MIRROR_CLUSTER',
                healingProgress: 60
            })
        }));

        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

        render(<CustomsIntelligenceView />);

        const refreshBtn = screen.getByTestId('icon-refreshcw').parentElement!;
        
        await act(async () => {
            fireEvent.click(refreshBtn);
        });

        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: expect.objectContaining({
                        message: expect.stringContaining('Синхронізація митних вузлів через MIRROR_CHANNEL завершена успішно')
                    })
                })
            );
        }, { timeout: 2000 });
    });
});
