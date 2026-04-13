/**
 * 🧪 Tests for FinancialDashboard Component
 * Покриває завантаження, відображення KPI та таблиці
 */

import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinancialDashboard } from './FinancialDashboard';
import { cersService } from '@/services/unified/cers.service';

vi.mock('@/services/unified/cers.service');

const mockMetrics = [
  {
    year: 2022,
    revenue: 40000000,
    expenses: 35000000,
    profit: 5000000,
    profitMargin: 12.5,
    roa: 8.0,
    roe: 10.0
  },
  {
    year: 2023,
    revenue: 50000000,
    expenses: 40000000,
    profit: 10000000,
    profitMargin: 20.0,
    roa: 10.0,
    roe: 15.0
  },
  {
    year: 2024,
    revenue: 60000000,
    expenses: 45000000,
    profit: 15000000,
    profitMargin: 25.0,
    roa: 12.0,
    roe: 18.0
  }
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false }
    }
  });
  return ({ children }: any) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('FinancialDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dashboard title', () => {
    vi.mocked(cersService.getFinancialMetrics)
      .mockResolvedValue(mockMetrics);

    render(<FinancialDashboard ueid="12345678" />, { wrapper: createWrapper() });
    expect(screen.getByText('💰 Фінансові Метрики')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    vi.mocked(cersService.getFinancialMetrics)
      .mockImplementation(() => new Promise(() => {}));

    render(<FinancialDashboard ueid="12345678" />, { wrapper: createWrapper() });
    expect(screen.getByText(/Завантаження/)).toBeInTheDocument();
  });

  it('should display error message on failed fetch', async () => {
    vi.mocked(cersService.getFinancialMetrics)
      .mockRejectedValue(new Error('Network error'));

    render(<FinancialDashboard ueid="12345678" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Помилка')).toBeInTheDocument();
    });
  });

  it('should display warning when no metrics', async () => {
    vi.mocked(cersService.getFinancialMetrics)
      .mockResolvedValue([]);

    render(<FinancialDashboard ueid="12345678" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Дані недоступні')).toBeInTheDocument();
    });
  });

  it('should render KPI cards with correct values', async () => {
    vi.mocked(cersService.getFinancialMetrics)
      .mockResolvedValue(mockMetrics);

    render(<FinancialDashboard ueid="12345678" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Дохід')).toBeInTheDocument();
      expect(screen.getByText('Витрати')).toBeInTheDocument();
      expect(screen.getByText('Прибуток')).toBeInTheDocument();
      expect(screen.getByText('Рентабельність')).toBeInTheDocument();
    });
  });

  it('should display historical data table', async () => {
    vi.mocked(cersService.getFinancialMetrics)
      .mockResolvedValue(mockMetrics);

    render(<FinancialDashboard ueid="12345678" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('📋 Історичні дані')).toBeInTheDocument();
      expect(screen.getByText('2024')).toBeInTheDocument();
      expect(screen.getByText('2023')).toBeInTheDocument();
      expect(screen.getByText('2022')).toBeInTheDocument();
    });
  });

  it('should show revenue in millions', async () => {
    vi.mocked(cersService.getFinancialMetrics)
      .mockResolvedValue(mockMetrics);

    render(<FinancialDashboard ueid="12345678" />, { wrapper: createWrapper() });

    await waitFor(() => {
      // 60 млн для 2024
      expect(screen.getByText('60.0')).toBeInTheDocument();
    });
  });

  it('should fetch metrics with correct UEID', () => {
    vi.mocked(cersService.getFinancialMetrics)
      .mockResolvedValue(mockMetrics);

    render(<FinancialDashboard ueid="87654321" />, { wrapper: createWrapper() });

    expect(vi.mocked(cersService.getFinancialMetrics))
      .toHaveBeenCalledWith('87654321');
  });

  it('should cache metrics for 24 hours', () => {
    vi.mocked(cersService.getFinancialMetrics)
      .mockResolvedValue(mockMetrics);

    const { rerender } = render(
      <FinancialDashboard ueid="12345678" />,
      { wrapper: createWrapper() }
    );

    // Перевірити, що при повторному render не перекликається API
    rerender(<FinancialDashboard ueid="12345678" />);

    expect(vi.mocked(cersService.getFinancialMetrics))
      .toHaveBeenCalledTimes(1);
  });

  it('should handle metrics with ROA and ROE', async () => {
    vi.mocked(cersService.getFinancialMetrics)
      .mockResolvedValue(mockMetrics);

    render(<FinancialDashboard ueid="12345678" />, { wrapper: createWrapper() });

    await waitFor(() => {
      const roaElements = screen.getAllByText('%');
      expect(roaElements.length).toBeGreaterThan(3); // profit margin + ROA + ROE
    });
  });

  it('should calculate year-over-year trends correctly', async () => {
    vi.mocked(cersService.getFinancialMetrics)
      .mockResolvedValue(mockMetrics);

    render(<FinancialDashboard ueid="12345678" />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Revenue від 50M (2023) до 60M (2024) = 20% зростання
      expect(screen.getByText('20.0')).toBeInTheDocument();
    });
  });

  it('should sort metrics by year in descending order', async () => {
    vi.mocked(cersService.getFinancialMetrics)
      .mockResolvedValue(mockMetrics);

    render(<FinancialDashboard ueid="12345678" />, { wrapper: createWrapper() });

    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      // Перший рядок - 2024, потім 2023, потім 2022
      expect(rows[1]).toHaveTextContent('2024');
      expect(rows[2]).toHaveTextContent('2023');
      expect(rows[3]).toHaveTextContent('2022');
    });
  });
});

