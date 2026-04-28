import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import React from 'react'
import { GraphView } from '../GraphView'

// ─── MOCKS ───────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, style, ...props }: any) => <div style={style} {...props}>{children}</div>,
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

vi.mock('@/components/AdvancedBackground', () => ({
    AdvancedBackground: () => <div data-testid="advanced-background" />
}))

vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title, stats }: any) => (
        <div data-testid="view-header">
            <h1>{title}</h1>
            <div data-testid="header-stats">
                {stats.map((s: any) => <span key={s.label}>{s.label}: {s.value}</span>)}
            </div>
        </div>
    )
}))

vi.mock('@/components/TacticalCard', () => ({
    TacticalCard: ({ children, title }: any) => (
        <div data-testid="tactical-card">
            <h2>{title}</h2>
            {children}
        </div>
    )
}))

vi.mock('@/services/api', () => ({
    api: {
        graph: {
            getSummary: vi.fn(),
        }
    }
}))

import { api } from '@/services/api'

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('GraphView', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test('повинен відображати стан завантаження спочатку', async () => {
        (api.graph.getSummary as any).mockReturnValue(new Promise(() => {}))
        render(<GraphView />)
        expect(screen.getByText(/ЗАВАНТАЖЕННЯ НЕЙ ОННИХ ЗВ'ЯЗКІВ/i)).toBeInTheDocument()
    })

    test('повинен відмальовувати статистику та вузли після завантаження', async () => {
        const mockData = {
            total_nodes: 1500,
            total_edges: 4500,
            categories: {
                'Person': 500,
                'Organization': 1000
            }
        };
        (api.graph.getSummary as any).mockResolvedValue(mockData)

        await act(async () => {
            render(<GraphView />)
        })

        await waitFor(() => {
            expect(screen.queryByText(/ЗАВАНТАЖЕННЯ/i)).not.toBeInTheDocument()
        })

        expect(screen.getByText(/Г АФ ЗНАНЬ/i)).toBeInTheDocument()
        
        // Перевірка статистики в хедері
        expect(screen.getByText(/Вузлів: 1,500/i)).toBeInTheDocument()
        expect(screen.getByText(/Зв'язків: 4,500/i)).toBeInTheDocument()
        expect(screen.getByText(/Категорій: 2/i)).toBeInTheDocument()

        // Перевірка наявності вузлів категорій
        expect(screen.getByText('Person')).toBeInTheDocument()
        expect(screen.getByText('Organization')).toBeInTheDocument()
    })

    test('повинен відображати стан "Г АФ ПО ОЖНІЙ", якщо даних немає', async () => {
        (api.graph.getSummary as any).mockResolvedValue({
            total_nodes: 0,
            total_edges: 0,
            categories: {}
        })

        await act(async () => {
            render(<GraphView />)
        })

        await waitFor(() => {
            expect(screen.getByText(/Г АФ ПО ОЖНІЙ/i)).toBeInTheDocument()
        })
    })

    test('повинен обробляти помилку завантаження', async () => {
        (api.graph.getSummary as any).mockRejectedValue(new Error('Fetch failed'))

        await act(async () => {
            render(<GraphView />)
        })

        await waitFor(() => {
            expect(screen.getByText(/Г АФ ПО ОЖНІЙ/i)).toBeInTheDocument()
        })
    })
})
