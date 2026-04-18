import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import React from 'react'
import AMLScoringView from '../AMLScoringView'

// ─── MOCKS ───────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => {
    const motionProxy = new Proxy(
        {},
        {
            get: (_target, prop) => {
                return ({ children, ...props }: any) => {
                    const Tag = typeof prop === 'string' ? prop : 'div';
                    return <Tag {...props}>{children}</Tag>;
                };
            },
        }
    );
    return {
        motion: motionProxy,
        AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    };
});

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

vi.mock('@/components/ECharts', () => ({
    default: () => <div data-testid="echarts-mock">ECharts Chart</div>
}))

vi.mock('@/components/AdvancedBackground', () => ({
    AdvancedBackground: () => <div data-testid="advanced-bg" />
}))

vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title, stats }: any) => (
        <div data-testid="view-header">
            {title}
            <div data-testid="stats-count">{stats?.length}</div>
        </div>
    )
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

vi.mock('@/components/CyberGrid', () => ({
    CyberGrid: () => <div data-testid="cyber-grid" />
}))

vi.mock('@/hooks/useBackendStatus', () => ({
    useBackendStatus: () => ({ isOffline: false })
}))

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

        expect(screen.getByText(/СКОРІНГ/i)).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/00000000/i)).toBeInTheDocument()
        expect(screen.getByText(/EXECUTE_SCAN/i)).toBeInTheDocument()
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

        render(<AMLScoringView />)

        const idInput = screen.getByPlaceholderText(/00000000/i)
        const nameInput = screen.getByPlaceholderText(/ТОВ "Назва".../i)
        const submitBtn = screen.getByText(/EXECUTE_SCAN/i)

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
        render(<AMLScoringView />)

        const batchBtn = screen.getByText(/ПАКЕТНИЙ_ДЕПЛОЙ_CSV/i)
        await act(async () => {
            fireEvent.click(batchBtn)
        })

        expect(screen.getByText(/IMPORT_TARGET_CSV/i)).toBeInTheDocument()
    })

    test('ініціює predator-error при автономному режимі', async () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ isOffline: true })
        }))

        const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

        render(<AMLScoringView />)

        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'predator-error',
                    detail: expect.objectContaining({
                        service: 'AML_Scoring',
                        code: 'COMPLIANCE_NODES'
                    })
                })
            )
        })
    })
})
