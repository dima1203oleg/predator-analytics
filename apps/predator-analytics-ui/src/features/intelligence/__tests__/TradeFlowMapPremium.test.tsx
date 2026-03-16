import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react'
import React from 'react'
import TradeFlowMapPremium from '../TradeFlowMapPremium'

// ─── MOCKS ───────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        g: ({ children, ...props }: any) => <g {...props}>{children}</g>,
        path: ({ children, ...props }: any) => <path {...props}>{children}</path>,
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
            getTradeFlows: vi.fn().mockResolvedValue({
                countries: [
                    { id: 'ua', name: 'Україна', code: 'UA', x: 55, y: 35, imports: 0, exports: 0 },
                    { id: 'cn', name: 'Китай', code: 'CN', x: 80, y: 40, imports: 100000000, exports: 50000000 }
                ],
                flows: [
                    { id: 'f1', from: 'cn', to: 'ua', value: 30000000, product: 'Електроніка', color: '#22d3ee' }
                ]
            })
        }
    }
}))

import { api } from '@/services/api'

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('TradeFlowMapPremium', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test('повинен відмальовувати заголовок та підвал зі статистикою', async () => {
        render(<TradeFlowMapPremium />)

        expect(screen.getByText(/Карта Торгових Потоків/i)).toBeInTheDocument()
        
        await waitFor(() => {
            expect(screen.getByText(/Загальний імпорт/i)).toBeInTheDocument()
            expect(screen.getByText(/Загальний експорт/i)).toBeInTheDocument()
            expect(screen.getByText(/Торгових потоків/i)).toBeInTheDocument()
        })
    })

    test('повинен завантажувати та відображати країни на карті', async () => {
        render(<TradeFlowMapPremium />)

        // Коди країн на карті мають з'явитися
        expect(await screen.findByText('UA')).toBeInTheDocument()
        expect(await screen.findByText('CN')).toBeInTheDocument()
    })

    test('повинен відображати легенду та дозволяти вибір потоку', async () => {
        render(<TradeFlowMapPremium />)

        await waitFor(() => {
            expect(screen.getByText(/Торгові потоки/i)).toBeInTheDocument()
            expect(screen.getByText(/Електроніка/i)).toBeInTheDocument()
        })

        const flowBtn = screen.getByText(/Електроніка/i).closest('button')
        expect(flowBtn).toBeInTheDocument()

        await act(async () => {
            fireEvent.click(flowBtn!)
        })

        // Кнопка має отримати клас активності
        expect(flowBtn).toHaveClass('bg-white/10')
    })

    test('повинен відображати статистику країни при кліку', async () => {
        render(<TradeFlowMapPremium />)

        const countryNode = await screen.findByText('CN')
        
        await act(async () => {
            fireEvent.click(countryNode)
        })

        // Статистика Китаю має з'явитися
        await waitFor(() => {
            expect(screen.getByText('Китай')).toBeInTheDocument()
            expect(screen.getByText(/Імпорт в Україну/i)).toBeInTheDocument()
            // imports: 100000000 -> $100M
            expect(screen.getByText(/\$100M/i)).toBeInTheDocument()
        })
    })

    test('повинен керувати анімацією та повноекранним режимом', async () => {
        render(<TradeFlowMapPremium />)

        // Пауза (шукаємо за заголовком або роллю, якщо можливо, але Title найнадійніший тут)
        const pauseBtn = await screen.findByTitle('Пауза')
        await act(async () => {
            fireEvent.click(pauseBtn)
        })
        
        // Маємо дочекатися зміни на Play
        expect(await screen.findByTitle('Відтворити')).toBeInTheDocument()

        // Fullscreen
        const fullBtn = screen.getByTitle('Повноекранний')
        await act(async () => {
            fireEvent.click(fullBtn)
        })
        expect(screen.getByTitle('Вийти')).toBeInTheDocument()
    })
})
