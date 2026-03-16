import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react'
import React from 'react'
import AdvancedChartsPremium from '../AdvancedChartsPremium'

// ─── MOCKS ───────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        path: ({ children, ...props }: any) => <path {...props}>{children}</path>,
        circle: ({ children, ...props }: any) => <circle {...props}>{children}</circle>,
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
            getMarketTrends: vi.fn().mockResolvedValue([
                { label: 'Січ', value: 100, trend: 10 },
                { label: 'Лют', value: 120, trend: 20 }
            ]),
            getHSAnalytics: vi.fn().mockResolvedValue([
                { code: '85', name: 'Електроніка', volume: 50000000 },
                { code: '87', name: 'Транспорт', volume: 30000000 }
            ])
        }
    }
}))

import { api } from '@/services/api'

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('AdvancedChartsPremium', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test('повинен відмальовувати заголовок та перемикач діапазону', async () => {
        await act(async () => {
            render(<AdvancedChartsPremium />)
        })

        expect(screen.getByText(/Аналітичні Графіки/i)).toBeInTheDocument()
        expect(screen.getByText(/Premium/i)).toBeInTheDocument()
        expect(screen.getByText(/Місяць/i)).toBeInTheDocument()
        expect(screen.getByText(/Рік/i)).toBeInTheDocument()
    })

    test('повинен завантажувати та відображати дані на графіках', async () => {
        await act(async () => {
            render(<AdvancedChartsPremium />)
        })

        await waitFor(() => {
            // Перевіряємо заголовки карток
            expect(screen.getByText(/Динаміка імпорту/i)).toBeInTheDocument()
            expect(screen.getByText(/Розподіл по категоріях/i)).toBeInTheDocument()
            
            // Перевіряємо дані категорій (оброблені в млн)
            expect(screen.getAllByText(/Електроніка/i).length).toBeGreaterThan(0)
            expect(screen.getByText(/\$50M/i)).toBeInTheDocument() // 50000000 / 1000000
        })
    })

    test('повинен дозволяти змінювати часовий діапазон', async () => {
        await act(async () => {
            render(<AdvancedChartsPremium />)
        })

        const monthBtn = screen.getByText(/Місяць/i)
        await act(async () => {
            fireEvent.click(monthBtn)
        })

        expect(monthBtn).toHaveClass('text-purple-400')
    })

    test('повинен відображати AI інсайти', async () => {
        await act(async () => {
            render(<AdvancedChartsPremium />)
        })

        expect(screen.getByText(/AI Аналіз трендів/i)).toBeInTheDocument()
        expect(screen.getByText(/Зростання імпорту/i)).toBeInTheDocument()
        expect(screen.getByText(/Сезонність/i)).toBeInTheDocument()
    })
})
