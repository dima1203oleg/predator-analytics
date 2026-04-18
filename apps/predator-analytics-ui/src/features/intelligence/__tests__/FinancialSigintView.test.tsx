import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import FinancialSigintView from '../FinancialSigintView';
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
    PieChart: ({ children }: any) => <div>{children}</div>,
    Pie: () => <div />,
    Cell: () => <div />,
    RadarChart: ({ children }: any) => <div>{children}</div>,
    PolarGrid: () => <div />,
    PolarAngleAxis: () => <div />,
    PolarRadiusAxis: () => <div />,
    Radar: () => <div />,
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

vi.mock('@/services/dataService', () => ({
    intelligence: {
        getFinancialSigint: vi.fn(),
    }
}));

vi.mock('@/hooks/useBackendStatus', () => ({
    useBackendStatus: () => ({
        isOffline: false,
        activeFailover: false,
        nodeSource: 'NVIDIA_MASTER'
    })
}));

import { intelligence } from '@/services/dataService';

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('FinancialSigintView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (intelligence.getFinancialSigint as any).mockResolvedValue({});
    });

    it('відображає заголовок та головні метрики', async () => {
        render(<FinancialSigintView />);
        
        expect(screen.getByText(/ФІНАНСОВА/i)).toBeInTheDocument();
        expect(screen.getByText(/ЕКЗЕКУЦІЯ/i)).toBeInTheDocument();
        expect(screen.getByText(/ПІДОЗРІЛИЙ ОБІГ/i)).toBeInTheDocument();
    });

    it('перемикає модулі (SWIFT -> ОФШОРНИЙ_РАДАР)', async () => {
        render(<FinancialSigintView />);
        
        const offshoreBtn = screen.getByText(/ОФШОРНИЙ_РАДАР/i);
        await act(async () => {
            fireEvent.click(offshoreBtn);
        });

        expect(screen.getByText(/РАДАР_ОФШОРНОЇ_ЛІКВІДНОСТІ/i)).toBeInTheDocument();
    });

    it('ініціює predator-error при автономному режимі', async () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ isOffline: true, activeFailover: false })
        }));

        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

        render(<FinancialSigintView />);

        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'predator-error',
                    detail: expect.objectContaining({
                        service: 'FinancialSigint',
                        code: 'FINANCIAL_NODES'
                    })
                })
            );
        });
    });
});
