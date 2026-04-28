import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CompetitorIntelligenceView from '../CompetitorIntelligenceView';
import React from 'react';

// ─── MOCKS ───────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

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
});

vi.mock('@/services/api', () => ({
    intelligenceApi: {
        getCompetitors: vi.fn(() => Promise.resolve([
            {
                id: 'comp_1',
                name: 'ГОЛОВНИЙ КОНКУ ЕНТ',
                edrpou: '12345678',
                totalImport: 10000000,
                totalExport: 5000000,
                countries: ['Польща', 'Німеччина'],
                products: ['Обладнання'],
                topSuppliers: ['Supplier Alpha'],
                marketShare: 15,
                trend: 'up',
                trendPercent: 12,
                riskScore: 65,
                lastActivity: '2026-04-10',
                isTracked: true
            }
        ]))
    }
}));

vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title, stats }: any) => (
        <div data-testid="view-header">
            {title}
            <div data-testid="stats-count">{stats?.length}</div>
        </div>
    )
}));

vi.mock('@/features/ai/AIInsightsHub', () => ({ default: () => <div data-testid="ai-hub" /> }));
vi.mock('@/components/TacticalCard', () => ({ 
    TacticalCard: ({ children, title }: any) => <div data-testid="tactical-card">{title}{children}</div> 
}));
vi.mock('@/components/CyberOrb', () => ({ CyberOrb: () => <div data-testid="cyber-orb" /> }));
vi.mock('@/components/HoloContainer', () => ({ HoloContainer: ({ children }: any) => <div data-testid="holo-container">{children}</div> }));
vi.mock('@/components/layout/PageTransition', () => ({ PageTransition: ({ children }: any) => <div data-testid="page-transition">{children}</div> }));

vi.mock('@/hooks/useBackendStatus', () => ({
    useBackendStatus: () => ({
        isOffline: false,
        nodeSource: 'NVIDIA_PRIMARY'
    })
}));

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('CompetitorIntelligenceView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('відображає заголовок та список конкурентів', async () => {
        render(<CompetitorIntelligenceView />);
        
        await waitFor(() => {
            expect(screen.getByText(/СТРАТЕГІЧНИЙ НЕКСУС КОНКУ ЕНТІВ/i)).toBeInTheDocument();
            expect(screen.getByText(/ГОЛОВНИЙ КОНКУ ЕНТ/i)).toBeInTheDocument();
            expect(screen.getByText('12345678')).toBeInTheDocument();
        });
    });

    it('фільтрує список за запитом', async () => {
        render(<CompetitorIntelligenceView />);
        
        await waitFor(() => screen.getByText(/ГОЛОВНИЙ КОНКУ ЕНТ/i));
        
        const searchInput = screen.getByPlaceholderText(/Пошук сутностей/i);
        fireEvent.change(searchInput, { target: { value: 'НЕМАЄ_ТАККОГО' } });
        
        expect(screen.queryByText(/ГОЛОВНИЙ КОНКУ ЕНТ/i)).not.toBeInTheDocument();
        expect(screen.getByText(/СИГНАЛІВ НЕ ВИЯВЛЕНО/i)).toBeInTheDocument();
    });

    it('ініціює predator-error в автономному режимі', async () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ 
                isOffline: true, 
                nodeSource: 'MIRROR_CLUSTER'
            })
        }));

        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

        render(<CompetitorIntelligenceView />);

        await waitFor(() => {
            expect(screen.getByText(/OFFLINE_MIRROR/i)).toBeInTheDocument();
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'predator-error',
                    detail: expect.objectContaining({
                        service: 'CompetitorIntel',
                        code: 'COMPETITOR_NODES'
                    })
                })
            );
        });
    });

    it('відображає деталі при розгортанні картки', async () => {
        render(<CompetitorIntelligenceView />);
        
        await waitFor(() => screen.getByText(/ГОЛОВНИЙ КОНКУ ЕНТ/i));
        
        const card = screen.getByText(/ГОЛОВНИЙ КОНКУ ЕНТ/i);
        fireEvent.click(card);
        
        expect(screen.getByText(/ГЕОГ АФІЯ ЕКСПАНСІЇ/i)).toBeInTheDocument();
        expect(screen.getByText(/ВУЗЛИ ПОСТАЧАННЯ/i)).toBeInTheDocument();
        expect(screen.getByText(/Supplier Alpha/i)).toBeInTheDocument();
    });
});
