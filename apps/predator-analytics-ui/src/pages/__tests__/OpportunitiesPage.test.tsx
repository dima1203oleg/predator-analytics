import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OpportunitiesPage from '../OpportunitiesPage';
import { marketApi } from '@/features/market/api/market';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock API
vi.mock('@/features/market/api/market', () => ({
    marketApi: {
        getInsights: vi.fn(),
    },
}));

// Mock framer-motion simply
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
        
        // Setup default mocks
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
        
        fireEvent.click(screen.getByText('Recommendations'));
        
        await waitFor(() => {
            expect(screen.queryByText('Zhejiang Electronics Co.')).toBeInTheDocument();
        });
    });

    it('switches to Executive tab', async () => {
        renderWithClient(<OpportunitiesPage />);
        
        fireEvent.click(screen.getByText('Executive'));
        
        await waitFor(() => {
            expect(screen.queryByText('$1.4M')).toBeInTheDocument();
        });
    });

    it('displays loading state while fetching insights', async () => {
        (marketApi.getInsights as any).mockReturnValue(new Promise(() => {})); // Never resolves
        
        renderWithClient(<OpportunitiesPage />);
        
        expect(screen.getByText(/Аналізуємо ринок/i)).toBeInTheDocument();
    });
});
