import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TendersView from '../TendersView';
import { apiClient } from '@/services/api/config';
import React from 'react';

// Mock dependencies
vi.mock('@/services/api/config', () => ({
    apiClient: {
        get: vi.fn(),
    },
}));

vi.mock('@/hooks/useBackendStatus', () => ({
    useBackendStatus: () => ({
        isOffline: false,
        isTruthOnly: true,
        modeLabel: '� ежим правдивих даних',
        sourceLabel: 'localhost:9080/api/v1',
        sourceType: 'local',
        statusLabel: 'Зʼєднання активне',
    }),
}));

vi.mock('@/components/layout/PageTransition', () => ({
    PageTransition: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/TacticalCard', () => ({
    TacticalCard: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

vi.mock('@/components/AdvancedBackground', () => ({
    AdvancedBackground: () => <div data-testid="advanced-bg" />,
}));

vi.mock('@/components/CyberGrid', () => ({
    CyberGrid: () => <div data-testid="cyber-grid" />,
}));

vi.mock('@/components/CyberOrb', () => ({
    CyberOrb: () => <div data-testid="cyber-orb" />,
}));

vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title, stats }: { title: React.ReactNode; stats?: Array<{ label: string; value: string }> }) => (
        <div>
            <h1>{title}</h1>
            {stats?.map((stat) => (
                <div key={stat.label}>
                    <span>{stat.label}</span>
                    <span>{stat.value}</span>
                </div>
            ))}
        </div>
    ),
}));

// Mock framer-motion
vi.mock('framer-motion', async () => {
    const actual = await vi.importActual('framer-motion') as any;
    return {
        ...actual,
        motion: {
            div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
            span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
        },
        AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    };
});

// Mock recharts
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div data-testid="recharts-container">{children}</div>,
    AreaChart: () => <div data-testid="recharts-area-chart" />,
    Area: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    BarChart: () => null,
    Bar: () => null,
    Cell: () => null,
}));

describe('TendersView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (apiClient.get as any).mockImplementation(() => new Promise(() => {}));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const mockTendersData = {
        tenders: [
            { id: 'T1', title: 'Tender 1', value: 1000000, currency: 'UAH', status: 'active', procuringEntity: 'Entity A', date: '2024-01-01', risk_score: 50, category: 'IT', bids_count: 2 },
            { id: 'T2', title: 'Tender 2', value: 2000000, currency: 'UAH', status: 'complete', procuringEntity: 'Entity B', date: '2024-01-02', risk_score: 90, category: 'Construction', bids_count: 1 },
        ]
    };

    const mockStatsData = {
        analytics: {
            total_value: 3000000,
            avg_risk: 70,
            critical_tenders: 1,
            categories: [
                { name: 'IT', value: 1000000, color: '#000' },
                { name: 'Construction', value: 2000000, color: '#fff' }
            ],
            trends: [
                { date: '01.01', value: 1000000 }
            ]
        }
    };

    it('повинен рендерити базові елементи інтерфейсу', () => {
        render(<TendersView />);
        expect(screen.getByRole('heading', { name: /� ЕЄСТ�  ЗАКУПІВЕЛЬ/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/ПОШУК ТЕНДЕ� ІВ ЗА НАЗВОЮ АБО ЗАМОВНИКОМ/i)).toBeInTheDocument();
        expect(screen.getByTestId('advanced-bg')).toBeInTheDocument();
    });

    it('повинен оновлювати живий годинник', () => {
        vi.useFakeTimers();
        render(<TendersView />);
        
        const statusElement = screen.getByText(/КОНТУ�  PROZORRO/i);
        const initialText = statusElement.textContent;

        act(() => {
            vi.advanceTimersByTime(2000);
        });

        const updatedText = statusElement.textContent;
        expect(updatedText).not.toBe(initialText);
        
        vi.useRealTimers();
    });

    it('повинен завантажувати і відображати тендери', async () => {
        (apiClient.get as any).mockImplementation((url: string) => {
            if (url.includes('/tenders')) return Promise.resolve({ data: mockTendersData });
            if (url.includes('/stats')) return Promise.resolve({ data: mockStatsData });
            return Promise.resolve({ data: {} });
        });

        render(<TendersView />);

        await waitFor(() => {
            expect(apiClient.get).toHaveBeenCalledWith('/osint_ua/prozorro/tenders?limit=24');
            expect(apiClient.get).toHaveBeenCalledWith('/osint_ua/prozorro/stats');
        });

        expect(await screen.findByText('Tender 1')).toBeInTheDocument();
        expect(await screen.findByText('Tender 2')).toBeInTheDocument();
    });

    it('не підмінює дані локальним демо-набором, якщо обидва маршрути недоступні', async () => {
        (apiClient.get as any).mockRejectedValue(new Error('network error'));

        render(<TendersView />);

        expect(await screen.findByText('НЕМАЄ ПІДТВЕ� ДЖЕНИХ ДАНИХ')).toBeInTheDocument();
        expect(
            screen.getByText('Маршрути Prozorro не повернули підтверджених даних. Екран не підмінює їх локальними тендерами.'),
        ).toBeInTheDocument();
        expect(screen.getByText(/Екран не підставляє локальні лоти або аналітику/i)).toBeInTheDocument();
        expect(screen.queryByText('Tender 1')).not.toBeInTheDocument();
        expect(screen.queryByText('Tender 2')).not.toBeInTheDocument();
    });

    it('повинен фільтрувати за пошуковим запитом', async () => {
        (apiClient.get as any).mockImplementation((url: string) => {
            if (url.includes('/tenders')) return Promise.resolve({ data: mockTendersData });
            if (url.includes('/stats')) return Promise.resolve({ data: mockStatsData });
            return Promise.resolve({ data: {} });
        });

        render(<TendersView />);

        await waitFor(() => {
            expect(screen.getByText('Tender 1')).toBeInTheDocument();
            expect(screen.getByText('Tender 2')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText(/ПОШУК ТЕНДЕ� ІВ ЗА НАЗВОЮ АБО ЗАМОВНИКОМ/i);
        fireEvent.change(searchInput, { target: { value: 'Entity A' } });

        expect(screen.getByText('Tender 1')).toBeInTheDocument();
        expect(screen.queryByText('Tender 2')).not.toBeInTheDocument();
    });

    it('повинен фільтрувати за рівнем ризику', async () => {
        (apiClient.get as any).mockImplementation((url: string) => {
            if (url.includes('/tenders')) return Promise.resolve({ data: mockTendersData });
            if (url.includes('/stats')) return Promise.resolve({ data: mockStatsData });
            return Promise.resolve({ data: {} });
        });

        render(<TendersView />);

        await waitFor(() => {
            expect(screen.getByText('Tender 1')).toBeInTheDocument();
            expect(screen.getByText('Tender 2')).toBeInTheDocument();
        });

        // Click high risk button
        const highRiskBtn = screen.getByRole('button', { name: /� ИЗИК 60%\+/i });
        fireEvent.click(highRiskBtn);

        // Tender 1 has 50 risk, should be hidden. Tender 2 has 90, should be visible.
        expect(screen.queryByText('Tender 1')).not.toBeInTheDocument();
        expect(screen.getByText('Tender 2')).toBeInTheDocument();
        
        // Click critical risk button
        const criticalBtn = screen.getByRole('button', { name: /К� ИТИЧНІ 80%\+/i });
        fireEvent.click(criticalBtn);
        expect(screen.queryByText('Tender 1')).not.toBeInTheDocument();
        expect(screen.getByText('Tender 2')).toBeInTheDocument();
    });
});
