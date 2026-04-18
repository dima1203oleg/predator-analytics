import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FinancialDashboard } from './FinancialDashboard';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// ─── MOCKS ───────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
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

vi.mock('@/services/unified/cers.service', () => ({
    cersService: {
        getFinancialMetrics: vi.fn(() => Promise.resolve([
            { year: 2025, revenue: 100000000, expenses: 80000000, profit: 20000000, profitMargin: 20 },
            { year: 2024, revenue: 80000000, expenses: 70000000, profit: 10000000, profitMargin: 12.5 }
        ]))
    }
}));

vi.mock('@/hooks/useBackendStatus', () => ({
    useBackendStatus: () => ({
        isOffline: false,
        activeFailover: false,
        sourceLabel: 'NVIDIA_PRIMARY'
    })
}));

vi.mock('@/components/AdvancedBackground', () => ({ AdvancedBackground: () => <div data-testid="advanced-bg" /> }));
vi.mock('@/components/CyberGrid', () => ({ CyberGrid: () => <div data-testid="cyber-grid" /> }));
vi.mock('@/components/intelligence/DiagnosticsTerminal', () => ({ DiagnosticsTerminal: () => <div data-testid="diagnostics-terminal" /> }));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={['/financials/12345678']}>
                <Routes>
                    <Route path="/financials/:ueid" element={children} />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>
    );
};

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('FinancialDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('відображає фінансові KPI та історичну таблицю', async () => {
        render(<FinancialDashboard />, { wrapper: createWrapper() });
        
        expect(screen.getByText(/Фінансові Метрики/i)).toBeInTheDocument();
        
        await waitFor(() => {
            expect(screen.getByText('100.0')).toBeInTheDocument(); // 100M revenue
            expect(screen.getByText('20.0')).toBeInTheDocument(); // 20M profit
            expect(screen.getByText('2025')).toBeInTheDocument();
            expect(screen.getByText('2024')).toBeInTheDocument();
        });
    });

    it('ініціює FINANCIAL_SUCCESS після завантаження даних', async () => {
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
        render(<FinancialDashboard />, { wrapper: createWrapper() });
        
        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: expect.objectContaining({
                        code: 'FINANCIAL_SUCCESS'
                    })
                })
            );
        });
    });

    it('відображає MIRROR_VAULT в автономному режимі', async () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ 
                isOffline: true, 
                activeFailover: true,
                sourceLabel: 'MIRROR_CLUSTER'
            })
        }));

        render(<FinancialDashboard />, { wrapper: createWrapper() });
        
        await waitFor(() => {
            expect(screen.getByText(/MIRROR_VAULT/i)).toBeInTheDocument();
            expect(screen.getByText(/FAILOVER_MIRROR/i)).toBeInTheDocument();
        });
    });

    it('ініціює FINANCIAL_ERROR при помилці запиту', async () => {
        const { cersService } = await import('@/services/unified/cers.service');
        (cersService.getFinancialMetrics as any).mockRejectedValueOnce(new Error('API Failure'));
        
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
        render(<FinancialDashboard />, { wrapper: createWrapper() });
        
        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: expect.objectContaining({
                        code: 'FINANCIAL_ERROR'
                    })
                })
            );
            expect(screen.getByText(/Помилка завантаження/i)).toBeInTheDocument();
        });
    });
});
