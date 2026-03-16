import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import React from 'react'
import EntityRadarView from '../EntityRadarView'

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

vi.mock('@/components/ECharts', () => ({
    default: () => <div data-testid="echarts-mock">ECharts Radar</div>
}))

vi.mock('@/components/AdvancedBackground', () => ({
    AdvancedBackground: () => <div data-testid="advanced-bg" />
}))

vi.mock('@/services/api', () => ({
    api: {
        premium: {
            getCompetitorRadar: vi.fn()
        }
    }
}))

import { api } from '@/services/api'

const mockEntities = [
    {
        ueid: '1',
        name: 'ТОП-ЕНЕРДЖІ "ГРУП"',
        edrpou: '12345678',
        sector: 'Паливна галузь',
        cers_score: 92.5,
        cers_level: 'CRITICAL',
        cers_level_ua: 'Критичний',
        trend: 'increasing',
        confidence: 0.98,
        last_updated: '2024-03-20T10:00:00Z',
        risk_factors: ['SDN List Match', 'Offshore Links'],
        radar_metrics: { reputation: 20, financials: 40, connections: 10, regulatory: 30, adverse_media: 15 }
    },
    {
        ueid: '2',
        name: 'ЛОГІСТИК ТРАНС',
        edrpou: '87654321',
        sector: 'Логістика',
        cers_score: 45.0,
        cers_level: 'MODERATE',
        cers_level_ua: 'Помірний',
        trend: 'stable',
        confidence: 0.95,
        last_updated: '2024-03-19T10:00:00Z',
        risk_factors: [],
        radar_metrics: { reputation: 80, financials: 70, connections: 60, regulatory: 90, adverse_media: 85 }
    }
]

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('EntityRadarView', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(api.premium.getCompetitorRadar).mockResolvedValue(mockEntities)
    })

    test('повинен відмальовувати заголовок та лічильники', async () => {
        await act(async () => {
            render(<EntityRadarView />)
        })

        expect(screen.getByText(/РАДАР/i)).toBeInTheDocument()
        expect(screen.getAllByText(/СУБ'ЄКТІВ/i).length).toBeGreaterThan(0)
        
        await waitFor(() => {
            expect(screen.getByText('1')).toBeInTheDocument() // КРИТИЧНІ count
            expect(screen.getByText('2')).toBeInTheDocument() // МОНІТОРИНГ count
        })
    })

    test('повинен відображати список суб\'єктів', async () => {
        await act(async () => {
            render(<EntityRadarView />)
        })

        await waitFor(() => {
            expect(screen.getByText('ТОП-ЕНЕРДЖІ "ГРУП"')).toBeInTheDocument()
            expect(screen.getByText('ЛОГІСТИК ТРАНС')).toBeInTheDocument()
        })

        expect(screen.getByText('12345678')).toBeInTheDocument()
        expect(screen.getByText('87654321')).toBeInTheDocument()
    })

    test('повинен фільтрувати суб\'єктів за пошуком', async () => {
        await act(async () => {
            render(<EntityRadarView />)
        })

        await waitFor(() => {
            expect(screen.getByText('ТОП-ЕНЕРДЖІ "ГРУП"')).toBeInTheDocument()
        })

        const input = screen.getByPlaceholderText(/Пошук у глобальному реєстрі/i)
        fireEvent.change(input, { target: { value: 'ЛОГІСТИК' } })

        expect(screen.queryByText('ТОП-ЕНЕРДЖІ "ГРУП"')).not.toBeInTheDocument()
        expect(screen.getByText('ЛОГІСТИК ТРАНС')).toBeInTheDocument()
    })

    test('повинен розгортати панель деталей при натисканні', async () => {
        await act(async () => {
            render(<EntityRadarView />)
        })

        await waitFor(() => {
            expect(screen.getByText('ТОП-ЕНЕРДЖІ "ГРУП"')).toBeInTheDocument()
        })

        const entityRow = screen.getByText('ТОП-ЕНЕРДЖІ "ГРУП"')
        fireEvent.click(entityRow)

        await waitFor(() => {
            expect(screen.getByText(/Risk Topology Radar/i)).toBeInTheDocument()
            expect(screen.getByTestId('echarts-mock')).toBeInTheDocument()
            expect(screen.getByText(/Активні Сигнали Загрози/i)).toBeInTheDocument()
            expect(screen.getByText('SDN List Match')).toBeInTheDocument()
            expect(screen.getByText(/Генерувати Досьє/i)).toBeInTheDocument()
        })
    })

    test('повинен відображати стан "Об\'єктів не виявлено"', async () => {
        vi.mocked(api.premium.getCompetitorRadar).mockResolvedValue([])

        await act(async () => {
            render(<EntityRadarView />)
        })

        await waitFor(() => {
            expect(screen.getByText(/Об'єктів не виявлено/i)).toBeInTheDocument()
        })
    })
})
