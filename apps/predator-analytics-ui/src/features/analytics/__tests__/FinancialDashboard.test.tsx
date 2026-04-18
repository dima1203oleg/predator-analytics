import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FinancialDashboard } from '../FinancialDashboard';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

vi.mock('@/hooks/useBackendStatus', () => ({
    useBackendStatus: () => ({
        isOffline: false,
        activeFailover: false,
        sourceLabel: 'NVIDIA_PRIMARY'
    })
}));

vi.mock('@/services/unified/cers.service', () => ({
    cersService: {
        getFinancialMetrics: vi.fn(() => Promise.resolve([
            { year: 2025, revenue: 1000000000, expenses: 800000000, profit: 200000000, profitMargin: 20 },
            { year: 2024, revenue: 900000000, expenses: 750000000, profit: 150000000, profitMargin: 16.6 }
        ]))
    }
}));

vi.mock('@/components/TacticalCard', () => ({ TacticalCard: ({ children, title }: any) => <div>{title}{children}</div> }));
vi.mock('@/components/AdvancedBackground', () => ({ AdvancedBackground: () => <div data-testid="advanced-bg" /> }));
vi.mock('@/components/CyberGrid', () => ({ CyberGrid: () => <div data-testid="cyber-grid" /> }));
vi.mock('@/components/intelligence/DiagnosticsTerminal', () => ({ DiagnosticsTerminal: () => <div data-testid="diagnostics-terminal" /> }));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('FinancialDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('відображає фінансові показники та KPI', async () => {
        render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter initialEntries={['/finance/12345678']}>
                    <Routes>
                        <Route path="/finance/:ueid" element={<FinancialDashboard />} />
                    </Routes>
                </MemoryRouter>
            </QueryClientProvider>
        );
        
        expect(screen.getByText(/Завантаження фінансових даних/i)).toBeInTheDocument();
        
        await waitFor(() => {
            expect(screen.getByText(/1000.0/i)).toBeInTheDocument(); // 1000M revenue
            expect(screen.getByText(/200.0/i)).toBeInTheDocument();  // 200M profit
            expect(screen.getByText(/20.0/i)).toBeInTheDocument();   // 20% margin
        });
    });

    it('ініціює FINANCIAL_SUCCESS при успішному завантаженні даних', async () => {
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
        render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter initialEntries={['/finance/12345678']}>
                    <Routes>
                        <Route path="/finance/:ueid" element={<FinancialDashboard />} />
                    </Routes>
                </MemoryRouter>
            </QueryClientProvider>
        );
        
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

    it('відображає історію показників у таблиці', async () => {
        render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter initialEntries={['/finance/12345678']}>
                    <Routes>
                        <Route path="/finance/:ueid" element={<FinancialDashboard />} />
                    </Routes>
                </MemoryRouter>
            </QueryClientProvider>
        );
        
        await waitFor(() => {
            expect(screen.getByText('2025')).toBeInTheDocument();
            expect(screen.getByText('2024')).toBeInTheDocument();
        });
    });

    it('відображає стану SOVEREIGN_EMERGENCY в автономному режимі', async () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ 
                isOffline: true, 
                sourceLabel: 'MIRROR_CLUSTER',
                activeFailover: true
            })
        }));

        render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter initialEntries={['/finance/12345678']}>
                    <Routes>
                        <Route path="/finance/:ueid" element={<FinancialDashboard />} />
                    </Routes>
                </MemoryRouter>
            </QueryClientProvider>
        );
        
        await waitFor(() => {
            expect(screen.getByText(/SOVEREIGN_EMERGENCY/i)).toBeInTheDocument();
            expect(screen.getByText(/MIRROR_VAULT/i)).toBeInTheDocument();
        });
    });
});
