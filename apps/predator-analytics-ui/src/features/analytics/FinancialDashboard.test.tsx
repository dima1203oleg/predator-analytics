/**
 * 🧪 Tests for FinancialDashboard Component | v56.5-ELITE
 */

import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinancialDashboard } from './FinancialDashboard';
import { cersService } from '@/services/unified/cers.service';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { useBackendStatus } from '@/hooks/useBackendStatus';

// Force absolute mock behavior
vi.mock('@/hooks/useBackendStatus');
vi.mock('@/services/unified/cers.service');

const mockMetrics = [
  { year: 2024, revenue: 60000000, expenses: 45000000, profit: 15000000, profitMargin: 25.0, roa: 12.0, roe: 18.0 },
  { year: 2023, revenue: 50000000, expenses: 40000000, profit: 10000000, profitMargin: 20.0, roa: 10.0, roe: 15.0 },
  { year: 2022, revenue: 40000000, expenses: 35000000, profit: 5000000, profitMargin: 12.5, roa: 8.0, roe: 10.0 }
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } }
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MemoryRouter>
          {children}
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('FinancialDashboard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default mock implementation
    vi.mocked(useBackendStatus).mockReturnValue({
      isOffline: false,
      activeFailover: false,
      sourceLabel: 'NVIDIA_PRIMARY'
    });
  });

  it('should render healthy state and trends', async () => {
    vi.mocked(cersService.getFinancialMetrics).mockResolvedValue(mockMetrics);

    render(<FinancialDashboard ueid="12345678" />, { wrapper: createWrapper() });
    
    // Wait for the data labels to appear
    expect(await screen.findByText(/Дохід/)).toBeInTheDocument();
    
    // Check for specific version badge
    expect(screen.getByText('FINANCE_CORE_v56')).toBeInTheDocument();
    
    // Check trend calculation (20.0%)
    expect(screen.getByText(/20\.0/)).toBeInTheDocument();
  });

  it('should activate EMERGENCY mode when offline', async () => {
    vi.mocked(useBackendStatus).mockReturnValue({
      isOffline: true,
      activeFailover: true,
      sourceLabel: 'MIRROR_NODE'
    });

    vi.mocked(cersService.getFinancialMetrics).mockResolvedValue(mockMetrics);

    render(<FinancialDashboard ueid="12345678" />, { wrapper: createWrapper() });

    // Wait for emergency badge
    expect(await screen.findByText('SOVEREIGN_EMERGENCY')).toBeInTheDocument();
    expect(screen.getByText('FAILOVER_MIRROR')).toBeInTheDocument();
    
    // Check color change (using metrics text as a proxy)
    const metricsLabel = screen.getByText(/Метрики/);
    expect(metricsLabel.closest('span')?.className).toContain('text-amber-500');
  });

  it('should display loading state initially', () => {
    vi.mocked(cersService.getFinancialMetrics).mockImplementation(() => new Promise(() => {}));
    render(<FinancialDashboard ueid="12345678" />, { wrapper: createWrapper() });
    expect(screen.getByText(/Завантаження/i)).toBeInTheDocument();
  });

  it('should display error message and dispatch event on failure', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    vi.mocked(cersService.getFinancialMetrics).mockRejectedValue(new Error('API Error'));

    render(<FinancialDashboard ueid="12345678" />, { wrapper: createWrapper() });

    expect(await screen.findByText(/Помилка завантаження/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalled();
    });
  });

  it('should render data table correctly', async () => {
    vi.mocked(cersService.getFinancialMetrics).mockResolvedValue(mockMetrics);
    render(<FinancialDashboard ueid="12345678" />, { wrapper: createWrapper() });
    
    expect(await screen.findByText(/Історичні дані/)).toBeInTheDocument();
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('2024');
    expect(rows[2]).toHaveTextContent('2023');
  });

  it('should render diagnostics terminal at the bottom', async () => {
    vi.mocked(cersService.getFinancialMetrics).mockResolvedValue(mockMetrics);
    render(<FinancialDashboard ueid="12345678" />, { wrapper: createWrapper() });
    
    await screen.findByText(/Метрики/);
    // The terminal always has buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
