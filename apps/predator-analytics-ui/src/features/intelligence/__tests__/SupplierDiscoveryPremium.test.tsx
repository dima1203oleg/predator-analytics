import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import React from 'react'
import SupplierDiscoveryPremium from '../SupplierDiscoveryPremium'

// ─── MOCKS ───────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, layout, whileHover, whileTap, ...props }: any) => <div {...props}>{children}</div>,
        button: ({ children, whileHover, whileTap, ...props }: any) => <button {...props}>{children}</button>,
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
            getSuppliers: vi.fn().mockResolvedValue([
                {
                    id: 's1',
                    name: 'CHINESE ELECTRONICS CO',
                    country: 'China',
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
                    country: 'Poland',
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

import { api } from '@/services/api'

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('SupplierDiscoveryPremium', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test('повинен відмальовувати заголовок та лічильник', async () => {
        await act(async () => {
            render(<SupplierDiscoveryPremium />)
        })

        expect(screen.getByText(/Пошук Постачальників/i)).toBeInTheDocument()
        
        await waitFor(() => {
            expect(screen.getByText(/2 верифікованих постачальників/i)).toBeInTheDocument()
        })
    })

    test('повинен відображати список постачальників', async () => {
        await act(async () => {
            render(<SupplierDiscoveryPremium />)
        })

        await waitFor(() => {
            expect(screen.getByText(/CHINESE ELECTRONICS CO/i)).toBeInTheDocument()
            expect(screen.getByText(/POLISH PARTS LTD/i)).toBeInTheDocument()
            expect(screen.getByText(/Shenzhen/i)).toBeInTheDocument()
        })
    })

    test('повинен фільтрувати за пошуковим запитом', async () => {
        await act(async () => {
            render(<SupplierDiscoveryPremium />)
        })

        const input = screen.getByPlaceholderText(/Пошук постачальника або товару/i)
        
        await act(async () => {
            fireEvent.change(input, { target: { value: 'POLISH' } })
        })

        expect(screen.getByText(/POLISH PARTS LTD/i)).toBeInTheDocument()
        expect(screen.queryByText(/CHINESE ELECTRONICS CO/i)).not.toBeInTheDocument()
    })

    test('повинен фільтрувати за країною', async () => {
        await act(async () => {
            render(<SupplierDiscoveryPremium />)
        })

        await waitFor(() => {
            const select = screen.getByRole('combobox')
            fireEvent.change(select, { target: { value: 'China' } })
        })

        expect(screen.getByText(/CHINESE ELECTRONICS CO/i)).toBeInTheDocument()
        expect(screen.queryByText(/POLISH PARTS LTD/i)).not.toBeInTheDocument()
    })

    test('повинен розгортати картку постачальника для деталізації', async () => {
        await act(async () => {
            render(<SupplierDiscoveryPremium />)
        })

        await waitFor(() => {
            // Шукаємо кнопку розгортання (ChevronDown)
            // В нашому компоненті це кнопка з ChevronDown
            const expandButtons = screen.getAllByTestId('icon-chevrondown')
            fireEvent.click(expandButtons[0].parentElement!)
        })

        // Мають з'явитися деталі
        expect(screen.getByText(/Статистика/i)).toBeInTheDocument()
        expect(screen.getByText(/Сертифікати/i)).toBeInTheDocument()
        expect(screen.getByText(/AI Рекомендація/i)).toBeInTheDocument()
        expect(screen.getByText(/ISO9001/i)).toBeInTheDocument()
    })

    test('повинен змінювати статус "вибране"', async () => {
        await act(async () => {
            render(<SupplierDiscoveryPremium />)
        })

        await waitFor(() => {
            // Перший постачальник (isFavorite: false) має StarOff
            const starOff = screen.getByTestId('icon-staroff')
            fireEvent.click(starOff.parentElement!)
        })

        // Після кліку StarOff має зникнути, а Star з'явитися (через зміну стейту)
        expect(screen.queryByTestId('icon-staroff')).not.toBeInTheDocument()
        expect(screen.getAllByTestId('icon-star').length).toBe(2) // Було 1 (для s2), стало 2
    })
})
