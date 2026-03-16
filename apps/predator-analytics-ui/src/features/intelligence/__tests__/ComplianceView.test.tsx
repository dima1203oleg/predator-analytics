import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import React from 'react'
import ComplianceView from '../ComplianceView'

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
    ViewHeader: ({ title }: any) => <div data-testid="view-header">{title}</div>
}))

vi.mock('@/components/TacticalCard', () => ({
    TacticalCard: ({ children, title, ...props }: any) => (
        <div data-testid="tactical-card" {...props}>
            {title && <h3>{title}</h3>}
            {children}
        </div>
    )
}))

vi.mock('@/components/shared/EmptyState', () => ({
    EmptyState: ({ title }: any) => <div data-testid="empty-state">{title}</div>
}))

vi.mock('@/components/shared/DataSkeleton', () => ({
    DataSkeleton: () => <div data-testid="skeleton" />,
    SkeletonGroup: () => <div data-testid="skeleton-group" />
}))

// Mock Service
vi.mock('@/services/dataService', () => ({
    security: {
        getAuditLogs: vi.fn(),
    }
}))

import { security } from '@/services/dataService'

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('ComplianceView', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test('повинен відмальовувати основні компоненти', async () => {
        vi.mocked(security.getAuditLogs).mockResolvedValue([])

        await act(async () => {
            render(<ComplianceView />)
        })

        expect(screen.getByText(/ЦЕНТР КОМПЛАЄНСУ ТА АУДИТУ/i)).toBeInTheDocument()
        expect(screen.getByText(/ЦІЛІСНІСТЬ СИСТЕМИ/i)).toBeInTheDocument()
        expect(screen.getByText(/ЗВІТНІСТЬ ТА ЕКСПОРТ/i)).toBeInTheDocument()
    })

    test('повинен завантажувати та відображати логи аудиту', async () => {
        const mockLogs = [
            { id: '1', user: 'admin', action: 'ACCESS_GRANTED', resource: 'DATABASE_CORE', ip_address: '1.2.3.4', status: 'SUCCESS', timestamp: new Date().toISOString() }
        ];
        vi.mocked(security.getAuditLogs).mockResolvedValue(mockLogs)

        await act(async () => {
            render(<ComplianceView />)
        })

        await waitFor(() => {
            expect(screen.getByText(/admin/i)).toBeInTheDocument()
            expect(screen.getByText(/ACCESS_GRANTED/i)).toBeInTheDocument()
            expect(screen.getByText(/DATABASE_CORE/i)).toBeInTheDocument()
        })
    })

    test('повинен відображати список звітів', async () => {
        vi.mocked(security.getAuditLogs).mockResolvedValue([])

        await act(async () => {
            render(<ComplianceView />)
        })

        expect(screen.getByText(/Звіт фінансового моніторингу/i)).toBeInTheDocument()
        expect(screen.getByText(/SOC2 Type II/i)).toBeInTheDocument()
    })

    test('повинен показувати EmptyState якщо логів немає', async () => {
        vi.mocked(security.getAuditLogs).mockResolvedValue([])

        await act(async () => {
            render(<ComplianceView />)
        })

        await waitFor(() => {
            expect(screen.getByTestId('empty-state')).toBeInTheDocument()
            expect(screen.getByText(/Немає записів аудиту/i)).toBeInTheDocument()
        })
    })
})
