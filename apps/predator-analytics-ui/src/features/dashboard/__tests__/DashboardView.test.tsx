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
        div: ({ children, whileHover, ...props }: any) => <div {...props}>{children}</div>,
        h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
        h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
        p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
        header: ({ children, ...props }: any) => <header {...props}>{children}</header>,
        button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock Lucide icons with a Proxy to handle any icon component automatically
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

// Mock SovereignReportWidget to avoid internal rendering/react-markdown issues
vi.mock('@/components/intelligence/SovereignReportWidget', () => ({
    SovereignReportWidget: () => <div data-testid="sovereign-report-widget">Mock Sovereign Report</div>
}))

// Mock AdvancedBackground and NeuralPulse
vi.mock('@/components/AdvancedBackground', () => ({
    AdvancedBackground: () => <div data-testid="advanced-bg" />
}))

vi.mock('@/components/ui/NeuralPulse', () => ({
    NeuralPulse: () => <div data-testid="neural-pulse" />
}))

const mockWSData = { system: { cpu_percent: 45, memory_percent: 60 } };
vi.mock('@/hooks/useOmniscienceWS', () => ({
    useOmniscienceWS: () => ({
        isConnected: true,
        data: mockWSData
    })
}))

// Import component AFTER mocks
import DashboardView from '../DashboardView'

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('DashboardView', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                engines: {},
                items: []
            })
        }))
    })

    test('повинен відмальовувати головний заголовок та індикатори', async () => {
        render(<DashboardView />)

        // Перевіряємо головний заголовок (використовуємо getAllByText, бо SANCTUM і STRATEGIC зустрічаються в хлібних крихтах)
        const sanctumTexts = screen.getAllByText(/SANCTUM/i)
        expect(sanctumTexts.length).toBeGreaterThan(0)
        
        const strategicTexts = screen.getAllByText(/STRATEGIC/i)
        expect(strategicTexts.length).toBeGreaterThan(0)

        // Перевіряємо статус хаба (підзаголовок)
        expect(screen.getByText(/UKRAINE_SOVEREIGNTY_HUB/i)).toBeInTheDocument()
    })

    test('повинен відображати кнопки управління', async () => {
        render(<DashboardView />)

        expect(screen.getByText(/СИНХРОНІЗУВАТИ/i)).toBeInTheDocument()
        expect(screen.getByText(/СИТУАЦІЙНА ДОПОВІДЬ/i)).toBeInTheDocument()
    })

    test('повинен відображати KPI метрики в шапці', async () => {
        render(<DashboardView />)

        // Метрики в ViewHeader
        expect(screen.getByText(/ЯДЕРНА_ПОТУЖНІСТЬ/i)).toBeInTheDocument()
        expect(screen.getByText(/ІНДЕКС_ЗАГРОЗ/i)).toBeInTheDocument()
    })
})

import { renderHook, act } from '@testing-library/react'
import { useRole } from '@/store/useRoleStore'
import { useUserStore } from '@/store/useUserStore'
import { UserRole } from '@/config/roles'

describe('useRole hook', () => {
    beforeEach(() => {
        useUserStore.setState({
            user: null,
            isAuthenticated: false,
            isAdmin: false,
            isClient: false
        })
    })

    test('повинен відображати роль basic_client за замовчуванням', () => {
        const { result } = renderHook(() => useRole())
        expect(result.current.role).toBe(UserRole.CLIENT_BASIC)
    })

    test('повинен оновлюватися при зміні користувача в useUserStore', () => {
        const { result } = renderHook(() => useRole())
        
        act(() => {
            useUserStore.getState().setUser({
                id: 'admin-1',
                name: 'Admin',
                email: 'admin@predator.ua',
                role: UserRole.ADMIN,
                tier: 'enterprise' as any,
                tenant_id: '1',
                tenant_name: 'test',
                last_login: '',
                data_sectors: []
            })
        })

        expect(result.current.role).toBe(UserRole.ADMIN)
    })
})
