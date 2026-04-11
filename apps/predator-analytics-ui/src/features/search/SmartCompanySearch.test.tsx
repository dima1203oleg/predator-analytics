/**
 * 🧪 Tests for SmartCompanySearch Component
 * Покриває пошук, фільтри та експорт
 */

import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import SmartCompanySearch from '../SmartCompanySearch';
import * as cersService from '../../cersService';

// ──────────────────────────────────────────────────────────────
// Setup
// ──────────────────────────────────────────────────────────────

vi.mock('../../cersService');

const mockCompanies = [
  {
    ueid: '12345678',
    name: 'АТ Укрнафта',
    region: 'Київ',
    status: 'active',
    type: 'JSC',
    employees: 5200,
    revenue: 50000000
  },
  {
    ueid: '87654321',
    name: 'ТОВ ПриватБанк',
    region: 'Львів',
    status: 'active',
    type: 'LLC',
    employees: 3000,
    revenue: 30000000
  }
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {retry: false}
    }
  });
  return ({children}: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// ──────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────

describe('SmartCompanySearch Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render search input', () => {
    render(<SmartCompanySearch/>, {wrapper: createWrapper()});

    const input = screen.getByPlaceholderText(/Введіть назву/);
    expect(input).toBeInTheDocument();
  });

  it('should display title and description', () => {
    render(<SmartCompanySearch/>, {wrapper: createWrapper()});

    expect(screen.getByText('🔍 Пошук компаній (CERS)')).toBeInTheDocument();
    expect(screen.getByText(/Введіть назву, УЕІД або ІПН/)).toBeInTheDocument();
  });

  it('should show quick suggestions when search term is empty', () => {
    render(<SmartCompanySearch/>, {wrapper: createWrapper()});

    expect(screen.getByText(/Примери пошуку/)).toBeInTheDocument();
    expect(screen.getByText('АТ Укрнафта')).toBeInTheDocument();
  });

  it('should fetch results when typing min 2 characters', async () => {
    const mockSearch = vi.fn().mockResolvedValue(mockCompanies);
    vi.mocked(cersService.cersService.searchCompanies).mockImplementation(mockSearch);

    const user = userEvent.setup();
    render(<SmartCompanySearch/>, {wrapper: createWrapper()});

    const input = screen.getByPlaceholderText(/Введіть назву/);
    await user.type(input, 'АТ');

    // Перевіримо, що сервіс був викликаний
    expect(mockSearch).toHaveBeenCalledWith('АТ', expect.any(Object));
  });

  it('should display loading state', async () => {
    const mockSearch = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockCompanies), 100))
    );
    vi.mocked(cersService.cersService.searchCompanies).mockImplementation(mockSearch);

    const user = userEvent.setup();
    render(<SmartCompanySearch/>, {wrapper: createWrapper()});

    const input = screen.getByPlaceholderText(/Введіть назву/);
    await user.type(input, 'АТ');

    // Перевіримо, що "Loading" показується
    expect(screen.getByText(/Завантаження результатів/)).toBeInTheDocument();
  });

  it('should display error message on failed search', async () => {
    const mockSearch = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.mocked(cersService.cersService.searchCompanies).mockImplementation(mockSearch);

    const user = userEvent.setup();
    render(<SmartCompanySearch/>, {wrapper: createWrapper()});

    const input = screen.getByPlaceholderText(/Введіть назву/);
    await user.type(input, 'АТ');

    // Перевіримо error message
    expect(await screen.findByText(/Помилка пошуку/)).toBeInTheDocument();
  });

  it('should display no results message when search returns empty', async () => {
    vi.mocked(cersService.cersService.searchCompanies).mockResolvedValue([]);

    const user = userEvent.setup();
    render(<SmartCompanySearch/>, {wrapper: createWrapper()});

    const input = screen.getByPlaceholderText(/Введіть назву/);
    await user.type(input, 'ХХХ');

    // Перевіримо, що показується "not found"
    expect(await screen.findByText(/Компаній не знайдено/)).toBeInTheDocument();
  });

  it('should toggle filters panel', async () => {
    const user = userEvent.setup();
    render(<SmartCompanySearch/>, {wrapper: createWrapper()});

    const filterButton = screen.getByText('⚙️ Фільтри');

    // Спочатку скритто
    expect(screen.queryByText(/Регіон 🗺️/)).not.toBeInTheDocument();

    // Клікнути
    await user.click(filterButton);
    expect(screen.getByText(/Регіон 🗺️/)).toBeInTheDocument();
  });

  it('should apply filters', async () => {
    const mockSearch = vi.fn().mockResolvedValue(mockCompanies);
    vi.mocked(cersService.cersService.searchCompanies).mockImplementation(mockSearch);

    const user = userEvent.setup();
    render(<SmartCompanySearch/>, {wrapper: createWrapper()});

    const input = screen.getByPlaceholderText(/Введіть назву/);
    await user.type(input, 'АТ');

    const filterButton = screen.getByText('⚙️ Фільтри');
    await user.click(filterButton);

    const regionSelect = screen.getByDisplayValue('Усі регіони');
    await user.selectOptions(regionSelect, 'kyiv');

    // Перевіримо, що фільтр застосовано
    expect(mockSearch).toHaveBeenCalledWith('АТ', expect.objectContaining({
      region: 'kyiv'
    }));
  });

  it('should export results to CSV', async () => {
    vi.mocked(cersService.cersService.searchCompanies).mockResolvedValue(mockCompanies);

    const user = userEvent.setup();
    render(<SmartCompanySearch/>, {wrapper: createWrapper()});

    const input = screen.getByPlaceholderText(/Введіть назву/);
    await user.type(input, 'АТ');

    // Чекаємо результатів
    await screen.findByText(/Знайдено/);

    const exportButton = screen.getByText(/📥 Завантажити CSV/);

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');

    await user.click(exportButton);

    // Перевіримо, що click trigger was called
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it('should display results count', async () => {
    vi.mocked(cersService.cersService.searchCompanies).mockResolvedValue(mockCompanies);

    const user = userEvent.setup();
    render(<SmartCompanySearch/>, {wrapper: createWrapper()});

    const input = screen.getByPlaceholderText(/Введіть назву/);
    await user.type(input, 'АТ');

    // Перевіримо результати
    expect(await screen.findByText(/Знайдено.*2.*компаній/)).toBeInTheDocument();
  });

  it('should display company details in table', async () => {
    vi.mocked(cersService.cersService.searchCompanies).mockResolvedValue(mockCompanies);

    const user = userEvent.setup();
    render(<SmartCompanySearch/>, {wrapper: createWrapper()});

    const input = screen.getByPlaceholderText(/Введіть назву/);
    await user.type(input, 'АТ');

    // Перевіримо деталі компанії
    expect(await screen.findByText('АТ Укрнафта')).toBeInTheDocument();
    expect(screen.getByText('12345678')).toBeInTheDocument();
    expect(screen.getByText('Київ')).toBeInTheDocument();
  });

  it('should display status badges with correct colors', async () => {
    vi.mocked(cersService.cersService.searchCompanies).mockResolvedValue(mockCompanies);

    const user = userEvent.setup();
    render(<SmartCompanySearch/>, {wrapper: createWrapper()});

    const input = screen.getByPlaceholderText(/Введіть назву/);
    await user.type(input, 'АТ');

    // Перевіримо status badge
    const statusBadge = await screen.findByText('active');
    expect(statusBadge).toHaveClass('bg-green-900');
  });

  it('should navigate to company detail on row click', async () => {
    vi.mocked(cersService.cersService.searchCompanies).mockResolvedValue(mockCompanies);

    const user = userEvent.setup();
    const mockHref = vi.fn();
    Object.defineProperty(window, 'location', {
      value: {href: mockHref},
      writable: true
    });

    render(<SmartCompanySearch/>, {wrapper: createWrapper()});

    const input = screen.getByPlaceholderText(/Введіть назву/);
    await user.type(input, 'АТ');

    const companyRow = await screen.findByText('АТ Укрнафта');
    await user.click(companyRow);

    // Перевіримо навігацію
    expect(window.location.href).toContain('/company/12345678');
  });

  it('should reset pagination on new search', async () => {
    vi.mocked(cersService.cersService.searchCompanies)
      .mockResolvedValueOnce(mockCompanies)
      .mockResolvedValueOnce([mockCompanies[0]]);

    const user = userEvent.setup();
    render(<SmartCompanySearch/>, {wrapper: createWrapper()});

    const input = screen.getByPlaceholderText(/Введіть назву/);
    await user.type(input, 'АТ');

    // Очистити пошук
    await user.clear(input);
    await user.type(input, 'ПриватБанк');

    // Перевіримо, що другий пошук був зроблено
    expect(vi.mocked(cersService.cersService.searchCompanies)).toHaveBeenCalledTimes(2);
  });
});

