import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import PriceComparisonPremium from '../PriceComparisonPremium'

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
        persona: 'BUSINESS'
    })
}));

vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title, stats }: any) => (
        <div data-testid="view-header">
            <div>{title}</div>
            {stats?.map((s: any, i: number) => (
                <div key={i} data-testid={`stat-${s.label}`}>
                    <span data-testid="stat-value">{s.value}</span>
                </div>
            ))}
        </div>
    )
}));

vi.mock('@/components/AdvancedBackground', () => ({ AdvancedBackground: () => <div data-testid="advanced-bg" /> }));
vi.mock('@/components/CyberGrid', () => ({ CyberGrid: () => <div data-testid="cyber-grid" /> }));
vi.mock('@/components/layout/PageTransition', () => ({ PageTransition: ({ children }: any) => <div>{children}</div> }));

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('PriceComparisonPremium', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test('відмальовує заголовок та WRAITH статистику', async () => {
        render(
            <MemoryRouter>
                <PriceComparisonPremium />
            </MemoryRouter>
        )

        expect(screen.getByText(/ПОРІВНЯННЯ/i)).toBeInTheDocument()
        expect(screen.getByText(/ЦІН/i)).toBeInTheDocument()
        
        expect(screen.getByTestId('stat-ТОВАРІВ_У_БАЗІ')).toBeInTheDocument()
        expect(screen.getByTestId('stat-СЕРЕДНЯ_ЕКОНОМІЯ')).toBeInTheDocument()
        
        expect(screen.getByText(/47,201/i)).toBeInTheDocument()
    })

    test('відображає список товарів та ціни', async () => {
        render(
            <MemoryRouter>
                <PriceComparisonPremium />
            </MemoryRouter>
        )

        expect(screen.getByText(/ГЕНЕРАТОРИ_ДИЗЕЛЬ_5KW/i)).toBeInTheDocument()
        expect(screen.getAllByText(/\$980/i).length).toBeGreaterThan(0)
    })

    test('дозволяє розгортати та згортати пропозиції', async () => {
        render(
            <MemoryRouter>
                <PriceComparisonPremium />
            </MemoryRouter>
        )

        // p1 розгорнутий за замовчуванням
        expect(screen.getByText(/SINO_TECH_EXPORT/i)).toBeInTheDocument()

        const productHeader = screen.getByText(/ГЕНЕРАТОРИ_ДИЗЕЛЬ_5KW/i)
        
        // Натискаємо щоб згорнути
        await act(async () => {
            fireEvent.click(productHeader)
        })

        await waitFor(() => {
            expect(screen.queryByText(/SINO_TECH_EXPORT/i)).not.toBeInTheDocument()
        })
    })

    test('фільтрує товари за пошуковим запитом', async () => {
        render(
            <MemoryRouter>
                <PriceComparisonPremium />
            </MemoryRouter>
        )

        const input = screen.getByPlaceholderText(/ПОШУК ТОВАРУ/i)
        
        await act(async () => {
            fireEvent.change(input, { target: { value: 'АРМАТУРА' } })
        })

        expect(screen.queryByText(/ГЕНЕРАТОРИ_ДИЗЕЛЬ_5KW/i)).not.toBeInTheDocument()
        expect(screen.getByText(/АРМАТУРА_СТАЛЕВА_12MM/i)).toBeInTheDocument()
    })

    test('ініціює predator-error при автономному режимі', async () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ isOffline: true })
        }))

        const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

        render(
            <MemoryRouter>
                <PriceComparisonPremium />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'predator-error',
                    detail: expect.objectContaining({
                        service: 'PriceIntel',
                        severity: 'info'
                    })
                })
            )
        })
    })
})
