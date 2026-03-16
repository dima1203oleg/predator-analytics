import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import React from 'react'
import AnalyticsView from '../AnalyticsView'

// ─── MOCKS ───────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
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
    AdvancedBackground: () => <div data-testid="advanced-bg" />
}))

vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title, stats }: any) => (
        <div data-testid="view-header">
            <h3>{title}</h3>
            {stats?.map((s: any) => <div key={s.label}>{s.label}: {s.value}</div>)}
        </div>
    )
}))

vi.mock('@/components/TacticalCard', () => ({
    TacticalCard: ({ children, title, ...props }: any) => (
        <div data-testid="tactical-card" {...props}>
            {title && <h3>{title}</h3>}
            {children}
        </div>
    )
}))

vi.mock('@/components/CyberOrb', () => ({
    CyberOrb: () => <div data-testid="cyber-orb" />
}))

vi.mock('@/components/HoloContainer', () => ({
    HoloContainer: ({ children }: any) => <div data-testid="holo-container">{children}</div>
}))

vi.mock('@/components/premium/VisualAnalytics', () => ({
    VisualAnalytics: () => <div data-testid="visual-analytics">Visual Analytics Mock</div>
}))

// Mock API
vi.mock('@/services/api', () => ({
    api: {
        graph: {
            summary: vi.fn(),
            search: vi.fn(),
        }
    }
}))

import { api } from '@/services/api'

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('AnalyticsView', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(api.graph.summary).mockResolvedValue({ total_nodes: 100, total_edges: 500 })
        vi.mocked(api.graph.search).mockResolvedValue({ 
            nodes: [
                { id: '1', name: 'TEST CO', label: 'ORGANIZATION', properties: { code: '123' } }
            ],
            edges: []
        })
    })

    test('повинен відмальовувати основні елементи та завантажувати дашборд', async () => {
        render(<AnalyticsView />)

        // Перевірка заголовка (може бути розбитий)
        await waitFor(() => {
            expect(screen.getByRole('heading', { level: 3, name: /СЕМАНТИЧНИЙ РАДАР/i })).toBeInTheDocument()
        })
        
        await waitFor(() => {
            expect(api.graph.summary).toHaveBeenCalled()
        })

        expect(await screen.findByText(/100/i)).toBeInTheDocument()
    })

    test('повинен виконувати пошук та відображати результати', async () => {
        render(<AnalyticsView />)

        // Чекаємо завершення початкового сканування
        const searchBtn = await screen.findByText(/СКАНУВАТИ/i)
        const input = screen.getByPlaceholderText(/Пошук компанії, особи або схем/i)

        fireEvent.change(input, { target: { value: 'New Query' } })
        fireEvent.click(searchBtn)

        await waitFor(() => {
            expect(api.graph.search).toHaveBeenCalledWith('New Query', 2)
        }, { timeout: 3000 })
        
        // HUD має з'явитися
        const entityName = await screen.findByText((content, element) => {
            return element?.tagName.toLowerCase() === 'h2' && content.includes('TEST CO')
        })
        expect(entityName).toBeInTheDocument()
        expect(screen.getByText(/ПАРАМЕТРИ ОБ'ЄКТА/i)).toBeInTheDocument()
    })

    test('повинен перемикатися на візуальну аналітику', async () => {
        render(<AnalyticsView />)

        const visualTab = screen.getByText(/ВІЗУАЛЬНА АНАЛІТИКА/i)
        fireEvent.click(visualTab)

        expect(await screen.findByTestId('visual-analytics')).toBeInTheDocument()
    })

    test('повинен відображати HUD об\'єкта за замовчуванням при старті', async () => {
        render(<AnalyticsView />)

        await waitFor(() => {
            expect(api.graph.search).toHaveBeenCalledWith("Енерго", 2)
        })

        const entityName = await screen.findByText((content, element) => {
            return element?.tagName.toLowerCase() === 'h2' && content.includes('TEST CO')
        })
        expect(entityName).toBeInTheDocument()
        expect(screen.getByText(/code/i)).toBeInTheDocument()
        expect(screen.getByText(/123/i)).toBeInTheDocument()
    })
})
