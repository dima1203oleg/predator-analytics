import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import AdvancedChartsPremium from '../AdvancedChartsPremium'

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
        LayoutGroup: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

vi.mock('@/components/AdvancedBackground', () => ({
    AdvancedBackground: ({ children }: any) => <div data-testid="advanced-background">{children}</div>
}))

vi.mock('@/components/CyberGrid', () => ({
    CyberGrid: () => <div data-testid="cyber-grid" />
}))

vi.mock('@/components/layout/PageTransition', () => ({
    PageTransition: ({ children }: any) => <div data-testid="page-transition">{children}</div>
}))

vi.mock('@react-three/fiber', () => ({
    Canvas: ({ children }: any) => <div data-testid="three-canvas">{children}</div>
}))

vi.mock('@react-three/drei', () => ({
    Stars: () => null,
    PerspectiveCamera: () => null,
    OrbitControls: () => null,
    Float: ({ children }: any) => <>{children}</>
}))

vi.mock('@/services/api', () => ({
    api: {
        premium: {
            getMarketTrends: vi.fn(),
            getHSAnalytics: vi.fn()
        }
    }
}))

import { api } from '@/services/api'

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('AdvancedChartsPremium', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(api.premium.getMarketTrends).mockResolvedValue([
            { label: 'Січ', value: 100, trend: 10 },
            { label: 'Лют', value: 120, trend: 20 }
        ]);
        vi.mocked(api.premium.getHSAnalytics).mockResolvedValue([
            { code: '85', name: 'Електроніка', volume: 50000000 },
            { code: '87', name: 'Транспорт', volume: 30000000 }
        ]);
    })

    test('відмальовує заголовок та перемикачі діапазону', async () => {
        render(
            <MemoryRouter>
                <AdvancedChartsPremium />
            </MemoryRouter>
        )

        expect(screen.getByText(/АНАЛІТИЧНІ/i)).toBeInTheDocument()
        expect(screen.getByText(/ГРАФІКИ/i)).toBeInTheDocument()
        expect(screen.getByText(/30 ДНІВ/i)).toBeInTheDocument()
        expect(screen.getByText(/ ІК_2026/i)).toBeInTheDocument()
    })

    test('завантажує та відображає дані на графіках', async () => {
        render(
            <MemoryRouter>
                <AdvancedChartsPremium />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(screen.getByText(/ДИНАМІКА  ИНКОВИХ Т ЕНДІВ/i)).toBeInTheDocument()
            expect(screen.getByText(/РОЗПОДІЛ КАТЕГО ІЙ/i)).toBeInTheDocument()
            expect(screen.getAllByText(/Електроніка/i).length).toBeGreaterThan(0)
            expect(screen.getByText(/\$50M/i)).toBeInTheDocument()
        })
    })

    test('дозволяє змінювати часовий діапазон', async () => {
        render(
            <MemoryRouter>
                <AdvancedChartsPremium />
            </MemoryRouter>
        )

        const monthBtn = screen.getByText(/30 ДНІВ/i)
        await act(async () => {
            fireEvent.click(monthBtn)
        })

        expect(monthBtn).toHaveClass('bg-yellow-600')
    })

    test('відображає AI інсайти', async () => {
        render(
            <MemoryRouter>
                <AdvancedChartsPremium />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(screen.getByText(/AI NEURAL_ANALYTICS/i)).toBeInTheDocument()
            expect(screen.getByText(/PATTERN_DETECTION/i)).toBeInTheDocument()
            expect(screen.getByText(/RISK_MITIGATION/i)).toBeInTheDocument()
        });
    })

    test('ініціює predator-error при автономному режимі', async () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ isOffline: true })
        }))

        const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

        render(
            <MemoryRouter>
                <AdvancedChartsPremium />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'predator-error',
                    detail: expect.objectContaining({
                        service: 'QuantumVisual',
                        severity: 'info'
                    })
                })
            )
        })
    })
})
