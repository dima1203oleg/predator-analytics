import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import React from 'react'
import AMLScoringView from '../AMLScoringView'

// ─── MOCKS ───────────────────────────────────────────────────────────────────

// Mock Framer Motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, whileHover, ...props }: any) => <div {...props}>{children}</div>,
        h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
        h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
        h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
        p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
        button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
        span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
        circle: (props: any) => <circle {...props} />,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock Lucide icons
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

// Mock ECharts
vi.mock('@/components/ECharts', () => ({
    default: () => <div data-testid="echarts-mock">ECharts Chart</div>
}))

// Mock components
vi.mock('@/components/AdvancedBackground', () => ({
    AdvancedBackground: () => <div data-testid="advanced-bg" />
}))

vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title }: any) => <div data-testid="view-header">{title}</div>
}))

vi.mock('@/components/TacticalCard', () => ({
    TacticalCard: ({ children, ...props }: any) => <div data-testid="tactical-card" {...props}>{children}</div>
}))

vi.mock('@/components/ui/badge', () => ({
    Badge: ({ children, ...props }: any) => <span data-testid="badge" {...props}>{children}</span>
}))

vi.mock('@/components/layout/PageTransition', () => ({
    PageTransition: ({ children }: any) => <div data-testid="page-transition">{children}</div>
}))

// Mock API Client
vi.mock('@/services/api', () => ({
    apiClient: {
        get: vi.fn().mockResolvedValue({ data: { levels: [] } }),
        post: vi.fn().mockResolvedValue({ data: {} }),
    }
}))

import { apiClient } from '@/services/api'

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('AMLScoringView', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(apiClient.get).mockResolvedValue({ data: { levels: [] } })
    })

    test('повинен відмальовувати заголовок та форму', async () => {
        await act(async () => {
            render(<AMLScoringView />)
        })

        expect(screen.getByText(/AML АНАЛІЗАТОР/i)).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/00000000/i)).toBeInTheDocument()
        expect(screen.getByText(/ЗАПУСТИТИ AML АНАЛІЗ/i)).toBeInTheDocument()
    })

    test('повинен виконувати аналіз сутності', async () => {
        const mockResult = {
            entity_id: '12345678',
            entity_name: 'TEST CORP',
            entity_type: 'organization',
            total_score: 85,
            risk_level: 'critical',
            factors: [
                { category: 'sanctions', name: 'Санкції', weight: 100, detected: true, details: 'Match found', source: 'OFAC' }
            ],
            recommendations: ['Check links'],
            calculated_at: new Date().toISOString()
        };
        vi.mocked(apiClient.post).mockResolvedValue({ data: mockResult })

        await act(async () => {
            render(<AMLScoringView />)
        })

        const idInput = screen.getByPlaceholderText(/00000000/i)
        const nameInput = screen.getByPlaceholderText(/ТОВ "Назва".../i)
        const submitBtn = screen.getByText(/ЗАПУСТИТИ AML АНАЛІЗ/i)

        await act(async () => {
            fireEvent.change(idInput, { target: { value: '12345678' } })
            fireEvent.change(nameInput, { target: { value: 'TEST CORP' } })
        })
        
        await act(async () => {
            fireEvent.click(submitBtn)
        })

        await waitFor(() => {
            expect(screen.getByText(/TEST CORP/i)).toBeInTheDocument()
            expect(screen.getByText(/85/i)).toBeInTheDocument()
            expect(screen.getByText(/КРИТИЧНИЙ/i)).toBeInTheDocument()
        })
    })

    test('повинен перемикатися на пакетний режим', async () => {
        await act(async () => {
            render(<AMLScoringView />)
        })

        const batchBtn = screen.getByText(/ПАКЕТНИЙ РЕЖИМ/i)
        await act(async () => {
            fireEvent.click(batchBtn)
        })

        expect(screen.getByText(/ЗАВАНТАЖИТИ CSV/i)).toBeInTheDocument()
    })

    test('повинен відображати помилку при невдалому запиті', async () => {
        vi.mocked(apiClient.post).mockRejectedValue({
            response: { data: { detail: 'API Error Occurred' } }
        })

        await act(async () => {
            render(<AMLScoringView />)
        })

        const idInput = screen.getByPlaceholderText(/00000000/i)
        const nameInput = screen.getByPlaceholderText(/ТОВ "Назва".../i)
        const submitBtn = screen.getByText(/ЗАПУСТИТИ AML АНАЛІЗ/i)

        await act(async () => {
            fireEvent.change(idInput, { target: { value: '1234' } })
            fireEvent.change(nameInput, { target: { value: 'Err' } })
            fireEvent.click(submitBtn)
        })

        await waitFor(() => {
            expect(screen.getByText(/API Error Occurred/i)).toBeInTheDocument()
        })
    })
})
