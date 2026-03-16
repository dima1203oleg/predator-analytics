import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import React from 'react'
import EntityGraphView from '../EntityGraphView'

// ─── MOCKS ───────────────────────────────────────────────────────────────────

// Mocking @react-three/fiber and @react-three/drei
vi.mock('@react-three/fiber', () => ({
    Canvas: ({ children }: any) => <div data-testid="canvas-mock">{children}</div>,
    useFrame: vi.fn(),
}))

vi.mock('@react-three/drei', () => ({
    OrbitControls: () => <div data-testid="orbit-controls-mock" />,
    Html: ({ children }: any) => <div data-testid="html-mock">{children}</div>,
    Stars: () => <div data-testid="stars-mock" />,
    PerspectiveCamera: () => <div data-testid="camera-mock" />,
}))

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
    AdvancedBackground: () => <div data-testid="advanced-background" />
}))

// Mock API Call
const mockNodes = [
    { id: 'node-1', label: 'Alpha Corp', type: 'company', riskScore: 20, connections: 3, cluster: 1 },
    { id: 'node-2', label: 'Beta Ltd', type: 'company', riskScore: 90, connections: 5, cluster: 1 },
    { id: 'predator_core', label: 'PREDATOR CORE', type: 'system', riskScore: 0, connections: 10, cluster: 0 }
]

const mockLinks = [
    { source: 'predator_core', target: 'node-1', value: 1, type: 'standard' },
    { source: 'node-1', target: 'node-2', value: 1, type: 'risk' }
]

global.fetch = vi.fn().mockImplementation(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ nodes: mockNodes, links: mockLinks }),
    })
)

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('EntityGraphView', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test('повинен відображати стан завантаження спочатку', async () => {
        render(<EntityGraphView />)
        expect(screen.getByText(/Синтез Топології/i)).toBeInTheDocument()
    })

    test('повинен відмальовувати основний заголовок та канвас після завантаження', async () => {
        await act(async () => {
            render(<EntityGraphView />)
        })

        await waitFor(() => {
            expect(screen.queryByText(/Синтез Топології/i)).not.toBeInTheDocument()
        })

        expect(screen.getByText(/Топологія/i)).toBeInTheDocument()
        expect(screen.getByText(/Мережі/i)).toBeInTheDocument()
        expect(screen.getByTestId('canvas-mock')).toBeInTheDocument()
    })

    test('повинен відображати статистику в нижньому HUD', async () => {
        await act(async () => {
            render(<EntityGraphView />)
        })

        await waitFor(() => {
            expect(screen.getByText(/Вузлів/i)).toBeInTheDocument()
        })

        // Кількість вузлів (3)
        expect(screen.getByText('3')).toBeInTheDocument()
        // Кількість зв'язків (2)
        expect(screen.getByText('2')).toBeInTheDocument()
        // Критично (1 - node-2 з ризиком 90)
        expect(screen.getByText('1')).toBeInTheDocument()
    })

    test('повинен перемикати фільтри', async () => {
        await act(async () => {
            render(<EntityGraphView />)
        })

        await waitFor(() => {
            expect(screen.getByText(/Всі Вузли/i)).toBeInTheDocument()
        })

        const riskFilter = screen.getByText(/Лише Загрози/i)
        
        await act(async () => {
            fireEvent.click(riskFilter)
        })
        
        // Після фільтру 'risk', кількість вузлів може змінитись (хоча логіка в компоненті складна)
        // Тут ми хоча б перевіряємо, що фільтр став активним (можна за стилями або зміною стейту)
        expect(riskFilter).toHaveClass('bg-rose-500')
    })
})
