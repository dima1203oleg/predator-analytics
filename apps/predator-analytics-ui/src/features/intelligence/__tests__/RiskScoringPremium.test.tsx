import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import React from 'react'
import RiskScoringPremium from '../RiskScoringPremium'

// ─── MOCKS ───────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, whileHover, ...props }: any) => <div {...props}>{children}</div>,
        h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
        h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
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
        persona: 'GOVERNMENT'
    })
}))

vi.mock('@/features/diligence', () => ({
    diligenceApi: {
        searchCompanies: vi.fn().mockResolvedValue({
            items: [
                { id: '1', name: 'КРИТИЧНА КОРП', edrpou: '11111111', risk_score: 0.95, sanctions: ['OFAC'], owners: [] },
                { id: '2', name: 'БЕЗПЕЧНА ТОВ', edrpou: '22222222', risk_score: 0.1, sanctions: [], owners: ['Owner 1'] }
            ]
        })
    }
}))

vi.mock('@/components/TacticalCard', () => ({
    TacticalCard: ({ title, children, onClick }: any) => (
        <div data-testid={`tactical-card-${title}`} onClick={onClick}>
            <h3>{title}</h3>
            <div data-testid="kpi-value">{children}</div>
        </div>
    )
}))

vi.mock('@/components/HoloContainer', () => ({
    HoloContainer: ({ children }: any) => <div data-testid="holo-container">{children}</div>
}))

vi.mock('@/components/CyberOrb', () => ({
    CyberOrb: () => <div data-testid="cyber-orb" />
}))

vi.mock('@/components/risk/Cers5LayerGauge', () => ({
    Cers5LayerGauge: () => <div data-testid="cers-gauge">CERS GAUGE</div>
}))

vi.mock('@/components/intelligence/SovereignReportWidget', () => ({
    SovereignReportWidget: ({ ueid }: any) => <div data-testid="sovereign-report">Report for {ueid}</div>
}))

import { diligenceApi } from '@/features/diligence'

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('RiskScoringPremium', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test('повинен відмальовувати заголовок та KPI', async () => {
        await act(async () => {
            render(<RiskScoringPremium />)
        })

        expect(screen.getByText(/Ризик-Моніторинг/i)).toBeInTheDocument()
        expect(screen.getByText(/State Inspector/i)).toBeInTheDocument()
        
        await waitFor(() => {
            const criticalCard = screen.getByTestId('tactical-card-Критичний')
            expect(criticalCard).toHaveTextContent('1')
        })
    })

    test('повинен відображати список об\'єктів', async () => {
        await act(async () => {
            render(<RiskScoringPremium />)
        })

        await waitFor(() => {
            expect(screen.getByText(/КРИТИЧНА КОРП/i)).toBeInTheDocument()
            expect(screen.getByText(/БЕЗПЕЧНА ТОВ/i)).toBeInTheDocument()
            expect(screen.getByText(/11111111/i)).toBeInTheDocument()
        })
    })

    test('повинен фільтрувати за пошуковим запитом', async () => {
        await act(async () => {
            render(<RiskScoringPremium />)
        })

        const input = screen.getByPlaceholderText(/Пошук за назвою або ЄДРПОУ/i)
        
        await act(async () => {
            fireEvent.change(input, { target: { value: 'КРИТИЧНА' } })
        })

        expect(screen.getByText(/КРИТИЧНА КОРП/i)).toBeInTheDocument()
        expect(screen.queryByText(/БЕЗПЕЧНА ТОВ/i)).not.toBeInTheDocument()
    })

    test('повинен фільтрувати за рівнем ризику', async () => {
        await act(async () => {
            render(<RiskScoringPremium />)
        })

        await waitFor(() => {
            const kpiCard = screen.getByTestId('tactical-card-Критичний')
            fireEvent.click(kpiCard)
        })

        expect(screen.getByText(/КРИТИЧНА КОРП/i)).toBeInTheDocument()
        expect(screen.queryByText(/БЕЗПЕЧНА ТОВ/i)).not.toBeInTheDocument()
    })

    test('повинен відкривати детальну панель при виборі об\'єкта', async () => {
        await act(async () => {
            render(<RiskScoringPremium />)
        })

        const entity = await screen.findByText(/КРИТИЧНА КОРП/i)
        await act(async () => {
            fireEvent.click(entity)
        })

        // Панель деталізації
        await waitFor(() => {
            expect(screen.getByTestId('cers-gauge')).toBeInTheDocument()
            expect(screen.getByTestId('sovereign-report')).toBeInTheDocument()
            expect(screen.getByText(/UEID: 11111111/i)).toBeInTheDocument()
        })
    })
})
