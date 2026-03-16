import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import React from 'react'
import MarketAnalyticsPremium from '../MarketAnalyticsPremium'

// ─── MOCKS ───────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, whileHover, ...props }: any) => <div {...props}>{children}</div>,
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

vi.mock('@/components/TacticalCard', () => ({
    TacticalCard: ({ title, children, metrics }: any) => (
        <div data-testid="tactical-card">
            <h3>{title}</h3>
            {metrics?.map((m: any, i: number) => (
                <div key={i} data-testid="metric-value">{m.value}</div>
            ))}
            {children}
        </div>
    )
}))

vi.mock('@/components/HoloContainer', () => ({
    HoloContainer: ({ children }: any) => <div data-testid="holo-container">{children}</div>
}))

vi.mock('@/components/CyberOrb', () => ({
    CyberOrb: () => <div data-testid="cyber-orb" />
}))

import { marketApi } from '@/features/market'

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('MarketAnalyticsPremium', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test('повинен відмальовувати заголовок та KPI після завантаження', async () => {
        await act(async () => {
            render(<MarketAnalyticsPremium />)
        })

        expect(screen.getByText(/Ринкова Аналітика/i)).toBeInTheDocument()
        expect(screen.getByText(/Corporate Alpha/i)).toBeInTheDocument()

        await waitFor(() => {
            // Перевіряємо KPI (total_value_usd = 12.4M)
            const metrics = screen.getAllByTestId('metric-value')
            expect(metrics.some(m => m.textContent?.includes('$12.4M'))).toBe(true)
        })
    })

    test('повинен відображати список сегментів (продуктів)', async () => {
        await act(async () => {
            render(<MarketAnalyticsPremium />)
        })

        await waitFor(() => {
            expect(screen.getAllByText(/Електроніка/i).length).toBeGreaterThan(0)
            expect(screen.getAllByText(/Запчастини/i).length).toBeGreaterThan(0)
            expect(screen.getByText(/8517/i)).toBeInTheDocument()
        })
    })

    test('повинен дозволяти змінювати часовий діапазон', async () => {
        await act(async () => {
            render(<MarketAnalyticsPremium />)
        })

        const yearBtn = screen.getByText(/Рік/i)
        
        await act(async () => {
            fireEvent.click(yearBtn)
        })

        expect(marketApi.getOverview).toHaveBeenCalledWith('last_year')
    })

    test('повинен відображати нейронні інсайти та AI можливості', async () => {
        await act(async () => {
            render(<MarketAnalyticsPremium />)
        })

        await waitFor(() => {
            expect(screen.getByText(/Neural Intelligence/i)).toBeInTheDocument()
            expect(screen.getByText(/AI Траєкторії/i)).toBeInTheDocument()
            // Текст інсайту динамічно підставляє назву першого продукту
            expect(screen.getAllByText(/Електроніка/i).length).toBeGreaterThan(0)
        })
    })
})
