import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'

// ─── MOCKS ───────────────────────────────────────────────────────────────────

// Mock ECharts
vi.mock('echarts-for-react', () => ({
    default: () => <div data-testid="mock-echart">EChart Placeholder</div>
}))

// Mock Framer Motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, whileHover, whileTap, initial, animate, exit, transition, ...props }: any) => <div {...props}>{children}</div>,
        h1: ({ children, whileHover, whileTap, initial, animate, exit, transition, ...props }: any) => <h1 {...props}>{children}</h1>,
        h3: ({ children, whileHover, whileTap, initial, animate, exit, transition, ...props }: any) => <h3 {...props}>{children}</h3>,
        p: ({ children, whileHover, whileTap, initial, animate, exit, transition, ...props }: any) => <p {...props}>{children}</p>,
        header: ({ children, whileHover, whileTap, initial, animate, exit, transition, ...props }: any) => <header {...props}>{children}</header>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}))

const mockWSData = { system: { cpu_percent: 45, memory_percent: 60 } };
vi.mock('../../hooks/useOmniscienceWS', () => ({
    useOmniscienceWS: () => ({
        isConnected: true,
        data: mockWSData
    })
}))

const mockAppStoreData = { persona: 'TITAN' };
vi.mock('../../store/useAppStore', () => ({
    useAppStore: () => mockAppStoreData
}))

// Mock API
vi.mock('../../services/api', () => ({
    api: {
        premium: {
            getDashboardStats: vi.fn().mockResolvedValue({
                profit: [
                    { id: '1', label: 'Дохід', value: '$100k', trend: '+10%', color: 'emerald' }
                ],
                feeds: { profit: [] }
            })
        },
        getETLJobs: vi.fn().mockResolvedValue([])
    }
}))

// Import component AFTER mocks
import SmartDashboard from '../DashboardView'

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('SmartDashboard View', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({})
        }))
    })

    test('повинен відмальовувати головний заголовок та індикатори', async () => {
        render(<SmartDashboard />)

        // Перевіряємо головний заголовок
        expect(screen.getByText(/Global_/i)).toBeInTheDocument()
        expect(screen.getByText(/Situation/i)).toBeInTheDocument()

        // Перевіряємо статус підключення
        expect(screen.getByText(/SYSTEM_ONLINE/i)).toBeInTheDocument()
    })

    test('повинен перемикати режими Бізнес / Контроль', async () => {
        render(<SmartDashboard />)

        const controlButton = screen.getByText(/Контроль/i)
        const businessButton = screen.getByText(/Бізнес/i)

        fireEvent.click(controlButton)
        await waitFor(() => {
            expect(screen.getByText(/Аномалії та ризики/i)).toBeInTheDocument()
        })

        fireEvent.click(businessButton)
        await waitFor(() => {
            expect(screen.getByText(/Динаміка ринку/i)).toBeInTheDocument()
        })
    })

    test('повинен відображати KPI метрики', async () => {
        render(<SmartDashboard />)

        // Чекаємо на завантаження даних та рендеринг карток
        await waitFor(() => {
            expect(screen.getByText(/(Дохід|KPI|Активні)/i)).toBeInTheDocument()
        })
    })
})
