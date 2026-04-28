import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import SupplierDiscoveryPremium from '../SupplierDiscoveryPremium'

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

vi.mock('@/services/api/config', () => ({
    apiClient: {
        premium: {
            getSuppliers: vi.fn().mockResolvedValue([
                {
                    id: 's1',
                    name: 'CHINESE ELECTRONICS CO',
                    country: 'Китай',
                    countryCode: 'CN',
                    city: 'Shenzhen',
                    products: ['Smartphones', 'Tablets'],
                    totalExportVolume: 15000000,
                    avgPrice: 245,
                    priceCompetitiveness: 92,
                    ukraineClients: 12,
                    reliability: 95,
                    leadTime: 25,
                    lastShipment: '2026-02-15',
                    certifications: ['ISO9001', 'CE'],
                    verified: true,
                    isFavorite: false
                },
                {
                    id: 's2',
                    name: 'POLISH PARTS LTD',
                    country: 'Польща',
                    countryCode: 'PL',
                    city: 'Warsaw',
                    products: ['Auto Parts', 'Engines'],
                    totalExportVolume: 8000000,
                    avgPrice: 450,
                    priceCompetitiveness: 78,
                    ukraineClients: 45,
                    reliability: 88,
                    leadTime: 5,
                    lastShipment: '2026-03-01',
                    certifications: ['TUV'],
                    verified: true,
                    isFavorite: true
                }
            ])
        }
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
}));

vi.mock('@/components/layout/PageTransition', () => ({ PageTransition: ({ children }: any) => <div>{children}</div> }));
vi.mock('@/components/CyberGrid', () => ({ CyberGrid: () => <div data-testid="cyber-grid" /> }));
vi.mock('@/components/AdvancedBackground', () => ({ AdvancedBackground: () => <div data-testid="advanced-bg" /> }));

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('SupplierDiscoveryPremium', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test('відмальовує заголовок та лічильник', async () => {
        render(
            <MemoryRouter>
                <SupplierDiscoveryPremium />
            </MemoryRouter>
        )

        expect(screen.getByText(/ПОШУК/i)).toBeInTheDocument()
        expect(screen.getByText(/ПОСТАЧАЛЬНИКІВ/i)).toBeInTheDocument()
        
        await waitFor(() => {
            expect(screen.getByTestId('stat-ПОСТАЧАЛЬНИКІВ')).toHaveTextContent('2')
        })
    })

    test('відображає список постачальників', async () => {
        render(
            <MemoryRouter>
                <SupplierDiscoveryPremium />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(screen.getByText(/CHINESE ELECTRONICS CO/i)).toBeInTheDocument()
            expect(screen.getByText(/POLISH PARTS LTD/i)).toBeInTheDocument()
            expect(screen.getByText(/Shenzhen/i)).toBeInTheDocument()
        })
    })

    test('фільтрує за пошуковим запитом', async () => {
        render(
            <MemoryRouter>
                <SupplierDiscoveryPremium />
            </MemoryRouter>
        )

        await waitFor(() => screen.getByText(/CHINESE ELECTRONICS CO/i))

        const input = screen.getByPlaceholderText(/НАП ИКЛАД: ЕЛЕКТ ОНІКА/i)
        
        await act(async () => {
            fireEvent.change(input, { target: { value: 'POLISH' } })
        })

        expect(screen.getByText(/POLISH PARTS LTD/i)).toBeInTheDocument()
        expect(screen.queryByText(/CHINESE ELECTRONICS CO/i)).not.toBeInTheDocument()
    })

    test('розгортає картку постачальника для деталізації', async () => {
        render(
            <MemoryRouter>
                <SupplierDiscoveryPremium />
            </MemoryRouter>
        )

        await waitFor(() => screen.getByText(/CHINESE ELECTRONICS CO/i))

        const card = screen.getByText(/CHINESE ELECTRONICS CO/i)
        await act(async () => {
            fireEvent.click(card)
        })

        // Мають з'явитися деталі (ELITE)
        expect(screen.getByText(/Г УПИ_ТОВА ІВ/i)).toBeInTheDocument()
        expect(screen.getByText(/ЛОГІСТИЧНИЙ_СЛІД/i)).toBeInTheDocument()
        expect(screen.getByText(/СТВО ИТИ_ЗАПИТ_RFI/i)).toBeInTheDocument()
    })

    test('ініціює predator-error при автономному режимі', async () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ isOffline: true })
        }))

        const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

        render(
            <MemoryRouter>
                <SupplierDiscoveryPremium />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'predator-error',
                    detail: expect.objectContaining({
                        service: 'SupplierIntel',
                        severity: 'info'
                    })
                })
            )
        })
    })
})
