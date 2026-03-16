import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import React from 'react'
import EvolutionView from '../EvolutionView'

// ─── MOCKS ───────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
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

vi.mock('@/components/super/EvolutionDashboard', () => ({
    default: () => <div data-testid="evolution-dashboard">Evolution Dashboard Mock</div>
}))

vi.mock('@/components/super/TruthLedgerTerminal', () => ({
    default: () => <div data-testid="truth-ledger-terminal">Truth Ledger Terminal Mock</div>
}))

vi.mock('@/components/super/GlobalNeuralMesh', () => ({
    default: () => <div data-testid="global-neural-mesh">Global Neural Mesh Mock</div>
}))

vi.mock('@/components/super/EvolutionForge', () => ({
    default: () => <div data-testid="evolution-forge">Evolution Forge Mock</div>
}))

vi.mock('@/components/super/AZRImprovementTrace', () => ({
    AZRImprovementTrace: () => <div data-testid="azr-improvement-trace">Improvement Trace Mock</div>
}))

vi.mock('@/components/super/AZRDeploymentCenter', () => ({
    AZRDeploymentCenter: () => <div data-testid="azr-deployment-center">Deployment Center Mock</div>
}))

vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title, stats, actions }: any) => (
        <div data-testid="view-header">
            <h3>{title}</h3>
            {stats?.map((s: any) => <div key={s.label}>{s.label}: {s.value}</div>)}
            <div>{actions}</div>
        </div>
    )
}))

vi.mock('@/components/TacticalCard', () => ({
    TacticalCard: ({ children, title, ...props }: any) => (
        <div data-testid="tactical-card" {...props}>
            {title && <h4>{title}</h4>}
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

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('EvolutionView', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Reset URL
        window.history.replaceState({}, '', '/')
    })

    test('повинен відмальовувати основні компоненти та вкладки', () => {
        render(<EvolutionView />)
        
        expect(screen.getByText(/EVOLUTIONARY TRUTH LEDGER/i)).toBeInTheDocument()
        expect(screen.getByText(/Цикли AZR: 2,847/i)).toBeInTheDocument()
        
        // Перевірка вкладок
        expect(screen.getByText(/Огляд Еволюції/i)).toBeInTheDocument()
        expect(screen.getByText(/Слід Міркувань/i)).toBeInTheDocument()
    })

    test('повинен відображати дашборд на головній вкладці', () => {
        render(<EvolutionView />)
        expect(screen.getByTestId('evolution-dashboard')).toBeInTheDocument()
        expect(screen.getByTestId('evolution-forge')).toBeInTheDocument()
        expect(screen.getByTestId('cyber-orb')).toBeInTheDocument()
    })

    test('повинен перемикати вкладки та відображати відповідний контент', () => {
        render(<EvolutionView />)

        // Перемикання на 'trace'
        const traceTab = screen.getByRole('button', { name: /Слід Міркувань/i })
        fireEvent.click(traceTab)
        expect(screen.getByTestId('azr-improvement-trace')).toBeInTheDocument()

        // Перемикання на 'deployment'
        const deployTab = screen.getByRole('button', { name: /Пульс Розгортання/i })
        fireEvent.click(deployTab)
        expect(screen.getByTestId('azr-deployment-center')).toBeInTheDocument()

        // Перемикання на 'ledger'
        const ledgerTab = screen.getByRole('button', { name: /Truth Ledger/i })
        fireEvent.click(ledgerTab)
        expect(screen.getByTestId('truth-ledger-terminal')).toBeInTheDocument()
    })

    test('повинен завантажувати вкладку з параметрів URL', () => {
        window.history.replaceState({}, '', '/?tab=trace')
        render(<EvolutionView />)
        
        expect(screen.getByTestId('azr-improvement-trace')).toBeInTheDocument()
    })

    test('повинен відображати статусний бар знизу', () => {
        render(<EvolutionView />)
        expect(screen.getByText(/СТАТУС:/i)).toBeInTheDocument()
        expect(screen.getByText(/ЯДРО СУВЕРЕННОГО СИНТЕЗУ/i)).toBeInTheDocument()
        expect(screen.getByText(/СИНТЕТИЧНИЙ КОНЦЕНСУС ДОСЯГНУТО/i)).toBeInTheDocument()
    })
})
