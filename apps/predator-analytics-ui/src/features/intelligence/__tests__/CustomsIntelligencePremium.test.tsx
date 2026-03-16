import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import CustomsIntelligencePremium from '../CustomsIntelligencePremium'

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

vi.mock('@/services/api', () => ({
    api: {
        premium: {
            getCompetitors: vi.fn(),
            getIntelligenceAlerts: vi.fn(),
        }
    }
}))

import { api } from '@/services/api'

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('CustomsIntelligencePremium', () => {
    const mockCompetitors = [
        {
            name: 'MOCK COMPANY 1',
            imports: 10000000,
            exports: 5000000,
            topProducts: ['ELECTRONICS'],
            countries: ['CHINA'],
            trend: 'up',
            marketShare: 15
        }
    ]

    const mockAlerts = [
        {
            id: 'alert-1',
            title: 'Ризикова декларація: TEST COMPANY',
            description: 'Suspicious import volume',
            severity: 'high'
        }
    ]

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(api.premium.getCompetitors).mockResolvedValue(mockCompetitors)
        vi.mocked(api.premium.getIntelligenceAlerts).mockResolvedValue(mockAlerts)
    })

    test('повинен відмальовувати основні компоненти та KPI', async () => {
        render(<CustomsIntelligencePremium />)

        expect(screen.getByText(/CUSTOMS INTELLIGENCE/i)).toBeInTheDocument()
        expect(screen.getByText(/Загальний імпорт/i)).toBeInTheDocument()
        expect(screen.getByText(/\$847M/i)).toBeInTheDocument()
    })

    test('повинен завантажувати та відображати дані конкурентів', async () => {
        render(<CustomsIntelligencePremium />)

        await waitFor(() => {
            expect(api.premium.getCompetitors).toHaveBeenCalled()
        })

        expect(await screen.findByText(/MOCK COMPANY 1/i)).toBeInTheDocument()
        expect(screen.getByText(/\$10.0M/i)).toBeInTheDocument()
    })

    test('повинен перемикати ролі та відображати відповідний контент', async () => {
        render(<CustomsIntelligencePremium />)

        const govRoleBtn = screen.getByText(/Контроль та Моніторинг/i)
        fireEvent.click(govRoleBtn)

        // Тепер мають бути видимі ризик-алерти
        await waitFor(() => {
            expect(api.premium.getIntelligenceAlerts).toHaveBeenCalled()
        })

        expect(await screen.findByText(/TEST COMPANY/i)).toBeInTheDocument()
        expect(screen.getByText(/Високий ризик/i)).toBeInTheDocument()
    })

    test('повинен відображати заблокований контент для не-преміум ролі (якщо преміум доступ обмежений)', async () => {
        render(<CustomsIntelligencePremium />)
        
        // В ролі "Бізнес" (дефолт) - алерти мають бути в стані PremiumLock
        expect(screen.getByText(/Ризик-моніторинг/i)).toBeInTheDocument()
        
        // Має бути принаймні один заблокований елемент
        const lockButtons = screen.getAllByText(/Отримати Premium/i)
        expect(lockButtons.length).toBeGreaterThan(0)
    })

    test('повинен відображати карту в преміум режимі', async () => {
        render(<CustomsIntelligencePremium />)

        const premiumBtn = screen.getByText(/Premium Intelligence/i)
        fireEvent.click(premiumBtn)

        expect(await screen.findByText(/Геокарта торгівлі/i)).toBeInTheDocument()
        expect(screen.getByText(/Інтерактивна карта торгівлі/i)).toBeInTheDocument()
    })
})
