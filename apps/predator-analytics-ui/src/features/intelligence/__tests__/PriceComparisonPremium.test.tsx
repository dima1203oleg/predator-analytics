import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react'
import React from 'react'
import PriceComparisonPremium from '../PriceComparisonPremium'

// ─── MOCKS ───────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}))

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

vi.mock('@/services/api', () => ({
    api: {
        premium: {
            getPriceComparison: vi.fn().mockResolvedValue([
                {
                    id: 'p1',
                    name: 'Смартфон Alpha X',
                    category: 'Електроніка',
                    hsCode: '851713',
                    unit: 'шт',
                    avgPrice: 500,
                    offers: [
                        {
                            id: 'o1',
                            supplierName: 'Best Supplier',
                            country: 'China',
                            countryCode: 'CN',
                            price: 450,
                            currency: 'USD',
                            minQuantity: 100,
                            leadTime: 14,
                            reliability: 98,
                            lastUpdated: '2026-03-01',
                            priceHistory: [],
                            isVerified: true,
                            isBestPrice: true
                        },
                        {
                            id: 'o2',
                            supplierName: 'Alt Supplier',
                            country: 'Vietnam',
                            countryCode: 'VN',
                            price: 550,
                            currency: 'USD',
                            minQuantity: 100,
                            leadTime: 20,
                            reliability: 90,
                            lastUpdated: '2026-03-05',
                            priceHistory: [],
                            isVerified: false,
                            isBestPrice: false
                        }
                    ]
                }
            ])
        }
    }
}))

import { api } from '@/services/api'

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('PriceComparisonPremium', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test('повинен відмальовувати заголовок та статистику', async () => {
        render(<PriceComparisonPremium />)

        expect(screen.getByText(/Порівняння Цін/i)).toBeInTheDocument()
        
        await waitFor(() => {
            expect(screen.getByText(/Товарів/i)).toBeInTheDocument()
            expect(screen.getByText(/Середня економія/i)).toBeInTheDocument()
            // Знаходимо саме число 1 в статистиці
            const productStat = screen.getByText(/Товарів/i).closest('div')?.querySelector('span.text-2xl')
            expect(productStat).toHaveTextContent('1')
        })
    })

    test('повинен відображати список товарів та ціновий діапазон', async () => {
        render(<PriceComparisonPremium />)

        const product = await screen.findByText(/Смартфон Alpha X/i)
        expect(product).toBeInTheDocument()
        // Ціна може бути в хедері і в рядку пропозиції
        expect(screen.getAllByText(/\$450\.00/i).length).toBeGreaterThan(0)
        expect(screen.getAllByText(/\$550\.00/i).length).toBeGreaterThan(0)
    })

    test('повинен відображати пропозиції (перший розгорнутий за замовчуванням)', async () => {
        render(<PriceComparisonPremium />)

        // Перший товар має бути розгорнутий автоматично через useEffect
        await waitFor(() => {
            expect(screen.getByText(/Best Supplier/i)).toBeInTheDocument()
            expect(screen.getByText(/Alt Supplier/i)).toBeInTheDocument()
        }, { timeout: 2000 })
    })

    test('повинен згортати та розгортати при натисканні', async () => {
        render(<PriceComparisonPremium />)

        const productHeader = await screen.findByText(/Смартфон Alpha X/i)
        
        // Очікуємо поки завантажиться і розгорнеться за замовчуванням
        await screen.findByText(/Best Supplier/i)

        // Натискаємо щоб згорнути
        await act(async () => {
            fireEvent.click(productHeader)
        })

        await waitFor(() => {
            expect(screen.queryByText(/Best Supplier/i)).not.toBeInTheDocument()
        })

        // Натискаємо щоб розгорнути знову
        await act(async () => {
            fireEvent.click(productHeader)
        })

        expect(await screen.findByText(/Best Supplier/i)).toBeInTheDocument()
    })

    test('повинен фільтрувати за пошуковим запитом', async () => {
        render(<PriceComparisonPremium />)

        const input = await screen.findByPlaceholderText(/Пошук товару або категорії/i)
        
        await act(async () => {
            fireEvent.change(input, { target: { value: 'Alpha' } })
        })

        expect(screen.getByText(/Смартфон Alpha X/i)).toBeInTheDocument()

        await act(async () => {
            fireEvent.change(input, { target: { value: 'None' } })
        })

        await waitFor(() => {
            expect(screen.queryByText(/Смартфон Alpha X/i)).not.toBeInTheDocument()
            expect(screen.getByText(/Товарів не знайдено/i)).toBeInTheDocument()
        })
    })
})
