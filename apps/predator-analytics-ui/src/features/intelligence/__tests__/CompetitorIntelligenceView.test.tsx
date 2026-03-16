import { render, screen, fireEvent, act, waitFor, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CompetitorIntelligenceView from '../CompetitorIntelligenceView';
import React from 'react';
import { api } from '@/services/api';

// Мокаємо залежності
vi.mock('@/services/api', () => ({
    api: {
        premium: {
            getCompetitors: vi.fn(),
        },
    },
}));

vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title, stats }: any) => (
        <div data-testid="view-header">
            <h1>{title}</h1>
            <div data-testid="header-stats">{stats?.length || 0} stats</div>
        </div>
    ),
}));

vi.mock('@/components/TacticalCard', () => ({
    TacticalCard: ({ children, variant, title, className, onClick }: any) => (
        <div data-testid={`tactical-card-${variant || 'default'}`} className={className} onClick={onClick}>
            {title && <div>{title}</div>}
            {children}
        </div>
    ),
}));

vi.mock('@/components/CyberOrb', () => ({
    CyberOrb: () => <div data-testid="cyber-orb" />,
}));

vi.mock('@/components/HoloContainer', () => ({
    HoloContainer: ({ children }: any) => <div data-testid="holo-container">{children}</div>,
}));

vi.mock('@/components/layout/PageTransition', () => ({
    PageTransition: ({ children }: any) => <div data-testid="page-transition">{children}</div>,
}));

vi.mock('@/features/ai/AIInsightsHub', () => ({
    default: () => <div data-testid="ai-insights-hub" />,
}));

vi.mock('@/components/shared/DataSkeleton', () => ({
    DataSkeleton: () => <div data-testid="data-skeleton" />,
}));

// Дані для мокання API
const mockCompetitors = [
    {
        id: '1',
        name: 'GLOBAL TRADE CORP',
        edrpou: '11223344',
        totalImport: 50000000,
        totalExport: 10000000,
        countries: ['China', 'USA'],
        products: ['Electronics', 'Chemicals'],
        topSuppliers: ['Supplier A', 'Supplier B'],
        marketShare: 15,
        trend: 'up',
        trendPercent: 12,
        riskScore: 25,
        lastActivity: '2026-03-01',
        isTracked: false,
    },
    {
        id: '2',
        name: 'MODERN LOGISTICS',
        edrpou: '55667788',
        totalImport: 2000000,
        totalExport: 500000,
        countries: ['Poland', 'Germany'],
        products: ['Food', 'Beverages'],
        topSuppliers: ['Supplier C'],
        marketShare: 5,
        trend: 'down',
        trendPercent: 5,
        riskScore: 65,
        lastActivity: '2026-02-20',
        isTracked: true,
    }
];

describe('CompetitorIntelligenceView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (api.premium.getCompetitors as any).mockResolvedValue(mockCompetitors);
    });

    it('повинен успішно завантажувати та відображати список конкурентів', async () => {
        render(<CompetitorIntelligenceView />);
        
        expect(screen.getByTestId('view-header')).toBeInTheDocument();
        
        // Чекаємо поки зникнуть скелетони і з'являться дані
        await waitFor(() => {
            expect(screen.getByText('GLOBAL TRADE CORP')).toBeInTheDocument();
            expect(screen.getByText('MODERN LOGISTICS')).toBeInTheDocument();
        });

        expect(screen.getByText('11223344')).toBeInTheDocument();
        expect(screen.getByText('$50.0M')).toBeInTheDocument();
    });

    it('повинен фільтрувати конкурентів за назвою', async () => {
        render(<CompetitorIntelligenceView />);
        
        await waitFor(() => {
            expect(screen.getByText('GLOBAL TRADE CORP')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText(/Пошук сутностей/i);
        fireEvent.change(searchInput, { target: { value: 'MODERN' } });

        expect(screen.queryByText('GLOBAL TRADE CORP')).not.toBeInTheDocument();
        expect(screen.getByText('MODERN LOGISTICS')).toBeInTheDocument();
    });

    it('повинен розгортати картку конкурента для детальної інформації', async () => {
        render(<CompetitorIntelligenceView />);
        
        await waitFor(() => {
            expect(screen.getByText('GLOBAL TRADE CORP')).toBeInTheDocument();
        });

        const card = screen.getByText('GLOBAL TRADE CORP').closest('.cursor-pointer');
        
        await act(async () => {
            fireEvent.click(card!);
        });

        // Після кліку мають з'явитися деталі (наприклад, ГЕОГРАФІЯ ЕКСПАНСІЇ)
        // Використовуємо findByText через анімацію розгортки
        expect(await screen.findByText(/ГЕОГРАФІЯ ЕКСПАНСІЇ/i)).toBeInTheDocument();
        expect(screen.getByText('China')).toBeInTheDocument();
        expect(screen.getByText('Supplier A')).toBeInTheDocument();
    });

    it('повинен змінювати статус відстеження (Track/Untrack)', async () => {
        render(<CompetitorIntelligenceView />);
        
        await waitFor(() => {
            expect(screen.getByText('GLOBAL TRADE CORP')).toBeInTheDocument();
        });

        // Шукаємо картку саме GLOBAL TRADE CORP
        const globalCorpCard = screen.getByText('GLOBAL TRADE CORP').closest('[data-testid^="tactical-card"]');
        const trackBtn = within(globalCorpCard as HTMLElement).getByRole('button').querySelector('svg.lucide-star')?.parentElement;
        
        // GLOBAL TRADE CORP спочатку не відстежується
        expect(within(globalCorpCard as HTMLElement).queryByText(/ПЕРЕБУВАЄ ПІД НАГЛЯДОМ/i)).not.toBeInTheDocument();

        await act(async () => {
            fireEvent.click(trackBtn!);
        });

        // Після кліку має з'явитися бейдж
        expect(within(globalCorpCard as HTMLElement).getByText(/ПЕРЕБУВАЄ ПІД НАГЛЯДОМ/i)).toBeInTheDocument();
        
        // MODERN LOGISTICS все ще має свій бейдж (він був там спочатку)
        const modernCard = screen.getByText('MODERN LOGISTICS').closest('[data-testid^="tactical-card"]');
        expect(within(modernCard as HTMLElement).getByText(/ПЕРЕБУВАЄ ПІД НАГЛЯДОМ/i)).toBeInTheDocument();
    });

    it('повинен відображати високий ризик синергії для відповідних конкурентів', async () => {
        render(<CompetitorIntelligenceView />);
        
        await waitFor(() => {
            // MODERN LOGISTICS має riskScore: 65 (> 50)
            expect(screen.getByText(/ВИСОКИЙ РИЗИК СИНЕРГІЇ/i)).toBeInTheDocument();
            expect(screen.getByText(/65%/i)).toBeInTheDocument();
        });
    });

    it('повинен відображати стан "СИГНАЛІВ НЕ ВИЯВЛЕНО", якщо нічого не знайдено', async () => {
        render(<CompetitorIntelligenceView />);
        
        await waitFor(() => {
            expect(screen.getByText('GLOBAL TRADE CORP')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText(/Пошук сутностей/i);
        fireEvent.change(searchInput, { target: { value: 'NONEXISTENT' } });

        expect(screen.getByText('СИГНАЛІВ НЕ ВИЯВЛЕНО')).toBeInTheDocument();
    });
});
