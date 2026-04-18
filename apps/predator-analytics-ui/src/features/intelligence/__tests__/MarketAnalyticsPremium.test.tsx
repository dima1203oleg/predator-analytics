import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import MarketAnalyticsPremium from '../MarketAnalyticsPremium'

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

vi.mock('@/store/useAppStore', () => ({
    useAppStore: () => ({
        userRole: 'admin',
        persona: 'BUSINESS'
    })
}))

vi.mock('@/features/market', () => ({
    marketApi: {
        getOverview: vi.fn().mockResolvedValue({
            total_value_usd: 12400000,
            total_weight: 500000,
            declarations_count: 1200,
            top_products: [
                { name: 'Електроніка', code: '8517', value_usd: 5000000, change_percent: 14.2 },
                { name: 'Запчастини', code: '8708', value_usd: 3000000, change_percent: -5.1 }
            ]
        })
    }
}))

vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title, stats }: any) => (
        <div data-testid="view-header">
            <div>{title}</div>
            {stats?.map((s: any, i: number) => (
                <div key={i} data-testid={`stat-${s.label}`}>{s.value}</div>
            ))}
        </div>
    )
}))

vi.mock('@/components/TacticalCard', () => ({
    TacticalCard: ({ title, children }: any) => (
        <div data-testid="tactical-card">
            <h3>{title}</h3>
            {children}
        </div>
    )
}))

vi.mock('@/components/AdvancedBackground', () => ({ AdvancedBackground: () => <div data-testid="advanced-bg" /> }))
vi.mock('@/components/CyberGrid', () => ({ CyberGrid: () => <div data-testid="cyber-grid" /> }))
vi.mock('@/components/layout/PageTransition', () => ({ PageTransition: ({ children }: any) => <div>{children}</div> }))

import { marketApi } from '@/features/market'

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('MarketAnalyticsPremium', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test('відмальовує заголовок та KPI після завантаження', async () => {
        render(
            <MemoryRouter>
                <MarketAnalyticsPremium />
            </MemoryRouter>
        )

        expect(screen.getByText(/РИНКОВА/i)).toBeInTheDocument()
        expect(screen.getByText(/АНАЛІТИКА/i)).toBeInTheDocument()

        await waitFor(() => {
            expect(screen.getByText(/\$12\.4M/i)).toBeInTheDocument()
            expect(screen.getByTestId('stat-МАРЖИНАЛЬНІСТЬ')).toBeInTheDocument()
        })
    })

    test('відображає список сегментів (продуктів)', async () => {
        render(
            <MemoryRouter>
                <MarketAnalyticsPremium />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(screen.getAllByText(/Електроніка/i).length).toBeGreaterThan(0)
            expect(screen.getAllByText(/Запчастини/i).length).toBeGreaterThan(0)
            expect(screen.getByText(/8517/i)).toBeInTheDocument()
        })
    })

    test('відображає нейронні інсайти та AI можливості', async () => {
        render(
            <MemoryRouter>
                <MarketAnalyticsPremium />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(screen.getByText(/NEURAL Intelligence/i)).toBeInTheDocument()
            expect(screen.getByText(/AI_ТРАЄКТОРІЇ_ТА_МОЖЛИВОСТІ/i)).toBeInTheDocument()
            expect(screen.getAllByText(/Електроніка/i).length).toBeGreaterThan(0)
        })
    })

    test('ініціює predator-error при автономному режимі', async () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ isOffline: true })
        }))

        const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

        render(
            <MemoryRouter>
                <MarketAnalyticsPremium />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'predator-error',
                    detail: expect.objectContaining({
                        service: 'MarketSignals',
                        severity: 'info'
                    })
                })
            )
        })
    })
})
