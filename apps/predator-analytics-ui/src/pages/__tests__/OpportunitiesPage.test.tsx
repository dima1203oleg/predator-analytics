import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OpportunitiesPage from '../OpportunitiesPage';
import { marketApi } from '@/features/market/api/market';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Мок API
vi.mock('@/features/market/api/market', () => ({
    marketApi: {
        getInsights: vi.fn(),
    },
}));

// Спрощений мок framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: (props: any) => <div {...props}>{props.children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>
}));

describe('OpportunitiesPage', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        vi.clearAllMocks();
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                    gcTime: 0,
                },
            },
        });
        
        // Налаштовуємо типові відповіді
        (marketApi.getInsights as any).mockResolvedValue({
            insights: [
                {
                    id: '1',
                    type: 'opportunity',
                    title: 'New Export Opportunity',
                    description: 'Increasing demand for electronics in EU.',
                    priority: 'high',
                    impact: '$200k potential',
                    confidence: 85,
                    created_at: new Date().toISOString(),
                    actions: [{ label: 'View Details' }]
                },
                {
                    id: '2',
                    type: 'risk',
                    title: 'Supply Chain Risk',
                    description: 'Delayed shipments from Asia.',
                    priority: 'critical',
                    impact: 'Production delay',
                    confidence: 95,
                    created_at: new Date().toISOString()
                }
            ]
        });
    });

    const renderWithClient = (ui: React.ReactElement) => {
        return render(
            <QueryClientProvider client={queryClient}>
                {ui}
            </QueryClientProvider>
        );
    };

    it('renders page header and default tab (Insights)', async () => {
        renderWithClient(<OpportunitiesPage />);
        
        expect(screen.getByText(/Можливості/i)).toBeInTheDocument();
        
        await waitFor(() => {
            expect(marketApi.getInsights).toHaveBeenCalled();
        });

        expect(await screen.findByText('New Export Opportunity')).toBeInTheDocument();
        expect(screen.getByText('Supply Chain Risk')).toBeInTheDocument();
    });

    it('switches to Recommendations tab', async () => {
        renderWithClient(<OpportunitiesPage />);
        
        fireEvent.click(screen.getByText('� екомендації'));
        
        await waitFor(() => {
            expect(screen.getByText('New Export Opportunity')).toBeInTheDocument();
            expect(screen.getByText(/Очікуваний вплив:/)).toBeInTheDocument();
        });
    });

    it('switches to Executive tab', async () => {
        renderWithClient(<OpportunitiesPage />);
        
        fireEvent.click(screen.getByText('Виконавчий огляд'));
        
        await waitFor(() => {
            expect(screen.getByText('Короткий виконавчий огляд')).toBeInTheDocument();
            expect(screen.getByText('$200.0K')).toBeInTheDocument();
            expect(screen.getByText('Активні сигнали')).toBeInTheDocument();
        });
    });

    it('displays loading state while fetching insights', async () => {
        (marketApi.getInsights as any).mockReturnValue(new Promise(() => {})); // Не завершується навмисно
        
        renderWithClient(<OpportunitiesPage />);
        
        expect(screen.getByText(/Аналізуємо ринок/i)).toBeInTheDocument();
    });
});
